package com.expensetracker.security;

import com.expensetracker.entity.AdminUser;
import com.expensetracker.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Static accessors for the currently authenticated user.
 *
 * Throws {@link UnauthorizedException} when called outside an authenticated
 * request — services should never reach this code path because protected
 * endpoints are gated by @PreAuthorize, but the explicit failure beats a
 * downstream NullPointerException if something slips through.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    public static AdminUser getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal up)) {
            throw new UnauthorizedException("No authenticated user");
        }
        return up.getUser();
    }

    public static Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public static boolean hasRole(AdminUser.Role role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;

        String target = "ROLE_" + role.name();
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if (target.equals(ga.getAuthority())) return true;
        }
        return false;
    }
}
