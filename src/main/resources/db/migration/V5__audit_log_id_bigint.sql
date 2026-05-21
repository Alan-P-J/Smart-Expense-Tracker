-- =============================================================
--  V5__audit_log_id_bigint.sql
--
--  Repairs audit_log.id when an earlier Hibernate run (ddl-auto:
--  update, Flyway disabled) created the column as VARCHAR. The
--  entity is Long and AuditLogService assigns ids via AtomicLong,
--  so the live column must be bigint to match JPA's parameter
--  binding (otherwise: "operator does not exist: character varying
--  = bigint").
--
--  Idempotent:
--    • If id is already bigint, the ALTER TYPE is a no-op.
--    • USING id::bigint succeeds for numeric strings; will fail
--      loudly if any row holds a non-numeric id, which is the
--      desired behaviour (forces manual cleanup rather than
--      silently losing rows).
-- =============================================================

ALTER TABLE audit_log
    ALTER COLUMN id TYPE bigint USING id::bigint;

ALTER TABLE audit_log ALTER COLUMN id SET NOT NULL;
