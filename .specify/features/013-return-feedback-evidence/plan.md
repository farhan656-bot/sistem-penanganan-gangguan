
---

# `plan.md`

```md
# Technical Plan — Return Feedback Evidence

## Feature ID
F013

## Feature Name
Return Feedback Evidence

## Objective
Menyesuaikan feedback Telegram untuk status `perlu_tindak_lanjut` agar menyampaikan bahwa tiket dikembalikan dan pelapor diminta melengkapi evidence.

## Existing Context
Sistem saat ini sudah memiliki:
- autentikasi dan RBAC
- flow penyelesaian tiket
- status akhir `selesai`, `perlu_tindak_lanjut`, dan `eskalasi`
- catatan penyelesaian opsional untuk status `selesai` dari F012
- Telegram feedback service
- Telegram bot intake
- report logs
- tabel `reports`
- field `telegram_chat_id`
- field `telegram_message_id`
- field `completion_notes`
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
- node-telegram-bot-api
- CommonJS

## Database Impact
Tidak ada perubahan struktur database.

F013 tidak membutuhkan:
- tabel baru
- kolom baru
- ALTER TABLE
- migration
- perubahan relasi database

Field yang digunakan tetap:
- `completion_status`
- `completion_notes`
- `telegram_chat_id`
- `telegram_message_id`
- `ticket_id`
- `status`

## Files Likely Impacted

### Services
Periksa service feedback Telegram:
- `services/telegramFeedbackService.js`
- atau file sejenis yang mengirim feedback status tiket.

### Controllers
Periksa controller penyelesaian tiket:
- `controllers/reportController.js`
- atau controller lain yang menangani status `perlu_tindak_lanjut`.

### Models
Periksa model update status dan log:
- `models/reportModel.js`
- `models/reportLogModel.js`
- atau model sesuai struktur project.

### Views
Jika ada helper text pada form penyelesaian:
- view form/modal penyelesaian tiket
- view detail modal jika menampilkan catatan/status

## Implementation Plan

### Step 1 — Review Existing Return Flow
1. Cari status `perlu_tindak_lanjut`.
2. Cari controller yang memproses status akhir tiket.
3. Cari service feedback Telegram.
4. Cari fungsi yang membuat pesan feedback.
5. Cari log ketika feedback berhasil/gagal.
6. Catat alur lama sebelum perubahan.

### Step 2 — Update Telegram Message Builder
1. Buat atau ubah pesan untuk status `perlu_tindak_lanjut`.
2. Pesan harus menyebut tiket dikembalikan.
3. Pesan harus meminta pelapor melengkapi evidence.
4. Jika catatan ada, tampilkan catatan.
5. Jika catatan kosong, jangan tampilkan bagian catatan.
6. Pastikan ticket ID tampil pada pesan.

### Step 3 — Preserve Non-Telegram Safety
1. Periksa apakah tiket memiliki `telegram_chat_id`.
2. Jika tidak ada, jangan kirim feedback Telegram.
3. Pastikan sistem tetap menyelesaikan proses status tanpa error.
4. Log aktivitas tetap dibuat.

### Step 4 — Preserve Existing Status Flow
1. Jangan ubah flow status `selesai`.
2. Jangan ubah flow status `eskalasi`.
3. Jangan ubah validasi catatan opsional F012.
4. Jangan ubah status lifecycle.
5. Jangan ubah Telegram intake atau parsing.

### Step 5 — Optional UI Helper Text
Jika form status akhir memiliki deskripsi untuk `perlu_tindak_lanjut`, ubah menjadi:

> Gunakan status ini jika tiket perlu dikembalikan kepada pelapor untuk melengkapi evidence.

Jangan menambah field baru.

### Step 6 — Regression Check
Pastikan fitur berikut tetap berjalan:
- status `perlu_tindak_lanjut`
- report log
- feedback Telegram return
- status `selesai` tanpa catatan
- status `eskalasi` lama
- Telegram intake
- pending media
- text enrichment
- dashboard Supervisor read-only

## Access Control Plan
Tidak ada perubahan access control.

Aturan tetap:
- Eksekutor yang berhak dapat memproses tiket.
- Supervisor tetap read-only.
- Koordinator tidak mendapat perubahan akses.
- Super Admin tidak mendapat perubahan akses.
- Pelapor menerima feedback melalui Telegram jika tiket berasal dari Telegram.

## Validation Rules
1. Jika status adalah `perlu_tindak_lanjut`, pesan feedback harus memakai wording return.
2. Catatan return hanya ditampilkan jika ada.
3. Catatan kosong/spasi tidak ditampilkan.
4. Tiket non-Telegram tidak boleh error.
5. Feedback gagal dicatat sesuai mekanisme lama.
6. Flow `selesai` tidak berubah.
7. Flow `eskalasi` tidak berubah.
8. Database tidak berubah.

## Testing Strategy

### Manual Test Cases
1. Login sebagai Eksekutor.
2. Ambil tiket dari Telegram.
3. Proses tiket dengan status `perlu_tindak_lanjut`.
4. Isi catatan return.
5. Submit.
6. Pastikan pesan Telegram menyebut tiket dikembalikan.
7. Pastikan pesan meminta evidence dilengkapi.
8. Pastikan catatan tampil pada pesan.
9. Ulangi dengan catatan kosong jika sistem mengizinkan.
10. Pastikan tidak ada label catatan kosong.
11. Test tiket non-Telegram jika ada.
12. Pastikan tidak error.
13. Pastikan log aktivitas dibuat.
14. Test status `selesai` tanpa catatan tetap berjalan.
15. Test status `eskalasi` tetap berjalan seperti sebelumnya.
16. Pastikan Telegram intake tetap menerima laporan baru.
17. Pastikan Supervisor tetap read-only.

## Rollback Plan
1. Jika feedback return error, rollback perubahan pada message builder status `perlu_tindak_lanjut`.
2. Jika status `selesai` ikut terganggu, rollback perubahan controller yang tidak seharusnya.
3. Jika status `eskalasi` ikut terganggu, rollback perubahan service yang menyentuh eskalasi.
4. Jika Telegram service error total, rollback service feedback ke versi sebelum F013 lalu ubah khusus branch `perlu_tindak_lanjut`.
5. Jangan rollback F009, F010, F011, atau F012.

## Out of Scope
1. Escalation DIIT code.
2. Feedback eskalasi baru.
3. Database migration.
4. Perubahan detail modal.
5. Perubahan region switch.
6. Perubahan KPI supervisor.