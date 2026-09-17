# Tasks — Report Identity and Database Normalization

## Feature ID
F033

## Feature Name
Report Identity and Database Normalization

## Purpose & Scope
Dokumen ini mendefinisikan rincian tugas teknis (*tasks breakdown*) yang bersifat berurutan (*executable*), terverifikasi (*verifiable*), dan aman (*safe*) untuk eksekusi migrasi skema basis data dan refaktor backend F033.

---

## Phase 0 — Preparation

### T001: Freeze Scope F033
- **Objective**: Mengunci batasan ruang lingkup F033 dan memastikan tidak ada perubahan fitur bisnis yang tidak direncanakan.
- **Dependencies**: Tidak ada.
- **Files/Schema Affected**: `.specify/features/033-report-identity-and-database-normalization/spec.md`, `plan.md`.
- **Exact Work to Perform**:
  - Konfirmasi batasan: tidak mengubah alur intake bot Telegram, format parsing (D-011, D-018), F007 Temporary Region Switch, formula metrik KPI Supervisor (F004), atau siklus hidup status tiket.
  - Kunci keputusan kolom intake: tetap `received_at` (bukan `reported_at`).
  - Kunci status enum pending media: tetap `pending, linked, expired` (bukan `ignored`).
- **Validation/Acceptance Criteria**: Dokumen `spec.md` dan `plan.md` telah disetujui tanpa ambiguitas terbuka.
- **Rollback Requirement**: N/A (Dokumentasi).

---

### T002: Git Checkpoint / Baseline Tag
- **Objective**: Membuat checkpoint tag pada git repository sebelum perubahan kode atau skema dimulai.
- **Dependencies**: T001.
- **Files/Schema Affected**: Git repository.
- **Exact Work to Perform**:
  - Buat annotated tag git: `git tag -a f033-pre-migration-baseline -m "Baseline sebelum eksekusi F033"`.
  - Pastikan working tree bersih dari uncommitted changes yang tidak diinginkan.
- **Validation/Acceptance Criteria**: `git tag -l "f033-pre-migration-baseline"` mengembalikan tag yang valid.
- **Rollback Requirement**: Checkpoint ini merupakan target checkout rollback jika Fase 3 mengalami kegagalan aplikasi.

---

### T003: Full Database Backup and Verification Protocol
- **Objective**: Membuat salinan cadangan (*full dump*) struktur dan data live `db_penanganan_gangguan` serta menetapkan protokol verifikasi restorasi yang aman.
- **Dependencies**: T002.
- **Files/Schema Affected**: `db_penanganan_gangguan` (seluruh tabel).
- **Exact Work to Perform**:
  - Eksekusi backup penuh mencakup triggers, routines, dan data live:
    ```bash
    mysqldump -u root -p --routines --triggers db_penanganan_gangguan > backup_pre_f033_full.sql
    ```
  - Simpan berkas cadangan di lokasi penyimpanan aman terisolasi di luar working tree git.
  - Lakukan inspeksi isi dump:
    - Periksa header dump untuk memastikan target basis data benar (`Current Database: db_penanganan_gangguan`).
    - Pastikan pernyataan `CREATE TABLE` dan data untuk tabel-tabel utama terdeteksi (`reports`, `report_assignments`, `report_logs`, `report_attachments`, `users`, `regions`, `manual_non_ticketing_reports`).
  - Dokumentasikan prosedur verifikasi restore ke basis data sementara (uji *dry-run restore*) yang WAJIB dijalankan sebelum memasuki Contract Phase (Phase 6):
    ```bash
    # Prosedur Uji Dry-Run Restore (HANYA dijalankan sebelum Phase 6, JANGAN dijalankan sekarang):
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS db_penanganan_gangguan_dryrun;"
    mysql -u root -p db_penanganan_gangguan_dryrun < backup_pre_f033_full.sql
    mysql -u root -p -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema='db_penanganan_gangguan_dryrun';"
    mysql -u root -p -e "DROP DATABASE db_penanganan_gangguan_dryrun;"
    ```
- **Validation/Acceptance Criteria**:
  1. Berkas `backup_pre_f033_full.sql` terbentuk di lokasi aman.
  2. Ukuran berkas dump > 0 byte (ukuran wajar memuat seluruh skema dan data).
  3. Header dump mengonfirmasi target database `db_penanganan_gangguan`.
  4. Struktur tabel-tabel utama terdeteksi utuh di dalam file dump.
  5. Prosedur uji restore terdokumentasi jelas untuk pengujian pra-Contract Phase.
- **Rollback Requirement**: Checkpoint 0 untuk restorasi total jika terjadi bencana atau kegagalan kritis.

---

### T004: Capture Current FK, Index, and Schema Metadata (FK Safety)
- **Objective**: Merekam metadata nama foreign key constraint aktual dan indeks yang aktif di database sebelum modifikasi dengan menerapkan prinsip *Foreign Key Safety* dan preservasi nama index.
- **Dependencies**: T003.
- **Files/Schema Affected**: Metadata `information_schema`.
- **Exact Work to Perform**:
  - Jalankan dan catat hasil kueri berikut ke berkas log migrasi:
    ```sql
    SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'reports';

    SHOW INDEX FROM reports;
    SHOW INDEX FROM report_assignments;
    SHOW INDEX FROM report_attachments;
    SHOW INDEX FROM report_logs;
    SHOW INDEX FROM telegram_pending_media;

    -- Rekam nama dan metadata unique index aktual lama pada reports.ticket_id:
    SHOW INDEX FROM reports WHERE Column_name = 'ticket_id' AND Non_unique = 0 AND Key_name != 'PRIMARY';
    ```
  - **Prinsip FK Safety & Index Preservation**:
    1. Migrasi HANYA boleh melepas (DROP) foreign key yang benar-benar ditemukan pada metadata `information_schema`.
    2. Jangan pernah mengasumsikan `telegram_pending_media` memiliki constraint FK ke `reports(id)` jika metadata aktual tidak menunjukkan constraint tersebut (fakta audit live: kolom `linked_report_id` tidak memiliki constraint foreign key terdaftar).
    3. Seluruh operasi pelepasan FK wajib menggunakan nama constraint aktual dari metadata, dilarang keras menebak atau menggunakan hardcoded constraint name.
    4. Simpan nama unique index aktual lama pada `reports.ticket_id` agar saat rollback Fase 5 indeks dapat dipulihkan dengan nama aslinya (bukan anonymous index).
- **Validation/Acceptance Criteria**: Seluruh nama constraint FK aktual dari child tables ke `reports(id)` dan nama unique index eksisting pada `reports.ticket_id` terdata secara presisi; ketiadaan constraint FK formal pada `telegram_pending_media` terkonfirmasi.
- **Rollback Requirement**: Nama-nama constraint dan index ini disimpan untuk pemulihan rollback pada Fase 5 jika diperlukan.

---

### T005: Capture Current Row Counts
- **Objective**: Mencatat jumlah baris data awal pada seluruh tabel terkait sebagai tolok ukur *zero-loss data*.
- **Dependencies**: T004.
- **Files/Schema Affected**: `reports`, `report_assignments`, `report_logs`, `report_attachments`, `manual_non_ticketing_reports`.
- **Exact Work to Perform**:
  - Eksekusi kueri penghitungan baris:
    ```sql
    SELECT 'reports' AS tbl, COUNT(*) AS cnt FROM reports
    UNION ALL SELECT 'report_assignments', COUNT(*) FROM report_assignments
    UNION ALL SELECT 'report_logs', COUNT(*) FROM report_logs
    UNION ALL SELECT 'report_attachments', COUNT(*) FROM report_attachments
    UNION ALL SELECT 'manual_non_ticketing_reports', COUNT(*) FROM manual_non_ticketing_reports;
    ```
- **Validation/Acceptance Criteria**: Tercatat persis baseline audit database aktual:
  - `reports` = 54
  - `report_assignments` = 55
  - `report_logs` = 329
  - `report_attachments` = 48
  - `manual_non_ticketing_reports` = 4
- **Rollback Requirement**: Data pembanding mutlak untuk setiap Validation Gate.

---

## Phase 1 — Expand

### T006: Create Table `type_attachment`
- **Objective**: Membuat tabel master baru untuk klasifikasi bukti lampiran berdasarkan *business key* `code`.
- **Dependencies**: T005.
- **Files/Schema Affected**: Tabel master baru `type_attachment`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    CREATE TABLE type_attachment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      description TEXT
    );
    ```
- **Validation/Acceptance Criteria**: `SHOW CREATE TABLE type_attachment;` mengembalikan skema yang valid.
- **Rollback Requirement**: `DROP TABLE IF EXISTS type_attachment;`.

---

### T007: Seed `type_attachment` via Code
- **Objective**: Mengisi data master awal untuk kategori bukti pelapor dan bukti penanganan dengan prinsip keamanan data master.
- **Dependencies**: T006.
- **Files/Schema Affected**: Tabel `type_attachment`.
- **Exact Work to Perform**:
  - Jalankan DML:
    ```sql
    INSERT INTO type_attachment (code, name, description) VALUES
      ('bukti_pelapor', 'Bukti Pelapor (Telegram)', 'Foto atau berkas keluhan yang dikirimkan pelapor'),
      ('bukti_penanganan', 'Bukti Penanganan (Sistem)', 'Bukti pekerjaan perbaikan/BA penyelesaian dari eksekutor');
    ```
- **Validation/Acceptance Criteria**: `SELECT code, name FROM type_attachment WHERE code IN ('bukti_pelapor', 'bukti_penanganan');` mengembalikan tepat 2 baris.
- **Rollback Requirement**:
  ```sql
  DELETE FROM type_attachment WHERE code IN ('bukti_pelapor', 'bukti_penanganan');
  ```
  *(Catatan Keamanan: Jangan gunakan `TRUNCATE TABLE`. Rollback hanya boleh menghapus record seed F033 dan dilarang keras menghapus master record lain yang mungkin ditambahkan).*

---

### T008: Add `ticket_id` to Child Tables
- **Objective**: Menambahkan kolom baru `ticket_id VARCHAR(100)` (nullable) pada tabel-tabel anak tanpa memutus relasi lama `report_id`.
- **Dependencies**: T007.
- **Files/Schema Affected**: `report_assignments`, `report_logs`, `report_attachments`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE report_assignments ADD COLUMN ticket_id VARCHAR(100) NULL AFTER report_id;
    ALTER TABLE report_logs ADD COLUMN ticket_id VARCHAR(100) NULL AFTER report_id;
    ALTER TABLE report_attachments ADD COLUMN ticket_id VARCHAR(100) NULL AFTER report_id;
    ```
