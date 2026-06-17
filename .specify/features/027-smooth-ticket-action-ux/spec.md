# Feature Spec — Smooth Ticket Action UX

## Feature ID
F027

## Feature Name
Smooth Ticket Action UX

## Summary
Fitur ini memperbaiki pengalaman pengguna saat menekan tombol aksi pada daftar antrean kerja. Saat ini beberapa aksi seperti Kerjakan atau Tandai Sedang Dikerjakan membuat halaman refresh dan kembali ke bagian atas, sehingga pengguna kehilangan posisi tiket yang sedang dilihat. F027 bertujuan agar aksi tiket terasa lebih halus, tidak mengganggu posisi pengguna, dan tetap menjaga flow backend yang sudah ada.

## Business Background
Daftar antrean kerja digunakan pegawai untuk menangani banyak tiket. Jika setiap aksi membuat halaman kembali ke atas, pengguna harus mencari ulang tiket yang baru saja diproses. Hal ini mengurangi kenyamanan dan memperlambat pekerjaan. Sistem perlu menjaga posisi pengguna setelah aksi dilakukan.

## Problem Statement
Tombol aksi pada daftar antrean kerja masih menggunakan submit atau redirect biasa, sehingga halaman melakukan reload penuh dan posisi scroll kembali ke atas. Pada halaman dengan banyak tiket, hal ini membuat pegawai kurang nyaman karena harus menggulir ulang ke posisi sebelumnya.

## Goals
1. Mencegah halaman kembali ke atas setelah tombol aksi ditekan.
2. Menjaga posisi scroll pengguna setelah aksi berhasil.
3. Membuat aksi Kerjakan terasa lebih cepat dan nyaman.
4. Menampilkan notifikasi berhasil/gagal tanpa mengganggu alur kerja.
5. Menjaga tombol Detail tetap membuka modal F019.
6. Menjaga flow backend tetap aman.
7. Menjaga role Eksekutor dan Koordinator tetap sesuai.
8. Menjaga F026 layout tombol tetap rapi.

## Non-Goals
1. Tidak mengubah database.
2. Tidak mengubah Telegram intake.
3. Tidak mengubah Telegram parsing.
4. Tidak mengubah flow penyelesaian dengan upload file secara besar-besaran.
5. Tidak mengubah F017 laporan manual.
6. Tidak mengubah F018 akses Koordinator.
7. Tidak mengubah F019 modal tabs.
8. Tidak mengubah F021 button cleanup.
9. Tidak mengubah F022 wording return.
10. Tidak mengubah F023 validasi DIIT.
11. Tidak mengubah F024 upload strategy.
12. Tidak mengubah F025 telegram sender identity.
13. Tidak mengubah F026 layout/branding.
14. Tidak menggunakan dropdown aksi.
15. Tidak menambah library frontend baru.

## Actors
- Eksekutor
- Koordinator

## Affected Actions
F027 terutama berlaku untuk aksi cepat pada daftar antrean kerja, seperti:

```text
Kerjakan
Tandai Sedang Dikerjakan
Ambil Tiket