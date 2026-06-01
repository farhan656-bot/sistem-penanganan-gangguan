# Feature Spec — Paste Screenshot Evidence Upload

## Feature ID
F016

## Feature Name
Paste Screenshot Evidence Upload

## Summary
Fitur ini menambahkan kemampuan paste screenshot langsung ke form penyelesaian tiket. Dengan fitur ini, Eksekutor dapat mengambil screenshot, membuka form penyelesaian tiket, lalu menekan Ctrl + V agar screenshot otomatis masuk sebagai bukti penyelesaian. Fitur ini bertujuan memudahkan Eksekutor agar tidak perlu menyimpan screenshot terlebih dahulu dan mencari file secara manual dari folder.

## Business Background
Dalam proses penyelesaian tiket, Eksekutor sering perlu melampirkan bukti hasil pengerjaan. Jika bukti berupa screenshot, proses manual seperti menyimpan gambar ke folder lalu memilih file dapat memperlambat pekerjaan. Karena itu, sistem perlu mendukung paste screenshot langsung dari clipboard ke area upload bukti penyelesaian.

## Problem Statement
Saat ini Eksekutor harus mencari file bukti penyelesaian secara manual dari folder. Cara ini kurang praktis, terutama jika bukti berasal dari screenshot. Sistem perlu menyediakan cara yang lebih cepat agar screenshot dapat langsung ditempel ke form penyelesaian tiket.

## Goals
1. Memungkinkan Eksekutor paste screenshot langsung ke form penyelesaian tiket.
2. Menjadikan screenshot dari clipboard sebagai file bukti penyelesaian.
3. Menampilkan preview screenshot sebelum submit.
4. Tetap mendukung upload manual melalui file input.
5. Memastikan bukti hasil paste tetap masuk sebagai bukti penyelesaian Eksekutor.
6. Menjaga pemisahan bukti penyelesaian dan media Telegram dari F015.
7. Tidak mengubah flow Telegram intake.
8. Tidak mengubah struktur database.

## Non-Goals
1. Tidak mengubah struktur tabel database.
2. Tidak mengubah pemisahan bukti penyelesaian dan media Telegram dari F015.
3. Tidak mengubah Telegram bot intake.
4. Tidak mengubah media Telegram.
5. Tidak mengubah Region Switch F007.
6. Tidak mengubah dashboard KPI.
7. Tidak mengubah flow eskalasi DIIT F014.
8. Tidak mengubah feedback return evidence F013.
9. Tidak mengubah catatan opsional F012.
10. Tidak mengganti framework frontend.

## Actors

### Primary Actor
- Eksekutor

### Secondary Actors
- Koordinator
- Supervisor
- Super Admin

## Preconditions
1. Eksekutor sudah login.
2. Eksekutor membuka form penyelesaian tiket.
3. Browser mendukung Clipboard API atau paste event untuk file image.
4. Sistem sudah memiliki upload bukti penyelesaian.
5. Sistem sudah memiliki validasi tipe file dan ukuran file.
6. Sistem sudah memisahkan bukti penyelesaian dan media Telegram melalui F015.

## Postconditions

### Jika berhasil
1. Eksekutor dapat paste screenshot ke form penyelesaian.
2. Screenshot masuk sebagai file bukti penyelesaian.
3. Preview screenshot tampil sebelum submit.
4. File hasil paste ikut terkirim saat form disubmit.
5. Bukti tampil pada bagian Bukti Penyelesaian setelah tiket diproses.
6. Media Telegram tetap tidak tercampur dengan bukti penyelesaian.

### Jika gagal
1. Screenshot tidak masuk ke form.
2. Preview tidak tampil.
3. File hasil paste tidak ikut terkirim saat submit.
4. Bukti hasil paste tidak tersimpan.
5. Upload manual ikut rusak.
6. Bukti penyelesaian kembali tercampur dengan media Telegram.

## Functional Requirements

### FR-01 — Paste Area
Form penyelesaian harus memiliki area yang dapat menerima paste screenshot.

### FR-02 — Clipboard Image Detection
Sistem harus mendeteksi file image dari clipboard ketika pengguna menekan Ctrl + V.

### FR-03 — Convert Pasted Image to Upload File
Screenshot yang dipaste harus dimasukkan ke file input atau data upload yang akan dikirim bersama form.

### FR-04 — Preview Pasted Image
Sistem harus menampilkan preview screenshot yang berhasil dipaste.

### FR-05 — Manual Upload Still Works
Upload manual melalui file input harus tetap berjalan seperti sebelumnya.

### FR-06 — Replace or Add Behavior
Jika sistem hanya mendukung satu bukti, screenshot paste dapat menggantikan file sebelumnya.
Jika sistem mendukung banyak bukti, screenshot paste dapat ditambahkan ke daftar file.

### FR-07 — Validate Image Type
File hasil paste harus divalidasi sebagai image yang diperbolehkan, seperti JPG, JPEG, PNG, atau WEBP sesuai aturan lama.

### FR-08 — Validate File Size
File hasil paste harus mengikuti batas ukuran file yang sudah berlaku pada sistem.

### FR-09 — Submit With Completion Form
File hasil paste harus terkirim ketika form penyelesaian disubmit.

### FR-10 — Evidence Source Safety
File hasil paste harus diperlakukan sebagai bukti penyelesaian Eksekutor, bukan media Telegram.

### FR-11 — Preserve F015 Separation
Bukti hasil paste harus tampil di bagian Bukti Penyelesaian, tidak di bagian Media Telegram.

### FR-12 — No Database Change
F016 tidak boleh mengubah struktur database.

## Business Rules
1. Paste screenshot hanya digunakan untuk bukti penyelesaian tiket.
2. Screenshot hasil paste dianggap sebagai bukti dari Eksekutor.
3. Screenshot tidak boleh dianggap sebagai media Telegram.
4. Upload manual tetap tersedia sebagai alternatif.
5. Jika tidak ada gambar di clipboard, sistem menampilkan pesan ringan atau tidak melakukan apa-apa.
6. Validasi backend tetap menjadi validasi utama.
7. Frontend hanya membantu pengalaman pengguna.
8. Supervisor tetap read-only.
9. Telegram bot tidak terdampak.

## UI Requirements
1. Tambahkan area upload/paste yang mudah dipahami.
2. Area dapat berisi instruksi seperti:
   > Klik area ini lalu tekan Ctrl + V untuk menempel screenshot.
3. Preview gambar tampil setelah screenshot dipaste.
4. Tampilkan nama file otomatis, misalnya `screenshot-evidence.png`.
5. Berikan tombol hapus preview jika memungkinkan.
6. Upload manual tetap terlihat.
7. Tampilan tetap menggunakan Bootstrap 5.
8. Jangan membuat layout form menjadi terlalu rumit.

## Suggested Wording

Gunakan label:

```text
Bukti Penyelesaian