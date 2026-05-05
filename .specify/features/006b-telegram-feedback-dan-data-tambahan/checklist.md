# Checklist — Telegram Feedback dan Data Tambahan

## Feedback Checklist
- [ ] Bot mengirim pesan assigned saat tiket diambil
- [ ] Bot mengirim pesan in-progress saat tiket dikerjakan
- [ ] Bot mengirim pesan selesai saat tiket selesai
- [ ] Feedback menggunakan ticket ID dan order ID yang benar

## Additional Data Checklist
- [ ] Data tambahan untuk ticket ID yang ada berhasil diterima
- [ ] Bot membalas “Data Tambahan Diterima”
- [ ] Data tambahan tidak membuat tiket baru
- [ ] Data tambahan tercatat ke sistem

## Media Checklist
- [ ] Media/foto dasar bisa diterima
- [ ] Metadata media tersimpan atau tercatat
- [ ] Media dikaitkan ke tiket yang benar jika ticket ID dikenali

## Error Handling Checklist
- [ ] Unknown ticket ID pada data tambahan ditolak
- [ ] Feedback failure tidak merusak transaksi utama
- [ ] Error log tercatat saat kirim Telegram gagal

## Logging Checklist
- [ ] `telegram_feedback_assigned` tercatat
- [ ] `telegram_feedback_in_progress` tercatat
- [ ] `telegram_feedback_completed` tercatat
- [ ] `telegram_additional_data_received` tercatat

## Evidence Checklist
- [ ] Screenshot assigned feedback
- [ ] Screenshot in-progress feedback
- [ ] Screenshot completed feedback
- [ ] Screenshot “Data Tambahan Diterima”
- [ ] Screenshot log integrasi Telegram