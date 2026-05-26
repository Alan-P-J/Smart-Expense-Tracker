package com.expensetracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Populates {@link TenantContext} from the authenticated user, then clears it
 * after the request completes. Runs immediately after
 * {@link JwtAuthenticationFilter} so the SecurityContext is already filled
 * by the time we look at the principal.
 *
 * For SUPER_ADMIN the context is left null — they are not bound to any one
 * company, and services must branch on the null explicitly.
 */
@Component
@Slf4j
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null
                    && auth.isAuthenticated()
                    && auth.getPrincipal() instanceof UserPrincipal up) {

                // SUPER_ADMIN spans all companies → leave context null.
                // For everyone else, stamp the tenant id even if it's null
                // (defensive: a non-super user with no company is malformed,
                // services will reject downstream).
                if (!up.isSuperAdmin()) {
                    TenantContext.setCompanyId(up.getCompanyId());
                }
            }
            chain.doFilter(request, response);
        } finally {
            // CRITICAL: must run on every request, success or failure. Servlet
            // containers reuse threads, so a leaked value would leak data
            // across users.
            TenantContext.clear();
        }
    }
}
