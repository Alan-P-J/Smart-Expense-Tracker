package com.expensetracker.security;

/**
 * Thread-local store for the current tenant.
 *
 * Populated by {@link TenantFilter} from the authenticated principal at the
 * start of every request and cleared in the filter's finally block. Services
 * read {@link #getCompanyId()} to scope every query.
 *
 * Contract:
 *   • Non-null Long  → company-scoped user; scope every read/write to this id.
 *   • Null           → SUPER_ADMIN (no tenant restriction). Services must
 *                      handle this branch explicitly — typically by returning
 *                      cross-tenant data or rejecting the operation.
 *
 * CRITICAL: never call {@link #setCompanyId(Long)} outside TenantFilter and
 * never forget {@link #clear()} — a stale value leaks data across requests
 * because the servlet container reuses threads.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT_COMPANY = new ThreadLocal<>();

    private TenantContext() {}

    public static void setCompanyId(Long id) {
        CURRENT_COMPANY.set(id);
    }

    public static Long getCompanyId() {
        return CURRENT_COMPANY.get();
    }

    public static void clear() {
        CURRENT_COMPANY.remove();
    }
}
