# Technical Plan — UI/UX Button Cleanup

## Feature ID
F021

## Feature Name
UI/UX Button Cleanup

## Objective
Merapikan tampilan tombol aksi pada sistem berdasarkan role dan status tiket agar user experience lebih nyaman dan pengguna tidak terganggu oleh tombol yang tidak relevan.

## Existing Context
Sistem sudah memiliki:
- RBAC
- role Eksekutor
- role Koordinator
- role Supervisor
- role Super Admin
- daftar antrean kerja
- detail modal F019
- flow ambil tiket
- flow penyelesaian tiket
- flow return
- flow eskalasi DIIT
- delegasi Koordinator
- akses kerja Koordinator F018

## Important Boundary
F021 adalah perbaikan UI/UX tombol.

Jangan ubah:
- database
- Telegram intake
- Telegram parsing
- flow backend ticketing
- F017 manual report
- F018 coordinator access
- F019 modal tabs
- RBAC middleware secara sembarangan

## Files Likely Impacted
Kemungkinan file yang diubah:

```text
views/reports/index.ejs
views/koordinator/reports/index.ejs
views/dashboard/*.ejs
views/partials/*.ejs
public/js/app.js