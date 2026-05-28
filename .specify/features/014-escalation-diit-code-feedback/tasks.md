
---

# `tasks.md`

```md
# Tasks — Escalation DIIT Code Feedback

## Feature ID
F014

## Analysis
- [ ] Review constitution project
- [ ] Review copilot/custom instructions
- [ ] Review flow status `eskalasi`
- [ ] Review form penyelesaian/status tiket
- [ ] Review controller penyelesaian/status tiket
- [ ] Review model update report
- [ ] Review detail modal dari F010
- [ ] Review Telegram feedback service
- [ ] Pastikan F014 hanya mengubah flow eskalasi dengan kode DIIT

## Database Check
- [ ] Cek apakah tabel `reports` memiliki kolom `diit_code`
- [ ] Jika belum ada, siapkan SQL manual
- [ ] Jalankan SQL hanya jika kolom belum ada
- [ ] Pastikan `diit_code` bertipe VARCHAR(100) NULL
- [ ] Pastikan tidak ada data lama yang terhapus
- [ ] Jangan ubah tabel lain

## SQL Manual If Needed
- [ ] Gunakan SQL berikut jika kolom belum ada:

```sql
ALTER TABLE reports
ADD COLUMN diit_code VARCHAR(100) NULL AFTER completion_status;