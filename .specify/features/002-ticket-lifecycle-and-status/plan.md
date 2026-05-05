# Technical Plan — Ticket Lifecycle & Status

## Feature ID
F002

## Feature Name
Ticket Lifecycle & Status

## Objective
Menyempurnakan model status tiket agar sesuai proses operasional nyata dan memastikan SLA/KPI dihitung dengan benar.

## Existing Context
Saat ini sistem sudah memiliki:
- role-based login
- ambil tugas
- delegasi
- batal tugas
- submit penyelesaian tiket
- dashboard supervisor

Namun status tiket masih perlu disempurnakan agar mendukung:
- selesai
- perlu tindak lanjut
- eskalasi

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5

## Architecture Impact
Feature ini akan memengaruhi:
- schema/status enum pada tabel `reports`
- model `reportModel.js`
- controller `reportController.js`
- views antrean tiket
- views detail tiket
- dashboard KPI supervisor

## Database Plan

### Table impacted
- `reports`

### Database change
Update enum `status_internal` agar mendukung:
- `baru`
- `tersedia`
- `diambil`
- `didelegasikan`
- `selesai`
- `perlu_tindak_lanjut`
- `eskalasi`

### SQL expectation
Perlu alter table untuk kolom `status_internal`.

## Backend Design

### Model changes
#### `reportModel.js`
- pastikan `completeReport()` menerima hasil akhir:
  - `selesai`
  - `perlu_tindak_lanjut`
  - `eskalasi`
- update query list/filter agar status baru ikut terbaca
- log status akhir sesuai hasil submit

#### `supervisorModel.js`
- pastikan KPI summary dan agregasi tetap valid dengan status baru
- `in progress` dapat dihitung dari:
  - `diambil`
  - `didelegasikan`
  - `perlu_tindak_lanjut`
  - opsional: `eskalasi` dipisah atau dihitung tersendiri

### Controller changes
#### `reportController.js`
- validasi `completion_status`
- redirect dan flash message tetap konsisten

### View changes
#### `views/reports/index.ejs`
- tambah badge baru:
  - perlu tindak lanjut
  - eskalasi
- tambah opsi filter baru

#### `views/reports/show.ejs`
- ubah dropdown hasil akhir agar mendukung:
  - selesai
  - perlu tindak lanjut
  - eskalasi

#### `views/supervisor/dashboard.ejs`
- jika diperlukan, tampilkan rekap status baru

## Validation Rules
1. `completion_notes` wajib
2. `completion_status` wajib
3. `proof_file` tetap wajib
4. hanya penanggung jawab aktif yang boleh submit hasil akhir

## Logging Rules
Tambahkan log aktivitas untuk:
- `complete_report`
- `follow_up_report`
- `escalate_report`

At minimum, `description` harus menyebut status akhir yang dipilih.

## UI/UX Plan
- status badge harus konsisten dan mudah dibedakan
- gunakan warna yang jelas:
  - selesai → hijau
  - perlu tindak lanjut → oranye/kuning tua
  - eskalasi → merah atau gelap
- filter status harus jelas dan mudah dipakai operator

## Testing Strategy
### Manual tests
1. submit tiket dengan hasil akhir `selesai`
2. submit tiket dengan hasil akhir `perlu_tindak_lanjut`
3. submit tiket dengan hasil akhir `eskalasi`
4. cek badge di list tiket
5. cek filter status
6. cek detail tiket
7. cek dashboard KPI supervisor

## Out of Scope
1. feedback otomatis ke bot
2. reopen multi-step workflow terpisah
3. integrasi ke sistem eksternal DIT/Sygap