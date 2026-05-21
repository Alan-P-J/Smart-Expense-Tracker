package com.expensetracker.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotBlank @Size(max = 255)
        String title,

        @NotNull @Positive @Digits(integer = 10, fraction = 2)
        BigDecimal amount,

        @NotNull
        LocalDate expenseDate,

        @NotNull
        Long categoryId,

        String description
) {}
