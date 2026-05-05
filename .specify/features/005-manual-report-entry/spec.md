# Feature Spec — Manual Report Entry

## Feature ID
F005

## Feature Name
Manual Report Entry

## Summary
Fitur ini menyediakan form input laporan gangguan secara manual melalui web dashboard. Fitur ini digunakan sebagai jalur input sementara sebelum integrasi Bot Telegram selesai, sekaligus menjadi fallback operasional jika laporan tidak masuk melalui bot.

## Business Background
Hasil diskusi lapangan menunjukkan bahwa laporan gangguan bisa berisi data inti seperti ticket ID, order ID, pesan gangguan, data tambahan teknis, dan dokumentasi pendukung. Pada proses berbasis bot, laporan yang panjang bahkan dapat diterima sebagai data tambahan dan disatukan ke tiket yang sama. Bot juga memberikan umpan balik ketika tiket diterima, diambil, sedang dikerjakan, dan selesai. Kondisi ini menunjukkan bahwa sistem perlu memiliki jalur input manual yang tetap konsisten dengan alur tiket yang sudah ada. :contentReference[oaicite:2]{index=2}

## Problem Statement
Saat ini sistem operasional tiket sudah berjalan, tetapi pemasukan laporan masih bergantung pada proses yang belum terintegrasi penuh dengan Bot Telegram. Tanpa fitur input manual:
- pengujian sistem menjadi lambat,
- operasional demo tidak fleksibel,
- data awal tiket sulit dimasukkan secara konsisten,
- fallback saat bot belum aktif tidak tersedia.

## Goals
1. Menyediakan form input laporan manual pada dashboard web.
2. Memungkinkan user yang berwenang menambahkan tiket baru tanpa bot.
3. Menyimpan laporan manual ke tabel `reports` dengan format yang konsisten.
4. Menetapkan status awal tiket sesuai lifecycle sistem.
5. Mendukung data inti tiket yang relevan untuk task pool dan monitoring.

## Non-Goals
1. Fitur ini belum mengintegrasikan Bot Telegram.
2. Fitur ini belum memproses multi-message merge otomatis seperti bot.
3. Fitur ini belum mengirim feedback otomatis ke Telegram.
4. Fitur ini belum mengelola OCR atau parsing lampiran.

## Actors

### Primary Actor
- Koordinator

### Secondary Actor
- Super Admin

## Preconditions
1. User telah berhasil login.
2. User memiliki role yang diizinkan untuk input manual.
3. Database sistem dapat diakses.
4. Tabel `reports`, `regions`, dan data referensi lain tersedia.

## Postconditions

### Jika berhasil
1. Laporan baru tersimpan di tabel `reports`.
2. Status awal tiket menjadi `tersedia`.
3. District tiket tersimpan dengan benar.
4. Tiket muncul di daftar antrean kerja.
5. Log aktivitas input manual tercatat.

### Jika gagal
1. Data tiket tidak tersimpan.
2. Tidak ada tiket baru yang masuk ke antrean.
3. Sistem menampilkan pesan error yang sesuai.

## Functional Requirements

### FR-01 — Akses Form Input Manual
Sistem harus menyediakan halaman/form input laporan manual.

### FR-02 — Role yang Boleh Input
Sistem harus membatasi akses input manual minimal untuk:
- Koordinator
- Super Admin

### FR-03 — Field Data Inti
Form manual harus mendukung field inti berikut:
- ticket_id
- order_id
- service_type
- provider
- branch_name
- cluster_name
- sto
- summary
- district / region
- status_wfm
- status_andalas
- field pendukung lain yang dianggap perlu oleh implementasi

### FR-04 — Status Awal Tiket
Saat laporan manual berhasil disimpan, tiket harus masuk dengan status awal `tersedia`.

### FR-05 — Source Channel
Saat laporan manual disimpan, sistem harus menyimpan `source_channel = manual`.

### FR-06 — Timestamp Awal
Saat laporan manual disimpan, sistem harus menetapkan `received_at` sebagai waktu input.

### FR-07 — District Assignment Awal
Saat laporan manual disimpan:
- `reported_region_id` harus terisi
- `current_region_id` harus sama dengan district tiket awal

### FR-08 — Validasi Input
Sistem harus memvalidasi field wajib sebelum menyimpan tiket.

### FR-09 — Ticket ID Unik
Sistem harus menolak input jika `ticket_id` sudah ada.

### FR-10 — Logging
Sistem harus mencatat log aktivitas bahwa tiket dibuat secara manual.

## Business Rules
1. Input manual digunakan sebagai jalur sementara/fallback sebelum bot aktif penuh.
2. Tiket manual harus mengikuti lifecycle tiket yang sama dengan tiket dari bot.
3. Ticket ID harus unik.
4. District awal tiket harus ditentukan saat input.
5. Ticket manual langsung masuk ke antrean kerja setelah tersimpan.
6. Input manual tidak boleh melanggar rule delegasi, assignment, atau SLA yang sudah ada.

## Data Requirements

### Main Table
- `reports`

### Related Tables
- `regions`
- `report_logs`

### Important Fields
- `source_channel`
- `ticket_id`
- `order_id`
- `service_type`
- `provider`
- `branch_name`
- `cluster_name`
- `sto`
- `summary`
- `status_wfm`
- `status_andalas`
- `status_internal`
- `reported_region_id`
- `current_region_id`
- `received_at`

## Acceptance Criteria

### AC-01
Given koordinator membuka form input manual  
When form diisi lengkap dan valid  
Then tiket baru tersimpan dan masuk ke antrean kerja.

### AC-02
Given super admin membuka form input manual  
When form diisi lengkap dan valid  
Then tiket baru tersimpan dan masuk ke antrean kerja.

### AC-03
Given ticket_id sudah ada  
When user submit form  
Then sistem menolak penyimpanan dan menampilkan pesan error.

### AC-04
Given district dipilih  
When tiket disimpan  
Then `reported_region_id` dan `current_region_id` terisi sesuai district awal.

### AC-05
Given tiket manual tersimpan  
When daftar antrean dibuka  
Then tiket tersebut muncul dengan status `tersedia`.

## Edge Cases
1. ticket_id duplikat
2. field wajib kosong
3. district tidak dipilih
4. query simpan database gagal
5. user tanpa hak akses mencoba membuka form input manual