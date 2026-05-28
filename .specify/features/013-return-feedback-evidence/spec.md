# Feature Spec — Return Feedback Evidence

## Feature ID
F013

## Feature Name
Return Feedback Evidence

## Summary
Fitur ini menyesuaikan feedback Bot Telegram ketika tiket diberi status `perlu_tindak_lanjut`. Berdasarkan revisi pembimbing lapangan Telkom, status tersebut perlu dipahami sebagai kondisi tiket dikembalikan kepada pelapor karena evidence atau data pendukung belum lengkap. Oleh karena itu, Bot Telegram harus mengirim pesan bahwa tiket dikembalikan dan pelapor diminta melengkapi evidence.

## Business Background
Sistem sebelumnya sudah memiliki status akhir `perlu_tindak_lanjut`. Namun, pesan feedback kepada pelapor perlu dibuat lebih sesuai dengan kebutuhan operasional. Ketika tiket tidak dapat diselesaikan karena evidence belum lengkap, sistem perlu memberi tahu pelapor melalui Bot Telegram bahwa tiket dikembalikan dan evidence perlu dilengkapi agar tiket dapat diproses kembali.

## Problem Statement
Feedback Telegram untuk status `perlu_tindak_lanjut` belum cukup jelas menjelaskan bahwa tiket dikembalikan kepada pelapor. Tanpa pesan yang jelas, pelapor dapat kesulitan memahami tindakan yang perlu dilakukan selanjutnya, khususnya dalam melengkapi evidence atau data pendukung.

## Goals
1. Menyesuaikan pesan feedback Telegram untuk status `perlu_tindak_lanjut`.
2. Menyampaikan bahwa tiket dikembalikan kepada pelapor.
3. Meminta pelapor melengkapi evidence agar tiket dapat diproses kembali.
4. Menampilkan catatan return jika Eksekutor mengisi catatan.
5. Menjaga log aktivitas tetap dibuat.
6. Menjaga flow `selesai` tetap tidak berubah.
7. Menjaga flow `eskalasi` tetap tidak berubah.
8. Menjaga Telegram intake dan parsing tetap tidak berubah.

## Non-Goals
1. Tidak mengubah flow status `selesai`.
2. Tidak mengubah catatan opsional untuk status `selesai`.
3. Tidak mengubah flow status `eskalasi`.
4. Tidak menambahkan kode DIIT.
5. Tidak mengubah Telegram intake.
6. Tidak mengubah Telegram parsing.
7. Tidak mengubah pending media Telegram.
8. Tidak mengubah text enrichment.
9. Tidak mengubah Region Switch F007.
10. Tidak mengubah dashboard KPI.
11. Tidak mengubah struktur database.

## Actors

### Primary Actor
- Eksekutor

### Secondary Actors
- Pelapor Telegram
- Koordinator
- Supervisor
- Super Admin

## Preconditions
1. Eksekutor sudah login.
2. Tiket sudah dapat diproses sesuai hak akses Eksekutor.
3. Tiket memiliki status akhir `perlu_tindak_lanjut`.
4. Sistem sudah memiliki Telegram feedback service.
5. Tiket yang berasal dari Telegram memiliki `telegram_chat_id`.
6. Sistem sudah memiliki report log.
7. Status `selesai` sudah mendukung catatan opsional dari F012.

## Postconditions

### Jika berhasil
1. Ketika tiket diberi status `perlu_tindak_lanjut`, sistem mengirim pesan Telegram bahwa tiket dikembalikan.
2. Pesan Telegram meminta pelapor melengkapi evidence.
3. Jika catatan return diisi, catatan tersebut ikut dikirim dalam pesan Telegram.
4. Log aktivitas tetap dibuat.
5. Jika tiket bukan berasal dari Telegram, sistem tidak error.
6. Flow status `selesai` tidak berubah.
7. Flow status `eskalasi` tidak berubah.

### Jika gagal
1. Pesan Telegram tidak terkirim.
2. Pesan Telegram tidak menjelaskan bahwa tiket dikembalikan.
3. Pesan Telegram tidak meminta evidence dilengkapi.
4. Sistem error ketika tiket bukan berasal dari Telegram.
5. Flow status lain ikut berubah tanpa diminta.

## Functional Requirements

### FR-01 — Return Feedback Trigger
Sistem harus mengirim feedback Telegram ketika tiket diberi status `perlu_tindak_lanjut` dan tiket memiliki data Telegram yang valid.

### FR-02 — Return Message Wording
Pesan Telegram harus menyebut bahwa tiket dikembalikan.

### FR-03 — Evidence Request Wording
Pesan Telegram harus meminta pelapor melengkapi evidence agar tiket dapat diproses kembali.

### FR-04 — Include Return Notes If Available
Jika Eksekutor mengisi catatan return, sistem harus menampilkan catatan tersebut pada pesan Telegram.

### FR-05 — Hide Empty Notes
Jika catatan return kosong, sistem tidak boleh menampilkan label catatan kosong pada pesan Telegram.

### FR-06 — Non-Telegram Ticket Safety
Jika tiket bukan berasal dari Telegram atau tidak memiliki `telegram_chat_id`, sistem tidak boleh error.

### FR-07 — Log Feedback Result
Jika feedback berhasil atau gagal, mekanisme pencatatan log tetap mengikuti pola yang sudah ada.

### FR-08 — Preserve Completion Flow
Perubahan ini tidak boleh mengubah flow status `selesai`.

### FR-09 — Preserve Escalation Flow
Perubahan ini tidak boleh mengubah flow status `eskalasi`.

### FR-10 — Preserve Telegram Intake
Perubahan ini tidak boleh mengubah Telegram intake, parsing, pending media, atau text enrichment.

### FR-11 — RBAC Safety
Hanya role yang sebelumnya berhak memproses tiket yang tetap dapat mengubah status menjadi `perlu_tindak_lanjut`.

## Business Rules
1. Status `perlu_tindak_lanjut` dipahami sebagai tiket dikembalikan untuk melengkapi evidence.
2. Pesan Telegram harus menggunakan bahasa yang jelas dan operasional.
3. Catatan return dapat digunakan untuk menjelaskan alasan pengembalian.
4. Catatan return tidak wajib ditampilkan jika kosong.
5. Tiket non-Telegram tidak boleh menyebabkan error feedback.
6. Feedback gagal harus dicatat sesuai mekanisme lama.
7. Status `selesai` tidak termasuk scope F013.
8. Status `eskalasi` tidak termasuk scope F013.
9. Telegram bot tetap memakai text parsing berbasis aturan tetap.

## Suggested Telegram Message

### Without Notes

```text
⚠️ Tiket [TICKET_ID] dikembalikan.

Mohon lengkapi evidence agar tiket dapat diproses kembali.