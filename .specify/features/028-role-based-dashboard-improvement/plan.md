
---

# `plan.md`

```md id="uvbwp9"
# Technical Plan — Role-Based Dashboard Improvement

## Feature ID
F028

## Feature Name
Role-Based Dashboard Improvement

## Objective
Membuat dashboard berbasis role agar Eksekutor, Koordinator, dan Super Admin mendapatkan ringkasan informasi sesuai kebutuhan kerjanya masing-masing.

## Existing Context
Sistem sudah memiliki:
- RBAC
- role Eksekutor
- role Koordinator
- role Super Admin
- role Supervisor
- tabel reports
- tabel users
- tabel roles
- tabel regions
- tabel manual_non_ticketing_reports
- F018 Koordinator PDG/BKT
- F029 tab status antrean kerja
- F030 pagination antrean kerja
- layout F026

## Important Boundary
F028 hanya memperbaiki dashboard.

Jangan ubah:
- database
- Telegram intake
- Telegram parsing
- flow ticketing
- upload file
- modal detail F019
- F029 queue segmentation
- F030 pagination
- RBAC middleware secara sembarangan

## Files Likely Impacted

Kemungkinan file:

```text
controllers/dashboardController.js
models/dashboardModel.js
routes/dashboardRoutes.js
views/dashboard/eksekutor.ejs
views/dashboard/koordinator.ejs
views/dashboard/superadmin.ejs
views/dashboard/index.ejs
views/partials/sidebar.ejs
public/css/app.css