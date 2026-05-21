package com.expensetracker.dto.response;

import java.math.BigDecimal;

public record CategorySpendResponse(
        Long categoryId,
        String categoryName,
        String categoryColourHex,
        BigDecimal total
) {}
