package com.expensetracker.dto.response;

import com.expensetracker.entity.Expense;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecentExpenseResponse(
        Long id,
        String title,
        BigDecimal amount,
        LocalDate expenseDate,
        String categoryName,
        String categoryColourHex
) {
    public static RecentExpenseResponse from(Expense e) {
        return new RecentExpenseResponse(
                e.getId(),
                e.getTitle(),
                e.getAmount(),
                e.getExpenseDate(),
                e.getCategory().getName(),
                e.getCategory().getColourHex()
        );
    }
}
