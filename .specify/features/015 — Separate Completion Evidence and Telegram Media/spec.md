# Feature Spec — Separate Completion Evidence and Telegram Media

## Feature ID
F015

## Feature Name
Separate Completion Evidence and Telegram Media

## Summary
Fitur ini memperbaiki pemisahan tampilan antara bukti penyelesaian dari Eksekutor dan media/bukti yang dikirim oleh pelapor melalui Telegram. Berdasarkan pengecekan kode, tabel `report_attachments` saat ini digunakan untuk dua jenis file, yaitu bukti penyelesaian dari form penyelesaian tiket dan media Telegram yang sudah di-link ke tiket. Karena itu, halaman detail penuh perlu memfilter attachment agar media Telegram tidak ikut tampil pada bagian Bukti Penyelesaian.

## Business Background
Pada proses operasional, bukti dari pelapor dan bukti penyelesaian dari Eksekutor memiliki fungsi yang berbeda. Media dari pelapor digunakan sebagai evidence awal laporan, sedangkan bukti penyelesaian digunakan sebagai bukti bahwa Eksekutor telah menyelesaikan pekerjaan. Oleh karena itu, keduanya harus ditampilkan pada bagian yang berbeda agar tidak menimbulkan salah pemahaman.

## Problem Statement
Pada halaman detail penuh, media Telegram yang sudah terhubung ke tiket ikut tampil pada bagian Bukti Penyelesaian. Padahal Eksekutor belum tentu mengunggah bukti penyelesaian. Hal ini membuat tampilan sistem terlihat seolah-olah bukti dari pelapor adalah bukti hasil pekerjaan Eksekutor.

## Goals
1. Memisahkan tampilan bukti penyelesaian Eksekutor dari media Telegram.
2. Mencegah media Telegram tampil sebagai bukti penyelesaian.
3. Menampilkan empty state jika belum ada bukti penyelesaian dari Eksekutor.
4. Menjaga media Telegram tetap tampil pada bagian Media Tambahan dari Telegram.
5. Menjaga detail modal tetap berjalan.
6. Tidak mengubah struktur database.
7. Tidak mengubah flow upload bukti penyelesaian.
8. Tidak mengubah Telegram bot intake.

## Non-Goals
1. Tidak menambahkan fitur paste screenshot.
2. Tidak mengubah struktur tabel `report_attachments`.
3. Tidak menambahkan kolom baru.
4. Tidak mengubah Telegram intake.
5. Tidak mengubah pending media Telegram.
6. Tidak mengubah flow penyelesaian tiket.
7. Tidak mengubah flow eskalasi DIIT.
8. Tidak mengubah Region Switch F007.
9. Tidak mengubah dashboard KPI.
10. Tidak mengubah RBAC middleware.

## Current Findings
1. `report_attachments` tidak khusus untuk bukti penyelesaian.
2. `report_attachments` digunakan untuk bukti penyelesaian dari form penyelesaian tiket.
3. `report_attachments` juga digunakan untuk media Telegram yang sudah berhasil di-link ke tiket.
4. `telegram_pending_media` khusus untuk media Telegram yang belum terhubung ke tiket.
5. Setelah media Telegram berhasil di-link, media tersebut masuk ke `report_attachments` dengan source `telegram`.
6. Modal detail sudah memfilter `source === 'telegram'` keluar dari attachments.
7. Halaman detail penuh `views/reports/show.ejs` belum memfilter media Telegram pada bagian Bukti Penyelesaian.

## Functional Requirements

### FR-01 — Filter Completion Evidence
Bagian Bukti Penyelesaian harus hanya menampilkan attachment yang bukan berasal dari Telegram.

### FR-02 — Exclude Telegram Source from Completion Evidence
Attachment dengan `source === 'telegram'` tidak boleh tampil pada bagian Bukti Penyelesaian.

### FR-03 — Show Telegram Media Separately
Attachment dengan `source === 'telegram'` harus tetap tampil pada bagian Media Tambahan dari Telegram.

### FR-04 — Empty State for Completion Evidence
Jika tidak ada bukti penyelesaian dari Eksekutor, sistem harus menampilkan pesan empty state.

### FR-05 — Preserve Modal Detail Behavior
Detail modal yang sudah memisahkan media Telegram tidak boleh rusak.

### FR-06 — Preserve Upload Completion Evidence
Flow upload bukti penyelesaian oleh Eksekutor tidak boleh berubah.

### FR-07 — Preserve Telegram Linked Media
Media Telegram yang sudah linked tetap harus dapat dilihat pada bagian Media Tambahan dari Telegram.

### FR-08 — No Database Change
F015 tidak boleh mengubah struktur database.

## Business Rules
1. Bukti penyelesaian adalah bukti yang diunggah oleh Eksekutor saat menyelesaikan tiket.
2. Media Telegram adalah evidence awal atau tambahan yang dikirim pelapor melalui Telegram.
3. Media Telegram tidak boleh dianggap sebagai bukti penyelesaian.
4. Jika Eksekutor belum mengunggah bukti penyelesaian, bagian Bukti Penyelesaian harus kosong dengan pesan yang jelas.
5. Media Telegram tetap harus tersedia untuk referensi pekerjaan.
6. Pemisahan dilakukan di sisi query, controller, atau view sesuai struktur yang paling aman.

## Suggested Empty State

Gunakan teks:

```text
Belum ada bukti penyelesaian yang diunggah oleh Eksekutor.