# Feature Spec — File Upload Storage Strategy

## Feature ID
F024

## Feature Name
File Upload Storage Strategy

## Summary
Fitur ini merapikan strategi penyimpanan file upload agar sistem tidak mudah terbebani ketika jumlah file bertambah. Sistem harus membatasi ukuran file, tipe file, jumlah file, dan menyimpan file secara terstruktur. File tidak disimpan langsung ke database, melainkan disimpan pada folder upload, sedangkan database hanya menyimpan path dan metadata file.

## Business Background
Pembimbing lapangan memberikan catatan mengenai potensi beban backend jika terlalu banyak file diunggah ke sistem. Pada sistem ini, file dapat berasal dari media Telegram maupun bukti penyelesaian yang diunggah oleh Eksekutor atau Koordinator. Oleh karena itu, sistem perlu memiliki strategi penyimpanan file yang lebih aman dan terkontrol.

## Problem Statement
Jika file upload tidak dibatasi, backend dapat terbebani oleh file berukuran besar, tipe file tidak aman, atau jumlah file yang terlalu banyak. Selain itu, folder upload yang tidak terstruktur dapat menyulitkan pengelolaan file di masa depan.

## Goals
1. Membatasi ukuran file upload.
2. Membatasi tipe file yang diperbolehkan.
3. Membatasi jumlah file yang dapat diunggah dalam satu proses.
4. Menyimpan file pada folder yang terstruktur.
5. Menjaga database hanya menyimpan metadata/path file.
6. Memberikan pesan error yang jelas jika file tidak valid.
7. Menjaga upload bukti penyelesaian tetap berjalan.
8. Menjaga media Telegram tetap berjalan.
9. Menjelaskan bahwa untuk produksi skala besar dapat menggunakan object storage/cloud storage.

## Non-Goals
1. Tidak mengubah database.
2. Tidak menyimpan file binary langsung ke database.
3. Tidak membuat integrasi cloud storage pada F024.
4. Tidak membuat fitur kompresi gambar otomatis.
5. Tidak membuat fitur hapus file massal.
6. Tidak mengubah Telegram intake.
7. Tidak mengubah parsing Telegram.
8. Tidak mengubah F017 laporan manual.
9. Tidak mengubah F018 akses Koordinator.
10. Tidak mengubah F019 modal tab.
11. Tidak mengubah F021 UI button cleanup.
12. Tidak mengubah F022 wording return.
13. Tidak mengubah F023 validasi catatan/bukti/DIIT.

## Actors
- Eksekutor
- Koordinator
- Sistem Telegram Bot
- Super Admin sebagai pengelola sistem

## Existing File Sources
File pada sistem dapat berasal dari:
1. Media Telegram dari pelapor.
2. Bukti penyelesaian yang diunggah Eksekutor.
3. Bukti penyelesaian yang diunggah Koordinator.
4. Screenshot yang dipaste melalui fitur F016.

## Storage Rules

### File Storage
File disimpan di folder upload lokal, misalnya:

```text
public/uploads/