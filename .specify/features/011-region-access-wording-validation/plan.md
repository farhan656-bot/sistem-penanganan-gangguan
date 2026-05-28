# Technical Plan — Region Access Wording Validation

## Feature ID
F011

## Feature Name
Region Access Wording Validation

## Objective
Memvalidasi dan menyelaraskan wording terkait akses region agar sesuai dengan alur sistem yang sudah berjalan, yaitu Eksekutor hanya melihat tiket region utama secara default dan dapat melihat tiket region lain hanya setelah temporary region switch disetujui Koordinator.

## Existing Context
Sistem saat ini sudah memiliki:
- region PDG dan BKT
- user Eksekutor dengan region utama
- daftar antrean laporan berdasarkan region
- temporary region switch F007
- approval/reject region switch oleh Koordinator
- akses region tambahan sementara jika switch disetujui
- dashboard Eksekutor
- dashboard Koordinator
- dashboard Supervisor
- EJS views
- Bootstrap 5
- Express.js
- MySQL dan mysql2/promise
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
Tidak ada perubahan database.

F011 tidak membutuhkan:
- tabel baru
- kolom baru
- migration
- ALTER TABLE
- perubahan data lama

## Files Likely Impacted

### Views
Periksa view yang menampilkan wording region:
- dashboard Eksekutor
- dashboard Koordinator
- daftar antrean laporan
- form pengajuan region switch
- riwayat region switch Eksekutor
- approval region switch Koordinator
- dashboard Supervisor jika ada penjelasan region
- modal detail laporan jika menampilkan helper text region

Kemungkinan file:
- `views/eksekutor/dashboard.ejs`
- `views/eksekutor/region-switch/index.ejs`
- `views/eksekutor/region-switch/create.ejs`
- `views/koordinator/dashboard.ejs`
- `views/koordinator/region-switch/index.ejs`
- `views/reports/index.ejs`
- `views/supervisor/dashboard.ejs`

### Controllers
Periksa controller yang mungkin memiliki flash message atau helper text:
- `controllers/regionSwitchController.js`
- `controllers/dashboardController.js`
- `controllers/reportController.js`

### Services
Periksa hanya jika ada pesan sistem terkait region:
- service region switch jika ada
- service Telegram feedback jika menyebut region dalam konteks overwork/overload

## Implementation Plan

### Step 1 — Global Search
Gunakan pencarian global di VS Code untuk mencari:
- `overwork`
- `overload`
- `beban kerja berlebih`
- `beban berlebih`
- `beban terlalu tinggi`
- `wilayah overload`
- `region overload`
- `beban kerja`
- `region lain`
- `switch region`
- `temporary region switch`

### Step 2 — Identify UI Text Only
Klasifikasikan hasil pencarian:
1. Teks yang tampil ke user.
2. Helper text pada form.
3. Alert atau flash message.
4. Label dashboard.
5. Komentar kode.
6. Dokumentasi lama.
7. Nama variabel/function.

Prioritas hanya teks yang tampil ke user. Jangan mengubah nama variabel/function jika tidak perlu.

### Step 3 — Replace Incorrect Wording
Jika ditemukan narasi yang mengarah pada overwork/overload, ganti dengan wording:

> Pembagian region digunakan untuk membantu manajemen pelaporan dan monitoring wilayah.

Untuk Region Switch, gunakan wording:

> Akses region sementara digunakan untuk mendukung kebutuhan operasional lintas region berdasarkan persetujuan Koordinator.

Untuk akses Eksekutor, gunakan wording:

> Eksekutor secara default hanya dapat melihat tiket sesuai region utama. Tiket dari region lain akan tampil jika temporary region switch telah disetujui dan masih aktif.

### Step 4 — Do Not Change Logic
Pastikan tidak mengubah:
- route region switch
- controller approve/reject
- model/query region switch
- query daftar tiket
- filter region
- ticket visibility
- role middleware
- Telegram bot
- KPI supervisor

### Step 5 — UI Review
Buka halaman yang berkaitan:
1. Dashboard Eksekutor.
2. Daftar antrean Eksekutor.
3. Form pengajuan region switch.
4. Riwayat region switch.
5. Dashboard Koordinator.
6. Approval region switch.
7. Daftar antrean Koordinator.
8. Dashboard Supervisor.

Pastikan wording baru benar dan tidak terlalu panjang.

### Step 6 — Regression Check
Pastikan alur yang sudah ada tetap berjalan:
1. Eksekutor login.
2. Eksekutor hanya melihat tiket region utama.
3. Eksekutor mengajukan region switch.
4. Koordinator menyetujui.
5. Eksekutor melihat tiket region tambahan.
6. Jika akses expired, tiket region tambahan tidak lagi terlihat.
7. Koordinator tetap bisa reject.
8. Supervisor tetap read-only.
9. Telegram intake tetap berjalan.

## Access Control Plan
Tidak ada perubahan akses.

Aturan tetap:
- Eksekutor default melihat tiket region utama.
- Eksekutor dapat melihat tiket region lain setelah region switch disetujui dan aktif.
- Koordinator approve/reject region switch.
- Supervisor read-only.
- Super Admin tidak terdampak.
- Pelapor tetap melalui Telegram.

## Validation Rules
1. Tidak ada wording overwork/overload pada UI aktif.
2. Wording region sesuai manajemen pelaporan dan monitoring wilayah.
3. Wording region switch sesuai akses sementara lintas region.
4. Tidak ada perubahan database.
5. Tidak ada perubahan logic region switch.
6. Tidak ada perubahan ticket visibility.
7. Tidak ada perubahan Telegram bot.
8. Tidak ada perubahan KPI supervisor.

## Testing Strategy

### Manual Test Cases
1. Cari kata `overwork` di seluruh project.
2. Cari kata `overload` di seluruh project.
3. Cari kata `beban kerja berlebih` di seluruh project.
4. Login sebagai Eksekutor.
5. Buka daftar antrean.
6. Pastikan tiket yang terlihat sesuai region utama.
7. Buka form pengajuan region switch.
8. Pastikan wording menjelaskan akses sementara.
9. Ajukan region switch.
10. Login sebagai Koordinator.
11. Approve region switch.
12. Login lagi sebagai Eksekutor.
13. Pastikan tiket region tambahan terlihat.
14. Reject pengajuan lain jika ada.
15. Login sebagai Supervisor.
16. Pastikan dashboard tetap read-only.
17. Kirim laporan Telegram baru.
18. Pastikan laporan tetap masuk.

## Rollback Plan
1. Jika wording membuat UI terlalu panjang, persingkat teks.
2. Jika region switch error, rollback perubahan pada file yang tidak seharusnya diubah.
3. Jika query tiket berubah, rollback model terkait.
4. Jika dashboard berubah, rollback view terkait.
5. Karena F011 hanya wording, rollback seharusnya cukup pada view/helper text.

## Out of Scope
1. Mengubah query akses region.
2. Mengubah controller region switch.
3. Mengubah model region switch.
4. Mengubah flow approval.
5. Mengubah database.
6. Mengubah Telegram bot.
7. Mengubah KPI supervisor.