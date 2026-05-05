# Technical Plan — Manual Report Entry

## Feature ID
F005

## Feature Name
Manual Report Entry

## Objective
Menyediakan jalur input tiket manual ke sistem web agar operasional dan pengujian dapat berjalan tanpa menunggu integrasi Bot Telegram.

## Existing Context
Sistem saat ini sudah memiliki:
- autentikasi dan RBAC,
- super admin & user management,
- lifecycle tiket,
- delegation & assignment cancellation,
- dashboard supervisor.

Namun sistem belum memiliki:
- halaman input tiket manual,
- route dan controller untuk create report manual,
- validasi duplikasi ticket_id dari antarmuka web.

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5

## Database Impact
Tidak ada perubahan struktur database yang wajib, dengan asumsi tabel `reports` sudah memiliki kolom inti yang dibutuhkan.

### Existing fields expected
- `source_channel`
- `ticket_id`
- `order_id`
- `service_type`
- `provider`
- `branch_name`
- `cluster_name`
- `sto`
- `summary`
- `status_wfm`
- `status_andalas`
- `status_internal`
- `reported_region_id`
- `current_region_id`
- `received_at`

## Files Likely Impacted

### Models
- `models/reportModel.js`
- optional: `models/regionModel.js` jika ingin dipisah, tetapi tidak wajib

### Controllers
- `controllers/reportController.js`

### Routes
- `routes/reportRoutes.js`

### Views
- `views/reports/create.ejs`
- optional: update `views/reports/index.ejs` untuk tombol tambah laporan manual

## Backend Design

### `reportModel.js`
Tambahkan fungsi baru, misalnya:
- `createManualReport(data, currentUser)`

Tanggung jawab:
- validasi duplikasi `ticket_id`
- insert ke tabel `reports`
- set:
  - `source_channel = manual`
  - `status_internal = tersedia`
  - `reported_region_id`
  - `current_region_id`
  - `received_at = NOW()`
- insert log aktivitas ke `report_logs`

### `reportController.js`
Tambahkan handler:
- `showCreateReportForm()`
- `createManualReport()`

### `reportRoutes.js`
Tambahkan route:
- `GET /reports/create`
- `POST /reports`

Akses:
- `koordinator`
- `super_admin`

## View Design

### `views/reports/create.ejs`
Form harus mendukung field inti:
- ticket_id
- order_id
- service_type
- provider
- branch_name
- cluster_name
- sto
- summary
- status_wfm
- status_andalas
- district/region

UI harus:
- sederhana
- rapi
- konsisten dengan gaya enterprise Telkom-like
- mudah dipakai untuk testing dan operasional

### Navigation
- tambah tombol “Tambah Laporan Manual” di halaman yang relevan
- tombol hanya muncul untuk role yang berwenang

## Validation Rules
1. `ticket_id` wajib
2. `summary` wajib
3. `region_id` wajib
4. `ticket_id` harus unik
5. field lain bisa diatur mandatory/optional sesuai implementasi

## Logging Plan
Saat tiket manual dibuat:
- buat log `create_manual_report`
- deskripsi minimal memuat:
  - ticket_id
  - siapa yang input
  - district awal

## Testing Strategy

### Manual Test Cases
1. Koordinator buka form create report
2. Super admin buka form create report
3. Submit report valid
4. Submit report dengan ticket_id duplikat
5. Verifikasi tiket muncul di task pool
6. Verifikasi status awal `tersedia`
7. Verifikasi log aktivitas

## Out of Scope
1. Parsing pesan bot
2. Merge data tambahan otomatis
3. Feedback bot otomatis
4. Upload lampiran saat create report awal