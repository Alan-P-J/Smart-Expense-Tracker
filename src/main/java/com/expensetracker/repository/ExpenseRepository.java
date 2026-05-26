package com.expensetracker.repository;

import com.expensetracker.entity.Expense;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * All queries accept a nullable {@code companyId}:
 *   • non-null → scope results to that tenant
 *   • null     → return cross-tenant results (SUPER_ADMIN view)
 *
 * The {@code (:companyId IS NULL OR e.company.id = :companyId)} pattern keeps
 * each method usable for both tenant-scoped and super-admin callers without
 * duplicating every query.
 */
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>,
        JpaSpecificationExecutor<Expense> {

    // Dashboard: last 5 expenses. Replaces the old findTop5… derived query
    // because Spring Data can't express "null companyId means no filter".
    @Query("SELECT e FROM Expense e " +
           "WHERE (:companyId IS NULL OR e.company.id = :companyId) " +
           "ORDER BY e.expenseDate DESC, e.createdAt DESC")
    List<Expense> findRecent(@Nullable Long companyId, Pageable page);

    // Dashboard summary: total spend in a date range
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.expenseDate >= :start AND e.expenseDate <= :end " +
           "AND (:companyId IS NULL OR e.company.id = :companyId)")
    BigDecimal sumAmountBetween(LocalDate start, LocalDate end, @Nullable Long companyId);

    // Dashboard summary: count in a date range
    @Query("SELECT COUNT(e) FROM Expense e " +
           "WHERE e.expenseDate >= :start AND e.expenseDate <= :end " +
           "AND (:companyId IS NULL OR e.company.id = :companyId)")
    long countBetween(LocalDate start, LocalDate end, @Nullable Long companyId);

    // Dashboard: monthly totals constrained to a date range (powers the trend
    // chart's period filter — Last 3/6/12 Months, YTD).
    @Query("SELECT FUNCTION('to_char', e.expenseDate, 'YYYY-MM'), " +
           "COALESCE(SUM(e.amount), 0) " +
           "FROM Expense e WHERE e.expenseDate >= :start AND e.expenseDate <= :end " +
           "AND (:companyId IS NULL OR e.company.id = :companyId) " +
           "GROUP BY FUNCTION('to_char', e.expenseDate, 'YYYY-MM') " +
           "ORDER BY 1 ASC")
    List<Object[]> monthlyTotalsBetween(LocalDate start, LocalDate end, @Nullable Long companyId);

    // Dashboard: spending by category for current month
    @Query("SELECT e.category.id, e.category.name, e.category.colourHex, " +
           "COALESCE(SUM(e.amount), 0) " +
           "FROM Expense e WHERE e.expenseDate >= :start AND e.expenseDate <= :end " +
           "AND (:companyId IS NULL OR e.company.id = :companyId) " +
           "GROUP BY e.category.id, e.category.name, e.category.colourHex " +
           "ORDER BY 4 DESC")
    List<Object[]> sumByCategoryBetween(LocalDate start, LocalDate end, @Nullable Long companyId);

    // Budget progress: actual spend per category this month
    @Query("SELECT e.category.id, COALESCE(SUM(e.amount), 0) " +
           "FROM Expense e WHERE e.expenseDate >= :start AND e.expenseDate <= :end " +
           "AND (:companyId IS NULL OR e.company.id = :companyId) " +
           "GROUP BY e.category.id")
    List<Object[]> spentPerCategoryBetween(LocalDate start, LocalDate end, @Nullable Long companyId);

    // Reports: day-of-week spend + count, Mon→Sun. Native query — Postgres
    // ISODOW returns 1=Monday..7=Sunday which is exactly the order we want.
    //
    // Split into two methods because Hibernate's native-query parameter
    // binding for nullable Long values is unreliable on PG (the driver
    // can't always infer the SQL type for a NULL bind, and any
    // "(:companyId IS NULL OR …)" or COALESCE workaround can still throw
    // "could not determine data type of parameter $N". Two queries with
    // explicit shape — branched in the service — sidestep the issue.

    @Query(value = "SELECT CAST(EXTRACT(ISODOW FROM e.expense_date) AS integer) AS dow, " +
                   "COALESCE(SUM(e.amount), 0) AS total, " +
                   "COUNT(*) AS count " +
                   "FROM expenses e " +
                   "WHERE e.expense_date BETWEEN :start AND :end " +
                   "AND e.company_id = :companyId " +
                   "GROUP BY EXTRACT(ISODOW FROM e.expense_date) " +
                   "ORDER BY 1",
           nativeQuery = true)
    List<Object[]> dayOfWeekStatsForCompany(LocalDate start, LocalDate end, Long companyId);

    /** SUPER_ADMIN view: aggregates across every tenant. */
    @Query(value = "SELECT CAST(EXTRACT(ISODOW FROM e.expense_date) AS integer) AS dow, " +
                   "COALESCE(SUM(e.amount), 0) AS total, " +
                   "COUNT(*) AS count " +
                   "FROM expenses e " +
                   "WHERE e.expense_date BETWEEN :start AND :end " +
                   "GROUP BY EXTRACT(ISODOW FROM e.expense_date) " +
                   "ORDER BY 1",
           nativeQuery = true)
    List<Object[]> dayOfWeekStatsAll(LocalDate start, LocalDate end);

    // Reports: top expenses by amount within a window. Uses Pageable so the
    // caller controls the limit without hard-coding a numeric "topN" method.
    @Query("SELECT e FROM Expense e " +
           "WHERE e.expenseDate >= :start AND e.expenseDate <= :end " +
           "AND (:companyId IS NULL OR e.company.id = :companyId) " +
           "ORDER BY e.amount DESC, e.expenseDate DESC, e.id DESC")
    List<Expense> findTopByAmountBetween(LocalDate start, LocalDate end,
                                         @Nullable Long companyId, Pageable page);
}
