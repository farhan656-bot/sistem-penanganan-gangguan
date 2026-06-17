
---

# `tasks.md`

```md
# Tasks — File Upload Storage Strategy

## Feature ID
F024

## Analysis
- [ ] Cari konfigurasi multer
- [ ] Cari folder upload saat ini
- [ ] Cari flow upload bukti penyelesaian
- [ ] Cari flow paste screenshot F016
- [ ] Cari flow media Telegram
- [ ] Cari insert ke report_attachments
- [ ] Pastikan file tidak disimpan binary di database

## Upload Limit
- [ ] Tambahkan batas ukuran file
- [ ] Rekomendasi 5 MB per file
- [ ] Tambahkan batas jumlah file
- [ ] Rekomendasi maksimal 5 file per upload
- [ ] Pastikan upload valid tetap berjalan

## File Type Validation
- [ ] Izinkan jpg
- [ ] Izinkan jpeg
- [ ] Izinkan png
- [ ] Izinkan webp
- [ ] Izinkan pdf
- [ ] Tolak exe
- [ ] Tolak bat
- [ ] Tolak cmd
- [ ] Tolak sh
- [ ] Tolak js
- [ ] Tolak php
- [ ] Tolak zip/rar/7z jika tidak dibutuhkan

## Safe Storage
- [ ] Gunakan nama file aman
- [ ] Hindari overwrite file
- [ ] Hindari path traversal
- [ ] Pastikan folder upload tersedia
- [ ] Simpan file ke folder upload
- [ ] Simpan path/metadata ke database

## Error Handling
- [ ] Tampilkan pesan jika file terlalu besar
- [ ] Tampilkan pesan jika tipe file tidak diizinkan
- [ ] Tampilkan pesan jika jumlah file terlalu banyak
- [ ] Jangan membuat server crash
- [ ] Jangan menyimpan metadata jika file gagal

## Preserve Existing Features
- [ ] Upload bukti penyelesaian tetap berjalan
- [ ] Paste screenshot tetap berjalan
- [ ] Media Telegram tetap berjalan
- [ ] Tab Bukti Penyelesaian F019 tetap menampilkan bukti
- [ ] Tab Media Telegram F019 tetap menampilkan media
- [ ] F023 validasi catatan/bukti/DIIT tetap berjalan

## Regression Safety
- [ ] Jangan ubah database
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah F017 manual report
- [ ] Jangan ubah F018 coordinator access
- [ ] Jangan ubah F019 modal tabs
- [ ] Jangan ubah F021 button cleanup
- [ ] Jangan ubah F022 wording return
- [ ] Jangan ubah F023 validation rules

## Testing
- [ ] Upload JPG valid
- [ ] Upload PNG valid
- [ ] Upload PDF valid
- [ ] Upload file > 5 MB
- [ ] Upload EXE
- [ ] Upload ZIP
- [ ] Upload lebih dari 5 file
- [ ] Paste screenshot
- [ ] Kirim media Telegram
- [ ] Cek database metadata/path
- [ ] Cek file tersimpan di folder upload