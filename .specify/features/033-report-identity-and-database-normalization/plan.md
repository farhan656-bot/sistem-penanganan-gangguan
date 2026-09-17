# Technical Plan — Report Identity and Database Normalization

## Feature ID
F033

## Feature Name
Report Identity and Database Normalization

## Objective
Mentransformasikan arsitektur identitas data laporan dan menormalisasi skema basis data secara menyeluruh dengan:
1. Menjadikan `reports.ticket_id` (`VARCHAR(100)`) sebagai PRIMARY KEY dan identifier tunggal pada seluruh entitas dan relasi *child table*.
2. Menjadikan tabel `report_assignments` sebagai *single source of truth* untuk seluruh informasi penugasan aktif (`is_active = 1`).
3. Mengeliminasi kolom denormalisasi `reports.current_assigned_user_id` dan `reports.current_region_id`.
4. Menghapus kolom redundan `from_region_id` dan `to_region_id` pada `report_assignments` sesuai ERD final, mempertahankan `reports.reported_region_id` sebagai wilayah asal gangguan, dan menurunkan wilayah kerja penanggung jawab secara relasional via `users.region_id -> regions`.
5. Mengintegrasikan tabel master `type_attachment` menggunakan kolom `code` sebagai *business key* (`bukti_pelapor` dan `bukti_penanganan`) tanpa hardcoded ID numerik, mengaudit 48 lampiran historis eksisting tanpa *blind backfill*, dan mengonsolidasikan seluruh manipulasi lampiran ke dalam `attachmentModel.js` dengan dukungan koneksi transaksi.
6. Melindungi integritas riwayat audit `report_logs` dari penghapusan kaskade (`ON DELETE RESTRICT`).
7. Mempertahankan kolom `received_at` dan mendesain ulang mekanisme kursor pada polling antrean kerja F031 agar bekerja secara deterministik berbasis `(received_at, ticket_id)` dari record yang sama.

---

## Important Boundary
F033 merupakan dokumen perencanaan teknis dan desain arsitektur. Selama fase perencanaan dan eksekusi nantinya, batasan berikut harus dijaga secara ketat:

- **Jangan ubah alur bisnis inti ticketing**: Lifecycle status tetap (`tersedia`, `diambil`, `didelegasikan`, `selesai`, `perlu_tindak_lanjut`, `eskalasi`). Status `baru` tetap tidak dipakai dalam alur aktif.
- **Jangan ubah status penugasan menjadi nonaktif pada tiket selesai**: Audit aktual dan kode `completeReport()` membuktikan bahwa penugasan aktif (`is_active = 1`) tetap dipertahankan pada status `selesai` sebagai catatan personil penyelesai tiket.
- **Jangan ubah logika intake bot Telegram**: Aturan parsing (D-011, D-018), format payload penerimaan, dan teks feedback ke pelapor tidak diubah.
- **Jangan ubah logika F007 Temporary Region Switch**: Aturan pengajuan oleh Eksekutor, persetujuan oleh Koordinator, dan masa berlaku akses sementara tetap dipertahankan.
- **Jangan ubah formula perhitungan KPI Supervisor (F004)**: Dashboard Supervisor tetap bersifat *read-only*.
- **Jangan rename kolom waktu intake laporan**: Tetap menggunakan `received_at` (`DATETIME NULL DEFAULT CURRENT_TIMESTAMP()`). Tidak melakukan rename ke `reported_at`.
- **Jangan ubah enum status pending media**: Tetap menggunakan `pending`, `linked`, `expired` (bukan `ignored`).
- **Jangan perkenalkan ORM**: Tetap menggunakan `mysql2/promise` dengan query SQL terpusat pada file model CommonJS.
- **Jangan ubah database atau source code secara langsung pada tahap ini**: Tidak mengeksekusi migrasi, DDL, atau manipulasi data live sebelum dokumen perencanaan disetujui.

---

## Current State vs Target State

### 1. Current State (Fakta Audit Database Aktual)
Berdasarkan audit aktual pada `db_penanganan_gangguan`:
- `reports`: 54 baris data, PK `id` (`BIGINT AUTO_INCREMENT`), `ticket_id` (`VARCHAR(100) NOT NULL UNIQUE`), 0 duplicate `ticket_id`, 0 null `ticket_id`. Kolom `reported_region_id`, `current_region_id`, dan `current_assigned_user_id` bertipe `INT(11) NULL`. Kolom waktu intake adalah `received_at` (`DATETIME NULL DEFAULT CURRENT_TIMESTAMP()`).
- `report_assignments`: 55 baris data (0 orphan). PK `id` (`BIGINT`), `report_id` (`BIGINT`), memuat `from_region_id` (`INT`) dan `to_region_id` (`INT`).
- `report_logs`: 329 baris data (0 orphan). PK `id` (`BIGINT`), `report_id` (`BIGINT`).
- `report_attachments`: 48 baris data (0 orphan). PK `id` (`BIGINT`), `report_id` (`BIGINT`). Belum memiliki `type_attachment_id`.
  - Distribusi data historis aktual:
    - `source = ''` (empty string): **13 baris** (`source IS NULL` = 0)
    - `source = 'telegram'`: **33 baris** (21 tanpa `uploaded_by_user_id`, 12 dengan `uploaded_by_user_id` terisi user internal)
    - `source = 'manual'`: **2 baris** (keduanya dengan `uploaded_by_user_id` terisi user internal)
