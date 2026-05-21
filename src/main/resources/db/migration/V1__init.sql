-- =============================================================
--  V1__init.sql
--  All 6 tables for the Expense Tracker schema.
--
--  Rules enforced here at the DB level:
--    • DECIMAL(12,2)  for every monetary column  — never FLOAT
--    • TIMESTAMPTZ    for every timestamp         — never plain TIMESTAMP
--    • updated_at on expenses managed by a DB trigger, not application code
--    • FK index on every foreign key column
--    • JSONB for audit_log old_value / new_value
-- =============================================================

-- ── 1. admin_users ───────────────────────────────────────────
CREATE TABLE admin_users (
    id            BIGSERIAL    PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('ADMIN', 'VIEWER')),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,

    CONSTRAINT uq_admin_users_email UNIQUE (email)
);

-- ── 2. refresh_tokens ────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    token       VARCHAR(512) NOT NULL,
    user_id     BIGINT       NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_refresh_tokens_token   UNIQUE (token),
    CONSTRAINT fk_refresh_tokens_user_id FOREIGN KEY (user_id)
        REFERENCES admin_users (id) ON DELETE CASCADE
);

-- Token lookup happens on every authenticated request — must be fast
CREATE INDEX idx_refresh_tokens_token   ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- ── 3. categories ────────────────────────────────────────────
CREATE TABLE categories (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    colour_hex VARCHAR(7)   NOT NULL DEFAULT '#6B7280'
                            CHECK (colour_hex ~ '^#[0-9A-Fa-f]{6}$'),
    icon_name  VARCHAR(50),
    is_default BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_categories_name UNIQUE (name)
);

-- ── 4. expenses ──────────────────────────────────────────────
CREATE TABLE expenses (
    id           BIGSERIAL     PRIMARY KEY,
    title        VARCHAR(255)  NOT NULL,
    amount       DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    expense_date DATE          NOT NULL,
    category_id  BIGINT        NOT NULL,
    description  TEXT,
    created_by   BIGINT        NOT NULL,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_expenses_category FOREIGN KEY (category_id)
        REFERENCES categories (id),
    CONSTRAINT fk_expenses_created_by FOREIGN KEY (created_by)
        REFERENCES admin_users (id)
);

CREATE INDEX idx_expenses_category_id  ON expenses (category_id);
CREATE INDEX idx_expenses_created_by   ON expenses (created_by);
CREATE INDEX idx_expenses_expense_date ON expenses (expense_date DESC);

-- updated_at trigger — fires on every row UPDATE automatically.
-- We use a DB trigger (not @PreUpdate) so it works even for
-- bulk JPQL UPDATE statements that bypass JPA lifecycle callbacks.
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- ── 5. budgets ───────────────────────────────────────────────
CREATE TABLE budgets (
    id            BIGSERIAL     PRIMARY KEY,
    category_id   BIGINT        NOT NULL,
    monthly_limit DECIMAL(12,2) NOT NULL CHECK (monthly_limit > 0),
    created_by    BIGINT        NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_budgets_category_id UNIQUE (category_id),
    CONSTRAINT fk_budgets_category    FOREIGN KEY (category_id)
        REFERENCES categories (id),
    CONSTRAINT fk_budgets_created_by  FOREIGN KEY (created_by)
        REFERENCES admin_users (id)
);

CREATE INDEX idx_budgets_category_id ON budgets (category_id);

-- ── 6. audit_log ─────────────────────────────────────────────
CREATE TABLE audit_log (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL,
    action      VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    entity_type VARCHAR(50) NOT NULL,
    entity_id   BIGINT      NOT NULL,
    old_value   JSONB,
    new_value   JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id)
        REFERENCES admin_users (id)
);

CREATE INDEX idx_audit_log_user_id    ON audit_log (user_id);
CREATE INDEX idx_audit_log_entity     ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log (created_at DESC);
