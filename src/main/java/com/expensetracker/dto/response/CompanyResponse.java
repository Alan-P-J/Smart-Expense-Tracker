package com.expensetracker.dto.response;

import com.expensetracker.entity.Company;

import java.time.OffsetDateTime;

public record CompanyResponse(
        Long id,
        String name,
        String slug,
        String logoUrl,
        boolean isActive,
        long userCount,
        OffsetDateTime createdAt
) {
    public static CompanyResponse from(Company c, long userCount) {
        return new CompanyResponse(
                c.getId(),
                c.getName(),
                c.getSlug(),
                c.getLogoUrl(),
                c.isActive(),
                userCount,
                c.getCreatedAt()
        );
    }
}
