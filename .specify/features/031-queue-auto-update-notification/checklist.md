# Checklist — Queue Auto Refresh with Polling

## Polling
- [x] Interval aktif 10 detik.
- [x] Interval tab tersembunyi 60 detik.
- [x] Pengecekan langsung saat tab kembali visible.
- [x] Interval lama dibersihkan sebelum interval baru dibuat.
- [x] Tidak ada multiple polling interval.
- [x] Tidak memakai WebSocket.
- [x] Tidak memakai SSE.
- [x] Tidak memakai library baru.
- [x] Tidak melakukan full page reload.

## Endpoint
- [x] `/reports/check-new` tersedia dan wajib login.
- [x] Check endpoint ringan dengan `COUNT(*)` dan `MAX(id)`.
- [x] `/reports/queue-fragment` tersedia dan wajib login.
- [x] Fragment memakai role access existing.
- [x] Fragment memakai filter dan pagination existing.

## Auto Refresh
- [x] Tidak ada tombol `Muat Sekarang`.
- [x] Tab count diperbarui.
- [x] Tabel dan empty state diperbarui.
- [x] Pagination diperbarui.
- [x] Filter form tidak diganti.
- [x] Posisi scroll dipulihkan.
- [x] Feedback update bersifat pasif.

## Interaction Safety
- [x] Modal detail tidak ditutup paksa.
- [x] Update ditunda saat modal terbuka.
- [x] Update ditunda saat form aktif.
- [x] Update ditunda saat quick action berjalan.
- [x] Pending update berjalan setelah interaksi selesai.

## Filter Preservation
- [x] `work_status` dipertahankan.
- [x] region dipertahankan.
- [x] search/keyword dipertahankan.
- [x] page dipertahankan.
- [x] `per_page` dipertahankan.

## Regression
- [x] F019 modal detail tetap berfungsi.
- [x] F027 smooth action tetap berfungsi.
- [x] F029 status tab tetap berfungsi.
- [x] F030 pagination tetap berfungsi.
- [x] Database tidak berubah.
- [x] Telegram intake/parsing tidak berubah.
- [x] Upload dan flow ticketing tidak berubah.
