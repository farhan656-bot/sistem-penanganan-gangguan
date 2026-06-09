
---

# `plan.md`

```md
# Technical Plan — Manual Non-Ticketing Report Module

## Feature ID
F017

## Feature Name
Manual Non-Ticketing Report Module

## Objective
Membuat modul laporan manual non-ticketing yang terpisah dari modul ticketing Bot Telegram dengan menggunakan tabel `manual_non_ticketing_reports` yang sudah tersedia.

## Important Update
Tabel `manual_non_ticketing_reports` sudah berhasil dibuat di database.

Jangan menjalankan SQL `CREATE TABLE`.
Jangan mengubah struktur tabel.
Jangan membuat migration.
Gunakan tabel yang sudah ada.

## Existing Context
Sistem saat ini sudah memiliki:
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5
- express-session
- CommonJS
- RBAC
- role Eksekutor
- role Koordinator
- role Super Admin
- laporan ticketing dari Bot Telegram
- tabel `reports` untuk tiket
- tabel `manual_non_ticketing_reports` untuk laporan manual non-ticketing
- struktur MVC
- sidebar per role

## Important Boundary
F017 tidak boleh mengembalikan input manual ticketing lama.

Laporan manual F017:
- laporan non-ticketing
- disimpan di `manual_non_ticketing_reports`
- tidak masuk `reports`
- tidak muncul di antrean kerja ticketing
- tidak memiliki flow ambil/selesai/return/eskalasi
- tidak mengirim Telegram feedback

## Database Impact
Tidak ada perubahan database pada F017 versi update.

Tabel yang digunakan:

```text
manual_non_ticketing_reports