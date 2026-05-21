package com.expensetracker.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * httpOnly cookie helpers for access + refresh tokens.
 *
 * SameSite=Strict because the SPA shares the same site as the API (Vite proxies
 * /api to :8080 in dev, and prod serves them on one origin). Tokens never touch
 * JavaScript — both cookies are HttpOnly so XSS cannot read them.
 */
@Component
public class CookieUtil {

    public static final String ACCESS_COOKIE  = "access_token";
    public static final String REFRESH_COOKIE = "refresh_token";

    private static final String SET_COOKIE   = "Set-Cookie";
    private static final String REFRESH_PATH = "/api/auth/refresh";

    public void setAccessCookie(HttpServletResponse response, String token, long maxAgeMs) {
        response.addHeader(SET_COOKIE, build(ACCESS_COOKIE, token, "/", Duration.ofMillis(maxAgeMs)));
    }

    public void setRefreshCookie(HttpServletResponse response, String token, long maxAgeMs) {
        response.addHeader(SET_COOKIE, build(REFRESH_COOKIE, token, REFRESH_PATH, Duration.ofMillis(maxAgeMs)));
    }

    public void clearAuthCookies(HttpServletResponse response) {
        response.addHeader(SET_COOKIE, build(ACCESS_COOKIE,  "", "/",          Duration.ZERO));
        response.addHeader(SET_COOKIE, build(REFRESH_COOKIE, "", REFRESH_PATH, Duration.ZERO));
    }

    public String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    private String build(String name, String value, String path, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false)              // TODO: flip to true in production profile (HTTPS)
                .sameSite("Strict")
                .path(path)
                .maxAge(maxAge)
                .build()
                .toString();
    }
}
