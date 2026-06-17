
---

# `tasks.md`

```md id="eo3dbx"
# Tasks — Smooth Ticket Action UX

## Feature ID
F027

## Analysis
- [ ] Cari tombol Kerjakan
- [ ] Cari tombol Ambil
- [ ] Cari tombol Tandai Sedang Dikerjakan
- [ ] Cari form POST aksi cepat
- [ ] Cari route aksi cepat
- [ ] Cari controller action terkait
- [ ] Cari JS existing untuk modal/detail
- [ ] Pastikan tombol Detail F019 tidak terganggu

## Frontend Action Handling
- [ ] Tambahkan class JS untuk tombol aksi cepat
- [ ] Tambahkan data-action-url
- [ ] Tambahkan data-report-id
- [ ] Tambahkan data-action-type
- [ ] Buat event listener click
- [ ] Prevent default untuk aksi cepat
- [ ] Kirim POST dengan fetch
- [ ] Disable tombol saat proses
- [ ] Cegah double click
- [ ] Tampilkan loading state

## Backend JSON Support
- [ ] Deteksi request AJAX atau Accept JSON
- [ ] Untuk request AJAX, return JSON sukses
- [ ] Untuk request AJAX error, return JSON error
- [ ] Untuk request normal, tetap redirect seperti sebelumnya
- [ ] Jangan ubah logic utama aksi

## UI Feedback
- [ ] Tampilkan pesan sukses
- [ ] Tampilkan pesan error
- [ ] Update badge status jika memungkinkan
- [ ] Update assigned user jika memungkinkan
- [ ] Update tombol aksi jika memungkinkan
- [ ] Jika update row sulit, reload dengan scroll restore

## Scroll Restore Fallback
- [ ] Simpan scroll sebelum submit biasa
- [ ] Restore scroll setelah reload
- [ ] Pertahankan filter query string
- [ ] Jangan kembali ke atas

## Preserve Existing Features
- [ ] Tombol Detail tetap membuka modal
- [ ] Modal F019 tetap berjalan
- [ ] F026 layout tombol tetap rapi
- [ ] Role Eksekutor tetap aman
- [ ] Role Koordinator tetap aman
- [ ] Supervisor tetap read-only

## Regression Safety
- [ ] Jangan ubah database
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah upload file
- [ ] Jangan ubah F017
- [ ] Jangan ubah F018
- [ ] Jangan ubah F019
- [ ] Jangan ubah F021
- [ ] Jangan ubah F022
- [ ] Jangan ubah F023
- [ ] Jangan ubah F024
- [ ] Jangan ubah F025
- [ ] Jangan ubah F026

## Testing
- [ ] Test Kerjakan sebagai Eksekutor
- [ ] Test Tandai Sedang Dikerjakan jika tersedia
- [ ] Test aksi cepat sebagai Koordinator
- [ ] Test posisi scroll tidak kembali ke atas
- [ ] Test double click
- [ ] Test error handling
- [ ] Test tombol Detail
- [ ] Test filter aktif