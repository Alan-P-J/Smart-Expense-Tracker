package com.expensetracker.dto.response;

import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.Company;

public record AuthResponse(
        Long id,
        String email,
        String fullName,
        String role,
        Long companyId,
        String companyName,
        boolean isSuperAdmin,
        // Populated only when the `dev` profile is active, for pasting into Swagger UI's "Authorize".
        // Never present in production responses; HttpOnly cookie remains the only auth path there.
        String accessToken
) {
    public static AuthResponse from(AdminUser u) {
        return build(u, null);
    }

    public static AuthResponse from(AdminUser u, String accessToken) {
        return build(u, accessToken);
    }

    private static AuthResponse build(AdminUser u, String accessToken) {
        Company c = u.getCompany();
        return new AuthResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getRole().name(),
                c == null ? null : c.getId(),
                c == null ? null : c.getName(),
                u.isSuperAdmin(),
                accessToken);
    }
}
