
---

# `plan.md`

```md
# Technical Plan — Coordinator Dual Region Work Access

## Feature ID
F018

## Feature Name
Coordinator Dual Region Work Access

## Objective
Menyesuaikan akses Koordinator agar dapat melihat dan mengelola laporan dari dua region, yaitu PDG dan BKT, tanpa menggunakan temporary region switch.

## Existing Context
Sistem saat ini sudah memiliki:
- role Koordinator
- role Eksekutor
- region PDG dan BKT
- daftar laporan/tiket
- filter region
- Region Switch F007 untuk Eksekutor
- delegasi tiket oleh Koordinator
- pembatalan penugasan oleh Koordinator
- Telegram intake berdasarkan region
- struktur MVC
- MySQL dan mysql2/promise
- EJS dan Bootstrap 5

## Important Boundary
F018 hanya mengubah access logic Koordinator.

Jangan ubah logic Eksekutor:
- Eksekutor tetap melihat region utama.
- Eksekutor tetap membutuhkan temporary region switch untuk region lain.

Jangan ubah logic Region Switch:
- Region switch tetap untuk Eksekutor.
- Koordinator tidak perlu region switch.

## Database Impact
Tidak ada perubahan database yang diwajibkan.

F018 tidak membutuhkan:
- tabel baru
- kolom baru
- ALTER TABLE
- migration

Gunakan data existing:
- `regions`
- `reports`
- `users`
- `region_switch_requests`

## Files Likely Impacted

### Models
Kemungkinan:
- `models/reportModel.js`
- model yang mengambil daftar laporan Koordinator
- model yang mengambil daftar region filter

### Controllers
Kemungkinan:
- `controllers/reportController.js`
- controller Koordinator reports
- controller dashboard Koordinator

### Routes
Kemungkinan:
- `routes/reportRoutes.js`
- route Koordinator reports jika terpisah

### Views
Kemungkinan:
- `views/koordinator/reports/index.ejs`
- `views/koordinator/dashboard.ejs`
- `views/reports/index.ejs`
- filter region pada halaman Koordinator

### Utilities/Middleware
Jika ada helper access region:
- `utils/regionAccess.js`
- `middlewares/roleMiddleware.js`
- atau helper sejenis

## Implementation Strategy

### Recommended Approach
Buat helper atau fungsi model untuk menentukan allowed region berdasarkan role.

Contoh logic:

```js
if (user.role_name === 'koordinator') {
  allowedRegionCodes = ['PDG', 'BKT'];
}