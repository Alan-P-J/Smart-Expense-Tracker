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
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AuthService}.
 *
 * Scope: behaviour at the service-method level — what gets persisted, what
 * cookies are written, what exceptions surface. Real Spring Security / JWT /
 * database wiring is exercised in {@code AuthIntegrationTest}.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final long ACCESS_EXPIRY_MS  = 900_000L;
    private static final long REFRESH_EXPIRY_MS = 604_800_000L;

    @Mock private AuthenticationManager     authManager;
    @Mock private AdminUserRepository       userRepo;
    @Mock private RefreshTokenRepository    refreshRepo;
    @Mock private JwtUtil                   jwtUtil;
    @Mock private CookieUtil                cookieUtil;
    @Mock private PasswordEncoder           passwordEncoder;
    @Mock private HttpServletResponse       response;

    @InjectMocks private AuthService authService;

    private AdminUser admin;

    @BeforeEach
    void buildFixtureUser() {
        admin = AdminUser.builder()
                .id(42L)
                .email("admin@example.com")
                .fullName("Test Admin")
                .passwordHash("$2a$12$hashedPasswordValue")
                .role(AdminUser.Role.ADMIN)
                .isActive(true)
                .build();
    }

    // ── login ────────────────────────────────────────────────────────

    @Test
    @DisplayName("login: writes both cookies, updates lastLoginAt, returns AuthResponse")
    void login_success() {
        when(userRepo.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(jwtUtil.generateAccessToken(admin)).thenReturn("access-jwt");
        when(jwtUtil.generateRefreshToken(admin)).thenReturn("refresh-jwt");
        when(jwtUtil.getAccessExpiryMs()).thenReturn(ACCESS_EXPIRY_MS);
        when(jwtUtil.getRefreshExpiryMs()).thenReturn(REFRESH_EXPIRY_MS);

        AuthResponse result = authService.login(
                new LoginRequest("admin@example.com", "Admin@1234"), response);

        assertThat(result.email()).isEqualTo("admin@example.com");
        assertThat(result.role()).isEqualTo("ADMIN");

        verify(authManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepo).updateLastLoginAt(eq(42L), any(OffsetDateTime.class));
        verify(refreshRepo).save(any(RefreshToken.class));
        verify(cookieUtil).setAccessCookie(response,  "access-jwt",  ACCESS_EXPIRY_MS);
        verify(cookieUtil).setRefreshCookie(response, "refresh-jwt", REFRESH_EXPIRY_MS);
    }

    @Test
    @DisplayName("login: AuthenticationManager rejects → BadCredentialsException, no cookies set")
    void login_invalidPassword() {
        when(authManager.authenticate(any())).thenThrow(new BadCredentialsException("bad creds"));
        LoginRequest req = new LoginRequest("admin@example.com", "wrong");

        assertThatThrownBy(() -> authService.login(req, response))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid credentials");

        verifyNoInteractions(cookieUtil);
        verify(refreshRepo, never()).save(any());
    }

    @Test
    @DisplayName("login: deactivated user → AuthenticationManager rejects → BadCredentialsException")
    void login_inactiveUser() {
        // AuthService delegates the active-flag check to AuthenticationManager
        // (via DaoAuthenticationProvider + UserDetailsService.isAccountNonLocked).
        // From AuthService's perspective the failure surface is identical to
        // a wrong password — both come back as AuthenticationException.
        when(authManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Account is disabled"));
        LoginRequest req = new LoginRequest("admin@example.com", "Admin@1234");

        assertThatThrownBy(() -> authService.login(req, response))
                .isInstanceOf(BadCredentialsException.class);

        verifyNoInteractions(cookieUtil);
    }

    // ── logout ───────────────────────────────────────────────────────

    @Test
    @DisplayName("logout: revokes refresh tokens for the user and clears auth cookies")
    void logout_revokesAllTokens() {
        authService.logout(42L, response);

        verify(refreshRepo).revokeAllByUserId(42L);
        verify(cookieUtil).clearAuthCookies(response);
    }

    // ── changePassword ───────────────────────────────────────────────

    @Test
    @DisplayName("changePassword: writes new hash and revokes all refresh tokens")
    void changePassword_success() {
        when(userRepo.findById(42L)).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("Admin@1234", admin.getPasswordHash())).thenReturn(true);
        when(passwordEncoder.encode("NewPass@1234")).thenReturn("$2a$12$newHash");

        authService.changePassword(42L,
                new ChangePasswordRequest("Admin@1234", "NewPass@1234"));

        assertThat(admin.getPasswordHash()).isEqualTo("$2a$12$newHash");
        verify(userRepo).save(admin);
        verify(refreshRepo).revokeAllByUserId(42L);
    }

    @Test
    @DisplayName("changePassword: wrong current password → BadCredentialsException, no hash change")
    void changePassword_wrongCurrentPassword() {
        when(userRepo.findById(42L)).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        String originalHash = admin.getPasswordHash();
        ChangePasswordRequest req = new ChangePasswordRequest("wrong", "NewPass@1234");

        assertThatThrownBy(() -> authService.changePassword(42L, req))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Current password is incorrect");

        assertThat(admin.getPasswordHash()).isEqualTo(originalHash);
        verify(userRepo, never()).save(any());
        verify(refreshRepo, never()).revokeAllByUserId(anyLong());
    }

    @Test
    @DisplayName("changePassword: user not found → BadCredentialsException")
    void changePassword_userNotFound() {
        when(userRepo.findById(999L)).thenReturn(Optional.empty());
        ChangePasswordRequest req = new ChangePasswordRequest("any", "NewPass@1234");

        assertThatThrownBy(() -> authService.changePassword(999L, req))
                .isInstanceOf(BadCredentialsException.class);

        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(userRepo, never()).save(any());
    }

}
