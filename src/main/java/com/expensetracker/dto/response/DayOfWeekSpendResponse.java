package com.expensetracker.dto.response;

import java.math.BigDecimal;

/**
 * Single day-of-week aggregation row.
 *   - day      : ISO short name "Mon"…"Sun"
 *   - dayIndex : 1=Mon … 7=Sun (matches Postgres ISODOW for stable ordering)
 *   - amount   : SUM of expense.amount on that weekday in the window
 *   - count    : number of expenses on that weekday in the window
 */
public record DayOfWeekSpendResponse(
        String day,
        int dayIndex,
        BigDecimal amount,
        long count
) {}
