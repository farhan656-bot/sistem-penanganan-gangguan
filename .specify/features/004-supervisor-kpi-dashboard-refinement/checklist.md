# Checklist — Supervisor KPI Dashboard Refinement

## Access Checklist
- [ ] Supervisor dapat login dan membuka dashboard
- [ ] Dashboard supervisor hanya bersifat read-only
- [ ] Role non-supervisor tidak dapat mengakses dashboard supervisor
- [ ] Tidak ada tombol aksi operasional
- [ ] Tidak ada form mutasi data
- [ ] Tidak ada tombol approve/reject Region Switch

## Filter Checklist
- [ ] Filter periode tampil
- [ ] Filter district tampil
- [ ] Filter status tampil
- [ ] Filter periode dapat digunakan
- [ ] Filter district dapat digunakan
- [ ] Filter status dapat digunakan
- [ ] Filter dapat di-reset jika tombol reset tersedia
- [ ] Data KPI mengikuti filter
- [ ] Data grafik mengikuti filter
- [ ] Data tabel mengikuti filter

## KPI Summary Checklist
- [ ] Total laporan tampil
- [ ] Total tersedia tampil
- [ ] Total sedang ditangani tampil
- [ ] Total selesai tampil
- [ ] Total perlu tindak lanjut tampil
- [ ] Total eskalasi tampil
- [ ] Tingkat penyelesaian tampil
- [ ] Backlog aktif tampil

## SLA Checklist
- [ ] Rata-rata waktu respons dihitung dari `received_at` ke `taken_at`
- [ ] Rata-rata waktu penyelesaian dihitung dari `taken_at` ke `resolved_at`
- [ ] Dashboard tetap aman jika nilai rata-rata belum ada
- [ ] Nilai rata-rata tampil dalam format yang mudah dibaca

## Status Accuracy Checklist
- [ ] Status `selesai` dihitung sebagai final completed
- [ ] Status `perlu_tindak_lanjut` tidak dihitung final completed
- [ ] Status `eskalasi` tidak dihitung final completed
- [ ] Status `diambil` dan `didelegasikan` dihitung sebagai in progress
- [ ] Status `tersedia` dihitung sebagai available
- [ ] Backlog aktif menghitung tiket yang belum selesai final

## Chart Checklist
- [ ] Grafik status tiket tampil
- [ ] Grafik tren laporan tampil
- [ ] Grafik perbandingan district tampil
- [ ] Grafik tidak error saat data kosong
- [ ] Grafik berubah sesuai filter
- [ ] Label grafik mudah dipahami
- [ ] Warna grafik konsisten dengan status sistem

## Region Summary Checklist
- [ ] Rekap district tampil
- [ ] District tanpa tiket tetap aman tampil
- [ ] Kolom total tampil
- [ ] Kolom tersedia tampil
- [ ] Kolom diproses tampil
- [ ] Kolom selesai tampil
- [ ] Kolom follow up tampil
- [ ] Kolom eskalasi tampil

## User Performance Checklist
- [ ] Rekap pegawai eksekutor tampil
- [ ] Total tiket ditangani tampil
- [ ] Total tiket selesai tampil
- [ ] Rata-rata waktu penyelesaian tampil
- [ ] Eksekutor tanpa tiket tetap aman
- [ ] Hanya role eksekutor yang dihitung

## Attention Tickets Checklist
- [ ] Tabel tiket perlu perhatian tampil
- [ ] Tiket `perlu_tindak_lanjut` tampil
- [ ] Tiket `eskalasi` tampil
- [ ] Tiket yang terlalu lama ditangani tampil jika rule tersedia
- [ ] Ticket id atau order id tampil
- [ ] District tampil
- [ ] Status tampil
- [ ] Eksekutor tampil jika tersedia
- [ ] Tabel aman saat data kosong

## Region Switch F007 Checklist
- [ ] Riwayat Region Switch F007 tampil
- [ ] Nama eksekutor tampil
- [ ] District asal tampil
- [ ] District tujuan tampil
- [ ] Status request tampil
- [ ] Waktu pengajuan tampil
- [ ] Waktu approval tampil jika tersedia
- [ ] Waktu expired tampil jika tersedia
- [ ] Tabel aman saat belum ada data Region Switch
- [ ] Data Region Switch hanya read-only

## UI Checklist
- [ ] Dashboard tampil rapi
- [ ] Card KPI mudah dibaca
- [ ] Form filter mudah digunakan
- [ ] Tabel responsif
- [ ] Grafik memiliki judul yang jelas
- [ ] Tidak ada tombol aksi operasional
- [ ] Gaya UI konsisten dengan sistem
- [ ] Gaya enterprise Telkom-like tetap dipertahankan

## Negative Test Checklist
- [ ] Dashboard tetap tampil saat belum ada data
- [ ] Dashboard tidak error jika ada tiket tanpa `taken_at`
- [ ] Dashboard tidak error jika ada tiket tanpa `resolved_at`
- [ ] Dashboard tidak error jika tidak ada data Region Switch F007
- [ ] Dashboard tidak error jika filter menghasilkan data kosong
- [ ] Grafik tidak error jika data kosong
- [ ] Tabel menampilkan pesan data tidak tersedia

## Evidence Checklist
- [ ] Screenshot dashboard supervisor
- [ ] Screenshot filter dashboard
- [ ] Screenshot KPI summary
- [ ] Screenshot grafik status tiket
- [ ] Screenshot grafik tren laporan
- [ ] Screenshot grafik perbandingan district
- [ ] Screenshot rekap district
- [ ] Screenshot rekap pegawai
- [ ] Screenshot tiket perlu perhatian
- [ ] Screenshot riwayat Region Switch F007
- [ ] Screenshot kondisi data follow up dan eskalasi


- [x] Status `baru` tidak ditampilkan karena tidak digunakan dalam implementasi sistem
- [x] Tiket dari Bot Telegram langsung masuk dengan status `tersedia`
- [x] Tiket dari input manual langsung masuk dengan status `tersedia`
- [x] Grafik status tiket tidak menampilkan legend kosong