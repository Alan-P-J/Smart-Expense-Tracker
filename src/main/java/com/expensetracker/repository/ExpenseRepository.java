package com.expensetracker.repository;

import com.expensetracker.entity.Expense;
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
}
