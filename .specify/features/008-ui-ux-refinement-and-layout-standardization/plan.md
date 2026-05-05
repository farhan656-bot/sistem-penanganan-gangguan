# Technical Plan — UI/UX Refinement and Layout Standardization

## Feature ID
F008

## Feature Name
UI/UX Refinement and Layout Standardization

## Objective
Merapikan UI/UX sistem agar lebih konsisten, user friendly, dan mudah digunakan oleh setiap role tanpa mengubah business logic yang sudah berjalan.

## Existing Context
Sistem saat ini sudah memiliki:
- halaman login
- dashboard super admin
- manajemen user
- dashboard supervisor KPI
- dashboard eksekutor
- dashboard koordinator
- daftar antrean kerja
- detail laporan
- form laporan manual
- pengajuan Region Switch F007
- approval Region Switch F007
- Bootstrap 5
- EJS views
- struktur MVC sederhana

Feature ini akan fokus pada perbaikan tampilan, layout, navigasi, dan pengalaman pengguna.

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5
- express-session
- Custom CSS

## Database Impact
Tidak ada perubahan struktur database.

Fitur ini tidak membutuhkan:
- tabel baru
- kolom baru
- perubahan relasi database
- perubahan data tiket
- perubahan data user
- perubahan data region switch

## Files Likely Impacted

### Layout / Partials
Jika belum tersedia, dapat dibuat:
- `views/partials/sidebar.ejs`
- `views/partials/topbar.ejs`
- `views/partials/flash.ejs`
- `views/partials/status-badge.ejs`
- `views/partials/page-header.ejs`

Jika project sudah memiliki partial, gunakan yang sudah ada.

### Public Assets
- `public/css/app.css`
- `public/css/dashboard.css` jika sudah ada
- `public/js/app.js` jika diperlukan

### Auth Views
- `views/auth/login.ejs`
- atau file login sesuai struktur project

### Super Admin Views
- `views/superadmin/dashboard.ejs`
- `views/superadmin/users/index.ejs`
- `views/superadmin/users/create.ejs`
- `views/superadmin/users/edit.ejs`
- view laporan manual jika digunakan super admin

### Supervisor Views
- `views/supervisor/dashboard.ejs`

### Eksekutor Views
- `views/eksekutor/dashboard.ejs`
- `views/eksekutor/region-switch/index.ejs`
- `views/eksekutor/region-switch/create.ejs`
- view daftar antrean kerja jika digunakan eksekutor

### Koordinator Views
- `views/koordinator/dashboard.ejs`
- `views/koordinator/region-switch/index.ejs`
- view daftar antrean kerja jika digunakan koordinator
- view detail laporan
- view tambah laporan manual

### Shared Views
- view report list
- view report detail
- view manual report form

## UI Design Direction

### Global Layout
Halaman setelah login sebaiknya memiliki:
- sidebar di kiri
- topbar sederhana
- page title
- user identity
- role badge
- logout button
- content area

### Login Page
Perlu dirapikan dengan:
- nama sistem
- konteks instansi
- form login rapi
- tombol utama merah
- error message rapi
- helper text yang lebih formal
- password visibility toggle jika memungkinkan

### Super Admin UI
Perlu dirapikan pada:
- dashboard super admin
- card manajemen user
- card laporan manual
- tabel kelola user
- badge role dan status
- form tambah/edit user
- form laporan manual

### Supervisor UI
Perlu dirapikan pada:
- filter dashboard
- KPI cards
- chart cards
- rekap per wilayah
- rekap kinerja eksekutor
- tiket perlu perhatian
- riwayat Region Switch F007

Dashboard supervisor harus tetap read-only.

### Eksekutor UI
Perlu dirapikan pada:
- dashboard eksekutor
- shortcut tugas harian
- daftar antrean kerja
- tombol detail dan ambil tugas
- pengajuan switch region
- form pengajuan switch region

Dashboard eksekutor sebaiknya lebih task-oriented.

### Koordinator UI
Perlu dirapikan pada:
- dashboard koordinator
- approval switch region
- daftar antrean kerja
- form laporan manual
- detail laporan
- form delegasi jika masih ditampilkan
- form pembatalan penugasan jika masih ditampilkan

Koordinator UI sebaiknya menonjolkan pekerjaan operasional dan approval.

## Component Standardization

### Buttons
Gunakan class konsisten:
- primary action: merah
- secondary action: outline/dark
- success action: hijau
- danger action: merah
- info/action detail: outline

### Badge Status Tiket
Status yang digunakan:
- `tersedia`
- `diambil`
- `didelegasikan`
- `selesai`
- `perlu_tindak_lanjut`
- `eskalasi`

Status `baru` tidak ditampilkan karena tidak digunakan pada implementasi saat ini.

### Badge Region Switch
Status:
- `pending`
- `approved`
- `rejected`
- `expired`

### Table
Tabel harus:
- menggunakan card wrapper
- responsif
- memiliki header jelas
- action button tidak terpotong
- teks panjang dapat dipotong atau diberi batas
- empty state jika tidak ada data

### Form
Form panjang harus:
- dikelompokkan per section
- memiliki helper text
- field wajib diberi tanda
- tombol utama dan batal konsisten
- tidak terlalu melebar tanpa struktur

### Alert
Alert harus:
- tidak terlalu besar
- bisa ditutup jika memungkinkan
- hanya muncul saat diperlukan
- tidak menetap pada setiap halaman tanpa alasan

## Access Control Plan
Tidak ada perubahan rule access control.

UI harus mengikuti rule yang sudah ada:
- super admin melihat menu administrasi
- supervisor melihat menu monitoring
- eksekutor melihat menu tugas dan pengajuan switch region
- koordinator melihat menu operasional dan approval
- user tidak login hanya melihat halaman login

## Validation Rules
1. Semua halaman tetap dapat dibuka setelah UI diperbarui.
2. Tidak ada business logic yang berubah.
3. Tidak ada route baru yang mengubah permission.
4. Tidak ada form baru yang mengubah data tanpa requirement.
5. Semua tombol lama yang masih diperlukan tetap berfungsi.
6. Sidebar menampilkan menu sesuai role.
7. Tabel tetap aman saat data kosong.
8. Form tetap bisa submit sesuai fungsi lama.
9. Dashboard supervisor tetap read-only.
10. Region Switch F007 tetap berjalan sesuai implementasi sebelumnya.

## Testing Strategy

### Manual Test Cases
1. Buka halaman login.
2. Login sebagai super admin.
3. Cek dashboard super admin.
4. Cek halaman kelola user.
5. Cek form tambah user.
6. Cek form laporan manual.
7. Login sebagai supervisor.
8. Cek dashboard supervisor.
9. Pastikan supervisor tetap read-only.
10. Login sebagai eksekutor.
11. Cek dashboard eksekutor.
12. Cek daftar antrean kerja.
13. Cek pengajuan switch region.
14. Cek form pengajuan switch region.
15. Login sebagai koordinator.
16. Cek dashboard koordinator.
17. Cek approval switch region.
18. Cek daftar antrean kerja koordinator.
19. Cek detail laporan.
20. Cek logout dari semua role.

## Out of Scope
1. Perubahan database.
2. Perubahan business logic tiket.
3. Perubahan Bot Telegram.
4. Perubahan logic F007.
5. Perubahan query KPI supervisor.
6. Framework frontend baru.
7. SPA atau React migration.
8. Export PDF/Excel.
9. Realtime notification.