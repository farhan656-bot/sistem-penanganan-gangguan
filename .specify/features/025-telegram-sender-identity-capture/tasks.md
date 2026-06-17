
---

# `tasks.md`

```md id="vxy5bw"
# Tasks — Telegram Sender Identity Capture

## Feature ID
F025

## Database
- [ ] Pastikan kolom `telegram_sender_id` sudah ada
- [ ] Pastikan kolom `telegram_sender_username` sudah ada
- [ ] Pastikan kolom `telegram_sender_first_name` sudah ada
- [ ] Pastikan kolom `telegram_sender_last_name` sudah ada
- [ ] Jangan jalankan ALTER TABLE lagi
- [ ] Jangan ubah struktur database

## Analysis
- [ ] Cari handler pesan Telegram
- [ ] Cari penggunaan `msg.chat.id`
- [ ] Cari penggunaan `msg.message_id`
- [ ] Cari fungsi create report dari Telegram
- [ ] Cari query insert ke tabel `reports`
- [ ] Cari endpoint detail laporan
- [ ] Cari render modal detail F019

## Telegram Sender Capture
- [ ] Ambil `msg.from.id`
- [ ] Ambil `msg.from.username`
- [ ] Ambil `msg.from.first_name`
- [ ] Ambil `msg.from.last_name`
- [ ] Gunakan optional chaining agar aman
- [ ] Convert sender ID ke string jika perlu
- [ ] Gunakan null jika data tidak tersedia

## Report Insert
- [ ] Kirim data sender ke fungsi create report
- [ ] Tambahkan sender identity pada insert report
- [ ] Pastikan laporan tetap tersimpan jika username kosong
- [ ] Pastikan laporan tetap tersimpan jika last name kosong
- [ ] Pastikan `telegram_chat_id` tetap tersimpan
- [ ] Pastikan `telegram_message_id` tetap tersimpan

## Detail Display
- [ ] Tambahkan sender fields ke query detail laporan
- [ ] Tambahkan sender fields ke response JSON modal
- [ ] Render sender identity di tab Informasi Tiket
- [ ] Tampilkan username dengan `@` jika tersedia
- [ ] Tampilkan nama lengkap jika tersedia
- [ ] Tampilkan Telegram ID jika tersedia
- [ ] Tampilkan fallback jika data pengirim kosong

## Regression Safety
- [ ] Jangan ubah Telegram parsing utama
- [ ] Jangan ubah Telegram media
- [ ] Jangan ubah Telegram feedback
- [ ] Jangan ubah upload evidence
- [ ] Jangan ubah F017 manual report
- [ ] Jangan ubah F018 coordinator access
- [ ] Jangan ubah F019 modal tabs
- [ ] Jangan ubah F021 button cleanup
- [ ] Jangan ubah F022 wording return
- [ ] Jangan ubah F023 validation rules
- [ ] Jangan ubah F024 upload validation

## Testing
- [ ] Kirim laporan Telegram baru
- [ ] Cek `telegram_sender_id` terisi
- [ ] Cek `telegram_sender_username` terisi jika akun punya username
- [ ] Cek `telegram_sender_first_name` terisi
- [ ] Cek `telegram_sender_last_name` terisi jika tersedia
- [ ] Buka modal detail laporan baru
- [ ] Pastikan pengirim Telegram tampil
- [ ] Buka laporan lama
- [ ] Pastikan tidak error
- [ ] Test media Telegram
- [ ] Test feedback Telegram