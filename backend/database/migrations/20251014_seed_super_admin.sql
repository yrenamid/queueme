
INSERT INTO users (business_id, name, email, phone, password, role, is_admin)
VALUES (
  (SELECT id FROM businesses ORDER BY id ASC LIMIT 1),
  'Super Admin',
  'admin@example.com',
  NULL,
  '$2b$10$REPLACE_WITH_BCRYPT_HASH',
  'manager',
  1
)
ON DUPLICATE KEY UPDATE
  is_admin = VALUES(is_admin),
  password = VALUES(password),
  role = COALESCE(role, VALUES(role));
