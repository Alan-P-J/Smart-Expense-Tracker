package com.expensetracker.service;

import com.expensetracker.dto.request.CreateUserRequest;
import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.AdminUser.Role;
import com.expensetracker.entity.AuditLog.Action;
import com.expensetracker.exception.ConflictException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.AdminUserRepository;
import com.expensetracker.repository.RefreshTokenRepository;
import com.expensetracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private static final String ENTITY_TYPE = "AdminUser";

    private final AdminUserRepository userRepo;
    private final RefreshTokenRepository refreshRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLog;

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepo.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest req) {
        if (userRepo.existsByEmail(req.email())) {
            throw new ConflictException("Email already in use: " + req.email());
        }

        Role role = parseRole(req.role(), Role.VIEWER);

        AdminUser user = AdminUser.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.fullName())
                .role(role)
                .isActive(true)
                .build();

        AdminUser saved = userRepo.save(user);

        AdminUser actor = SecurityUtils.getCurrentUser();
        auditLog.log(actor, Action.CREATE, ENTITY_TYPE, saved.getId(),
                null,
                userSnapshot(saved));

        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse changeRole(Long userId, String newRoleName) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId.equals(userId)) {
            throw new IllegalArgumentException("You cannot change your own role");
        }

        AdminUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AdminUser", userId));

        Role newRole = parseRole(newRoleName, null);
        if (newRole == null) {
            throw new IllegalArgumentException("Role is required");
        }

        Role oldRole = user.getRole();
        if (oldRole == newRole) {
            // No-op; still return current state without writing an audit entry.
            return UserResponse.from(user);
        }

        user.setRole(newRole);
        AdminUser saved = userRepo.save(user);

        AdminUser actor = SecurityUtils.getCurrentUser();
        auditLog.log(actor, Action.UPDATE, ENTITY_TYPE, saved.getId(),
                Map.of("role", oldRole.name()),
                Map.of("role", newRole.name()));

        return UserResponse.from(saved);
    }

    @Transactional
    public void deactivateUser(Long userId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId.equals(userId)) {
            throw new IllegalArgumentException("You cannot deactivate yourself");
        }

        AdminUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AdminUser", userId));

        if (!user.isActive()) {
            // Already inactive — idempotent, skip audit + token revocation.
            return;
        }

        user.setActive(false);
        userRepo.save(user);

        // Kill any active sessions for this user.
        refreshRepo.revokeAllByUserId(userId);

        AdminUser actor = SecurityUtils.getCurrentUser();
        auditLog.log(actor, Action.UPDATE, ENTITY_TYPE, userId,
                Map.of("isActive", true),
                Map.of("isActive", false));
    }

    private Role parseRole(String raw, Role fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        try {
            return Role.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown role: " + raw + " (must be ADMIN or VIEWER)");
        }
    }

    /** Safe snapshot for the audit log — never includes the password hash. */
    private Map<String, Object> userSnapshot(AdminUser u) {
        return Map.of(
                "id",       u.getId(),
                "email",    u.getEmail(),
                "fullName", u.getFullName(),
                "role",     u.getRole().name(),
                "isActive", u.isActive()
        );
    }
}
