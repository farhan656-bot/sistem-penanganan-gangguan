
---

# `tasks.md`

```md id="myg80z"
# Tasks — Query Indexing and Performance Optimization

## Feature ID
F032

## Query Audit
- [x] Audit query daftar antrean kerja
- [x] Audit query count tab F029
- [x] Audit query pagination F030
- [x] Audit endpoint check-new F031
- [x] Audit query dashboard F028
- [x] Audit query detail modal F019
- [x] Catat query yang memakai SELECT *
- [x] Catat query yang mengambil attachment/log/media terlalu awal

## Queue List Optimization
- [x] Pastikan daftar antrean memakai LIMIT
- [x] Pastikan daftar antrean memakai OFFSET
- [x] Kurangi SELECT *
- [x] Ambil hanya kolom yang dibutuhkan tabel
- [x] Jangan ambil attachment pada list
- [x] Jangan ambil report logs pada list
- [x] Jangan ambil media Telegram pada list
- [x] Pastikan filter status tetap berjalan
- [x] Pastikan filter region tetap berjalan
- [x] Pastikan search tetap berjalan
- [x] Pastikan role access tetap berjalan

## Status Count Optimization
- [x] Review count tab status F029
- [x] Gabungkan count status jika memungkinkan
- [x] Gunakan COUNT atau SUM(CASE)
- [x] Jangan mengambil semua rows untuk dihitung di JavaScript
- [x] Pastikan count mengikuti role access
- [x] Pastikan count mengikuti region access

## Polling F031 Optimization
- [x] Review endpoint check-new
- [x] Pastikan endpoint hanya COUNT/MAX
- [x] Jangan ambil detail laporan
- [x] Jangan ambil attachment
- [x] Jangan ambil media
- [x] Jangan ambil report logs
- [x] Pastikan endpoint memakai filter aktif
- [x] Pastikan endpoint memakai role access
- [x] Pastikan tidak ada multiple interval frontend

## Dashboard Optimization
- [x] Review dashboard Eksekutor
- [x] Review dashboard Koordinator
- [x] Review dashboard Super Admin
- [x] Gunakan COUNT sederhana
- [x] Gunakan GROUP BY seperlunya
- [x] Gunakan LIMIT untuk aktivitas terbaru
- [x] Jangan mengambil semua reports
- [x] Jangan menghitung besar di JavaScript jika bisa di SQL

## Index Audit
- [x] Jalankan SHOW INDEX FROM reports
- [x] Jalankan SHOW INDEX FROM report_logs
- [x] Jalankan SHOW INDEX FROM report_attachments
- [x] Jalankan SHOW INDEX FROM manual_non_ticketing_reports
- [x] Jalankan SHOW INDEX FROM users
- [x] Catat index yang sudah ada
- [x] Hindari duplicate index

## Index Implementation
- [x] Tambahkan index reports current_region_id/status_internal/id jika belum ada
- [x] Tambahkan index reports current_assigned_user_id/status_internal/id jika belum ada
- [x] Evaluasi index reports status_internal/id; index status existing sudah mencakup PK id secara implisit pada InnoDB
- [x] Tambahkan index reports received_at jika belum ada
- [x] Evaluasi index reports ticket_id; unique index existing dipertahankan
- [x] Tambahkan index report_logs report_id/created_at jika belum ada
- [x] Evaluasi index report_attachments report_id/source; tidak ditambah karena query aktif hanya memfilter report_id
- [x] Evaluasi index manual_non_ticketing_reports region_id/report_date; tidak ditambah karena tidak ada query aktif yang memfilter pasangan kolom tersebut
- [x] Evaluasi index users role_id; index existing dipertahankan
- [x] Evaluasi index users region_id; index existing dipertahankan

## Testing
- [x] Test antrean kerja tab Semua
- [x] Test antrean kerja tab Tersedia
- [x] Test antrean kerja tab Sedang Dikerjakan
- [x] Test antrean kerja tab Selesai
- [x] Test antrean kerja tab Perlu Tindak Lanjut
- [x] Test antrean kerja tab Eskalasi
- [x] Test pagination
- [x] Test search
- [x] Test filter region
- [x] Test auto-refresh F031
- [x] Test dashboard Eksekutor
- [x] Test dashboard Koordinator
- [x] Test dashboard Super Admin
- [x] Test detail modal
- [ ] Test upload file
- [ ] Test selesai/return/eskalasi

## Regression Safety
- [x] Jangan ubah Telegram intake
- [x] Jangan ubah Telegram parsing
- [x] Jangan ubah flow ticketing
- [x] Jangan ubah upload file
- [x] Jangan ubah modal detail
- [x] Jangan rusak F029
- [x] Jangan rusak F030
- [x] Jangan rusak F031
