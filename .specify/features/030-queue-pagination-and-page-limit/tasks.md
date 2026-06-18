
---

# `tasks.md`

```md
# Tasks — Queue Pagination and Page Limit

## Feature ID
F030

## Analysis
- [x] Review daftar antrean kerja
- [x] Review controller daftar laporan
- [x] Review model query laporan
- [x] Review filter work_status F029
- [x] Review filter wilayah
- [x] Review filter search
- [x] Review role access
- [x] Review smooth action F027
- [x] Review tombol Detail F019

## Pagination Parameters
- [x] Tambahkan query parameter `page`
- [x] Tambahkan query parameter `per_page`
- [x] Default page = 1
- [x] Default per_page = 10
- [x] Batasi per_page hanya 10, 25, 50
- [x] Cegah page kurang dari 1
- [x] Hitung offset

## Model
- [x] Tambahkan limit pada query list
- [x] Tambahkan offset pada query list
- [x] Tambahkan count total data
- [x] Pastikan count memakai filter yang sama
- [x] Pastikan count tidak memakai limit/offset
- [x] Pastikan role access tetap berjalan
- [x] Pastikan filter work_status tetap berjalan
- [x] Pastikan filter wilayah/search tetap berjalan

## Controller
- [x] Baca page dari query
- [x] Baca per_page dari query
- [x] Validasi page/per_page
- [x] Kirim limit/offset ke model
- [x] Ambil totalItems
- [x] Hitung totalPages
- [x] Buat object pagination
- [x] Kirim pagination ke view
- [x] Jika page melebihi totalPages, tangani dengan aman

## View
- [x] Tambahkan info jumlah data
- [x] Tambahkan selector per_page
- [x] Tambahkan tombol Previous
- [x] Tambahkan nomor halaman
- [x] Tambahkan tombol Next
- [x] Disable Previous di page pertama
- [x] Disable Next di page terakhir
- [x] Pertahankan query string filter
- [x] Reset page ke 1 saat pindah tab status
- [x] Tampilkan empty state jika tidak ada data

## Preserve Existing Features
- [x] Tab status F029 tetap berjalan
- [x] Detail modal F019 tetap berjalan
- [x] Kerjakan smooth F027 tetap berjalan
- [x] Tombol F026 tetap rapi
- [x] Assigned To tetap tampil
- [x] Filter wilayah tetap berjalan
- [x] Search tetap berjalan
- [x] Koordinator PDG/BKT tetap berjalan
- [x] Eksekutor region/switch tetap berjalan

## Regression Safety
- [x] Jangan ubah database
- [x] Jangan ubah Telegram intake
- [x] Jangan ubah Telegram parsing
- [x] Jangan ubah upload file
- [x] Jangan ubah F017
- [x] Jangan ubah F018
- [x] Jangan ubah F019
- [x] Jangan ubah F021
- [x] Jangan ubah F022
- [x] Jangan ubah F023
- [x] Jangan ubah F024
- [x] Jangan ubah F025
- [x] Jangan ubah F026
- [x] Jangan ubah F027
- [x] Jangan ubah F029

## Testing
- [x] Test default 10 data
- [x] Test per_page 25
- [x] Test per_page 50
- [x] Test page 2
- [x] Test Previous
- [x] Test Next
- [x] Test tab Tersedia dengan pagination
- [x] Test tab Sedang Dikerjakan dengan pagination
- [x] Test tab Selesai dengan pagination
- [x] Test filter wilayah dengan pagination
- [x] Test search dengan pagination
- [x] Test Eksekutor
- [x] Test Koordinator
- [x] Test Supervisor
- [x] Test Detail modal
- [x] Test Kerjakan smooth
