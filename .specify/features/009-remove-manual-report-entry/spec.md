# Feature Spec — Remove Manual Report Entry

## Feature ID
F009

## Feature Name
Remove Manual Report Entry

## Summary
Fitur ini menghapus atau menonaktifkan akses input laporan manual dari antarmuka sistem. Setelah revisi dari pembimbing lapangan Telkom, laporan gangguan tidak lagi dibuat melalui form manual pada dashboard. Laporan utama tetap berasal dari Bot Telegram dengan format terstruktur.

## Business Background
Sistem sebelumnya memiliki fitur input laporan manual yang dapat digunakan oleh Koordinator dan Super Admin. Setelah sistem ditinjau oleh pembimbing lapangan, fitur laporan manual dinilai tidak diperlukan karena alur kerja yang diinginkan adalah laporan masuk melalui Bot Telegram. Oleh karena itu, fitur laporan manual perlu dihapus atau disembunyikan dari UI agar alur sistem lebih sesuai dengan kebutuhan operasional.

## Problem Statement
Fitur laporan manual masih muncul pada UI dan dashboard tertentu. Hal ini dapat menyebabkan alur pelaporan menjadi tidak sesuai dengan kebutuhan lapangan, karena laporan gangguan seharusnya masuk melalui Bot Telegram, bukan dibuat manual melalui dashboard.

## Goals
1. Menghilangkan akses laporan manual dari UI sistem.
2. Menghapus menu atau shortcut laporan manual dari sidebar dan dashboard.
3. Menjaga agar laporan dari Bot Telegram tetap berjalan.
4. Menjaga tabel `reports` dan data laporan lama tetap aman.
5. Menjaga role, middleware, Telegram bot, dan business logic tiket lain tetap tidak berubah.

## Non-Goals
1. Tidak menghapus tabel `reports`.
2. Tidak menghapus data laporan manual lama dari database.
3. Tidak mengubah proses intake Bot Telegram.
4. Tidak mengubah parsing Telegram.
5. Tidak mengubah flow pengambilan tiket.
6. Tidak mengubah flow penyelesaian tiket.
7. Tidak mengubah flow delegasi.
8. Tidak mengubah Region Switch F007.
9. Tidak mengubah dashboard supervisor/KPI.
10. Tidak mengubah struktur RBAC.

## Actors

### Primary Actors
- Koordinator
- Super Admin

### Secondary Actors
- Eksekutor
- Supervisor
- Pelapor Telegram

## Preconditions
1. Sistem sudah memiliki fitur login dan RBAC.
2. Sistem sudah memiliki form laporan manual.
3. Sistem sudah memiliki menu atau shortcut laporan manual.
4. Sistem sudah memiliki Telegram bot intake.
5. Sistem sudah memiliki tabel `reports`.

## Postconditions

### Jika berhasil
1. Menu laporan manual tidak muncul pada sidebar.
2. Shortcut laporan manual tidak muncul pada dashboard Koordinator.
3. Shortcut laporan manual tidak muncul pada dashboard Super Admin.
4. Form laporan manual tidak dapat diakses melalui navigasi UI.
5. Telegram bot tetap dapat menerima laporan baru.
6. Data laporan lama tetap tersimpan.

### Jika gagal
1. Menu laporan manual masih terlihat.
2. User masih diarahkan ke form laporan manual dari dashboard.
3. Perubahan mengganggu Telegram intake.
4. Perubahan mengganggu daftar antrean laporan.

## Functional Requirements

### FR-01 — Hide Manual Report Menu
Sistem harus menghapus atau menyembunyikan menu laporan manual dari sidebar.

### FR-02 — Hide Manual Report Shortcut on Koordinator Dashboard
Sistem harus menghapus atau menyembunyikan shortcut tambah laporan manual dari dashboard Koordinator.

### FR-03 — Hide Manual Report Shortcut on Super Admin Dashboard
Sistem harus menghapus atau menyembunyikan shortcut tambah laporan manual dari dashboard Super Admin.

### FR-04 — Preserve Telegram Intake
Penghapusan laporan manual dari UI tidak boleh mengganggu laporan yang masuk dari Bot Telegram.

### FR-05 — Preserve Report List
Daftar antrean laporan tetap menampilkan laporan dari tabel `reports`.

### FR-06 — Preserve Existing Report Data
Data laporan lama tidak boleh dihapus.

### FR-07 — Route Safety
Jika route laporan manual masih ada, route tersebut boleh dibiarkan sementara sebagai fallback, tetapi tidak boleh lagi muncul dari navigasi UI.

### FR-08 — RBAC Safety
Perubahan ini tidak boleh mengubah role middleware atau membuka akses baru kepada role yang tidak berhak.

## Business Rules
1. Laporan utama sistem berasal dari Bot Telegram.
2. Input laporan manual tidak lagi menjadi bagian dari alur operasional sistem.
3. Super Admin difokuskan pada manajemen user.
4. Koordinator difokuskan pada pengelolaan antrean, delegasi, dan approval region switch.
5. Penghapusan fitur dari UI tidak boleh menghapus data lama.
6. Telegram bot tetap memakai text parsing berbasis aturan tetap.

## UI Requirements
1. Sidebar tidak menampilkan menu tambah laporan manual.
2. Dashboard Koordinator tidak menampilkan card/shortcut tambah laporan manual.
3. Dashboard Super Admin tidak menampilkan card/shortcut tambah laporan manual.
4. Tidak ada tombol “Tambah Laporan Manual” pada halaman utama.
5. Jika ada halaman lama untuk laporan manual, halaman tersebut tidak ditautkan dari UI.

## Acceptance Criteria

### AC-01
Given user login sebagai Koordinator  
When dashboard Koordinator tampil  
Then shortcut atau tombol tambah laporan manual tidak muncul.

### AC-02
Given user login sebagai Super Admin  
When dashboard Super Admin tampil  
Then shortcut atau tombol tambah laporan manual tidak muncul.

### AC-03
Given user melihat sidebar  
When user memiliki role Koordinator atau Super Admin  
Then menu laporan manual tidak ditampilkan.

### AC-04
Given Bot Telegram menerima laporan valid  
When laporan dikirim melalui Telegram  
Then laporan tetap masuk ke daftar antrean dengan status tersedia.

### AC-05
Given daftar antrean laporan dibuka  
When F009 telah diterapkan  
Then daftar laporan tetap tampil normal.

### AC-06
Given user login sebagai Supervisor  
When dashboard supervisor dibuka  
Then dashboard tetap read-only dan tidak terdampak.

### AC-07
Given user login sebagai Eksekutor  
When daftar antrean dibuka  
Then eksekutor tetap dapat melihat/mengambil tiket sesuai aturan yang sudah ada.

## Edge Cases
1. Route laporan manual masih diakses langsung melalui URL.
2. Data laporan lama memiliki `source_channel = manual`.
3. Sidebar digunakan oleh beberapa role sekaligus.
4. Dashboard Koordinator dan Super Admin memiliki shortcut manual report dalam bentuk card, button, atau link.
5. Menu manual report muncul di lebih dari satu partial/view.
6. Hasil penghapusan menu menyebabkan layout dashboard kosong atau timpang.

## Out of Scope
1. Menghapus route manual report secara permanen.
2. Menghapus controller manual report secara permanen.
3. Menghapus data manual report lama.
4. Mengubah tabel database.
5. Mengubah Telegram feedback.
6. Mengubah flow penyelesaian tiket.
7. Mengubah detail laporan menjadi modal.