
---

# `plan.md`

```md
# Technical Plan — Escalation DIIT Code Feedback

## Feature ID
F014

## Feature Name
Escalation DIIT Code Feedback

## Objective
Menambahkan dukungan kode DIIT pada flow eskalasi tiket, mulai dari input kode DIIT, validasi wajib untuk status `eskalasi`, penyimpanan ke database, tampilan pada detail laporan/modal, hingga pengiriman feedback Telegram berisi kode DIIT.

## Existing Context
Sistem saat ini sudah memiliki:
- autentikasi dan RBAC
- flow penyelesaian tiket
- status akhir `selesai`, `perlu_tindak_lanjut`, dan `eskalasi`
- catatan penyelesaian opsional untuk status `selesai` dari F012
- feedback return evidence untuk status `perlu_tindak_lanjut` dari F013
- detail laporan/modal dari F010
- Telegram feedback service
- Telegram bot intake
- report logs
- tabel `reports`
- field `telegram_chat_id`
- field `telegram_message_id`
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
Ada kemungkinan perubahan database kecil.

### Required Check
Periksa apakah tabel `reports` sudah memiliki kolom untuk menyimpan kode DIIT.

### Recommended Column
Gunakan nama kolom:

```sql
diit_code