- `telegram_pending_media`: PK `id` (`BIGINT`), `linked_report_id` (`BIGINT`), enum status: `'pending'`, `'linked'`, `'expired'`.
- `manual_non_ticketing_reports`: 4 baris data (tidak diubah dalam F033).

### 2. Target State (Sesuai ERD Final & Hasil Audit)
- `reports`: `ticket_id` (`VARCHAR(100)`) menjadi PRIMARY KEY mutlak. Kolom legacy `id`, `current_region_id`, dan `current_assigned_user_id` dihapus. `reported_region_id` dipertahankan sebagai wilayah fisik gangguan. Kolom waktu tetap `received_at`.
- `type_attachment`: Master baru dengan `id` (INT PK), `code` (`VARCHAR(50) NOT NULL UNIQUE`), `name` (`VARCHAR(100)`), `description` (`TEXT`). Data awal: `bukti_pelapor` dan `bukti_penanganan`.
- `report_assignments`: PK `id` (`BIGINT`), `ticket_id` (`VARCHAR(100) FK`), `assigned_to_user_id`, `assigned_by_user_id`, `assignment_type`, `notes`, `is_active`, `assigned_at`. Kolom `from_region_id` dan `to_region_id` dihapus total.
- `report_logs`: PK `id` (`BIGINT`), `ticket_id` (`VARCHAR(100) FK`), `user_id`, `action`, `description`, `created_at`.
- `report_attachments`: PK `id` (`BIGINT`), `ticket_id` (`VARCHAR(100) FK`), `type_attachment_id` (`INT FK`), `source` (`telegram`/`manual`), metadata file lengkap, `uploaded_by_user_id`.
- `telegram_pending_media`: PK `id` (`BIGINT`), `linked_ticket_id` (`VARCHAR(100) FK`), status `'pending'`, `'linked'`, `'expired'`.

### 3. Kebijakan Penghapusan Data (Delete Policy Matrix)

| Entitas Anak | Kolom Kunci / Relasi | Induk Terkait | Kebijakan Delete (`ON DELETE`) | Justifikasi Bisnis & Teknis |
| :--- | :--- | :--- | :--- | :--- |
| `report_assignments` | `ticket_id` | `reports(ticket_id)` | **CASCADE** | Siklus hidup penugasan terikat penuh pada eksistensi tiket. Jika tiket dihapus dari sistem, rekaman penugasan ikut terhapus. |
| `report_attachments` | `ticket_id` | `reports(ticket_id)` | **CASCADE** | Berkas lampiran merupakan atribut pendukung laporan. |
| `report_attachments` | `type_attachment_id` | `type_attachment(id)` | **RESTRICT** | Kategori master dilarang dihapus jika masih dirujuk oleh rekaman berkas lampiran. |
| `report_attachments` | `uploaded_by_user_id`| `users(id)` | **SET NULL** | Jika akun personil pengunggah dihapus, bukti fisik berkas tetap terjaga. |
| `report_logs` | `ticket_id` | `reports(ticket_id)` | **RESTRICT** *(atau NO ACTION)* | **Perlindungan Audit Trail**: Rekaman riwayat penanganan dilarang terhapus otomatis melalui kaskade. Integritas jejak audit operasional harus dilindungi. |
| `report_logs` | `user_id` | `users(id)` | **SET NULL** | Jika akun personil dihapus, entri audit log tetap ada dengan keterangan user anonim. |
| `telegram_pending_media` | `linked_ticket_id` | `reports(ticket_id)` | **SET NULL** | Media mentah dari Telegram tetap disimpan sebagai arsip buffer jika tiket terkait dibatalkan/dihapus. |

---

## Region Access & Scoping Architecture

Sistem penanganan gangguan membedakan secara ketat empat konsep wilayah tanpa mencampurkannya:
1. **Wilayah Fisik Gangguan**: `reports.reported_region_id` (misal Padang / Bukittinggi). Bersifat *immutable*.
2. **Home Region Personil**: `users.region_id`. Wilayah pangkalan resmi personil eksekutor/koordinator.
3. **Akses Wilayah Sementara (F007)**: `region_switch_requests`. Mekanisme persetujuan koordinator bagi eksekutor yang bertugas sementara di luar home region.
4. **Penanggung Jawab Aktif**: `report_assignments.assigned_to_user_id` (pada baris dengan `is_active = 1`).

