-- =============================================================
--  V3__fix_audit_log_id.sql
--
--  Repairs audit_log.id auto-generation by attaching an explicit
--  Postgres sequence as the column default.
--
--  Sequence-default pattern is used (rather than ADD GENERATED AS
--  IDENTITY) because the existing schema may already carry a partial
--  identity declaration that fails to return generated keys to JDBC.
--
--  Safe to run repeatedly:
--    • ALTER ... DROP DEFAULT  is a no-op if no default is present
--    • CREATE SEQUENCE IF NOT EXISTS  skips on re-run
--    • SET DEFAULT  always overwrites
--    • setval(...)  re-aligns to current max
-- =============================================================

ALTER TABLE audit_log ALTER COLUMN id DROP DEFAULT;

CREATE SEQUENCE IF NOT EXISTS audit_log_id_seq START WITH 100;

ALTER TABLE audit_log
    ALTER COLUMN id SET DEFAULT nextval('audit_log_id_seq');

SELECT setval(
    'audit_log_id_seq',
    COALESCE((SELECT MAX(id) FROM audit_log), 99) + 1,
    false
);
