# Feature Spec — Report Detail Modal

## Feature ID
F010

## Feature Name
Report Detail Modal

## Summary
Fitur ini mengubah tampilan detail laporan agar ditampilkan dalam bentuk popup/modal dari halaman daftar antrean laporan. Tujuannya agar pengguna dapat melihat informasi detail tiket secara cepat tanpa harus berpindah ke halaman detail terpisah.

## Business Background
Pada sistem sebelumnya, detail laporan ditampilkan melalui halaman detail tersendiri. Berdasarkan revisi dari pembimbing lapangan Telkom, detail laporan sebaiknya dibuat dalam bentuk popup/modal agar proses pemantauan tiket menjadi lebih cepat dan praktis. Dengan modal, pengguna tetap berada pada halaman daftar antrean laporan dan dapat melihat detail tiket tanpa kehilangan konteks daftar.

## Problem Statement
Halaman detail laporan yang terpisah membuat pengguna harus berpindah halaman saat ingin melihat informasi tiket. Pada proses monitoring dan pengelolaan antrean, perpindahan halaman ini dapat memperlambat pengguna karena harus kembali lagi ke daftar antrean setelah melihat detail.

## Goals
1. Menampilkan detail laporan dalam bentuk popup/modal.
2. Menjaga halaman daftar antrean tetap sebagai pusat kerja pengguna.
3. Menampilkan informasi penting tiket secara lengkap di dalam modal.
4. Memastikan modal dapat digunakan oleh role yang berhak melihat detail laporan.
5. Menjaga flow tiket, Telegram bot, RBAC, dan database tetap tidak berubah.

## Non-Goals
1. Tidak mengubah flow pengambilan tiket.
2. Tidak mengubah flow penyelesaian tiket.
3. Tidak mengubah validasi catatan penyelesaian.
4. Tidak mengubah feedback Telegram.
5. Tidak menambahkan kode DIIT.
6. Tidak mengubah Region Switch F007.
7. Tidak mengubah dashboard supervisor/KPI.
8. Tidak mengubah struktur database.
9. Tidak menghapus data laporan.
10. Tidak mengganti framework frontend.

## Actors

### Primary Actors
- Eksekutor
- Koordinator
- Supervisor
- Super Admin

### Secondary Actor
- Pelapor Telegram

## Preconditions
1. Sistem sudah memiliki halaman daftar antrean laporan.
2. Sistem sudah memiliki data laporan/tiket pada tabel `reports`.
3. Sistem sudah memiliki fitur detail laporan.
4. Sistem sudah menggunakan EJS dan Bootstrap 5.
5. Sistem sudah memiliki middleware login dan role.
6. Sistem sudah memiliki RBAC yang membatasi akses tiap role.

## Postconditions

### Jika berhasil
1. Tombol detail pada daftar antrean membuka popup/modal.
2. Modal menampilkan detail laporan/tiket.
3. Pengguna tetap berada di halaman daftar antrean.
4. Modal dapat ditutup tanpa reload halaman penuh jika memungkinkan.
5. Halaman detail lama boleh tetap ada sebagai fallback jika masih diperlukan.
6. Flow tiket lain tidak berubah.

### Jika gagal
1. Tombol detail tidak membuka modal.
2. Data detail tidak tampil lengkap.
3. Modal menyebabkan error pada daftar antrean.
4. Role yang tidak berhak dapat mengakses detail.
5. Fitur tiket lain ikut terganggu.

## Functional Requirements

### FR-01 — Detail Button Opens Modal
Sistem harus menyediakan tombol Detail pada daftar antrean laporan yang membuka popup/modal.

### FR-02 — Modal Displays Main Report Data
Modal harus menampilkan data utama laporan, seperti Ticket ID, Order ID, WO Number jika ada, jenis layanan, provider, branch, cluster, STO, summary, dan service ID jika tersedia.

### FR-03 — Modal Displays Status Data
Modal harus menampilkan status laporan, status internal, status WFM, status Andalas, completion status, dan informasi penyelesaian jika tersedia.

### FR-04 — Modal Displays Region Data
Modal harus menampilkan region/wilayah laporan, seperti region awal, region aktif/current region, branch, cluster, dan STO jika tersedia.

### FR-05 — Modal Displays Assignment Data
Modal harus menampilkan penanggung jawab aktif atau assigned user jika tersedia.

### FR-06 — Modal Displays Time Data
Modal harus menampilkan waktu penting, seperti received_at, taken_at, resolved_at, closed_at, created_at, dan updated_at jika tersedia.

### FR-07 — Modal Displays Notes
Modal harus menampilkan completion notes atau catatan lain jika tersedia.

### FR-08 — Modal Displays Attachments
Modal harus menampilkan bukti penyelesaian atau attachment jika tersedia.

