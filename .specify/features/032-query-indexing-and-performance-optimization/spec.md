# Feature Spec — Query Indexing and Performance Optimization

## Feature ID
F032

## Feature Name
Query Indexing and Performance Optimization

## Summary
Fitur ini berfokus pada optimasi query database, indexing, dan stabilisasi performa sistem agar daftar antrean kerja, dashboard, pagination, dan auto-refresh tetap ringan saat jumlah laporan meningkat. Optimasi dilakukan tanpa mengubah alur bisnis utama sistem.

## Business Background
Sistem menerima laporan dari Telegram dan menampilkannya pada halaman antrean kerja. Setelah F029, F030, dan F031 diterapkan, sistem sudah memiliki segmentasi status, pagination, dan auto-refresh. Namun karena laporan dapat mencapai 50–100 laporan per hari, query database perlu dioptimalkan agar sistem tetap ringan dan stabil.

## Problem Statement
Jika jumlah laporan semakin banyak, query yang tidak optimal dapat membuat halaman antrean, dashboard, pagination, dan auto-refresh menjadi lambat. Beban terbesar kemungkinan berasal dari query daftar laporan, query count status, query dashboard, dan endpoint polling F031.

## Goals
1. Mengecek query daftar antrean kerja.
2. Memastikan pagination memakai LIMIT dan OFFSET.
3. Memastikan endpoint polling F031 tetap ringan.
4. Memastikan dashboard F028 tidak mengambil data berlebihan.
5. Mengurangi penggunaan SELECT * pada daftar data.
6. Mengoptimalkan query count status F029.
7. Menambahkan index database jika diperlukan.
8. Memastikan query tetap mengikuti RBAC.
9. Memastikan sistem tetap stabil untuk asumsi 50–100 laporan per hari.
10. Tidak mengubah flow ticketing.

## Non-Goals
1. Tidak mengubah alur Telegram.
2. Tidak mengubah parsing Telegram.
3. Tidak mengubah flow ambil tiket.
4. Tidak mengubah flow selesai.
5. Tidak mengubah flow return.
6. Tidak mengubah flow eskalasi.
7. Tidak mengubah upload file.
8. Tidak mengubah UI besar-besaran.
9. Tidak mengganti database.
10. Tidak memakai Redis.
11. Tidak memakai queue worker baru.
12. Tidak memakai WebSocket/SSE.

## Main Optimization Targets

### 1. Queue List Query
Query daftar antrean kerja harus:
- menggunakan LIMIT dan OFFSET,
- hanya mengambil kolom yang dibutuhkan untuk tabel,
- tidak mengambil attachment,
- tidak mengambil report logs,
- tidak mengambil media Telegram,
- tetap mengikuti filter status, region, search, role access, dan pagination.

### 2. Queue Count Query
Query count untuk tab status harus:
- menggunakan COUNT atau SUM(CASE),
- tidak mengambil semua data,
- mengikuti role access,
- mengikuti region access.

### 3. Polling Endpoint F031
Endpoint check-new harus:
- menggunakan COUNT dan/atau MAX(id),
- tidak mengambil detail tiket lengkap,
- tidak mengambil attachment,
- tidak mengambil log,
- tidak mengambil media Telegram,
- hanya mengecek data baru sesuai hak akses user.

### 4. Dashboard F028
Dashboard harus:
- memakai COUNT,
- memakai GROUP BY seperlunya,
- memakai LIMIT untuk aktivitas terbaru,
- tidak mengambil semua laporan.

### 5. Detail Modal
Detail lengkap, attachment, media Telegram, dan log hanya dimuat saat user membuka modal detail.

## Recommended Index Candidates

Index tidak boleh ditambahkan sembarangan. Cek query existing terlebih dahulu.

Index yang kemungkinan dibutuhkan pada tabel `reports`:

```sql id="g6uv0t"
current_region_id
status_internal
current_assigned_user_id
received_at
created_at
id
ticket_id