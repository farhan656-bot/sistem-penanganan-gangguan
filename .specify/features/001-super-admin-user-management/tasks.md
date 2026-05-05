# Tasks — Super Admin & User Management

## Feature ID
F001

## Preparation
- [ ] Tinjau constitution dan copilot instructions
- [ ] Pastikan role final sistem sudah sesuai
- [ ] Pastikan tabel `users`, `roles`, dan `regions` tersedia

## Database
- [ ] Tambahkan role `super_admin` ke tabel `roles`
- [ ] Buat script seed akun super admin awal
- [ ] Jalankan seed super admin dan verifikasi data di database

## Authentication & Dashboard
- [ ] Update `authController.js` agar redirect login mendukung role `super_admin`
- [ ] Update root redirect di `app.js`
- [ ] Tambahkan handler `superAdminDashboard` di `dashboardController.js`
- [ ] Tambahkan route `/dashboard/super-admin`
- [ ] Buat `views/super_admin/dashboard.ejs`

## User Model
- [ ] Tambahkan `getAllUsers()` di `userModel.js`
- [ ] Tambahkan `getAllRoles()` di `userModel.js`
- [ ] Tambahkan `getAllRegions()` di `userModel.js`
- [ ] Tambahkan `createUser()` di `userModel.js`
- [ ] Tambahkan `updateUser()` di `userModel.js`

## User Controller
- [ ] Buat `controllers/userController.js`
- [ ] Implementasikan `listUsers`
- [ ] Implementasikan `showCreateUser`
- [ ] Implementasikan `createUser`
- [ ] Implementasikan `showEditUser`
- [ ] Implementasikan `updateUser`

## User Routes
- [ ] Buat `routes/userRoutes.js`
- [ ] Tambahkan route `GET /users`
- [ ] Tambahkan route `GET /users/create`
- [ ] Tambahkan route `POST /users`
- [ ] Tambahkan route `GET /users/:id/edit`
- [ ] Tambahkan route `POST /users/:id/update`
- [ ] Daftarkan `userRoutes` di `app.js`

## Views
- [ ] Buat `views/users/index.ejs`
- [ ] Tampilkan daftar user dalam tabel
- [ ] Buat `views/users/create.ejs`
- [ ] Buat `views/users/edit.ejs`
- [ ] Tambahkan badge status aktif/nonaktif
- [ ] Tambahkan navigasi kembali ke dashboard super admin

## Validation & Security
- [ ] Validasi field wajib pada create user
- [ ] Validasi username unik
- [ ] Hash password saat create user
- [ ] Hash password baru saat edit user jika diisi
- [ ] Pastikan route user hanya bisa diakses `super_admin`
- [ ] Pastikan login user nonaktif ditolak

## UI/UX
- [ ] Pastikan layout konsisten dengan dashboard lain
- [ ] Gunakan Bootstrap card, table, dan form
- [ ] Tambahkan flash message sukses/gagal
- [ ] Pastikan tampilan rapi di resolusi desktop

## Testing
- [ ] Test login super admin
- [ ] Test akses dashboard super admin
- [ ] Test akses user management oleh role lain ditolak
- [ ] Test tambah user berhasil
- [ ] Test tambah user dengan username duplikat gagal
- [ ] Test edit user berhasil
- [ ] Test nonaktifkan user berhasil
- [ ] Test login user nonaktif ditolak

## Documentation
- [ ] Catat perubahan file untuk BAB IV implementasi
- [ ] Simpan screenshot dashboard super admin
- [ ] Simpan screenshot halaman kelola user
- [ ] Simpan screenshot tambah/edit user