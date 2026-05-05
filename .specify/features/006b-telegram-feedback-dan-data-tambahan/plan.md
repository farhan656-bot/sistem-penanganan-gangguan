# Technical Plan — Telegram Feedback dan Data Tambahan

## Feature ID
F006B

## Feature Name
Telegram Feedback dan Data Tambahan

## Objective
Melengkapi integrasi Telegram dengan menambahkan feedback operasional dari aksi dashboard dan dukungan penggabungan data tambahan ke tiket yang sudah ada.

## Existing Context
Sistem saat ini sudah memiliki:
- intake dasar Telegram (F006A),
- lifecycle tiket,
- ambil tugas,
- penyelesaian tiket,
- assignment dan delegasi.

Data penting yang sudah tersedia:
- `reports.telegram_chat_id`
- `reports.telegram_message_id`
- `reports.ticket_id`

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- node-telegram-bot-api

## Database Impact
Tidak ada perubahan database yang wajib jika menggunakan log/attachment yang sudah ada.
Namun, untuk implementasi yang lebih rapi, dapat dipertimbangkan tabel tambahan seperti:
- `report_additional_data`
- atau `telegram_message_logs`

Jika ingin menjaga perubahan minimal, data tambahan bisa dicatat ke log terlebih dahulu.

## Files Likely Added or Changed

### New / Extended Service Files
- `services/telegramBotService.js`
- optional: `services/telegramFeedbackService.js`

### New / Extended Utility Files
- `utils/telegramParser.js`
- optional: `utils/telegramAdditionalDataParser.js`

### Changed Models
- `models/reportModel.js`

### Changed Controllers
- `controllers/reportController.js`

### Optional Changed Routes
- tidak wajib, kecuali jika ingin endpoint manual trigger

## Backend Design

### Feedback from Web Actions
Feedback Telegram dipicu dari hasil aksi berikut:
1. `takeReport()` → kirim assigned
2. aksi in-progress → kirim sedang dikerjakan
3. `completeReport()` → kirim selesai

### Safety Rule
Kirim feedback Telegram dilakukan setelah transaksi utama sukses.
Jika feedback gagal:
- transaksi utama tidak rollback,
- error dicatat ke log.

### Additional Data Flow
1. bot menerima pesan baru
2. parser cek apakah ini format tiket baru atau data tambahan
3. jika ticket ID sudah ada dan pola menunjukkan tambahan:
   - cari tiket berdasarkan `ticket_id`
   - simpan tambahan sebagai log / storage tambahan
   - balas “Data Tambahan Diterima! Otomatis disatukan ke tiket: <ticket_id>”

### Suggested Minimal Storage for Additional Data
Pilihan A:
- simpan ke `report_logs` sebagai `additional_telegram_data`

Pilihan B:
- buat tabel `report_additional_data`

Untuk perubahan minimal, gunakan Pilihan A dulu.

### Attachment/Photo Baseline
Jika pesan media datang:
- minimal simpan metadata Telegram file identifier dan caption
- hubungkan ke tiket jika ticket ID ditemukan
- tahap download file penuh bisa ditambahkan nanti

## Validation Rules
1. assigned feedback hanya untuk tiket dengan `telegram_chat_id`
2. completed feedback hanya dikirim jika tiket punya `telegram_chat_id`
3. additional data wajib punya `ticket_id`
4. ticket ID tambahan harus ditemukan di `reports`

## Logging Rules
Catat:
- `telegram_feedback_assigned`
- `telegram_feedback_in_progress`
- `telegram_feedback_completed`
- `telegram_additional_data_received`
- `telegram_feedback_failed`

## Testing Strategy
1. Ambil tiket dari dashboard → cek feedback Telegram
2. Trigger status in-progress → cek feedback Telegram
3. Selesaikan tiket → cek feedback Telegram
4. Kirim data tambahan → cek merge response
5. Kirim data tambahan untuk ticket ID salah → cek error response

## Out of Scope
1. OCR foto
2. parsing bebas berbasis NLP
3. grup Telegram
4. webhook deployment