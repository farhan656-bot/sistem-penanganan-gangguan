# Checklist — Query Indexing and Performance Optimization

## Query Checklist
- [x] Daftar antrean tidak memakai SELECT * jika tidak perlu
- [x] Daftar antrean memakai LIMIT
- [x] Daftar antrean memakai OFFSET
- [x] Attachment tidak dimuat di list
- [x] Media Telegram tidak dimuat di list
- [x] Report logs tidak dimuat di list
- [x] Detail lengkap hanya dimuat saat modal dibuka

## Count Checklist
- [x] Count tab status memakai query ringan
- [x] Count tidak mengambil semua data ke JavaScript
- [x] Count mengikuti role access
- [x] Count mengikuti region access
- [x] Dashboard memakai COUNT/GROUP BY/LIMIT

## F031 Polling Checklist
- [x] check-new memakai COUNT/MAX
- [x] check-new tidak mengambil attachment
- [x] check-new tidak mengambil logs
- [x] check-new tidak mengambil media
- [x] check-new mengikuti role access
- [x] check-new mengikuti filter aktif
- [x] Tidak ada multiple interval frontend

## Index Checklist
- [x] Index existing sudah dicek
- [x] Tidak ada duplicate index
- [x] Index reports region/status/id dicek
- [x] Index reports assigned/status/id dicek
- [x] Index reports status/id dicek
- [x] Index reports received_at dicek
- [x] Index reports ticket_id dicek
- [x] Index report_logs report_id/created_at dicek
- [x] Index report_attachments report_id/source dicek
- [x] Index manual report region/date dicek
- [x] Index users role_id dicek
- [x] Index users region_id dicek

## Regression Checklist
- [x] F028 dashboard tetap berjalan
- [x] F029 tab status tetap berjalan
- [x] F030 pagination tetap berjalan
- [x] F031 auto-refresh tetap berjalan
- [x] Detail modal tetap berjalan
- [x] Smooth action tetap berjalan
- [x] Upload tetap berjalan
- [x] Telegram tetap berjalan
- [x] RBAC tetap aman

## Manual Test Checklist
- [x] Login Eksekutor
- [x] Login Koordinator
- [x] Login Super Admin
- [x] Test daftar antrean
- [x] Test dashboard
- [x] Test polling
- [x] Test search/filter
- [x] Test pagination
- [x] Test modal detail
- [ ] Test aksi selesai/return/eskalasi

## Catatan Verifikasi

- Verifikasi dilakukan pada MariaDB 10.4.32 dengan data lokal: 48 reports, 265 report logs, dan 45 attachments.
- Migration dijalankan dua kali dan tidak membuat duplicate index.
- Smoke test HTTP read-only berhasil untuk Eksekutor, Koordinator, Super Admin, dan Supervisor.
- Aksi upload serta selesai/return/eskalasi tidak dieksekusi pada data aktif karena F032 tidak mengubah flow mutasi tersebut.
