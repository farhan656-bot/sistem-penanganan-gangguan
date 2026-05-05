# Technical Plan — Supervisor KPI Dashboard Refinement

## Feature ID
F004

## Feature Name
Supervisor KPI Dashboard Refinement

## Objective
Menyempurnakan dashboard supervisor agar akurat, informatif, read-only, dan sesuai rule operasional sistem.

## Existing Context
Sistem saat ini sudah memiliki:
- role supervisor
- dashboard supervisor awal
- model KPI dasar
- lifecycle tiket dengan status:
  - baru
  - tersedia
  - diambil
  - didelegasikan
  - selesai
  - perlu_tindak_lanjut
  - eskalasi
- fitur Region Switch F007 yang sudah berjalan
- struktur MVC dengan Express.js, MySQL, dan EJS

Feature ini akan merapikan perhitungan, filter, grafik, dan tampilan dashboard supervisor.

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5
- Chart.js

## Database Impact
Tidak ada perubahan struktur database yang wajib, dengan asumsi tabel dan kolom berikut sudah tersedia:

### Reports
- `reports.status_internal`
- `reports.received_at`
- `reports.taken_at`
- `reports.resolved_at`
- `reports.current_region_id`
- `reports.current_assigned_user_id`

### Users
- `users.id`
- `users.full_name`
- `users.role_id`
- `users.region_id`

### Regions
- `regions.id`
- `regions.code`
- `regions.name`

### Region Switch Requests
- `region_switch_requests.requester_user_id`
- `region_switch_requests.from_region_id`
- `region_switch_requests.to_region_id`
- `region_switch_requests.status`
- `region_switch_requests.requested_at`
- `region_switch_requests.approved_at`
- `region_switch_requests.expired_at`

Jika nama kolom berbeda dengan implementasi aktual, query harus disesuaikan dengan schema database proyek.

## Files Likely Impacted

### Models
- `models/supervisorModel.js`
- `models/regionSwitchModel.js` jika diperlukan

### Controllers
- `controllers/dashboardController.js`

### Routes
- `routes/dashboardRoutes.js` review only if needed

### Views
- `views/supervisor/dashboard.ejs`

### Public Assets
- `public/js/supervisor-dashboard.js` jika script chart dipisahkan
- `public/css/dashboard.css` jika styling dipisahkan

## Backend Design

### `supervisorModel.js`
Perlu menyediakan query/agregasi untuk:

1. `getSummaryKPI(filters)`
   - total reports
   - total available
   - total in progress
   - total completed
   - total follow up
   - total escalated
   - average response time
   - average resolution time
   - completion rate
   - active backlog

2. `getRegionSummary(filters)`
   - rekap district berdasarkan status

3. `getUserPerformance(filters)`
   - rekap kinerja eksekutor

4. `getStatusChartData(filters)`
   - data jumlah tiket per status untuk chart

5. `getTrendChartData(filters)`
   - data jumlah tiket per tanggal untuk chart tren laporan

6. `getRegionComparisonChartData(filters)`
   - data jumlah tiket per district untuk chart perbandingan

7. `getAttentionTickets(filters)`
   - daftar tiket yang perlu perhatian supervisor

8. `getRegionSwitchHistory(filters)`
   - daftar riwayat Region Switch F007

## KPI Logic

### In Progress Definition
Status yang dihitung sedang ditangani:
- `diambil`
- `didelegasikan`

### Final Completed Definition
Status yang dihitung final selesai:
- `selesai`

### Not Final Completed
Status berikut tidak dihitung sebagai final selesai:
- `perlu_tindak_lanjut`
- `eskalasi`

### Available Definition
Status yang dihitung tersedia:
- `tersedia`

### Active Backlog Definition
Backlog aktif dihitung dari tiket yang belum selesai final:
- `tersedia`
- `diambil`
- `didelegasikan`
- `perlu_tindak_lanjut`
- `eskalasi`

### Completion Rate
Tingkat penyelesaian dihitung dari:

- total tiket selesai dibagi total tiket
- jika total tiket 0, tampilkan 0%

## Time Calculation

### Average Response Time
- `received_at` → `taken_at`

### Average Resolution Time
- `taken_at` → `resolved_at`

