# Feature Spec — Queue Pagination and Page Limit

## Feature ID
F030

## Feature Name
Queue Pagination and Page Limit

## Summary
Fitur ini menambahkan pagination dan pembatasan jumlah tiket yang tampil pada halaman Daftar Antrean Kerja. Tujuannya agar daftar tiket tidak terlalu panjang ke bawah, halaman lebih ringan, dan pengguna dapat berpindah antar halaman dengan nyaman tanpa kehilangan filter atau tab status yang sedang aktif.

## Business Background
Daftar antrean kerja dapat berisi banyak tiket. Jika seluruh tiket ditampilkan sekaligus dalam satu halaman, tampilan menjadi panjang, berat, dan kurang nyaman digunakan. Setelah F029 membuat segmentasi tiket berdasarkan status, F030 perlu membatasi jumlah data per halaman agar tampilan lebih terkontrol.

## Problem Statement
Saat ini daftar tiket masih dapat tampil terlalu panjang ke bawah jika data banyak. Hal ini dapat membuat browser lebih berat, pengguna perlu scroll terlalu jauh, dan tampilan antrean kerja menjadi kurang efisien.

## Goals
1. Membatasi jumlah tiket yang tampil dalam satu halaman.
2. Menambahkan pagination pada daftar antrean kerja.
3. Menyediakan pilihan jumlah data per halaman.
4. Mempertahankan tab status F029.
5. Mempertahankan filter wilayah dan pencarian.
6. Mempertahankan tombol Detail dan Kerjakan.
7. Mempertahankan smooth action F027.
8. Membuat halaman antrean kerja lebih ringan dan rapi.

## Non-Goals
1. Tidak mengubah database.
2. Tidak membuat dashboard baru.
3. Tidak mengubah segmentasi status F029.
4. Tidak mengubah Telegram intake.
5. Tidak mengubah Telegram parsing.
6. Tidak mengubah upload file.
7. Tidak mengubah modal detail F019.
8. Tidak mengubah smooth action F027.
9. Tidak membuat infinite scroll.
10. Tidak membuat server-side datatable library baru.
11. Tidak memakai library baru.

## Actors
- Eksekutor
- Koordinator
- Supervisor
- Super Admin

## Pagination Rules

### Default Limit
Jumlah data default per halaman:

```text
10 tiket per halaman