# Tasks — UI/UX Refinement and Layout Standardization

## Feature ID
F008

## Analysis
- [ ] Review constitution untuk rule role dan akses
- [ ] Review copilot instructions
- [ ] Review UI existing semua role
- [ ] Review struktur folder views
- [ ] Review file CSS yang sudah ada
- [ ] Review layout atau partial yang sudah ada
- [ ] Review route setiap role
- [ ] Pastikan F008 hanya mengubah UI/UX

## Global Layout
- [ ] Buat atau review partial `sidebar.ejs`
- [ ] Buat atau review partial `topbar.ejs`
- [ ] Buat atau review partial `flash.ejs`
- [ ] Buat atau review partial `page-header.ejs`
- [ ] Buat struktur content wrapper
- [ ] Tambahkan layout sidebar untuk halaman setelah login
- [ ] Pastikan sidebar menampilkan menu sesuai role
- [ ] Pastikan active menu tampil jelas
- [ ] Pastikan logout tersedia dari semua role
- [ ] Pastikan layout tetap responsif

## Global CSS
- [ ] Buat atau update `public/css/app.css`
- [ ] Definisikan warna utama sistem
- [ ] Definisikan gaya card
- [ ] Definisikan gaya table
- [ ] Definisikan gaya form
- [ ] Definisikan gaya button
- [ ] Definisikan gaya badge
- [ ] Definisikan gaya alert
- [ ] Definisikan spacing global
- [ ] Pastikan tidak merusak Bootstrap 5

## Login Page
- [ ] Review halaman login
- [ ] Tambahkan identitas sistem
- [ ] Tambahkan deskripsi singkat sistem
- [ ] Ubah tombol login agar konsisten dengan warna utama
- [ ] Rapikan card login
- [ ] Rapikan spacing form
- [ ] Tambahkan validasi error yang rapi jika tersedia
- [ ] Tambahkan password visibility toggle jika memungkinkan
- [ ] Ubah helper text development menjadi lebih formal

## Super Admin UI
- [ ] Review dashboard super admin
- [ ] Rapikan card manajemen user
- [ ] Rapikan card laporan manual
- [ ] Rapikan section akses role
- [ ] Review halaman kelola user
- [ ] Rapikan tabel user
- [ ] Standarkan badge role
- [ ] Standarkan badge status user
- [ ] Rapikan tombol edit
- [ ] Review form tambah user
- [ ] Review form edit user jika ada
- [ ] Rapikan field role dan district
- [ ] Pastikan tombol simpan dan batal konsisten

## Supervisor UI
- [ ] Review dashboard supervisor
- [ ] Rapikan header dashboard
- [ ] Rapikan filter dashboard
- [ ] Rapikan KPI cards
- [ ] Rapikan chart cards
- [ ] Rapikan tabel rekap wilayah
- [ ] Rapikan tabel kinerja eksekutor
- [ ] Rapikan tabel tiket perlu perhatian
- [ ] Rapikan tabel riwayat Region Switch F007
- [ ] Pastikan dashboard tetap read-only
- [ ] Pastikan tidak ada tombol aksi operasional

## Eksekutor UI
- [ ] Review dashboard eksekutor
- [ ] Kurangi whitespace berlebihan
- [ ] Tambahkan card shortcut yang lebih rapi
- [ ] Rapikan tombol daftar antrean kerja
- [ ] Rapikan tombol pengajuan switch region
- [ ] Review daftar antrean kerja
- [ ] Rapikan filter antrean kerja
- [ ] Rapikan tabel antrean kerja
- [ ] Rapikan tombol detail
- [ ] Rapikan tombol ambil tugas
- [ ] Review riwayat pengajuan switch region
- [ ] Rapikan tabel pengajuan switch region
- [ ] Review form pengajuan switch region
- [ ] Rapikan form pengajuan switch region

