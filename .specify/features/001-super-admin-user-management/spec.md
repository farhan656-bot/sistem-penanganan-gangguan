# Feature Spec — Super Admin & User Management

## Feature ID
F001

## Feature Name
Super Admin & User Management

## Summary
Fitur ini menambahkan role **Super Admin** yang bertugas mengelola akun pengguna sistem. Super Admin dapat melihat daftar user, menambahkan user baru, mengubah data user, mengatur role user, mengatur district user, serta mengaktifkan atau menonaktifkan akun. Fitur ini menjadi fondasi pengelolaan akses sistem karena seluruh role operasional—Eksekutor, Koordinator, dan Supervisor—bergantung pada data user yang valid.

## Business Background
Hasil diskusi lapangan menunjukkan bahwa sistem perlu memiliki **super admin** untuk mengelola user. Hal ini berarti pengelolaan akun tidak dilakukan bebas oleh pengguna, melainkan dikontrol oleh satu role administratif. Dengan demikian, sistem membutuhkan fitur manajemen user yang terpusat dan aman.

## Problem Statement
Saat ini user sistem dibuat manual dan belum ada antarmuka administratif untuk:
- menambahkan akun baru,
- mengubah role dan district,
- menonaktifkan akun,
- memastikan hanya user valid yang dapat login.

Tanpa fitur ini, pengelolaan akses sistem menjadi tidak efisien, sulit dipelihara, dan tidak sesuai dengan kebutuhan operasional.

## Goals
1. Menyediakan role **Super Admin** yang dapat login ke dashboard administratif.
2. Menyediakan halaman untuk melihat seluruh user sistem.
3. Menyediakan form tambah user baru.
4. Menyediakan form edit user.
5. Memungkinkan pengaturan:
   - nama lengkap
   - username
   - password
   - role
   - district
   - status aktif/nonaktif
6. Memastikan hanya Super Admin yang dapat mengakses fitur ini.

## Non-Goals
1. Fitur ini tidak mengatur data tiket operasional.
2. Fitur ini tidak mengatur Bot Telegram.
3. Fitur ini tidak mengatur dashboard KPI supervisor.
4. Fitur ini tidak mengatur reset password via email.
5. Fitur ini tidak mendukung multi-role untuk satu user dalam satu akun.

## Actors
### Primary Actor
- Super Admin

### Secondary Actors
- Eksekutor
- Koordinator
- Supervisor

## Preconditions
1. Role `super_admin` sudah tersedia di basis data.
2. Super Admin memiliki akun aktif dan berhasil login.
3. Basis data sistem dapat diakses.
4. Tabel `users`, `roles`, dan `regions` tersedia dan valid.

## Postconditions
### Jika berhasil
1. Data user baru tersimpan di basis data, atau data user lama berhasil diperbarui.
2. Role dan district user sesuai dengan input terbaru.
3. Status aktif/nonaktif user tersimpan dengan benar.
4. User yang nonaktif tidak dapat login ke sistem.

### Jika gagal
1. Perubahan data user tidak disimpan.
2. Sistem menampilkan pesan kesalahan yang relevan.
3. Data user tetap dalam kondisi sebelumnya.

## Functional Requirements

### FR-01 — Login Super Admin
Sistem harus mengizinkan user dengan role `super_admin` untuk login dan diarahkan ke dashboard super admin.

### FR-02 — Lihat Daftar User
Sistem harus menampilkan seluruh user yang terdaftar beserta:
- ID
- nama lengkap
- username
- role
- district
- status aktif/nonaktif

### FR-03 — Tambah User
Sistem harus menyediakan form tambah user baru dengan field:
- nama lengkap
- username
- password
- role
- district (opsional untuk role tertentu)

### FR-04 — Edit User
Sistem harus menyediakan form edit user yang dapat mengubah:
- nama lengkap
- username
- password (opsional)
- role
- district
- status aktif/nonaktif

### FR-05 — Validasi Username
Sistem harus menolak penambahan user baru jika username sudah digunakan.

### FR-06 — Validasi Role Access
Sistem harus menolak akses ke halaman kelola user jika user bukan `super_admin`.

### FR-07 — Aktivasi dan Nonaktivasi User
Sistem harus memungkinkan Super Admin mengubah status user menjadi aktif atau nonaktif.

### FR-08 — Validasi Login User Nonaktif
Sistem harus menolak login user yang berstatus nonaktif.

### FR-09 — Single Role Per User
Sistem harus menyimpan hanya satu role aktif untuk satu akun user.

## Business Rules
1. Hanya role `super_admin` yang boleh mengelola user.
2. Satu akun user hanya memiliki satu role.
3. District dapat kosong untuk role yang tidak memerlukan district.
4. Username harus unik.
5. Password disimpan dalam bentuk hash.
6. User nonaktif tidak boleh login.
7. Role operasional minimum:
   - `eksekutor`
   - `koordinator`
   - `supervisor`
   - `super_admin`
   - `pelapor` hanya sebagai role sistem, bukan login dashboard web.

## Data Requirements
### Main Entities
- `users`
- `roles`
- `regions`

### Required User Fields
- `full_name`
- `username`
- `password_hash`
- `role_id`
- `region_id`
- `is_active`

## Access Control
| Role | View Users | Create User | Edit User | Activate/Deactivate User |
|------|------------|-------------|-----------|---------------------------|
| super_admin | Yes | Yes | Yes | Yes |
| supervisor | No | No | No | No |
| koordinator | No | No | No | No |
| eksekutor | No | No | No | No |

## UX Requirements
1. Halaman user management harus sederhana dan mudah dipahami.
2. Gunakan tampilan tabel untuk daftar user.
3. Gunakan form terpisah untuk tambah dan edit user.
4. Tampilkan flash message untuk setiap aksi berhasil/gagal.
5. Gunakan gaya enterprise yang konsisten dengan dashboard sistem.

## Acceptance Criteria

### AC-01
Given Super Admin login  
When membuka dashboard  
Then sistem menampilkan halaman dashboard super admin.

### AC-02
Given Super Admin membuka halaman kelola user  
When data user tersedia  
Then sistem menampilkan daftar seluruh user.

### AC-03
Given Super Admin mengisi form tambah user dengan data valid  
When form dikirim  
Then sistem menyimpan user baru dan menampilkan pesan sukses.

### AC-04
Given Super Admin mengisi username yang sudah dipakai  
When form tambah user dikirim  
Then sistem menolak penyimpanan dan menampilkan pesan error.

### AC-05
Given Super Admin mengubah role, district, atau status user  
When form edit disimpan  
Then sistem memperbarui data user sesuai input.

### AC-06
Given user dinonaktifkan  
When user mencoba login  
Then sistem menolak login dan menampilkan pesan bahwa akun tidak aktif.

### AC-07
Given user non-super-admin mencoba akses `/users`  
When request dikirim  
Then sistem menolak akses.

## Edge Cases
1. Username duplikat.
2. Role tidak dipilih.
3. Password edit dikosongkan.
4. Region dikosongkan untuk role yang tidak butuh district.
5. User yang sedang login dinonaktifkan oleh super admin.
6. User mencoba akses halaman kelola user tanpa session login.