Jika data waktu belum lengkap, nilai rata-rata boleh tampil `-`.

## Filter Design

### Filter Periode
Filter periode menggunakan tanggal tiket masuk dari `reports.received_at`.

Pilihan minimal:
- semua
- hari ini
- 7 hari terakhir
- bulan ini
- custom tanggal

### Filter District
Filter district menggunakan `reports.current_region_id`.

Pilihan minimal:
- semua
- district yang tersedia pada tabel `regions`

### Filter Status
Filter status menggunakan `reports.status_internal`.

Pilihan minimal:
- semua
- tersedia
- diambil
- didelegasikan
- selesai
- perlu_tindak_lanjut
- eskalasi

## `dashboardController.js`
Perlu:
- membaca filter dari `req.query`
- menyiapkan default filter
- mengambil data dari `supervisorModel`
- memformat menit menjadi bentuk yang mudah dibaca
- memformat persentase tingkat penyelesaian
- mengirimkan summary, chart data, dan rekap ke view
- memastikan fallback nilai kosong aman

## View Design

### `views/supervisor/dashboard.ejs`
Halaman harus memuat:
1. header dashboard supervisor
2. filter periode, district, dan status
3. card summary KPI
4. grafik status tiket
5. grafik tren laporan
6. grafik perbandingan district
7. tabel rekap per district
8. tabel rekap kinerja eksekutor
9. tabel tiket perlu perhatian
10. tabel riwayat Region Switch F007

### UI/UX Guidelines
- gunakan card Bootstrap untuk summary
- gunakan tabel responsif
- gunakan Chart.js untuk grafik sederhana
- tampilkan angka dan label dengan jelas
- gunakan warna status yang konsisten
- tetap read-only
- tidak ada tombol aksi operasional
- gaya enterprise Telkom-like:
  - latar terang
  - card bersih
  - tipografi jelas
  - layout rapi

## Access Control Plan
- Route dashboard supervisor hanya untuk role `supervisor`
- Jika project mengizinkan `super_admin` melihat semua fitur, akses dapat disesuaikan dengan rule global sistem
- Tidak ada form mutasi data
- Tidak ada tombol aksi operasional
- Tidak ada tombol approve/reject Region Switch pada dashboard supervisor

## Validation Rules
1. Dashboard tetap harus tampil walaupun data kosong.
2. Nilai rata-rata boleh tampil `-` jika belum ada data.
3. Chart tidak boleh error saat data kosong.
4. User non-supervisor tidak boleh mengakses halaman supervisor, kecuali rule global project mengizinkan super admin.
5. Filter harus memengaruhi KPI, grafik, dan tabel yang relevan.
6. Tiket `perlu_tindak_lanjut` tidak boleh dihitung sebagai selesai.
7. Tiket `eskalasi` tidak boleh dihitung sebagai selesai.
8. Data Region Switch F007 hanya ditampilkan sebagai informasi read-only.

## Testing Strategy

### Manual Test Cases
1. Login sebagai supervisor.
2. Buka dashboard supervisor.
3. Verifikasi summary KPI.
4. Verifikasi filter periode.
5. Verifikasi filter district.
6. Verifikasi filter status.
7. Verifikasi tiket `perlu_tindak_lanjut` tidak dihitung sebagai selesai.
8. Verifikasi tiket `eskalasi` tidak dihitung sebagai selesai.
9. Verifikasi rekap district.
10. Verifikasi rekap pegawai.
11. Verifikasi grafik status tiket.
12. Verifikasi grafik tren laporan.
13. Verifikasi grafik perbandingan district.
14. Verifikasi tabel tiket perlu perhatian.
15. Verifikasi tabel riwayat Region Switch F007.
16. Verifikasi dashboard tetap read-only.

## Out of Scope
1. Chart interaktif dengan drill-down.
2. Export PDF/Excel.
3. Notifikasi real-time.
4. Perubahan alur approval Region Switch F007.
5. Perubahan alur Bot Telegram.
6. Aksi operasional dari dashboard supervisor.

Catatan: status `baru` tidak digunakan pada implementasi saat ini karena tiket yang masuk dari Bot Telegram dan input manual langsung berstatus `tersedia`.