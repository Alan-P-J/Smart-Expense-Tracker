package com.expensetracker.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record BudgetRequest(
        @NotNull
        Long categoryId,

        @NotNull @Positive @Digits(integer = 10, fraction = 2)
        BigDecimal monthlyLimit
) {}
