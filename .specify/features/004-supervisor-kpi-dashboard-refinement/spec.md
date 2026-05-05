# Feature Spec — Supervisor KPI Dashboard Refinement

## Feature ID
F004

## Feature Name
Supervisor KPI Dashboard Refinement

## Summary
Fitur ini menyempurnakan dashboard KPI Supervisor agar dapat menampilkan ringkasan operasional tiket gangguan secara read-only, akurat, informatif, dan mudah dipahami. Dashboard harus menampilkan filter data, ringkasan KPI, grafik operasional, rekap per district, rekap kinerja pegawai eksekutor, tiket yang perlu perhatian, dan riwayat Region Switch F007.

## Business Background
Hasil diskusi lapangan menunjukkan bahwa Supervisor/Manajer berfungsi untuk memantau kinerja operasional secara read-only dan tidak mengubah data transaksional. Dashboard supervisor perlu menyajikan data yang mudah dibaca agar proses pemantauan tiket, evaluasi kinerja eksekutor, dan pemantauan beban kerja district dapat dilakukan dengan lebih jelas.

Sistem juga sudah memiliki fitur Region Switch F007, sehingga supervisor perlu dapat melihat riwayat penggunaan fitur tersebut sebagai bagian dari pemantauan operasional lintas district.

## Problem Statement
Dashboard supervisor yang terlalu sederhana dapat menyebabkan:
- KPI tidak mencerminkan kondisi operasional sebenarnya,
- tiket yang perlu tindak lanjut atau eskalasi salah dihitung sebagai selesai,
- pengawasan district dan pegawai tidak optimal,
- penggunaan Region Switch F007 tidak terlihat pada halaman monitoring,
- pengambilan keputusan operasional menjadi kurang akurat.

## Goals
1. Menyediakan dashboard supervisor yang akurat dan read-only.
2. Menampilkan KPI utama tiket gangguan.
3. Menambahkan filter periode, district, dan status.
4. Menampilkan grafik status tiket.
5. Menampilkan grafik tren laporan.
6. Menampilkan grafik perbandingan district.
7. Menampilkan rekap per district.
8. Menampilkan rekap per pegawai eksekutor.
9. Menampilkan tiket yang perlu perhatian.
10. Menampilkan riwayat Region Switch F007.
11. Memastikan tiket `perlu_tindak_lanjut` dan `eskalasi` tidak dihitung sebagai final selesai.

## Non-Goals
1. Tidak menambahkan aksi operasional dari dashboard supervisor.
2. Tidak mengubah assignment atau status tiket dari dashboard supervisor.
3. Tidak mengubah alur Bot Telegram.
4. Tidak mengubah alur approval Region Switch F007.
5. Tidak membahas notifikasi real-time.
6. Tidak menambahkan export PDF/Excel.
7. Tidak menambahkan drill-down grafik lanjutan.

## Actors

### Primary Actor
- Supervisor / Manajer

### Secondary Actors
- Super Admin

## Preconditions
1. User dengan role `supervisor` sudah tersedia dan aktif.
2. Data tiket tersedia pada tabel `reports`.
3. Data user tersedia pada tabel `users`.
4. Data district tersedia pada tabel `regions`.
5. Data Region Switch F007 tersedia pada tabel `region_switch_requests`.
6. Dashboard supervisor awal sudah tersedia.

## Postconditions

### Jika berhasil
1. Dashboard supervisor menampilkan data KPI yang akurat.
2. Supervisor dapat memantau operasional tanpa mengubah data.
3. Filter dashboard dapat digunakan untuk membatasi data.
4. Grafik operasional tampil sesuai data.
5. Rekap district dan pegawai tampil sesuai data terkini.
6. Tiket yang perlu perhatian tampil untuk membantu monitoring.
7. Riwayat Region Switch F007 tampil sebagai informasi tambahan.

### Jika gagal
1. Dashboard tidak menampilkan data atau menampilkan pesan error.
2. Tidak ada perubahan data operasional.
3. Data tiket dan Region Switch F007 tetap aman.

## Functional Requirements

### FR-01 — Supervisor Read-Only Access
Sistem harus memastikan role `supervisor` hanya memiliki akses baca pada dashboard KPI.

### FR-02 — Filter Dashboard
Dashboard harus menyediakan filter:
- periode
- district
- status tiket

### FR-03 — Ringkasan KPI Utama
Dashboard harus menampilkan:
- total tiket
- total tiket tersedia
- total tiket sedang ditangani
- total tiket selesai
- total tiket perlu tindak lanjut
- total tiket eskalasi
- rata-rata waktu respons
- rata-rata waktu penyelesaian
- tingkat penyelesaian
- backlog aktif

### FR-04 — Waktu Respons
Dashboard harus menampilkan rata-rata waktu respons, dihitung dari `received_at` ke `taken_at`.

### FR-05 — Waktu Penyelesaian
Dashboard harus menampilkan rata-rata waktu penyelesaian, dihitung dari `taken_at` ke `resolved_at`.

### FR-06 — Tingkat Penyelesaian
Dashboard harus menampilkan persentase tingkat penyelesaian berdasarkan jumlah tiket `selesai` dibanding total tiket.

### FR-07 — Backlog Aktif
Dashboard harus menampilkan backlog aktif berdasarkan tiket yang belum selesai final.

### FR-08 — Grafik Status Tiket
Dashboard harus menampilkan grafik status tiket berdasarkan status internal.

### FR-09 — Grafik Tren Laporan
Dashboard harus menampilkan grafik tren laporan berdasarkan tanggal laporan masuk.

### FR-10 — Grafik Perbandingan District
Dashboard harus menampilkan grafik perbandingan jumlah tiket antara district yang tersedia.

