# Technical Plan — Delegation and Assignment Cancellation

## Feature ID
F003

## Feature Name
Delegation and Assignment Cancellation

## Objective
Mengimplementasikan dan/atau merapikan logika delegasi penanggung jawab lintas district serta pembatalan assignment aktif sesuai aturan operasional lapangan.

## Existing Context
Sistem saat ini sudah memiliki:
- autentikasi dan RBAC,
- listing tiket,
- ambil tugas,
- submit penyelesaian tiket,
- dashboard supervisor,
- model assignment dan log.

Feature ini akan memperjelas dan memvalidasi logika:
- delegasi lintas district,
- visibilitas tiket untuk eksekutor,
- pembatalan assignment oleh koordinator.

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5

## Database Impact
Tidak ada perubahan struktur database yang wajib, dengan asumsi tabel berikut sudah ada:
- `reports`
- `report_assignments`
- `report_logs`

Feature ini hanya menggunakan dan menegaskan logika pada skema yang sudah tersedia.

## Files Likely Impacted

### Models
- `models/reportModel.js`
- `models/userModel.js`

### Controllers
- `controllers/reportController.js`

### Routes
- `routes/reportRoutes.js`

### Views
- `views/reports/index.ejs`
- `views/reports/show.ejs`

## Backend Design

### `reportModel.js`
Perlu memastikan fungsi berikut tersedia dan benar:
- `getReports()`
- `getReportById()`
- `delegateReport()`
- `cancelAssignment()`

#### Delegation rules in model
- delegasi boleh untuk status:
  - `tersedia`
  - `diambil`
  - `didelegasikan`
- delegasi tidak mengubah `current_region_id`
- delegasi mengubah `current_assigned_user_id`
- assignment aktif lama di-set `is_active = 0`
- assignment baru dibuat dengan `assignment_type = delegation`

#### Cancellation rules in model
- batal assignment hanya untuk:
  - `diambil`
  - `didelegasikan`
- `current_assigned_user_id = NULL`
- `status_internal = tersedia`
- `taken_at` dapat direset ke `NULL`
- assignment aktif di-set nonaktif

### `userModel.js`
Perlu mendukung fungsi:
- `getEksekutorUsersByRegionCode(regionCode)`

### `reportController.js`
Perlu memastikan handler berikut tersedia:
- `showReportDetail()`
- `delegateReport()`
- `cancelAssignment()`

### `reportRoutes.js`
Perlu memastikan route berikut tersedia dan terlindungi role:
- `POST /reports/:id/delegate`
- `POST /reports/:id/cancel-assignment`

## View Design

### `views/reports/show.ejs`
Perlu menampilkan:
- form delegasi untuk koordinator
- form batal tugas untuk koordinator
- dropdown pegawai tujuan berdasarkan district lawan
- pesan bantuan bahwa delegasi hanya ke district lawan

### `views/reports/index.ejs`
Perlu menampilkan kondisi tiket yang sudah didelegasikan dengan jelas:
- badge status
- assigned user

## Access Control Plan
- Delegasi: hanya `koordinator`
- Cancel assignment: hanya `koordinator`
- Eksekutor: tidak boleh akses aksi ini
- Supervisor: read-only

## Validation Rules

### Delegasi
- `target_user_id` wajib
- `delegation_notes` wajib
- target user harus aktif
- target user harus role `eksekutor`
- target user harus district lawan
- target user tidak boleh sama dengan penanggung jawab aktif

### Batal Assignment
- `cancel_notes` wajib
- tiket harus memiliki assignment aktif
- status tiket harus `diambil` atau `didelegasikan`

## Logging Plan
Tambahkan / pastikan log untuk:
- `delegate_report`
- `cancel_assignment`

Deskripsi log minimal memuat:
- siapa pelaku
- tiket apa
- tujuan delegasi atau alasan pembatalan

## Testing Strategy

### Manual Test Cases
1. Delegasi tiket `tersedia`
2. Delegasi tiket `diambil`
3. Delegasi tiket `didelegasikan`
4. Dropdown district lawan
5. Eksekutor tujuan melihat tiket delegasi
6. Koordinator membatalkan assignment
7. Eksekutor tidak bisa membatalkan assignment
8. Supervisor tidak bisa mengakses aksi delegasi

## Out of Scope
1. Integrasi Telegram bot
2. Feedback bot saat delegasi
3. Workflow eskalasi ke sistem lain
4. Notifikasi real-time