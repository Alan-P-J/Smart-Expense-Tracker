-- V6__add_multi_tenancy.sql
-- Row-level multi-tenancy. Adds the companies table and company_id on every
-- business table.
--
-- Flyway is disabled (application.yml: spring.flyway.enabled=false), so this
-- file is for reference and manual application via psql. Apply it BEFORE the
-- backend restart that picks up the new entity mappings — Hibernate ddl-auto
-- (update) will then see the columns already exist and leave them alone.
--
-- The migration is idempotent: every statement uses IF [NOT] EXISTS or guards
-- against re-running so a second invocation is a no-op.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. companies table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    logo_url    VARCHAR(500),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_companies_slug UNIQUE (slug)
);

-- 2. Seed the Default Company FIRST so the FK targets exist before we add
--    the company_id columns. Every pre-existing row gets backfilled to this
--    company's id so NOT NULL constraints can be applied cleanly.
INSERT INTO companies (name, slug, is_active)
VALUES ('Default Company', 'default', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. admin_users — company_id is nullable (SUPER_ADMIN has no single tenant)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS company_id     BIGINT REFERENCES companies(id),
    ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. expenses — company_id NOT NULL (every expense belongs to a company).
--    Add nullable → backfill → set NOT NULL so existing rows survive.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES companies(id);

UPDATE expenses
   SET company_id = (SELECT id FROM companies WHERE slug = 'default')
 WHERE company_id IS NULL;

ALTER TABLE expenses
    ALTER COLUMN company_id SET NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. categories — nullable on purpose:
--      NULL     = global default category (visible to every company)
--      NOT NULL = company-specific custom category
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES companies(id);

-- Default seeded categories stay NULL (global). Any non-default category that
-- exists today is assigned to the Default Company.
UPDATE categories
   SET company_id = (SELECT id FROM companies WHERE slug = 'default')
 WHERE is_default = FALSE AND company_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. budgets — company_id NOT NULL. Same backfill-then-tighten pattern.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE budgets
    ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES companies(id);

UPDATE budgets
   SET company_id = (SELECT id FROM companies WHERE slug = 'default')
 WHERE company_id IS NULL;

ALTER TABLE budgets
    ALTER COLUMN company_id SET NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. audit_log — nullable (events that happen outside a tenant context, e.g.
--    SUPER_ADMIN actions on the companies table itself, have no company).
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE audit_log
    ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES companies(id);

UPDATE audit_log
   SET company_id = (SELECT id FROM companies WHERE slug = 'default')
 WHERE company_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Indexes — one per FK column. Every tenant-scoped query filters on
--    company_id, so these are non-negotiable for performance.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_users_company_id ON admin_users (company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_company_id    ON expenses    (company_id);
CREATE INDEX IF NOT EXISTS idx_categories_company_id  ON categories  (company_id);
CREATE INDEX IF NOT EXISTS idx_budgets_company_id     ON budgets     (company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_company_id   ON audit_log   (company_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Role check constraint — extend with SUPER_ADMIN. ADMIN is kept as the
--    company-scoped admin role (functions as COMPANY_ADMIN in the spec).
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users
    ADD CONSTRAINT admin_users_role_check
    CHECK (role IN ('SUPER_ADMIN','ADMIN','VIEWER'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Promote the bootstrap admin to SUPER_ADMIN. company_id stays NULL —
--     SUPER_ADMIN spans every company.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE admin_users
   SET company_id     = NULL,
       is_super_admin = TRUE,
       role           = 'SUPER_ADMIN'
 WHERE email = 'admin@expensetracker.com';

-- Every other existing user becomes a member of the Default Company.
UPDATE admin_users
   SET company_id = (SELECT id FROM companies WHERE slug = 'default')
 WHERE company_id IS NULL
   AND is_super_admin = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Pre-tenancy uniqueness constraints conflict with row-level isolation:
--       • categories.name was globally unique → two companies couldn't both
--         name a custom category "Food".
--       • budgets.category_id was globally unique → only one company could
--         have a budget per category.
--     Drop both, replace budgets with a (category_id, company_id) composite
--     so each company keeps exactly one budget per category. Category-name
--     collisions inside one tenant are enforced by CategoryService instead.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE categories DROP CONSTRAINT IF EXISTS uq_categories_name;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS uq_budgets_category_id;
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_id_key;
ALTER TABLE budgets
    ADD CONSTRAINT uq_budgets_category_company UNIQUE (category_id, company_id);

COMMIT;