### FR-11 — Rekap per District
Dashboard harus menampilkan rekap per district yang mencakup minimal:
- total tiket
- tersedia
- sedang ditangani
- selesai
- perlu tindak lanjut
- eskalasi

### FR-12 — Rekap per Pegawai Eksekutor
Dashboard harus menampilkan rekap per pegawai eksekutor yang mencakup minimal:
- nama pegawai
- district
- total tiket ditangani
- total tiket selesai
- rata-rata waktu penyelesaian

### FR-13 — Tiket Perlu Perhatian
Dashboard harus menampilkan tiket yang perlu perhatian, seperti:
- tiket dengan status `perlu_tindak_lanjut`
- tiket dengan status `eskalasi`
- tiket yang sedang ditangani terlalu lama
- tiket yang belum selesai dan perlu dipantau supervisor

### FR-14 — Riwayat Region Switch F007
Dashboard harus menampilkan riwayat Region Switch F007 yang mencakup minimal:
- nama eksekutor
- district asal
- district tujuan
- status request
- waktu pengajuan
- waktu approval jika tersedia
- waktu expired jika tersedia

### FR-15 — Status Completion Handling
Sistem tidak boleh menghitung tiket `perlu_tindak_lanjut` dan `eskalasi` sebagai final completed tickets.

### FR-16 — Akses Role
Role selain `supervisor` tidak wajib menggunakan dashboard ini sebagai halaman utama, tetapi sistem tetap harus menjaga rule akses sesuai implementasi proyek.

## Business Rules
1. Supervisor tidak boleh mengubah data tiket.
2. Dashboard supervisor hanya bersifat monitoring.
3. KPI harus menghitung SLA sejak tiket masuk.
4. Tiket `selesai` dihitung sebagai final completed.
5. Tiket `perlu_tindak_lanjut` tidak dihitung final completed.
6. Tiket `eskalasi` tidak dihitung final completed.
7. Status `diambil` dan `didelegasikan` dihitung sebagai sedang ditangani.
8. Backlog aktif dihitung dari tiket yang belum selesai final.
9. District tiket tetap menggunakan district tiket, bukan district user supervisor.
10. Riwayat Region Switch F007 hanya ditampilkan sebagai informasi read-only.
11. Filter dashboard harus memengaruhi KPI, grafik, dan tabel yang relevan.

## Data Requirements

### Main Tables
- `reports`
- `users`
- `roles`
- `regions`
- `region_switch_requests`

### Main Fields

#### `reports`
- `status_internal`
- `received_at`
- `taken_at`
- `resolved_at`
- `current_region_id`
- `current_assigned_user_id`

#### `users`
- `full_name`
- `role_id`
- `region_id`

#### `regions`
- `code`
- `name`

#### `region_switch_requests`
- `requester_user_id`
- `from_region_id`
- `to_region_id`
- `status`
- `requested_at`
- `approved_at`
- `expired_at`

## Acceptance Criteria

### AC-01
Given supervisor login  
When membuka dashboard supervisor  
Then sistem menampilkan dashboard KPI read-only.

### AC-02
Given data tiket tersedia  
When dashboard dibuka  
Then sistem menampilkan total tiket dan status operasional secara benar.

### AC-03
Given filter periode, district, atau status dipilih  
When filter diterapkan  
Then KPI, grafik, dan tabel menampilkan data sesuai filter.

### AC-04
Given tiket memiliki `received_at` dan `taken_at`  
When KPI dihitung  
Then rata-rata waktu respons dihitung dari `received_at` ke `taken_at`.

### AC-05
Given tiket memiliki `taken_at` dan `resolved_at`  
When KPI dihitung  
Then rata-rata waktu penyelesaian dihitung dari `taken_at` ke `resolved_at`.

### AC-06
Given ada tiket dengan status `perlu_tindak_lanjut`  
When dashboard dihitung  
Then tiket tersebut tidak dihitung sebagai total selesai.

### AC-07
Given ada tiket dengan status `eskalasi`  
When dashboard dihitung  
Then tiket tersebut tidak dihitung sebagai total selesai.

### AC-08
Given data district tersedia  
When dashboard dibuka  
Then sistem menampilkan rekap per district.

### AC-09
Given data eksekutor tersedia  
When dashboard dibuka  
Then sistem menampilkan rekap per pegawai eksekutor.

### AC-10
Given data tiket perlu perhatian tersedia  
When dashboard dibuka  
Then sistem menampilkan tabel tiket perlu perhatian.

### AC-11
Given data Region Switch F007 tersedia  
When dashboard dibuka  
Then sistem menampilkan riwayat Region Switch F007 secara read-only.

### AC-12
Given tidak ada data sesuai filter  
When dashboard dibuka  
Then dashboard tetap tampil tanpa error.

## Edge Cases
1. Tidak ada tiket sama sekali.
2. Tidak ada tiket selesai.
3. Ada tiket tanpa `taken_at`.
4. Ada tiket tanpa `resolved_at`.
5. Ada eksekutor yang belum pernah menangani tiket.
6. Ada district yang belum punya tiket.
7. Tidak ada data Region Switch F007.
8. Filter menghasilkan data kosong.
9. Chart menerima data kosong.


## Implementation Note
Status `baru` tidak digunakan pada implementasi sistem saat ini. Tiket yang masuk melalui Bot Telegram maupun input manual langsung diberikan status `tersedia`.

Oleh karena itu, status `baru` tidak ditampilkan pada Dashboard Supervisor, grafik status tiket, maupun ringkasan KPI. Dashboard hanya menampilkan status operasional yang digunakan dalam sistem, yaitu:
- tersedia
- diambil
- didelegasikan
- selesai
- perlu_tindak_lanjut
- eskalasi