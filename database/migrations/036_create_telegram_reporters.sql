-- Migration: 036_create_telegram_reporters.sql
-- Tabel untuk registrasi pelapor grup Telegram dan persetujuan (approval) Superadmin

CREATE TABLE IF NOT EXISTS telegram_reporters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telegram_user_id VARCHAR(64) NOT NULL,
  telegram_username VARCHAR(100) NULL,
  telegram_chat_id VARCHAR(64) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  nik VARCHAR(10) NOT NULL,
  agency ENUM('TELKOM', 'HD', 'TELKOMSEL') NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT NULL,
  approved_by_user_id INT NULL,
  approved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_telegram_user_id (telegram_user_id),
  KEY idx_telegram_reporters_status (status),
  KEY idx_telegram_reporters_nik (nik),
  CONSTRAINT fk_telegram_reporters_approved_by FOREIGN KEY (approved_by_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

