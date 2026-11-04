-- Migration: 037_update_telegram_reporters_company_unit_region.sql
-- Menambahkan kolom company (perusahaan), unit (divisi), dan region_id (asal wilayah) pada telegram_reporters

ALTER TABLE telegram_reporters
  ADD COLUMN company VARCHAR(100) NULL AFTER nik,
  ADD COLUMN unit VARCHAR(100) NULL AFTER company,
  ADD COLUMN region_id INT NULL AFTER unit;

ALTER TABLE telegram_reporters
  MODIFY COLUMN agency VARCHAR(50) NULL DEFAULT 'TELKOM';

ALTER TABLE telegram_reporters
  ADD CONSTRAINT fk_telegram_reporters_region
  FOREIGN KEY (region_id) REFERENCES regions (id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill data existing (jika ada)
UPDATE telegram_reporters
SET 
  company = COALESCE(company, agency, 'TELKOM'),
  unit = COALESCE(unit, 'DAMAN'),
  region_id = COALESCE(region_id, 1)
WHERE company IS NULL OR unit IS NULL OR region_id IS NULL;