- **Validation/Acceptance Criteria**: Kolom `ticket_id` (`VARCHAR(100) NULL`) terdaftar di ketiga tabel anak.
- **Rollback Requirement**:
  ```sql
  ALTER TABLE report_assignments DROP COLUMN ticket_id;
  ALTER TABLE report_logs DROP COLUMN ticket_id;
  ALTER TABLE report_attachments DROP COLUMN ticket_id;
  ```

---

### T009: Add `type_attachment_id` to `report_attachments`
- **Objective**: Menambahkan kolom relasi tipe lampiran `type_attachment_id INT NULL` pada `report_attachments`.
- **Dependencies**: T008.
- **Files/Schema Affected**: `report_attachments`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE report_attachments ADD COLUMN type_attachment_id INT NULL AFTER ticket_id;
    ```
- **Validation/Acceptance Criteria**: `SHOW COLUMNS FROM report_attachments LIKE 'type_attachment_id';` mengembalikan tipe `int` dan `YES` (nullable).
- **Rollback Requirement**: `ALTER TABLE report_attachments DROP COLUMN type_attachment_id;`.

---

### T010: Add `linked_ticket_id` to `telegram_pending_media`
- **Objective**: Menambahkan kolom `linked_ticket_id VARCHAR(100) NULL` pada tabel buffer Telegram.
- **Dependencies**: T009.
- **Files/Schema Affected**: `telegram_pending_media`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE telegram_pending_media ADD COLUMN linked_ticket_id VARCHAR(100) NULL AFTER linked_report_id;
    ```
- **Validation/Acceptance Criteria**: `SHOW COLUMNS FROM telegram_pending_media LIKE 'linked_ticket_id';` terdaftar valid.
- **Rollback Requirement**: `ALTER TABLE telegram_pending_media DROP COLUMN linked_ticket_id;`.

---

## Phase 2 — Backfill

### T011: Backfill Child `ticket_id` from `reports.id`
- **Objective**: Mengisi kolom `ticket_id` pada seluruh baris tabel anak berdasarkan nilai `reports.ticket_id` dari relasi `reports.id = child.report_id`.
- **Dependencies**: T010.
- **Files/Schema Affected**: `report_assignments`, `report_logs`, `report_attachments`, `telegram_pending_media`.
- **Exact Work to Perform**:
  - Jalankan update data bertahap:
    ```sql
    UPDATE report_assignments ra JOIN reports r ON ra.report_id = r.id SET ra.ticket_id = r.ticket_id;
    UPDATE report_logs rl JOIN reports r ON rl.report_id = r.id SET rl.ticket_id = r.ticket_id;
    UPDATE report_attachments rat JOIN reports r ON rat.report_id = r.id SET rat.ticket_id = r.ticket_id;
    UPDATE telegram_pending_media tpm JOIN reports r ON tpm.linked_report_id = r.id SET tpm.linked_ticket_id = r.ticket_id;
    ```
- **Validation/Acceptance Criteria**: Seluruh baris anak terisi nilai `ticket_id` yang sesuai dengan induknya.
- **Rollback Requirement**: Set `ticket_id = NULL` pada tabel anak jika diperlukan pengulangan.

---

### T012: Validate No Orphan / Null `ticket_id`
- **Objective**: Semua child record yang sudah memiliki parent report wajib memiliki `ticket_id` yang valid. `telegram_pending_media` yang belum ter-link ke report boleh memiliki `linked_ticket_id` NULL.
- **Dependencies**: T011.
- **Files/Schema Affected**: `report_assignments`, `report_logs`, `report_attachments`, `telegram_pending_media`.
- **Exact Work to Perform**:
  - Jalankan kueri verifikasi:
    ```sql
    SELECT 'report_assignments' AS tbl, COUNT(*) AS null_cnt FROM report_assignments WHERE ticket_id IS NULL
    UNION ALL SELECT 'report_logs', COUNT(*) FROM report_logs WHERE ticket_id IS NULL
    UNION ALL SELECT 'report_attachments', COUNT(*) FROM report_attachments WHERE ticket_id IS NULL
    UNION ALL SELECT 'telegram_pending_media', COUNT(*) FROM telegram_pending_media WHERE linked_report_id IS NOT NULL AND linked_ticket_id IS NULL;
    ```
- **Validation/Acceptance Criteria**: Seluruh baris query bernilai `null_cnt = 0`.
- **Rollback Requirement**: Investigasi manual sebelum melangkah jika `null_cnt > 0`.

---

### T013: Audit `report_attachments` Historical Data
- **Objective**: Mengekstrak dan menginventarisasi 48 baris data lampiran historis eksisting ke dalam lembar verifikasi audit.
- **Dependencies**: T012.
- **Files/Schema Affected**: `report_attachments`.
- **Exact Work to Perform**:
  - Jalankan query audit ringkasan distribusi:
    ```sql
    SELECT 
      CASE 
        WHEN TRIM(source) = '' THEN 'empty_string'
        ELSE source 
      END AS source_category,
      CASE WHEN uploaded_by_user_id IS NULL THEN 'NULL' ELSE 'NOT_NULL' END AS uploader_status,
      COUNT(*) AS total_rows
    FROM report_attachments
    GROUP BY source_category, uploader_status;
    ```
- **Validation/Acceptance Criteria**:
  - `empty_string` + `uploader = NULL/ANY`: **13 baris**.
  - `telegram` + `uploaded_by_user_id IS NULL`: **21 baris**.
  - `telegram` + `uploaded_by_user_id IS NOT NULL`: **12 baris**.
  - `manual` + `uploaded_by_user_id IS NOT NULL`: **2 baris**.
  - Total baris: **48**.
- **Rollback Requirement**: N/A (Read-only query).

---

### T014: Classify Deterministic Attachment Rows
- **Objective**: Mengklasifikasikan 23 baris lampiran yang secara definitif dan dapat dibuktikan asal-usulnya ke tipe lampiran yang sesuai via lookup `code` dengan prosedur rollback selektif.
- **Dependencies**: T013.
- **Files/Schema Affected**: `report_attachments`.
- **Exact Work to Perform**:
  - **Pencatatan State Awal (Safety Checkpoint)**: Sebelum update, catat ID baris lampiran yang akan diubah beserta nilai `type_attachment_id` awalnya ke temporary table:
    ```sql
    CREATE TEMPORARY TABLE temp_t014_deterministic_backup AS
    SELECT id, type_attachment_id
    FROM report_attachments
    WHERE (source = 'manual' AND uploaded_by_user_id IS NOT NULL)
       OR (source = 'telegram' AND uploaded_by_user_id IS NULL);
    ```
  - Jalankan update klasifikasi definitif:
    ```sql
    -- 2 baris manual terbukti bukti_penanganan
    UPDATE report_attachments 
    SET type_attachment_id = (SELECT id FROM type_attachment WHERE code = 'bukti_penanganan')
    WHERE source = 'manual' AND uploaded_by_user_id IS NOT NULL;

    -- 21 baris telegram murni terbukti bukti_pelapor
    UPDATE report_attachments 
    SET type_attachment_id = (SELECT id FROM type_attachment WHERE code = 'bukti_pelapor')
    WHERE source = 'telegram' AND uploaded_by_user_id IS NULL;
    ```
- **Validation/Acceptance Criteria**: Tepat 23 baris terisi `type_attachment_id` (2 `bukti_penanganan` dan 21 `bukti_pelapor`).
- **Rollback Requirement**:
  ```sql
  -- Rollback selektif HANYA untuk baris yang diubah oleh T014:
  UPDATE report_attachments a
  JOIN temp_t014_deterministic_backup t ON a.id = t.id
  SET a.type_attachment_id = t.type_attachment_id;
  DROP TEMPORARY TABLE IF EXISTS temp_t014_deterministic_backup;
  ```
  *(Catatan Keamanan: Dilarang menggunakan rollback global `UPDATE report_attachments SET type_attachment_id = NULL;` agar tidak menghapus klasifikasi attachment lain).*

---

### T015: Audit 25 Ambiguous Attachment Rows
- **Objective**: Menelusuri bukti log audit, path file, dan metadata Telegram untuk 25 baris lampiran ambigu (13 baris `TRIM(source) = ''` dan 12 baris Telegram ber-uploader) dengan prosedur rollback selektif per baris.
- **Dependencies**: T014.
- **Files/Schema Affected**: `report_attachments`, `report_logs`.
- **Exact Work to Perform**:
  - Jalankan cross-check terhadap `report_logs` berdasarkan waktu pembuatan file:
    ```sql
    SELECT rat.id, rat.ticket_id, rat.source, rat.telegram_file_id, rat.file_path, rat.created_at, rl.action
    FROM report_attachments rat
    LEFT JOIN report_logs rl ON rat.ticket_id = rl.ticket_id AND ABS(TIMESTAMPDIFF(SECOND, rat.created_at, rl.created_at)) <= 10
    WHERE TRIM(rat.source) = '' OR (rat.source = 'telegram' AND rat.uploaded_by_user_id IS NOT NULL);
    ```
  - Tetapkan klasifikasi hanya jika terdapat bukti kuat (misal korelasi log `ticket_completed` mengonfirmasi `bukti_penanganan`, korelasi bot intake mengonfirmasi `bukti_pelapor`).
  - **Pencatatan State Awal (Safety Checkpoint)**: Sebelum melakukan update per ID yang terverifikasi, catat ID baris dan nilai `type_attachment_id` sebelumnya ke dalam temporary table:
    ```sql
    CREATE TEMPORARY TABLE temp_t015_ambiguous_backup AS
    SELECT id, type_attachment_id
    FROM report_attachments
    WHERE id IN (<daftar_id_terverifikasi_hasil_audit>);
    ```
  - Eksekusi update per ID terbukti.
