
---

# `tasks.md`

```md
# Tasks — Telegram Media Popup Tabs

## Feature ID
F019

## Analysis
- [ ] Review `views/partials/report-detail-modal.ejs`
- [ ] Review `public/js/app.js`
- [ ] Review bagian detail modal
- [ ] Review render bukti penyelesaian
- [ ] Review render media Telegram
- [ ] Review render report logs
- [ ] Pastikan F019 hanya mengubah tampilan tab modal

## Search References
- [ ] Cari `report-detail-modal`
- [ ] Cari `Media Telegram`
- [ ] Cari `Bukti Penyelesaian`
- [ ] Cari `attachments`
- [ ] Cari `telegramMedia`
- [ ] Cari `reportLogs`
- [ ] Cari `modal`
- [ ] Cari `nav-tabs`
- [ ] Cari `data-bs-toggle="tab"`

## Modal Tab Structure
- [ ] Tambahkan Bootstrap nav tabs pada modal detail
- [ ] Buat tab Informasi Tiket
- [ ] Buat tab Bukti Penyelesaian
- [ ] Buat tab Media Telegram
- [ ] Buat tab Riwayat Aktivitas
- [ ] Pastikan tab Informasi Tiket aktif default
- [ ] Pastikan tampilan modal tetap rapi

## Ticket Info Tab
- [ ] Pindahkan data utama tiket ke tab Informasi Tiket
- [ ] Tampilkan Ticket ID
- [ ] Tampilkan Order ID
- [ ] Tampilkan Summary
- [ ] Tampilkan Region
- [ ] Tampilkan STO
- [ ] Tampilkan Status
- [ ] Tampilkan assigned user
- [ ] Tampilkan waktu penting

## Completion Evidence Tab
- [ ] Pindahkan Bukti Penyelesaian ke tab khusus
- [ ] Tampilkan hanya bukti non-Telegram
- [ ] Jangan tampilkan source `telegram`
- [ ] Tampilkan empty state jika kosong
- [ ] Pastikan link/preview bukti tetap bisa dibuka

## Telegram Media Tab
- [ ] Pindahkan Media Telegram ke tab khusus
- [ ] Tampilkan hanya media dari Telegram
- [ ] Jangan tampilkan bukti penyelesaian
- [ ] Tampilkan empty state jika kosong
- [ ] Pastikan link/preview media tetap bisa dibuka
- [ ] Jika media dari beberapa sumber Telegram digabung, tetap tampil jelas sebagai Media Telegram

## Activity Log Tab
- [ ] Tampilkan report logs jika tersedia
- [ ] Tampilkan empty state jika tidak ada log
- [ ] Jangan ubah logic log backend
- [ ] Format log tetap rapi

## JavaScript Update
- [ ] Pastikan data modal tetap terisi
- [ ] Pastikan render info tiket masuk tab info
- [ ] Pastikan render bukti masuk tab bukti
- [ ] Pastikan render media masuk tab media Telegram
- [ ] Pastikan render log masuk tab riwayat
- [ ] Reset active tab ke Informasi Tiket setiap modal dibuka
- [ ] Pastikan modal tiket berbeda tidak membawa data lama

## Main Page Cleanup
- [ ] Pastikan Media Telegram tidak tampil terbuka di halaman utama
- [ ] Pastikan Media Telegram hanya dilihat melalui tab modal
- [ ] Jangan hapus data media
- [ ] Jangan ubah query media

## Regression Safety
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah pending media
- [ ] Jangan ubah text enrichment
- [ ] Jangan ubah upload bukti
- [ ] Jangan ubah flow selesai
- [ ] Jangan ubah flow return
- [ ] Jangan ubah eskalasi DIIT
- [ ] Jangan ubah Region Switch
- [ ] Jangan ubah F017 manual report
- [ ] Jangan ubah F018 coordinator access
- [ ] Jangan ubah database

## Functional Testing
- [ ] Login Eksekutor
- [ ] Buka daftar antrean
- [ ] Klik Detail
- [ ] Pastikan modal muncul dengan tab
- [ ] Pastikan tab Informasi Tiket aktif
- [ ] Buka tab Bukti Penyelesaian
- [ ] Pastikan hanya bukti penyelesaian tampil
- [ ] Buka tab Media Telegram
- [ ] Pastikan hanya media Telegram tampil
- [ ] Buka tab Riwayat Aktivitas
- [ ] Pastikan log tampil/empty state
- [ ] Buka tiket lain
- [ ] Pastikan tab reset ke Informasi Tiket
- [ ] Test tiket tanpa media
- [ ] Test tiket tanpa bukti
- [ ] Test tiket dengan keduanya
- [ ] Login Koordinator
- [ ] Test tiket PDG dan BKT
- [ ] Login Supervisor
- [ ] Pastikan read-only

## Documentation
- [ ] Screenshot modal tab Informasi Tiket
- [ ] Screenshot tab Bukti Penyelesaian
- [ ] Screenshot tab Media Telegram
- [ ] Screenshot tab Riwayat Aktivitas
- [ ] Screenshot empty state media
- [ ] Catat file yang diubah
- [ ] Catat hasil testing manual