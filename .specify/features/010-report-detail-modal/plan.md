# Technical Plan — Report Detail Modal

## Feature ID
F010

## Feature Name
Report Detail Modal

## Objective
Mengubah detail laporan agar ditampilkan dalam bentuk popup/modal dari halaman daftar antrean laporan, sehingga pengguna dapat melihat detail tiket tanpa berpindah halaman.

## Existing Context
Sistem saat ini sudah memiliki:
- autentikasi dan RBAC
- daftar antrean laporan/tiket
- halaman atau route detail laporan
- data laporan pada tabel `reports`
- data assignment pada tabel `report_assignments`
- data attachment pada tabel `report_attachments`
- data log pada tabel `report_logs`
- data user pada tabel `users`
- data region pada tabel `regions`
- EJS views
- Bootstrap 5
- struktur MVC
- MySQL dan mysql2/promise

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

F010 tidak membutuhkan:
- tabel baru
- kolom baru
- penghapusan data
- perubahan relasi database
- perubahan status tiket

## Files Likely Impacted

### Views
Periksa view daftar antrean laporan:
- `views/reports/index.ejs`
- `views/reports/list.ejs`
- `views/eksekutor/reports.ejs`
- `views/koordinator/reports.ejs`
- atau nama file daftar laporan sesuai struktur project.

Periksa view detail laporan lama:
- `views/reports/detail.ejs`
- atau nama file detail sesuai struktur project.

Jika diperlukan, buat partial baru:
- `views/reports/partials/detail-modal.ejs`
- atau sesuaikan dengan struktur project.

### Routes
Periksa route detail laporan:
- `routes/reportRoutes.js`
- `routes/eksekutorRoutes.js`
- `routes/koordinatorRoutes.js`
- atau route sesuai struktur project.

Jika memakai endpoint JSON, dapat dibuat route seperti:
- `GET /reports/:id/detail-json`
- atau route lain sesuai konvensi project.

### Controllers
Periksa controller detail laporan:
- `controllers/reportController.js`
- `controllers/dashboardController.js`
- atau controller sesuai struktur project.

Jika menggunakan endpoint JSON, tambahkan method controller untuk mengambil detail.

### Models
Periksa model laporan:
- `models/reportModel.js`
- `models/reportAttachmentModel.js`
- `models/reportLogModel.js`
- atau model sesuai struktur project.

Query data detail harus tetap berada di model.

### Public JS
Jika modal menggunakan fetch/AJAX:
- `public/js/report-detail-modal.js`
- atau script inline terbatas pada view jika struktur project belum memakai file JS terpisah.

## Implementation Options

### Option A — Modal Rendered from Existing List Data
Gunakan data yang sudah tersedia pada daftar laporan untuk mengisi modal.

Kelebihan:
- lebih sederhana
- tidak perlu route JSON baru
- lebih sedikit perubahan backend

Kekurangan:
- data detail mungkin tidak lengkap
- attachment/media sulit ditampilkan jika belum ada di list

### Option B — Modal Uses JSON Endpoint
Tombol Detail memanggil endpoint JSON untuk mengambil data detail laporan.

Kelebihan:
- data lebih lengkap
- attachment/media dapat dimuat
- lebih fleksibel untuk tiket berbeda

Kekurangan:
- perlu route/controller/model tambahan
- perlu JavaScript fetch

## Recommended Approach
Gunakan Option B jika sistem membutuhkan detail lengkap termasuk attachment dan media Telegram. Namun, jika ingin aman dan bertahap, mulai dari Option A atau gunakan route detail lama sebagai sumber data yang sudah tersedia.

Rekomendasi implementasi:
1. Pertahankan halaman detail lama sebagai fallback.
2. Tambahkan modal Bootstrap pada halaman daftar laporan.
3. Buat tombol Detail membuka modal.
4. Jika data list belum lengkap, buat endpoint JSON yang mengambil detail melalui model.
5. Pastikan endpoint JSON dilindungi middleware login dan role.

## Implementation Plan

### Step 1 — Review Existing Detail Flow
1. Cari tombol Detail yang ada pada daftar laporan.
2. Cari route detail laporan lama.
3. Cari controller detail laporan.
4. Cari model yang mengambil detail laporan.
5. Catat data apa saja yang sudah tersedia.

### Step 2 — Add Bootstrap Modal Structure
1. Tambahkan struktur modal pada halaman daftar laporan.
2. Modal memiliki:
   - title
   - body
   - close button
