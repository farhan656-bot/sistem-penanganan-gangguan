# Feature Spec — Report Identity and Database Normalization

## Feature ID
F033

## Feature Name
Report Identity and Database Normalization

## Summary
Fitur F033 berfokus pada normalisasi skema basis data dan unifikasi identitas laporan di seluruh sistem penanganan gangguan Divisi Data Management PT Telkom Sumbar Witel Padang. Sistem menetapkan `reports.ticket_id` (`VARCHAR(100)`) sebagai PRIMARY KEY dan pengenal utama (*single primary identifier*) laporan secara mutlak, menggantikan kunci pengganti legacy `reports.id` (`BIGINT`). Seluruh tabel relasi turunan (*child tables*): `report_assignments`, `report_logs`, `report_attachments`, serta tabel penyangga `telegram_pending_media` dimigrasikan untuk mereferensikan `ticket_id`.

Selain unifikasi identitas, F033 menata ulang tanggung jawab penugasan dengan menetapkan tabel `report_assignments` sebagai *single source of truth* untuk data penugasan aktif (`is_active = 1`). Kolom denormalisasi pada tabel induk, yaitu `reports.current_assigned_user_id` dan `reports.current_region_id`, dieliminasi dari target skema. Wilayah laporan didefinisikan secara tegas dan mandiri melalui `reports.reported_region_id` sebagai representasi wilayah asal fisik gangguan, sedangkan wilayah kerja penanggung jawab diturunkan secara relasional melalui relasi user (`users.region_id -> regions`). Sesuai desain ERD final, kolom `from_region_id` dan `to_region_id` pada `report_assignments` dihapus total guna mencegah duplikasi penyimpanan data wilayah user.

Berdasarkan verifikasi database aktual yang telah selesai, stempel waktu resmi intake laporan adalah `reports.received_at` (`DATETIME NULL DEFAULT CURRENT_TIMESTAMP()`), dan kolom ini dipertahankan sebagai nama kolom final F033 (tidak menggunakan `reported_at` dan tidak ada rename column). Status enum pada `telegram_pending_media` adalah `ENUM('pending','linked','expired')`.

Pada modul lampiran, struktur relasi distandarisasi ke `ticket_id` dan diperkaya dengan tabel master `type_attachment` menggunakan kolom `code` sebagai *business key* untuk memisahkan secara tegas `bukti_pelapor` dan `bukti_penanganan`. Sistem melarang keras *hardcoded numeric ID* (seperti ID 1 atau 2) dalam logika aplikasi. Pembedaan kanal input teknis dipertahankan pada kolom `source` (`telegram` vs `manual`). Seluruh akses manipulasi dan pembacaan lampiran dikonsolidasikan ke dalam `attachmentModel.js`. Selain itu, data historis lampiran eksisting yang ambigu (13 baris `source` kosong dan 12 baris Telegram ber-uploader internal) diaudit dan dilindungi dari *blind backfill*, tabel `report_logs` diproteksi integritas historinya dari `CASCADE DELETE` dengan `ON DELETE RESTRICT`, serta mekanisme polling antrean dirancang ulang secara deterministik menggunakan kursor komposit `received_at` dan `ticket_id`.

## Business Background
Sistem Pengelolaan Tiket Gangguan PT Telkom Sumbar Witel Padang menerima laporan gangguan dari Bot Telegram dan menyajikan antrean kerja operasional bagi Eksekutor, Koordinator, Supervisor, dan Super Admin. Dalam operasional lapangan dan integrasi Telegram, setiap tiket diidentifikasi secara unik oleh nomor tiket bisnis (`ticket_id`).

Pada implementasi historis (F001 hingga F032), basis data masih menggunakan kunci pengganti (*surrogate key*) auto-increment `reports.id` (`BIGINT`) sebagai PRIMARY KEY teknis, sementara `ticket_id` berstatus sebagai kolom unik (`VARCHAR(100)`). Kondisi ini menciptakan identitas ganda (*dual identity*) di seluruh lapisan aplikasi: rute web, controller, model, view, script AJAX, dan pencatatan riwayat. 

Selain masalah identitas ganda, basis data mengalami denormalisasi dan redundansi struktural:
1. `reports.current_assigned_user_id` disimpan langsung pada tabel `reports`, meskipun tabel `report_assignments` sudah mencatat mutasi penugasan. Hal ini menyebabkan dependensi ganda, beban pembaruan dua arah, dan query pembacaan yang mengabaikan histori penugasan formal.
2. `reports.current_region_id` disimpan pada tabel `reports`, menciptakan kerancuan semantik antara wilayah geografis tempat gangguan dilaporkan (`reported_region_id`) dengan wilayah kerja personil yang ditugaskan.
3. Tabel `report_assignments` menduplikasi informasi wilayah personil dalam kolom `from_region_id` dan `to_region_id`, padahal wilayah personil sudah melekat pada `users.region_id`.
4. Media dan bukti lampiran (`report_attachments`) belum memiliki klasifikasi tipe fungsional yang eksplisit antara berkas bukti pelapor awal dari Telegram dengan berkas bukti pekerjaan penanganan (*completion evidence*) yang diunggah oleh eksekutor di dashboard web.
5. Tabel riwayat audit (`report_logs`) belum memiliki batasan proteksi integritas yang tegas terhadap penghapusan kaskade.

Untuk memperkuat integritas data akademik dan operasional, disepakati bahwa skema basis data harus dinormalisasi, identitas tiket disatukan pada `ticket_id`, dan seluruh dependensi logika bisnis diselaraskan tanpa mengubah alur kerja utama operasional penanganan tiket.

