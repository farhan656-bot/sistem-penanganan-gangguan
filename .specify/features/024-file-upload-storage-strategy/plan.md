
---

# `plan.md`

```md
# Technical Plan — File Upload Storage Strategy

## Feature ID
F024

## Feature Name
File Upload Storage Strategy

## Objective
Merapikan strategi upload file agar backend tidak terbebani dengan membatasi ukuran file, tipe file, jumlah file, dan memastikan file disimpan sebagai file fisik di folder upload, bukan sebagai binary di database.

## Existing Context
Sistem saat ini sudah memiliki:
- Upload bukti penyelesaian
- Paste screenshot evidence F016
- Media Telegram
- Pemisahan Media Telegram dan Bukti Penyelesaian F015
- Modal tab Media Telegram dan Bukti Penyelesaian F019
- Express.js
- Multer
- MySQL
- EJS
- Bootstrap 5

## Important Boundary
F024 hanya mengatur strategi upload dan validasi file.

Jangan ubah:
- database
- Telegram intake logic
- Telegram parsing
- F017 manual report
- F018 coordinator access
- F019 modal tabs
- F021 button cleanup
- F022 wording return
- F023 validation notes/evidence/DIIT

## Database Impact
Tidak ada perubahan database pada F024.

Database tetap hanya menyimpan:
- path file
- original filename jika sudah ada
- mime type jika sudah ada
- source jika sudah ada
- report_id
- uploaded_by jika sudah ada

Jangan simpan file binary di database.

## Files Likely Impacted
Kemungkinan file yang diubah:

```text
middlewares/uploadMiddleware.js
config/upload.js
controllers/reportController.js
routes/reportRoutes.js
services/telegramMediaService.js
public/js/app.js