- **Validation/Acceptance Criteria**: Rekaman yang terbukti diklasifikasikan ke ID `bukti_pelapor` atau `bukti_penanganan`.
- **Rollback Requirement**:
  ```sql
  -- Rollback selektif HANYA untuk baris yang diubah oleh T015:
  UPDATE report_attachments a
  JOIN temp_t015_ambiguous_backup t ON a.id = t.id
  SET a.type_attachment_id = t.type_attachment_id;
  DROP TEMPORARY TABLE IF EXISTS temp_t015_ambiguous_backup;
  ```
  *(Catatan Keamanan: Dilarang menggunakan rollback global `UPDATE report_attachments SET type_attachment_id = NULL;`. Rollback hanya boleh memulihkan baris-baris yang diubah oleh T015 dan dilarang menghapus klasifikasi row lain).*

---

### T016: STOP GATE — Check for Unresolved Attachments
- **Objective**: Memeriksa apakah masih ada lampiran historis yang belum terklasifikasi sebelum migrasi diizinkan berlanjut.
- **Dependencies**: T015.
- **Files/Schema Affected**: `report_attachments`.
- **Exact Work to Perform**:
  - Jalankan kueri gerbang:
    ```sql
    SELECT id, ticket_id, source, file_name, created_at 
    FROM report_attachments 
    WHERE type_attachment_id IS NULL;
    ```
  - **ATURAN STOP GATE**: Jika kueri menghasilkan > 0 baris, **MIGRATION STOP**. Tidak boleh memaksakan *blind backfill* spekulatif hanya agar constraint NOT NULL terpenuhi. Hubungi supervisor/lead untuk resolusi data historis.
- **Validation/Acceptance Criteria**: Kueri mengembalikan **0 baris** (seluruh 48 rekaman terklasifikasi dengan dasar bukti yang sah).
- **Rollback Requirement**: Jika Stop Gate terpicu dan tidak ada bukti pendukung, tahan eksekusi pada Fase 2 (data tetap aman dalam mode dual).

---

### T017: Validate `type_attachment_id` Coverage
- **Objective**: Memastikan integritas referensial seluruh 48 baris lampiran merujuk ke ID master `type_attachment` yang valid.
- **Dependencies**: T016.
- **Files/Schema Affected**: `report_attachments`, `type_attachment`.
- **Exact Work to Perform**:
  - Jalankan kueri validasi coverage:
    ```sql
    SELECT ta.code, COUNT(ra.id) AS total_attachments
    FROM report_attachments ra
    JOIN type_attachment ta ON ra.type_attachment_id = ta.id
    GROUP BY ta.code;
    ```
- **Validation/Acceptance Criteria**: Total akumulasi `total_attachments` tepat 48 baris dan tidak ada foreign key orphan.
- **Rollback Requirement**: N/A.

---

## Phase 3 — Dual Compatibility Backend

### Phase 3 Compatibility Contract (True Dual-Write Architecture)
Berdasarkan fakta audit aktual metadata `information_schema`:
- `report_assignments.report_id`: **`BIGINT(20) NOT NULL`**
- `report_logs.report_id`: **`BIGINT(20) NOT NULL`**
- `report_attachments.report_id`: **`BIGINT(20) NOT NULL`**
- `telegram_pending_media.linked_report_id`: **`BIGINT(20) NULL`** (tanpa formal FK constraint ke `reports(id)`)

Maka selama Phase 3 (Dual Compatibility) hingga sebelum Phase 6 (Contract Phase), arsitektur sistem diikat oleh kontrak kompatibilitas berikut:
1. **Public & Business Identity**: Aplikasi sepenuhnya menggunakan `ticket_id` (`VARCHAR(100)`) untuk HTTP routes, query string, payload, controller parameters, dan template views.
2. **New Relational Identity**: Kolom `ticket_id` aktif terisi pada seluruh baris tabel anak.
3. **Legacy Relational Compatibility**: Kolom `report_id` pada tabel-tabel anak **TIDAK BOLEH bernilai NULL** karena kolom tersebut masih berstatus `NOT NULL` di skema live.
4. **Child Writes = True Dual-Write**: Setiap operasi INSERT baru pada `report_assignments`, `report_logs`, dan `report_attachments` **WAJIB mengisi kedua identifier secara bersamaan**:
   - `report_id` = resolved numeric `reports.id`
   - `ticket_id` = business key `reports.ticket_id`
   - Keduanya **wajib menunjuk ke baris laporan yang sama**.
   - **DILARANG** membuat query INSERT baru yang hanya menyertakan `ticket_id` tanpa `report_id`, karena database akan menolak eksekusi akibat pelanggaran constraint NOT NULL (`Field 'report_id' doesn't have a default value`).
5. **Child Reads = Prefer `ticket_id`**: Kueri SELECT dan JOIN aplikasi beralih membaca berbasis `ticket_id`, namun `reports.id` di-resolve di memori/service bila diperlukan untuk kompatibilitas penulisan legacy.
6. **Retention Period**: Kolom `reports.id` dan seluruh kolom legacy child `report_id` tetap dipertahankan penuh sampai seluruh Fase 5 (PK Switch) selesai dan periode observasi kontrak tercapai.

---

### T018: Refactor `models/attachmentModel.js` (True Dual-Write & Code Lookup)
- **Objective**: Menjadikan `attachmentModel.js` sebagai pusat manipulasi lampiran dengan dukungan koneksi transaksi, lookup dinamis via `code`, dan true dual-write (`report_id + ticket_id`).
- **Dependencies**: T017.
- **Files/Schema Affected**: `models/attachmentModel.js`.
- **Exact Work to Perform**:
  - Ubah signature `createAttachment(data, trxConnection = null)` agar menerima objek `data` yang memuat:
    - `ticket_id` (wajib)
    - `report_id` (legacy `reports.id`, wajib diisi selama Phase 3)
    - `source`
    - `type_attachment_code` (misal `'bukti_penanganan'` atau `'bukti_pelapor'`)
    - metadata berkas (`file_path`, `file_name`, `file_size`, `mime_type`, `uploaded_by_user_id`).
  - Tambahkan fungsi pembantu `getTypeIdByCode(code, trxConnection = null)` yang melakukan query:
    `SELECT id FROM type_attachment WHERE code = ?;`
  - Implementasikan query `INSERT INTO report_attachments` dengan **True Dual-Write**:
    ```sql
    INSERT INTO report_attachments (
      report_id, 
      ticket_id, 
      type_attachment_id, 
      file_path, 
      file_name, 
      file_size, 
      mime_type, 
      source, 
      uploaded_by_user_id, 
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
    ```
  - **PENTING**: Dilarang menghapus kolom `report_id` atau melakukan INSERT tanpa `report_id` sebelum Phase 6.
  - Ubah `getAttachmentsByTicketId(ticketId)` menggunakan query dengan `LEFT JOIN type_attachment ta ON ra.type_attachment_id = ta.id` untuk pembacaan UI.
- **Validation/Acceptance Criteria**: Unit test `createAttachment` berhasil menyimpan data dengan `report_id` dan `ticket_id` yang konsisten merujuk ke tiket yang sama. Query detail mengembalikan lampiran lengkap beserta `type_attachment_code` dan `type_attachment_name`.
- **Rollback Requirement**: Revert file `models/attachmentModel.js`.

---

### T019: Refactor `completeReport()` in `models/reportModel.js` (Dual-Write Resolution)
- **Objective**: Mengeliminasi SQL inline `INSERT INTO report_attachments`, me-resolve identitas tiket untuk legacy compatibility, dan mempertahankan atomisitas transaksi penyelesaian tiket dengan true dual-write serta nilai `source` yang valid.
- **Dependencies**: T018.
- **Files/Schema Affected**: `models/reportModel.js`.
- **Exact Work to Perform**:
  - Controller menerima `ticketId` dari `req.params.ticketId`.
  - Di dalam `completeReport(ticketId, updateData, connection)`:
    - Lakukan query resolusi report di dalam transaksi:
      `SELECT id, ticket_id FROM reports WHERE ticket_id = ? FOR UPDATE;`
    - Dapatkan nilai `report.id` (legacy) dan `report.ticket_id` (baru).
    - Delegasikan penyimpanan berkas lampiran dengan memanggil:
      ```javascript
      await attachmentModel.createAttachment({
        report_id: report.id,
        ticket_id: report.ticket_id,
        type_attachment_code: 'bukti_penanganan',
        file_path: attachmentData.file_path,
        file_name: attachmentData.file_name,
        file_size: attachmentData.file_size,
        mime_type: attachmentData.mime_type,
        source: 'manual', // Sesuai ENUM('telegram', 'manual') di database aktual
        uploaded_by_user_id: updateData.user_id
      }, connection);
      ```
    - **Ketentuan Nilai `source`**: Kolom `report_attachments.source` di database aktual berstatus `ENUM('telegram', 'manual')`. Berkas lampiran dari intake bot Telegram bernilai `source = 'telegram'`, sedangkan seluruh berkas internal/upload aplikasi (penyelesaian tiket, BA) WAJIB bernilai `source = 'manual'`. Dilarang menambahkan enum baru `'system'`.
    - Pastikan parameter `connection` (koneksi transaksi aktif) selalu diteruskan tanpa terputus.
  - Hapus fungsi duplikat `getAttachmentsByReportId()` dari `reportModel.js`.
