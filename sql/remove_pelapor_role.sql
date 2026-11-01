-- Migration: Hapus role pelapor
-- Alasan: Pelapor adalah pengguna eksternal yang melapor melalui bot Telegram, bukan pengguna internal dengan hak akses sistem.
DELETE FROM roles WHERE name = 'pelapor';