## Problem Statement
1. **Ambiguitas Identitas Laporan (*Dual Identity*)**: Keberadaan `reports.id` (`BIGINT`) dan `reports.ticket_id` (`VARCHAR(100)`) menimbulkan fragmentasi arsitektur. Rute controller menggunakan parameter `/:id`, namun tampilan antarmuka dan laporan Telegram menggunakan `ticket_id`. Parameter query, AJAX modal, dan referensi foreign key terpecah antara integer dan string bisnis.
2. **Denormalisasi Penugasan & Celah Inkonsistensi**: Kolom `reports.current_assigned_user_id` menduplikasi informasi penugasan. Setiap aksi `take`, `delegate`, dan `cancelAssignment` harus memperbarui `reports` dan `report_assignments` secara simultan. Query pembacaan antrean kerja, dashboard, dan kontrol otorisasi masih membaca `reports.current_assigned_user_id`, sehingga `report_assignments` belum berfungsi penuh sebagai *single source of truth*.
3. **Kerancuan Definisi Wilayah Laporan dan Penugasan**: Keberadaan `reports.current_region_id` mencampuradukkan konsep wilayah asal gangguan dengan wilayah personil penangan. Ditambah lagi, keberadaan `from_region_id` dan `to_region_id` pada `report_assignments` menyimpan salinan redundan dari wilayah user. Wilayah asal tiket bersifat tetap (`reported_region_id`), sedangkan personil eksekutor terikat pada wilayahnya sendiri (`users.region_id`) atau wilayah penugasan sementara (F007).
4. **Redundansi dan Duplikasi Logika Lampiran Backend**:
   - Fungsi `completeReport()` pada `models/reportModel.js` melakukan `INSERT` SQL langsung ke tabel `report_attachments`, alih-alih memanfaatkan fungsi terpusat `createAttachment()` yang sudah tersedia di `models/attachmentModel.js`.
   - Terdapat implementasi ganda pengambilan lampiran antara `reportModel.getAttachmentsByReportId()` dan `attachmentModel.getAttachmentsByReportId()`.
5. **Ketiadaan Klasifikasi Tipe Fungsional Lampiran & Risiko Hardcoded ID**: Tabel `report_attachments` hanya memiliki kolom `source` (`telegram` vs `manual`), yang hanya mencerminkan kanal input teknis. Belum ada pembeda tipe fungsional antara bukti keluhan pelapor (`bukti_pelapor`) dengan bukti perbaikan teknis eksekutor (`bukti_penanganan`). Penambahan relasi tipe lampiran berisiko menimbulkan *hardcoded ID* (misal ID 1 atau 2) jika tidak dikunci dengan *business key* berbasis kode string.
6. **Anomali Data Historis Lampiran Eksisting**: Sebanyak 48 baris data lampiran eksisting memiliki anomali (13 baris dengan `source` kosong/NULL, dan 12 baris `source = 'telegram'` namun memiliki `uploaded_by_user_id`). Melakukan *blind backfill* hanya berdasarkan kolom `source` akan merusak akurasi data historis.
7. **Keterikatan Foreign Key Child Table pada Integer**: Tabel `report_assignments`, `report_logs`, `report_attachments`, dan `telegram_pending_media` masih terikat pada `reports.id`.
8. **Kerapuhan Integritas Audit Trail**: Penggunaan `ON DELETE CASCADE` pada `report_logs` berisiko memusnahkan riwayat audit jika data induk terhapus.
9. **Ketergantungan Polling F031 pada Auto-Increment**: Endpoint `GET /reports/check-new` mengandalkan kondisi SQL `reports.id > ?` dan `MAX(reports.id)`. Jika `reports.id` dihilangkan, polling memerlukan desain kursor baru yang deterministik.

## Goals
1. Menjadikan `reports.ticket_id` (`VARCHAR(100)`) sebagai PRIMARY KEY dan identifier tunggal laporan di seluruh lapisan sistem.
2. Memigrasikan seluruh *child tables* (`report_assignments`, `report_logs`, `report_attachments`, dan buffer `telegram_pending_media`) untuk menggunakan referensi foreign key ke `reports.ticket_id`.
3. Menjadikan tabel `report_assignments` sebagai *single source of truth* penugasan aktif (`is_active = 1`).
4. Mengeliminasi kolom redundant `reports.current_assigned_user_id` dari target skema.
5. Mengeliminasi kolom redundant `reports.current_region_id` dari target skema, mempertahankan `reports.reported_region_id` sebagai identitas wilayah asal gangguan fisik, dan menurunkan wilayah personil secara relasional melalui `users.region_id -> regions`.
6. Menghapus kolom `from_region_id` dan `to_region_id` dari `report_assignments` sesuai ERD final.
7. Memperbarui tabel buffer `telegram_pending_media` dari `linked_report_id` (`BIGINT`) menjadi `linked_ticket_id` (`VARCHAR(100)`), mempertahankan enum status `pending`, `linked`, `expired`.
8. Membangun tabel master `type_attachment` dengan kolom `code` sebagai *business key* unik, serta menambahkan `type_attachment_id` pada `report_attachments` untuk memisahkan bukti pelapor (`code = 'bukti_pelapor'`) dan bukti penanganan (`code = 'bukti_penanganan'`) tanpa ketergantungan pada numeric ID hardcoded.
9. Mempertahankan nilai kolom teknis `source` pada lampiran (`telegram` dan `manual`) dengan aturan kepemilikan unggahan yang presisi untuk data baru:
   - Lampiran Telegram/pelapor: `source = 'telegram'`, tipe bukti bersesuaian dengan `code = 'bukti_pelapor'`, `uploaded_by_user_id = NULL`.
   - Lampiran internal penanganan: `source = 'manual'`, tipe bukti bersesuaian dengan `code = 'bukti_penanganan'`, `uploaded_by_user_id = currentUser.id`.
10. Melindungi data historis lampiran eksisting (48 rekaman) melalui proses audit dan klasifikasi terverifikasi, serta melarang *blind backfill*.
11. Melindungi tabel riwayat audit `report_logs` dari penghapusan kaskade (`ON DELETE RESTRICT` atau `NO ACTION`).
12. Mengonsolidasikan seluruh operasi basis data lampiran ke `models/attachmentModel.js` dan menghapus redundansi SQL di `reportModel.js`.
13. Mempertahankan nama kolom waktu `received_at` pada `reports` dan mendesain ulang mekanisme kursor pada endpoint polling `GET /reports/check-new` agar bekerja secara deterministik berbasis `received_at` dan `ticket_id`.
14. Menstandarisasi parameter rute, controller, payload AJAX, dan tampilan antarmuka agar konsisten mengonsumsi `ticket_id`.

## Important Boundary
F033 adalah spesifikasi normalisasi data dan penataan arsitektur backend. Selama proses perancangan dan implementasi nantinya, batasan berikut WAJIB dipatuhi:

1. **Tidak mengubah alur bisnis utama ticketing**:
   - Tidak mengubah status lifecycle tiket: `tersedia`, `diambil`, `didelegasikan`, `selesai`, `perlu_tindak_lanjut`, `eskalasi`.
   - Status `baru` tetap tidak digunakan dalam alur aktif (tiket Telegram langsung berstatus `tersedia`).
   - Tidak mengubah aturan operasional delegasi antar wilayah (PDG <-> BKT) dan kewenangan koordinator.
   - Tidak mengubah formula metrik KPI Supervisor (F004), serta hak Supervisor yang tetap read-only.
