# Tasks — Manual Report Entry

## Feature ID
F005

## Analysis
- [ ] Review constitution dan role yang boleh input manual
- [ ] Review struktur tabel `reports`
- [ ] Pastikan field inti tiket sudah tersedia di database

## Report Model
- [ ] Tambahkan fungsi `createManualReport()` di `reportModel.js`
- [ ] Tambahkan validasi duplikasi `ticket_id`
- [ ] Set `source_channel = manual`
- [ ] Set `status_internal = tersedia`
- [ ] Set `reported_region_id`
- [ ] Set `current_region_id`
- [ ] Set `received_at`
- [ ] Tambahkan log `create_manual_report`

## Report Controller
- [ ] Tambahkan `showCreateReportForm()`
- [ ] Tambahkan `createManualReport()`
- [ ] Validasi input wajib
- [ ] Tambahkan flash message sukses/gagal

## Report Routes
- [ ] Tambahkan `GET /reports/create`
- [ ] Tambahkan `POST /reports`
- [ ] Lindungi route dengan middleware auth
- [ ] Batasi akses hanya untuk `koordinator` dan `super_admin`

## Views
- [ ] Buat `views/reports/create.ejs`
- [ ] Tambahkan field form inti tiket
- [ ] Tambahkan dropdown district
- [ ] Tambahkan navigasi kembali ke daftar tiket
- [ ] Tambahkan tampilan error/sukses
- [ ] Review `views/reports/index.ejs`
- [ ] Tambahkan tombol “Tambah Laporan Manual” untuk role yang berwenang

## Validation
- [ ] Validasi `ticket_id`
- [ ] Validasi `summary`
- [ ] Validasi district
- [ ] Validasi duplikasi ticket_id

## Manual Testing
- [ ] Test koordinator bisa buka form
- [ ] Test super admin bisa buka form
- [ ] Test role lain tidak bisa buka form
- [ ] Test submit tiket valid
- [ ] Test ticket_id duplikat gagal
- [ ] Test tiket muncul di task pool
- [ ] Test status awal `tersedia`
- [ ] Test log `create_manual_report`

## Documentation
- [ ] Simpan screenshot form create report
- [ ] Simpan screenshot tiket hasil input manual
- [ ] Simpan screenshot error duplicate ticket_id
- [ ] Catat file yang berubah untuk BAB IV