# Feature Spec — Telegram Text Enrichment / Additional Field Update

## Feature ID
F006C

## Feature Name
Telegram Text Enrichment / Additional Field Update

## Summary
Fitur ini memungkinkan Bot Telegram menerima pesan teks lanjutan yang berisi tambahan informasi untuk tiket yang sudah ada, lalu memperbarui data tiket tersebut secara terstruktur tanpa membuat tiket baru.

## Business Background
Hasil catatan lapangan menunjukkan bahwa laporan gangguan di Telegram tidak selalu dikirim lengkap dalam satu pesan. Ada laporan inti yang ringkas, ada laporan panjang dan semi-terstruktur, dan ada informasi lanjutan yang dikirim setelah tiket awal dibuat. Sistem seharusnya mencatat `ticket_id`, lalu menerima dan menyatukan informasi lanjutan tersebut ke tiket yang sama. Hal ini juga sejalan dengan pola bot yang sudah mendukung "Data Tambahan Diterima! Otomatis disatukan ke tiket ...". :contentReference[oaicite:1]{index=1}

## Problem Statement
Saat ini sistem sudah bisa membuat tiket dari laporan awal dan menerima media tambahan, tetapi belum optimal dalam menangani tambahan data teks untuk melengkapi field laporan yang sebelumnya kosong. Akibatnya:
- field seperti `branch`, `sto`, atau `cluster` yang dikirim belakangan belum otomatis masuk ke tiket,
- pesan tambahan berisiko hanya menjadi log, bukan pembaruan data,
- pelapor harus mengirim ulang laporan lengkap walaupun hanya ingin menambahkan satu field.

## Goals
1. Menerima pesan tambahan teks untuk tiket yang sudah ada.
2. Mengenali `TICKET ID` sebagai kunci pengaitan.
3. Memetakan field tambahan ke kolom `reports` yang sesuai.
4. Memperbarui field laporan secara aman tanpa membuat tiket baru.
5. Menyimpan jejak perubahan dan raw text tambahan.
6. Mengirim feedback bahwa data tambahan berhasil diterapkan atau dicatat.

## Non-Goals
1. Tidak membangun NLP/AI parsing bebas.
2. Tidak memproses OCR dari gambar.
3. Tidak mengubah logika media Telegram yang sudah ada.
4. Tidak mengintegrasikan ke core system Telkom.

## Actors

### Primary Actor
- Pelapor

### Secondary Actors
- Sistem Bot Telegram
- Koordinator
- Pegawai Eksekutor

## Preconditions
1. F006A intake dasar sudah berjalan.
2. F006B media tambahan sudah berjalan.
3. Tiket awal sudah tersimpan di tabel `reports`.
4. Bot Telegram aktif dan dapat menerima pesan teks.
5. `ticket_id` pada tiket yang akan diperkaya sudah ada di database.

## Postconditions

### Jika berhasil
1. Field tiket yang relevan diperbarui.
2. Pesan tambahan tidak membuat tiket baru.
3. Perubahan tercatat pada log.
4. Bot mengirim balasan konfirmasi pembaruan data.

### Jika gagal
1. Tiket tidak berubah.
2. Tidak ada tiket baru yang dibuat.
3. Bot mengirim balasan error yang aman dan jelas.

## Functional Requirements

### FR-01 — Tambahan Data untuk Tiket yang Sudah Ada
Sistem harus menerima pesan tambahan teks yang merujuk ke tiket yang sudah ada menggunakan `TICKET ID`.

### FR-02 — Tidak Membuat Tiket Baru
Jika `ticket_id` pada pesan tambahan sudah ada di database, sistem tidak boleh membuat tiket baru.

### FR-03 — Parsing Tambahan Data Berbasis Aturan
Sistem harus melakukan parsing berbasis aturan terhadap pasangan `FIELD: VALUE`.

