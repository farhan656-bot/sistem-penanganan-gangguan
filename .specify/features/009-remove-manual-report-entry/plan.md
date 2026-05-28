# Technical Plan — Remove Manual Report Entry

## Feature ID
F009

## Feature Name
Remove Manual Report Entry

## Objective
Menghapus atau menyembunyikan fitur input laporan manual dari UI sistem agar alur pelaporan sesuai dengan revisi pembimbing lapangan, yaitu laporan utama berasal dari Bot Telegram.

## Existing Context
Sistem saat ini sudah memiliki:
- autentikasi dan RBAC
- role super_admin, koordinator, eksekutor, supervisor, dan pelapor
- Telegram bot intake
- daftar antrean laporan
- input laporan manual
- dashboard koordinator
- dashboard super admin
- sidebar atau navigasi role
- tabel `reports`
- EJS views
- Bootstrap 5
- struktur MVC

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5
- express-session
- CommonJS

## Database Impact
Tidak ada perubahan struktur database.

F009 tidak membutuhkan:
- tabel baru
- kolom baru
- penghapusan kolom
- penghapusan data
- perubahan relasi database

Tabel `reports` tetap digunakan untuk menyimpan laporan dari Telegram dan data laporan lama.

## Files Likely Impacted

### Layout / Navigation
Periksa file yang berisi menu/sidebar:
- `views/partials/sidebar.ejs`
- `views/partials/topbar.ejs`
- atau partial navigasi sesuai struktur project.

### Dashboard Views
Periksa dashboard yang mungkin menampilkan shortcut laporan manual:
- `views/koordinator/dashboard.ejs`
- `views/superadmin/dashboard.ejs`
- atau nama view dashboard sesuai struktur project.

### Manual Report Views
Periksa view form laporan manual:
- `views/reports/manual.ejs`
- `views/reports/create.ejs`
- `views/koordinator/manual-report.ejs`
- atau nama file sejenis.

### Routes
Periksa route laporan manual:
- `routes/reportRoutes.js`
- `routes/koordinatorRoutes.js`
- `routes/superAdminRoutes.js`
- atau route sesuai struktur project.

### Controllers
Periksa controller laporan manual:
- `controllers/reportController.js`
- `controllers/dashboardController.js`
- atau controller sesuai struktur project.

## Implementation Plan

### Step 1 — Review Existing Manual Report References
Cari seluruh referensi:
- `manual`
- `laporan manual`
- `Tambah Laporan Manual`
- `manual report`
- `source_channel`
- route yang mengarah ke form input manual

Gunakan pencarian di VS Code secara global.

### Step 2 — Remove Manual Report from Sidebar
1. Buka partial sidebar atau menu utama.
2. Cari menu laporan manual.
3. Hapus atau comment menu tersebut.
4. Pastikan sidebar tetap rapi untuk role Koordinator dan Super Admin.
5. Pastikan menu lain tidak berubah.

### Step 3 — Remove Manual Report from Koordinator Dashboard
1. Buka dashboard Koordinator.
2. Cari card, shortcut, button, atau link tambah laporan manual.
3. Hapus atau sembunyikan elemen tersebut.
4. Jika layout menjadi kosong, rapikan card yang tersisa.
5. Jangan mengubah fitur delegasi, antrean kerja, atau approval region switch.

### Step 4 — Remove Manual Report from Super Admin Dashboard
1. Buka dashboard Super Admin.
2. Cari card, shortcut, button, atau link tambah laporan manual.
3. Hapus atau sembunyikan elemen tersebut.
4. Pastikan fokus Super Admin tetap pada manajemen user.
5. Jangan mengubah fitur kelola user.

### Step 5 — Route Safety
1. Jangan langsung menghapus route laporan manual jika berisiko menyebabkan error.
2. Jika route masih ada, pastikan tidak ada link UI yang mengarah ke route tersebut.
3. Jika perlu, route dapat diarahkan ke daftar laporan atau dashboard dengan flash message.
4. Jangan menghapus controller/model sebelum dipastikan tidak dipakai.

### Step 6 — Regression Check
Pastikan fitur berikut tetap berjalan:
- login/logout
- dashboard Koordinator
- dashboard Super Admin
- daftar antrean laporan
- Telegram bot intake
- daftar laporan dari tabel `reports`
- role middleware
- dashboard Supervisor read-only
- dashboard Eksekutor

## Access Control Plan
Tidak ada perubahan role access control.

Aturan tetap:
- Super Admin mengelola user.
- Koordinator mengelola antrean, delegasi, dan approval region switch.
- Eksekutor mengambil dan menyelesaikan tiket.
- Supervisor monitoring read-only.
- Pelapor mengirim laporan melalui Telegram.

## Validation Rules
1. Menu laporan manual tidak muncul.
2. Shortcut laporan manual tidak muncul.
3. Tidak ada tombol tambah laporan manual pada dashboard.
4. Telegram intake tetap berjalan.
5. Daftar antrean tetap berjalan.
6. Tidak ada perubahan database.
7. Tidak ada perubahan business logic tiket.
8. Tidak ada perubahan RBAC middleware.

## Testing Strategy

### Manual Test Cases
1. Login sebagai Super Admin.
2. Cek sidebar Super Admin.
3. Pastikan menu laporan manual tidak ada.
4. Cek dashboard Super Admin.
5. Pastikan shortcut/card laporan manual tidak ada.
6. Buka kelola user.
7. Pastikan kelola user tetap berjalan.
8. Logout.
9. Login sebagai Koordinator.
10. Cek sidebar Koordinator.
11. Pastikan menu laporan manual tidak ada.
12. Cek dashboard Koordinator.
13. Pastikan shortcut/card laporan manual tidak ada.
14. Buka daftar antrean laporan.
15. Pastikan daftar laporan tetap tampil.
16. Login sebagai Eksekutor.
17. Pastikan daftar antrean tetap berjalan.
18. Login sebagai Supervisor.
19. Pastikan dashboard supervisor tetap read-only.
20. Kirim laporan dari Telegram.
21. Pastikan laporan Telegram tetap masuk ke antrean.

## Rollback Plan
1. Jika sidebar rusak, kembalikan partial sidebar dari versi sebelumnya.
2. Jika dashboard kosong atau error, kembalikan bagian card yang tidak berkaitan dengan laporan manual.
3. Jika route error, jangan hapus route laporan manual; cukup biarkan tanpa link UI.
4. Jika daftar laporan terganggu, cek apakah ada query atau controller yang tidak sengaja diubah.
5. Jika Telegram intake terganggu, rollback perubahan yang menyentuh service/controller bot.

## Out of Scope
1. Mengubah detail laporan menjadi modal.
2. Mengubah catatan penyelesaian.
3. Mengubah feedback Telegram return.
4. Mengubah feedback Telegram eskalasi.
5. Menambah kode DIIT.
6. Membersihkan narasi overwork.
7. Mengubah Region Switch F007.
8. Mengubah KPI Supervisor.