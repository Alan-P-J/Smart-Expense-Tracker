package com.expensetracker.service;

import com.expensetracker.dto.request.CreateCompanyRequest;
import com.expensetracker.dto.request.CreateCompanyUserRequest;
import com.expensetracker.dto.response.CompanyResponse;
import com.expensetracker.dto.response.CompanyStatsResponse;
import com.expensetracker.dto.response.UserResponse;
import com.expensetracker.entity.AdminUser;
import com.expensetracker.entity.AdminUser.Role;
import com.expensetracker.entity.AuditLog.Action;
import com.expensetracker.entity.Company;
import com.expensetracker.exception.ConflictException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.repository.AdminUserRepository;
import com.expensetracker.repository.CompanyRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * SUPER_ADMIN-only management of companies. Authorisation is enforced at the
 * controller via {@code @PreAuthorize}; this layer trusts that callers are
 * super admins and so does not consult {@link com.expensetracker.security.TenantSecurityService}.
 */
@Service
@RequiredArgsConstructor
public class CompanyService {

    private static final String ENTITY_TYPE = "Company";
    private static final String USER_ENTITY_TYPE = "AdminUser";

    private final CompanyRepository companyRepo;
    private final AdminUserRepository userRepo;
    private final ExpenseRepository expenseRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLog;

    @Transactional(readOnly = true)
    public List<CompanyResponse> listAll() {
        return companyRepo.findAll().stream()
                .map(c -> CompanyResponse.from(c, companyRepo.countUsers(c.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CompanyStatsResponse getStats(Long companyId) {
        Company company = companyRepo.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_TYPE, companyId));

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        long userCount = companyRepo.countUsers(companyId);
        long expenseCount = companyRepo.countExpenses(companyId);
        BigDecimal monthTotal = expenseRepo.sumAmountBetween(monthStart, today, companyId);

        return new CompanyStatsResponse(
                company.getId(),
                company.getName(),
                company.getSlug(),
                company.isActive(),
                userCount,
                expenseCount,
                monthTotal == null ? BigDecimal.ZERO : monthTotal
        );
    }

    @Transactional
    public CompanyResponse create(CreateCompanyRequest req) {
        if (companyRepo.existsBySlug(req.slug())) {
            throw new ConflictException("Company slug already in use: " + req.slug());
        }

        Company company = Company.builder()
                .name(req.name())
                .slug(req.slug())
                .logoUrl(req.logoUrl())
                .isActive(true)
                .build();

        Company saved = companyRepo.save(company);

        AdminUser actor = SecurityUtils.getCurrentUser();
        auditLog.log(actor, Action.CREATE, ENTITY_TYPE, saved.getId(),
                null, snapshot(saved));

        return CompanyResponse.from(saved, 0L);
    }

    @Transactional
    public UserResponse addUser(Long companyId, CreateCompanyUserRequest req) {
        Company company = companyRepo.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_TYPE, companyId));

        if (userRepo.existsByEmail(req.email())) {
            throw new ConflictException("Email already in use: " + req.email());
        }

        Role role = parseRole(req.role());

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
        auditLog.log(actor, Action.CREATE, USER_ENTITY_TYPE, saved.getId(),
                null, userSnapshot(saved));

        return UserResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers(Long companyId) {
        if (!companyRepo.existsById(companyId)) {
            throw new ResourceNotFoundException(ENTITY_TYPE, companyId);
        }
        return userRepo.findAllByCompanyId(companyId).stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public void deactivate(Long companyId) {
        Company company = companyRepo.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_TYPE, companyId));

        if (!company.isActive()) return;   // idempotent

        Map<String, Object> oldValue = snapshot(company);
        company.setActive(false);
        companyRepo.save(company);

        AdminUser actor = SecurityUtils.getCurrentUser();
        auditLog.log(actor, Action.UPDATE, ENTITY_TYPE, companyId,
                oldValue, snapshot(company));
    }

    /**
     * Only ADMIN or VIEWER through this endpoint. SUPER_ADMIN is bootstrap-only
     * and not assignable via the public API.
     */
    private Role parseRole(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("role is required");
        }
        Role role;
        try {
            role = Role.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown role: " + raw + " (must be ADMIN or VIEWER)");
        }
        if (role == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("SUPER_ADMIN cannot be assigned through this endpoint");
        }
        return role;
    }

    private Map<String, Object> snapshot(Company c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",       c.getId());
        m.put("name",     c.getName());
        m.put("slug",     c.getSlug());
        m.put("logoUrl",  c.getLogoUrl());
        m.put("isActive", c.isActive());
        return m;
    }

    private Map<String, Object> userSnapshot(AdminUser u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            u.getId());
        m.put("email",         u.getEmail());
        m.put("fullName",      u.getFullName());
        m.put("role",          u.getRole().name());
        m.put("isActive",      u.isActive());
        m.put("companyId",     u.getCompany() == null ? null : u.getCompany().getId());
        return m;
    }
}
