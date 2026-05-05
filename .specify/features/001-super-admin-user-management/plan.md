# Technical Plan — Super Admin & User Management

## Feature ID
F001

## Feature Name
Super Admin & User Management

## Objective
Mengimplementasikan role `super_admin` beserta antarmuka dan logika backend untuk mengelola user sistem secara terpusat.

## Existing Context
Saat ini sistem sudah memiliki:
- autentikasi berbasis `express-session`
- tabel `users`, `roles`, dan `regions`
- login berbasis role
- dashboard terpisah untuk eksekutor, koordinator, dan supervisor

Namun sistem belum memiliki:
- role `super_admin`
- dashboard super admin
- halaman kelola user
- form tambah/edit user

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5
- bcrypt
- express-session

## Architecture Impact
Fitur ini menambah:
- role baru di tabel `roles`
- akun super admin awal
- controller baru untuk user management
- routes baru `/users`
- view baru untuk dashboard super admin dan user management

## Database Plan

### Tables Used
- `roles`
- `users`
- `regions`

### Database Changes
1. Tambah role `super_admin` jika belum ada.
2. Tambah seed akun awal `superadmin`.
3. Tidak ada tabel baru yang wajib ditambahkan pada feature ini.

## Backend Design

### Controllers
1. `authController`
   - update redirect login untuk role `super_admin`
2. `dashboardController`
   - tambah handler `superAdminDashboard`
3. `userController`
   - `listUsers`
   - `showCreateUser`
   - `createUser`
   - `showEditUser`
   - `updateUser`

### Models
1. `userModel`
   - `getAllUsers`
   - `getAllRoles`
   - `getAllRegions`
   - `createUser`
   - `updateUser`
   - gunakan `findByUsername` dan `findById` yang sudah ada

### Routes
1. `dashboardRoutes`
   - tambah route `/dashboard/super-admin`
2. `userRoutes`
   - `GET /users`
   - `GET /users/create`
   - `POST /users`
   - `GET /users/:id/edit`
   - `POST /users/:id/update`

### Middleware
Gunakan middleware yang sudah ada:
- `ensureAuthenticated`
- `ensureRole('super_admin')`

## View Design

### New Views
1. `views/super_admin/dashboard.ejs`
2. `views/users/index.ejs`
3. `views/users/create.ejs`
4. `views/users/edit.ejs`

### UI Guidelines
- gunakan card Bootstrap
- gunakan tabel untuk daftar user
- gunakan tombol yang jelas untuk tambah/edit
- tampilkan status aktif/nonaktif dalam badge
- pertahankan gaya enterprise Telkom-like:
  - latar terang
  - layout rapi
  - komponen ringkas
  - navigasi jelas

## Security Plan
1. Semua route `/users` hanya boleh diakses oleh `super_admin`.
2. Password harus di-hash dengan bcrypt.
3. Username harus unik.
4. User nonaktif harus ditolak saat login.
5. Password tidak ditampilkan di UI.

## Validation Rules
### Create User
- `full_name` wajib
- `username` wajib dan unik
- `password` wajib
- `role_id` wajib

### Update User
- `full_name` wajib
- `username` wajib
- `role_id` wajib
- `password` opsional
- `is_active` boolean

## Error Handling
1. Jika username sudah ada, tampilkan flash message error.
2. Jika user tidak ditemukan, redirect dengan error message.
3. Jika role tidak valid, tolak penyimpanan.
4. Jika query database gagal, rollback logika request dan tampilkan error umum.

## Testing Strategy
### Manual Test Cases
1. Login sebagai super admin berhasil.
2. Akses `/users` oleh super admin berhasil.
3. Akses `/users` oleh role lain ditolak.
4. Tambah user baru berhasil.
5. Tambah user dengan username duplikat gagal.
6. Edit role dan district user berhasil.
7. Nonaktifkan user berhasil.
8. Login user nonaktif ditolak.

## Dependencies
No new dependency required beyond current stack.

## Out of Scope
1. Reset password via email
2. Import/export user
3. Multi-role per user
4. Audit log untuk manajemen user