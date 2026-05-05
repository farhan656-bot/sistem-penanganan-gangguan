-- F001: Super Admin & User Management

-- Tambahkan role super_admin jika belum ada
INSERT INTO roles (name)
SELECT 'super_admin'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'super_admin'
);
