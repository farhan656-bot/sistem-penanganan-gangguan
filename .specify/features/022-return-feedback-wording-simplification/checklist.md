# Checklist — Return Feedback Wording Simplification

## Wording Checklist
- [ ] Pesan return tidak mengandung "Mohon lengkapi evidence"
- [ ] Pesan return tidak mengandung "lengkapi evidence"
- [ ] Pesan return menampilkan catatan dari sistem
- [ ] Pesan return tetap mudah dipahami
- [ ] Tidak ada permintaan evidence otomatis

## Flow Checklist
- [ ] Return oleh Eksekutor tetap berjalan
- [ ] Return oleh Koordinator tetap berjalan
- [ ] Status menjadi `perlu_tindak_lanjut`
- [ ] Log return tetap tercatat
- [ ] Telegram feedback return tetap terkirim

## Regression Checklist
- [ ] Pesan selesai tidak rusak
- [ ] Pesan eskalasi tidak rusak
- [ ] Kode DIIT tetap wajib untuk eskalasi
- [ ] Upload bukti tetap opsional
- [ ] Telegram intake tidak berubah
- [ ] Database tidak berubah
- [ ] F017 tidak berubah
- [ ] F018 tidak berubah
- [ ] F019 tidak berubah
- [ ] F021 tidak berubah

## Manual Testing Checklist
- [ ] Return tiket sebagai Eksekutor
- [ ] Return tiket sebagai Koordinator
- [ ] Cek pesan Telegram
- [ ] Cek report logs
- [ ] Cek status tiket
- [ ] Test selesai
- [ ] Test eskalasi