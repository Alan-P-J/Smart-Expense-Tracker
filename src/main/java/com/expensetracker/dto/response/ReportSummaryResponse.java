package com.expensetracker.dto.response;

import java.math.BigDecimal;

/**
 * Aggregated metrics for the Reports page header strip.
 *
 * Field meanings:
 *   - totalAmount     : SUM of expense.amount in the window
 *   - totalCount      : COUNT of expenses in the window
 *   - avgPerDay       : totalAmount / days-in-window (caller picks the window)
 *   - avgPerExpense   : totalAmount / totalCount (zero when no expenses)
 *   - largestExpense  : single highest-amount expense, or null when none
 *   - mostActiveDay   : weekday name (e.g. "Monday") with the most expenses
 *                       logged in this window, or null when none
 */
public record ReportSummaryResponse(
        BigDecimal totalAmount,
        long totalCount,
        BigDecimal avgPerDay,
        BigDecimal avgPerExpense,
        RecentExpenseResponse largestExpense,
        String mostActiveDay
) {}
