
---

# `plan.md`

```md
# Technical Plan — Queue Segmentation by Work Status

## Feature ID
F029

## Feature Name
Queue Segmentation by Work Status

## Objective
Membuat segmentasi daftar antrean kerja berdasarkan status tiket menggunakan tab pada halaman daftar, sehingga tiket tersedia, sedang dikerjakan, selesai, perlu tindak lanjut, dan eskalasi tidak bercampur dalam satu tampilan.

## Existing Context
Sistem saat ini sudah memiliki:
- Daftar antrean kerja
- status_internal pada tabel reports
- role Eksekutor
- role Koordinator
- role Supervisor
- role Super Admin
- assigned user
- filter wilayah/status
- tombol Detail dan Kerjakan
- modal detail F019
- smooth action F027
- akses Koordinator dua wilayah F018

## Important Boundary
F029 hanya mengelompokkan daftar tiket berdasarkan status kerja.

Jangan ubah:
- database
- Telegram intake
- Telegram parsing
- upload file
- modal detail F019
- smooth action F027
- validasi F023
- sender identity F025
- layout branding F026

## Files Likely Impacted

Kemungkinan file:

```text
models/reportModel.js
controllers/reportController.js
views/reports/index.ejs
views/koordinator/reports/index.ejs
views/dashboard/*.ejs
public/css/app.css
public/js/app.js