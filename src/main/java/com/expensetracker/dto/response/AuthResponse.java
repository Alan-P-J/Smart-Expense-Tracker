package com.expensetracker.dto.response;

import com.expensetracker.entity.AdminUser;

public record AuthResponse(
        Long id,
        String email,
        String fullName,
        String role
) {
    public static AuthResponse from(AdminUser u) {
        return new AuthResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getRole().name()
        );
    }
}
