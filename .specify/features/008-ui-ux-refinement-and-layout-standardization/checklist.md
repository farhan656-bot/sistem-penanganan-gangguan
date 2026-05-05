# Checklist — UI/UX Refinement and Layout Standardization

## Global Layout Checklist
- [ ] Layout global tersedia
- [ ] Sidebar tersedia
- [ ] Topbar atau header tersedia
- [ ] Content wrapper konsisten
- [ ] Page title konsisten
- [ ] Logout tersedia
- [ ] Active menu terlihat jelas
- [ ] Layout responsif pada layar laptop

## Role Navigation Checklist
- [ ] Menu super admin sesuai role
- [ ] Menu supervisor sesuai role
- [ ] Menu eksekutor sesuai role
- [ ] Menu koordinator sesuai role
- [ ] Menu tidak muncul untuk role yang tidak berhak
- [ ] User tidak bingung berpindah halaman

## Login Checklist
- [ ] Login page tampil rapi
- [ ] Identitas sistem tampil
- [ ] Form username tampil rapi
- [ ] Form password tampil rapi
- [ ] Tombol login konsisten dengan tema
- [ ] Error login tampil rapi jika ada
- [ ] Helper text lebih formal
- [ ] Tampilan login tidak terlalu kosong

## Super Admin UI Checklist
- [ ] Dashboard super admin rapi
- [ ] Card manajemen user rapi
- [ ] Card laporan manual rapi
- [ ] Section akses role rapi
- [ ] Tabel kelola user rapi
- [ ] Badge role konsisten
- [ ] Badge status user konsisten
- [ ] Tombol edit konsisten
- [ ] Form tambah user rapi
- [ ] Form edit user rapi jika ada
- [ ] Form laporan manual rapi

## Supervisor UI Checklist
- [ ] Dashboard supervisor rapi
- [ ] Filter dashboard rapi
- [ ] KPI card rapi
- [ ] Chart card rapi
- [ ] Tabel rekap wilayah rapi
- [ ] Tabel kinerja eksekutor rapi
- [ ] Tabel tiket perlu perhatian rapi
- [ ] Tabel riwayat Region Switch F007 rapi
- [ ] Dashboard tetap read-only
- [ ] Tidak ada tombol aksi operasional

## Eksekutor UI Checklist
- [ ] Dashboard eksekutor rapi
- [ ] Dashboard eksekutor tidak terlalu kosong
- [ ] Shortcut antrean kerja jelas
- [ ] Shortcut pengajuan switch region jelas
- [ ] Daftar antrean kerja rapi
- [ ] Filter antrean kerja rapi
- [ ] Tombol detail rapi
- [ ] Tombol ambil tugas rapi
- [ ] Tabel pengajuan switch region rapi
- [ ] Form pengajuan switch region rapi

## Koordinator UI Checklist
- [ ] Dashboard koordinator rapi
- [ ] Dashboard koordinator tidak terlalu kosong
- [ ] Shortcut antrean kerja jelas
- [ ] Shortcut approval switch region jelas
- [ ] Approval switch region rapi
- [ ] Aksi approve/reject rapi
- [ ] Input alasan penolakan rapi
- [ ] Daftar antrean kerja koordinator rapi
- [ ] Form laporan manual rapi
- [ ] Detail laporan rapi

## Table Checklist
- [ ] Tabel memiliki card wrapper
- [ ] Tabel responsif
- [ ] Header tabel jelas
- [ ] Kolom aksi tidak terpotong
- [ ] Teks panjang tidak merusak layout
- [ ] Status tampil sebagai badge
- [ ] Empty state tampil jika data kosong

## Form Checklist
- [ ] Form panjang dikelompokkan
- [ ] Label field jelas
- [ ] Field wajib terlihat
- [ ] Helper text tampil jika diperlukan
- [ ] Tombol submit konsisten
- [ ] Tombol batal konsisten
- [ ] Form tetap submit ke endpoint lama

## Badge Checklist
- [ ] Badge `tersedia` konsisten
- [ ] Badge `diambil` konsisten
- [ ] Badge `didelegasikan` konsisten
- [ ] Badge `selesai` konsisten
- [ ] Badge `perlu_tindak_lanjut` konsisten
- [ ] Badge `eskalasi` konsisten
- [ ] Badge `pending` konsisten
- [ ] Badge `approved` konsisten
- [ ] Badge `rejected` konsisten
- [ ] Badge `expired` konsisten
- [ ] Badge role konsisten
- [ ] Badge status user konsisten

## Alert Checklist
- [ ] Alert sukses tampil rapi
- [ ] Alert error tampil rapi
- [ ] Alert warning tampil rapi
- [ ] Alert tidak terlalu besar
- [ ] Alert tidak mengganggu dashboard
- [ ] Alert dapat ditutup jika memungkinkan

## Safety Checklist
- [ ] Tidak ada perubahan database
- [ ] Tidak ada perubahan business logic tiket
- [ ] Tidak ada perubahan Bot Telegram
- [ ] Tidak ada perubahan logic F007
- [ ] Tidak ada perubahan role middleware
- [ ] Tidak ada tombol aksi baru yang tidak sesuai role
- [ ] Semua route lama tetap berjalan

## Manual Verification Checklist
- [ ] Login sebagai super admin
- [ ] Login sebagai supervisor
- [ ] Login sebagai eksekutor
- [ ] Login sebagai koordinator
- [ ] Logout dari semua role
- [ ] Buka semua menu super admin
- [ ] Buka semua menu supervisor
- [ ] Buka semua menu eksekutor
- [ ] Buka semua menu koordinator
- [ ] Submit form tambah user
- [ ] Submit form laporan manual
- [ ] Ajukan switch region
- [ ] Approve switch region
- [ ] Reject switch region
- [ ] Buka detail laporan
- [ ] Buka dashboard supervisor
- [ ] Pastikan supervisor tetap read-only

## Evidence Checklist
- [ ] Screenshot login
- [ ] Screenshot dashboard super admin
- [ ] Screenshot kelola user
- [ ] Screenshot dashboard supervisor
- [ ] Screenshot dashboard eksekutor
- [ ] Screenshot dashboard koordinator
- [ ] Screenshot antrean kerja
- [ ] Screenshot detail laporan
- [ ] Screenshot laporan manual
- [ ] Screenshot pengajuan switch region
- [ ] Screenshot approval switch