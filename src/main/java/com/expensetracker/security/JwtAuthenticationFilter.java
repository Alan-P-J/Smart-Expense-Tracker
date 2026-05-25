package com.expensetracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Reads the access JWT from the {@code access_token} HttpOnly cookie on every
 * request and populates the SecurityContext if valid. Failures are silent —
 * downstream {@code AuthenticationEntryPoint} returns 401 when an endpoint
 * actually requires auth.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CookieUtil cookieUtil;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        return "/api/auth/login".equals(path) || "/api/auth/refresh".equals(path);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = cookieUtil.readCookie(request, CookieUtil.ACCESS_COOKIE);
            if (token == null || token.isBlank()) {
                token = readBearerToken(request);
            }
            if (token != null && !token.isBlank()) {
                authenticate(token, request);
            }
        }
        chain.doFilter(request, response);
    }

    private String readBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        return null;
    }

    private void authenticate(String token, HttpServletRequest request) {
        try {
            Claims claims = jwtUtil.parseAccess(token);
            Long userId = Long.parseLong(claims.getSubject());

            UserDetails principal = userDetailsService.loadUserById(userId);

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (JwtException | UsernameNotFoundException | IllegalArgumentException ex) {
            // Expired, malformed, or unknown user — leave context unauthenticated.
            log.debug("Rejected access token: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }
    }
}