- **Validation/Acceptance Criteria**:
  1. Baris baru di `report_attachments` terisi kedua kolom: `report_id = report.id` dan `ticket_id = report.ticket_id` dengan `source = 'manual'`.
  2. Simulasi error penyimpanan lampiran memicu rollback transaksi penuh (status laporan tidak berubah menjadi `'selesai'`).
- **Rollback Requirement**: Revert perubahan di `models/reportModel.js`.

---

### T020: Refactor Column Writes in `models/reportModel.js` (Scope Boundary)
- **Objective**: Mengeliminasi penulisan ke kolom denormalisasi `current_region_id` dan `current_assigned_user_id`, serta menghapus logika `from_region_id`/`to_region_id`, sembari mempertahankan kolom legacy `report_id` pada tabel anak.
- **Dependencies**: T019.
- **Files/Schema Affected**: `models/reportModel.js`.
- **Exact Work to Perform**:
  - Hapus pembaruan `current_assigned_user_id` dan `current_region_id` dari query update status laporan (`take`, `delegate`, `cancel`, `complete`, `escalate`, `follow_up`).
  - Hapus kolom `from_region_id` dan `to_region_id` dari seluruh statement `INSERT INTO report_assignments`.
  - **BATASAN RUANG LINGKUP**: Dilarang menghapus kolom `report_id` dari child tables pada Phase 3. Kolom `report_assignments.report_id`, `report_logs.report_id`, dan `report_attachments.report_id` tetap dipertahankan dan diisi.
- **Validation/Acceptance Criteria**: Kueri mutasi status berhasil dieksekusi tanpa menyentuh kolom denormalisasi dan tanpa menyertakan `from_region_id`/`to_region_id`.
- **Rollback Requirement**: Revert commit perubahan.

---

### T021: Refactor Assignment Operations with True Dual-Write
- **Objective**: Menstandarisasi pengelolaan penugasan aktif di `report_assignments` dengan pola true dual-write (`report_id + ticket_id`) dan kepatuhan invariant.
- **Dependencies**: T020.
- **Files/Schema Affected**: `models/reportModel.js`.
- **Exact Work to Perform**:
  - Resolusi identitas: Model me-resolve `reports.id` dan `reports.ticket_id` dari parameter `ticketId`.
  - **Self-Take**: INSERT baris baru `report_assignments` dengan dual-write:
    ```sql
    INSERT INTO report_assignments (
      report_id, 
      ticket_id, 
      assigned_to_user_id, 
      assigned_by_user_id, 
      assignment_type, 
      is_active, 
      created_at
    ) VALUES (?, ?, ?, ?, 'self_take', 1, NOW());
    ```
    (Wajib mengisi kedua kolom `report_id` dan `ticket_id`).
  - **Delegate**: UPDATE penugasan aktif sebelumnya menjadi `is_active = 0`, lalu INSERT baris baru dengan dual-write (`assignment_type = 'delegation', is_active = 1`).
  - **Cancel Assignment**: UPDATE baris aktif menjadi `is_active = 0`. Status tiket kembali `tersedia`.
  - **Complete / Follow-up / Escalate**: Tetap mempertahankan baris penugasan terakhir dengan `is_active = 1`.
- **Validation/Acceptance Criteria**: Setiap transisi penugasan memenuhi invariant (tersedia = 0 active row, non-tersedia = tepat 1 active row), dan baris baru terisi `report_id` serta `ticket_id` yang valid.
- **Rollback Requirement**: Revert file `models/reportModel.js`.

---

### T022: Refactor Report Log Operations with True Dual-Write
- **Objective**: Memastikan seluruh pencatatan riwayat audit pada `report_logs` menggunakan pola true dual-write (`report_id + ticket_id`), sementara pembacaan aplikasi menggunakan `ticket_id`.
- **Dependencies**: T021.
- **Files/Schema Affected**: `models/reportModel.js`.
- **Exact Work to Perform**:
  - Perbarui fungsi `createReportLog(logData, trxConnection = null)` agar menerima atau me-resolve `report_id` dan `ticket_id`.
  - Kueri INSERT `report_logs` WAJIB dual-write:
    ```sql
    INSERT INTO report_logs (
      report_id, 
      ticket_id, 
      user_id, 
      action, 
      notes, 
      created_at
    ) VALUES (?, ?, ?, ?, ?, NOW());
    ```
  - **PENTING**: Dilarang membuat INSERT yang hanya mengisi `ticket_id` karena `report_logs.report_id` berstatus `NOT NULL`.
  - Standarisasi fungsi pembacaan aplikasi: `getReportLogsByTicketId(ticketId)` menggunakan query berbasis `ticket_id`.
- **Validation/Acceptance Criteria**: Seluruh log audit baru tersimpan dengan kedua kolom `report_id` dan `ticket_id` terisi lengkap dan menunjuk ke laporan yang sama.
- **Rollback Requirement**: Revert file `models/reportModel.js`.

---

### T023: Refactor `models/dashboardModel.js`
- **Objective**: Menghapus dependensi query metrik dashboard terhadap `current_assigned_user_id` dan `current_region_id`.
- **Dependencies**: T022.
- **Files/Schema Affected**: `models/dashboardModel.js`.
- **Exact Work to Perform**:
  - Ganti filtering penugasan aktif menggunakan `JOIN report_assignments ra ON ra.ticket_id = reports.ticket_id AND ra.is_active = 1`.
  - Ganti pembacaan wilayah personil menggunakan `JOIN users u ON ra.assigned_to_user_id = u.id` dan `u.region_id`.
  - Ganti filtering wilayah tiket menggunakan `reports.reported_region_id`.
- **Validation/Acceptance Criteria**: Angka metrik dashboard Eksekutor dan Koordinator identik dengan sebelum refactor.
- **Rollback Requirement**: Revert file `models/dashboardModel.js`.

---

### T024: Refactor `models/supervisorModel.js`
- **Objective**: Memperbarui query KPI Supervisor agar merujuk ke `reported_region_id` dan penugasan aktif tanpa mengubah formula metrik.
- **Dependencies**: T023.
- **Files/Schema Affected**: `models/supervisorModel.js`.
- **Exact Work to Perform**:
  - Pertahankan penggunaan `rep.received_at` sebagai stempel waktu intake laporan dalam perhitungan durasi response time dan resolution time.
  - Perbarui join penugasan aktif ke `report_assignments (is_active = 1)`.
  - Pastikan dashboard Supervisor tetap bersifat *read-only*.
- **Validation/Acceptance Criteria**: Seluruh metrik KPI (MTTA, MTTR, volume tiket) menghasilkan nilai kalkulasi yang konsisten.
- **Rollback Requirement**: Revert file `models/supervisorModel.js`.

---

### T025: Refactor `models/pendingMediaModel.js` (Compatibility Mapping)
- **Objective**: Memperbarui penanganan buffer media Telegram dengan compatibility mapping (`linked_report_id` dan `linked_ticket_id`).
- **Dependencies**: T024.
- **Files/Schema Affected**: `models/pendingMediaModel.js`.
- **Exact Work to Perform**:
  - Kolom `linked_report_id` berstatus `NULLABLE` dan metadata aktual membuktikan tidak ada foreign key formal ke `reports(id)`.
  - Terapkan compatibility mapping:
    - Saat media berhasil ditautkan ke laporan:
      - `linked_report_id = legacy reports.id`
      - `linked_ticket_id = reports.ticket_id`
      - `status = 'linked'`
    - Saat media baru masuk:
      - `linked_report_id = NULL`
      - `linked_ticket_id = NULL`
      - `status = 'pending'`
  - Jangan mengasumsikan adanya constraint FK legacy pada `linked_report_id`.
- **Validation/Acceptance Criteria**: Media yang ditautkan terisi kedua identifier `linked_report_id` dan `linked_ticket_id` secara akurat.
- **Rollback Requirement**: Revert file `models/pendingMediaModel.js`.

---

### T026: Refactor Controllers to `ticketId` Architecture
- **Objective**: Menyelaraskan seluruh handler controller menerima parameter `req.params.ticketId` dan menjalankan mekanisme resolusi identitas untuk backward compatibility.
- **Dependencies**: T025.
- **Files/Schema Affected**: `controllers/reportController.js`.
- **Exact Work to Perform**:
  - Standardisasi arsitektur controller:
    - Layer HTTP menerima `req.params.ticketId`.
    - Resolver internal menerjemahkan `ticketId -> reports.id` untuk diteruskan ke operasi child tables yang membutuhkan dual-write.
  - Perbarui handler: `showReportDetail`, `showReportDetailJson`, `takeReport`, `markReportInProgress`, `completeReport`, `delegateReport`, `cancelAssignment`.
  - Dilarang mengembalikan rute publik menjadi integer ID.
- **Validation/Acceptance Criteria**: Controller memproses request berbasis `ticketId` alfanumerik tanpa error casting integer dan seluruh operasi write menghasilkan data dual-write.
- **Rollback Requirement**: Revert file `controllers/reportController.js`.

---

### T027: Refactor Routes to `:ticketId`
- **Objective**: Menstandarisasi pola URL semantik tiket pada rute web Express berbasis `ticketId`.
- **Dependencies**: T026.
- **Files/Schema Affected**: `routes/reportRoutes.js`.
- **Exact Work to Perform**:
  - Ubah definisi rute publik:
    - `/reports/:ticketId`
    - `/reports/:ticketId/detail-json`
    - `/reports/:ticketId/take`
    - `/reports/:ticketId/in-progress`
    - `/reports/:ticketId/complete`
    - `/reports/:ticketId/delegate`
    - `/reports/:ticketId/cancel-assignment`
  - Pastikan tidak ada rute publik yang kembali ke format numerik `/reports/:id`.
- **Validation/Acceptance Criteria**: Request HTTP ke rute berbasis `ticketId` ter-route dengan tepat ke controller terkait.
- **Rollback Requirement**: Revert file `routes/reportRoutes.js`.

---