### Query Scoping & Access Rules
Penyaringan hak akses **TIDAK CUKUP** hanya memeriksa `reported_region_id`. Logika query dibangun mengikuti aturan bisnis yang sudah berjalan:

- **Eksekutor**:
  - Melihat & mengambil tiket `tersedia`: `reports.reported_region_id = currentUser.region_id` ATAU `reports.reported_region_id IN (SELECT target_region_id FROM region_switch_requests WHERE requester_user_id = currentUser.id AND status = 'approved' AND NOW() BETWEEN start_at AND end_at)`.
  - Melihat & memproses tiket berjalan (*in-progress*): Terdapat relasi aktif di mana `ra.assigned_to_user_id = currentUser.id AND ra.is_active = 1`.
- **Koordinator**:
  - Mengawasi antrean tiket operasional lintas wilayah (`reported_region_id IN (1, 2)` / PDG & BKT).
  - Melakukan delegasi tiket ke eksekutor yang berhak (berdasarkan home region target eksekutor atau izin switch aktif F007 target eksekutor).
- **Supervisor**:
  - Memantau metrik KPI agregat lintas wilayah atau difilter berdasarkan `reports.reported_region_id`.

---

## Active Assignment Invariant & Validation

### Bukti Validasi Kondisi Aktual (Current State Validation Evidence)
Hasil audit aktual terhadap seluruh 54 laporan pada database membuktikan:
- Status `tersedia`: `active_assignment_count = 0`
- Status `diambil`: `active_assignment_count = 1`
- Status `didelegasikan`: `active_assignment_count = 1`
- Status `selesai`: `active_assignment_count = 1`
- Status `perlu_tindak_lanjut`: `active_assignment_count = 1`
- Status `eskalasi`: `active_assignment_count = 1`
- **Hasil**: Tidak ditemukan satu pun tiket dengan `active_assignment_count > 1`.

### Aturan Invariant Target F033
1. Tiket berstatus `tersedia`: **Tepat 0** baris penugasan aktif (`COUNT(ra.id WHERE is_active = 1) = 0`).
2. Tiket berstatus selain `tersedia` (`diambil`, `didelegasikan`, `selesai`, `perlu_tindak_lanjut`, `eskalasi`): **Tepat 1** baris penugasan aktif (`COUNT(ra.id WHERE is_active = 1) = 1`).
3. **Penting**: Penugasan **TIDAK diubah** menjadi nonaktif (`is_active = 0`) saat tiket mencapai status `selesai`, karena penugasan aktif tersebut mencatat penanggung jawab akhir penyelesaian tiket.

### SQL Validation Queries
Kueri validasi berikut wajib dijalankan untuk memverifikasi kepatuhan invariant:
```sql
-- 1. Deteksi tiket dengan duplikasi active assignment (> 1)
SELECT 
  ra.ticket_id, 
  COUNT(*) AS active_count
FROM report_assignments ra
WHERE ra.is_active = 1
GROUP BY ra.ticket_id
HAVING COUNT(*) > 1; -- Wajib 0 baris

-- 2. Deteksi pelanggaran tiket 'tersedia' yang memiliki active assignment
SELECT r.ticket_id, r.status_internal, COUNT(ra.id) AS active_count
FROM reports r
JOIN report_assignments ra ON ra.ticket_id = r.ticket_id AND ra.is_active = 1
WHERE r.status_internal = 'tersedia'
GROUP BY r.ticket_id, r.status_internal; -- Wajib 0 baris

-- 3. Deteksi tiket non-'tersedia' yang tidak memiliki tepat 1 active assignment
SELECT r.ticket_id, r.status_internal, COUNT(ra.id) AS active_count
FROM reports r
LEFT JOIN report_assignments ra ON ra.ticket_id = r.ticket_id AND ra.is_active = 1
WHERE r.status_internal != 'tersedia'
GROUP BY r.ticket_id, r.status_internal
HAVING active_count != 1; -- Wajib 0 baris
```

---

## Attachment Handling Strategy

### 1. Dukungan Koneksi Transaksi pada `attachmentModel`
Pada implementasi saat ini, fungsi `completeReport()` di `models/reportModel.js` membuka transaksi manual:
`const connection = await pool.getConnection(); await connection.beginTransaction();`
Fungsi `attachmentModel.createAttachment(attachmentData, trxConnection = null)` **wajib menerima parameter koneksi transaksi**:
- Jika `trxConnection` diberikan oleh pemanggil (`completeReport`), eksekusi `INSERT INTO report_attachments` **wajib** menggunakan `trxConnection.query(...)`.
- Dilarang diam-diam kembali menggunakan `pool.query(...)` yang akan memecah atomisitas transaksi.
- Hal ini menjamin bahwa jika penyimpanan attachment gagal, pembaruan status laporan pada `completeReport()` otomatis ter-rollback secara utuh.

