# Feature Spec — Role-Based Dashboard Improvement

## Feature ID
F028

## Feature Name
Role-Based Dashboard Improvement

## Summary
Fitur ini memperbaiki dashboard agar setiap role melihat informasi yang sesuai dengan fungsi kerjanya. Dashboard Eksekutor fokus pada pekerjaan tiket miliknya dan tiket yang tersedia di wilayah kerja. Dashboard Koordinator fokus pada monitoring dan pengelolaan tiket PDG dan BKT. Dashboard Super Admin fokus pada ringkasan sistem, user, laporan ticketing, dan laporan manual non-ticketing.

## Business Background
Setelah daftar antrean kerja, modal detail, segmentasi status, dan pagination diperbaiki, sistem perlu memiliki dashboard yang lebih sesuai dengan kebutuhan masing-masing role. Dashboard tidak boleh hanya menjadi halaman umum, tetapi harus membantu user memahami kondisi pekerjaan sesuai tanggung jawabnya.

## Problem Statement
Dashboard saat ini belum sepenuhnya mencerminkan fungsi setiap role. Eksekutor membutuhkan ringkasan pekerjaan yang harus dikerjakan. Koordinator membutuhkan monitoring lintas wilayah PDG dan BKT. Super Admin membutuhkan ringkasan sistem, user, dan data laporan. Jika dashboard tidak spesifik, pengguna tetap harus membuka banyak menu untuk mengetahui kondisi kerja.

## Goals
1. Membuat dashboard Eksekutor sesuai fungsi pengerjaan tiket.
2. Membuat dashboard Koordinator sesuai fungsi monitoring dan koordinasi dua wilayah.
3. Membuat dashboard Super Admin sesuai fungsi administrasi sistem.
4. Menampilkan ringkasan jumlah tiket berdasarkan status.
5. Menampilkan data yang relevan sesuai hak akses role.
6. Menjaga dashboard tetap ringan dan mudah dibaca.
7. Menjaga RBAC tetap aman.
8. Tidak mengubah database.
9. Tidak mengubah flow ticketing.
10. Tidak mengubah fitur antrean kerja F029 dan F030.

## Non-Goals
1. Tidak mengubah database.
2. Tidak mengubah Telegram intake.
3. Tidak mengubah Telegram parsing.
4. Tidak mengubah flow ambil tiket.
5. Tidak mengubah flow selesai.
6. Tidak mengubah flow return.
7. Tidak mengubah flow eskalasi DIIT.
8. Tidak mengubah upload file.
9. Tidak mengubah modal detail F019.
10. Tidak mengubah pagination F030.
11. Tidak membuat chart kompleks.
12. Tidak memakai library chart baru.
13. Tidak membuat export dashboard.
14. Tidak membuat dashboard maps/UDP.

## Actors
- Eksekutor
- Koordinator
- Super Admin

## Secondary Actor
- Supervisor, jika dashboard existing sudah ada, tetap read-only dan tidak dirusak.

## Dashboard Scope

### Eksekutor Dashboard
Dashboard Eksekutor harus membantu user melihat pekerjaan yang perlu dikerjakan.

Informasi yang disarankan:
1. Tiket tersedia di wilayah kerja.
2. Tiket sedang dikerjakan oleh dirinya.
3. Tiket selesai oleh dirinya.
4. Tiket perlu tindak lanjut.
5. Tiket eskalasi.
6. Tiket terbaru yang assigned ke dirinya.
7. Shortcut ke Daftar Antrean Kerja.

### Koordinator Dashboard
Dashboard Koordinator harus membantu monitoring dua wilayah, yaitu PDG dan BKT.

Informasi yang disarankan:
1. Total tiket PDG dan BKT.
2. Tiket tersedia.
3. Tiket sedang dikerjakan.
4. Tiket didelegasikan.
5. Tiket selesai.
6. Tiket perlu tindak lanjut.
7. Tiket eskalasi.
8. Ringkasan tiket per wilayah PDG dan BKT.
9. Aktivitas terbaru dari report logs.
10. Shortcut ke Daftar Antrean Kerja dan Laporan Manual.

### Super Admin Dashboard
Dashboard Super Admin harus membantu melihat kondisi sistem.

Informasi yang disarankan:
1. Total user.
2. User aktif.
3. User nonaktif.
4. Total role.
5. Total region.
6. Total laporan ticketing.
7. Total laporan manual non-ticketing.
8. Total media/file attachment jika tersedia.
9. Ringkasan user berdasarkan role.
10. Shortcut ke Manajemen User dan Laporan Manual.

## Functional Requirements

### FR-01 — Role-Based Dashboard Routing
Sistem harus menampilkan dashboard sesuai role user yang login.

### FR-02 — Eksekutor Dashboard Summary
Dashboard Eksekutor harus menampilkan ringkasan pekerjaan tiket sesuai akses Eksekutor.

### FR-03 — Koordinator Dashboard Summary
Dashboard Koordinator harus menampilkan ringkasan tiket PDG dan BKT.

### FR-04 — Super Admin Dashboard Summary
Dashboard Super Admin harus menampilkan ringkasan administrasi sistem.

### FR-05 — Preserve RBAC
Dashboard tidak boleh menampilkan data di luar hak akses role.

### FR-06 — Preserve Executor Access
Eksekutor hanya melihat data sesuai region utama, region switch aktif, atau assignment sesuai logic existing.

### FR-07 — Preserve Coordinator Access
Koordinator melihat data PDG dan BKT sesuai F018.

### FR-08 — Preserve Super Admin Scope
Super Admin dapat melihat ringkasan global sistem.

### FR-09 — Dashboard Cards
Dashboard harus menggunakan cards/ringkasan angka agar mudah dibaca.

### FR-10 — Dashboard Shortcuts
Dashboard menyediakan shortcut ke halaman yang relevan.

### FR-11 — No Database Change
F028 tidak boleh mengubah struktur database.

### FR-12 — No Ticketing Flow Change
F028 tidak boleh mengubah flow ticketing.

## Data Requirements

Gunakan tabel existing:
```text id="h71lae"
reports
users
roles
regions
manual_non_ticketing_reports
report_logs
report_attachments