### T028: Refactor Views, Partials, and Frontend Dataset
- **Objective**: Memperbarui template EJS dan elemen antarmuka agar menggunakan `report.ticket_id` dan dataset polling `received_at`.
- **Dependencies**: T027.
- **Files/Schema Affected**:
  - `views/reports/index.ejs`, `views/reports/show.ejs`
  - `views/eksekutor/reports/index.ejs`
  - `views/koordinator/reports/index.ejs`, `views/koordinator/reports/show.ejs`
  - `views/partials/report-queue-fragment.ejs`, `views/partials/report-action-buttons.ejs`, `views/partials/report-detail-modal.ejs`
- **Exact Work to Perform**:
  - Ganti atribut `data-report-id` menjadi `data-ticket-id`.
  - Pasang dataset `data-received-at` pada kontainer antrean.
  - Perbarui AJAX fetch pada modal detail ke `/reports/${ticketId}/detail-json`.
  - Tampilkan pemisahan rapi antara "Bukti Pelapor (Telegram)" dan "Bukti Penanganan (Sistem)" berdasarkan `type_attachment_code`.
- **Validation/Acceptance Criteria**: Seluruh tombol aksi, form action, dan AJAX modal memanggil URL berbasis `ticketId` dan menampilkan data lampiran dengan benar.
- **Rollback Requirement**: Revert berkas-berkas template EJS.

---

### T029: Refactor Polling Endpoint to `(received_at, ticket_id)` Cursor
- **Objective**: Mengimplementasikan kursor deterministik berbasis stempel waktu laporan dan tie-breaker string tiket dari baris yang sama.
- **Dependencies**: T028.
- **Files/Schema Affected**: `models/reportModel.js`, `controllers/reportController.js`, `public/js/queue-auto-refresh.js`.
- **Exact Work to Perform**:
  - Pada `reportModel.getNewReportStats(sinceReceivedAt, sinceTicketId, ...)`:
    Gunakan klausa deterministik:
    ```sql
    WHERE (
      COALESCE(reports.received_at, reports.created_at) > :sinceReceivedAt
      OR (
        COALESCE(reports.received_at, reports.created_at) = :sinceReceivedAt 
        AND reports.ticket_id > :sinceTicketId
      )
    )
    ```
  - Pastikan kursor terbaru (`latest_received_at` dan `latest_ticket_id`) diambil dari record teratas yang sama via `ORDER BY COALESCE(received_at, created_at) DESC, ticket_id DESC LIMIT 1`.
  - Perbarui script `queue-auto-refresh.js` untuk menyimpan dan mengirimkan kedua parameter kursor tersebut.
- **Validation/Acceptance Criteria**: Endpoint `GET /reports/check-new` mengembalikan respon JSON valid dengan kursor terbaru dan mendeteksi tiket baru tanpa melewatkan data (*no missed updates*).
- **Rollback Requirement**: Revert perubahan polling pada controller, model, dan client script.

---

## Phase 4 — Validation

### T030: Validate Active Assignment Invariant
- **Objective**: Memverifikasi kepatuhan aturan penugasan tunggal pada seluruh laporan live.
- **Dependencies**: T029.
- **Files/Schema Affected**: `report_assignments`, `reports`.
- **Exact Work to Perform**:
  - Jalankan 3 kueri validasi invariant penugasan:
    ```sql
    -- 1. Deteksi duplikasi active assignment
    SELECT ticket_id, COUNT(*) FROM report_assignments WHERE is_active = 1 GROUP BY ticket_id HAVING COUNT(*) > 1;

    -- 2. Deteksi tiket tersedia yang ber-assignment
    SELECT r.ticket_id FROM reports r JOIN report_assignments ra ON ra.ticket_id = r.ticket_id AND ra.is_active = 1 WHERE r.status_internal = 'tersedia';

    -- 3. Deteksi tiket non-tersedia tanpa tepat 1 assignment aktif
    SELECT r.ticket_id FROM reports r LEFT JOIN report_assignments ra ON ra.ticket_id = r.ticket_id AND ra.is_active = 1 WHERE r.status_internal != 'tersedia' GROUP BY r.ticket_id HAVING COUNT(ra.id) != 1;
    ```
- **Validation/Acceptance Criteria**: Ketiga kueri mengembalikan **0 baris**.
- **Rollback Requirement**: Jika gagal, perbaiki inkonsistensi data penugasan sebelum melanjutkan.

---

### T031: Validate Attachment Transaction & Read Integrity
- **Objective**: Memverifikasi fungsionalitas transaksi atomik pada `completeReport` dan keterbacaan berkas lampiran.
- **Dependencies**: T030.
- **Files/Schema Affected**: `models/attachmentModel.js`, `models/reportModel.js`.
- **Exact Work to Perform**:
  - Uji simpan lampiran penanganan saat penyelesaian tiket.
  - Verifikasi bahwa modal detail membaca lampiran dengan benar melalui `LEFT JOIN type_attachment`.
- **Validation/Acceptance Criteria**: Berkas lampiran tersimpan dengan `type_attachment_id` yang sesuai, dan query detail tidak mengalami error.
- **Rollback Requirement**: Perbaiki fungsi pembantu jika transaksi tidak atomik.

---

### T032: Validate Dual-Write Consistency, Foreign Key & Orphan Integrity
- **Objective**: Memverifikasi integritas referensial dan konsistensi true dual-write antara `report_id` dan `ticket_id` pada seluruh tabel anak, serta memastikan tidak ada pelanggaran NOT NULL.
- **Dependencies**: T031.
- **Files/Schema Affected**: `report_assignments`, `report_logs`, `report_attachments`, `telegram_pending_media`.
- **Exact Work to Perform**:
  - Jalankan 3 set kueri verifikasi integritas:
    ```sql
    -- 1. Deteksi inkonsistensi pointer dual-write (keduanya wajib menunjuk ke laporan yang sama)
    SELECT COUNT(*) AS mismatch_assignments 
    FROM report_assignments ra 
    JOIN reports r ON ra.report_id = r.id 
    WHERE ra.ticket_id <> r.ticket_id;

    SELECT COUNT(*) AS mismatch_logs 
    FROM report_logs rl 
    JOIN reports r ON rl.report_id = r.id 
    WHERE rl.ticket_id <> r.ticket_id;

    SELECT COUNT(*) AS mismatch_attachments 
    FROM report_attachments rat 
    JOIN reports r ON rat.report_id = r.id 
    WHERE rat.ticket_id <> r.ticket_id;

    -- 2. Deteksi pelanggaran constraint NOT NULL pada legacy report_id
    SELECT COUNT(*) AS null_assignment_report_id FROM report_assignments WHERE report_id IS NULL;
    SELECT COUNT(*) AS null_log_report_id FROM report_logs WHERE report_id IS NULL;
    SELECT COUNT(*) AS null_attachment_report_id FROM report_attachments WHERE report_id IS NULL;

    -- 3. Deteksi baris yatim (orphan) terhadap reports.ticket_id
    SELECT COUNT(*) AS orphan_assignments FROM report_assignments ra LEFT JOIN reports r ON ra.ticket_id = r.ticket_id WHERE r.ticket_id IS NULL;
    SELECT COUNT(*) AS orphan_logs FROM report_logs rl LEFT JOIN reports r ON rl.ticket_id = r.ticket_id WHERE r.ticket_id IS NULL;
    SELECT COUNT(*) AS orphan_attachments FROM report_attachments rat LEFT JOIN reports r ON rat.ticket_id = r.ticket_id WHERE r.ticket_id IS NULL;
    SELECT COUNT(*) AS orphan_pending_media FROM telegram_pending_media tpm LEFT JOIN reports r ON tpm.linked_ticket_id = r.ticket_id WHERE tpm.linked_ticket_id IS NOT NULL AND r.ticket_id IS NULL;
    ```
- **Validation/Acceptance Criteria**: Seluruh kueri verifikasi di atas menghasilkan tepat nilai **0**.
- **Rollback Requirement**: Perbaiki mapping dual-write yang tidak konsisten atau tangani record orphan sebelum melangkah ke T033.

---

### T033: Validate Regression Tests
- **Objective**: Menjalankan pengujian regresi menyeluruh untuk alur operasional utama.
- **Dependencies**: T032.
- **Files/Schema Affected**: Seluruh modul aplikasi.
- **Exact Work to Perform**:
  - Uji alur intake bot Telegram (D-011, D-018).
  - Uji hak akses RBAC (Eksekutor, Koordinator, Supervisor, Super Admin).
  - Uji alur F007 Temporary Region Switch.
  - Uji konsistensi metrik dashboard KPI Supervisor.
- **Validation/Acceptance Criteria**: Seluruh test case regresi berstatus **PASS (100%)**.
- **Rollback Requirement**: Checkout ke checkpoint tag `f033-pre-migration-baseline` jika ditemukan regresi fatal.

---

### T034: Grep for Legacy Column Dependencies
- **Objective**: Memverifikasi secara otomatis bahwa tidak ada lagi kode aktif yang bergantung pada kolom legacy.
- **Dependencies**: T033.
- **Files/Schema Affected**: Direktori `models/`, `controllers/`, `routes/`, `views/`.
- **Exact Work to Perform**:
  - Jalankan pencarian string pada codebase:
    - `reports.current_region_id`
    - `reports.current_assigned_user_id`
    - `from_region_id` (pada query report_assignments)
    - `to_region_id` (pada query report_assignments)
    - `reports.id` (kecuali adapter legacy fallback)
- **Validation/Acceptance Criteria**: Nol referensi query operasional aktif ke kolom-kolom usang tersebut.
- **Rollback Requirement**: Bersihkan sisa dependensi kode sebelum masuk ke Fase 5.

---

### T035: Validate Polling Determinism
- **Objective**: Menguji keandalan kursor komposit polling pada endpoint `GET /reports/check-new`.
- **Dependencies**: T034.
- **Files/Schema Affected**: Endpoint polling.
- **Exact Work to Perform**:
  - Simulasikan intake 2 laporan berturut-turut.
  - Panggil endpoint `check-new` dengan kursor stempel waktu dan tiket sebelumnya.