2. **Tidak mengubah logika integrasi Telegram Bot**:
   - Aturan intake dan parsing bot (D-011, D-018) tetap dipertahankan.
   - Format feedback Telegram yang dikirimkan ke grup/pelapor tidak diubah.
3. **Tidak mengubah aturan Temporary Region Switch (F007)**:
   - Pengajuan oleh Eksekutor dan persetujuan oleh Koordinator tetap bekerja sesuai aturan F007.
4. **Tidak melakukan rename kolom waktu**:
   - Kolom waktu intake laporan tetap menggunakan `received_at`. Tidak dilakukan rename menjadi `reported_at`.
5. **Tidak mengubah enum status pending media**:
   - Enum status `telegram_pending_media` tetap menggunakan `pending`, `linked`, `expired`.
6. **Tidak memperkenalkan library/framework eksternal baru**:
   - Tetap menggunakan Node.js, Express.js, EJS, Bootstrap 5, MySQL via `mysql2/promise`, dan CommonJS.
   - Dilarang memperkenalkan ORM (Prisma, Sequelize, TypeORM).
7. **Keamanan Eksekusi**:
   - Dokumen ini HANYA merupakan tahap perencanaan dan spesifikasi teknis.
   - Dilarang memodifikasi kode sumber aplikasi, mengeksekusi migrasi, atau mengubah skema basis data pada tahap ini.

---

## Current State (Fakta Audit Database Aktual)
Berdasarkan audit database aktual (`db_penanganan_gangguan`), kondisi skema dan data saat ini adalah sebagai berikut:

### 1. Statistik Data Saat Audit
- `reports`: 54 baris data (0 baris `ticket_id` null/kosong, 0 duplicate `ticket_id`).
- `report_assignments`: 55 baris data (0 orphan).
- `report_logs`: 329 baris data (0 orphan).
- `report_attachments`: 48 baris data (0 orphan).
- `manual_non_ticketing_reports`: 4 baris data.

### 2. Struktur Skema Aktual
```sql
-- 1. Tabel reports saat ini (berdasarkan audit aktual)
CREATE TABLE reports (
  id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(100) NOT NULL UNIQUE,
  source_channel ENUM('telegram') NOT NULL DEFAULT 'telegram',
  status_internal ENUM('baru','tersedia','diambil','didelegasikan','selesai','perlu_tindak_lanjut','eskalasi') NOT NULL DEFAULT 'tersedia',
  reported_region_id INT(11) NULL,            -- Nullable pada database aktual
  current_region_id INT(11) NULL,             -- Redundant: nullable pada database aktual
  current_assigned_user_id INT(11) NULL,      -- Redundant: FK users.id (nullable pada database aktual)
  received_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP(), -- Terverifikasi: DATETIME NULL DEFAULT CURRENT_TIMESTAMP()
  taken_at DATETIME NULL,
  resolved_at DATETIME NULL,
  closed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Child tables saat ini masih merujuk reports.id (BIGINT)
CREATE TABLE report_assignments (
  id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
  report_id BIGINT(20) NOT NULL,              -- FK ke reports.id
  assigned_to_user_id INT(11) NOT NULL,       -- FK ke users.id
  assigned_by_user_id INT(11) NOT NULL,       -- FK ke users.id
  from_region_id INT(11) NOT NULL,            -- FK ke regions.id (duplikasi region user)
  to_region_id INT(11) NOT NULL,              -- FK ke regions.id (duplikasi region user)
  assignment_type ENUM('self_take','delegation','reassignment') NOT NULL,
  notes TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  assigned_at DATETIME NOT NULL
);

CREATE TABLE report_logs (
  id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
  report_id BIGINT(20) NOT NULL,              -- FK ke reports.id
  user_id INT(11),                            -- FK ke users.id
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL
);

CREATE TABLE report_attachments (
  id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
  report_id BIGINT(20) NOT NULL,              -- FK ke reports.id
  source ENUM('telegram','manual') NULL,      -- Terdapat 13 data eksisting dengan source kosong/NULL
  telegram_file_id VARCHAR(255),
  telegram_file_unique_id VARCHAR(255),
  file_type VARCHAR(50),
  uploaded_by_user_id INT(11) NULL,           -- Terdapat 12 data Telegram dengan uploaded_by_user_id terisi
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  original_name VARCHAR(255),
  stored_name VARCHAR(255),
  file_size BIGINT(20),
  caption TEXT,
  created_at DATETIME NOT NULL
);

CREATE TABLE telegram_pending_media (
  id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
  chat_id VARCHAR(64) NOT NULL,
  status ENUM('pending','linked','expired') NOT NULL DEFAULT 'pending', -- Terverifikasi aktual: pending, linked, expired
  linked_report_id BIGINT(20),                -- FK ke reports.id
  created_at DATETIME NOT NULL,
  linked_at DATETIME NULL
);
```

### 3. Anomali Data Historis Aktual pada `report_attachments`
Distribusi 48 rekaman lampiran saat ini:
- `source` kosong/NULL = **13 baris**.
- `source = 'telegram'` = **33 baris**:
  - Tanpa `uploaded_by_user_id` (NULL) = 21 baris.
  - Dengan `uploaded_by_user_id` terisi user internal = 12 baris.
- `source = 'manual'` = **2 baris** (keduanya memiliki `uploaded_by_user_id`).

### 4. Temuan Teknis Backend
- `completeReport()` pada `models/reportModel.js` membaca `current_region_id` dan `current_assigned_user_id`, lalu mengeksekusi `INSERT INTO report_attachments` secara inline dengan SQL manual (menggunakan `source = 'manual'`).
- `models/attachmentModel.js` memiliki `createAttachment()` dan `getAttachmentsByReportId()`, namun `reportModel.js` juga memiliki fungsi duplikat `getAttachmentsByReportId()`.
- Polling `GET /reports/check-new` mengecek data baru dengan klausa `WHERE reports.id > ?` dan `COALESCE(MAX(reports.id), ?)`.
- Query antrean kerja dan dashboard (`models/reportModel.js`, `models/dashboardModel.js`, `models/supervisorModel.js`) masih melakukan join dan filtering menggunakan `reports.current_region_id` dan `reports.current_assigned_user_id`.
- File model `models/assignmentModel.js` dan `models/logModel.js` saat ini berukuran 0 byte (kosong); seluruh logika assignment dan log saat ini terkonsentrasi di `reportModel.js`.

---

