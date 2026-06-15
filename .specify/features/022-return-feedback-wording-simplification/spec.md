# Feature Spec — Return Feedback Wording Simplification

## Feature ID
F022

## Feature Name
Return Feedback Wording Simplification

## Summary
Fitur ini memperbaiki wording feedback Telegram untuk status `perlu_tindak_lanjut`. Kalimat tambahan "Mohon lengkapi evidence agar tiket dapat diproses kembali" harus dihapus. Pesan feedback return cukup menampilkan status dan catatan yang diinput oleh user di sistem.

## Business Background
Berdasarkan revisi pembimbing lapangan, feedback Telegram saat tiket dikembalikan atau memerlukan tindak lanjut tidak perlu meminta evidence secara eksplisit. Pesan yang dikirim ke Telegram cukup menampilkan catatan return yang sudah diinput oleh Eksekutor atau Koordinator pada sistem.

## Problem Statement
Saat ini feedback Telegram untuk status `perlu_tindak_lanjut` masih menampilkan kalimat tambahan yang meminta evidence. Kalimat tersebut dianggap tidak sesuai dengan kebutuhan lapangan karena yang perlu dikirim adalah catatan dari sistem, bukan instruksi tambahan yang bersifat tetap.

## Goals
1. Menghapus kalimat "Mohon lengkapi evidence agar tiket dapat diproses kembali" dari feedback Telegram return.
2. Mengirim catatan return sesuai input user di sistem.
3. Menjaga feedback Telegram tetap informatif.
4. Menjaga flow return tetap berjalan.
5. Menjaga upload bukti tetap opsional.
6. Tidak mengubah flow selesai.
7. Tidak mengubah flow eskalasi DIIT.
8. Tidak mengubah database.

## Non-Goals
1. Tidak mengubah Telegram intake.
2. Tidak mengubah Telegram parsing.
3. Tidak mengubah pending media.
4. Tidak mengubah text enrichment.
5. Tidak mengubah database.
6. Tidak mengubah struktur tabel `reports`.
7. Tidak mengubah struktur tabel `report_logs`.
8. Tidak mengubah F017 manual report.
9. Tidak mengubah F018 coordinator access.
10. Tidak mengubah F019 modal tabs.
11. Tidak mengubah F021 button cleanup.
12. Tidak membuat template pesan Telegram baru yang kompleks.

## Actors
- Eksekutor
- Koordinator
- Pelapor Telegram

## Preconditions
1. Tiket berasal dari Bot Telegram.
2. Tiket memiliki `telegram_chat_id`.
3. User login sebagai Eksekutor atau Koordinator.
4. User memilih status `perlu_tindak_lanjut`.
5. User mengisi catatan return jika sistem mewajibkan catatan.
6. Sistem mengirim feedback ke Telegram.

## Postconditions

### Jika berhasil
1. Feedback Telegram return tidak lagi berisi kalimat permintaan evidence.
2. Feedback Telegram return menampilkan catatan dari sistem.
3. Status tiket tetap berubah menjadi `perlu_tindak_lanjut`.
4. Log aktivitas tetap tercatat.
5. Telegram feedback tetap terkirim.
6. Flow selesai dan eskalasi tidak berubah.

### Jika gagal
1. Pesan Telegram masih mengandung kalimat permintaan evidence.
2. Catatan return tidak terkirim.
3. Feedback Telegram return tidak terkirim.
4. Flow return rusak.
5. Flow status lain ikut berubah.

## Functional Requirements

### FR-01 — Remove Evidence Request Sentence
Sistem harus menghapus kalimat:
"Mohon lengkapi evidence agar tiket dapat diproses kembali"
dari feedback Telegram return.

### FR-02 — Send Return Notes
Feedback Telegram return harus menampilkan catatan return yang diinput di sistem.

### FR-03 — Preserve Return Status
Status tiket tetap berubah menjadi `perlu_tindak_lanjut`.

### FR-04 — Preserve Telegram Feedback
Sistem tetap mengirim feedback Telegram untuk return jika `telegram_chat_id` tersedia.

### FR-05 — Preserve Report Log
Sistem tetap membuat log aktivitas untuk return.

### FR-06 — Preserve Evidence Optionality
Upload bukti pada return tetap mengikuti aturan terbaru dan tidak wajib.

### FR-07 — No Impact on Completed Feedback
Pesan Telegram untuk status `selesai` tidak boleh ikut berubah kecuali terkait bug langsung.

### FR-08 — No Impact on Escalation Feedback
Pesan Telegram untuk status `eskalasi` tidak boleh ikut berubah. Kode DIIT tetap wajib untuk eskalasi.

## Expected Message

### Before
```text
Tiket dikembalikan / perlu tindak lanjut.
Catatan: Data belum lengkap.
Mohon lengkapi evidence agar tiket dapat diproses kembali.