### 2. Strategi Pembacaan Lampiran Selama Masa Transisi (*Dual Compatibility Read*)
Agar data lampiran historis tidak hilang dari modal antarmuka saat proses migrasi berjalan:
- Gunakan **`LEFT JOIN type_attachment ta ON ra.type_attachment_id = ta.id`** (bukan `INNER JOIN`) pada `getAttachmentsByTicketId()`.
- Jika `ra.type_attachment_id IS NULL`, model menetapkan label default sementara (`"Belum Terklasifikasi / Sedang Diaudit"`) sehingga berkas tetap dapat dilihat dan diunduh oleh user.

### 3. Prosedur Audit & Klasifikasi 48 Data Historis Lampiran
Fakta audit database membuktikan 48 baris data:
- `source = ''` (empty string) = **13 baris** (`source IS NULL` = 0)
- `source = 'telegram'` = **33 baris** (21 tanpa uploader, 12 dengan uploader internal)
- `source = 'manual'` = **2 baris** (dengan uploader internal)

**Dilarang melakukan blind backfill**. Prosedur klasifikasi bertahap:
1. **Langkah 1: Audit & Ekstraksi Data Historis**:
   - Seluruh kueri migrasi yang mencari 13 data ber-source kosong **wajib** menggunakan `TRIM(source) = ''` (bukan `source IS NULL`).
2. **Langkah 2: Klasifikasi Definitif yang Dapat Dibuktikan**:
   - 2 baris `source = 'manual'` dengan `uploaded_by_user_id IS NOT NULL` -> dihubungkan ke `type_attachment.code = 'bukti_penanganan'`.
   - 21 baris `source = 'telegram'` dengan `uploaded_by_user_id IS NULL` dan memiliki `telegram_file_id` -> dihubungkan ke `type_attachment.code = 'bukti_pelapor'`.
3. **Langkah 3: Penanganan Data Ambigu (25 Baris)**:
   - 12 baris `source = 'telegram'` ber-uploader: Periksa korelasi waktu terhadap `report_logs`. Jika berkorelasi dengan log `ticket_completed`, klasifikasikan sebagai `bukti_penanganan`. Jika berkorelasi dengan bot intake, klasifikasikan sebagai `bukti_pelapor`.
   - 13 baris `TRIM(source) = ''`: Periksa keberadaan `telegram_file_id`. Jika ada, tetapkan `source = 'telegram'` dan klasifikasikan `bukti_pelapor`. Jika file path mengarah ke direktori upload web internal, tetapkan `source = 'manual'` dan `bukti_penanganan`.
4. **Langkah 4: Validasi & Gerbang Penghentian (Stop Gate)**:
   - **Aturan Tegas**: Jika masih terdapat rekaman historis yang belum dapat dibuktikan klasifikasinya secara valid, migrasi **WAJIB BERHENTI (STOP)** sebelum constraint `type_attachment_id NOT NULL` diterapkan. Jangan memaksakan klasifikasi spekulatif hanya agar constraint NOT NULL terpenuhi.

---

## Deterministic Polling & `received_at` Handling

### 1. Penggunaan `received_at` dan Penanganan Nilai NULL
Hasil audit membuktikan kolom resmi adalah `received_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP()`.
Untuk mengantisipasi data lama yang mungkin memiliki nilai `received_at IS NULL`:
- Klausul SQL polling menggunakan penanganan fallback yang deterministik:
  `COALESCE(reports.received_at, reports.created_at)`
- Kursor klien menyimpan `since_received_at` (ISO string) dan `since_ticket_id` (string tie-breaker).

### 2. Kursor Berasal dari Record yang Sama
Nilai kursor terbaru (`latest_received_at` dan `latest_ticket_id`) **wajib berasal dari record baris yang sama** agar penentuan batas kursor tidak pincang:
```sql
-- 1. Query kursor terbaru dari record teratas yang sama
SELECT 
  COALESCE(reports.received_at, reports.created_at) AS latest_received_at,
  reports.ticket_id AS latest_ticket_id
FROM reports
WHERE reports.source_channel = 'telegram'
ORDER BY COALESCE(reports.received_at, reports.created_at) DESC, reports.ticket_id DESC
LIMIT 1;

-- 2. Query pengecekan laporan baru
SELECT COUNT(*) AS new_count
FROM reports
WHERE reports.source_channel = 'telegram'
  AND (
    COALESCE(reports.received_at, reports.created_at) > :since_received_at
    OR (
      COALESCE(reports.received_at, reports.created_at) = :since_received_at 
      AND reports.ticket_id > :since_ticket_id
    )
  );
```

---

## Migration Sequencing (Expand → Backfill → Dual Compatibility → Validate → Switch FK/PK → Contract)

Strategi migrasi dirancang untuk **meminimalkan service disruption** melalui 6 tahap berurutan:

