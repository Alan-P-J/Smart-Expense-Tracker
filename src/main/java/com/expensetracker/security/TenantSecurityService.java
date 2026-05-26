package com.expensetracker.security;

import com.expensetracker.entity.AdminUser;
import com.expensetracker.exception.UnauthorizedException;
import org.springframework.security.access.AccessDeniedException;

/**
 * Reusable tenant checks. Static so services can call them without DI noise.
 *
 * Lookup order for "current tenant" is always {@link TenantContext}, which
 * was populated from the authenticated principal by {@link TenantFilter}.
 *
 *   • {@link #currentCompanyIdOrNull()} — null means SUPER_ADMIN; reads
 *     should return cross-tenant data.
 *
 *   • {@link #requireCompanyId()} — throws when no tenant is set. Used at
 *     the top of every write so SUPER_ADMIN must explicitly switch into a
 *     company before mutating data.
 *
 *   • {@link #verifyOwnership(Long, String, Long)} — call BEFORE updating or
 *     deleting any tenant-scoped entity. SUPER_ADMIN bypasses.
 *
 *   • {@link #verifyCompanyAccess(Long)} — for company-level endpoints; lets
 *     SUPER_ADMIN through, otherwise checks the id matches the user's tenant.
 */
public final class TenantSecurityService {

    private TenantSecurityService() {}

    public static Long currentCompanyIdOrNull() {
        return TenantContext.getCompanyId();
    }

    public static Long requireCompanyId() {
        Long id = TenantContext.getCompanyId();
        if (id == null) {
            // Either no auth at all (shouldn't happen — @PreAuthorize gates the
            // endpoint) or a SUPER_ADMIN who hasn't selected a company. Both
            // are programmer errors at the call site.
            throw new AccessDeniedException(
                    "Operation requires a company context. SUPER_ADMIN must switch into a company first.");
        }
        return id;
    }

    /**
     * Verifies that the entity being mutated belongs to the current tenant.
     * Returns 403 (not 404) on mismatch — leaking "exists but not yours" is
     * acceptable here because the alternative (returning 404 indistinguishably)
     * costs the developer ergonomics of clear errors.
     *
     * SUPER_ADMIN bypasses every check.
     */
    public static void verifyOwnership(Long ownerCompanyId, String entityType, Long entityId) {
        if (isSuperAdmin()) return;

        Long tenant = TenantContext.getCompanyId();
        if (tenant == null || ownerCompanyId == null || !tenant.equals(ownerCompanyId)) {
            throw new AccessDeniedException(
                    entityType + " " + entityId + " is not accessible to this tenant");
        }
    }

    /**
     * For endpoints that take a companyId path parameter (e.g.
     * /api/companies/{id}/users): SUPER_ADMIN may touch anything, anyone
     * else must match their own tenant.
     */
    public static void verifyCompanyAccess(Long companyId) {
        if (isSuperAdmin()) return;

        Long tenant = TenantContext.getCompanyId();
        if (tenant == null || !tenant.equals(companyId)) {
            throw new AccessDeniedException(
                    "Cannot access company " + companyId);
        }
    }

    private static boolean isSuperAdmin() {
        try {
            AdminUser user = SecurityUtils.getCurrentUser();
            return user.isSuperAdmin();
        } catch (UnauthorizedException ex) {
            return false;
        }
    }
}