## Target State (Sesuai ERD Final & Hasil Audit)
Struktur skema ternormalisasi yang disepakati sesuai ERD Final yang diselaraskan dengan verifikasi database:

```sql
-- 1. Tabel master type_attachment baru (klasifikasi bukti lampiran)
CREATE TABLE type_attachment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,           -- Business Key: 'bukti_pelapor', 'bukti_penanganan'
  name VARCHAR(100) NOT NULL,                 -- Label deskriptif: 'Bukti Pelapor (Telegram)', 'Bukti Penanganan (Sistem)'
  description TEXT
);

-- 2. Tabel reports ternormalisasi (ticket_id sebagai PRIMARY KEY tunggal, kolom waktu received_at)
CREATE TABLE reports (
  ticket_id VARCHAR(100) NOT NULL PRIMARY KEY, -- ticket_id menjadi PRIMARY KEY tunggal
  source_channel ENUM('telegram') NOT NULL DEFAULT 'telegram',
  fallout_type VARCHAR(100),
  order_id VARCHAR(100),
  sc_number VARCHAR(100),
  service_type VARCHAR(100),
  segment VARCHAR(100),
  provider VARCHAR(100),
  failure_area VARCHAR(100),
  branch_name VARCHAR(100),
  contact_name VARCHAR(100),
  sto VARCHAR(50),
  summary TEXT NOT NULL,
  symptom TEXT,
  complaint_notes TEXT,
  completion_status VARCHAR(100),
  idle_code VARCHAR(100),
  status_crm VARCHAR(100),
  status_rkessom VARCHAR(100),
  status_internal ENUM('baru','tersedia','diambil','didelegasikan','selesai','perlu_tindak_lanjut','eskalasi') NOT NULL DEFAULT 'tersedia',
  reported_region_id INT,                     -- Satu-satunya wilayah resmi laporan (asal fisik gangguan)
  -- Kolom id (BIGINT) DIHAPUS setelah migrasi selesai
  -- Kolom current_region_id DIHAPUS
  -- Kolom current_assigned_user_id DIHAPUS
  telegram_chat_id VARCHAR(100),
  telegram_message_id VARCHAR(100),
  telegram_sender_id VARCHAR(100),
  telegram_sender_username VARCHAR(100),
  telegram_sender_first_name VARCHAR(100),
  telegram_sender_last_name VARCHAR(100),
  received_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP(), -- Kolom stempel waktu resmi intake laporan (tanpa rename)
  taken_at DATETIME NULL,
  resolved_at DATETIME NULL,
  closed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_reported_region FOREIGN KEY (reported_region_id) REFERENCES regions(id)
);

-- 3. Child tables menggunakan ticket_id VARCHAR(100) sebagai Foreign Key

-- report_assignments: Single source of truth penugasan (tanpa from_region_id / to_region_id)
CREATE TABLE report_assignments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(100) NOT NULL,            -- FK ke reports.ticket_id
  assigned_to_user_id INT NOT NULL,           -- Single source of truth penanggung jawab
  assigned_by_user_id INT,
  assignment_type ENUM('self_take','delegation','reassignment') NOT NULL,
  notes TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,    -- 1 = penugasan aktif, 0 = riwayat/selesai/dibatalkan
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- from_region_id dan to_region_id DIHAPUS TOTAL sesuai ERD Final
  CONSTRAINT fk_assignments_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_assigned_to FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
  CONSTRAINT fk_assignments_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users(id)
);

-- report_logs: Histori audit trail terlindungi (TIDAK menggunakan ON DELETE CASCADE)
CREATE TABLE report_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(100) NOT NULL,            -- FK ke reports.ticket_id
  user_id INT,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE RESTRICT,
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- report_attachments: Terhubung ke ticket_id dan type_attachment.id
CREATE TABLE report_attachments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(100) NOT NULL,            -- FK ke reports.ticket_id
  type_attachment_id INT NOT NULL,            -- FK ke type_attachment.id
  source ENUM('telegram','manual') NOT NULL,  -- 'telegram' untuk bot, 'manual' untuk dashboard web
  telegram_file_id VARCHAR(255),
  telegram_file_unique_id VARCHAR(255),
  file_type VARCHAR(50),
  uploaded_by_user_id INT NULL,               -- NULL untuk bot pelapor, userId untuk upload internal
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  original_name VARCHAR(255),
  stored_name VARCHAR(255),
  file_size BIGINT,
  caption TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attachments_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE CASCADE,
  CONSTRAINT fk_attachments_type FOREIGN KEY (type_attachment_id) REFERENCES type_attachment(id),
  CONSTRAINT fk_attachments_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- telegram_pending_media: Penyangga media bot unlinked
CREATE TABLE telegram_pending_media (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chat_id VARCHAR(64) NOT NULL,
  status ENUM('pending','linked','expired') NOT NULL DEFAULT 'pending', -- Status terverifikasi aktual
  linked_ticket_id VARCHAR(100) NULL,         -- FK ke reports.ticket_id
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  linked_at DATETIME NULL,
  CONSTRAINT fk_pending_media_ticket FOREIGN KEY (linked_ticket_id) REFERENCES reports(ticket_id) ON DELETE SET NULL
);
```

---

## Business Rules

### 1. Report Identity Rules
- `reports.ticket_id` (`VARCHAR(100)`) adalah PRIMARY KEY dan identifier tunggal laporan di seluruh komponen sistem.
- Nilai `ticket_id` bersifat unik (*unique*), tidak boleh null/kosong (*not null*), dan bersifat tetap (*immutable*) sepanjang siklus hidup tiket.
- Seluruh rute web penanganan tiket menggunakan format semantik `/reports/:ticketId/*`.
- Seluruh payload respon JSON dan atribut data antarmuka (DOM dataset) menggunakan `ticketId`.

