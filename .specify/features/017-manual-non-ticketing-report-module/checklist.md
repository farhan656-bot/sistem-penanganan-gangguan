# Checklist — Manual Non-Ticketing Report Module

## Database Checklist
- [ ] Tabel `manual_non_ticketing_reports` tersedia
- [ ] Tabel tidak dibuat ulang
- [ ] Struktur tabel tidak diubah
- [ ] Data laporan manual masuk ke `manual_non_ticketing_reports`
- [ ] Data laporan manual tidak masuk ke `reports`
- [ ] Tidak ada perubahan tabel Telegram/media
- [ ] Tidak ada perubahan tabel region switch

## Access Checklist
- [ ] Eksekutor dapat mengakses menu Laporan Manual
- [ ] Eksekutor dapat membuat laporan manual
- [ ] Eksekutor melihat laporan manual miliknya
- [ ] Koordinator dapat mengakses menu Laporan Manual
- [ ] Koordinator dapat membuat laporan manual
- [ ] Koordinator melihat laporan manual miliknya
- [ ] Super Admin dapat melihat semua laporan manual
- [ ] User tidak login tidak dapat akses
- [ ] Role tidak sesuai tidak dapat akses

## UI Checklist
- [ ] Menu Laporan Manual muncul pada role yang tepat
- [ ] Halaman daftar laporan manual tersedia
- [ ] Form input laporan manual tersedia
- [ ] Detail laporan manual tersedia
- [ ] Form tidak terlalu padat
- [ ] Details menggunakan textarea
- [ ] Incident menggunakan textarea
- [ ] Tabel daftar responsif
- [ ] Empty state tersedia jika data kosong

## Field Checklist
- [ ] Tanggal tersedia
- [ ] Details tersedia
- [ ] OrderID OSM tersedia
- [ ] STO tersedia
- [ ] SC tersedia
- [ ] OrderID / NCX-ID tersedia
- [ ] NCLI tersedia
- [ ] Nama Customer tersedia
- [ ] Nama Alpro Before tersedia
- [ ] Nama Alpro tersedia
- [ ] Ticket Incident tersedia
- [ ] Incident tersedia
- [ ] Witel tersedia
- [ ] K-Kontak tersedia
- [ ] User ID tersedia
- [ ] Tipe Transaksi tersedia
- [ ] Jenis Fallout tersedia
- [ ] Aktivitas tersedia
- [ ] Pengerjaan tersedia
- [ ] Ticket Resolved tersedia
- [ ] Ticket Resolved 2 tersedia
- [ ] S/E tersedia

## Separation Checklist
- [ ] Laporan manual tidak muncul di antrean ticketing
- [ ] Laporan manual tidak memiliki tombol Ambil
- [ ] Laporan manual tidak memiliki tombol Selesai
- [ ] Laporan manual tidak memiliki tombol Return
- [ ] Laporan manual tidak memiliki tombol Eskalasi
- [ ] Laporan manual tidak mengirim Telegram feedback
- [ ] Input manual ticketing lama tidak muncul kembali

## Regression Checklist
- [ ] Bot Telegram tetap menerima laporan ticketing
- [ ] Daftar antrean ticketing tetap berjalan
- [ ] Detail modal ticketing tetap berjalan
- [ ] Upload bukti tetap berjalan
- [ ] Paste screenshot tetap berjalan
- [ ] Media Telegram tetap terpisah
- [ ] Region Switch tetap berjalan
- [ ] Dashboard Supervisor tetap berjalan
- [ ] RBAC tidak rusak

## Manual Testing Checklist
- [ ] Login Eksekutor
- [ ] Buat laporan manual
- [ ] Simpan laporan manual
- [ ] Buka daftar laporan manual
- [ ] Buka detail laporan manual
- [ ] Login Koordinator
- [ ] Buat laporan manual
- [ ] Login Super Admin
- [ ] Lihat semua laporan manual
- [ ] Kirim laporan Telegram
- [ ] Pastikan laporan Telegram tetap masuk antrean ticketing

## Evidence Checklist
- [ ] Screenshot menu Laporan Manual
- [ ] Screenshot form laporan manual
- [ ] Screenshot daftar laporan manual
- [ ] Screenshot detail laporan manual
- [ ] Screenshot Super Admin melihat laporan manual
- [ ] Catatan file yang dibuat
- [ ] Catatan hasil testing