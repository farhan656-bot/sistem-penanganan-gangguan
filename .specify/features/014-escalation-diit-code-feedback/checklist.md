
---

# `checklist.md`

```md
# Checklist — Escalation DIIT Code Feedback

## Database Checklist
- [ ] Kolom `diit_code` dicek pada tabel `reports`
- [ ] Kolom `diit_code` ditambahkan jika belum ada
- [ ] Kolom `diit_code` bertipe VARCHAR(100) NULL
- [ ] Tidak ada tabel lain yang berubah
- [ ] Tidak ada data lama yang terhapus
- [ ] SQL manual dicatat jika dijalankan

## UI Checklist
- [ ] Field `Kode DIIT` tersedia pada form penyelesaian/status akhir
- [ ] Field kode DIIT muncul atau aktif ketika status `eskalasi`
- [ ] Field kode DIIT tidak wajib untuk status `selesai`
- [ ] Field kode DIIT tidak wajib untuk status `perlu_tindak_lanjut`
- [ ] Helper text kode DIIT tersedia
- [ ] Form tetap rapi
- [ ] Tidak ada field baru lain

## Validation Checklist
- [ ] Status `eskalasi` dapat dipilih
- [ ] Sistem menolak eskalasi tanpa kode DIIT
- [ ] Sistem menolak kode DIIT yang hanya berisi spasi
- [ ] Sistem menerima eskalasi dengan kode DIIT
- [ ] Kode DIIT tersimpan
- [ ] Status selain `eskalasi` tidak membutuhkan kode DIIT

## Detail Modal Checklist
- [ ] Detail modal mengambil data `diit_code`
- [ ] Detail modal menampilkan kode DIIT jika tersedia
- [ ] Detail modal menampilkan `-` atau menyembunyikan field jika kode kosong
- [ ] Detail modal tidak error untuk tiket lama
- [ ] Detail modal tetap rapi

## Telegram Feedback Checklist
- [ ] Status `eskalasi` memicu feedback Telegram
- [ ] Pesan menyebut tiket sedang dieskalasikan ke DIIT
- [ ] Pesan memuat kode DIIT
- [ ] Ticket ID tampil pada pesan
- [ ] Format pesan rapi
- [ ] Tiket non-Telegram tidak menyebabkan error
- [ ] Feedback gagal dicatat sesuai mekanisme lama

## Log Checklist
- [ ] Log eskalasi dibuat
- [ ] Log tetap dibuat meskipun feedback Telegram gagal
- [ ] Kode DIIT tercatat pada log jika diterapkan
- [ ] Log tidak menyebabkan error

## Regression Checklist
- [ ] Flow `selesai` tidak berubah
- [ ] Status `selesai` tetap bisa tanpa catatan
- [ ] Flow `perlu_tindak_lanjut` tidak berubah
- [ ] Feedback return evidence tetap berjalan
- [ ] Telegram intake tidak berubah
- [ ] Telegram parsing tidak berubah
- [ ] Pending media tidak berubah
- [ ] Text enrichment tidak berubah
- [ ] Region Switch F007 tidak berubah
- [ ] KPI Supervisor tidak berubah
- [ ] Laporan manual tetap tidak muncul

## Role Safety Checklist
- [ ] Eksekutor yang berhak dapat melakukan eskalasi
- [ ] Eksekutor yang tidak berhak tidak dapat melakukan eskalasi
- [ ] Koordinator tidak mendapat akses baru
- [ ] Supervisor tetap read-only
- [ ] Super Admin tidak mendapat akses baru
- [ ] Middleware role tidak berubah

## Manual Verification Checklist
- [ ] Login sebagai Eksekutor
- [ ] Ambil tiket Telegram
- [ ] Pilih status `eskalasi`
- [ ] Submit tanpa kode DIIT
- [ ] Pastikan validasi muncul
- [ ] Isi kode DIIT
- [ ] Submit eskalasi
- [ ] Pastikan berhasil
- [ ] Buka detail modal
- [ ] Pastikan kode DIIT tampil
- [ ] Cek pesan Telegram
- [ ] Pastikan kode DIIT terkirim
- [ ] Test tiket non-Telegram jika ada
- [ ] Test status `selesai`
- [ ] Test status `perlu_tindak_lanjut`
- [ ] Login sebagai Supervisor
- [ ] Pastikan dashboard read-only

## Evidence Checklist
- [ ] Screenshot field kode DIIT
- [ ] Screenshot validasi kode DIIT kosong
- [ ] Screenshot tiket eskalasi berhasil
- [ ] Screenshot detail modal kode DIIT
- [ ] Screenshot pesan Telegram eskalasi
- [ ] Screenshot log aktivitas eskalasi
- [ ] Catatan SQL yang dijalankan jika ada
- [ ] Catatan file yang berubah
- [ ] Catatan hasil testing manual