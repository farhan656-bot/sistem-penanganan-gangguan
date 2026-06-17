
---

# `tasks.md`

```md id="6crhok"
# Tasks — Layout & Branding Cleanup

## Feature ID
F026

## Analysis
- [ ] Cari file sidebar
- [ ] Cari file topbar
- [ ] Cari teks `Login sebagai`
- [ ] Cari logo placeholder `TG`
- [ ] Cari kolom `Aksi`
- [ ] Cari tombol `Detail`
- [ ] Cari tombol `Kerjakan`
- [ ] Cari CSS tombol/table
- [ ] Pastikan tidak memakai dropdown aksi

## Logo Cleanup
- [ ] Siapkan file logo Telkom di folder public images
- [ ] Ganti badge `TG` dengan image logo Telkom
- [ ] Atur ukuran logo agar rapi
- [ ] Pastikan logo tidak pecah
- [ ] Pastikan teks nama sistem tetap tampil

## Sidebar Cleanup
- [ ] Hapus blok `Login sebagai`
- [ ] Hapus nama user dari sidebar bawah
- [ ] Hapus role/region dari sidebar bawah
- [ ] Pastikan menu sidebar tetap rapi
- [ ] Pastikan sidebar tidak terlalu kosong
- [ ] Pastikan identitas user tetap ada di topbar

## Topbar Cleanup
- [ ] Pastikan nama user tampil di kanan atas
- [ ] Pastikan badge role tampil
- [ ] Pastikan tombol logout tampil
- [ ] Rapikan spacing topbar
- [ ] Jangan duplikasi informasi user

## Action Button Cleanup
- [ ] Rapikan tombol Detail
- [ ] Rapikan tombol Kerjakan
- [ ] Jangan gunakan dropdown aksi
- [ ] Buat tombol sejajar
- [ ] Beri jarak antar tombol
- [ ] Gunakan ukuran tombol konsisten
- [ ] Lebarkan kolom Aksi jika perlu
- [ ] Pastikan tiket selesai hanya menampilkan Detail
- [ ] Pastikan tombol tidak bertumpuk berantakan

## CSS Cleanup
- [ ] Tambahkan class `.action-buttons`
- [ ] Tambahkan gap antar tombol
- [ ] Atur width kolom Aksi jika perlu
- [ ] Rapikan table cell vertical align
- [ ] Rapikan spacing sidebar
- [ ] Rapikan logo size

## Preserve Existing Features
- [ ] Detail tetap membuka modal F019
- [ ] Kerjakan tetap menjalankan flow lama
- [ ] Eksekutor tetap sesuai role
- [ ] Koordinator tetap sesuai F018
- [ ] Supervisor tetap read-only
- [ ] Super Admin tetap aman

## Regression Safety
- [ ] Jangan ubah database
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah upload file
- [ ] Jangan ubah report logs
- [ ] Jangan ubah F017
- [ ] Jangan ubah F018
- [ ] Jangan ubah F019
- [ ] Jangan ubah F021
- [ ] Jangan ubah F022
- [ ] Jangan ubah F023
- [ ] Jangan ubah F024
- [ ] Jangan ubah F025

## Testing
- [ ] Login Eksekutor
- [ ] Cek daftar antrean kerja
- [ ] Cek tombol Detail dan Kerjakan
- [ ] Cek tiket selesai hanya Detail
- [ ] Login Koordinator
- [ ] Cek aksi Koordinator
- [ ] Login Supervisor
- [ ] Pastikan read-only
- [ ] Login Super Admin
- [ ] Pastikan layout aman
- [ ] Klik Detail
- [ ] Klik Kerjakan
- [ ] Cek sidebar tanpa Login sebagai
- [ ] Cek logo Telkom