```text
[Fase 1: Expand]
       ↓
[Fase 2: Backfill Terverifikasi]
       ↓
[Fase 3: Deploy Dual Compatibility Code]
       ↓
[Fase 4: Validation Gates (Pre-Switch)]  ──(Gagal?)──→ [Rollback Terencana]
       ↓ (Lolos 100%)
[Fase 5: Switch FK & PK]
       ↓
[Fase 6: Contract (Drop Legacy)]
```

### Fase 1: Expand (Penambahan Skema Baru)
- Membuat tabel master `type_attachment`:
  ```sql
  CREATE TABLE type_attachment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT
  );
  -- Seed data via code
  INSERT INTO type_attachment (code, name, description) VALUES
    ('bukti_pelapor', 'Bukti Pelapor (Telegram)', 'Foto atau berkas awal laporan gangguan dari pelapor'),
    ('bukti_penanganan', 'Bukti Penanganan (Sistem)', 'Bukti pekerjaan perbaikan/BA penyelesaian oleh eksekutor');
  ```
- Menambahkan kolom baru bertipe `VARCHAR(100)` dan `INT NULL` pada child tables (kolom legacy `reports.id` dan `report_id` tetap aktif):
  - `ALTER TABLE report_assignments ADD COLUMN ticket_id VARCHAR(100) NULL AFTER report_id;`
  - `ALTER TABLE report_logs ADD COLUMN ticket_id VARCHAR(100) NULL AFTER report_id;`
  - `ALTER TABLE report_attachments ADD COLUMN ticket_id VARCHAR(100) NULL AFTER report_id;`
  - `ALTER TABLE report_attachments ADD COLUMN type_attachment_id INT NULL AFTER ticket_id;`
  - `ALTER TABLE telegram_pending_media ADD COLUMN linked_ticket_id VARCHAR(100) NULL AFTER linked_report_id;`

### Fase 2: Backfill Terverifikasi
- Pengisian `ticket_id` pada seluruh child table:
  ```sql
  UPDATE report_assignments ra JOIN reports r ON ra.report_id = r.id SET ra.ticket_id = r.ticket_id;
  UPDATE report_logs rl JOIN reports r ON rl.report_id = r.id SET rl.ticket_id = r.ticket_id;
  UPDATE report_attachments rat JOIN reports r ON rat.report_id = r.id SET rat.ticket_id = r.ticket_id;
  UPDATE telegram_pending_media tpm JOIN reports r ON tpm.linked_report_id = r.id SET tpm.linked_ticket_id = r.ticket_id;
  ```
- Pengisian `type_attachment_id` secara dinamis via subquery kode bisnis (bebas hardcoded numeric ID):
  ```sql
  -- Backfill data yang jelas bukti_penanganan
  UPDATE report_attachments 
  SET type_attachment_id = (SELECT id FROM type_attachment WHERE code = 'bukti_penanganan')
  WHERE source = 'manual' AND uploaded_by_user_id IS NOT NULL;

  -- Backfill data yang jelas bukti_pelapor
  UPDATE report_attachments 
  SET type_attachment_id = (SELECT id FROM type_attachment WHERE code = 'bukti_pelapor')
  WHERE source = 'telegram' AND uploaded_by_user_id IS NULL;

  -- Eksekusi hasil audit manual untuk 25 baris ambigu (menggunakan TRIM(source) = '' untuk 13 baris kosong)
  ```

### Fase 3: Dual Compatibility Code Deployment
- Memperbarui lapisan kode backend, controller, model, rute, dan view:
  - Rute `/reports/:ticketId/*` aktif dan membaca laporan berbasis `ticket_id`.
  - `reportModel.js` melakukan penulisan penugasan ke `report_assignments` (tanpa menyentuh `from_region_id`/`to_region_id`).
  - `attachmentModel.createAttachment()` mendukung parameter `trxConnection` dan lookup `type_attachment` dinamis berdasarkan `code`.
  - Pembacaan lampiran menggunakan `LEFT JOIN type_attachment`.
  - Polling deterministik `check-new` membaca kursor `since_received_at` dan `since_ticket_id`.
  - Kode backend tidak lagi melakukan penulisan ke `current_assigned_user_id` atau `current_region_id`.

### Fase 4: Validation Gate (Gerbang Validasi Pre-Switch)
Seluruh poin pemeriksaan pada Bagian Validation Gates wajib berstatus **PASS** sebelum beralih ke Fase 5.

### Fase 5: Switch FK & PK
- **Identifikasi Nama Constraint FK Aktual**:
  Migration script **wajib** membaca nama constraint foreign key aktual dari database sebelum menjalankan `DROP FOREIGN KEY`:
  ```sql
  SELECT CONSTRAINT_NAME, TABLE_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND REFERENCED_TABLE_NAME = 'reports' 
    AND REFERENCED_COLUMN_NAME = 'id';
  ```
- **Pelepasan Foreign Key Lama**:
  Melepaskan seluruh foreign key constraint lama yang mereferensikan `reports(id)` menggunakan nama constraint aktual yang diperoleh secara dinamis dari query di atas.
