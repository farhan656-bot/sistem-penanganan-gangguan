# Feature Spec — Escalation DIIT Code Feedback

## Feature ID
F014

## Feature Name
Escalation DIIT Code Feedback

## Summary
Fitur ini menyesuaikan flow eskalasi tiket agar sistem menyediakan input kode DIIT ketika tiket diberi status `eskalasi`. Kode DIIT merupakan kode yang diperoleh dari DIIT, kemudian disalin ke sistem agar dapat disimpan dan dikirimkan kembali kepada pelapor melalui Bot Telegram.

## Business Background
Berdasarkan revisi pembimbing lapangan Telkom, ketika tiket tidak dapat diselesaikan secara langsung dan perlu dieskalasikan ke DIIT, sistem perlu mencatat kode DIIT. Kode tersebut nantinya digunakan sebagai informasi tindak lanjut dan harus tersampaikan kepada pelapor melalui Bot Telegram. Dengan demikian, pelapor mengetahui bahwa tiket sedang dieskalasikan dan memiliki kode rujukan dari DIIT.

## Problem Statement
Flow eskalasi sebelumnya belum secara khusus meminta kode DIIT. Padahal dalam proses operasional, kode DIIT perlu dicatat dan dikirimkan kepada pelapor agar informasi eskalasi lebih jelas. Tanpa kode tersebut, feedback Telegram untuk eskalasi belum cukup lengkap.

## Goals
1. Menambahkan input kode DIIT pada flow eskalasi.
2. Mewajibkan kode DIIT ketika status akhir tiket adalah `eskalasi`.
3. Menyimpan kode DIIT pada data laporan/tiket.
4. Menampilkan kode DIIT pada detail laporan/modal jika tersedia.
5. Mengirim feedback Telegram berisi informasi eskalasi dan kode DIIT.
6. Menjaga log aktivitas eskalasi tetap dibuat.
7. Menjaga flow `selesai` tetap tidak berubah.
8. Menjaga flow `perlu_tindak_lanjut` tetap tidak berubah.

## Non-Goals
1. Tidak membuat integrasi langsung ke DIIT.
2. Tidak membuat kode DIIT secara otomatis.
3. Tidak mengubah flow status `selesai`.
4. Tidak mengubah catatan opsional untuk status `selesai`.
5. Tidak mengubah feedback return dari F013.
6. Tidak mengubah Telegram intake.
7. Tidak mengubah Telegram parsing.
8. Tidak mengubah pending media.
9. Tidak mengubah text enrichment.
10. Tidak mengubah Region Switch F007.
11. Tidak mengubah dashboard KPI.
12. Tidak mengubah role middleware.

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
2. Eksekutor berhak memproses tiket sesuai rule sistem.
3. Tiket dapat diberi status akhir `eskalasi`.
4. Kode DIIT diperoleh dari proses eksternal DIIT.
5. Sistem memiliki Telegram feedback service.
6. Tiket dari Telegram memiliki `telegram_chat_id`.
7. Sistem memiliki detail laporan/modal.
8. Sistem memiliki report log.

## Postconditions

### Jika berhasil
1. Saat status `eskalasi` dipilih, sistem meminta kode DIIT.
2. Sistem menolak eskalasi jika kode DIIT kosong.
3. Kode DIIT tersimpan pada data laporan.
4. Kode DIIT tampil pada detail laporan/modal.
5. Bot Telegram mengirim pesan eskalasi beserta kode DIIT.
6. Log aktivitas eskalasi tetap dibuat.
7. Flow `selesai` dan `perlu_tindak_lanjut` tidak berubah.

### Jika gagal
1. Tiket dapat dieskalasikan tanpa kode DIIT.
2. Kode DIIT tidak tersimpan.
3. Kode DIIT tidak tampil pada detail laporan/modal.
4. Feedback Telegram eskalasi tidak memuat kode DIIT.
5. Flow status lain ikut berubah tanpa diminta.

## Functional Requirements

### FR-01 — DIIT Code Field
Sistem harus menyediakan field input kode DIIT ketika status akhir yang dipilih adalah `eskalasi`.

### FR-02 — DIIT Code Required for Escalation
Kode DIIT wajib diisi ketika status akhir tiket adalah `eskalasi`.

### FR-03 — DIIT Code Not Required for Other Status
Kode DIIT tidak wajib untuk status `selesai` dan `perlu_tindak_lanjut`.

### FR-04 — Save DIIT Code
Sistem harus menyimpan kode DIIT pada data tiket/laporan.

### FR-05 — Show DIIT Code on Detail Modal
Kode DIIT harus ditampilkan pada detail laporan/modal jika tersedia.

### FR-06 — Escalation Telegram Feedback
Jika tiket berasal dari Telegram, sistem harus mengirim feedback bahwa tiket sedang dieskalasikan ke DIIT.

### FR-07 — Telegram Feedback Includes DIIT Code
Feedback Telegram eskalasi harus memuat kode DIIT yang diinput ke sistem.

### FR-08 — Hide Empty DIIT Code
Kode DIIT tidak boleh ditampilkan jika kosong atau tidak relevan.

### FR-09 — Non-Telegram Ticket Safety
Jika tiket bukan berasal dari Telegram atau tidak memiliki `telegram_chat_id`, sistem tidak boleh error.

### FR-10 — Preserve Activity Log
Sistem tetap harus membuat log aktivitas ketika tiket dieskalasikan.

### FR-11 — Preserve Selesai Flow
Perubahan ini tidak boleh mengubah flow status `selesai`.

### FR-12 — Preserve Return Flow
Perubahan ini tidak boleh mengubah flow status `perlu_tindak_lanjut`.

### FR-13 — RBAC Safety
Hanya role yang sebelumnya berhak memproses tiket yang tetap dapat melakukan eskalasi.

## Business Rules
1. Status `eskalasi` digunakan ketika tiket perlu diteruskan ke DIIT.
2. Kode DIIT berasal dari DIIT dan disalin ke sistem secara manual oleh pengguna yang berhak.
3. Kode DIIT wajib untuk status `eskalasi`.
4. Kode DIIT harus dikirimkan kepada pelapor melalui Bot Telegram jika tiket berasal dari Telegram.
5. Tiket non-Telegram tidak boleh menyebabkan error feedback.
6. Log aktivitas eskalasi tetap wajib dibuat.
7. Status `selesai` tidak termasuk scope F014.
8. Status `perlu_tindak_lanjut` tidak termasuk scope F014.
9. Sistem tidak melakukan integrasi langsung ke DIIT.

## Suggested Telegram Message

```text
🚩 Tiket [TICKET_ID] sedang dieskalasikan ke DIIT.

Kode DIIT:
[KODE_DIIT]

Mohon menunggu proses tindak lanjut berikutnya.