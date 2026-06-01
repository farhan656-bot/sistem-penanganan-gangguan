# Checklist — Paste Screenshot Evidence Upload

## UI Checklist
- [ ] Area paste screenshot tersedia
- [ ] Helper text menjelaskan Ctrl + V
- [ ] Upload manual tetap tersedia
- [ ] Preview screenshot tampil setelah paste
- [ ] Status message tampil jika screenshot berhasil ditambahkan
- [ ] Form tetap rapi
- [ ] Tidak ada perubahan layout besar

## Paste Screenshot Checklist
- [ ] Ctrl + V dengan gambar berhasil terdeteksi
- [ ] File image dari clipboard berhasil masuk ke input upload
- [ ] Nama file default dibuat
- [ ] Preview tampil
- [ ] File ikut terkirim saat form submit
- [ ] Paste teks biasa tidak menyebabkan error
- [ ] Paste file non-image tidak menyebabkan error

## Manual Upload Checklist
- [ ] Upload manual tetap berjalan
- [ ] Preview manual upload tetap tampil jika ada
- [ ] Manual upload setelah paste tetap bisa dilakukan
- [ ] Paste setelah manual upload tetap bisa dilakukan
- [ ] Tidak ada error input file

## Evidence Storage Checklist
- [ ] Screenshot hasil paste tersimpan sebagai bukti penyelesaian
- [ ] Screenshot tampil di bagian Bukti Penyelesaian
- [ ] Screenshot tidak tampil di Media Telegram
- [ ] Source file bukan `telegram`
- [ ] F015 tetap berjalan

## Backend Safety Checklist
- [ ] Controller upload tidak rusak
- [ ] Route penyelesaian tidak rusak
- [ ] Multer tetap menerima file
- [ ] Validasi ukuran tetap berjalan
- [ ] Validasi tipe file tetap berjalan
- [ ] Database tidak berubah

## Regression Checklist
- [ ] Flow selesai F012 tetap berjalan
- [ ] Return evidence F013 tetap berjalan
- [ ] Eskalasi DIIT F014 tetap berjalan
- [ ] Detail modal tetap berjalan
- [ ] Media Telegram tetap terpisah
- [ ] Telegram intake tidak berubah
- [ ] Pending media tidak berubah
- [ ] Region Switch F007 tidak berubah
- [ ] KPI Supervisor tidak berubah
- [ ] RBAC tidak berubah

## Manual Verification Checklist
- [ ] Login sebagai Eksekutor
- [ ] Ambil tiket
- [ ] Buka form penyelesaian
- [ ] Ambil screenshot
- [ ] Klik area paste
- [ ] Tekan Ctrl + V
- [ ] Pastikan preview tampil
- [ ] Submit penyelesaian
- [ ] Buka detail penuh
- [ ] Pastikan screenshot tampil di Bukti Penyelesaian
- [ ] Pastikan tidak tampil di Media Telegram
- [ ] Test upload manual
- [ ] Test paste teks biasa
- [ ] Test status perlu_tindak_lanjut
- [ ] Test status eskalasi DIIT
- [ ] Test detail modal

## Evidence Checklist
- [ ] Screenshot area paste
- [ ] Screenshot preview paste
- [ ] Screenshot bukti hasil paste di detail
- [ ] Screenshot Media Telegram tetap terpisah
- [ ] Catatan file yang berubah
- [ ] Catatan hasil testing manual