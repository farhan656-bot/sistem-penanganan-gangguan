# Technical Plan — Optional Completion Notes

## Feature ID
F012

## Feature Name
Optional Completion Notes

## Objective
Menyesuaikan validasi penyelesaian tiket agar catatan penyelesaian tidak wajib untuk status `selesai`, tanpa mengubah flow status lain seperti `perlu_tindak_lanjut` dan `eskalasi`.

## Existing Context
Sistem saat ini sudah memiliki:
- autentikasi dan RBAC
- role Eksekutor
- daftar antrean laporan
- detail laporan modal
- flow pengambilan tiket
- flow penyelesaian tiket
- field `completion_notes`
- field `completion_status`
- status akhir `selesai`, `perlu_tindak_lanjut`, dan `eskalasi`
- report logs
- Telegram feedback
- EJS views
- Bootstrap 5
- Node.js, Express.js, MySQL, mysql2/promise
- struktur MVC

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5
- express-session
- multer
- node-telegram-bot-api
- CommonJS

## Database Impact
Tidak ada perubahan struktur database.

F012 tidak membutuhkan:
- tabel baru
- kolom baru
- ALTER TABLE
- migration
- perubahan relasi database

Field yang digunakan tetap:
- `completion_notes`
- `completion_status`
- `resolved_at`
- `closed_at`
- `status`

## Files Likely Impacted

### Views
Periksa form atau modal penyelesaian tiket:
- `views/reports/index.ejs`
- `views/reports/detail.ejs`
- `views/reports/partials/complete-modal.ejs`
- `views/eksekutor/reports.ejs`
- atau nama view sesuai struktur project.

### Controllers
Periksa controller penyelesaian tiket:
- `controllers/reportController.js`
- atau controller lain yang menangani aksi selesai tiket.

### Models
Periksa model update penyelesaian tiket:
- `models/reportModel.js`
- `models/reportLogModel.js`
- atau model sesuai struktur project.

### Services
Periksa Telegram feedback hanya jika pesan selesai menampilkan catatan:
- `services/telegramFeedbackService.js`

## Implementation Plan

### Step 1 — Review Completion Flow
1. Cari form penyelesaian tiket.
2. Cari field `completion_notes`.
3. Cari field `completion_status`.
4. Cari controller yang memproses penyelesaian tiket.
5. Cari validasi yang mewajibkan catatan.
6. Cari validasi frontend seperti atribut `required`.
7. Cari pesan error yang menyebut catatan wajib.
8. Cari Telegram feedback untuk status `selesai`.

### Step 2 — Update UI Form
1. Ubah label catatan menjadi `Catatan Penyelesaian (Opsional)`.
2. Tambahkan helper text jika diperlukan.
3. Hapus atribut `required` permanen pada field catatan jika ada.
4. Pastikan catatan boleh kosong untuk status `selesai`.
5. Jangan mengubah field status lain.
6. Jangan menambahkan field baru.

### Step 3 — Update Backend Validation
1. Periksa validasi request pada controller.
2. Jika `completion_status === 'selesai'`, izinkan `completion_notes` kosong.
3. Trim input `completion_notes` agar spasi kosong dianggap kosong.
4. Simpan catatan jika ada.
5. Jangan ubah validasi `perlu_tindak_lanjut`.
6. Jangan ubah validasi `eskalasi`.
7. Pastikan user yang menyelesaikan tetap harus berhak sesuai logic lama.

### Step 4 — Update Model If Needed
1. Pastikan query update penyelesaian dapat menerima `completion_notes` kosong atau NULL.
2. Jangan mengubah struktur query di luar kebutuhan catatan opsional.
3. Pastikan `resolved_at` dan `closed_at` tetap disimpan.
4. Pastikan status tiket tetap berubah sesuai logic lama.
5. Pastikan log aktivitas tetap dibuat.

### Step 5 — Telegram Feedback for Selesai
1. Jika feedback selesai menampilkan catatan, tampilkan catatan hanya jika ada.
2. Jika catatan kosong, jangan tampilkan blok catatan kosong.
3. Jangan ubah feedback `perlu_tindak_lanjut`.
4. Jangan ubah feedback `eskalasi`.

### Step 6 — Regression Check
Pastikan fitur berikut tetap berjalan:
- login Eksekutor
- ambil tiket
- selesaikan tiket tanpa catatan
- selesaikan tiket dengan catatan
- log aktivitas selesai
- Telegram feedback selesai
- status `perlu_tindak_lanjut` tetap seperti sebelumnya
- status `eskalasi` tetap seperti sebelumnya
- dashboard Supervisor tetap read-only
- Telegram intake tetap berjalan

## Access Control Plan
Tidak ada perubahan akses.

Aturan tetap:
- Hanya Eksekutor yang berhak sesuai rule lama yang dapat menyelesaikan tiket.
- Supervisor tetap read-only.
- Koordinator tidak mendapat perubahan akses penyelesaian.
- Super Admin tidak mendapat perubahan akses penyelesaian.
- Pelapor tetap melalui Telegram.

## Validation Rules
1. Jika `completion_status` adalah `selesai`, `completion_notes` boleh kosong.
2. Jika `completion_notes` kosong, sistem tetap menyelesaikan tiket.
3. Jika `completion_notes` berisi spasi, perlakukan sebagai kosong.
4. Jika `completion_notes` diisi, simpan catatan.
5. Jangan mengubah status lain.
6. Jangan mengubah database.
7. Jangan mengubah RBAC middleware.
8. Jangan mengubah Region Switch F007.

## Testing Strategy

### Manual Test Cases
1. Login sebagai Eksekutor.
2. Ambil tiket berstatus `tersedia`.
3. Buka form penyelesaian.
4. Pilih status `selesai`.
5. Kosongkan catatan penyelesaian.
6. Submit.
7. Pastikan tiket berhasil selesai.
8. Pastikan status menjadi `selesai`.
9. Pastikan `resolved_at` dan `closed_at` terisi.
10. Pastikan log aktivitas dibuat.
11. Ulangi dengan catatan diisi.
12. Pastikan catatan tersimpan.
13. Jika tiket berasal dari Telegram, pastikan feedback selesai terkirim.
14. Pastikan feedback tidak menampilkan catatan kosong.
15. Test status `perlu_tindak_lanjut` tetap berjalan seperti sebelumnya.
16. Test status `eskalasi` tetap berjalan seperti sebelumnya.
17. Login sebagai Supervisor.
18. Pastikan dashboard tetap read-only.

## Rollback Plan
1. Jika penyelesaian tiket gagal, rollback validasi controller.
2. Jika form error, rollback perubahan view form penyelesaian.
3. Jika query update error, rollback perubahan model.
4. Jika Telegram feedback error, rollback perubahan pada message selesai saja.
5. Jangan rollback fitur F009, F010, atau F011.

## Out of Scope
1. Return feedback evidence.
2. Escalation DIIT code.
3. Report detail modal.
4. Manual report removal.
5. Region access wording.
6. Region Switch F007.
7. KPI Supervisor.