### FR-09 — Modal Displays Telegram Media
Modal harus menampilkan media tambahan dari Telegram jika tersedia.

### FR-10 — Modal Access Safety
Data detail yang tampil pada modal tetap harus mengikuti hak akses role yang sudah berlaku.

### FR-11 — Preserve Old Detail Route as Fallback
Jika halaman detail lama masih diperlukan, route lama boleh tetap dipertahankan sebagai fallback.

### FR-12 — No Database Change
Fitur ini tidak boleh membutuhkan perubahan struktur database.

## Business Rules
1. Modal detail hanya digunakan untuk menampilkan informasi, bukan mengubah data.
2. Modal detail tidak boleh menambahkan aksi operasional baru.
3. Supervisor tetap read-only.
4. Eksekutor hanya melihat detail tiket sesuai hak akses yang sudah berlaku.
5. Koordinator hanya melihat detail sesuai hak akses operasional yang sudah berlaku.
6. Super Admin tetap mengikuti akses yang sudah ditentukan sistem.
7. Detail modal tidak boleh mengubah status tiket.
8. Detail modal tidak boleh mengubah assignment.
9. Detail modal tidak boleh mengubah Region Switch F007.
10. Detail modal tidak boleh mengubah Telegram bot.

## UI Requirements
1. Modal menggunakan Bootstrap 5.
2. Modal memiliki judul yang jelas, misalnya “Detail Laporan”.
3. Modal menampilkan data dalam kelompok yang rapi.
4. Modal memiliki tombol Close/Tutup.
5. Modal responsif pada layar laptop.
6. Modal tidak membuat tabel daftar laporan rusak.
7. Teks panjang seperti summary harus tetap rapi.
8. Attachment atau media ditampilkan sebagai link/preview jika sistem sudah mendukung.
9. Empty state ditampilkan jika attachment/media tidak tersedia.
10. Status ditampilkan sebagai badge jika sudah tersedia komponen badge.

## Acceptance Criteria

### AC-01
Given user membuka daftar antrean laporan  
When tombol Detail diklik  
Then detail laporan tampil dalam bentuk popup/modal.

### AC-02
Given modal detail tampil  
When data laporan tersedia  
Then modal menampilkan informasi utama tiket secara jelas.

### AC-03
Given laporan memiliki attachment  
When modal detail dibuka  
Then attachment dapat terlihat atau diakses dari modal.

### AC-04
Given laporan memiliki media Telegram  
When modal detail dibuka  
Then media Telegram dapat terlihat atau diakses dari modal.

### AC-05
Given user menutup modal  
When tombol Tutup/Close diklik  
Then user kembali ke daftar antrean tanpa kehilangan konteks halaman.

### AC-06
Given user login sebagai Supervisor  
When membuka modal detail  
Then supervisor hanya dapat melihat data dan tidak melihat tombol aksi operasional tambahan.

### AC-07
Given user login sebagai Eksekutor  
When membuka modal detail  
Then akses detail tetap mengikuti aturan yang sudah ada.

### AC-08
Given user login sebagai Koordinator  
When membuka modal detail  
Then akses detail tetap mengikuti aturan yang sudah ada.

### AC-09
Given F010 selesai diterapkan  
When Telegram bot menerima laporan baru  
Then laporan tetap masuk seperti sebelumnya.

### AC-10
Given F010 selesai diterapkan  
When user membuka daftar antrean  
Then fitur ambil tugas, delegasi, dan filter tetap berjalan seperti sebelumnya.

## Edge Cases
1. Tiket tidak memiliki attachment.
2. Tiket tidak memiliki media Telegram.
3. Tiket belum memiliki assigned user.
4. Tiket belum memiliki taken_at.
5. Tiket belum memiliki resolved_at.
6. Summary tiket sangat panjang.
7. Data null pada beberapa field.
8. Modal dibuka beberapa kali untuk tiket berbeda.
9. User mencoba akses detail tiket yang tidak berhak dilihat.
10. Koneksi gagal jika modal mengambil data melalui endpoint JSON.

## Data Requirements
1. F010 tidak membutuhkan tabel baru.
2. F010 tidak membutuhkan kolom baru.
3. Data detail diambil dari tabel yang sudah ada:
   - `reports`
   - `users`
   - `regions`
   - `report_attachments`
   - `report_logs` jika diperlukan
4. Jika menggunakan endpoint JSON, query harus tetap berada di model.

## Out of Scope
1. Menghapus laporan manual.
2. Mengubah catatan penyelesaian.
3. Mengubah feedback Telegram.
4. Menambahkan kode DIIT.
5. Membersihkan narasi overwork.
6. Mengubah logic Region Switch.
7. Mengubah query KPI supervisor.
8. Mengubah Telegram parsing.