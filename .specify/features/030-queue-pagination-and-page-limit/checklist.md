# Checklist — Queue Pagination and Page Limit

## Pagination Checklist
- [x] Default tampil 10 tiket per halaman
- [x] Pilihan 10 tersedia
- [x] Pilihan 25 tersedia
- [x] Pilihan 50 tersedia
- [x] Previous tersedia
- [x] Next tersedia
- [x] Nomor halaman tersedia
- [x] Previous disabled di halaman pertama
- [x] Next disabled di halaman terakhir
- [x] Info jumlah data tampil

## Query Checklist
- [x] page dibaca dari query string
- [x] per_page dibaca dari query string
- [x] per_page tidak valid fallback ke 10
- [x] page kurang dari 1 fallback ke 1
- [x] LIMIT diterapkan
- [x] OFFSET diterapkan
- [x] Count total data benar

## Filter Preservation Checklist
- [x] work_status F029 tetap dipertahankan
- [x] wilayah tetap dipertahankan
- [x] search/keyword tetap dipertahankan
- [x] assigned filter jika ada tetap dipertahankan
- [x] page reset ke 1 saat pindah tab
- [x] per_page tetap ikut saat pindah halaman

## Access Checklist
- [x] Eksekutor tetap melihat data sesuai akses
- [x] Region switch Eksekutor tetap aman
- [x] Koordinator tetap melihat PDG/BKT
- [x] Supervisor tetap read-only
- [x] Super Admin tetap aman

## Feature Safety Checklist
- [x] F029 tabs tetap berjalan
- [x] Modal F019 tetap berjalan
- [x] Smooth action F027 tetap berjalan
- [x] Tombol F026 tetap rapi
- [x] Assigned To tetap tampil
- [x] Telegram tidak berubah
- [x] Database tidak berubah

## Manual Testing Checklist
- [x] Login Eksekutor
- [x] Test pagination semua tab
- [x] Login Koordinator
- [x] Test pagination PDG/BKT
- [x] Login Supervisor
- [x] Pastikan read-only
- [x] Test Detail
- [x] Test Kerjakan
- [x] Test filter + pagination
- [x] Test search + pagination
