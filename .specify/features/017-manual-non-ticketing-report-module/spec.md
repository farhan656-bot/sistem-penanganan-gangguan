# Feature Spec — Manual Non-Ticketing Report Module

## Feature ID
F017

## Feature Name
Manual Non-Ticketing Report Module

## Summary
Fitur ini menambahkan modul laporan manual non-ticketing yang terpisah dari modul ticketing Bot Telegram. Modul ini digunakan untuk mencatat pekerjaan manual selain pengerjaan tiket gangguan. Eksekutor dan Koordinator dapat membuat laporan manual, sedangkan Super Admin dapat melihat laporan manual tersebut.

## Important Update
Tabel `manual_non_ticketing_reports` sudah tersedia di database.

Jangan membuat ulang tabel.
Jangan menjalankan SQL `CREATE TABLE` lagi.
Jangan mengubah struktur tabel kecuali diminta secara eksplisit.

F017 hanya menggunakan tabel yang sudah tersedia.

## Business Background
Sistem sebelumnya menghilangkan laporan manual ticketing karena laporan tiket utama berasal dari Bot Telegram. Namun, berdasarkan revisi terbaru pembimbing lapangan, sistem tetap membutuhkan laporan manual untuk pekerjaan selain ticketing. Laporan manual ini digunakan untuk mencatat aktivitas operasional seperti pengecekan, pekerjaan data, aktivitas fallout, ticket resolved, dan pekerjaan non-ticketing lain sesuai format Excel contoh.

## Problem Statement
Saat ini sistem sudah memiliki modul ticketing berbasis Bot Telegram, tetapi belum memiliki modul khusus untuk pelaporan manual non-ticketing. Jika laporan manual non-ticketing dimasukkan ke tabel `reports`, data akan tercampur dengan antrean tiket gangguan. Oleh karena itu, laporan manual harus dibuat sebagai modul terpisah menggunakan tabel `manual_non_ticketing_reports`.

## Goals
1. Membuat modul laporan manual non-ticketing.
2. Menggunakan tabel `manual_non_ticketing_reports` yang sudah ada.
3. Mengizinkan Eksekutor membuat laporan manual.
4. Mengizinkan Koordinator membuat laporan manual.
5. Mengizinkan Super Admin melihat semua laporan manual.
6. Menyediakan halaman daftar laporan manual.
7. Menyediakan form input laporan manual.
8. Menyediakan halaman atau modal detail laporan manual.
9. Memastikan laporan manual tidak masuk ke antrean ticketing.
10. Memastikan laporan manual tidak masuk ke tabel `reports`.

## Non-Goals
1. Tidak membuat ulang tabel `manual_non_ticketing_reports`.
2. Tidak mengubah struktur database.
3. Tidak mengembalikan input manual ticketing lama.
4. Tidak memasukkan laporan manual ke tabel `reports`.
5. Tidak mengubah Telegram intake.
6. Tidak mengubah Telegram parsing.
7. Tidak mengubah flow ambil tiket.
8. Tidak mengubah flow selesai tiket.
9. Tidak mengubah flow return.
10. Tidak mengubah flow eskalasi DIIT.
11. Tidak mengubah Region Switch.
12. Tidak mengubah dashboard KPI Supervisor.
13. Tidak membuat fitur import Excel otomatis.
14. Tidak membuat fitur export Excel pada F017.

## Actors

### Primary Actors
- Eksekutor
- Koordinator

### Secondary Actor
- Super Admin

### Out of Scope Actor
- Pelapor Telegram

## Existing Database Table
Tabel yang digunakan:

```text
manual_non_ticketing_reports