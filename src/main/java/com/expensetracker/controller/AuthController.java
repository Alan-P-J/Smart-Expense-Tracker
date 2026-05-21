package com.expensetracker.controller;

import com.expensetracker.dto.request.ChangePasswordRequest;
import com.expensetracker.dto.request.LoginRequest;
import com.expensetracker.dto.response.AuthResponse;
import com.expensetracker.security.CookieUtil;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication & session management")
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @PostMapping("/login")
    @Operation(summary = "Authenticate with email + password. Sets HttpOnly access + refresh cookies.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletResponse response) {
        return ResponseEntity.ok(authService.login(request, response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange refresh cookie for a new access + refresh pair (token rotation).")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request,
                                                HttpServletResponse response) {
        String refresh = cookieUtil.readCookie(request, CookieUtil.REFRESH_COOKIE);
        return ResponseEntity.ok(authService.refresh(refresh, response));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Revoke all refresh tokens for the current user and clear auth cookies.")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserPrincipal principal,
                                       HttpServletResponse response) {
        authService.logout(principal.getId(), response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Return the currently authenticated user.")
    public ResponseEntity<AuthResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.getCurrentUser(principal.getId()));
    }

    @PutMapping("/password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change the current user's password. Revokes all refresh tokens.")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal UserPrincipal principal,
                                               @Valid @RequestBody ChangePasswordRequest request,
                                               HttpServletResponse response) {
        authService.changePassword(principal.getId(), request);
        cookieUtil.clearAuthCookies(response);
        return ResponseEntity.noContent().build();
    }
}
