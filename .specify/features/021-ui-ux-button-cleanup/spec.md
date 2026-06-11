# Feature Spec — UI/UX Button Cleanup

## Feature ID
F021

## Feature Name
UI/UX Button Cleanup

## Summary
Fitur ini memperbaiki tampilan tombol dan aksi pada sistem agar lebih rapi, tidak mengganggu, dan lebih mudah digunakan oleh setiap role. Tombol yang tidak relevan untuk role tertentu harus disembunyikan. Tombol aksi utama harus lebih jelas, sedangkan tombol tambahan tidak boleh membuat tampilan daftar antrean kerja menjadi terlalu ramai.

## Business Background
Berdasarkan revisi pembimbing lapangan, sistem masih memiliki beberapa tombol yang kurang berguna atau mengganggu kenyamanan pengguna. Hal ini dapat membuat user bingung dalam menentukan aksi yang harus dilakukan. Oleh karena itu, tampilan tombol perlu dirapikan berdasarkan role, status tiket, dan kebutuhan kerja.

## Problem Statement
Saat ini beberapa tombol atau aksi masih tampil meskipun tidak selalu relevan dengan kondisi tiket atau role user. Tampilan yang terlalu banyak tombol dapat memperlambat pekerjaan, mengganggu user experience, dan membuat sistem terlihat kurang profesional.

## Goals
1. Merapikan tombol aksi pada daftar antrean kerja.
2. Menampilkan tombol hanya jika relevan dengan role user.
3. Menampilkan tombol hanya jika relevan dengan status tiket.
4. Mengurangi tombol yang tidak diperlukan.
5. Membuat aksi utama lebih mudah ditemukan.
6. Menjaga flow ticketing tetap tidak berubah.
7. Menjaga RBAC tetap aman.
8. Meningkatkan kenyamanan pengguna saat menggunakan sistem.

## Non-Goals
1. Tidak mengubah database.
2. Tidak mengubah Telegram intake.
3. Tidak mengubah Telegram parsing.
4. Tidak mengubah flow penyelesaian tiket.
5. Tidak mengubah flow return.
6. Tidak mengubah flow eskalasi DIIT.
7. Tidak mengubah Region Switch.
8. Tidak mengubah F017 laporan manual.
9. Tidak mengubah F018 akses kerja Koordinator.
10. Tidak mengubah F019 modal tabs.
11. Tidak menambah role baru.
12. Tidak membuat desain UI baru total.

## Actors
- Eksekutor
- Koordinator
- Supervisor
- Super Admin

## Functional Requirements

### FR-01 — Hide Irrelevant Buttons
Sistem harus menyembunyikan tombol yang tidak relevan untuk role user.

### FR-02 — Hide Invalid Status Actions
Sistem harus menyembunyikan tombol aksi yang tidak sesuai dengan status tiket.

### FR-03 — Preserve Detail Button
Tombol Detail tetap tersedia karena menjadi akses utama ke modal detail.

### FR-04 — Primary Action Highlight
Tombol aksi utama harus lebih jelas dibanding tombol sekunder.

### FR-05 — Role-Based Button Display
Setiap role hanya melihat tombol yang sesuai kewenangannya.

### FR-06 — Status-Based Button Display
Tombol aksi harus mengikuti status tiket.

### FR-07 — Supervisor Read-Only
Supervisor tidak boleh melihat tombol aksi operasional seperti ambil, selesai, return, eskalasi, atau delegasi.

### FR-08 — Super Admin Clean View
Super Admin hanya melihat tombol yang relevan dengan fungsi administrasi atau detail, bukan aksi pengerjaan tiket jika tidak diperlukan.

### FR-09 — No Broken Routes
Tombol yang masih ditampilkan harus mengarah ke route yang benar.

### FR-10 — No Backend Logic Removal
F021 hanya merapikan tampilan tombol. Jangan menghapus logic backend yang masih dibutuhkan.

## Recommended Button Rules

### Eksekutor
Status `tersedia`:
- Detail
- Ambil

Status `diambil` atau `didelegasikan` jika assigned ke user tersebut:
- Detail
- Selesaikan / Update Pengerjaan

Status `selesai`:
- Detail saja

Status `perlu_tindak_lanjut`:
- Detail
- Ambil / Tindak Lanjut jika sesuai logic sistem

Status `eskalasi`:
- Detail saja atau tindak lanjut jika memang tersedia

### Koordinator
- Detail
- Delegasi jika tiket masih dapat didelegasikan
- Batalkan penugasan jika tiket sedang didelegasikan/assigned
- Selesaikan jika Koordinator membantu pekerjaan tiket
- Return jika diperlukan
- Eskalasi jika diperlukan

### Supervisor
- Detail saja

### Super Admin
- Detail saja untuk modul ticketing
- Tombol administrasi user tetap berada di menu manajemen user, bukan di antrean kerja

## UI Rules
1. Tombol utama diberi warna yang jelas.
2. Tombol sekunder menggunakan outline.
3. Jangan tampilkan terlalu banyak tombol sejajar dalam tabel.
4. Jika aksi banyak, boleh gunakan dropdown `Aksi`.
5. Tombol Detail tetap mudah terlihat.
6. Gunakan label tombol yang singkat dan jelas.
7. Hindari tombol berulang yang fungsinya sama.
8. Hindari tombol yang tidak bisa digunakan.

## Acceptance Criteria

### AC-01
Given Eksekutor login  
When membuka daftar antrean  
Then hanya tombol yang sesuai status dan kewenangannya yang tampil.

### AC-02
Given Supervisor login  
When membuka daftar antrean atau dashboard  
Then Supervisor hanya melihat tombol Detail dan tidak melihat tombol aksi operasional.

### AC-03
Given Koordinator login  
When membuka daftar antrean  
Then Koordinator melihat tombol aksi yang sesuai kewenangannya pada tiket PDG dan BKT.

### AC-04
Given tiket sudah selesai  
When daftar antrean ditampilkan  
Then tombol aksi pengerjaan tidak tampil lagi, hanya Detail.

### AC-05
Given tombol Detail diklik  
When modal terbuka  
Then F019 modal tabs tetap berjalan.

### AC-06
Given F021 diterapkan  
When Telegram menerima laporan baru  
Then flow Telegram tetap berjalan.

## Edge Cases
1. Tiket tanpa assigned user.
2. Tiket sudah selesai.
3. Tiket sedang didelegasikan.
4. Tiket sedang eskalasi.
5. User bukan assigned user.
6. Supervisor membuka tiket.
7. Koordinator membuka tiket lintas region.
8. Eksekutor membuka tiket dengan region switch.
9. Tombol lama masih tersisa di view lain.
10. Route tombol tidak tersedia.

## Out of Scope
1. Redesign total layout.
2. Penggantian Bootstrap.
3. Penambahan framework UI.
4. Perubahan database.
5. Perubahan workflow utama.