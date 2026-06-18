
---

# `tasks.md`

```md id="rmityc"
# Tasks — Role-Based Dashboard Improvement

## Feature ID
F028

## Analysis
- [x] Review dashboard existing
- [x] Review dashboard route
- [x] Review dashboard controller
- [x] Review role user pada session
- [x] Review model report
- [x] Review tabel users
- [x] Review tabel manual_non_ticketing_reports
- [x] Review F018 Koordinator PDG/BKT
- [x] Review F029/F030 antrean kerja

## Dashboard Model
- [x] Buat/update `models/dashboardModel.js`
- [x] Buat fungsi dashboard Eksekutor
- [x] Buat fungsi dashboard Koordinator
- [x] Buat fungsi dashboard Super Admin
- [x] Gunakan COUNT sederhana
- [x] Gunakan LIMIT untuk data terbaru
- [x] Jangan mengambil semua data tanpa limit
- [x] Jangan ubah database

## Eksekutor Dashboard
- [x] Card tiket tersedia
- [x] Card tiket saya/sedang dikerjakan
- [x] Card tiket selesai
- [x] Card perlu tindak lanjut
- [x] Card eskalasi
- [x] List tiket assigned terbaru
- [x] Shortcut ke Daftar Antrean Kerja
- [x] Data mengikuti akses Eksekutor

## Koordinator Dashboard
- [x] Card total tiket PDG/BKT
- [x] Card tiket tersedia
- [x] Card sedang dikerjakan
- [x] Card didelegasikan
- [x] Card selesai
- [x] Card perlu tindak lanjut
- [x] Card eskalasi
- [x] Ringkasan per wilayah PDG/BKT
- [x] Aktivitas terbaru
- [x] Shortcut ke Daftar Antrean Kerja
- [x] Shortcut ke Laporan Manual
- [x] Data mengikuti F018

## Super Admin Dashboard
- [x] Card total user
- [x] Card user aktif
- [x] Card user nonaktif
- [x] Card total laporan ticketing
- [x] Card total laporan manual
- [x] Card total region
- [x] Ringkasan user berdasarkan role
- [x] Shortcut ke Manajemen User
- [x] Shortcut ke Laporan Manual
- [x] Shortcut ke Daftar Antrean

## Controller
- [x] Deteksi role user login
- [x] Ambil data dashboard sesuai role
- [x] Render view sesuai role
- [x] Supervisor tidak rusak
- [x] Error handling jika data kosong

## Views
- [x] Buat/update dashboard Eksekutor
- [x] Buat/update dashboard Koordinator
- [x] Buat/update dashboard Super Admin
- [x] Gunakan card Bootstrap
- [x] Gunakan layout konsisten F026
- [x] Tambahkan empty state
- [x] Tambahkan shortcut
- [x] Jangan pakai chart library baru

## Regression Safety
- [x] Jangan ubah database
- [x] Jangan ubah Telegram intake
- [x] Jangan ubah Telegram parsing
- [x] Jangan ubah upload file
- [x] Jangan ubah F017
- [x] Jangan ubah F018
- [x] Jangan ubah F019
- [x] Jangan ubah F021
- [x] Jangan ubah F022
- [x] Jangan ubah F023
- [x] Jangan ubah F024
- [x] Jangan ubah F025
- [x] Jangan ubah F026
- [x] Jangan ubah F027
- [x] Jangan ubah F029
- [x] Jangan ubah F030

## Testing
- [x] Login Eksekutor
- [x] Test dashboard Eksekutor
- [x] Test shortcut Eksekutor
- [x] Login Koordinator
- [x] Test dashboard Koordinator
- [x] Test ringkasan PDG/BKT
- [x] Login Super Admin
- [x] Test dashboard Super Admin
- [x] Test user by role
- [x] Login Supervisor jika ada
- [x] Pastikan tidak rusak
- [x] Test daftar antrean F029/F030