### 2. Assignment Rules (Single Source of Truth)
- Penanggung jawab laporan hanya dapat ditentukan melalui tabel `report_assignments`. Kolom `reports.current_assigned_user_id` tidak lagi digunakan.
- Sebuah tiket yang berstatus `tersedia` **TIDAK MEMILIKI** baris penugasan aktif (`is_active = 1`).
- Pada tiket berstatus `diambil` atau `didelegasikan`, **HARUS ADA TEPAT SATU** baris pada `report_assignments` dengan `ticket_id = ? AND is_active = 1`. Baris ini merepresentasikan penanggung jawab aktif (`assigned_to_user_id`).
- Transisi Penugasan (Bebas dari `from_region_id` / `to_region_id`):
  - **Self-Take**: INSERT baris baru pada `report_assignments` dengan `is_active = 1`, `assignment_type = 'self_take'`, `assigned_to_user_id = currentUser.id`, `assigned_by_user_id = currentUser.id`.
  - **Delegasi**: UPDATE baris aktif lama (`is_active = 1`) menjadi `is_active = 0`. Kemudian INSERT baris baru dengan `is_active = 1`, `assignment_type = 'delegation'`, `assigned_to_user_id = targetUserId`, `assigned_by_user_id = koordinator.id`.
  - **Pembatalan Penugasan (Cancel Assignment)**: UPDATE baris aktif (`is_active = 1`) menjadi `is_active = 0`. Status tiket kembali menjadi `tersedia`. Tidak ada baris aktif baru yang dibuat.
  - **Penyelesaian / Eskalasi / Tindak Lanjut**: Baris penugasan aktif yang menangani tiket tetap mempertahankan `is_active = 1` sebagai rekaman penanggung jawab terakhir saat status ditetapkan.
- Query relasional untuk memperoleh penanggung jawab aktif dan wilayah kerjanya:
  ```sql
  LEFT JOIN report_assignments ra 
    ON ra.ticket_id = reports.ticket_id 
   AND ra.is_active = 1
  LEFT JOIN users assigned_user 
    ON ra.assigned_to_user_id = assigned_user.id
  LEFT JOIN regions assigned_user_region
    ON assigned_user.region_id = assigned_user_region.id
  ```

### 3. Region Rules
- Tiga konsep wilayah dipisahkan secara tegas:
  1. **Wilayah asal gangguan fisik**: `reports.reported_region_id`. Nilai ini melekat pada gangguan dan bersifat *immutable* (tidak pernah berubah saat tiket diambil atau didelegasikan).
  2. **Wilayah home user penanggung jawab**: `users.region_id`. Melekat pada personil eksekutor/koordinator.
  3. **Akses penugasan wilayah sementara**: `region_switch_requests` (mekanisme F007).
- Sesuai target ERD final, **`from_region_id` dan `to_region_id` dihapus total dari `report_assignments`**. Wilayah penanggung jawab tidak lagi disalin secara redundan, melainkan diperoleh murni via relasi `assigned_to_user_id -> users.id -> users.region_id -> regions.id`.
- Hak Akses Eksekutor:
  - Eksekutor dapat melihat dan mengambil tiket `tersedia` jika `reports.reported_region_id` termasuk dalam wilayah yang diizinkan (home region `currentUser.region_id` atau extra region F007 yang aktif dan disetujui).
  - Eksekutor dapat memproses tiket berjalan jika terdapat penugasan aktif di mana `ra.assigned_to_user_id = currentUser.id`.
- Hak Akses Koordinator:
  - Koordinator memiliki hak pengawasan operasional lintas wilayah kerja (PDG dan BKT).
  - Validasi wilayah aksi koordinator diperiksa terhadap `reports.reported_region_id`.

### 4. Attachment Rules
- Setiap lampiran pada `report_attachments` wajib memiliki `ticket_id`, `type_attachment_id`, `source`, dan `uploaded_by_user_id` (jika diunggah internal).
- **Klasifikasi Tipe Lampiran (`type_attachment`)**:
  - Kolom `code` bertindak sebagai *business key* unik:
    1. `code = 'bukti_pelapor'`: Berkas atau foto keluhan yang dikirimkan oleh pelapor gangguan melalui Bot Telegram saat tiket dibuat atau melalui pesan pengayaan (*enrichment*).
    2. `code = 'bukti_penanganan'`: Berkas bukti perbaikan fisik, formulir Berita Acara (BA), atau foto hasil pengukuran yang diunggah oleh eksekutor/koordinator melalui form web saat penyelesaian tiket (`completeReport`).
  - **Larangan Hardcoding Numeric ID**: Dilarang keras menuliskan kode bisnis yang mengasumsikan `type_attachment_id = 1` atau `2`. Seluruh modul backend, bot service, dan controller wajib melakukan lookup ID berbasis `type_attachment.code` secara dinamis (misal melalui caching atau fungsi pembantu `attachmentModel.getTypeIdByCode(code)`).
- **Aturan Sumber dan Pengunggah untuk Data Baru**:
  - Lampiran Telegram: `source = 'telegram'`, tipe bukti bersesuaian dengan `code = 'bukti_pelapor'`, `uploaded_by_user_id = NULL`.
  - Lampiran Web Dashboard: `source = 'manual'`, tipe bukti bersesuaian dengan `code = 'bukti_penanganan'`, `uploaded_by_user_id = currentUser.id`.
- **Kebijakan Data Historis Lampiran Eksisting (Historical Anomaly)**:
  - Audit membuktikan bahwa 48 baris data lampiran eksisting memiliki anomali (13 baris `source` kosong, 12 baris Telegram dengan `uploaded_by_user_id` terisi user internal).
  - **Dilarang melakukan blind backfill** hanya dengan aturan `source = telegram -> bukti_pelapor` dan `source = manual -> bukti_penanganan`.
  - Data historis yang ambigu wajib diaudit dan diverifikasi secara bertahap sebelum migrasi dieksekusi:
    - 13 data dengan `source` kosong ditelusuri keberadaan `telegram_file_id` dan log auditnya.
    - 12 data Telegram ber-uploader internal ditelusuri riwayat transaksinya.
    - Data yang belum terverifikasi secara valid diisolasi/diberi penanda audit khusus sebelum `type_attachment_id` ditetapkan.
- Sentralisasi Akses: Seluruh manipulasi dan pembacaan lampiran wajib dikelola oleh `models/attachmentModel.js`. Dilarang melakukan query SQL inline di model lain.

### 5. Report Logs Rules
- Seluruh catatan riwayat audit pada `report_logs` menggunakan `ticket_id VARCHAR(100)`.
- **Perlindungan Audit Trail**: Foreign key dari `report_logs` ke `reports(ticket_id)` menggunakan `ON DELETE RESTRICT` (atau `NO ACTION`). Data riwayat penanganan dilarang menggunakan `ON DELETE CASCADE` guna mencegah hilangnya bukti audit operasional secara tidak sengaja.

