# Feature Spec — Telegram Media Popup Tabs

## Feature ID
F019

## Feature Name
Telegram Media Popup Tabs

## Summary
Fitur ini memperbaiki tampilan media Telegram agar tidak memenuhi halaman utama atau halaman detail penuh. Media Telegram akan dipindahkan ke dalam popup/modal detail laporan dan ditempatkan pada tab khusus. Dengan demikian, pengguna tetap dapat melihat media dari pelapor ketika dibutuhkan, tetapi tampilan utama tetap ringan, rapi, dan tidak mengganggu proses kerja.

## Business Background
Pada sistem, pelapor dapat mengirim media melalui Bot Telegram sebagai evidence atau informasi tambahan. Media tersebut penting untuk membantu proses pengecekan laporan. Namun, jika media ditampilkan langsung di halaman utama atau halaman detail secara terbuka, tampilan menjadi penuh dan kurang nyaman digunakan. Oleh karena itu, media Telegram perlu ditempatkan pada tab khusus di dalam modal detail.

## Problem Statement
Media Telegram saat ini masih dapat memenuhi tampilan detail atau membuat halaman terasa padat. Eksekutor dan Koordinator membutuhkan akses cepat ke informasi utama tiket, sedangkan media Telegram hanya perlu dibuka ketika diperlukan. Sistem perlu memindahkan media Telegram ke popup/modal detail dengan tab terpisah agar tampilan lebih rapi.

## Goals
1. Memindahkan tampilan Media Telegram ke popup/modal detail laporan.
2. Menempatkan Media Telegram pada tab berbeda.
3. Menjaga Bukti Penyelesaian tetap terpisah dari Media Telegram.
4. Membuat tampilan detail laporan lebih rapi dan mudah digunakan.
5. Mengurangi tampilan media besar pada halaman utama.
6. Menjaga flow Telegram intake tetap tidak berubah.
7. Menjaga flow upload bukti penyelesaian tetap tidak berubah.
8. Menjaga F015 separation logic tetap berjalan.

## Non-Goals
1. Tidak mengubah Telegram intake.
2. Tidak mengubah parsing Telegram.
3. Tidak mengubah pending media.
4. Tidak mengubah text enrichment.
5. Tidak mengubah struktur database.
6. Tidak mengubah flow penyelesaian tiket.
7. Tidak mengubah flow return.
8. Tidak mengubah flow eskalasi DIIT.
9. Tidak mengubah Region Switch.
10. Tidak mengubah modul laporan manual F017.
11. Tidak mengubah akses kerja Koordinator F018.
12. Tidak membuat galeri media kompleks.
13. Tidak membuat crop/edit image.

## Actors

### Primary Actors
- Eksekutor
- Koordinator

### Secondary Actors
- Supervisor
- Super Admin

## Preconditions
1. Sistem sudah memiliki detail laporan dalam bentuk modal dari F010.
2. Sistem sudah memisahkan Bukti Penyelesaian dan Media Telegram dari F015.
3. Sistem sudah memiliki data media Telegram yang terhubung ke tiket.
4. Sistem sudah memiliki upload bukti penyelesaian.
5. Sistem menggunakan EJS, Bootstrap 5, dan JavaScript frontend.
6. Telegram intake sudah berjalan.

## Postconditions

### Jika berhasil
1. Media Telegram tampil pada tab khusus dalam modal detail.
2. Bukti Penyelesaian tampil pada tab atau bagian berbeda dari Media Telegram.
3. Halaman utama tidak dipenuhi media Telegram.
4. Modal detail tetap dapat dibuka dari daftar antrean.
5. Media Telegram tetap dapat dilihat ketika pengguna membuka tab Media Telegram.
6. Flow Telegram intake tetap berjalan.
7. Flow upload bukti penyelesaian tetap berjalan.

### Jika gagal
1. Media Telegram masih tampil bercampur dengan Bukti Penyelesaian.
2. Media Telegram masih memenuhi halaman utama.
3. Modal detail rusak atau tidak dapat dibuka.
4. Bukti Penyelesaian hilang.
5. Telegram intake terganggu.
6. Data media Telegram tidak dapat dilihat.

## Functional Requirements

### FR-01 — Detail Modal Uses Tabs
Modal detail laporan harus menggunakan tab untuk memisahkan kelompok informasi.

### FR-02 — Ticket Info Tab
Tab Informasi Tiket harus menampilkan data utama tiket.

### FR-03 — Completion Evidence Tab
Tab Bukti Penyelesaian harus menampilkan bukti yang diunggah oleh Eksekutor atau Koordinator.

### FR-04 — Telegram Media Tab
Tab Media Telegram harus menampilkan media yang berasal dari Telegram.

### FR-05 — Activity Log Tab
Tab Riwayat Aktivitas menampilkan log aktivitas tiket jika data log sudah tersedia pada detail modal.

### FR-06 — Preserve Evidence Separation
Media Telegram tidak boleh tampil pada tab Bukti Penyelesaian.

### FR-07 — Preserve Completion Evidence
Bukti penyelesaian tidak boleh tampil pada tab Media Telegram.

### FR-08 — Empty State
Jika tidak ada Media Telegram, tab Media Telegram harus menampilkan empty state.

### FR-09 — Main Page Cleanup
Halaman utama atau halaman daftar antrean tidak boleh menampilkan media Telegram secara terbuka.

### FR-10 — Keep Existing Detail Button
Tombol Detail tetap membuka modal detail.

### FR-11 — Preserve Modal Loading
Jika modal mengambil data melalui endpoint JSON, mekanisme fetch tetap berjalan.

### FR-12 — No Database Change
F019 tidak boleh mengubah struktur database.

## Business Rules
1. Media Telegram adalah bukti atau informasi yang dikirim pelapor melalui Bot Telegram.
2. Bukti Penyelesaian adalah bukti yang diunggah oleh Eksekutor atau Koordinator.
3. Media Telegram dan Bukti Penyelesaian harus tetap dipisahkan.
4. Media Telegram hanya perlu dibuka saat pengguna membutuhkan evidence dari pelapor.
5. Informasi utama tiket harus mudah dilihat tanpa terganggu media.
6. Supervisor tetap read-only.
7. Super Admin mengikuti akses yang sudah tersedia.
8. Telegram bot tidak terdampak.

## Recommended Modal Structure

```text
Detail Laporan
├── Informasi Tiket
│   ├── Ticket ID
│   ├── Order ID
│   ├── Summary
│   ├── Region
│   ├── STO
│   ├── Status
│   └── Waktu
│
├── Bukti Penyelesaian
│   └── File bukti dari Eksekutor/Koordinator
│
├── Media Telegram
│   └── Foto/dokumen dari pelapor Telegram
│
└── Riwayat Aktivitas
    └── Report logs