## Koordinator UI
- [ ] Review dashboard koordinator
- [ ] Kurangi whitespace berlebihan
- [ ] Tambahkan shortcut operasional yang lebih rapi
- [ ] Review approval switch region
- [ ] Rapikan tabel approval
- [ ] Rapikan aksi approve/reject
- [ ] Rapikan input alasan penolakan
- [ ] Format tanggal agar mudah dibaca
- [ ] Review daftar antrean kerja koordinator
- [ ] Rapikan filter antrean kerja
- [ ] Rapikan tabel antrean kerja
- [ ] Review form laporan manual
- [ ] Rapikan form laporan manual
- [ ] Review detail laporan
- [ ] Rapikan card detail laporan
- [ ] Rapikan bukti penyelesaian
- [ ] Rapikan media tambahan Telegram
- [ ] Rapikan bagian delegasi jika masih ditampilkan
- [ ] Rapikan bagian pembatalan tugas jika masih ditampilkan

## Manual Report Form
- [ ] Kelompokkan field informasi tiket
- [ ] Kelompokkan field informasi layanan
- [ ] Kelompokkan field informasi lokasi
- [ ] Kelompokkan field detail gangguan
- [ ] Kelompokkan field wilayah penanganan
- [ ] Pastikan field wajib jelas
- [ ] Pastikan tombol simpan dan batal konsisten
- [ ] Pastikan form tetap submit ke endpoint lama

## Report List and Detail
- [ ] Rapikan daftar antrean kerja
- [ ] Buat ringkasan tiket lebih mudah dibaca
- [ ] Batasi teks panjang agar tidak merusak tabel
- [ ] Pastikan kolom aksi tidak terpotong
- [ ] Rapikan halaman detail laporan
- [ ] Tampilkan status sebagai badge
- [ ] Tampilkan tanggal dalam format mudah dibaca
- [ ] Tambahkan empty state untuk bukti/media kosong

## Badge and Status
- [ ] Standarkan badge `tersedia`
- [ ] Standarkan badge `diambil`
- [ ] Standarkan badge `didelegasikan`
- [ ] Standarkan badge `selesai`
- [ ] Standarkan badge `perlu_tindak_lanjut`
- [ ] Standarkan badge `eskalasi`
- [ ] Standarkan badge `pending`
- [ ] Standarkan badge `approved`
- [ ] Standarkan badge `rejected`
- [ ] Standarkan badge `expired`
- [ ] Standarkan badge role user
- [ ] Standarkan badge status user

## Alert and Flash Message
- [ ] Review alert login berhasil
- [ ] Pastikan alert tidak mengganggu dashboard
- [ ] Buat alert dapat ditutup jika memungkinkan
- [ ] Gunakan warna alert sesuai konteks
- [ ] Pastikan error message tampil rapi

## Access and Safety
- [ ] Pastikan menu sidebar sesuai role
- [ ] Pastikan supervisor tetap read-only
- [ ] Pastikan approval F007 tetap hanya untuk koordinator
- [ ] Pastikan pengajuan F007 tetap hanya untuk eksekutor
- [ ] Pastikan route dan middleware tidak diubah sembarangan
- [ ] Pastikan tombol aksi hanya tampil untuk role yang berhak

## Testing
- [ ] Test login page
- [ ] Test login super admin
- [ ] Test login supervisor
- [ ] Test login eksekutor
- [ ] Test login koordinator
- [ ] Test sidebar super admin
- [ ] Test sidebar supervisor
- [ ] Test sidebar eksekutor
- [ ] Test sidebar koordinator
- [ ] Test dashboard super admin
- [ ] Test dashboard supervisor
- [ ] Test dashboard eksekutor
- [ ] Test dashboard koordinator
- [ ] Test kelola user
- [ ] Test tambah user
- [ ] Test antrean kerja
- [ ] Test detail laporan
- [ ] Test laporan manual
- [ ] Test pengajuan switch region
- [ ] Test approval switch region
- [ ] Test logout

## Documentation
- [ ] Simpan screenshot login setelah perbaikan
- [ ] Simpan screenshot dashboard super admin
- [ ] Simpan screenshot kelola user
- [ ] Simpan screenshot dashboard supervisor
- [ ] Simpan screenshot dashboard eksekutor
- [ ] Simpan screenshot dashboard koordinator
- [ ] Simpan screenshot antrean kerja
- [ ] Simpan screenshot detail laporan
- [ ] Simpan screenshot pengajuan switch region
- [ ] Simpan screenshot approval switch region
- [ ] Catat file view yang berubah
- [ ] Catat file CSS yang berubah