### FR-04 — Field Tambahan yang Didukung
Minimal sistem harus mendukung field tambahan berikut:
- `BRANCH` → `branch_name`
- `CLUSTER` → `cluster_name`
- `STO` → `sto`
- `PROVIDER` → `provider`
- `SERVICE TYPE` → `service_type`
- `SEGMENT` → `segment`
- `TELKOM AREA` → `telkom_area`
- `SERVICE ID` → `service_id`
- `STATUS WFM` → `status_wfm`
- `STATUS ANDALAS` → `status_andalas`
- `WO NUMBER` → `wo_number`
- `FALLOUT TYPE` → `fallout_type`

### FR-05 — Update Field Kosong
Jika field pada `reports` masih kosong/null, sistem harus mengisi field tersebut dari pesan tambahan.

### FR-06 — Konflik Nilai
Jika field pada `reports` sudah terisi dan pesan tambahan mengirim nilai berbeda, sistem tidak boleh meng-overwrite diam-diam. Sistem harus mencatat konflik ke log dan memberi feedback yang sesuai.

### FR-07 — Nilai Sama
Jika nilai yang dikirim sama dengan yang sudah ada di database, sistem tidak perlu memperbarui field, tetapi tetap boleh mencatatnya di log.

### FR-08 — Raw Text Additional Data
Sistem harus menyimpan raw text tambahan atau ringkasan tambahan data ke log untuk kebutuhan audit.

### FR-09 — Feedback ke Telegram
Setelah proses enrichment selesai, bot harus mengirim balasan, misalnya:
- data tambahan berhasil diperbarui,
- data dicatat namun tidak ada field baru yang berubah,
- terdapat konflik nilai yang perlu ditinjau.

### FR-10 — Validasi Ticket ID
Jika `ticket_id` tidak ditemukan, sistem harus menolak enrichment dan memberi balasan error.

## Business Rules
1. Pesan tambahan harus memuat `TICKET ID`.
2. Pesan tambahan dianggap sebagai enrichment, bukan tiket baru.
3. Update otomatis diprioritaskan untuk field yang masih kosong.
4. Overwrite otomatis terhadap field yang sudah terisi dengan nilai berbeda tidak diperbolehkan.
5. Seluruh pesan tambahan penting harus tercatat di log.
6. Format input tambahan tetap berbasis aturan, bukan NLP/AI. :contentReference[oaicite:2]{index=2}

## Data Requirements

### Main Table
- `reports`

### Supporting Table
- `report_logs`

### Important Existing Fields in `reports`
- `ticket_id`
- `fallout_type`
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

## Acceptance Criteria

### AC-01
Given tiket `INF000404` sudah ada  
When pelapor mengirim:
`TICKET ID: INF000404`
`BRANCH: BUKITTINGGI`  
Then sistem memperbarui `branch_name` tiket tersebut jika masih kosong.

### AC-02
Given tiket sudah ada  
When pelapor mengirim field tambahan lain seperti `STO`, `CLUSTER`, atau `PROVIDER`  
Then sistem memperbarui field yang masih kosong tanpa membuat tiket baru.

### AC-03
Given tiket sudah ada dan field target sudah memiliki nilai berbeda  
When pelapor mengirim nilai baru  
Then sistem tidak meng-overwrite diam-diam, tetapi mencatat konflik ke log.

### AC-04
Given `ticket_id` tidak ditemukan  
When pelapor mengirim pesan tambahan  
Then sistem menolak dan mengirim balasan bahwa tiket tidak ditemukan.

### AC-05
Given pelapor mengirim pesan tambahan yang valid  
When enrichment berhasil  
Then bot mengirim balasan bahwa data tambahan berhasil diterapkan atau dicatat.

## Edge Cases
1. Pesan tambahan tanpa `TICKET ID`
2. `TICKET ID` tidak ditemukan
3. Nama field tidak didukung
4. Nilai field kosong
5. Pesan sangat panjang dengan campuran field yang didukung dan tidak didukung
6. Semua field yang dikirim sudah sama dengan isi database