### 6. Pending Media Rules
- Berkas media Telegram yang masuk sebelum nomor tiket teridentifikasi disimpan pada `telegram_pending_media` dengan status `'pending'`.
- Status enum pada tabel ini tetap mempertahankan nilai terverifikasi: `'pending'`, `'linked'`, `'expired'`.
- Kolom pengait diperbarui dari `linked_report_id` (`BIGINT`) menjadi `linked_ticket_id` (`VARCHAR(100)`).
- Saat nomor tiket teridentifikasi dan dipasangkan, sistem mengaitkan media dengan memperbarui `linked_ticket_id = report.ticket_id`, mengubah status menjadi `'linked'`, dan membuat rekaman di `report_attachments` dengan merujuk `code = 'bukti_pelapor'`, `source = 'telegram'`, dan `uploaded_by_user_id = NULL`.

### 7. Deterministic Cursor Polling Rules (F031 Redesign)
- Endpoint polling `GET /reports/check-new` tidak dapat menggunakan string comparison naif `ticket_id > ?`.
- Mekanisme kursor deterministik menggunakan stempel waktu resmi intake laporan `received_at` yang dipadukan dengan `ticket_id` sebagai pemutus seri (*tie-breaker*):
  - Klien mengirimkan kursor komposit: `since_received_at` dan `since_ticket_id`.
  - Pengecekan data baru pada database menggunakan klausa:
    ```sql
    WHERE (
      reports.received_at > :since_received_at
      OR (reports.received_at = :since_received_at AND reports.ticket_id > :since_ticket_id)
    )
    ```
  - Endpoint `check-new` mengembalikan `latest_received_at` dan `latest_ticket_id` dari baris terbaru untuk dijadikan kursor polling berikutnya.

---

## Database Design Changes
Perbandingan spesifikasi teknis tabel sebelum dan sesudah normalisasi:

| Tabel | Skema Lama (Fakta Aktual) | Skema Target (F033 / ERD Final Terverifikasi) | Keterangan Perubahan |
| :--- | :--- | :--- | :--- |
| `type_attachment` | *Belum ada* | `id` (PK, INT), `code` (VARCHAR(50) UNIQUE), `name` (VARCHAR(100)), `description` (TEXT) | Master baru klasifikasi bukti lampiran |
| `reports` | `id` (PK, BIGINT Auto-inc)<br>`ticket_id` (UNIQUE, VARCHAR(100))<br>`current_region_id` (INT NULL)<br>`current_assigned_user_id` (INT NULL)<br>`reported_region_id` (INT NULL)<br>`received_at` (DATETIME NULL) | `ticket_id` (PK, VARCHAR(100))<br>`reported_region_id` (INT FK to regions)<br>`received_at` (DATETIME NULL DEFAULT CURRENT_TIMESTAMP()) | `id` dihapus, `ticket_id` menjadi PK tunggal, kolom redundant dihapus, `received_at` dipertahankan tanpa rename |
| `report_assignments` | `id` (PK, BIGINT)<br>`report_id` (BIGINT FK)<br>`from_region_id` (INT FK)<br>`to_region_id` (INT FK) | `id` (PK, BIGINT)<br>`ticket_id` (VARCHAR(100) FK) | Mengubah FK ke `ticket_id`, menghapus total `from_region_id` dan `to_region_id` |
| `report_logs` | `id` (PK, BIGINT)<br>`report_id` (BIGINT FK) | `id` (PK, BIGINT)<br>`ticket_id` (VARCHAR(100) FK, ON DELETE RESTRICT) | Mengubah FK ke `ticket_id`, proteksi audit trail tanpa CASCADE |
| `report_attachments` | `id` (PK, BIGINT)<br>`report_id` (BIGINT FK) | `id` (PK, BIGINT)<br>`ticket_id` (VARCHAR(100) FK)<br>`type_attachment_id` (INT FK) | Mengubah FK ke `ticket_id`, penambahan klasifikasi tipe bukti lampiran |
| `telegram_pending_media` | `id` (PK, BIGINT)<br>`linked_report_id` (BIGINT FK)<br>`status` ENUM('pending','linked','expired') | `id` (PK, BIGINT)<br>`linked_ticket_id` (VARCHAR(100) FK)<br>`status` ENUM('pending','linked','expired') | Mengubah FK ke `ticket_id`, status enum tetap konsisten |

Indeks Basis Data Target:
1. `reports`:
   - `PRIMARY KEY (ticket_id)`
   - `INDEX idx_reports_reported_region_status (reported_region_id, status_internal)`
   - `INDEX idx_reports_received_ticket (received_at, ticket_id)` -- Mendukung polling deterministik
   - `INDEX idx_reports_status_internal (status_internal)`
2. `report_assignments`:
   - `PRIMARY KEY (id)`
   - `INDEX idx_assignments_ticket_active (ticket_id, is_active)` -- Indeks kritis single source of truth
   - `INDEX idx_assignments_user_active (assigned_to_user_id, is_active)`
   -- TIDAK ADA indeks untuk from_region_id atau to_region_id
3. `report_attachments`:
   - `PRIMARY KEY (id)`
   - `INDEX idx_attachments_ticket_type (ticket_id, type_attachment_id)`
   - `INDEX idx_attachments_uploaded_by (uploaded_by_user_id)`
4. `report_logs`:
   - `PRIMARY KEY (id)`
   - `INDEX idx_logs_ticket_created (ticket_id, created_at)`
5. `telegram_pending_media`:
   - `PRIMARY KEY (id)`
   - `INDEX idx_pending_media_chat_status (chat_id, status)`
   - `INDEX idx_pending_media_linked_ticket (linked_ticket_id)`

---

## Backend Impact
Komponen backend yang terpengaruh dan memerlukan penyesuaian:

1. **`models/reportModel.js`**:
   - Menghapus pembacaan dan pembaruan `current_region_id` dan `current_assigned_user_id`.
   - Mengubah `findByTicketId()` dan `getReportById()` menjadi `getReportByTicketId(ticketId)`.
   - Menghapus ketergantungan pada `from_region_id` dan `to_region_id` pada query penugasan (`takeReport`, `delegateReport`, `cancelAssignment`).
   - Menyesuaikan `getReports()`, `countReportsByWorkStatuses()`, dan `getNewReportStats()` agar membaca penanggung jawab aktif via `report_assignments (is_active = 1)` dan wilayah penanggung jawab via `users.region_id`.
   - Tetap menggunakan `received_at` sebagai stempel waktu intake laporan pada query sortir antrean.
   - Menghapus query inline `INSERT INTO report_attachments` pada `completeReport()`, menggantikannya dengan delegasi panggilan ke `attachmentModel.createAttachment()`.
   - Menghapus implementasi duplikat `getAttachmentsByReportId()`.
