# Feature Spec — Queue Segmentation by Work Status

## Feature ID
F029

## Feature Name
Queue Segmentation by Work Status

## Summary
Fitur ini mengelompokkan daftar antrean kerja berdasarkan status tiket agar pengguna tidak melihat semua tiket bercampur dalam satu tampilan panjang. Daftar antrean kerja akan memiliki tab status seperti Semua, Tersedia, Sedang Dikerjakan, Selesai, Perlu Tindak Lanjut, dan Eskalasi. Dengan segmentasi ini, Eksekutor dan Koordinator dapat bekerja lebih fokus dan cepat.

## Business Background
Daftar antrean kerja merupakan halaman utama pegawai dalam menangani tiket gangguan. Jika tiket tersedia, tiket yang sedang dikerjakan, tiket selesai, tiket return, dan tiket eskalasi ditampilkan bercampur, pengguna akan kesulitan menentukan prioritas kerja. Hal ini dapat membuat halaman terasa penuh dan membingungkan.

## Problem Statement
Saat ini daftar antrean kerja masih menampilkan tiket dengan berbagai status dalam satu tampilan. Kondisi ini membuat pengguna harus membaca satu per satu status tiket untuk menentukan mana yang perlu dikerjakan. Sistem perlu mengelompokkan tiket berdasarkan status agar tampilan lebih rapi, mudah dipahami, dan mendukung kerja cepat.

## Goals
1. Mengelompokkan tiket berdasarkan status kerja.
2. Menyediakan tab status pada halaman Daftar Antrean Kerja.
3. Memisahkan tiket tersedia dari tiket yang sudah diambil/dikerjakan.
4. Memisahkan tiket selesai, perlu tindak lanjut, dan eskalasi.
5. Menampilkan jumlah tiket pada setiap tab jika memungkinkan.
6. Menjaga tombol aksi tetap mengikuti aturan F021 dan F026.
7. Menjaga aksi smooth F027 tetap berjalan.
8. Menjaga role Eksekutor dan Koordinator tetap sesuai.
9. Menjaga assigned user tetap tampil.
10. Menjaga halaman tetap sederhana tanpa menambah banyak menu sidebar.

## Non-Goals
1. Tidak membuat dashboard baru.
2. Tidak membuat pagination pada F029.
3. Tidak menambah menu sidebar baru untuk setiap status.
4. Tidak mengubah database.
5. Tidak mengubah Telegram intake.
6. Tidak mengubah Telegram parsing.
7. Tidak mengubah upload file.
8. Tidak mengubah modal detail F019.
9. Tidak mengubah wording return F022.
10. Tidak mengubah validasi F023.
11. Tidak mengubah strategi upload F024.
12. Tidak mengubah telegram sender identity F025.
13. Tidak mengubah layout branding F026.
14. Tidak mengubah smooth action F027.

## Actors
- Eksekutor
- Koordinator
- Supervisor
- Super Admin

## Status Segmentation

### Tab Semua
Menampilkan semua tiket yang sesuai akses role.

### Tab Tersedia
Menampilkan tiket dengan status:

```text
baru
tersedia