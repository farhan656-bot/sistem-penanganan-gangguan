# Feature Spec — Delegation and Assignment Cancellation

## Feature ID
F003

## Feature Name
Delegation and Assignment Cancellation

## Summary
Fitur ini mengatur proses delegasi penanggung jawab tiket lintas district oleh koordinator, serta pembatalan penugasan aktif jika eksekutor yang sudah mengambil tiket tidak jadi mengerjakan. Delegasi pada fitur ini tidak memindahkan kepemilikan district tiket, tetapi hanya memindahkan penanggung jawab aktif sementara.

## Business Background
Hasil diskusi operasional menunjukkan bahwa:
- pembatalan tugas perlu ada, tetapi hanya boleh dilakukan oleh koordinator,
- tiket tetap berada pada district asalnya,
- pegawai dari district lain hanya menangani tiket tersebut untuk sementara saat didelegasikan,
- eksekutor hanya boleh melihat tiket district sendiri dan/atau district yang didelegasikan kepadanya. :contentReference[oaicite:1]{index=1}

## Problem Statement
Tanpa aturan delegasi dan pembatalan assignment yang jelas:
- distribusi beban kerja lintas district menjadi tidak terkontrol,
- tiket bisa salah dianggap berpindah district,
- eksekutor dapat melihat tiket di luar kewenangannya,
- koordinator tidak memiliki kendali formal untuk membatalkan penugasan yang gagal dijalankan.

## Goals
1. Memungkinkan koordinator mendelegasikan tiket lintas district.
2. Memastikan delegasi tidak mengubah district asal tiket.
3. Memungkinkan koordinator membatalkan assignment aktif.
4. Memastikan eksekutor hanya melihat tiket district sendiri atau tiket yang didelegasikan kepadanya.
5. Menyimpan histori assignment dan log aktivitas secara konsisten.

## Non-Goals
1. Tidak membahas integrasi Bot Telegram.
2. Tidak membahas parsing format laporan.
3. Tidak membahas dashboard KPI supervisor secara detail.
4. Tidak membahas manajemen user super admin.

## Actors

### Primary Actor
- Koordinator

### Secondary Actors
- Pegawai Eksekutor
- Supervisor

## Preconditions
1. Tiket sudah tersimpan di tabel `reports`.
2. Role dan autentikasi sudah aktif.
3. Tabel `report_assignments` dan `report_logs` tersedia.
4. Koordinator sudah login ke sistem.
5. User eksekutor pada district tujuan tersedia dan aktif.

## Postconditions

### Jika delegasi berhasil
1. Tiket tetap berada pada district asal.
2. Penanggung jawab aktif tiket berubah ke eksekutor tujuan.
3. Status tiket berubah sesuai aturan delegasi.
4. Histori assignment tersimpan.
5. Log delegasi tersimpan.

### Jika pembatalan assignment berhasil
1. Penanggung jawab aktif dihapus.
2. Status tiket kembali `tersedia`.
3. Histori assignment aktif dinonaktifkan.
4. Log pembatalan tersimpan.

### Jika gagal
1. Tidak ada perubahan status atau assignment.
2. Sistem menampilkan pesan kesalahan yang sesuai.

## Functional Requirements

### FR-01 — Delegasi oleh Koordinator
Sistem harus mengizinkan koordinator mendelegasikan tiket.

### FR-02 — Status Tiket yang Bisa Didelegasikan
Sistem harus mengizinkan delegasi untuk tiket berstatus:
- `tersedia`
- `diambil`
- `didelegasikan`

### FR-03 — Delegasi Tidak Memindahkan District Tiket
Delegasi tidak boleh mengubah district asal tiket.

### FR-04 — Delegasi Memindahkan Penanggung Jawab Aktif
Delegasi harus mengubah penanggung jawab aktif tiket ke eksekutor tujuan.

### FR-05 — Aturan District Delegasi
Jika tiket berasal dari district `PDG`, maka delegasi hanya boleh ke eksekutor district `BKT`.
Jika tiket berasal dari district `BKT`, maka delegasi hanya boleh ke eksekutor district `PDG`.

