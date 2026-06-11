# Checklist — UI/UX Button Cleanup

## Role Checklist
- [ ] Eksekutor hanya melihat tombol sesuai tugasnya
- [ ] Koordinator melihat tombol sesuai kewenangannya
- [ ] Supervisor hanya melihat Detail
- [ ] Super Admin tidak melihat tombol pengerjaan yang tidak relevan

## Status Checklist
- [ ] Tiket tersedia memiliki tombol yang sesuai
- [ ] Tiket diambil memiliki tombol yang sesuai
- [ ] Tiket didelegasikan memiliki tombol yang sesuai
- [ ] Tiket selesai hanya menampilkan Detail
- [ ] Tiket return/perlu tindak lanjut memiliki tombol yang sesuai
- [ ] Tiket eskalasi memiliki tombol yang sesuai

## UI Checklist
- [ ] Tombol tidak terlalu banyak
- [ ] Tombol tidak membuat tabel berantakan
- [ ] Tombol utama terlihat jelas
- [ ] Tombol sekunder tidak terlalu dominan
- [ ] Warna tombol konsisten
- [ ] Label tombol mudah dipahami
- [ ] Tampilan tetap responsif

## Feature Safety Checklist
- [ ] Detail modal F019 tetap berjalan
- [ ] Tab Informasi Tiket tetap berjalan
- [ ] Tab Bukti Penyelesaian tetap berjalan
- [ ] Tab Media Telegram tetap berjalan
- [ ] Tab Riwayat Aktivitas tetap berjalan
- [ ] Flow ambil tiket tetap berjalan
- [ ] Flow selesai tetap berjalan
- [ ] Flow return tetap berjalan
- [ ] Flow eskalasi tetap berjalan
- [ ] Flow delegasi tetap berjalan

## Regression Checklist
- [ ] Database tidak berubah
- [ ] Telegram intake tidak berubah
- [ ] Telegram parsing tidak berubah
- [ ] F017 manual report tidak berubah
- [ ] F018 coordinator access tidak berubah
- [ ] RBAC tetap aman

## Manual Testing Checklist
- [ ] Login Eksekutor
- [ ] Login Koordinator
- [ ] Login Supervisor
- [ ] Login Super Admin
- [ ] Test tiket tersedia
- [ ] Test tiket selesai
- [ ] Test tiket didelegasikan
- [ ] Test tombol Detail
- [ ] Test modal detail
- [ ] Test aksi utama