- **Validation/Acceptance Criteria**: Respon mengembalikan laporan baru tanpa duplikasi dan kursor bergeser maju secara akurat.
- **Rollback Requirement**: Perbaiki logika tie-breaker leksikografis jika urutan kursor melompat.

---

### T036: PRE-SWITCH GATE
- **Objective**: Memastikan seluruh persyaratan integritas pra-pengalihan kunci terpenuhi sebelum DDL breaking dieksekusi.
- **Dependencies**: T030, T031, T032, T033, T034, T035.
- **Files/Schema Affected**: Seluruh arsitektur.
- **Exact Work to Perform**:
  - Verifikasi ceklist:
    - [ ] Zero orphan rows
    - [ ] 48 attachments terklasifikasi
    - [ ] Active assignment invariant PASS
    - [ ] Nol referensi legacy
    - [ ] Full backup tersedia
- **Validation/Acceptance Criteria**: Persetujuan formal untuk beralih ke Fase 5 (*Switch FK/PK*) mensyaratkan seluruh kriteria ceklist di atas berstatus PASS.
- **Rollback Requirement**: Jika belum siap, tunda migrasi; sistem tetap berjalan normal dalam mode *Dual Compatibility*.

---

## Phase 5 — FK/PK Switch

### T037: Capture Actual FK Names Dynamically
- **Objective**: Mengambil nama constraint foreign key aktual yang mengarah ke `reports.id` dan nama unique index eksisting pada `reports.ticket_id` langsung dari metadata MySQL secara dinamis tanpa mengasumsikan nama atau keberadaan constraint secara apriori.
- **Dependencies**: T036.
- **Files/Schema Affected**: `information_schema.KEY_COLUMN_USAGE`, `information_schema.STATISTICS`.
- **Exact Work to Perform**:
  - Jalankan query dinamis:
    ```sql
    SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND REFERENCED_TABLE_NAME = 'reports' 
      AND REFERENCED_COLUMN_NAME = 'id';

    -- Rekam nama dan metadata unique index aktual lama pada reports.ticket_id:
    SHOW INDEX FROM reports WHERE Column_name = 'ticket_id' AND Non_unique = 0 AND Key_name != 'PRIMARY';
    ```
  - Catat nama constraint FK untuk tabel-tabel anak yang terbukti memiliki constraint aktif di metadata (`report_assignments`, `report_logs`, `report_attachments`).
  - Verifikasi apakah `telegram_pending_media` memiliki foreign key constraint aktif ke `reports(id)`. Jika tidak ada pada hasil query `information_schema` (sesuai audit aktual), tandai bahwa tidak ada FK yang perlu di-drop pada tabel tersebut.
  - Catat nama unique index aktual lama pada `reports.ticket_id` (misal `ticket_id` atau `ticket_id_UNIQUE`) beserta metadatanya untuk kebutuhan rollback T042.
- **Validation/Acceptance Criteria**: Diperoleh daftar nama constraint eksisting dan nama unique index lama yang valid dan dinamis langsung dari metadata MySQL tanpa asumsi nama hardcoded.
- **Rollback Requirement**: N/A.

---

### T038: Drop Old Foreign Keys Referencing `reports.id` (FK Safety)
- **Objective**: Melepaskan seluruh foreign key lama yang mengarah ke `reports(id)` hanya untuk constraint yang benar-benar ditemukan pada metadata T037, menggunakan nama constraint aktual.
- **Dependencies**: T037.
- **Files/Schema Affected**: `report_assignments`, `report_logs`, `report_attachments` (dan `telegram_pending_media` HANYA jika constraint terdaftar).
- **Exact Work to Perform**:
  - Jalankan perintah drop foreign key hanya untuk constraint yang teridentifikasi secara dinamis di T037:
    ```sql
    ALTER TABLE report_assignments DROP FOREIGN KEY `<discovered_assignment_fk_name>`;
    ALTER TABLE report_logs DROP FOREIGN KEY `<discovered_log_fk_name>`;
    ALTER TABLE report_attachments DROP FOREIGN KEY `<discovered_attachment_fk_name>`;
    -- HANYA jalankan jika query T037 membuktikan adanya constraint FK aktif pada telegram_pending_media:
    -- ALTER TABLE telegram_pending_media DROP FOREIGN KEY `<discovered_pending_media_fk_name>`;
    ```
  - Dilarang keras mencoba drop foreign key pada tabel yang tidak memiliki foreign key constraint di `information_schema`.
- **Validation/Acceptance Criteria**: Query verifikasi metadata pada T037 mengembalikan 0 baris constraint yang merujuk ke `reports(id)`.
- **Rollback Requirement**: Pasang kembali foreign key lama menggunakan nama constraint yang tercatat pada T004/T037 jika proses switch dibatalkan.

---

### T039: Create Temporary Index on `reports.id` (`idx_reports_legacy_id`)
- **Objective**: Membuat temporary index pada `reports.id` agar kolom `AUTO_INCREMENT` tetap memiliki indeks sesuai syarat mutlak MySQL sebelum PRIMARY KEY dilepas.
- **Dependencies**: T038.
- **Files/Schema Affected**: Tabel `reports`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE reports ADD INDEX idx_reports_legacy_id (id);
    ```
- **Validation/Acceptance Criteria**: `SHOW INDEX FROM reports WHERE Key_name = 'idx_reports_legacy_id';` mengembalikan 1 baris.
- **Rollback Requirement**: `ALTER TABLE reports DROP INDEX idx_reports_legacy_id;`.

---

### T040: Drop Old Primary Key on `reports`
- **Objective**: Melepaskan status PRIMARY KEY dari kolom legacy `reports.id`.
- **Dependencies**: T039.
- **Files/Schema Affected**: Tabel `reports`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE reports DROP PRIMARY KEY;
    ```
- **Validation/Acceptance Criteria**: DDL berhasil tanpa error 1075 karena `id` telah terindeks via `idx_reports_legacy_id`.
- **Rollback Requirement**: `ALTER TABLE reports ADD PRIMARY KEY (id);`.

---

### T041: Add `PRIMARY KEY (ticket_id)` on `reports`
- **Objective**: Menetapkan `ticket_id VARCHAR(100)` sebagai PRIMARY KEY tunggal pada tabel `reports`.
- **Dependencies**: T040.
- **Files/Schema Affected**: Tabel `reports`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE reports ADD PRIMARY KEY (ticket_id);
    ```
- **Validation/Acceptance Criteria**: `SHOW KEYS FROM reports WHERE Key_name = 'PRIMARY';` menunjukkan kolom `ticket_id`.
- **Rollback Requirement**: `ALTER TABLE reports DROP PRIMARY KEY; ALTER TABLE reports ADD PRIMARY KEY (id);`.

---

### T042: Identify and Remove Redundant Old UNIQUE Index on `ticket_id`
- **Objective**: Mengidentifikasi dan melepaskan indeks `UNIQUE` lama yang terpisah pada `ticket_id` karena `ticket_id` telah menjadi PRIMARY KEY.
- **Dependencies**: T041.
- **Files/Schema Affected**: Tabel `reports`.
- **Exact Work to Perform**:
  - Jalankan inspeksi:
    ```sql
    SHOW INDEX FROM reports WHERE Column_name = 'ticket_id' AND Key_name != 'PRIMARY';
    ```
  - Jika ditemukan nama indeks unik lama (misal `ticket_id` atau `ticket_id_UNIQUE`), lepaskan:
    ```sql
    ALTER TABLE reports DROP INDEX `<discovered_old_unique_index_name>`;
    ```
  - **PENTING**: Dilarang menghapus PRIMARY KEY `ticket_id`.
- **Validation/Acceptance Criteria**: `SHOW INDEX FROM reports WHERE Column_name = 'ticket_id';` hanya menyisakan satu indeks yaitu `PRIMARY`.
- **Rollback Requirement**:
  ```sql
  -- Rollback T042 memakai nama unique index aktual yang dicatat dari T004/T037 (bukan anonymous index):
  ALTER TABLE reports ADD UNIQUE INDEX `<discovered_old_unique_index_name>` (ticket_id);
  ```
  *(Catatan Keamanan: Gunakan nama index unik aktual yang dicatat dari metadata, dilarang membuat anonymous index; pastikan constraint unique pada ticket_id dipulihkan secara presisi sehingga PRIMARY KEY reports.id dapat dipulihkan secara aman).*

---

### T043: Add New Foreign Keys to `reports(ticket_id)`
- **Objective**: Memasang constraint foreign key baru dari child tables ke `reports(ticket_id)`.
- **Dependencies**: T042.
- **Files/Schema Affected**: `report_assignments`, `report_attachments`, `telegram_pending_media`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE report_assignments MODIFY COLUMN ticket_id VARCHAR(100) NOT NULL;
    ALTER TABLE report_assignments ADD CONSTRAINT fk_assignments_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE CASCADE;

    ALTER TABLE report_attachments MODIFY COLUMN ticket_id VARCHAR(100) NOT NULL;
    ALTER TABLE report_attachments ADD CONSTRAINT fk_attachments_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE CASCADE;

    ALTER TABLE telegram_pending_media ADD CONSTRAINT fk_pending_media_ticket FOREIGN KEY (linked_ticket_id) REFERENCES reports(ticket_id) ON DELETE SET NULL;
    ```
- **Validation/Acceptance Criteria**: Constraint FK baru terdaftar di `information_schema.TABLE_CONSTRAINTS`.
- **Rollback Requirement**: Drop constraint FK baru tersebut.

---

