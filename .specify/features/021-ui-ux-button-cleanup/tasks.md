
---

# `tasks.md`

```md
# Tasks — UI/UX Button Cleanup

## Feature ID
F021

## Analysis
- [ ] Review semua halaman daftar antrean kerja
- [ ] Review semua tombol aksi ticketing
- [ ] Review tombol pada role Eksekutor
- [ ] Review tombol pada role Koordinator
- [ ] Review tombol pada role Supervisor
- [ ] Review tombol pada role Super Admin
- [ ] Review status tiket
- [ ] Review assignment logic
- [ ] Review tombol Detail modal F019

## Button Inventory
- [ ] Catat tombol Detail
- [ ] Catat tombol Ambil
- [ ] Catat tombol Selesaikan
- [ ] Catat tombol Update Pengerjaan
- [ ] Catat tombol Delegasi
- [ ] Catat tombol Batalkan Penugasan
- [ ] Catat tombol Return
- [ ] Catat tombol Eskalasi
- [ ] Catat tombol Edit
- [ ] Catat tombol Hapus
- [ ] Catat tombol lain yang tidak relevan

## Role-Based Cleanup
- [ ] Supervisor hanya melihat Detail
- [ ] Super Admin hanya melihat tombol yang relevan
- [ ] Eksekutor hanya melihat tombol sesuai kewenangan
- [ ] Koordinator hanya melihat tombol sesuai kewenangan
- [ ] Jangan tampilkan tombol aksi untuk role yang tidak berhak

## Status-Based Cleanup
- [ ] Tiket tersedia menampilkan aksi yang sesuai
- [ ] Tiket diambil menampilkan aksi yang sesuai
- [ ] Tiket didelegasikan menampilkan aksi yang sesuai
- [ ] Tiket selesai hanya menampilkan Detail
- [ ] Tiket perlu_tindak_lanjut menampilkan aksi yang sesuai
- [ ] Tiket eskalasi menampilkan aksi yang sesuai

## UI Cleanup
- [ ] Kurangi tombol yang terlalu banyak dalam satu baris
- [ ] Gunakan outline button untuk aksi sekunder
- [ ] Gunakan warna danger hanya untuk aksi penting
- [ ] Pastikan tombol tidak membuat tabel terlalu lebar
- [ ] Pastikan tampilan mobile/responsif tetap aman
- [ ] Pastikan label tombol jelas

## Preserve Existing Features
- [ ] Tombol Detail tetap membuka modal F019
- [ ] Modal tabs tetap berjalan
- [ ] Aksi ambil tiket tetap berjalan
- [ ] Aksi selesai tetap berjalan
- [ ] Aksi return tetap berjalan
- [ ] Aksi eskalasi tetap berjalan
- [ ] Aksi delegasi tetap berjalan
- [ ] Aksi batal penugasan tetap berjalan

## Regression Safety
- [ ] Jangan ubah database
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah pending media
- [ ] Jangan ubah F017 manual report
- [ ] Jangan ubah F018 coordinator access
- [ ] Jangan ubah F019 modal tabs
- [ ] Jangan ubah RBAC middleware sembarangan

## Testing
- [ ] Test Eksekutor tiket tersedia
- [ ] Test Eksekutor tiket diambil
- [ ] Test Eksekutor tiket selesai
- [ ] Test Koordinator tiket tersedia
- [ ] Test Koordinator tiket didelegasikan
- [ ] Test Koordinator tiket selesai
- [ ] Test Supervisor
- [ ] Test Super Admin
- [ ] Test tombol Detail
- [ ] Test modal F019
- [ ] Test aksi utama masih berjalan

## Documentation
- [ ] Screenshot sebelum jika ada
- [ ] Screenshot sesudah
- [ ] Catat tombol yang disembunyikan
- [ ] Catat tombol yang dipertahankan
- [ ] Catat file yang diubah
- [ ] Catat hasil testing