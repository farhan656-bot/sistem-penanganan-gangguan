# Technical Plan — Queue Auto Refresh with Polling

## Feature ID
F031

## Objective
Memperbarui tab count, tabel antrean, empty state, dan pagination secara otomatis melalui polling ringan tanpa reload seluruh halaman.

## Technical Boundaries
- Express, EJS, Bootstrap 5, MySQL, dan vanilla JavaScript.
- Tidak menggunakan WebSocket, SSE, ORM, atau library baru.
- Tidak mengubah database, Telegram intake/parsing, upload, atau flow ticketing.
- Mempertahankan F017 sampai F030.

## Backend

### `GET /reports/check-new`
- Wajib login dan memakai role middleware existing.
- Menerima `since_id`, region, dan search/keyword.
- Menggunakan scope akses daftar antrean.
- Query hanya memakai `COUNT(*)` dan `MAX(id)`.
- Hanya mendeteksi laporan dengan `source_channel = 'telegram'`.

### `GET /reports/queue-fragment`
- Wajib login dan memakai role middleware existing.
- Menggunakan fungsi penyusun data daftar yang sama dengan halaman penuh.
- Menerima `work_status`, region, search/keyword, page, dan `per_page`.
- Mengembalikan HTML untuk tab status dan daftar/pagination.

## View
- Gunakan partial bersama untuk tabel antrean dan pagination.
- Sediakan target terpisah untuk tab status dan daftar agar form filter tidak diganti.
- Simpan URL endpoint, latest report ID, dan interval polling pada data attribute.

## Frontend Flow
1. Halaman menyimpan latest Telegram report ID yang dapat diakses.
2. Scheduler membuat satu interval 10 detik saat tab visible atau 60 detik saat tab hidden.
3. Setiap perubahan visibility membersihkan interval lama sebelum membuat interval baru.
4. Saat tab kembali visible, sistem langsung menjalankan pengecekan.
5. Jika `check-new` menemukan laporan baru, tandai update sebagai pending.
6. Jika modal/form/aksi cepat aktif, tunda update.
7. Jika aman, fetch `queue-fragment` dengan query aktif.
8. Parse HTML fragment.
9. Simpan posisi scroll.
10. Ganti tab target dan list target.
11. Bind ulang form aksi cepat pada row baru.
12. Pulihkan posisi scroll dan tampilkan feedback pasif.
13. Jika request gagal, pertahankan pending update dan coba lagi pada interval berikutnya.

## Regression Strategy
- Detail modal memakai delegated click binding agar tombol hasil fragment tetap berfungsi.
- Smooth action tetap memakai handler existing dan hanya di-bind ulang untuk form baru.
- Filter form tidak diganti oleh fragment.
- Modal tidak pernah ditutup oleh polling.