- **Pengalihan Kunci Utama (Technical Sequencing)**:
  Karena kolom `reports.id` bertipe `BIGINT AUTO_INCREMENT`, MySQL melarang `DROP PRIMARY KEY` secara langsung bila tidak ada indeks pendukung lain pada kolom auto-increment tersebut. Urutan teknis wajib:
  1. Pastikan seluruh foreign key lama yang mereferensikan `reports.id` telah dilepas.
  2. Buat temporary/legacy index pada `reports.id` agar kolom AUTO_INCREMENT tetap terindeks:
     ```sql
     ALTER TABLE reports ADD INDEX idx_reports_legacy_id (id);
     ```
  3. Lepaskan PRIMARY KEY lama:
     ```sql
     ALTER TABLE reports DROP PRIMARY KEY;
     ```
  4. Tetapkan `ticket_id` sebagai PRIMARY KEY baru:
     ```sql
     ALTER TABLE reports ADD PRIMARY KEY (ticket_id);
     ```
  5. Eliminasi Redundant Unique Index pada `ticket_id`:
     - Pada skema awal, `reports.ticket_id` memiliki constraint/indeks `UNIQUE` terpisah. Karena `ticket_id` telah menjadi PRIMARY KEY (yang secara inheren unik dan terindeks), indeks unik terpisah tersebut menjadi redundan.
     - Prosedur pelepasan indeks unik lama:
       1. Jalankan `SHOW INDEX FROM reports WHERE Column_name = 'ticket_id' AND Key_name != 'PRIMARY';` untuk mengidentifikasi nama indeks unik lama secara dinamis (tanpa hardcode nama indeks).
       2. Setelah `PRIMARY KEY (ticket_id)` terpasang secara aman, lepaskan indeks unik lama bila memang redundan:
          ```sql
          ALTER TABLE reports DROP INDEX `<old_unique_index_name>`;
          ```
       3. **PENTING**: Dilarang menghapus PRIMARY KEY `ticket_id`.
  6. Kolom `reports.id` **tetap dipertahankan sementara** sebagai legacy AUTO_INCREMENT dengan indeks `idx_reports_legacy_id` selama masa verifikasi pasca-switch (Dual Compatibility).
- **Pemasangan Foreign Key Baru ke `reports(ticket_id)` dan Master Tipe**:
  ```sql
  ALTER TABLE report_assignments MODIFY COLUMN ticket_id VARCHAR(100) NOT NULL;
  ALTER TABLE report_assignments ADD CONSTRAINT fk_assignments_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE CASCADE;

  ALTER TABLE report_attachments MODIFY COLUMN ticket_id VARCHAR(100) NOT NULL;
  -- Constraint NOT NULL hanya dieksekusi jika Gate 1 lolos (seluruh 48 record telah terverifikasi)
  ALTER TABLE report_attachments MODIFY COLUMN type_attachment_id INT NOT NULL;
  ALTER TABLE report_attachments ADD CONSTRAINT fk_attachments_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE CASCADE;
  ALTER TABLE report_attachments ADD CONSTRAINT fk_attachments_type FOREIGN KEY (type_attachment_id) REFERENCES type_attachment(id) ON DELETE RESTRICT;

  ALTER TABLE report_logs MODIFY COLUMN ticket_id VARCHAR(100) NOT NULL;
  -- PROTEKSI AUDIT TRAIL: ON DELETE RESTRICT
  ALTER TABLE report_logs ADD CONSTRAINT fk_logs_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE RESTRICT;

  ALTER TABLE telegram_pending_media ADD CONSTRAINT fk_pending_media_ticket FOREIGN KEY (linked_ticket_id) REFERENCES reports(ticket_id) ON DELETE SET NULL;
  ```
- **Penambahan Indeks Penunjang**:
  ```sql
  CREATE INDEX idx_reports_received_ticket ON reports (received_at, ticket_id);
  CREATE INDEX idx_assignments_ticket_active ON report_assignments (ticket_id, is_active);
  CREATE INDEX idx_assignments_user_active ON report_assignments (assigned_to_user_id, is_active);
  CREATE INDEX idx_attachments_ticket_type ON report_attachments (ticket_id, type_attachment_id);
  CREATE INDEX idx_logs_ticket_created ON report_logs (ticket_id, created_at);
  ```

