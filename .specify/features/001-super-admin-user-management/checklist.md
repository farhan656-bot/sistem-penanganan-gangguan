# Checklist — Super Admin & User Management

## Functional Checklist
- [ ] Role `super_admin` tersedia di database
- [ ] Akun awal super admin berhasil dibuat
- [ ] Super admin dapat login
- [ ] Super admin diarahkan ke dashboard khusus
- [ ] Super admin dapat membuka halaman kelola user
- [ ] Daftar user tampil lengkap
- [ ] Form tambah user dapat diakses
- [ ] User baru dapat ditambahkan
- [ ] Username duplikat ditolak
- [ ] Form edit user dapat diakses
- [ ] Data user dapat diperbarui
- [ ] Status aktif/nonaktif dapat diubah
- [ ] User nonaktif tidak dapat login

## Access Control Checklist
- [ ] Role selain `super_admin` tidak dapat mengakses `/users`
- [ ] Role selain `super_admin` tidak dapat mengakses dashboard super admin
- [ ] Route user management dilindungi middleware auth
- [ ] Route user management dilindungi middleware role

## Data Checklist
- [ ] `full_name` tersimpan dengan benar
- [ ] `username` tersimpan dengan benar
- [ ] `password_hash` tersimpan, bukan password asli
- [ ] `role_id` tersimpan dengan benar
- [ ] `region_id` tersimpan dengan benar
- [ ] `is_active` tersimpan dengan benar

## UI Checklist
- [ ] Dashboard super admin tampil rapi
- [ ] Tabel daftar user mudah dibaca
- [ ] Form tambah user mudah digunakan
- [ ] Form edit user mudah digunakan
- [ ] Flash message tampil saat aksi berhasil/gagal
- [ ] Tampilan konsisten dengan gaya dashboard sistem

## Negative Test Checklist
- [ ] Login dengan user nonaktif ditolak
- [ ] Tambah user tanpa field wajib gagal
- [ ] Tambah user dengan username duplikat gagal
- [ ] Edit user tidak ditemukan gagal
- [ ] Role non-super-admin akses `/users` gagal

## Evidence Checklist
- [ ] Screenshot login super admin
- [ ] Screenshot dashboard super admin
- [ ] Screenshot daftar user
- [ ] Screenshot form tambah user
- [ ] Screenshot form edit user
- [ ] Screenshot pesan error username duplikat
- [ ] Screenshot login user nonaktif ditolak