
---

# `plan.md`

```md
# Technical Plan — Telegram Media Popup Tabs

## Feature ID
F019

## Feature Name
Telegram Media Popup Tabs

## Objective
Memindahkan Media Telegram ke dalam modal detail laporan dan menempatkannya pada tab khusus agar tampilan halaman utama lebih rapi dan media tidak mengganggu proses kerja utama.

## Existing Context
Sistem saat ini sudah memiliki:
- Detail laporan modal dari F010
- Pemisahan Bukti Penyelesaian dan Media Telegram dari F015
- Upload bukti penyelesaian dari F016
- Telegram media linked ke report
- EJS views
- Bootstrap 5
- public/js/app.js
- endpoint detail JSON jika digunakan
- report logs
- struktur MVC

## Important Boundary
F019 adalah perubahan UI/UX detail media.

Jangan ubah:
- Telegram intake
- Telegram parsing
- pending media
- text enrichment
- upload backend
- database
- flow selesai
- flow return
- flow eskalasi DIIT
- Region Switch
- F017 manual report
- F018 coordinator access

## Database Impact
Tidak ada perubahan database.

F019 tidak membutuhkan:
- tabel baru
- kolom baru
- ALTER TABLE
- migration

## Files Likely Impacted

### View Partial Modal
Kemungkinan utama:
```text
views/partials/report-detail-modal.ejs