
---

# `tasks.md`

```md
# Tasks — Paste Screenshot Evidence Upload

## Feature ID
F016

## Analysis
- [ ] Review form penyelesaian tiket
- [ ] Review input file bukti penyelesaian
- [ ] Review controller upload bukti penyelesaian
- [ ] Review route penyelesaian tiket
- [ ] Review multer configuration
- [ ] Review `public/js/app.js`
- [ ] Review hasil F015
- [ ] Pastikan F016 hanya menambah UX paste screenshot

## Search References
- [ ] Cari `Bukti Penyelesaian`
- [ ] Cari `input type="file"`
- [ ] Cari `completion`
- [ ] Cari `evidence`
- [ ] Cari `attachment`
- [ ] Cari `multer`
- [ ] Cari `report_attachments`
- [ ] Cari form submit penyelesaian
- [ ] Cari JS yang menangani file upload

## UI Update
- [ ] Tambahkan area paste screenshot di form penyelesaian
- [ ] Tambahkan helper text upload/paste
- [ ] Tambahkan area preview screenshot
- [ ] Tambahkan status message kecil
- [ ] Pastikan upload manual tetap tampil
- [ ] Pastikan form tetap rapi
- [ ] Jangan ubah layout besar

## Paste Event Handler
- [ ] Tambahkan listener paste pada area paste
- [ ] Ambil clipboardData dari event paste
- [ ] Deteksi item bertipe image
- [ ] Ambil blob/file dari clipboard
- [ ] Buat File dengan nama default `screenshot-evidence.png`
- [ ] Gunakan DataTransfer untuk mengisi file input
- [ ] Tampilkan preview gambar
- [ ] Tampilkan pesan sukses
- [ ] Jika clipboard bukan gambar, tampilkan pesan ringan atau abaikan

## Manual Upload Preservation
- [ ] Jika user pilih file manual, preview tampil
- [ ] Jika user paste screenshot, file input terisi
- [ ] Jika user pilih manual setelah paste, file manual tetap bisa digunakan
- [ ] Jika user paste setelah manual, tentukan perilaku menggantikan file lama
- [ ] Upload manual tidak boleh rusak

## Validation
- [ ] Validasi tipe file image di frontend jika memungkinkan
- [ ] Validasi ukuran file di frontend jika memungkinkan
- [ ] Backend tetap validasi utama
- [ ] Jangan longgarkan validasi backend
- [ ] Pastikan file terlalu besar tetap ditolak sesuai aturan lama

## Backend Safety
- [ ] Jangan ubah controller jika input file tetap sama
- [ ] Jika controller harus diubah, hanya sesuaikan nama field file
- [ ] Jangan ubah route jika tidak perlu
- [ ] Jangan ubah model jika tidak perlu
- [ ] Jangan ubah struktur database
- [ ] Pastikan file paste tersimpan sebagai bukti penyelesaian

## Evidence Separation Safety
- [ ] Bukti hasil paste masuk ke Bukti Penyelesaian
- [ ] Bukti hasil paste tidak masuk ke Media Telegram
- [ ] Source file bukan `telegram`
- [ ] F015 tetap berjalan
- [ ] Halaman detail penuh tetap memisahkan bukti dan media
- [ ] Detail modal tetap memisahkan bukti dan media

## Regression Safety
- [ ] Jangan ubah flow selesai F012
- [ ] Jangan ubah return evidence F013
- [ ] Jangan ubah eskalasi DIIT F014
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah pending media
- [ ] Jangan ubah text enrichment
- [ ] Jangan ubah Region Switch F007
- [ ] Jangan ubah KPI Supervisor
- [ ] Jangan ubah RBAC middleware

## Functional Testing
- [ ] Login sebagai Eksekutor
- [ ] Ambil tiket
- [ ] Buka form penyelesaian
- [ ] Screenshot layar
- [ ] Klik area paste
- [ ] Tekan Ctrl + V
- [ ] Pastikan preview tampil
- [ ] Submit penyelesaian
- [ ] Pastikan berhasil
- [ ] Buka detail penuh
- [ ] Pastikan screenshot tampil di Bukti Penyelesaian
- [ ] Pastikan screenshot tidak tampil di Media Telegram
- [ ] Test upload manual
- [ ] Test paste teks biasa
- [ ] Test status `perlu_tindak_lanjut`
- [ ] Test status `eskalasi` dengan kode DIIT
- [ ] Test detail modal
- [ ] Test media Telegram tetap terpisah

## Documentation
- [ ] Screenshot area paste screenshot
- [ ] Screenshot preview setelah Ctrl + V
- [ ] Screenshot bukti tersimpan di Bukti Penyelesaian
- [ ] Screenshot Media Telegram tetap terpisah
- [ ] Catat file yang berubah
- [ ] Catat hasil testing manual