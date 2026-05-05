# Tasks — Ticket Lifecycle & Status

## Feature ID
F002

## Database
- [ ] Update enum `status_internal` pada tabel `reports`
- [ ] Pastikan data lama tetap kompatibel setelah alter table

## Report Model
- [ ] Update `completeReport()` agar menerima status akhir:
  - `selesai`
  - `perlu_tindak_lanjut`
  - `eskalasi`
- [ ] Tambahkan validasi status akhir
- [ ] Update logging berdasarkan hasil akhir
- [ ] Pastikan query list tiket membaca status baru

## Report Controller
- [ ] Update validasi request penyelesaian tiket
- [ ] Pastikan flash message sesuai hasil submit
- [ ] Pastikan redirect detail tiket tetap benar

## Reports List View
- [ ] Tambahkan opsi filter `perlu_tindak_lanjut`
- [ ] Tambahkan opsi filter `eskalasi`
- [ ] Tambahkan badge status untuk `perlu_tindak_lanjut`
- [ ] Tambahkan badge status untuk `eskalasi`

## Report Detail View
- [ ] Update dropdown hasil akhir
- [ ] Ganti opsi:
  - selesai
  - perlu tindak lanjut
  - eskalasi
- [ ] Pastikan label dan teks lebih mudah dipahami user operasional

## Supervisor KPI
- [ ] Review `supervisorModel.js`
- [ ] Sesuaikan perhitungan summary untuk status baru
- [ ] Review tampilan dashboard supervisor bila perlu
- [ ] Pastikan tiket `perlu_tindak_lanjut` tidak dihitung final selesai

## Logging
- [ ] Pastikan hasil akhir `selesai` tercatat
- [ ] Pastikan hasil akhir `perlu_tindak_lanjut` tercatat
- [ ] Pastikan hasil akhir `eskalasi` tercatat

## Testing
- [ ] Test submit tiket dengan status `selesai`
- [ ] Test submit tiket dengan status `perlu_tindak_lanjut`
- [ ] Test submit tiket dengan status `eskalasi`
- [ ] Test filter list tiket
- [ ] Test badge tampilan status
- [ ] Test KPI supervisor setelah status baru masuk

## Documentation
- [ ] Catat perubahan database
- [ ] Simpan screenshot status baru di list tiket
- [ ] Simpan screenshot form detail tiket
- [ ] Simpan screenshot dashboard supervisor setelah update