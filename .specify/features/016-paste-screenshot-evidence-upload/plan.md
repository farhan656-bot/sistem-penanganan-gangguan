
---

# `plan.md`

```md
# Technical Plan — Paste Screenshot Evidence Upload

## Feature ID
F016

## Feature Name
Paste Screenshot Evidence Upload

## Objective
Menambahkan kemampuan paste screenshot langsung ke form penyelesaian tiket agar Eksekutor dapat melampirkan bukti penyelesaian tanpa harus mencari file dari folder.

## Existing Context
Sistem saat ini sudah memiliki:
- form penyelesaian tiket
- upload bukti penyelesaian
- validasi file upload
- penyimpanan attachment ke `report_attachments`
- pemisahan bukti penyelesaian dan media Telegram dari F015
- EJS views
- Bootstrap 5
- JavaScript frontend di `public/js/app.js`
- Node.js, Express.js, multer, MySQL, mysql2/promise
- struktur MVC

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5
- multer
- CommonJS
- Vanilla JavaScript

## Database Impact
Tidak ada perubahan database.

F016 tidak membutuhkan:
- ALTER TABLE
- migration
- tabel baru
- kolom baru

## Files Likely Impacted

### Views
Periksa form penyelesaian tiket:
- `views/eksekutor/reports/index.ejs`
- `views/reports/show.ejs`
- `views/reports/index.ejs`
- atau partial form penyelesaian jika ada.

### Public JS
Kemungkinan utama:
- `public/js/app.js`

Atau buat file baru jika struktur project mendukung:
- `public/js/evidence-paste-upload.js`

### Controllers
Tidak perlu berubah jika file hasil paste masuk ke input file yang sama.
Kemungkinan terdampak jika nama input berbeda:
- `controllers/reportController.js`

### Routes
Tidak perlu berubah jika upload tetap menggunakan route lama.

### Models
Tidak perlu berubah jika penyimpanan tetap memakai flow upload lama.

## Implementation Approach

Gunakan pendekatan frontend:

1. Tambahkan area paste pada form penyelesaian.
2. Dengarkan event `paste` pada area tersebut.
3. Ambil item clipboard bertipe image.
4. Ubah item menjadi File.
5. Gunakan DataTransfer untuk memasukkan File ke input file upload bukti.
6. Tampilkan preview gambar.
7. Saat form disubmit, backend menerima file seperti upload manual biasa.

## Recommended Technical Flow

```js
pasteArea.addEventListener('paste', function (event) {
  const items = event.clipboardData.items;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      const file = new File([blob], 'screenshot-evidence.png', { type: blob.type });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      showPreview(file);
      break;
    }
  }
});