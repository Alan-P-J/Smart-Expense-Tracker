package com.expensetracker.dto.response;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
        BigDecimal totalAmount,
        long totalCount,
        String topCategoryName,
        BigDecimal topCategoryAmount,
        long alertCount
) {}