### FR-06 — Assignment History
Sistem harus menyimpan histori assignment pada tabel `report_assignments`.

### FR-07 — Nonaktifkan Assignment Lama
Saat delegasi dilakukan, assignment aktif sebelumnya harus dinonaktifkan.

### FR-08 — Batalkan Assignment
Sistem harus mengizinkan koordinator membatalkan assignment aktif untuk tiket berstatus:
- `diambil`
- `didelegasikan`

### FR-09 — Cancel Assignment oleh Koordinator Saja
Hanya koordinator yang boleh melakukan pembatalan assignment.

### FR-10 — Reset Status Saat Assignment Dibatalkan
Saat assignment dibatalkan:
- `current_assigned_user_id` harus dikosongkan,
- status tiket harus kembali ke `tersedia`,
- `taken_at` dapat direset sesuai aturan implementasi.

### FR-11 — Visibilitas Tiket untuk Eksekutor
Eksekutor hanya boleh melihat:
- tiket district miliknya sendiri,
- atau tiket yang didelegasikan kepadanya.

### FR-12 — Logging
Sistem harus menyimpan log untuk:
- delegasi tiket
- pembatalan assignment

## Business Rules
1. Hanya koordinator yang boleh mendelegasikan tiket.
2. Hanya koordinator yang boleh membatalkan assignment.
3. Delegasi tidak memindahkan district tiket.
4. Delegasi hanya memindahkan penanggung jawab aktif.
5. Tiket district `PDG` hanya boleh didelegasikan ke eksekutor district `BKT`.
6. Tiket district `BKT` hanya boleh didelegasikan ke eksekutor district `PDG`.
7. Eksekutor tidak boleh melihat semua tiket lintas district secara bebas.
8. Histori assignment harus tetap tersimpan walaupun assignment aktif berubah.
9. Setiap delegasi dan pembatalan assignment harus dicatat ke log. :contentReference[oaicite:2]{index=2}

## Data Requirements

### Main Tables
- `reports`
- `report_assignments`
- `report_logs`
- `users`
- `regions`

### Main Fields Used
#### `reports`
- `id`
- `current_region_id`
- `current_assigned_user_id`
- `status_internal`
- `taken_at`

#### `report_assignments`
- `report_id`
- `assigned_to_user_id`
- `assigned_by_user_id`
- `from_region_id`
- `to_region_id`
- `assignment_type`
- `notes`
- `is_active`
- `assigned_at`

#### `report_logs`
- `report_id`
- `user_id`
- `action`
- `description`
- `created_at`

## Acceptance Criteria

### AC-01
Given koordinator membuka detail tiket `tersedia`  
When koordinator memilih eksekutor district lawan dan submit delegasi  
Then tiket didelegasikan tanpa mengubah district tiket.

### AC-02
Given tiket `diambil` oleh eksekutor district asal  
When koordinator mendelegasikan tiket ke eksekutor district lawan  
Then penanggung jawab aktif berubah ke user tujuan.

### AC-03
Given tiket `didelegasikan`  
When eksekutor tujuan login  
Then tiket terlihat pada daftar tiketnya.

### AC-04
Given koordinator membatalkan assignment aktif  
When aksi pembatalan berhasil  
Then tiket kembali ke status `tersedia` dan penanggung jawab aktif kosong.

### AC-05
Given eksekutor mencoba membatalkan assignment  
When request dikirim  
Then sistem menolak akses.

### AC-06
Given tiket district PDG  
When koordinator membuka dropdown pegawai tujuan  
Then hanya eksekutor district BKT yang ditampilkan.

### AC-07
Given tiket district BKT  
When koordinator membuka dropdown pegawai tujuan  
Then hanya eksekutor district PDG yang ditampilkan.

## Edge Cases
1. Koordinator memilih user tujuan yang sama dengan penanggung jawab saat ini.
2. Koordinator memilih user yang bukan role eksekutor.
3. Tidak ada eksekutor aktif pada district tujuan.
4. Tiket tidak ditemukan.
5. Assignment aktif tidak ada saat pembatalan diminta.
6. User non-koordinator mencoba akses aksi delegasi atau pembatalan.