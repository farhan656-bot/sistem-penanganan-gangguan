
---

# `tasks.md`

```md
# Tasks — Manual Non-Ticketing Report Module

## Feature ID
F017

## Important Update
- [ ] Tabel `manual_non_ticketing_reports` sudah tersedia di database
- [ ] Jangan buat ulang tabel
- [ ] Jangan ubah struktur tabel
- [ ] Jangan jalankan SQL CREATE TABLE
- [ ] Gunakan tabel yang sudah ada

## Analysis
- [ ] Review struktur project
- [ ] Review middleware login
- [ ] Review middleware role
- [ ] Review sidebar per role
- [ ] Review pola controller existing
- [ ] Review pola model existing
- [ ] Review pola route existing
- [ ] Review format Excel contoh laporan manual
- [ ] Pastikan F017 tidak mengembalikan laporan manual ticketing lama

## Database
- [ ] Pastikan tabel `manual_non_ticketing_reports` tersedia
- [ ] Pastikan kolom tabel sesuai kebutuhan
- [ ] Jangan ubah tabel `reports`
- [ ] Jangan ubah tabel `report_attachments`
- [ ] Jangan ubah tabel `telegram_pending_media`
- [ ] Jangan ubah tabel `region_switch_requests`

## Model
- [ ] Buat `models/manualReportModel.js`
- [ ] Buat fungsi `createManualReport(data)`
- [ ] Buat fungsi `getManualReports(filters, user)`
- [ ] Buat fungsi `getManualReportById(id, user)`
- [ ] Tambahkan filter tanggal
- [ ] Tambahkan filter STO
- [ ] Tambahkan filter aktivitas
- [ ] Tambahkan filter pengerjaan
- [ ] Tambahkan filter S/E
- [ ] Gunakan mysql2/promise
- [ ] SQL tetap berada di model
- [ ] Jangan pakai ORM

## Controller
- [ ] Buat `controllers/manualReportController.js`
- [ ] Buat method `index`
- [ ] Buat method `create`
- [ ] Buat method `store`
- [ ] Buat method `show`
- [ ] Ambil user login dari session sesuai pola project
- [ ] Set `created_by` dari user login
- [ ] Set `region_id` dari user login jika tersedia
- [ ] Trim input text
- [ ] Redirect setelah berhasil simpan
- [ ] Tampilkan flash message jika tersedia
- [ ] Jangan membuat laporan masuk ke tabel `reports`

## Routes
- [ ] Buat `routes/manualReportRoutes.js`
- [ ] Tambahkan middleware login
- [ ] Tambahkan middleware role sesuai pola project
- [ ] Route index untuk Eksekutor, Koordinator, Super Admin
- [ ] Route create hanya untuk Eksekutor dan Koordinator
- [ ] Route store hanya untuk Eksekutor dan Koordinator
- [ ] Route show untuk Eksekutor, Koordinator, Super Admin
- [ ] Daftarkan route di `app.js`
- [ ] Jangan tabrakan dengan route reports ticketing

## Views
- [ ] Buat `views/manual-reports/index.ejs`
- [ ] Buat `views/manual-reports/create.ejs`
- [ ] Buat `views/manual-reports/show.ejs`
- [ ] Gunakan layout/partial project yang sudah ada
- [ ] Form mengikuti kolom Excel contoh
- [ ] Field `report_date` menggunakan input date
- [ ] Field `details` menggunakan textarea
- [ ] Field `incident` menggunakan textarea
- [ ] Field lain menggunakan input text
- [ ] Tabel daftar responsif
- [ ] Detail menampilkan semua field penting
- [ ] Empty state jika belum ada laporan manual

## Sidebar
- [ ] Tambahkan menu Laporan Manual untuk Eksekutor
- [ ] Tambahkan menu Laporan Manual untuk Koordinator
- [ ] Tambahkan menu Laporan Manual untuk Super Admin
- [ ] Jangan tampilkan untuk Supervisor jika tidak dibutuhkan
- [ ] Jangan tampilkan untuk role yang tidak perlu
- [ ] Pastikan menu tidak mengganggu menu ticketing

## Access Rules
- [ ] Eksekutor dapat membuat laporan manual
- [ ] Eksekutor dapat melihat laporan manual miliknya
- [ ] Koordinator dapat membuat laporan manual
- [ ] Koordinator dapat melihat laporan manual miliknya
- [ ] Super Admin dapat melihat semua laporan manual
- [ ] User tanpa login tidak dapat akses
- [ ] User tanpa role sesuai tidak dapat akses

## Separation from Ticketing
- [ ] Laporan manual tidak masuk tabel `reports`
- [ ] Laporan manual tidak muncul di daftar antrean kerja
- [ ] Laporan manual tidak memiliki flow ambil tiket
- [ ] Laporan manual tidak memiliki flow selesai/return/eskalasi
- [ ] Laporan manual tidak mengirim feedback Telegram
- [ ] Laporan Telegram tetap masuk ke `reports`

## Functional Testing
- [ ] Login sebagai Eksekutor
- [ ] Buka menu Laporan Manual
- [ ] Buat laporan manual
- [ ] Simpan laporan
- [ ] Pastikan muncul di daftar laporan manual
- [ ] Pastikan tidak muncul di antrean ticketing
- [ ] Login sebagai Koordinator
- [ ] Buat laporan manual
- [ ] Pastikan tersimpan
- [ ] Login sebagai Super Admin
- [ ] Pastikan semua laporan manual terlihat
- [ ] Login sebagai Supervisor
- [ ] Pastikan akses sesuai rule
- [ ] Kirim laporan Telegram
- [ ] Pastikan flow ticketing tetap berjalan

## Regression Safety
- [ ] F009 tetap berlaku
- [ ] F010 detail modal ticketing tetap berjalan
- [ ] F011 region wording tetap aman
- [ ] F012 optional notes tetap berjalan
- [ ] F013 return feedback tetap berjalan
- [ ] F014 eskalasi DIIT tetap berjalan
- [ ] F015 media Telegram tetap terpisah
- [ ] F016 paste screenshot tetap berjalan
- [ ] Telegram intake tidak berubah
- [ ] Region Switch tidak berubah
- [ ] KPI Supervisor tidak berubah
- [ ] RBAC tidak rusak

## Documentation
- [ ] Screenshot menu Laporan Manual
- [ ] Screenshot form input laporan manual
- [ ] Screenshot daftar laporan manual
- [ ] Screenshot detail laporan manual
- [ ] Screenshot Super Admin melihat laporan manual
- [ ] Catat tabel yang digunakan
- [ ] Catat file yang dibuat
- [ ] Catat file yang diubah
- [ ] Catat hasil testing manual