3. Modal menggunakan Bootstrap 5.
4. Modal tidak boleh mengganggu tabel.

### Step 3 — Connect Detail Button to Modal
1. Ubah tombol Detail agar membuka modal.
2. Jika memakai data attribute, isi data penting dari baris tabel.
3. Jika memakai fetch, simpan report id pada tombol.
4. Pastikan tombol tidak lagi memaksa pindah halaman jika modal sudah tersedia.

### Step 4 — Prepare Detail Data
Data yang perlu ditampilkan:
- Ticket ID
- Order ID
- WO Number
- Source channel
- Service type
- Segment
- Provider
- Telkom area
- Branch
- Cluster
- STO
- Summary
- Service ID
- Region
- Assigned user
- Status internal
- Status WFM
- Status Andalas
- Completion status
- Completion notes jika ada
- received_at
- taken_at
- resolved_at
- closed_at
- created_at
- updated_at
- attachment/media jika tersedia

### Step 5 — Add JSON Endpoint if Needed
Jika data modal perlu diambil secara lengkap:
1. Tambahkan route GET detail JSON.
2. Route harus dilindungi middleware login.
3. Route harus memakai aturan akses yang sama dengan detail lama.
4. Controller memanggil model.
5. Model mengambil report detail, attachment, dan media jika tersedia.
6. Response JSON harus aman dan tidak mengirim data sensitif.

### Step 6 — Render Data in Modal
1. Saat tombol Detail diklik, tampilkan loading state.
2. Isi modal dengan data laporan.
3. Field NULL ditampilkan sebagai tanda `-`.
4. Teks panjang dibatasi agar rapi.
5. Attachment ditampilkan sebagai link atau preview sesuai sistem yang sudah ada.
6. Media Telegram ditampilkan jika data tersedia.

### Step 7 — Safety Check
Pastikan tidak ada perubahan pada:
- pengambilan tiket
- penyelesaian tiket
- delegasi tiket
- Telegram intake
- Telegram feedback
- Region Switch F007
- KPI supervisor
- RBAC middleware
- database

## Access Control Plan
Tidak ada perubahan aturan akses.

Aturan tetap:
- Supervisor hanya melihat detail secara read-only.
- Eksekutor hanya melihat detail sesuai tiket yang dapat diaksesnya.
- Koordinator melihat detail sesuai kewenangan operasionalnya.
- Super Admin mengikuti akses yang sudah tersedia pada sistem.
- Route JSON detail tidak boleh dapat diakses tanpa login.

## Validation Rules
1. Detail modal hanya dapat dibuka oleh user login.
2. Data detail mengikuti hak akses yang sudah ada.
3. Modal tidak menyediakan aksi operasional baru.
4. Field kosong ditampilkan dengan aman.
5. Attachment/media kosong tidak menyebabkan error.
6. Tidak ada perubahan database.
7. Tidak ada perubahan business logic tiket.

## Testing Strategy

### Manual Test Cases
1. Login sebagai Eksekutor.
2. Buka daftar antrean kerja.
3. Klik tombol Detail.
4. Pastikan modal detail muncul.
5. Pastikan data utama tiket tampil.
6. Tutup modal.
7. Buka detail tiket lain.
8. Pastikan isi modal berubah sesuai tiket.
9. Login sebagai Koordinator.
10. Buka daftar antrean laporan.
11. Klik Detail.
12. Pastikan modal tampil.
13. Login sebagai Supervisor.
14. Buka dashboard/daftar jika tersedia.
15. Pastikan detail hanya read-only.
16. Login sebagai Super Admin jika masih memiliki akses antrean.
17. Klik Detail.
18. Pastikan modal tampil.
19. Pastikan daftar laporan tetap bisa difilter.
20. Pastikan ambil tugas/delegasi tetap berjalan.

## Rollback Plan
1. Jika modal error, kembalikan tombol Detail ke route detail lama.
2. Jika endpoint JSON error, nonaktifkan fetch dan gunakan halaman detail lama sebagai fallback.
3. Jika tabel rusak, rollback perubahan pada view daftar laporan.
4. Jika akses role bermasalah, rollback route/controller JSON.
5. Jangan hapus halaman detail lama sampai F010 stabil.

## Out of Scope
1. Menghapus laporan manual.
2. Mengubah flow selesai.
3. Mengubah flow return.
4. Mengubah flow eskalasi.
5. Menambah kode DIIT.
6. Mengubah Telegram feedback.
7. Mengubah Region Switch.
8. Mengubah KPI supervisor.