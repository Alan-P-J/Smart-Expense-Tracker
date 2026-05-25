package com.expensetracker.dto.response;

import com.expensetracker.entity.AdminUser;

public record AuthResponse(
        Long id,
        String email,
        String fullName,
        String role,
        // Populated only when the `dev` profile is active, for pasting into Swagger UI's "Authorize".
        // Never present in production responses; HttpOnly cookie remains the only auth path there.
        String accessToken
) {
    public static AuthResponse from(AdminUser u) {
        return new AuthResponse(u.getId(), u.getEmail(), u.getFullName(), u.getRole().name(), null);
    }

    public static AuthResponse from(AdminUser u, String accessToken) {
        return new AuthResponse(u.getId(), u.getEmail(), u.getFullName(), u.getRole().name(), accessToken);
    }
}