### Fase 6: Contract (Pembersihan Kolom Usang)
Hanya dieksekusi pada Contract Phase setelah seluruh backend, frontend, dan child tables terbukti 100% stabil beroperasi murni berbasis `ticket_id` dan tidak lagi membutuhkan `reports.id`:
```sql
-- 1. Hapus kolom legacy reports.id (indeks idx_reports_legacy_id otomatis terhapus bersama kolom)
ALTER TABLE reports DROP COLUMN id;
-- Catatan: jika indeks perlu dilepas terpisah sebelum drop kolom:
-- ALTER TABLE reports DROP INDEX idx_reports_legacy_id;

-- 2. Hapus kolom denormalisasi reports
ALTER TABLE reports DROP COLUMN current_region_id;
ALTER TABLE reports DROP COLUMN current_assigned_user_id;

-- 3. Hapus kolom legacy dan redundansi wilayah pada child tables
ALTER TABLE report_assignments DROP COLUMN report_id;
ALTER TABLE report_assignments DROP COLUMN from_region_id; -- Dihapus sesuai ERD Final
ALTER TABLE report_assignments DROP COLUMN to_region_id;   -- Dihapus sesuai ERD Final

ALTER TABLE report_logs DROP COLUMN report_id;
ALTER TABLE report_attachments DROP COLUMN report_id;
ALTER TABLE telegram_pending_media DROP COLUMN linked_report_id;
```

---

## Validation Gates

Sebelum melangkah ke fase berikutnya, pemeriksaan berikut wajib bernilai 100% lulus:

### Gate 1: Integritas Pasca-Backfill & Klasifikasi Lampiran (Fase 2 -> Fase 3)
```sql
-- 1. Pastikan tidak ada ticket_id yang NULL pada child table
SELECT COUNT(*) FROM report_assignments WHERE ticket_id IS NULL; -- Wajib 0
SELECT COUNT(*) FROM report_logs WHERE ticket_id IS NULL;        -- Wajib 0
SELECT COUNT(*) FROM report_attachments WHERE ticket_id IS NULL; -- Wajib 0
SELECT COUNT(*) FROM telegram_pending_media WHERE linked_report_id IS NOT NULL AND linked_ticket_id IS NULL; -- Wajib 0

-- 2. Pastikan jumlah baris identik sebelum dan sesudah
-- reports = 54, report_assignments = 55, report_logs = 329, report_attachments = 48

-- 3. STOP GATE Lampiran: Pastikan seluruh 48 lampiran historis terklasifikasi secara terbukti
-- Jika query ini menghasilkan > 0, MIGRATION STOP sebelum type_attachment_id diubah menjadi NOT NULL
SELECT COUNT(*) FROM report_attachments WHERE type_attachment_id IS NULL; -- Wajib 0
```

### Gate 2: Invariant Penugasan Aktif (Fase 3 -> Fase 4)
```sql
-- 1. Tidak ada tiket dengan active assignment > 1
SELECT ticket_id, COUNT(*) AS active_count 
FROM report_assignments 
WHERE is_active = 1 
GROUP BY ticket_id 
HAVING COUNT(*) > 1; -- Wajib 0 baris

-- 2. Tiket 'tersedia' tidak boleh memiliki active assignment
SELECT r.ticket_id, r.status_internal, COUNT(ra.id) AS active_count
FROM reports r
JOIN report_assignments ra ON ra.ticket_id = r.ticket_id AND ra.is_active = 1
WHERE r.status_internal = 'tersedia'
GROUP BY r.ticket_id, r.status_internal; -- Wajib 0 baris

-- 3. Tiket non-'tersedia' harus memiliki tepat 1 active assignment
SELECT r.ticket_id, r.status_internal, COUNT(ra.id) AS active_count
FROM reports r
LEFT JOIN report_assignments ra ON ra.ticket_id = r.ticket_id AND ra.is_active = 1
WHERE r.status_internal != 'tersedia'
GROUP BY r.ticket_id, r.status_internal
HAVING active_count != 1; -- Wajib 0 baris
```

### Gate 3: Verifikasi Bebas Ketergantungan Kolom Usang (Fase 4 -> Fase 5)
- **Grep Test Codebase**: Pastikan tidak ada query SQL aktif di folder `models/`, `controllers/`, `routes/`, dan `services/` yang membaca atau menulis kolom:
  - `reports.id` (kecuali adapter legacy fallback)
  - `reports.current_region_id`
  - `reports.current_assigned_user_id`
  - `report_assignments.from_region_id`
  - `report_assignments.to_region_id`
  - `child.report_id`
- **Kursor Polling**: Kursor berasal dari baris teratas yang sama (`latest_received_at`, `latest_ticket_id`).
- Seluruh regression tests berstatus **PASS (100%)**.

### Gate 4: Verifikasi Pasca-Switch & Integritas Legacy AUTO_INCREMENT (Fase 5 -> Fase 6)
```sql
-- 1. Verifikasi reports.ticket_id adalah PRIMARY KEY tunggal
SELECT COLUMN_NAME, CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'reports' 
  AND CONSTRAINT_NAME = 'PRIMARY'; -- Wajib menghasilkan 'ticket_id'

-- 2. Verifikasi tidak ada redundant UNIQUE INDEX terpisah pada ticket_id
SHOW INDEX FROM reports WHERE Column_name = 'ticket_id' AND Non_unique = 0 AND Key_name != 'PRIMARY';
-- Wajib 0 baris (tidak ada indeks unik ganda)

-- 3. Verifikasi temporary index pada id aktif menjaga sifat AUTO_INCREMENT
SHOW INDEX FROM reports WHERE Key_name = 'idx_reports_legacy_id'; -- Wajib ada 1 baris

-- 4. Verifikasi seluruh Foreign Key baru aktif dan terhubung ke ticket_id
SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_COLUMN_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND REFERENCED_TABLE_NAME = 'reports'; -- Seluruh REFERENCED_COLUMN_NAME wajib 'ticket_id'

-- 5. Verifikasi zero-loss data pasca switch: reports=54, assignments=55, logs=329, attachments=48
```

