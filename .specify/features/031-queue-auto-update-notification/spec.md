# Feature Spec — Queue Auto Refresh with Polling

## Feature ID
F031

## Feature Name
Queue Auto Refresh with Polling

## Summary
Fitur ini memperbarui daftar antrean kerja secara otomatis ketika laporan Telegram baru terdeteksi. Browser melakukan polling adaptif setiap 10 detik saat tab aktif dan 60 detik saat tab tersembunyi, lalu mengambil fragment HTML terbaru dan mengganti hanya area tab status, tabel, empty state, dan pagination.

## Goals
1. Mengecek laporan Telegram baru setiap 10 detik saat tab aktif.
2. Mengurangi polling menjadi 60 detik saat tab tersembunyi.
3. Melakukan pengecekan langsung saat tab kembali aktif.
4. Memperbarui antrean otomatis tanpa aksi manual pengguna.
5. Tidak melakukan reload seluruh halaman.
6. Mempertahankan filter `work_status`, region, search/keyword, page, dan `per_page`.
7. Mempertahankan posisi scroll.
8. Menunda update saat modal detail terbuka atau pengguna sedang berinteraksi dengan form.
9. Menjalankan pending update setelah interaksi selesai.
10. Menjaga role access, F029, F030, F019, dan F027.

## Non-Goals
1. Tidak menggunakan WebSocket.
2. Tidak menggunakan SSE.
3. Tidak membuat real-time dashboard penuh.
4. Tidak mengubah database.
5. Tidak mengubah Telegram intake atau parsing.
6. Tidak mengubah upload atau flow ticketing.
7. Tidak mengubah F017 sampai F030.
8. Tidak menggunakan library baru.

## Actors
- Eksekutor
- Koordinator
- Supervisor
- Super Admin

## Functional Requirements

### FR-01 — Polling Interval
Polling berjalan setiap 10 detik saat `document.visibilityState === 'visible'` dan setiap 60 detik saat tab tersembunyi. Saat tab kembali visible, sistem menjadwalkan ulang satu timer dan langsung menjalankan pengecekan.

### FR-02 — Lightweight Check
Endpoint `GET /reports/check-new` menggunakan `COUNT(*)` dan `MAX(id)` untuk mendeteksi laporan Telegram baru sesuai akses role dan filter wilayah/pencarian.

### FR-03 — Fragment Update
Jika laporan baru tersedia, frontend memanggil `GET /reports/queue-fragment` dengan query aktif dan mengganti hanya tab status serta area daftar/pagination.

### FR-04 — Preserve State
Fragment request mempertahankan:
- `work_status`
- `region`
- `search` atau `keyword`
- `page`
- `per_page`

### FR-05 — No Full Reload
Polling tidak boleh memanggil reload atau navigasi halaman penuh.

### FR-06 — Interaction Safety
Jika modal terbuka, form sedang aktif, atau aksi cepat sedang diproses, update ditunda. Pending update dijalankan kembali setelah modal ditutup atau fokus form berakhir.

### FR-07 — Scroll Safety
Sistem menyimpan `scrollY` sebelum penggantian fragment dan mengembalikannya setelah update.

### FR-08 — Passive Feedback
Setelah update berhasil, sistem boleh menampilkan feedback kecil yang hilang otomatis dan tidak memerlukan tindakan pengguna.