### T044: Add Foreign Key `type_attachment` on `report_attachments`
- **Objective**: Menerapkan constraint foreign key dan NOT NULL pada `report_attachments(type_attachment_id)`.
- **Dependencies**: T043.
- **Files/Schema Affected**: `report_attachments`, `type_attachment`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE report_attachments MODIFY COLUMN type_attachment_id INT NOT NULL;
    ALTER TABLE report_attachments ADD CONSTRAINT fk_attachments_type FOREIGN KEY (type_attachment_id) REFERENCES type_attachment(id) ON DELETE RESTRICT;
    ```
- **Validation/Acceptance Criteria**: Kolom `type_attachment_id` berstatus `NOT NULL` dan constraint FK aktif dengan aturan `ON DELETE RESTRICT`.
- **Rollback Requirement**: Drop FK `fk_attachments_type` dan ubah kolom menjadi nullable.

---

### T045: Apply `ON DELETE RESTRICT` Policy on `report_logs`
- **Objective**: Memasang foreign key pada `report_logs(ticket_id)` dengan proteksi riwayat audit trail (non-kaskade).
- **Dependencies**: T044.
- **Files/Schema Affected**: `report_logs`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE report_logs MODIFY COLUMN ticket_id VARCHAR(100) NOT NULL;
    ALTER TABLE report_logs ADD CONSTRAINT fk_logs_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE RESTRICT;
    ```
- **Validation/Acceptance Criteria**: `information_schema.REFERENTIAL_CONSTRAINTS` mencatat `DELETE_RULE = 'RESTRICT'` untuk `fk_logs_ticket`.
- **Rollback Requirement**: Drop constraint `fk_logs_ticket`.

---

### T046: Add Performance Indexes
- **Objective**: Menambahkan indeks komposit penunjang operasional antrean dan polling deterministik.
- **Dependencies**: T045.
- **Files/Schema Affected**: `reports`, `report_assignments`, `report_attachments`, `report_logs`.
- **Exact Work to Perform**:
  - Jalankan DDL pembuatan indeks:
    ```sql
    CREATE INDEX idx_reports_received_ticket ON reports (received_at, ticket_id);
    CREATE INDEX idx_assignments_ticket_active ON report_assignments (ticket_id, is_active);
    CREATE INDEX idx_assignments_user_active ON report_assignments (assigned_to_user_id, is_active);
    CREATE INDEX idx_attachments_ticket_type ON report_attachments (ticket_id, type_attachment_id);
    CREATE INDEX idx_logs_ticket_created ON report_logs (ticket_id, created_at);
    ```
- **Validation/Acceptance Criteria**: Seluruh indeks komposit terdaftar aktif.
- **Rollback Requirement**: `DROP INDEX <index_name> ON <table_name>;`.

---

### T047: POST-SWITCH GATE
- **Objective**: Memverifikasi integritas penuh database pasca pengalihan kunci utama ke `ticket_id`.
- **Dependencies**: T046.
- **Files/Schema Affected**: Seluruh skema database.
- **Exact Work to Perform**:
  - Jalankan kueri validasi Gate 4:
    1. Verifikasi `reports.ticket_id` adalah PRIMARY KEY.
    2. Verifikasi tidak ada redundant UNIQUE index pada `ticket_id`.
    3. Verifikasi temporary index `idx_reports_legacy_id` aktif menjaga sifat `AUTO_INCREMENT`.
    4. Verifikasi seluruh Foreign Key baru aktif dan valid.
    5. Verifikasi *zero-loss data* terhadap baseline audit: `reports=54`, `report_assignments=55`, `report_logs=329`, `report_attachments=48`, `manual_non_ticketing_reports=4`.
- **Validation/Acceptance Criteria**: Seluruh 5 poin validasi Gate 4 berstatus **PASS (100%)**.
- **Rollback Requirement**: Jika gagal, jalankan prosedur Rollback Checkpoint 3 (Fase 5 PK/FK Switch) sebelum beralih ke Fase 6.

---

## Phase 6 — Contract (Destructive DDL)

> [!CAUTION]
> **Prasyarat Mutlak Eksekusi Fase Kontraksi Skema**:
> Tindakan destruktif berupa pelepasan kolom legacy:
> - `DROP COLUMN report_attachments.report_id` (T053)
> - `DROP COLUMN report_assignments.report_id` (T054)
> - `DROP COLUMN report_logs.report_id` (T055)
> - `DROP COLUMN telegram_pending_media.linked_report_id` (T056)
> - `DROP COLUMN reports.id` (T050)
> **HANYA BOLEH DILAKUKAN SETELAH SELURUH KONDISI BERIKUT TERPENUHI**:
> 1. Seluruh backend dual-write berjalan stabil dan teruji pada periode observasi;
> 2. `reports.ticket_id` telah sah dan aktif 100% sebagai PRIMARY KEY;
> 3. Seluruh constraint Foreign Key baru (`fk_assignments_ticket`, `fk_attachments_ticket`, `fk_logs_ticket`, `fk_pending_media_ticket`, `fk_attachments_type`) telah aktif dan tervalidasi;
> 4. Seluruh rangkaian regression tests lulus 100% tanpa regresi fungsional;
> 5. Hasil audit kode statis mengonfirmasi tidak ada lagi satu pun kueri operasional yang membutuhkan atau memanggil `report_id` atau `reports.id`;
> 6. Uji coba dry-run restore dari snapshot backup T003 pada database sementara telah terbukti berhasil dipulihkan tanpa error;
> 7. Masa transisi kompatibilitas (*compatibility period*) telah selesai secara formal.

---

### T048: Confirm No Backend / Frontend Dependency on `reports.id`
- **Objective**: Melakukan audit final untuk memastikan tidak ada satu pun baris kode aplikasi yang masih mengakses `reports.id`, serta menjalankan verifikasi restorasi backup pra-kontraksi skema.
- **Dependencies**: T047.
- **Files/Schema Affected**: Seluruh kode sumber aplikasi dan lingkungan backup.
- **Exact Work to Perform**:
  - Lakukan automated test run dan monitoring log transaksi aplikasi selama periode observasi.
  - Jalankan verifikasi *dry-run restore* dari file backup T003 (`backup_pre_f033_full.sql`) ke basis data sementara sesuai protokol T003 untuk membuktikan validitas backup sebelum mengeksekusi DDL destruktif pada Fase 6.
- **Validation/Acceptance Criteria**:
  1. Zero runtime exceptions terkait kolom `reports.id`.
  2. Hasil uji dry-run restore membuktikan data dan skema dapat dipulihkan secara utuh tanpa kendala.
- **Rollback Requirement**: Tunda Fase 6 jika masih ada dependensi tersembunyi atau jika uji restore mengalami kendala.

---

### T049: Confirm No Child `report_id` Dependency
- **Objective**: Memastikan tidak ada query join, filter, atau relasi yang masih memanfaatkan kolom `report_id` pada child tables.
- **Dependencies**: T048.
- **Files/Schema Affected**: Seluruh model query (`attachmentModel.js`, `reportModel.js`, `pendingMediaModel.js`, `dashboardModel.js`, `supervisorModel.js`).
- **Exact Work to Perform**:
  - Verifikasi seluruh join dan filter tabel anak murni bertumpu pada `ticket_id`.
  - Pastikan operasi insert dual-write telah siap dimatikan saat kolom legacy di-drop.
- **Validation/Acceptance Criteria**: Konfirmasi 100% independensi dari `report_id` pada seluruh baris kode.
- **Rollback Requirement**: Bersihkan dependensi yang tersisa sebelum menjalankan DDL T050.

---

### T050: Drop `reports.id` and Legacy Index
- **Objective**: Menghapus kolom kunci pengganti usang `id` dari tabel `reports` setelah seluruh prasyarat kontrak dan independensi terpenuhi.
- **Dependencies**: T049.
- **Files/Schema Affected**: Tabel `reports`.
- **Exact Work to Perform**:
  - Pastikan seluruh prasyarat Phase 6 telah terpenuhi.
  - Jalankan DDL:
    ```sql
    ALTER TABLE reports DROP COLUMN id;
    -- Catatan: jika indeks idx_reports_legacy_id perlu di-drop terpisah:
    -- ALTER TABLE reports DROP INDEX idx_reports_legacy_id;
    ```
- **Validation/Acceptance Criteria**: `SHOW COLUMNS FROM reports LIKE 'id';` mengembalikan 0 baris.
- **Rollback Requirement**: **Point of No Return**. Rollback setelah task ini hanya dapat dilakukan melalui restorasi backup snapshot penuh T003.

---

### T051: Drop `reports.current_region_id`
- **Objective**: Menghapus kolom redundan wilayah aktif dari tabel `reports`.
- **Dependencies**: T050.
- **Files/Schema Affected**: Tabel `reports`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE reports DROP COLUMN current_region_id;
    ```
- **Validation/Acceptance Criteria**: Kolom `current_region_id` terhapus dari `reports`.
- **Rollback Requirement**: Restorasi snapshot penuh.

---

### T052: Drop `reports.current_assigned_user_id`
- **Objective**: Menghapus kolom redundan penanggung jawab aktif dari tabel `reports`.
- **Dependencies**: T051.
- **Files/Schema Affected**: Tabel `reports`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE reports DROP COLUMN current_assigned_user_id;
    ```
- **Validation/Acceptance Criteria**: Kolom `current_assigned_user_id` terhapus dari `reports`.
- **Rollback Requirement**: Restorasi snapshot penuh.

---

### T053: Drop `report_attachments.report_id`
- **Objective**: Menghapus kolom foreign key legacy `report_id` dari tabel lampiran setelah seluruh prasyarat Phase 6 terpenuhi.
- **Dependencies**: T052.
- **Files/Schema Affected**: Tabel `report_attachments`.
- **Exact Work to Perform**:
  - Konfirmasi bahwa backend dual-write telah digantikan dengan single-write ke `ticket_id`, FK `ticket_id` aktif, dan regression test pass.
  - Jalankan DDL:
    ```sql
    ALTER TABLE report_attachments DROP COLUMN report_id;
    ```
- **Validation/Acceptance Criteria**: Kolom `report_id` terhapus dari `report_attachments`.
- **Rollback Requirement**: Restorasi snapshot penuh.

---

