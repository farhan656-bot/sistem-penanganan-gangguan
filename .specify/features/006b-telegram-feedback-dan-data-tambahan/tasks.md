# Tasks — Telegram Feedback dan Data Tambahan

## Feature ID
F006B

## Preparation
- [ ] Review hasil F006A
- [ ] Pastikan bot polling aktif
- [ ] Pastikan tiket Telegram menyimpan `telegram_chat_id`

## Feedback Service
- [ ] Review `services/telegramBotService.js`
- [ ] Tambahkan fungsi kirim feedback assigned
- [ ] Tambahkan fungsi kirim feedback in-progress
- [ ] Tambahkan fungsi kirim feedback completed
- [ ] Pastikan semua fungsi aman jika `telegram_chat_id` kosong
- [ ] Pastikan error kirim feedback tidak merusak transaksi utama

## Report Model
- [ ] Tambahkan helper untuk ambil telegram metadata tiket
- [ ] Tambahkan penyimpanan log feedback Telegram
- [ ] Tambahkan mekanisme penyimpanan data tambahan
- [ ] Pastikan data tambahan tidak membuat tiket baru jika ticket ID sudah ada

## Report Controller
- [ ] Review `takeReport()`
- [ ] Trigger feedback assigned setelah sukses
- [ ] Review alur in-progress jika ada
- [ ] Trigger feedback in-progress setelah sukses
- [ ] Review `completeReport()`
- [ ] Trigger feedback completed setelah sukses

## Telegram Intake Extension
- [ ] Update parser agar bisa membedakan tiket baru vs data tambahan
- [ ] Tambahkan alur “Data Tambahan Diterima”
- [ ] Tambahkan validasi ticket ID pada data tambahan
- [ ] Tambahkan error message bila ticket ID tidak ditemukan

## Media / Photo Baseline
- [ ] Tambahkan baseline handling untuk pesan foto/media
- [ ] Simpan metadata media jika ticket ID bisa dikenali
- [ ] Pastikan belum ada OCR atau parsing file

## Logging
- [ ] Catat log feedback assigned
- [ ] Catat log feedback in-progress
- [ ] Catat log feedback completed
- [ ] Catat log additional data received
- [ ] Catat log feedback failure

## Manual Testing
- [ ] Test assigned feedback
- [ ] Test in-progress feedback
- [ ] Test completed feedback
- [ ] Test additional data merge
- [ ] Test additional data unknown ticket
- [ ] Test photo/media baseline
- [ ] Test failure handling when Telegram send fails

## Documentation
- [ ] Simpan screenshot feedback assigned
- [ ] Simpan screenshot feedback in-progress
- [ ] Simpan screenshot feedback completed
- [ ] Simpan screenshot “Data Tambahan Diterima”
- [ ] Catat file yang berubah untuk BAB IV