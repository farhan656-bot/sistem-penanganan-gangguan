# Tasks — Supervisor KPI Dashboard Refinement

## Feature ID
F004

## Analysis
- [ ] Review constitution untuk rule supervisor read-only
- [ ] Review hasil F002 terkait status tiket
- [ ] Review hasil F003 terkait distribusi assignment lintas district
- [ ] Review hasil F007 terkait Region Switch Approval
- [ ] Review dashboard supervisor yang sudah berjalan
- [ ] Review schema tabel `reports`
- [ ] Review schema tabel `users`
- [ ] Review schema tabel `regions`
- [ ] Review schema tabel `region_switch_requests`

## Supervisor Model

### Summary KPI
- [ ] Review `getSummaryKPI()` di `supervisorModel.js`
- [x] Tambahkan filter periode
- [x] Tambahkan filter district
- [x] Tambahkan filter status
- [ ] Tambahkan hitungan `total_follow_up`
- [ ] Tambahkan hitungan `total_escalated`
- [ ] Tambahkan hitungan `completion_rate`
- [ ] Tambahkan hitungan `active_backlog`
- [ ] Pastikan `total_completed` hanya menghitung status `selesai`
- [ ] Pastikan `total_in_progress` menghitung status `diambil` dan `didelegasikan`
- [ ] Pastikan `avg_response_minutes` memakai `received_at -> taken_at`
- [ ] Pastikan `avg_resolution_minutes` memakai `taken_at -> resolved_at`
- [ ] Pastikan nilai kosong tetap aman

### Region Summary
- [ ] Review `getRegionSummary()`
- [ ] Tambahkan filter periode
- [ ] Tambahkan filter district
- [ ] Tambahkan filter status
- [ ] Tambahkan kolom follow up
- [ ] Tambahkan kolom escalated
- [ ] Pastikan district tanpa tiket tetap tampil
- [ ] Pastikan district tiket memakai `reports.current_region_id`

### User Performance
- [ ] Review `getUserPerformance()`
- [ ] Tambahkan filter periode
- [ ] Tambahkan filter district
- [ ] Tambahkan filter status
- [ ] Pastikan hanya role `eksekutor` yang dihitung
- [ ] Pastikan total tiket ditangani valid
- [ ] Pastikan total tiket selesai valid
- [ ] Pastikan rata-rata waktu penyelesaian valid
- [ ] Pastikan user tanpa tiket tetap aman ditampilkan

### Chart Data
- [ ] Buat query `getStatusChartData()`
- [ ] Hitung jumlah tiket per status
- [ ] Buat query `getTrendChartData()`
- [ ] Hitung jumlah tiket per tanggal berdasarkan `received_at`
- [ ] Buat query `getRegionComparisonChartData()`
- [ ] Hitung jumlah tiket per district
- [ ] Pastikan chart data mengikuti filter
- [ ] Pastikan chart data aman saat kosong

### Attention Tickets
- [ ] Buat query `getAttentionTickets()`
- [ ] Tampilkan tiket status `perlu_tindak_lanjut`
- [ ] Tampilkan tiket status `eskalasi`
- [ ] Tampilkan tiket yang sedang ditangani terlalu lama jika rule tersedia
- [ ] Tampilkan ticket id atau order id
- [ ] Tampilkan district
- [ ] Tampilkan status
- [ ] Tampilkan eksekutor
- [ ] Tampilkan durasi atau waktu terakhir update jika tersedia
- [ ] Batasi jumlah data agar dashboard tetap rapi

### Region Switch History
- [ ] Buat query `getRegionSwitchHistory()`
- [ ] Ambil data dari tabel `region_switch_requests`
- [ ] Join ke tabel `users` untuk nama eksekutor
- [ ] Join ke tabel `regions` untuk district asal
- [ ] Join ke tabel `regions` untuk district tujuan
- [ ] Tampilkan status request
- [ ] Tampilkan waktu pengajuan
- [ ] Tampilkan waktu approval jika tersedia
- [ ] Tampilkan waktu expired jika tersedia
- [ ] Batasi data terbaru agar dashboard tetap ringan

## Dashboard Controller
- [ ] Review `supervisorDashboard()` di `dashboardController.js`
- [ ] Ambil filter dari `req.query`
- [ ] Buat default filter jika query kosong
- [ ] Kirim filter ke semua fungsi model yang relevan
- [ ] Tambahkan summary untuk `total_follow_up`
- [ ] Tambahkan summary untuk `total_escalated`
- [ ] Tambahkan summary untuk `completion_rate`
- [ ] Tambahkan summary untuk `active_backlog`
- [ ] Ambil data chart status tiket
- [ ] Ambil data chart tren laporan
- [ ] Ambil data chart perbandingan district
- [ ] Ambil data tiket perlu perhatian
- [ ] Ambil data riwayat Region Switch F007
- [ ] Pastikan format menit tetap mudah dibaca
- [ ] Pastikan format persentase mudah dibaca
- [ ] Pastikan fallback nilai kosong aman
- [ ] Pastikan error ditangani tanpa mengubah data operasional

