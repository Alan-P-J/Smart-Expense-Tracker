package com.expensetracker.dto.response;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String categoryColourHex,
        BigDecimal monthlyLimit,
        BigDecimal spent,
        BigDecimal remaining,
        double percentageUsed,
        boolean isOverBudget,
        boolean isNearLimit
) {}
