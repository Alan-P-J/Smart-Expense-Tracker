package com.expensetracker.service;

import com.expensetracker.dto.request.CreateUserRequest;
import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.AdminUser.Role;
import com.expensetracker.entity.AuditLog.Action;
import com.expensetracker.entity.Company;
import com.expensetracker.exception.ConflictException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.AdminUserRepository;
import com.expensetracker.repository.CompanyRepository;
import com.expensetracker.repository.RefreshTokenRepository;
import com.expensetracker.security.SecurityUtils;
import com.expensetracker.security.TenantSecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Per-tenant user management. Company admins create users in their own
 * company; super admins use {@link CompanyService#addUser(Long, com.expensetracker.dto.request.CreateCompanyUserRequest)}
 * to seed users into other companies, and {@link com.expensetracker.controller.CompanyController}
 * for cross-tenant listing.
 */
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private static final String ENTITY_TYPE = "AdminUser";

    private final AdminUserRepository userRepo;
    private final CompanyRepository companyRepo;
    private final RefreshTokenRepository refreshRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLog;

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        Long companyId = TenantSecurityService.currentCompanyIdOrNull();
        List<AdminUser> users = companyId == null
                ? userRepo.findAll()
                : userRepo.findAllByCompanyId(companyId);
        return users.stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest req) {
        // Per-tenant endpoint: company admin must be in a company. Super admin
        // should use the dedicated /api/companies/{id}/users endpoint to
        // create users in a specific company instead.
        Long companyId = TenantSecurityService.requireCompanyId();
        Company company = companyRepo.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        if (userRepo.existsByEmail(req.email())) {
            throw new ConflictException("Email already in use: " + req.email());
        }

        Role role = parseRole(req.role(), Role.VIEWER);
        rejectPrivilegeEscalation(role);

        AdminUser user = AdminUser.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.fullName())
                .role(role)
                .isActive(true)
                .company(company)
                .isSuperAdmin(false)
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

        // Tenant boundary — a company admin can only manage users in their
        // own company. Super admin bypasses.
        if (user.getCompany() != null) {
            TenantSecurityService.verifyOwnership(user.getCompany().getId(), ENTITY_TYPE, userId);
        } else {
            // Target is a SUPER_ADMIN — only another SUPER_ADMIN may demote.
            if (!SecurityUtils.getCurrentUser().isSuperAdmin()) {
                throw new AccessDeniedException("Only SUPER_ADMIN can modify a super admin");
            }
        }

        Role newRole = parseRole(newRoleName, null);
        if (newRole == null) {
            throw new IllegalArgumentException("Role is required");
        }
        rejectPrivilegeEscalation(newRole);

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

        if (user.getCompany() != null) {
            TenantSecurityService.verifyOwnership(user.getCompany().getId(), ENTITY_TYPE, userId);
        } else if (!SecurityUtils.getCurrentUser().isSuperAdmin()) {
            throw new AccessDeniedException("Only SUPER_ADMIN can deactivate a super admin");
        }

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
            throw new IllegalArgumentException("Unknown role: " + raw + " (must be SUPER_ADMIN, ADMIN, or VIEWER)");
        }
    }

    /**
     * Only a SUPER_ADMIN may assign the SUPER_ADMIN role. A company admin
     * trying to create or promote a super admin gets a 403 — closes the
     * obvious privilege-escalation path.
     */
    private void rejectPrivilegeEscalation(Role role) {
        if (role == Role.SUPER_ADMIN && !SecurityUtils.getCurrentUser().isSuperAdmin()) {
            throw new AccessDeniedException("Only SUPER_ADMIN can assign the SUPER_ADMIN role");
        }
    }

    /** Safe snapshot for the audit log — never includes the password hash. */
    private Map<String, Object> userSnapshot(AdminUser u) {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id",            u.getId());
        m.put("email",         u.getEmail());
        m.put("fullName",      u.getFullName());
        m.put("role",          u.getRole().name());
        m.put("isActive",      u.isActive());
        m.put("isSuperAdmin",  u.isSuperAdmin());
        m.put("companyId",     u.getCompany() == null ? null : u.getCompany().getId());
        return m;
    }
}
