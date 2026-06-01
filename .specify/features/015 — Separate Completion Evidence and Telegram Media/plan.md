
---

# `plan.md`

```md
# Technical Plan — Separate Completion Evidence and Telegram Media

## Feature ID
F015

## Feature Name
Separate Completion Evidence and Telegram Media

## Objective
Memperbaiki pemisahan tampilan bukti penyelesaian Eksekutor dan media Telegram pada halaman detail penuh, terutama pada `views/reports/show.ejs`.

## Existing Context
Berdasarkan pengecekan kode:
- `report_attachments` digunakan untuk bukti penyelesaian dan media Telegram linked.
- Media Telegram linked memiliki source `telegram`.
- Modal detail sudah memfilter media Telegram dari attachments.
- Halaman detail penuh masih menampilkan semua attachments pada bagian Bukti Penyelesaian.
- Masalah utama berada pada rendering halaman detail penuh.

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5
- CommonJS

## Database Impact
Tidak ada perubahan database.

F015 tidak membutuhkan:
- ALTER TABLE
- migration
- tabel baru
- kolom baru
- perubahan data lama

## Files Likely Impacted

### Views
Prioritas:
- `views/reports/show.ejs`

Kemungkinan juga:
- `views/koordinator/reports/show.ejs`
- `views/reports/index.ejs`
- `views/partials/report-detail-modal.ejs`

### Models
Kemungkinan:
- `models/reportModel.js`

### Controllers
Kemungkinan:
- `controllers/reportController.js`

### Public JS
Kemungkinan:
- `public/js/app.js`

## Implementation Options

### Option A — Filter di View
Filter attachments langsung di EJS:
- completionEvidence = attachments.filter(item => item.source !== 'telegram')
- telegramAttachments = attachments.filter(item => item.source === 'telegram')

Kelebihan:
- cepat
- minim perubahan
- cocok jika data sudah tersedia di view

Kekurangan:
- logic filtering berada di view

### Option B — Filter di Controller
Controller memisahkan data sebelum render:
- completionAttachments
- telegramAttachments

Kelebihan:
- view lebih bersih
- logic lebih jelas

Kekurangan:
- perlu ubah controller

### Option C — Filter di Model
Model menyediakan method terpisah:
- getCompletionAttachmentsByReportId()
- getTelegramAttachmentsByReportId()

Kelebihan:
- paling rapi secara data access
- cocok untuk jangka panjang

Kekurangan:
- perubahan lebih banyak

## Recommended Approach
Gunakan Option B jika memungkinkan.

Controller memisahkan:
```js
const completionAttachments = attachments.filter(item => item.source !== 'telegram');
const telegramAttachments = attachments.filter(item => item.source === 'telegram');