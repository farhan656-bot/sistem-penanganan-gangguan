# Tasks — Delegation and Assignment Cancellation

## Feature ID
F003

## Analysis
- [ ] Review constitution dan aturan operasional delegasi
- [ ] Pastikan district rule PDG ↔ BKT sudah dipahami
- [ ] Pastikan tidak ada perubahan struktur database yang diperlukan

## User Model
- [ ] Review `getEksekutorUsersByRegionCode()` di `userModel.js`
- [ ] Pastikan query hanya mengambil user role `eksekutor`
- [ ] Pastikan query hanya mengambil user aktif
- [ ] Pastikan filter district lawan berjalan

## Report Model
- [ ] Review `getReports()` agar eksekutor hanya melihat:
  - district sendiri
  - tiket yang didelegasikan kepadanya
- [ ] Review `getReportById()` untuk aturan visibilitas eksekutor
- [ ] Review `delegateReport()`
- [ ] Pastikan delegasi diizinkan untuk status:
  - `tersedia`
  - `diambil`
  - `didelegasikan`
- [ ] Pastikan delegasi tidak mengubah district tiket
- [ ] Pastikan delegasi mengubah penanggung jawab aktif
- [ ] Pastikan assignment aktif lama dinonaktifkan
- [ ] Pastikan assignment baru dibuat dengan benar
- [ ] Review `cancelAssignment()`
- [ ] Pastikan batal assignment hanya untuk status:
  - `diambil`
  - `didelegasikan`
- [ ] Pastikan pembatalan mengosongkan penanggung jawab aktif
- [ ] Pastikan tiket kembali ke status `tersedia`

## Controller
- [ ] Review `showReportDetail()` di `reportController.js`
- [ ] Pastikan dropdown delegasi hanya menampilkan district lawan
- [ ] Review `delegateReport()` controller
- [ ] Review `cancelAssignment()` controller
- [ ] Pastikan flash message sukses/gagal konsisten

## Routes
- [ ] Review route `POST /reports/:id/delegate`
- [ ] Review route `POST /reports/:id/cancel-assignment`
- [ ] Pastikan kedua route hanya bisa diakses koordinator

## Views
- [ ] Review `views/reports/show.ejs`
- [ ] Pastikan form delegasi muncul untuk koordinator
- [ ] Pastikan form delegasi muncul untuk status:
  - `tersedia`
  - `diambil`
  - `didelegasikan`
- [ ] Pastikan form batal tugas hanya muncul saat status:
  - `diambil`
  - `didelegasikan`
- [ ] Pastikan dropdown hanya menampilkan eksekutor district lawan
- [ ] Tambahkan bantuan teks agar aturan delegasi jelas
- [ ] Review `views/reports/index.ejs`
- [ ] Pastikan assigned user dan status didelegasikan terlihat jelas

## Logging
- [ ] Pastikan aksi delegasi masuk ke `report_logs`
- [ ] Pastikan aksi pembatalan masuk ke `report_logs`

## Manual Testing
- [ ] Test delegasi tiket `tersedia`
- [ ] Test delegasi tiket `diambil`
- [ ] Test delegasi tiket `didelegasikan`
- [ ] Test tiket PDG hanya bisa didelegasikan ke BKT
- [ ] Test tiket BKT hanya bisa didelegasikan ke PDG
- [ ] Test eksekutor tujuan melihat tiket delegasi
- [ ] Test koordinator membatalkan assignment
- [ ] Test tiket kembali `tersedia`
- [ ] Test eksekutor tidak bisa membatalkan assignment
- [ ] Test supervisor tidak bisa mengakses aksi delegasi

## Documentation
- [ ] Simpan screenshot form delegasi
- [ ] Simpan screenshot tiket setelah didelegasikan
- [ ] Simpan screenshot pembatalan assignment
- [ ] Catat file yang berubah untuk BAB IV