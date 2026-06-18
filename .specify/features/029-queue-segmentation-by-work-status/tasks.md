
---

# `tasks.md`

```md
# Tasks — Queue Segmentation by Work Status

## Feature ID
F029

## Analysis
- [ ] Review daftar antrean kerja
- [ ] Review model query laporan
- [ ] Review controller daftar laporan
- [ ] Review filter status yang sudah ada
- [ ] Review filter wilayah
- [ ] Review filter search/keyword
- [ ] Review assigned user display
- [ ] Review role Eksekutor
- [ ] Review role Koordinator F018
- [ ] Review tombol F026 dan F027

## Work Status Mapping
- [ ] Buat mapping `available` ke `baru`, `tersedia`
- [ ] Buat mapping `in_progress` ke `diambil`, `didelegasikan`
- [ ] Buat mapping `completed` ke `selesai`
- [ ] Buat mapping `follow_up` ke `perlu_tindak_lanjut`
- [ ] Buat mapping `escalated` ke `eskalasi`
- [ ] Buat fallback `all`

## Controller
- [ ] Baca query parameter `work_status`
- [ ] Validasi nilai `work_status`
- [ ] Kirim `work_status` ke model
- [ ] Kirim active tab ke view
- [ ] Pertahankan filter existing
- [ ] Pertahankan query string saat pindah tab

## Model
- [ ] Tambahkan filter status berdasarkan `work_status`
- [ ] Jangan hapus filter role
- [ ] Jangan hapus filter region
- [ ] Jangan hapus filter assigned user
- [ ] Jangan hapus filter search
- [ ] Pastikan query `IN (...)` aman
- [ ] Pastikan `all` tidak membatasi status

## View Tabs
- [ ] Tambahkan tab Semua
- [ ] Tambahkan tab Tersedia
- [ ] Tambahkan tab Sedang Dikerjakan
- [ ] Tambahkan tab Selesai
- [ ] Tambahkan tab Perlu Tindak Lanjut
- [ ] Tambahkan tab Eskalasi
- [ ] Tandai tab aktif
- [ ] Pertahankan filter query string saat tab diklik
- [ ] Jangan membuat submenu sidebar

## Counts
- [ ] Jika memungkinkan, tampilkan jumlah tiket per tab
- [ ] Count mengikuti akses role
- [ ] Count mengikuti filter wilayah/search jika relevan
- [ ] Jika count terlalu besar, boleh ditunda

## Empty State
- [ ] Tampilkan empty state jika tab kosong
- [ ] Pesan empty state mudah dipahami
- [ ] Jangan tampilkan tabel kosong tanpa informasi

## Preserve Existing Features
- [ ] Assigned To tetap tampil
- [ ] Detail tetap membuka modal F019
- [ ] Kerjakan tetap berjalan
- [ ] Smooth action F027 tetap berjalan
- [ ] Tombol tetap rapi F026
- [ ] Supervisor tetap read-only
- [ ] Koordinator tetap PDG/BKT

## Regression Safety
- [ ] Jangan ubah database
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah upload file
- [ ] Jangan ubah F017
- [ ] Jangan ubah F018
- [ ] Jangan ubah F019
- [ ] Jangan ubah F021
- [ ] Jangan ubah F022
- [ ] Jangan ubah F023
- [ ] Jangan ubah F024
- [ ] Jangan ubah F025
- [ ] Jangan ubah F026
- [ ] Jangan ubah F027

## Testing
- [ ] Test tab Semua
- [ ] Test tab Tersedia
- [ ] Test tab Sedang Dikerjakan
- [ ] Test tab Selesai
- [ ] Test tab Perlu Tindak Lanjut
- [ ] Test tab Eskalasi
- [ ] Test filter wilayah dengan tab
- [ ] Test search dengan tab
- [ ] Test Eksekutor
- [ ] Test Koordinator
- [ ] Test Supervisor
- [ ] Test Super Admin
- [ ] Test Detail modal
- [ ] Test Kerjakan smooth