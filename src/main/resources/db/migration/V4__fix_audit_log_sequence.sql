-- =============================================================
--  V4__fix_audit_log_sequence.sql
--
--  Strips any auto-generation from audit_log.id. The application
--  (AuditLogService) now assigns ids via AtomicLong before each
--  INSERT, so the DB no longer participates in id generation.
--
--  Anything that was previously attached (BIGSERIAL sequence, IDENTITY
--  declaration, or a column default referencing a sequence) is removed.
--
--  Safe to run repeatedly:
--    • ALTER ... DROP DEFAULT  is a no-op if no default is present
--    • ALTER ... SET NOT NULL  is a no-op if already NOT NULL
-- =============================================================

-- Remove all defaults from id, leaving it a plain bigint.
ALTER TABLE audit_log ALTER COLUMN id DROP DEFAULT;

-- Belt-and-suspenders: ensure NOT NULL is set. The application always
-- assigns an id before save, but enforcing it at the schema level
-- catches bugs that try to insert without one.
ALTER TABLE audit_log ALTER COLUMN id SET NOT NULL;
