package com.expensetracker.dto.response;

import java.math.BigDecimal;

public record CompanyStatsResponse(
        Long companyId,
        String name,
        String slug,
        boolean isActive,
        long userCount,
        long expenseCount,
        // Total amount spent this month (1st of month → today).
        BigDecimal totalAmountThisMonth
) {}