---

## Testing & Assertion Strategy

Pengujian fungsional dan integritas data **dilarang menggunakan assertion berbasis angka numerik `type_attachment_id = 1` atau `2`**.

### 1. Pengujian Modul Lampiran
```javascript
// Validasi berbasis code bisnis
const attachments = await attachmentModel.getAttachmentsByTicketId(ticketId);
assert(attachments.length > 0);
assert(attachments[0].type_attachment_code === 'bukti_pelapor'); // Menguji string code
assert(attachments[0].type_attachment_name !== null);
```

### 2. Pengujian Transaksi Penyelesaian Tiket
- Simulasikan kegagalan I/O pada penyimpanan berkas lampiran saat `completeReport()`.
- Pastikan status tiket di `reports` tidak berubah menjadi `'selesai'` (transaksi atomik me-rollback seluruh operasi).

### 3. Pengujian Hak Akses Wilayah & F007
- Uji Eksekutor home region Padang hanya dapat melihat tiket `reported_region_id = Padang`.
- Uji Eksekutor yang memiliki request switch F007 aktif ke Bukittinggi dapat melihat dan mengambil tiket `reported_region_id = Bukittinggi`.
- Uji Koordinator dapat mendelegasikan tiket lintas wilayah.

### 4. Pengujian Polling Kursor
- Masukkan tiket baru via simulasi bot Telegram.
- Panggil `GET /reports/check-new?since_received_at=...&since_ticket_id=...`.
- Pastikan response mengembalikan `hasNewReports: true` dan `newCount = 1` tanpa full page reload.

---

## Rollback / Backward Compatibility Strategy

Untuk menjamin pemulihan instan jika terjadi kendala pada salah satu fase:

1. **Full Database Backup (Checkpoint 0)**:
   - Sebelum Fase 1 dimulai, buat snapshot penuh:
     `mysqldump -u [user] -p --routines --triggers db_penanganan_gangguan > backup_pre_f033_full.sql`

2. **Rollback Fase 1 & 2 (Struktur Skema Baru)**:
   - Rollback wajib mengikuti **dependency order** terbalik (drop child columns/foreign keys terlebih dahulu, baru drop master table):
     ```sql
     -- 1. Drop kolom baru dari seluruh child table
     ALTER TABLE report_logs DROP COLUMN ticket_id;
     ALTER TABLE telegram_pending_media DROP COLUMN linked_ticket_id;
     ALTER TABLE report_assignments DROP COLUMN ticket_id;
     ALTER TABLE report_attachments DROP COLUMN ticket_id;
     ALTER TABLE report_attachments DROP COLUMN type_attachment_id;

     -- 2. Drop tabel master type_attachment
     DROP TABLE IF EXISTS type_attachment;
     ```

3. **Rollback Fase 3 (Aplikasi)**:
   - Revert commit git aplikasi ke versi tag sebelum F033 dan restart dev/service server.

4. **Rollback Fase 5 (Switch FK/PK)**:
   - Jika pembuatan PK/FK gagal sebelum transisi stabil:
     1. Drop seluruh foreign key baru yang mengarah ke `reports(ticket_id)`.
     2. Lepaskan PRIMARY KEY pada `ticket_id`:
        `ALTER TABLE reports DROP PRIMARY KEY;`
     3. Kembalikan PRIMARY KEY ke `id`:
        `ALTER TABLE reports ADD PRIMARY KEY (id);`
     4. Hapus temporary index legacy:
        `ALTER TABLE reports DROP INDEX idx_reports_legacy_id;`
     5. Pemulihan Indeks Unik `ticket_id`:
        - Jika rollback dilakukan sebelum unique index lama `ticket_id` di-drop, pertahankan unique index tersebut.
        - Jika unique index lama sudah terlanjur di-drop, pulihkan constraint unik: `ALTER TABLE reports ADD UNIQUE (ticket_id);` untuk mengembalikan skema ke *current state*.
     6. Pasang kembali foreign key lama dari child tables ke `reports(id)` menggunakan nama constraint yang tersimpan dari `information_schema`.

5. **Titik Tanpa Rollback (*Point of No Return*)**:
   - Setelah Fase 6 (*Contract Phase*) selesai dan kolom legacy di-drop, rollback hanya dapat dilakukan melalui restorasi backup snapshot penuh `backup_pre_f033_full.sql`.
