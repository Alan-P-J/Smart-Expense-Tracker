package com.expensetracker.dto.response;

import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.Company;

import java.time.OffsetDateTime;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String role,
        boolean isActive,
        boolean isSuperAdmin,
        Long companyId,
        String companyName,
        OffsetDateTime createdAt
) {
    public static UserResponse from(AdminUser u) {
        Company c = u.getCompany();
        return new UserResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getRole().name(),
                u.isActive(),
                u.isSuperAdmin(),
                c == null ? null : c.getId(),
                c == null ? null : c.getName(),
                u.getCreatedAt()
        );
    }
}
