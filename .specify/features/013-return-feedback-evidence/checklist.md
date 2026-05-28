# Checklist — Return Feedback Evidence

## Telegram Message Checklist
- [ ] Status `perlu_tindak_lanjut` memicu feedback Telegram
- [ ] Pesan menyebut tiket dikembalikan
- [ ] Pesan meminta pelapor melengkapi evidence
- [ ] Ticket ID tampil pada pesan
- [ ] Pesan memiliki format rapi
- [ ] Catatan tampil jika diisi
- [ ] Catatan tidak tampil jika kosong
- [ ] Tidak ada label `Catatan:` kosong

## Return Flow Checklist
- [ ] Status `perlu_tindak_lanjut` tetap dapat dipilih
- [ ] Status tiket tersimpan sesuai logic lama
- [ ] Catatan return tersimpan sesuai logic lama
- [ ] Log aktivitas dibuat
- [ ] Feedback gagal dicatat sesuai mekanisme lama
- [ ] Tiket non-Telegram tidak menyebabkan error

## Non-Telegram Safety Checklist
- [ ] Tiket tanpa `telegram_chat_id` tidak error
- [ ] Tiket tanpa `telegram_message_id` tidak error
- [ ] Feedback dilewati jika data Telegram tidak tersedia
- [ ] Proses status tetap selesai walaupun feedback tidak dikirim

## Regression Checklist
- [ ] Flow `selesai` tidak berubah
- [ ] Status `selesai` tetap bisa tanpa catatan
- [ ] Flow `eskalasi` tidak berubah
- [ ] Tidak ada kode DIIT pada F013
- [ ] Telegram intake tidak berubah
- [ ] Telegram parsing tidak berubah
- [ ] Pending media tidak berubah
- [ ] Text enrichment tidak berubah
- [ ] Region Switch F007 tidak berubah
- [ ] KPI Supervisor tidak berubah
- [ ] Database tidak berubah

## Role Safety Checklist
- [ ] Eksekutor yang berhak tetap dapat memproses tiket
- [ ] Eksekutor yang tidak berhak tetap tidak dapat memproses tiket
- [ ] Koordinator tidak mendapat akses baru
- [ ] Supervisor tetap read-only
- [ ] Super Admin tidak mendapat akses baru
- [ ] Middleware role tidak berubah

## Manual Verification Checklist
- [ ] Login sebagai Eksekutor
- [ ] Ambil tiket Telegram
- [ ] Pilih status `perlu_tindak_lanjut`
- [ ] Isi catatan return
- [ ] Submit
- [ ] Cek pesan Telegram
- [ ] Pastikan pesan menyebut tiket dikembalikan
- [ ] Pastikan pesan meminta evidence dilengkapi
- [ ] Pastikan catatan tampil
- [ ] Ulangi tanpa catatan jika memungkinkan
- [ ] Test tiket non-Telegram jika ada
- [ ] Cek log aktivitas
- [ ] Test status `selesai`
- [ ] Test status `eskalasi`
- [ ] Test Telegram intake baru
- [ ] Login sebagai Supervisor
- [ ] Pastikan dashboard tetap read-only

## Evidence Checklist
- [ ] Screenshot pesan Telegram return dengan catatan
- [ ] Screenshot pesan Telegram return tanpa catatan jika ada
- [ ] Screenshot status tiket `perlu_tindak_lanjut`
- [ ] Screenshot log aktivitas
- [ ] Screenshot dashboard supervisor tetap read-only
- [ ] Catatan file yang berubah
- [ ] Catatan hasil testing manual