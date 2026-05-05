# Feature Spec — Temporary Region Switch Approval

## Feature ID
F007

## Feature Name
Temporary Region Switch Approval

## Summary
Fitur ini memungkinkan Pegawai Eksekutor memperoleh akses sementara ke region lain untuk membantu penanganan tiket saat terjadi overload atau kebutuhan operasional lain. Akses region tambahan tidak diberikan otomatis, melainkan harus diajukan terlebih dahulu oleh eksekutor dan disetujui oleh koordinator.

## Business Background
Kebutuhan operasional terbaru menunjukkan bahwa mekanisme delegasi per tiket oleh koordinator tidak lagi menjadi pendekatan utama untuk kondisi overload. Yang dibutuhkan adalah mekanisme agar eksekutor dapat menangani tiket dari region lain sementara waktu, tanpa memindahkan region utama miliknya. Dalam kondisi ini, eksekutor tetap memiliki region utama, tetapi selama approval aktif, ia dapat melihat dan mengambil tiket dari region tambahan juga.

## Problem Statement
Mekanisme delegasi tiket satu per satu kurang efisien ketika beban kerja overload terjadi di satu region. Kondisi ini membutuhkan solusi yang lebih fleksibel, yaitu perpindahan akses region sementara untuk eksekutor. Tanpa fitur ini:
- koordinator harus memindahkan tiket satu per satu,
- redistribusi beban kerja tidak efisien,
- eksekutor tidak memiliki mekanisme resmi untuk membantu region lain,
- sistem belum mendukung akses ganda region yang dikontrol dan dibatasi waktu.

## Goals
1. Menyediakan fitur pengajuan akses region tambahan sementara oleh eksekutor.
2. Menyediakan fitur approval atau rejection oleh koordinator.
3. Mengaktifkan akses region tambahan sementara tanpa mengubah region utama user.
4. Membuat task pool eksekutor mencakup region utama dan region tambahan aktif.
5. Menonaktifkan akses region tambahan secara otomatis setelah masa berlaku habis.

## Non-Goals
1. Fitur ini tidak mengubah region utama permanen user.
2. Fitur ini tidak memindahkan tiket satu per satu seperti mekanisme delegasi lama.
3. Fitur ini tidak mengubah struktur RBAC inti.
4. Fitur ini belum membahas notifikasi Telegram otomatis untuk approval region switch.

## Actors

### Primary Actors
- Pegawai Eksekutor
- Koordinator

### Secondary Actors
- Supervisor
- Super Admin

## Preconditions
1. User sudah login ke sistem.
2. User dengan role `eksekutor` memiliki region utama.
3. User dengan role `koordinator` memiliki akses approval.
4. Region tujuan tersedia pada data sistem.

## Postconditions

### Jika berhasil di-approve
1. Permintaan switch region berubah menjadi `approved`.
2. Eksekutor tetap memiliki region utama.
3. Eksekutor mendapatkan akses region tambahan sampai batas waktu berlaku.
4. Task pool eksekutor menampilkan tiket dari region utama dan region tambahan yang aktif.

### Jika di-reject
1. Permintaan switch region berubah menjadi `rejected`.
2. Eksekutor tetap hanya melihat region utama.
3. Alasan penolakan dapat dicatat.

### Jika expired
1. Akses region tambahan tidak lagi aktif.
2. Eksekutor kembali hanya melihat tiket region utama.

## Functional Requirements

### FR-01 — Pengajuan Switch Region
Sistem harus menyediakan menu bagi eksekutor untuk mengajukan switch region sementara.

### FR-02 — Data Pengajuan
Form pengajuan minimal memuat:
- region asal
- region tujuan
- alasan pengajuan

### FR-03 — Approval oleh Koordinator
Sistem harus menyediakan menu approval/rejection untuk koordinator.

### FR-04 — Status Pengajuan
Status pengajuan minimal:
- `pending`
- `approved`
- `rejected`
- `expired`

### FR-05 — Region Utama Tidak Berubah
Approval switch region tidak boleh mengubah region utama yang tersimpan pada akun user.

### FR-06 — Akses Region Ganda
Saat approval aktif, eksekutor dapat melihat tiket dari:
- region utama
- region tambahan yang aktif

### FR-07 — Masa Berlaku
Approval switch region berlaku sementara sampai **23:59:59 pada hari approval**.

### FR-08 — Expire Otomatis
Setelah melewati waktu berlaku, akses region tambahan harus dianggap tidak aktif lagi.

### FR-09 — Task Pool Eksekutor
Task pool eksekutor harus menampilkan tiket dari seluruh region yang sedang menjadi hak akses aktif user.

### FR-10 — History dan Audit
Sistem harus menyimpan riwayat pengajuan, approval, rejection, dan expire.

### FR-11 — Satu Approval Aktif per Region Tujuan
Sistem harus mencegah duplikasi approval aktif untuk kombinasi user dan region tujuan yang sama dalam periode yang sama.

## Business Rules
1. Pengajuan hanya dapat dibuat oleh role `eksekutor`.
2. Approval atau rejection hanya dapat dilakukan oleh role `koordinator`.
3. Region utama user tidak berubah.
4. Region tambahan hanya aktif sementara.
5. Selama approval aktif, eksekutor bisa melihat region utama dan region tambahan.
6. Setelah expired, akses region tambahan hilang otomatis.
7. Delegasi tiket satu per satu bukan lagi alur utama untuk overload region.

## Data Requirements

### Main Table Needed
- `region_switch_requests`

### Suggested Fields
- `id`
- `requester_user_id`
- `home_region_id`
- `target_region_id`
- `reason`
- `status`
- `requested_at`
- `approved_by_user_id`
- `approved_at`
- `start_at`
- `end_at`
- `rejection_reason`
- `created_at`
- `updated_at`

## Acceptance Criteria

### AC-01
Given eksekutor membuka menu pengajuan  
When eksekutor memilih region tujuan dan mengirim pengajuan  
Then sistem menyimpan request dengan status `pending`.

### AC-02
Given koordinator membuka menu approval  
When koordinator menyetujui pengajuan  
Then request berubah menjadi `approved` dan akses region tambahan aktif sampai 23:59:59 hari tersebut.

### AC-03
Given request approved dan masih aktif  
When eksekutor membuka task pool  
Then tiket dari region utama dan region tambahan tampil bersamaan.

### AC-04
Given koordinator menolak pengajuan  
When rejection disimpan  
Then request berubah menjadi `rejected` dan akses region tambahan tidak aktif.

### AC-05
Given approval sudah melewati 23:59:59  
When eksekutor membuka task pool pada hari berikutnya  
Then region tambahan tidak lagi ditampilkan.

## Edge Cases
1. Eksekutor mengajukan region yang sama dengan region utama.
2. Eksekutor mengajukan saat masih punya approval aktif untuk region tujuan yang sama.
3. Koordinator approve request yang sudah expired/rejected.
4. Eksekutor tanpa region utama mencoba mengajukan.
5. Region tujuan tidak valid.