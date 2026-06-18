
---

# `plan.md`

```md
# Technical Plan — Queue Pagination and Page Limit

## Feature ID
F030

## Feature Name
Queue Pagination and Page Limit

## Objective
Menambahkan pagination dan pembatasan jumlah tiket per halaman pada Daftar Antrean Kerja agar halaman lebih ringan, tidak panjang ke bawah, dan tetap nyaman digunakan.

## Existing Context
Sistem sudah memiliki:
- Daftar Antrean Kerja
- Segmentasi tab status F029
- Tombol Detail dan Kerjakan F026
- Smooth action F027
- Modal detail F019
- Role Eksekutor
- Role Koordinator
- Role Supervisor
- Role Super Admin
- Filter wilayah/search
- Assigned To

## Important Boundary
F030 hanya menambahkan pagination dan page limit.

Jangan ubah:
- database
- Telegram intake
- Telegram parsing
- upload file
- F017 manual report
- F018 coordinator access
- F019 modal tabs
- F021 button cleanup
- F022 wording return
- F023 validation
- F024 upload validation
- F025 telegram sender identity
- F026 layout branding
- F027 smooth action
- F029 queue segmentation

## Files Likely Impacted

Kemungkinan file:

```text
models/reportModel.js
controllers/reportController.js
views/reports/index.ejs
views/koordinator/reports/index.ejs
views/partials/pagination.ejs
public/css/app.css
public/js/app.js