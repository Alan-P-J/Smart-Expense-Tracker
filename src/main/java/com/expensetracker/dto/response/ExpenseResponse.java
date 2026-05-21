package com.expensetracker.dto.response;

import com.expensetracker.entity.Expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ExpenseResponse(
        Long id,
        String title,
        BigDecimal amount,
        LocalDate expenseDate,
        Long categoryId,
        String categoryName,
        String categoryColourHex,
        String description,
        Long createdById,
        String createdByName,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ExpenseResponse from(Expense e) {
        return new ExpenseResponse(
                e.getId(),
                e.getTitle(),
                e.getAmount(),
                e.getExpenseDate(),
                e.getCategory().getId(),
                e.getCategory().getName(),
                e.getCategory().getColourHex(),
                e.getDescription(),
                e.getCreatedBy().getId(),
                e.getCreatedBy().getFullName(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