## Supervisor View
- [ ] Review `views/supervisor/dashboard.ejs`
- [ ] Tambahkan form filter periode
- [ ] Tambahkan form filter district
- [ ] Tambahkan form filter status
- [ ] Tambahkan tombol terapkan filter
- [ ] Tambahkan tombol reset filter jika diperlukan
- [x] Tambahkan card KPI `Tingkat Penyelesaian`
- [x] Tambahkan card KPI `Backlog Aktif`
- [ ] Pastikan card KPI `Perlu Tindak Lanjut` tampil
- [ ] Pastikan card KPI `Eskalasi` tampil
- [x] Tambahkan canvas grafik status tiket
- [x] Tambahkan canvas grafik tren laporan
- [x] Tambahkan canvas grafik perbandingan district
- [ ] Tambahkan script Chart.js
- [ ] Update tabel rekap district
- [ ] Tambahkan kolom `Perlu Tindak Lanjut`
- [ ] Tambahkan kolom `Eskalasi`
- [ ] Review tabel rekap pegawai
- [x] Tambahkan tabel tiket perlu perhatian
- [x] Tambahkan tabel riwayat Region Switch F007
- [ ] Pastikan semua tabel aman saat data kosong
- [ ] Pastikan tidak ada aksi mutasi data
- [x] Pastikan UI tetap rapi dan read-only

## Access Control
- [ ] Review route `/dashboard/supervisor`
- [ ] Pastikan hanya role `supervisor` yang bisa akses
- [ ] Jika global rule mengizinkan super admin, pastikan akses super admin tetap aman
- [ ] Pastikan tidak ada route aksi dari halaman supervisor
- [ ] Pastikan tidak ada tombol edit
- [ ] Pastikan tidak ada tombol hapus
- [ ] Pastikan tidak ada tombol approve/reject
- [ ] Pastikan tidak ada form mutasi data

## Testing

### Basic Access Test
- [ ] Test login supervisor
- [ ] Test dashboard supervisor tampil
- [ ] Test role non-supervisor tidak bisa akses
- [ ] Test dashboard tetap read-only

### KPI Test
- [ ] Test total laporan
- [ ] Test total tersedia
- [ ] Test total sedang ditangani
- [ ] Test total selesai hanya menghitung `selesai`
- [ ] Test tiket `perlu_tindak_lanjut` tidak masuk total selesai
- [ ] Test tiket `eskalasi` tidak masuk total selesai
- [ ] Test active backlog
- [ ] Test completion rate
- [ ] Test average response time
- [ ] Test average resolution time

### Filter Test
- [ ] Test filter semua data
- [ ] Test filter hari ini
- [ ] Test filter 7 hari terakhir
- [ ] Test filter bulan ini
- [ ] Test filter custom tanggal jika dibuat
- [ ] Test filter district
- [ ] Test filter status
- [ ] Test kombinasi filter periode, district, dan status

### Chart Test
- [ ] Test grafik status tiket tampil
- [ ] Test grafik tren laporan tampil
- [ ] Test grafik perbandingan district tampil
- [ ] Test grafik berubah sesuai filter
- [ ] Test grafik aman saat data kosong

### Table Test
- [ ] Test rekap district
- [ ] Test rekap pegawai
- [ ] Test tiket perlu perhatian
- [ ] Test riwayat Region Switch F007
- [ ] Test kondisi tanpa data

### Negative Test
- [ ] Test dashboard tidak error jika ada tiket tanpa `taken_at`
- [ ] Test dashboard tidak error jika ada tiket tanpa `resolved_at`
- [ ] Test dashboard tidak error jika tidak ada Region Switch F007
- [ ] Test dashboard tidak error jika filter menghasilkan data kosong

## Documentation
- [ ] Simpan screenshot filter dashboard
- [ ] Simpan screenshot summary KPI
- [ ] Simpan screenshot grafik status tiket
- [ ] Simpan screenshot grafik tren laporan
- [ ] Simpan screenshot grafik perbandingan district
- [ ] Simpan screenshot rekap district
- [ ] Simpan screenshot rekap pegawai
- [ ] Simpan screenshot tiket perlu perhatian
- [ ] Simpan screenshot riwayat Region Switch F007
- [ ] Catat file yang berubah untuk BAB IV
- [ ] Catat hasil pengujian untuk BAB V