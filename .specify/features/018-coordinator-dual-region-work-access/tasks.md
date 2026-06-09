
---

# `tasks.md`

```md
# Tasks — Coordinator Dual Region Work Access

## Feature ID
F018

## Analysis
- [ ] Review struktur project
- [ ] Review logic daftar laporan Koordinator
- [ ] Review logic daftar antrean Eksekutor
- [ ] Review Region Switch F007
- [ ] Review query filter region
- [ ] Review controller Koordinator
- [ ] Review model report
- [ ] Pastikan F018 hanya mengubah akses Koordinator

## Search References
- [ ] Cari `koordinator`
- [ ] Cari `region_id`
- [ ] Cari `current_region_id`
- [ ] Cari `reported_region_id`
- [ ] Cari `region_switch`
- [ ] Cari `getReports`
- [ ] Cari `getQueue`
- [ ] Cari `delegate`
- [ ] Cari `cancelAssignment`
- [ ] Cari filter region pada view Koordinator

## Coordinator Access Logic
- [ ] Pastikan role Koordinator terdeteksi dengan benar
- [ ] Ambil region PDG dan BKT dari tabel regions
- [ ] Buat allowedRegionIds untuk Koordinator
- [ ] Query laporan Koordinator memakai allowedRegionIds
- [ ] Jika filter region kosong, tampilkan PDG dan BKT
- [ ] Jika filter region dipilih, pastikan masih dalam PDG/BKT
- [ ] Jangan minta region switch untuk Koordinator

## Executor Safety
- [ ] Jangan ubah logic daftar antrean Eksekutor
- [ ] Eksekutor tetap region utama secara default
- [ ] Eksekutor tetap menggunakan active approved region switch
- [ ] Eksekutor tanpa switch tidak melihat region lain
- [ ] Eksekutor dengan switch aktif tetap melihat region tambahan
- [ ] Region switch expired tetap tidak memberi akses

## Coordinator Actions
- [ ] Koordinator dapat membuka detail laporan PDG
- [ ] Koordinator dapat membuka detail laporan BKT
- [ ] Koordinator dapat delegasi laporan sesuai logic lama
- [ ] Koordinator dapat batalkan penugasan sesuai logic lama
- [ ] Koordinator tidak error saat aksi pada laporan region berbeda
- [ ] Jangan tambah aksi baru yang tidak diminta

## UI Filter
- [ ] Filter region Koordinator menampilkan PDG
- [ ] Filter region Koordinator menampilkan BKT
- [ ] Filter region tidak menampilkan opsi yang tidak perlu
- [ ] Badge region tetap tampil
- [ ] Empty state tetap rapi
- [ ] UI Eksekutor tidak berubah

## Regression Safety
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah pending media
- [ ] Jangan ubah text enrichment
- [ ] Jangan ubah return feedback
- [ ] Jangan ubah eskalasi DIIT
- [ ] Jangan ubah upload bukti
- [ ] Jangan ubah F017 manual report
- [ ] Jangan ubah KPI Supervisor
- [ ] Jangan ubah database

## Functional Testing
- [ ] Login sebagai Koordinator
- [ ] Buka daftar laporan
- [ ] Pastikan laporan PDG tampil
- [ ] Pastikan laporan BKT tampil
- [ ] Filter PDG
- [ ] Filter BKT
- [ ] Buka detail laporan PDG
- [ ] Buka detail laporan BKT
- [ ] Test delegasi laporan PDG
- [ ] Test delegasi laporan BKT
- [ ] Test batalkan penugasan jika tersedia
- [ ] Login Eksekutor PDG tanpa switch
- [ ] Pastikan hanya PDG tampil
- [ ] Login Eksekutor BKT tanpa switch
- [ ] Pastikan hanya BKT tampil
- [ ] Test Eksekutor dengan switch aktif
- [ ] Login Supervisor
- [ ] Pastikan read-only
- [ ] Kirim laporan Telegram PDG dan BKT
- [ ] Pastikan masuk sesuai region

## Documentation
- [ ] Screenshot Koordinator melihat PDG dan BKT
- [ ] Screenshot filter PDG
- [ ] Screenshot filter BKT
- [ ] Screenshot Eksekutor tetap region sendiri
- [ ] Screenshot Region Switch Eksekutor tetap berjalan
- [ ] Catat file yang diubah
- [ ] Catat hasil testing manual