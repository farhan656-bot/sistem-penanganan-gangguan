
---

# `plan.md`

```md id="v25pv2"
# Technical Plan — Smooth Ticket Action UX

## Feature ID
F027

## Feature Name
Smooth Ticket Action UX

## Objective
Meningkatkan kenyamanan pengguna pada aksi cepat tiket dengan mencegah halaman refresh penuh atau kembali ke atas setelah aksi seperti Kerjakan atau Tandai Sedang Dikerjakan.

## Existing Context
Sistem sudah memiliki:
- Daftar antrean kerja
- Tombol Detail dan Kerjakan yang sudah dirapikan F026
- Modal detail F019
- Role Eksekutor
- Role Koordinator
- Flow ambil/kerjakan tiket
- Flow tandai sedang dikerjakan
- Express.js
- EJS
- Bootstrap 5
- Vanilla JavaScript

## Important Boundary
F027 hanya memperbaiki pengalaman aksi cepat.

Jangan ubah:
- database
- Telegram intake
- Telegram parsing
- upload file
- laporan manual F017
- akses Koordinator F018
- modal tabs F019
- button cleanup F021
- wording return F022
- validation F023
- upload strategy F024
- telegram sender F025
- layout branding F026

## Files Likely Impacted

Kemungkinan file:

```text
views/reports/index.ejs
views/koordinator/reports/index.ejs
views/partials/*.ejs
public/js/app.js
public/css/app.css
controllers/reportController.js
routes/reportRoutes.js