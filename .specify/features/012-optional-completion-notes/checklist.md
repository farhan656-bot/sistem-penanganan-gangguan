# Checklist — Optional Completion Notes

## UI Checklist
- [ ] Field catatan penyelesaian tampil
- [ ] Label menjadi `Catatan Penyelesaian (Opsional)`
- [ ] Helper text menjelaskan catatan hanya diisi jika diperlukan
- [ ] Field catatan tidak memiliki required permanen untuk status `selesai`
- [ ] Tombol selesai tetap tampil
- [ ] Form tetap rapi
- [ ] Tidak ada field baru

## Completion Validation Checklist
- [ ] Status `selesai` dapat dipilih
- [ ] Catatan boleh kosong untuk status `selesai`
- [ ] Catatan berisi spasi diperlakukan sebagai kosong
- [ ] Tiket berhasil selesai tanpa catatan
- [ ] Tiket berhasil selesai dengan catatan
- [ ] Catatan tersimpan jika diisi
- [ ] Sistem tidak menampilkan error catatan wajib untuk status `selesai`

## Data Update Checklist
- [ ] Status tiket berubah menjadi `selesai`
- [ ] `completion_status` tersimpan
- [ ] `completion_notes` boleh kosong atau NULL
- [ ] `resolved_at` tersimpan
- [ ] `closed_at` tersimpan
- [ ] Tidak ada perubahan struktur database
- [ ] Tidak ada migration/ALTER TABLE

## Log Checklist
- [ ] Log penyelesaian dibuat
- [ ] Log tetap dibuat walaupun catatan kosong
- [ ] Log tidak menyebabkan error saat catatan kosong
- [ ] Log tetap sesuai format lama

## Telegram Feedback Checklist
- [ ] Feedback selesai tetap dikirim untuk tiket Telegram
- [ ] Feedback selesai tidak menampilkan blok catatan jika catatan kosong
- [ ] Feedback selesai menampilkan catatan jika catatan diisi
- [ ] Tiket non-Telegram tidak menyebabkan error
- [ ] Feedback `perlu_tindak_lanjut` tidak berubah
- [ ] Feedback `eskalasi` tidak berubah

## Status Safety Checklist
- [ ] Flow `perlu_tindak_lanjut` tidak berubah
- [ ] Flow `eskalasi` tidak berubah
- [ ] Flow ambil tugas tidak berubah
- [ ] Flow delegasi tidak berubah
- [ ] Flow Region Switch F007 tidak berubah
- [ ] Telegram intake tidak berubah
- [ ] KPI Supervisor tidak berubah

## Role Safety Checklist
- [ ] Eksekutor yang berhak tetap dapat menyelesaikan tiket
- [ ] Eksekutor yang tidak berhak tetap tidak dapat menyelesaikan tiket
- [ ] Koordinator tidak mendapat akses baru
- [ ] Supervisor tetap read-only
- [ ] Super Admin tidak mendapat akses baru
- [ ] Middleware role tidak berubah

## Manual Verification Checklist
- [ ] Login sebagai Eksekutor
- [ ] Ambil tiket tersedia
- [ ] Selesaikan tiket status `selesai` tanpa catatan
- [ ] Pastikan berhasil
- [ ] Ambil tiket lain
- [ ] Selesaikan tiket status `selesai` dengan catatan
- [ ] Pastikan catatan tersimpan
- [ ] Cek log aktivitas
- [ ] Cek feedback Telegram selesai jika tiket berasal dari Telegram
- [ ] Test status `perlu_tindak_lanjut`
- [ ] Test status `eskalasi`
- [ ] Login sebagai Supervisor
- [ ] Pastikan dashboard tetap read-only

## Evidence Checklist
- [ ] Screenshot form catatan opsional
- [ ] Screenshot tiket selesai tanpa catatan
- [ ] Screenshot tiket selesai dengan catatan
- [ ] Screenshot log aktivitas selesai
- [ ] Screenshot feedback Telegram selesai jika ada
- [ ] Catatan file yang berubah
- [ ] Catatan hasil testing manual