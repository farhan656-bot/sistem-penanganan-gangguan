# Checklist — Telegram Media Popup Tabs

## Modal Tabs Checklist
- [ ] Modal detail memiliki tab
- [ ] Tab Informasi Tiket tersedia
- [ ] Tab Bukti Penyelesaian tersedia
- [ ] Tab Media Telegram tersedia
- [ ] Tab Riwayat Aktivitas tersedia
- [ ] Tab Informasi Tiket aktif default
- [ ] Tab reset ke Informasi Tiket saat modal dibuka ulang

## Ticket Info Checklist
- [ ] Ticket ID tampil
- [ ] Order ID tampil
- [ ] Summary tampil
- [ ] Region tampil
- [ ] STO tampil
- [ ] Status tampil
- [ ] Assigned user tampil
- [ ] Waktu penting tampil

## Completion Evidence Checklist
- [ ] Bukti Penyelesaian tampil di tab Bukti Penyelesaian
- [ ] Media Telegram tidak tampil di tab Bukti Penyelesaian
- [ ] Empty state tampil jika bukti kosong
- [ ] Link/preview bukti tetap bisa dibuka
- [ ] Upload bukti lama tetap berjalan

## Telegram Media Checklist
- [ ] Media Telegram tampil di tab Media Telegram
- [ ] Bukti Penyelesaian tidak tampil di tab Media Telegram
- [ ] Empty state tampil jika media kosong
- [ ] Link/preview media tetap bisa dibuka
- [ ] Media tidak tampil terbuka di halaman utama

## Activity Log Checklist
- [ ] Riwayat aktivitas tampil jika ada
- [ ] Empty state tampil jika log kosong
- [ ] Format log rapi
- [ ] Logic log backend tidak berubah

## Regression Checklist
- [ ] Tombol Detail tetap membuka modal
- [ ] Modal tidak error
- [ ] Detail tiket berbeda tidak membawa data lama
- [ ] Telegram intake tidak berubah
- [ ] Telegram parsing tidak berubah
- [ ] Pending media tidak berubah
- [ ] Text enrichment tidak berubah
- [ ] Upload bukti tidak berubah
- [ ] Selesai/return/eskalasi tidak berubah
- [ ] Region Switch tidak berubah
- [ ] F017 manual report tidak berubah
- [ ] F018 coordinator access tidak berubah
- [ ] Database tidak berubah

## Manual Testing Checklist
- [ ] Login Eksekutor
- [ ] Buka detail tiket
- [ ] Cek tab Informasi Tiket
- [ ] Cek tab Bukti Penyelesaian
- [ ] Cek tab Media Telegram
- [ ] Cek tab Riwayat Aktivitas
- [ ] Buka tiket lain
- [ ] Pastikan tab reset
- [ ] Test tiket tanpa media
- [ ] Test tiket tanpa bukti
- [ ] Login Koordinator
- [ ] Test tiket PDG dan BKT
- [ ] Login Supervisor
- [ ] Pastikan read-only

## Evidence Checklist
- [ ] Screenshot tab Informasi Tiket
- [ ] Screenshot tab Bukti Penyelesaian
- [ ] Screenshot tab Media Telegram
- [ ] Screenshot tab Riwayat Aktivitas
- [ ] Screenshot empty state
- [ ] Catatan file yang diubah
- [ ] Catatan hasil testing