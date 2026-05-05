# Technical Plan — Telegram Text Enrichment / Additional Field Update

## Feature ID
F006C

## Feature Name
Telegram Text Enrichment / Additional Field Update

## Objective
Menambahkan kemampuan bot untuk memperkaya data tiket yang sudah ada berdasarkan pesan teks lanjutan dari pelapor.

## Existing Context
Sistem saat ini sudah memiliki:
- intake dasar Telegram untuk membuat tiket awal,
- feedback Telegram,
- media tambahan Telegram,
- task pool dan lifecycle tiket.

Masalah yang tersisa adalah enrichment data teks: tambahan field seperti `branch`, `sto`, atau `cluster` yang dikirim setelah tiket awal belum masuk optimal ke tabel `reports`.

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- node-telegram-bot-api

## Database Impact
Tidak ada perubahan database yang wajib.

### Existing Tables Used
- `reports`
- `report_logs`

## Files Likely Added or Changed

### Utility / Parser
- `utils/telegramParser.js`
- optional: `utils/telegramEnrichmentParser.js`

### Service
- `services/telegramBotService.js`

### Model
- `models/reportModel.js`

## Backend Design

### Message Type Classification
Bot harus dapat membedakan:
1. pesan laporan baru,
2. pesan tambahan teks untuk tiket lama,
3. pesan media tambahan.

### Enrichment Detection
Jika sebuah pesan teks mengandung:
- `TICKET ID: ...`
dan
- satu atau lebih pasangan `FIELD: VALUE`
yang sesuai dengan daftar field tambahan,
maka pesan diperlakukan sebagai enrichment.

### Field Mapping
Map input ke kolom `reports`:
- `BRANCH` -> `branch_name`
- `CLUSTER` -> `cluster_name`
- `STO` -> `sto`
- `PROVIDER` -> `provider`
- `SERVICE TYPE` -> `service_type`
- `SEGMENT` -> `segment`
- `TELKOM AREA` -> `telkom_area`
- `SERVICE ID` -> `service_id`
- `STATUS WFM` -> `status_wfm`
- `STATUS ANDALAS` -> `status_andalas`
- `WO NUMBER` -> `wo_number`
- `FALLOUT TYPE` -> `fallout_type`

### Update Strategy
For each mapped field:
- if DB value is null/empty -> update directly
- if DB value already exists and same -> no change, log optional
- if DB value already exists and different -> do not overwrite, record conflict in `report_logs`

### Logging
Use `report_logs` for:
- `telegram_text_enrichment_applied`
- `telegram_text_enrichment_no_change`
- `telegram_text_enrichment_conflict`
- `telegram_text_enrichment_failed`

Store:
- raw text
- parsed fields
- changed fields
- conflicting fields

### Telegram Feedback
Suggested feedback patterns:
- success update:
  - `Data tambahan berhasil diperbarui untuk tiket INF000404.`
- no change:
  - `Data tambahan diterima, tetapi tidak ada field baru yang berubah pada tiket INF000404.`
- conflict:
  - `Data tambahan diterima, tetapi beberapa field tidak diperbarui karena data tiket sudah terisi.`

## Validation Rules
1. `TICKET ID` wajib
2. minimal satu field enrichment valid wajib ada
3. field tanpa nilai diabaikan
4. unknown fields tidak menyebabkan tiket baru dibuat

## Testing Strategy
1. Add missing branch
2. Add missing STO and cluster
3. Send field already same
4. Send field with different existing value
5. Send enrichment for unknown ticket
6. Send text without TICKET ID

## Out of Scope
1. NLP parsing bebas
2. OCR attachment
3. overwrite otomatis dengan konflik nilai
4. core system integration