2. **`models/attachmentModel.js`**:
   - Menyediakan fungsi lookup dinamis `getTypeIdByCode(code)` untuk memperoleh ID berdasarkan kode bisnis (`bukti_pelapor` / `bukti_penanganan`).
   - Memperbarui `createAttachment()` untuk menerima `ticket_id` dan `type_attachment_id`.
   - Memperbarui `getAttachmentsByReportId()` menjadi `getAttachmentsByTicketId(ticketId)` dengan join ke `type_attachment`.
3. **`models/pendingMediaModel.js`**:
   - Memperbarui fungsi `markPendingMediaLinked(id, ticketId)` untuk mengaitkan berkas ke `linked_ticket_id`.
   - Mempertahankan status enum `'pending'`, `'linked'`, `'expired'`.
4. **`models/dashboardModel.js`**:
   - Memperbarui seluruh query metrik ringkasan dan antrean terbaru agar tidak membaca `current_assigned_user_id` atau `current_region_id`, melainkan melakukan join ke `report_assignments` dengan kondisi `is_active = 1` dan join ke `users.region_id`.
   - Tetap menggunakan `received_at` untuk agregasi waktu laporan.
5. **`models/supervisorModel.js`**:
   - Mengubah pembacaan metrik KPI dan filter wilayah agar merujuk ke `rep.reported_region_id` dan penanggung jawab aktif via `report_assignments`.
   - Tetap menggunakan `rep.received_at` untuk penghitungan metrik durasi (`TIMESTAMPDIFF(MINUTE, rep.received_at, rep.taken_at)`).
6. **Catatan Arsitektur Model Assignment dan Log**:
   - File `models/assignmentModel.js` dan `models/logModel.js` saat ini berukuran 0 byte. Penyesuaian F033 dapat tetap memusatkan query penugasan pada `reportModel.js` atau memodularisasikannya secara bersih ke model khusus sesuai konvensi MVC CommonJS yang ada.
7. **`controllers/reportController.js`**:
   - Menyelaraskan seluruh penerimaan parameter dari `req.params.id` menjadi `req.params.ticketId`.
   - Menyesuaikan handler endpoint polling `checkNewReports` untuk memproses kursor deterministik (`since_received_at`, `since_ticket_id`).
8. **`services/telegramBotService.js`**:
   - Memastikan pemanggilan `attachmentModel.createAttachment()` menyertakan `ticket_id`, resolusi ID via `code = 'bukti_pelapor'`, `source = 'telegram'`, dan `uploaded_by_user_id = NULL`.
   - Menyesuaikan linking pending media dengan `linked_ticket_id`.
9. **`services/telegramFeedbackService.js`**:
   - Memastikan pengambilan data tiket untuk pesan feedback Telegram berbasis pada `ticket_id`.

---

## Frontend & Route Impact
1. **Rute Aplikasi (`routes/reportRoutes.js`)**:
   - Rute diperbarui secara semantik berbasis `ticketId`:
     - `GET /reports/:ticketId`
     - `GET /reports/:ticketId/detail-json`
     - `POST /reports/:ticketId/take`
     - `POST /reports/:ticketId/in-progress`
     - `POST /reports/:ticketId/complete`
     - `POST /reports/:ticketId/delegate`
     - `POST /reports/:ticketId/cancel-assignment`
2. **Views & Partials**:
   - `views/reports/index.ejs`, `views/eksekutor/reports/index.ejs`, `views/koordinator/reports/index.ejs`: Seluruh tombol aksi, modal trigger, dan form action menggunakan `report.ticket_id`.
   - `views/partials/report-queue-fragment.ejs`: Atribut `data-ticket-id` menggantikan `data-report-id`. Elemen kontainer menyimpan kursor waktu `received_at` terbaru untuk polling.
   - `views/partials/report-detail-modal.ejs`: AJAX fetch memanggil `/reports/${ticketId}/detail-json`. Menampilkan label pemisah rapi antara "Bukti Pelapor (Telegram)" dan "Bukti Penanganan (Sistem)" berdasarkan relasi `type_attachment`.
3. **Frontend JavaScript**:
   - Script auto-refresh polling F031 membaca dataset kursor `since_received_at` dan `since_ticket_id` untuk diteruskan ke `check-new`.
   - Handler form submit pada modal konfirmasi aksi menyusun URL tujuan berbasis `ticketId`.

---

## Migration Strategy
Strategi migrasi data bertahap (*multi-stage zero-loss migration*) wajib diterapkan untuk menjamin keutuhan 54 laporan dan seluruh data riwayat:

1. **Tahap 1: Persiapan Skema & Tabel Master**:
   - Membuat tabel master `type_attachment` dan mengisi data awal (`code = 'bukti_pelapor'`, `name = 'Bukti Pelapor (Telegram)'`) dan (`code = 'bukti_penanganan'`, `name = 'Bukti Penanganan (Sistem)'`).
   - Menambahkan kolom baru bertipe `VARCHAR(100)` pada seluruh child tables:
     - `report_assignments.ticket_id`
     - `report_logs.ticket_id`
     - `report_attachments.ticket_id`
     - `report_attachments.type_attachment_id` (INT NULL)
     - `telegram_pending_media.linked_ticket_id`
2. **Tahap 2: Pengisian Data (*Backfill*) Terverifikasi & Audit Data Ambigu**:
   - Mengisi `ticket_id` pada seluruh child table melalui query:
     `UPDATE child_table c JOIN reports r ON c.report_id = r.id SET c.ticket_id = r.ticket_id;`
   - Memastikan 0 baris *orphan* (`ticket_id IS NULL`).
   - **Audit dan Pengisian `type_attachment_id` pada Data Historis**:
     - Lookup ID master secara dinamis melalui subquery berbasis `code`.
     - Data `source = 'manual'` dengan `uploaded_by_user_id IS NOT NULL` (2 baris) diisi dengan ID `code = 'bukti_penanganan'`.
     - Data `source = 'telegram'` tanpa `uploaded_by_user_id` (21 baris) diisi dengan ID `code = 'bukti_pelapor'`.
     - **Penanganan Data Ambigu**: 13 baris dengan `source` kosong dan 12 baris `source = 'telegram'` ber-uploader internal diaudit secara manual melalui log audit sebelum menetapkan `type_attachment_id`. Data yang tidak dapat dikonfirmasi tidak di-backfill secara buta.
