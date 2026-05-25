package com.expensetracker.service;

import com.expensetracker.dto.request.ChangePasswordRequest;
import com.expensetracker.dto.request.LoginRequest;
import com.expensetracker.dto.response.AuthResponse;
import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.RefreshToken;
import com.expensetracker.repository.AdminUserRepository;
import com.expensetracker.repository.RefreshTokenRepository;
import com.expensetracker.security.CookieUtil;
import com.expensetracker.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authManager;
    private final AdminUserRepository userRepo;
    private final RefreshTokenRepository refreshRepo;
    private final JwtUtil jwtUtil;
    private final CookieUtil cookieUtil;
    private final PasswordEncoder passwordEncoder;
    private final Environment env;

    @Transactional
    public AuthResponse login(LoginRequest req, HttpServletResponse response) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        } catch (AuthenticationException ex) {
            // Collapse all auth failures to one generic message — never leak whether
            // the email exists or whether the password was wrong.
            throw new BadCredentialsException("Invalid credentials");
        }

        AdminUser user = userRepo.findByEmail(req.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        userRepo.updateLastLoginAt(user.getId(), OffsetDateTime.now());

        String access = writeTokenCookies(user, response);
        return isDevProfile()
                ? AuthResponse.from(user, access)
                : AuthResponse.from(user);
    }

    private boolean isDevProfile() {
        return Arrays.stream(env.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("dev") || p.equalsIgnoreCase("local"));
    }

    @Transactional
    public AuthResponse refresh(String refreshTokenValue, HttpServletResponse response) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            throw new BadCredentialsException("Missing refresh token");
        }

        Claims claims;
        try {
            claims = jwtUtil.parseRefresh(refreshTokenValue);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        RefreshToken stored = refreshRepo.findByToken(refreshTokenValue)
                .orElseThrow(() -> new BadCredentialsException("Refresh token not recognised"));

        if (!stored.isValid()) {
            throw new BadCredentialsException("Refresh token expired or revoked");
        }

        Long userId = Long.parseLong(claims.getSubject());
        AdminUser user = userRepo.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User no longer exists"));

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is disabled");
        }

        // Rotate: revoke the old refresh token before issuing a new pair.
        stored.setRevoked(true);
        refreshRepo.save(stored);

        writeTokenCookies(user, response);
        return AuthResponse.from(user);
    }

    @Transactional
    public void logout(Long userId, HttpServletResponse response) {
        refreshRepo.revokeAllByUserId(userId);
        cookieUtil.clearAuthCookies(response);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest req) {
        AdminUser user = userRepo.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepo.save(user);

        // Force re-login everywhere after a password change.
        refreshRepo.revokeAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public AuthResponse getCurrentUser(Long userId) {
        AdminUser user = userRepo.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        return AuthResponse.from(user);
    }

    private String writeTokenCookies(AdminUser user, HttpServletResponse response) {
        String access  = jwtUtil.generateAccessToken(user);
        String refresh = jwtUtil.generateRefreshToken(user);

        OffsetDateTime expiresAt = Instant.ofEpochMilli(
                System.currentTimeMillis() + jwtUtil.getRefreshExpiryMs())
                .atOffset(ZoneOffset.UTC);

        refreshRepo.save(RefreshToken.builder()
                .token(refresh)
                .user(user)
                .expiresAt(expiresAt)
                .isRevoked(false)
                .build());

        cookieUtil.setAccessCookie(response,  access,  jwtUtil.getAccessExpiryMs());
        cookieUtil.setRefreshCookie(response, refresh, jwtUtil.getRefreshExpiryMs());
        return access;
    }
}
