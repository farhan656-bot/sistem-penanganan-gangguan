# Checklist — Telegram Sender Identity Capture

## Database Checklist
- [ ] Kolom sender identity tersedia
- [ ] Tidak ada ALTER TABLE baru
- [ ] Tidak ada perubahan database tambahan

## Capture Checklist
- [ ] `msg.from.id` tersimpan
- [ ] `msg.from.username` tersimpan jika tersedia
- [ ] `msg.from.first_name` tersimpan jika tersedia
- [ ] `msg.from.last_name` tersimpan jika tersedia
- [ ] Sistem aman jika username kosong
- [ ] Sistem aman jika last name kosong
- [ ] Sistem aman jika `msg.from` tidak lengkap

## Display Checklist
- [ ] Pengirim Telegram tampil di modal detail
- [ ] Username tampil dengan format `@username`
- [ ] Nama pengirim tampil
- [ ] Telegram ID tampil
- [ ] Laporan lama menampilkan fallback
- [ ] Modal tidak error jika data kosong

## Regression Checklist
- [ ] Telegram intake tetap berjalan
- [ ] Telegram parsing tetap berjalan
- [ ] Media Telegram tetap berjalan
- [ ] Feedback Telegram tetap berjalan
- [ ] F019 modal tabs tetap berjalan
- [ ] Upload bukti tetap berjalan
- [ ] Database tidak berubah lagi

## Manual Testing Checklist
- [ ] Kirim laporan Telegram baru
- [ ] Cek database `reports`
- [ ] Cek modal detail
- [ ] Cek laporan lama
- [ ] Cek akun dengan username
- [ ] Cek akun tanpa username jika memungkinkan
- [ ] Cek media Telegram
- [ ] Cek feedback Telegram