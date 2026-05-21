package com.expensetracker.dto.response;

import com.expensetracker.entity.AdminUser;

import java.time.OffsetDateTime;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String role,
        boolean isActive,
        OffsetDateTime createdAt
) {
    public static UserResponse from(AdminUser u) {
        return new UserResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getRole().name(),
                u.isActive(),
                u.getCreatedAt()
        );
    }
}
