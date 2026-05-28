# Tasks — Optional Completion Notes

## Feature ID
F012

## Analysis
- [ ] Review constitution project
- [ ] Review copilot/custom instructions
- [ ] Review flow penyelesaian tiket
- [ ] Review form penyelesaian tiket
- [ ] Review controller penyelesaian tiket
- [ ] Review model update penyelesaian tiket
- [ ] Review report logs
- [ ] Review Telegram feedback status selesai
- [ ] Pastikan F012 hanya mengubah catatan opsional untuk status selesai

## Search References
- [ ] Cari teks `completion_notes`
- [ ] Cari teks `catatan penyelesaian`
- [ ] Cari teks `Catatan Penyelesaian`
- [ ] Cari teks `required`
- [ ] Cari teks `wajib`
- [ ] Cari teks `completion_status`
- [ ] Cari teks `selesai`
- [ ] Cari function controller untuk menyelesaikan tiket
- [ ] Cari query update report completion

## UI Form Update
- [ ] Buka view form penyelesaian tiket
- [ ] Cari field catatan penyelesaian
- [ ] Ubah label menjadi `Catatan Penyelesaian (Opsional)`
- [ ] Tambahkan helper text bahwa catatan hanya diisi jika diperlukan
- [ ] Hapus atribut `required` permanen pada field catatan
- [ ] Pastikan status `selesai` bisa dipilih
- [ ] Pastikan form tetap rapi
- [ ] Jangan tambahkan field baru

## Backend Validation
- [ ] Buka controller penyelesaian tiket
- [ ] Cari validasi catatan wajib
- [ ] Ubah validasi agar `completion_notes` boleh kosong jika `completion_status === 'selesai'`
- [ ] Trim nilai `completion_notes`
- [ ] Jika hanya spasi, perlakukan sebagai kosong
- [ ] Simpan catatan jika diisi
- [ ] Jangan ubah validasi status `perlu_tindak_lanjut`
- [ ] Jangan ubah validasi status `eskalasi`
- [ ] Pastikan validasi hak akses Eksekutor tetap berjalan

## Model Update
- [ ] Buka model update report completion
- [ ] Pastikan query bisa menerima catatan kosong atau NULL
- [ ] Pastikan `completion_status` tetap tersimpan
- [ ] Pastikan status tiket tetap berubah menjadi `selesai`
- [ ] Pastikan `resolved_at` tetap tersimpan
- [ ] Pastikan `closed_at` tetap tersimpan
- [ ] Jangan ubah struktur database
- [ ] Jangan ubah query yang tidak berkaitan

## Report Log
- [ ] Pastikan log penyelesaian tetap dibuat
- [ ] Pastikan log tetap dibuat meskipun catatan kosong
- [ ] Jika catatan ada, boleh ikut dicatat
- [ ] Jangan hapus log lama
- [ ] Jangan ubah jenis log yang tidak berkaitan

## Telegram Feedback Selesai
- [ ] Review feedback Telegram untuk status `selesai`
- [ ] Pastikan feedback selesai tetap dikirim jika tiket berasal dari Telegram
- [ ] Jika pesan menampilkan catatan, tampilkan hanya jika catatan ada
- [ ] Jangan tampilkan label catatan kosong
- [ ] Jangan ubah feedback `perlu_tindak_lanjut`
- [ ] Jangan ubah feedback `eskalasi`
- [ ] Pastikan jika tiket bukan dari Telegram tidak error

## RBAC Safety
- [ ] Pastikan hanya Eksekutor yang berhak dapat menyelesaikan tiket sesuai rule lama
- [ ] Supervisor tetap read-only
- [ ] Koordinator tidak mendapat akses baru
- [ ] Super Admin tidak mendapat akses baru
- [ ] Middleware role tidak berubah

## Regression Safety
- [ ] Jangan ubah flow ambil tiket
- [ ] Jangan ubah flow delegasi
- [ ] Jangan ubah flow region switch
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah KPI Supervisor
- [ ] Jangan ubah database

## Functional Testing
- [ ] Login sebagai Eksekutor
- [ ] Ambil tiket tersedia
- [ ] Buka form penyelesaian
- [ ] Pilih status `selesai`
- [ ] Kosongkan catatan
- [ ] Submit penyelesaian
- [ ] Pastikan tiket berhasil selesai
- [ ] Pastikan status menjadi `selesai`
- [ ] Pastikan `resolved_at` terisi
- [ ] Pastikan `closed_at` terisi
- [ ] Pastikan log aktivitas dibuat
- [ ] Ulangi dengan catatan diisi
- [ ] Pastikan catatan tersimpan
- [ ] Test tiket Telegram dan pastikan feedback selesai terkirim
- [ ] Pastikan feedback tidak menampilkan catatan kosong
- [ ] Test status `perlu_tindak_lanjut` tetap seperti sebelumnya
- [ ] Test status `eskalasi` tetap seperti sebelumnya
- [ ] Login sebagai Supervisor dan pastikan read-only

## Documentation
- [ ] Screenshot form dengan label catatan opsional
- [ ] Screenshot tiket selesai tanpa catatan
- [ ] Screenshot log aktivitas selesai
- [ ] Screenshot feedback Telegram selesai jika ada
- [ ] Catat file view yang berubah
- [ ] Catat file controller yang berubah
- [ ] Catat file model/service yang berubah jika ada
- [ ] Catat hasil testing manual