-- =============================================================
--  V2__seed_data.sql
--  Default categories + one ADMIN user for first login.
--
--  Admin credentials (change before production):
--    Email   : admin@expensetracker.com
--    Password: Admin@1234
--
--  Hash generated with BCrypt cost=12.
--  To generate a new hash (Java):
--    new BCryptPasswordEncoder(12).encode("your-password")
-- =============================================================

INSERT INTO categories (name, colour_hex, icon_name, is_default) VALUES
    ('Food & Dining',   '#FF6B6B', 'utensils',    TRUE),
    ('Transportation',  '#4ECDC4', 'car',          TRUE),
    ('Utilities',       '#45B7D1', 'zap',          TRUE),
    ('Entertainment',   '#96CEB4', 'film',         TRUE),
    ('Healthcare',      '#FFEAA7', 'heart-pulse',  TRUE),
    ('Office Supplies', '#DDA0DD', 'briefcase',    TRUE),
    ('Miscellaneous',   '#98D8C8', 'package',      TRUE);

INSERT INTO admin_users (email, password_hash, full_name, role, is_active) VALUES (
    'admin@expensetracker.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KCuGGi',
    'System Administrator',
    'ADMIN',
    TRUE
);
