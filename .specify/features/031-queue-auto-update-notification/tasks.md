# Tasks — Queue Auto Refresh with Polling

## Analysis
- [x] Review route, controller, model, view, role access, F029, dan F030.
- [x] Review binding modal F019 dan smooth action F027.

## Backend
- [x] Pertahankan `GET /reports/check-new`.
- [x] Validasi `since_id`.
- [x] Gunakan `COUNT(*)` dan `MAX(id)`.
- [x] Gunakan role access, region, dan search existing.
- [x] Tambahkan `GET /reports/queue-fragment`.
- [x] Gunakan query/filter/pagination yang sama dengan halaman penuh.
- [x] Jangan mengambil media, attachment, atau log pada check endpoint.

## View
- [x] Hapus tombol `Muat Sekarang`.
- [x] Tambahkan root auto-refresh dengan latest report ID.
- [x] Tambahkan target tab status.
- [x] Tambahkan target tabel/pagination.
- [x] Buat partial tabel antrean bersama.
- [x] Buat partial response fragment.

## JavaScript
- [x] Polling setiap 10 detik saat tab aktif.
- [x] Polling setiap 60 detik saat tab tersembunyi.
- [x] Gunakan `document.visibilityState`.
- [x] Bersihkan interval lama sebelum menjadwalkan interval baru.
- [x] Jalankan pengecekan langsung saat tab kembali visible.
- [x] Pastikan hanya satu polling interval aktif.
- [x] Fetch check endpoint tanpa reload halaman.
- [x] Fetch fragment dengan query aktif.
- [x] Replace hanya tab dan daftar/pagination.
- [x] Pertahankan scroll.
- [x] Tunda update saat modal terbuka.
- [x] Tunda update saat form aktif.
- [x] Tunda update saat quick action berjalan.
- [x] Jalankan pending update setelah modal ditutup/fokus form berakhir.
- [x] Re-bind quick action pada row baru.
- [x] Gunakan delegated binding untuk tombol detail.
- [x] Gagal update tidak menyebabkan crash.

## Regression Safety
- [x] Tidak mengubah database.
- [x] Tidak mengubah Telegram intake/parsing.
- [x] Tidak mengubah upload.
- [x] Tidak mengubah flow ticketing.
- [x] Tidak memakai WebSocket/SSE.
- [x] Tidak memakai library baru.
- [x] F029/F030 tetap memakai query existing.
- [x] F019/F027 tetap berfungsi pada fragment baru.

## Testing
- [x] Syntax Node dan JavaScript.
- [x] Kompilasi EJS.
- [x] Endpoint check-new kondisi positif dan nol.
- [x] Render fragment Eksekutor dan Koordinator.
- [x] Query fragment mempertahankan filter dan pagination.
- [x] Simulasi auto-update tanpa full reload.
- [x] Simulasi pending update saat modal/form aktif.
- [x] Simulasi scroll restore dan binding row baru.