### T054: Drop `report_assignments.report_id`
- **Objective**: Menghapus kolom foreign key legacy `report_id` dari tabel penugasan setelah seluruh prasyarat Phase 6 terpenuhi.
- **Dependencies**: T053.
- **Files/Schema Affected**: Tabel `report_assignments`.
- **Exact Work to Perform**:
  - Konfirmasi bahwa backend dual-write telah digantikan dengan single-write ke `ticket_id`, FK `ticket_id` aktif, dan regression test pass.
  - Jalankan DDL:
    ```sql
    ALTER TABLE report_assignments DROP COLUMN report_id;
    ```
- **Validation/Acceptance Criteria**: Kolom `report_id` terhapus dari `report_assignments`.
- **Rollback Requirement**: Restorasi snapshot penuh.

---

### T055: Drop `report_logs.report_id`
- **Objective**: Menghapus kolom foreign key legacy `report_id` dari tabel audit trail setelah seluruh prasyarat Phase 6 terpenuhi.
- **Dependencies**: T054.
- **Files/Schema Affected**: Tabel `report_logs`.
- **Exact Work to Perform**:
  - Konfirmasi bahwa backend dual-write telah digantikan dengan single-write ke `ticket_id`, FK `ticket_id` aktif, dan regression test pass.
  - Jalankan DDL:
    ```sql
    ALTER TABLE report_logs DROP COLUMN report_id;
    ```
- **Validation/Acceptance Criteria**: Kolom `report_id` terhapus dari `report_logs`.
- **Rollback Requirement**: Restorasi snapshot penuh.

---

### T056: Drop `telegram_pending_media.linked_report_id`
- **Objective**: Menghapus kolom foreign key legacy `linked_report_id` dari tabel buffer pending media.
- **Dependencies**: T055.
- **Files/Schema Affected**: Tabel `telegram_pending_media`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE telegram_pending_media DROP COLUMN linked_report_id;
    ```
- **Validation/Acceptance Criteria**: Kolom `linked_report_id` terhapus dari `telegram_pending_media`.
- **Rollback Requirement**: Restorasi snapshot penuh.

---

### T057: Drop `from_region_id` and `to_region_id` from `report_assignments`
- **Objective**: Menghapus kolom duplikasi wilayah user dari tabel penugasan sesuai desain ERD Final.
- **Dependencies**: T056.
- **Files/Schema Affected**: Tabel `report_assignments`.
- **Exact Work to Perform**:
  - Jalankan DDL:
    ```sql
    ALTER TABLE report_assignments DROP COLUMN from_region_id;
    ALTER TABLE report_assignments DROP COLUMN to_region_id;
    ```
- **Validation/Acceptance Criteria**: Kolom `from_region_id` dan `to_region_id` terhapus total dari `report_assignments`.
- **Rollback Requirement**: Restorasi snapshot penuh.

---

### T058: Final Schema Validation
- **Objective**: Melakukan audit komprehensif terhadap seluruh struktur skema basis data pasca kontraksi skema.
- **Dependencies**: T057.
- **Files/Schema Affected**: Seluruh basis data `db_penanganan_gangguan`.
- **Exact Work to Perform**:
  - Jalankan `SHOW CREATE TABLE` pada seluruh tabel terkait:
    - `reports`: PK `ticket_id VARCHAR(100)`, kolom waktu `received_at`, kolom `reported_region_id`.
    - `report_assignments`: bebas dari `from_region_id`/`to_region_id`, FK `ticket_id`.
    - `type_attachment`: `code VARCHAR(50) UNIQUE`, `name`, `description`.
    - `report_attachments`: FK `ticket_id`, FK `type_attachment_id` NOT NULL.
    - `report_logs`: FK `ticket_id` dengan aturan RESTRICT.
    - `telegram_pending_media`: FK `linked_ticket_id`, status enum `'pending','linked','expired'`.
- **Validation/Acceptance Criteria**: Seluruh skema terbukti 100% identik dengan target desain ERD final.
- **Rollback Requirement**: N/A.

---

### T059: Final Regression Test
- **Objective**: Menjalankan pengujian akhir end-to-end terhadap seluruh alur operasional sistem pada skema ternormalisasi.
- **Dependencies**: T058.
- **Files/Schema Affected**: Seluruh lapisan sistem.
- **Exact Work to Perform**:
  - Jalankan seluruh rangkaian tes otomatis dan pengujian manual RBAC, bot Telegram, F007 switch, KPI supervisor, dan polling deterministik.
- **Validation/Acceptance Criteria**: 100% tests pass tanpa kegagalan fungsional.
- **Rollback Requirement**: N/A.

---

### T060: Final Backup and Post-Migration Checkpoint
- **Objective**: Membuat snapshot cadangan akhir dari basis data yang telah berhasil dinormalisasi dan menetapkan git release tag.
- **Dependencies**: T059.
- **Files/Schema Affected**: Database snapshot & Git tag.
- **Exact Work to Perform**:
  - Eksekusi backup final:
    ```bash
    mysqldump -u root -p --routines --triggers db_penanganan_gangguan > backup_post_f033_normalized_final.sql
    ```
  - Buat git release tag:
    `git tag -a f033-normalization-completed -m "Feature F033 Report Identity & Database Normalization Selesai"`
- **Validation/Acceptance Criteria**: File backup `backup_post_f033_normalized_final.sql` terbentuk utuh dan git tag tercatat.
- **Rollback Requirement**: N/A (Migrasi selesai dengan sukses).

---

## Ringkasan Arsitektur Migrasi & Kontrol Keamanan

### 1. Final Audit Database Baseline
Tolak ukur *zero-loss data* wajib konsisten terhadap hasil audit live berikut:
- `reports`: **54 baris**
- `report_assignments`: **55 baris**
- `report_logs`: **329 baris**
- `report_attachments`: **48 baris** (13 `TRIM(source) = ''`, 21 `telegram` uploader NULL, 12 `telegram` uploader NOT NULL, 2 `manual` uploader NOT NULL)
- `manual_non_ticketing_reports`: **4 baris**

### 2. Phase 3 Compatibility Contract (True Dual-Write)
- **Public / External Interface**: Murni menggunakan `ticket_id` (`/reports/:ticketId`).
- **Child Tables NOT NULL Protection**: Karena `report_id` pada `report_assignments`, `report_logs`, dan `report_attachments` berstatus `BIGINT(20) NOT NULL`, setiap operasi INSERT baru **WAJIB mengisi kedua identifier (`report_id` dan `ticket_id`)**.
- **Identical Pointer Guarantee**: `report_id` dan `ticket_id` yang ditulis pada baris anak wajib merujuk ke baris `reports` yang sama.
- **Retention**: Kolom `reports.id` dan kolom legacy child `report_id` dilarang dihapus sebelum Phase 6.

### 3. Validation Gates (Gerbang Kontrol)
- **Gate 1 (T016 — Stop Gate Lampiran Historis)**: 100% dari 48 lampiran wajib terklasifikasi secara definitif ke kode `bukti_pelapor` atau `bukti_penanganan`. Jika ada baris ambigu belum terverifikasi, migrasi DIBATALKAN.
- **Gate 2 (T030 — Invariant Penugasan Aktif)**: Status `tersedia` wajib memiliki tepat 0 active assignment (`is_active = 1`). Status non-`tersedia` (`diambil`, `didelegasikan`, `selesai`, `perlu_tindak_lanjut`, `eskalasi`) wajib memiliki tepat 1 active assignment (`is_active = 1`).
- **Gate 3 (T036 — Pre-Switch Gate & Dual-Write Validation)**: 
  - Kueri pointer mismatch (`ra.ticket_id <> r.ticket_id`, `rl.ticket_id <> r.ticket_id`, `rat.ticket_id <> r.ticket_id`) menghasilkan tepat **0 baris**.
  - Kueri null check (`report_id IS NULL` pada child tables) menghasilkan tepat **0 baris**.
  - Seluruh tabel anak terisi `ticket_id` tanpa null/orphan.
  - 100% regression tests pass pada Dual Compatibility mode.
  - Nol referensi kode ke kolom legacy.
- **Gate 4 (T047 — Post-Switch Gate)**: `ticket_id` aktif sebagai PRIMARY KEY pada `reports`, temporary index `idx_reports_legacy_id` aktif menjaga sifat `AUTO_INCREMENT`, redundant old unique index pada `ticket_id` dilepas, FK baru aktif, dan row count terverifikasi 54 / 55 / 329 / 48 / 4.

### 4. Matriks Titik Pemulihan (Rollback Checkpoints)
- **Checkpoint 0 (Phase 0 — Baseline)**: Target tag `f033-pre-migration-baseline` dan dump file `backup_pre_f033_full.sql`.
- **Checkpoint 1 (Phase 1 & 2 — Expand & Backfill)**: Struktur baru bersifat aditif. Rollback dilakukan dengan melepas kolom baru (`ticket_id`, `type_attachment_id`, `linked_ticket_id`) dan drop tabel `type_attachment` tanpa menyentuh PK live. Rollback data seed hanya menghapus code terkait (`DELETE WHERE code IN (...)`), dan rollback klasifikasi lampiran bersifat selektif via temporary table.
- **Checkpoint 2 (Phase 3 & 4 — Dual Compatibility Backend)**: Skema database aditif kompatibel dengan kode lama. Rollback aplikasi dilakukan via `git checkout f033-pre-migration-baseline`.
- **Checkpoint 3 (Phase 5 — PK/FK Switch)**: Jika terjadi kegagalan saat penetapan PK `ticket_id`, lepaskan FK baru, drop PK `ticket_id`, tetapkan kembali PRIMARY KEY pada `reports(id)` menggunakan index legacy, dan pasang kembali FK lama via nama constraint asli dari T004/T037.
- **Point of No Return (Menjelang T050 Phase 6 — Contract)**: Sebelum DDL destruktif dijalankan, verifikasi dry-run restore dari backup T003 wajib lulus uji coba di database sementara. Setelah T050 dieksekusi (`DROP COLUMN reports.id`), pemulihan hanya dapat dilakukan melalui restorasi total dari file snapshot backup.
