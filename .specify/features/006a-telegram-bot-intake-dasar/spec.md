# Feature Spec — Telegram Bot Intake Dasar

## Feature ID
F006A

## Feature Name
Telegram Bot Intake Dasar

## Summary
Fitur ini menyediakan jalur penerimaan laporan gangguan melalui Bot Telegram dalam bentuk intake dasar. Bot menerima pesan inti dari pelapor, melakukan parsing berbasis aturan, memvalidasi data wajib, lalu menyimpan tiket baru ke sistem dengan status awal `tersedia`.

## Business Background
Diskusi lapangan menunjukkan bahwa bot digunakan sebagai kanal input laporan dan juga memberikan feedback operasional seperti tiket diterima, diambil, sedang dikerjakan, dan selesai. Selain itu, pada kondisi tertentu terdapat data tambahan yang dapat digabungkan ke tiket yang sama. Untuk tahap awal implementasi, sistem perlu mendukung intake dasar terlebih dahulu, yaitu menerima satu pesan inti dan membentuk tiket baru yang masuk ke task pool. 

## Problem Statement
Sistem web dan lifecycle tiket sudah tersedia, tetapi belum ada intake otomatis dari Telegram. Tanpa fitur ini:
- pelapor tetap bergantung pada input manual,
- alur bot ke sistem belum terbentuk,
- feedback bot tidak bisa dipicu dari pembuatan tiket,
- pengujian integrasi Telegram belum dapat dilakukan.

## Goals
1. Menerima laporan inti dari chat pribadi Telegram.
2. Melakukan parsing berbasis format baku, bukan AI/NLP.
3. Membentuk tiket baru pada tabel `reports`.
4. Menyimpan metadata Telegram yang relevan.
5. Mengirim balasan konfirmasi bahwa tiket telah diterima.

## Non-Goals
1. Belum mendukung merge multi-message penuh.
2. Belum memproses foto dokumentasi sebagai attachment tiket.
3. Belum menangani feedback status assigned / in progress / selesai secara penuh.
4. Belum menggunakan webhook; tahap ini menggunakan polling.

## Actors

### Primary Actor
- Pelapor

### Secondary Actor
- Sistem Bot Telegram

## Preconditions
1. Bot Telegram telah dibuat dan token tersedia.
2. Konfigurasi `.env` sudah memuat token bot.
3. Bot berjalan dalam mode long polling.
4. Tabel `reports` dan `report_logs` tersedia.
5. Data district `PDG` dan `BKT` tersedia.

## Postconditions

### Jika berhasil
1. Tiket baru tersimpan di `reports`.
2. `source_channel` bernilai `telegram`.
3. `status_internal` bernilai `tersedia`.
4. `telegram_chat_id` dan `telegram_message_id` tersimpan.
5. Pelapor menerima balasan konfirmasi tiket diterima.

### Jika gagal
1. Tiket tidak tersimpan.
2. Sistem mengirim pesan error/format salah ke pelapor.
3. Tidak ada ticket duplikat yang dibuat.

## Functional Requirements

### FR-01 — Chat Pribadi ke Bot
Sistem harus menerima laporan dari pelapor melalui chat pribadi dengan bot.

### FR-02 — Format Baku Intake Dasar
Sistem harus memproses pesan inti dengan format baku dan terstruktur.

### FR-03 — Parsing Berbasis Aturan
Sistem harus melakukan text parsing berbasis aturan, bukan AI/NLP.

### FR-04 — Data Wajib Intake
Minimal data berikut harus dapat diekstrak:
- `ticket_id`
- `order_id`
- `summary`
- `region`

Field lain dapat ikut diproses jika tersedia pada pesan.

### FR-05 — Mapping ke Reports
Sistem harus menyimpan data Telegram ke tabel `reports` dengan mapping schema aktual:
- `source_channel = telegram`
- `ticket_id`
- `order_id`
- `wo_number`
- `service_type`
- `segment`
- `provider`
- `telkom_area`
- `branch_name`
- `cluster_name`
- `sto`
- `summary`
- `service_id`
- `status_wfm`
- `status_andalas`
- `reported_region_id`
- `current_region_id`
- `telegram_chat_id`
- `telegram_message_id`
- `status_internal = tersedia`

### FR-06 — Timestamp Awal
Saat tiket dari Telegram dibuat, `received_at` harus diisi otomatis.

### FR-07 — Validasi Ticket ID Unik
Jika `ticket_id` sudah ada, sistem harus menolak membuat tiket baru.

### FR-08 — Validasi Format
Jika format pesan tidak sesuai atau data wajib tidak lengkap, sistem harus menolak laporan dan memberi balasan koreksi.

### FR-09 — Balasan Konfirmasi
Jika tiket berhasil dibuat, bot harus mengirim balasan konfirmasi bahwa tiket diterima dan diteruskan ke tim handling.

### FR-10 — Logging
Sistem harus mencatat log aktivitas pembuatan tiket dari Telegram.

## Business Rules
1. Intake dasar fokus pada satu pesan inti sebagai satu tiket.
2. Fitur merge data tambahan dan foto akan dikerjakan di tahap berikutnya.
3. Ticket ID harus unik.
4. District awal tiket ditentukan dari field `REGION`.
5. `reported_region_id` dan `current_region_id` harus sama pada saat tiket pertama kali dibuat.
6. SLA mulai dihitung sejak tiket masuk, yaitu sejak `received_at`. :contentReference[oaicite:2]{index=2}

## Data Requirements

### Main Table
- `reports`

### Related Tables
- `regions`
- `report_logs`

### Important Existing Report Fields
- `source_channel`
- `ticket_id`
- `order_id`
- `wo_number`
- `service_type`
- `segment`
- `provider`
- `telkom_area`
- `branch_name`
- `cluster_name`
- `sto`
- `summary`
- `service_id`
- `status_wfm`
- `status_andalas`
- `status_internal`
- `reported_region_id`
- `current_region_id`
- `telegram_chat_id`
- `telegram_message_id`
- `received_at`

## Acceptance Criteria

### AC-01
Given pelapor mengirim pesan laporan dengan format valid  
When bot memproses pesan  
Then tiket baru tersimpan ke sistem dan balasan konfirmasi dikirim.

### AC-02
Given pelapor mengirim pesan dengan `ticket_id` yang sudah ada  
When bot memproses pesan  
Then sistem menolak pembuatan tiket duplikat dan mengirim balasan yang sesuai.

### AC-03
Given pelapor mengirim pesan dengan format salah  
When bot memproses pesan  
Then sistem menolak laporan dan meminta format dikoreksi.

### AC-04
Given tiket berhasil dibuat dari Telegram  
When daftar antrean dibuka  
Then tiket muncul di task pool dengan status `tersedia`.

## Edge Cases
1. `ticket_id` tidak ditemukan.
2. `region` tidak valid.
3. `summary` kosong.
4. format pesan tidak lengkap.
5. pesan duplikat dikirim ulang.
6. bot gagal konek ke database.