# Tasks — Remove Manual Report Entry

## Feature ID
F009

## Analysis
- [ ] Review constitution project
- [ ] Review copilot/custom instructions
- [ ] Review struktur route
- [ ] Review struktur controller
- [ ] Review struktur views
- [ ] Review partial sidebar/navigation
- [ ] Review dashboard Koordinator
- [ ] Review dashboard Super Admin
- [ ] Cari semua referensi laporan manual
- [ ] Pastikan F009 hanya menghapus/menyembunyikan laporan manual dari UI

## Search References
- [ ] Cari teks `laporan manual`
- [ ] Cari teks `Tambah Laporan Manual`
- [ ] Cari teks `manual report`
- [ ] Cari teks `manual`
- [ ] Cari teks `source_channel`
- [ ] Cari route yang mengarah ke form laporan manual
- [ ] Cari controller method untuk form laporan manual
- [ ] Cari view form laporan manual
- [ ] Cari button/link/card laporan manual pada dashboard

## Sidebar / Navigation
- [ ] Buka partial sidebar/navigation
- [ ] Identifikasi menu laporan manual untuk Koordinator
- [ ] Identifikasi menu laporan manual untuk Super Admin
- [ ] Hapus atau sembunyikan menu laporan manual
- [ ] Pastikan menu Koordinator lain tetap tampil
- [ ] Pastikan menu Super Admin lain tetap tampil
- [ ] Pastikan sidebar tidak error saat role berbeda login
- [ ] Pastikan active menu tetap berjalan

## Koordinator Dashboard
- [ ] Buka view dashboard Koordinator
- [ ] Cari card/shortcut/button laporan manual
- [ ] Hapus atau sembunyikan card/shortcut/button laporan manual
- [ ] Rapikan layout dashboard setelah card dihapus
- [ ] Pastikan shortcut antrean laporan tetap ada
- [ ] Pastikan shortcut approval region switch tetap ada
- [ ] Pastikan fitur delegasi tidak berubah

## Super Admin Dashboard
- [ ] Buka view dashboard Super Admin
- [ ] Cari card/shortcut/button laporan manual
- [ ] Hapus atau sembunyikan card/shortcut/button laporan manual
- [ ] Rapikan layout dashboard setelah card dihapus
- [ ] Pastikan shortcut kelola user tetap ada
- [ ] Pastikan fitur manajemen user tidak berubah

## Manual Report Route Safety
- [ ] Identifikasi route GET form laporan manual
- [ ] Identifikasi route POST simpan laporan manual
- [ ] Jangan hapus route jika masih berisiko error
- [ ] Pastikan tidak ada link UI menuju route manual report
- [ ] Jika perlu, route GET manual report diarahkan ke dashboard/antrean dengan flash message
- [ ] Jangan menghapus controller/model sebelum dipastikan aman

## Telegram Intake Safety
- [ ] Pastikan service Telegram bot tidak diubah
- [ ] Pastikan parsing Telegram tidak diubah
- [ ] Pastikan laporan dari Telegram tetap masuk tabel reports
- [ ] Pastikan Ticket ID duplikat tetap ditolak
- [ ] Pastikan status laporan Telegram tetap `tersedia`

## RBAC Safety
- [ ] Pastikan role middleware tidak diubah
- [ ] Pastikan Super Admin tetap dapat mengelola user
- [ ] Pastikan Koordinator tetap dapat mengelola antrean/delegasi
- [ ] Pastikan Eksekutor tetap dapat mengambil tiket
- [ ] Pastikan Supervisor tetap read-only

## UI Verification
- [ ] Login sebagai Super Admin
- [ ] Cek sidebar Super Admin
- [ ] Cek dashboard Super Admin
- [ ] Pastikan tidak ada laporan manual pada Super Admin
- [ ] Login sebagai Koordinator
- [ ] Cek sidebar Koordinator
- [ ] Cek dashboard Koordinator
- [ ] Pastikan tidak ada laporan manual pada Koordinator
- [ ] Login sebagai Eksekutor
- [ ] Pastikan dashboard Eksekutor tidak terdampak
- [ ] Login sebagai Supervisor
- [ ] Pastikan dashboard Supervisor tidak terdampak

## Functional Testing
- [ ] Test login/logout semua role
- [ ] Test daftar antrean laporan
- [ ] Test laporan Telegram baru masuk
- [ ] Test detail laporan lama jika masih ada
- [ ] Test kelola user Super Admin
- [ ] Test approval region switch Koordinator
- [ ] Test pengajuan region switch Eksekutor
- [ ] Test dashboard supervisor read-only

## Documentation
- [ ] Screenshot sidebar Super Admin tanpa laporan manual
- [ ] Screenshot dashboard Super Admin tanpa laporan manual
- [ ] Screenshot sidebar Koordinator tanpa laporan manual
- [ ] Screenshot dashboard Koordinator tanpa laporan manual
- [ ] Screenshot daftar antrean tetap berjalan
- [ ] Screenshot laporan Telegram tetap masuk
- [ ] Catat file yang berubah
- [ ] Catat route manual report yang masih dibiarkan sebagai fallback jika ada