3. **Tahap 3: Pembuatan Foreign Key & Pengalihan Kunci Utama**:
   - Menghapus foreign key lama yang mengarah ke `reports.id`.
   - Mengubah kunci utama tabel `reports` dari `id` menjadi `PRIMARY KEY (ticket_id)`.
   - Menambahkan foreign key baru dari child tables ke `reports(ticket_id)`:
     - `report_assignments(ticket_id)` -> `ON DELETE CASCADE`
     - `report_attachments(ticket_id)` -> `ON DELETE CASCADE`
     - `telegram_pending_media(linked_ticket_id)` -> `ON DELETE SET NULL`
     - `report_logs(ticket_id)` -> **`ON DELETE RESTRICT`** (proteksi riwayat audit trail).
   - Menambahkan foreign key `report_attachments(type_attachment_id)` ke `type_attachment(id)`.
4. **Tahap 4: Penyesuaian Kode Aplikasi & Pengujian**:
   - Menerapkan penyesuaian model, controller, rute, views, dan polling script.
   - Menjalankan regression testing menyeluruh pada environment staging.
5. **Tahap 5: Pembersihan Skema Kolom Usang (*Drop Legacy*)**:
   - Setelah sistem terbukti stabil 100%, menghapus kolom lama yang sudah tidak digunakan:
     - `ALTER TABLE reports DROP COLUMN id;`
     - `ALTER TABLE reports DROP COLUMN current_region_id;`
     - `ALTER TABLE reports DROP COLUMN current_assigned_user_id;`
     - `ALTER TABLE report_assignments DROP COLUMN report_id;`
     - `ALTER TABLE report_assignments DROP COLUMN from_region_id;` -- Dihapus sesuai ERD final
     - `ALTER TABLE report_assignments DROP COLUMN to_region_id;`   -- Dihapus sesuai ERD final
     - `ALTER TABLE report_logs DROP COLUMN report_id;`
     - `ALTER TABLE report_attachments DROP COLUMN report_id;`
     - `ALTER TABLE telegram_pending_media DROP COLUMN linked_report_id;`

---

## Risks & Mitigations
1. **Risiko Anomali Integritas Data Historis Lampiran**:
   - *Mitigasi*: Menolak *blind backfill*. Mengisolasi dan mengaudit 13 data ber-source kosong dan 12 data Telegram ber-uploader sebelum menerapkan constraint NOT NULL pada `type_attachment_id`.
2. **Risiko Kehilangan Riwayat Audit Trail**:
   - *Mitigasi*: Melarang penggunaan `ON DELETE CASCADE` pada `report_logs`. Menggunakan `ON DELETE RESTRICT`.
3. **Degradasi Performa Join Menggunakan String `ticket_id`**:
   - *Mitigasi*: Menyeragamkan tipe data (`VARCHAR(100)`), charset, dan collation (`utf8mb4_unicode_ci`) di seluruh tabel relasi, serta memasang indeks komposit penunjang.
4. **Disrupsi Polling Auto-Refresh (F031)**:
   - *Mitigasi*: Menggunakan kursor deterministik berbasis stempel waktu `received_at` dengan `ticket_id` sebagai tie-breaker.
5. **Regresi pada Query Dashboard dan Supervisor KPI**:
   - *Mitigasi*: Seluruh query metrik disaring secara eksplisit menggunakan kondisi penugasan aktif `is_active = 1` dan join ke `users.region_id`.

---

## Acceptance Criteria
1. Tabel `reports` memiliki `ticket_id` (`VARCHAR(100)`) sebagai PRIMARY KEY tunggal, dan kolom `id`, `current_region_id`, serta `current_assigned_user_id` berhasil dieliminasi dari target skema.
2. Kolom waktu resmi intake laporan pada `reports` adalah `received_at` (`DATETIME NULL DEFAULT CURRENT_TIMESTAMP()`), dan tidak ada perubahan/rename kolom menjadi `reported_at`.
3. Tabel master `type_attachment` terpasang dengan struktur `id`, `code` (business key unik), `name`, dan `description`, memuat data awal `bukti_pelapor` dan `bukti_penanganan`.
4. Tabel `report_assignments`, `report_logs`, dan `report_attachments` memiliki kolom `ticket_id` (`VARCHAR(100)`) yang terhubung via Foreign Key ke `reports.ticket_id`.
5. Tabel `report_assignments` **bebas dari kolom `from_region_id` dan `to_region_id`** sesuai target ERD final.
6. Tabel `report_logs` terproteksi sebagai riwayat audit trail dengan Foreign Key non-kaskade (`ON DELETE RESTRICT`).
7. Tabel `telegram_pending_media` memiliki kolom `linked_ticket_id` (`VARCHAR(100)`) yang terhubung ke `reports.ticket_id`, dengan nilai enum status `pending`, `linked`, `expired`.
8. Tabel `report_attachments` memiliki kolom `type_attachment_id` yang terhubung via Foreign Key ke `type_attachment.id`.
9. Logika backend dan service melakukan resolusi tipe lampiran berdasarkan kolom `code` secara dinamis, tanpa hardcoding angka ID 1 atau 2.
10. Seluruh lampiran baru dari Telegram tersimpan dengan resolusi `code = 'bukti_pelapor'`, `source = 'telegram'`, dan `uploaded_by_user_id = NULL`.
11. Seluruh lampiran baru penyelesaian tiket web tersimpan dengan resolusi `code = 'bukti_penanganan'`, `source = 'manual'`, dan `uploaded_by_user_id = currentUser.id`.
12. Data lampiran historis eksisting yang ambigu diaudit secara transparan dan tidak di-backfill secara buta.
13. Fungsi `completeReport()` tidak lagi memuat query inline `INSERT INTO report_attachments`, melainkan mendelegasikannya ke `attachmentModel.createAttachment()`.
14. Fungsi `getAttachmentsByReportId()` yang redundan di `reportModel.js` dihapus; seluruh pembacaan lampiran menggunakan fungsi terpusat di `attachmentModel.js`.
15. Penanggung jawab aktif laporan ditentukan secara konsisten dari baris `report_assignments` dengan kondisi `is_active = 1`.
16. Wilayah tiket hanya direpresentasikan oleh `reported_region_id`, dan wilayah penanggung jawab aktif diperoleh dari relasi `assigned_to_user_id -> users.region_id -> regions`.
17. Endpoint polling `GET /reports/check-new` berjalan deterministik menggunakan kursor komposit `received_at` dan `ticket_id` tanpa mengandalkan kolom auto-increment integer `reports.id`.
18. Seluruh rute antarmuka tiket menggunakan `/reports/:ticketId/*` dan modal detail menampilkan pemisahan bukti pelapor serta bukti penanganan secara akurat.
19. Seluruh regression test untuk alur intake Telegram, RBAC, dan filter antrean kerja lulus 100%.
