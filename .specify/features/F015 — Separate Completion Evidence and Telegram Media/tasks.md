
---

# `tasks.md`

```md
# Tasks — Separate Completion Evidence and Telegram Media

## Feature ID
F015

## Analysis
- [ ] Review `views/reports/show.ejs`
- [ ] Review bagian Bukti Penyelesaian
- [ ] Review bagian Media Tambahan dari Telegram
- [ ] Review `models/reportModel.js`
- [ ] Review `getAttachmentsByReportId()`
- [ ] Review controller yang render halaman detail penuh
- [ ] Review modal detail dari F010
- [ ] Pastikan F015 hanya memisahkan tampilan attachment

## Search References
- [ ] Cari `Bukti Penyelesaian`
- [ ] Cari `Media Tambahan dari Telegram`
- [ ] Cari `getAttachmentsByReportId`
- [ ] Cari `attachments`
- [ ] Cari `source`
- [ ] Cari `telegram`
- [ ] Cari `report_attachments`
- [ ] Cari `report-detail-modal`

## Data Source Check
- [ ] Pastikan `getAttachmentsByReportId()` mengambil field `source`
- [ ] Jika belum, tambahkan field `source` di SELECT
- [ ] Pastikan attachment Telegram linked memiliki `source = 'telegram'`
- [ ] Pastikan attachment upload Eksekutor memiliki source bukan `telegram`
- [ ] Jangan ubah struktur database

## Separation Logic
- [ ] Pisahkan attachments menjadi completionAttachments
- [ ] Pisahkan attachments menjadi telegramAttachments
- [ ] completionAttachments berisi source bukan `telegram`
- [ ] telegramAttachments berisi source `telegram`
- [ ] Source NULL diperlakukan sebagai non-Telegram jika sesuai data lama
- [ ] Jangan hapus data attachment

## Full Detail Page Update
- [ ] Update bagian Bukti Penyelesaian agar memakai completionAttachments
- [ ] Jangan tampilkan source `telegram` pada Bukti Penyelesaian
- [ ] Tampilkan empty state jika tidak ada bukti penyelesaian
- [ ] Update bagian Media Telegram agar menampilkan telegramAttachments jika belum
- [ ] Tampilkan empty state jika tidak ada media Telegram
- [ ] Pastikan tombol Buka tetap berfungsi
- [ ] Pastikan nama file, uploader, dan waktu tetap tampil jika tersedia

## Modal Detail Safety
- [ ] Pastikan modal detail tetap memisahkan attachment dan media Telegram
- [ ] Jangan ubah modal jika sudah benar
- [ ] Jika mengubah public JS, pastikan tidak merusak modal
- [ ] Pastikan detail modal tetap bisa dibuka dari daftar

## Regression Safety
- [ ] Jangan ubah flow upload bukti penyelesaian
- [ ] Jangan ubah flow penyelesaian tiket
- [ ] Jangan ubah flow return evidence F013
- [ ] Jangan ubah flow eskalasi DIIT F014
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah pending media
- [ ] Jangan ubah text enrichment
- [ ] Jangan ubah Region Switch F007
- [ ] Jangan ubah KPI Supervisor
- [ ] Jangan ubah RBAC middleware
- [ ] Jangan ubah database

## Functional Testing
- [ ] Buka tiket yang hanya punya media Telegram
- [ ] Pastikan Bukti Penyelesaian menampilkan empty state
- [ ] Pastikan Media Telegram menampilkan media pelapor
- [ ] Upload bukti penyelesaian dari Eksekutor
- [ ] Buka halaman detail penuh
- [ ] Pastikan bukti Eksekutor tampil di Bukti Penyelesaian
- [ ] Pastikan media Telegram tetap di Media Telegram
- [ ] Buka detail modal
- [ ] Pastikan modal tetap benar
- [ ] Test tiket tanpa attachment
- [ ] Test tiket dengan source NULL
- [ ] Pastikan tidak error

## Documentation
- [ ] Screenshot sebelum perbaikan jika ada
- [ ] Screenshot Bukti Penyelesaian kosong saat belum ada upload Eksekutor
- [ ] Screenshot Media Telegram menampilkan bukti pelapor
- [ ] Screenshot Bukti Penyelesaian setelah Eksekutor upload bukti
- [ ] Screenshot detail modal tetap benar
- [ ] Catat file yang berubah
- [ ] Catat hasil testing manual