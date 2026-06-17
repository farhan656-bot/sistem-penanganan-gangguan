# Checklist — Smooth Ticket Action UX

## UX Checklist
- [ ] Klik Kerjakan tidak membuat user kembali ke atas
- [ ] Klik Tandai Sedang Dikerjakan tidak membuat user kembali ke atas
- [ ] Posisi scroll tetap nyaman
- [ ] User mendapat feedback sukses
- [ ] User mendapat feedback error jika gagal
- [ ] Tombol tidak bisa diklik berkali-kali saat proses

## Action Checklist
- [ ] Kerjakan tetap berjalan
- [ ] Ambil tiket tetap berjalan jika tersedia
- [ ] Tandai sedang dikerjakan tetap berjalan jika tersedia
- [ ] Status tiket berubah sesuai aksi
- [ ] Assigned user berubah sesuai aksi
- [ ] Backend route lama tetap aman

## Fallback Checklist
- [ ] Jika AJAX tidak berjalan, form lama tetap berfungsi
- [ ] Scroll position tetap bisa dikembalikan setelah reload
- [ ] Filter tetap dipertahankan
- [ ] Halaman tidak crash

## Feature Safety Checklist
- [ ] Tombol Detail tetap membuka modal F019
- [ ] Modal tabs tetap berjalan
- [ ] F026 layout tombol tetap rapi
- [ ] Role Eksekutor aman
- [ ] Role Koordinator aman
- [ ] Supervisor tetap read-only

## Regression Checklist
- [ ] Database tidak berubah
- [ ] Telegram tidak berubah
- [ ] Upload file tidak berubah
- [ ] F017 tidak berubah
- [ ] F018 tidak berubah
- [ ] F019 tidak berubah
- [ ] F021 tidak berubah
- [ ] F022 tidak berubah
- [ ] F023 tidak berubah
- [ ] F024 tidak berubah
- [ ] F025 tidak berubah
- [ ] F026 tidak berubah