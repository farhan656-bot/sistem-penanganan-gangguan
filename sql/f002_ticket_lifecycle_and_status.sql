-- F002: Ticket Lifecycle & Status

ALTER TABLE reports
MODIFY COLUMN status_internal ENUM(
  'baru',
  'tersedia',
  'diambil',
  'didelegasikan',
  'selesai',
  'perlu_tindak_lanjut',
  'eskalasi'
) NOT NULL DEFAULT 'baru';
