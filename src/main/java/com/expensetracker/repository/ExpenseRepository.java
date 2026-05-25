package com.expensetracker.repository;

import com.expensetracker.entity.Expense;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// JpaSpecificationExecutor enables the dynamic filter (category + date + search)
// built with ExpenseSpecification on Day 4
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>,
        JpaSpecificationExecutor<Expense> {

    // Dashboard: last 5 expenses
    List<Expense> findTop5ByOrderByExpenseDateDescCreatedAtDesc();

    // Dashboard summary: total spend in a date range
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.expenseDate >= :start AND e.expenseDate <= :end")
    BigDecimal sumAmountBetween(LocalDate start, LocalDate end);

    // Dashboard summary: count in a date range
    @Query("SELECT COUNT(e) FROM Expense e " +
           "WHERE e.expenseDate >= :start AND e.expenseDate <= :end")
    long countBetween(LocalDate start, LocalDate end);

    // Dashboard: monthly totals for trend chart (last 6 months)
    @Query("SELECT FUNCTION('to_char', e.expenseDate, 'YYYY-MM'), " +
           "COALESCE(SUM(e.amount), 0) " +
           "FROM Expense e WHERE e.expenseDate >= :since " +
           "GROUP BY FUNCTION('to_char', e.expenseDate, 'YYYY-MM') " +
           "ORDER BY 1 ASC")
    List<Object[]> monthlyTotals(LocalDate since);

    // Dashboard: monthly totals constrained to a date range (powers the trend
    // chart's period filter — Last 3/6/12 Months, YTD).
    @Query("SELECT FUNCTION('to_char', e.expenseDate, 'YYYY-MM'), " +
           "COALESCE(SUM(e.amount), 0) " +
           "FROM Expense e WHERE e.expenseDate >= :start AND e.expenseDate <= :end " +
           "GROUP BY FUNCTION('to_char', e.expenseDate, 'YYYY-MM') " +
           "ORDER BY 1 ASC")
    List<Object[]> monthlyTotalsBetween(LocalDate start, LocalDate end);

    // Dashboard: spending by category for current month
    @Query("SELECT e.category.id, e.category.name, e.category.colourHex, " +
           "COALESCE(SUM(e.amount), 0) " +
           "FROM Expense e WHERE e.expenseDate >= :start AND e.expenseDate <= :end " +
           "GROUP BY e.category.id, e.category.name, e.category.colourHex " +
           "ORDER BY 4 DESC")
    List<Object[]> sumByCategoryBetween(LocalDate start, LocalDate end);

    // Budget progress: actual spend per category this month
    @Query("SELECT e.category.id, COALESCE(SUM(e.amount), 0) " +
           "FROM Expense e WHERE e.expenseDate >= :start AND e.expenseDate <= :end " +
           "GROUP BY e.category.id")
    List<Object[]> spentPerCategoryBetween(LocalDate start, LocalDate end);

    // Reports: day-of-week spend + count, Mon→Sun. Native query — Postgres
    // ISODOW returns 1=Monday..7=Sunday which is exactly the order we want.
    @Query(value = "SELECT EXTRACT(ISODOW FROM e.expense_date)::int AS dow, " +
                   "COALESCE(SUM(e.amount), 0) AS total, " +
                   "COUNT(*) AS count " +
                   "FROM expenses e " +
                   "WHERE e.expense_date BETWEEN :start AND :end " +
                   "GROUP BY EXTRACT(ISODOW FROM e.expense_date) " +
                   "ORDER BY 1",
           nativeQuery = true)
    List<Object[]> dayOfWeekStatsBetween(LocalDate start, LocalDate end);

    // Reports: top expenses by amount within a window. Uses Pageable so the
    // caller controls the limit without hard-coding a numeric "topN" method.
    @Query("SELECT e FROM Expense e " +
           "WHERE e.expenseDate >= :start AND e.expenseDate <= :end " +
           "ORDER BY e.amount DESC, e.expenseDate DESC, e.id DESC")
    List<Expense> findTopByAmountBetween(LocalDate start, LocalDate end, Pageable page);
}
