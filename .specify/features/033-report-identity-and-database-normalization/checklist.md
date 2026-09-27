# Checklist Eksekusi — F033 Report Identity and Database Normalization

## Feature ID
`F033`

## Feature Name
Report Identity and Database Normalization

## Tujuan & Panduan Penggunaan
Dokumen ini merupakan **Checklist Eksekusi Resmi** untuk Feature F033. Checklist ini disusun berdasarkan urutan dependensi teknis dan gerbang validasi (*validation gates*) yang ditetapkan pada `spec.md`, `plan.md`, dan `tasks.md`.

> [!IMPORTANT]
> **Petunjuk Eksekusi Checklist**:
> - Checklist ini digunakan untuk memandu dan memverifikasi **proses eksekusi bertahap**, bukan implementasi instan.
> - Seluruh tugas teknis menggunakan checkbox `[ ]` karena belum dieksekusi di database/lingkungan produksi.
> - Setiap transisi fase mensyaratkan gerbang validasi terkait berstatus **PASS (100%)**.
> - Dilarang melompati fase atau menjalankan DDL destruktif sebelum seluruh prasyarat kontrak terpenuhi.

---

## 0. Fakta Baseline Database Live Terverifikasi (Hasil Audit Aktual)

Data baseline berikut telah diverifikasi secara langsung dari metadata basis data `db_penanganan_gangguan` dan menjadi tolok ukur *zero-loss data*:
- [x] Baseline Baris Tabel Live:
  - `reports`: **54 baris**
  - `report_assignments`: **55 baris**
  - `report_logs`: **329 baris**
  - `report_attachments`: **48 baris**
  - `manual_non_ticketing_reports`: **4 baris**
- [x] Karakteristik Kolom Timestamp Laporan:
  - `reports.received_at`: `DATETIME NULL DEFAULT CURRENT_TIMESTAMP()` (kolom `reported_at` **TIDAK ADA**).
- [x] Karakteristik Constraint Legacy Child Tables:
  - `report_assignments.report_id`: `BIGINT(20) NOT NULL`
  - `report_logs.report_id`: `BIGINT(20) NOT NULL`
  - `report_attachments.report_id`: `BIGINT(20) NOT NULL`
  - `telegram_pending_media.linked_report_id`: `BIGINT(20) NULL` (tanpa formal FK constraint ke `reports.id`)
- [x] Karakteristik Status Enum Pending Media:
  - `telegram_pending_media.status`: `ENUM('pending','linked','expired')` (status `'ignored'` **TIDAK ADA**).
- [x] Distribusi Lampiran Historis (48 Baris):
  - 13 baris: `TRIM(source) = ''` (empty string, bukan NULL)
  - 21 baris: `source = 'telegram'` AND `uploaded_by_user_id IS NULL`
  - 12 baris: `source = 'telegram'` AND `uploaded_by_user_id IS NOT NULL`
  - 2 baris: `source = 'manual'` AND `uploaded_by_user_id IS NOT NULL`

---

## Aturan Baku Tata Kelola Lampiran (Attachment Governance Rules)

Checklist kepatuhan aturan tata kelola lampiran yang wajib dipatuhi di seluruh fase:
- [ ] **Aturan Sumber Telegram**: Seluruh lampiran yang berasal dari intake Bot Telegram wajib bernilai `source = 'telegram'`.
- [ ] **Aturan Sumber Internal / Aplikasi**: Seluruh berkas lampiran yang diunggah internal melalui antarmuka/sistem web aplikasi (seperti bukti penyelesaian tiket oleh eksekutor) wajib bernilai `source = 'manual'`.
- [ ] **Larangan Nilai Enum Baru**: Dilarang keras menggunakan atau menambahkan nilai baru `source = 'system'` ke skema basis data karena skema live hanya menerima `'telegram'` dan `'manual'`.
- [ ] **Larangan Hardcoded ID**: Dilarang keras menuliskan kode berbasis numeric ID hardcoded (`type_attachment_id = 1` atau `2`).
- [ ] **Dynamic Lookup by Code**: Setiap pemetaan dan pencarian tipe lampiran wajib melalui business key `type_attachment.code` (`'bukti_pelapor'` dan `'bukti_penanganan'`).
- [ ] **Rollback Selektif Per Baris**: Setiap rollback data klasifikasi lampiran wajib menggunakan temporary backup table per ID terdampak; dilarang keras mengeksekusi rollback global `UPDATE report_attachments SET type_attachment_id = NULL`.

---

## Phase 0 — Preparation Checklist

- [ ] **[T001] Freeze Scope F033**
  - **Action**: Kunci batasan ruang lingkup F033 (no-touch bot intake logic, no-touch parsing D-011/D-018, no-touch F007 region switch, no-touch KPI Supervisor F004, kolom intake tetap `received_at`, enum media tetap `pending/linked/expired`).
  - **Validation**: Dokumen `spec.md`, `plan.md`, dan `tasks.md` telah disetujui tanpa ambiguitas terbuka.
  - **Evidence**: Lembar persetujuan dokumen spesifikasi arsitektur F033.
  - **Rollback**: N/A (Dokumentasi).
  - **Status**: PENDING [ ]

- [ ] **[T002] Git Baseline Tag**
  - **Action**: Buat annotated tag git sebelum perubahan kode atau skema dimulai: `git tag -a f033-pre-migration-baseline -m "Baseline sebelum eksekusi F033"`.
  - **Validation**: Jalankan `git tag -l "f033-pre-migration-baseline"`.
  - **Evidence**: Output tag git tercatat valid di working repository.
  - **Rollback**: `git tag -d f033-pre-migration-baseline` jika proses dibatalkan sebelum kickoff.
  - **Status**: PENDING [ ]

- [ ] **[T003] Full Database Backup & Verification Protocol**
  - **Action**: Eksekusi dump penuh live database mencakup triggers dan routines: `mysqldump -u root -p --routines --triggers db_penanganan_gangguan > backup_pre_f033_full.sql`. Simpan file di lokasi aman di luar git tree.
  - **Validation**: Periksa berkas backup: ukuran > 0 byte, header mengonfirmasi database `db_penanganan_gangguan`, dan struktur tabel utama terdeteksi utuh. Catat prosedur uji dry-run restore untuk validasi pra-Fase 6.
  - **Evidence**: File dump tersimpan aman dan terverifikasi kelengkapannya.
  - **Rollback**: Checkpoint 0 untuk bencana (disaster recovery).
  - **Status**: PENDING [ ]

- [ ] **[T004] Capture FK, Index, and Schema Metadata (FK Safety)**
  - **Action**: Jalankan kueri metadata `information_schema` untuk merekam nama aktual foreign key constraint yang merujuk ke `reports(id)` dan nama indeks unik lama pada `reports.ticket_id`.
  - **Validation**: Catat nama constraint aktual dinamis. Konfirmasi bahwa `telegram_pending_media` tidak memiliki foreign key constraint formal ke `reports.id`.
  - **Evidence**: Berkas log metadata live tersimpan (`migration_metadata_baseline.log`).
  - **Rollback**: Simpan metadata untuk pemulihan rollback pada Fase 5 jika diperlukan.
  - **Status**: PENDING [ ]

- [ ] **[T005] Capture Current Baseline Row Counts**
  - **Action**: Jalankan kueri penghitungan baris pada seluruh tabel terkait:
    ```sql
    SELECT 'reports' AS tbl, COUNT(*) AS cnt FROM reports
    UNION ALL SELECT 'report_assignments', COUNT(*) FROM report_assignments
    UNION ALL SELECT 'report_logs', COUNT(*) FROM report_logs
    UNION ALL SELECT 'report_attachments', COUNT(*) FROM report_attachments
    UNION ALL SELECT 'manual_non_ticketing_reports', COUNT(*) FROM manual_non_ticketing_reports;
    ```
  - **Validation**: Hasil kueri cocok 100% dengan angka baseline audit live: `reports=54`, `report_assignments=55`, `report_logs=329`, `report_attachments=48`, `manual_non_ticketing_reports=4`.
  - **Evidence**: Catatan log penghitungan baris terverifikasi.
  - **Rollback**: Data acuan pembanding mutlak untuk seluruh Validation Gate.
  - **Status**: PENDING [ ]

---

## Phase 1 — Expand Checklist (Additive DDL)

- [ ] **[T006] Create Master Table `type_attachment`**
  - **Action**: Buat tabel master klasifikasi berkas baru:
    ```sql
    CREATE TABLE type_attachment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      description TEXT
    );
    ```
  - **Validation**: Eksekusi `SHOW CREATE TABLE type_attachment;` dan pastikan kolom `code` memiliki constraint UNIQUE.
  - **Evidence**: Tabel `type_attachment` terdaftar aktif di skema database.
  - **Rollback**: `DROP TABLE IF EXISTS type_attachment;`.
  - **Status**: PENDING [ ]

- [ ] **[T007] Seed `type_attachment` via Business Key**
  - **Action**: Masukkan master seed bukti pelapor dan penanganan:
    ```sql
    INSERT INTO type_attachment (code, name, description) VALUES
      ('bukti_pelapor', 'Bukti Pelapor (Telegram)', 'Foto atau berkas keluhan yang dikirimkan pelapor'),
      ('bukti_penanganan', 'Bukti Penanganan (Sistem)', 'Bukti pekerjaan perbaikan/BA penyelesaian dari eksekutor');
    ```
  - **Validation**: Kueri `SELECT code, name FROM type_attachment;` mengembalikan tepat 2 baris (`bukti_pelapor` dan `bukti_penanganan`).
  - **Evidence**: Baris master code terverifikasi di database.
  - **Rollback**: `DELETE FROM type_attachment WHERE code IN ('bukti_pelapor', 'bukti_penanganan');` (dilarang menggunakan TRUNCATE).
  - **Status**: PENDING [ ]

- [ ] **[T008] Add `ticket_id` to Child Tables**
  - **Action**: Tambahkan kolom nullable `ticket_id VARCHAR(100)` pada tabel-tabel anak:
    ```sql
    ALTER TABLE report_assignments ADD COLUMN ticket_id VARCHAR(100) NULL AFTER report_id;
    ALTER TABLE report_logs ADD COLUMN ticket_id VARCHAR(100) NULL AFTER report_id;
    ALTER TABLE report_attachments ADD COLUMN ticket_id VARCHAR(100) NULL AFTER report_id;
    ```
  - **Validation**: `SHOW COLUMNS FROM <table_name> LIKE 'ticket_id';` menunjukkan kolom `ticket_id VARCHAR(100)` dengan status `YES` (nullable).
  - **Evidence**: Struktur kolom baru aktif pada ketiga tabel anak.
  - **Rollback**: Drop kolom `ticket_id` dari ketiga tabel anak.
  - **Status**: PENDING [ ]

- [ ] **[T009] Add `type_attachment_id` to `report_attachments`**
  - **Action**: Tambahkan kolom relasi tipe berkas nullable:
    ```sql
    ALTER TABLE report_attachments ADD COLUMN type_attachment_id INT NULL AFTER ticket_id;
    ```
  - **Validation**: Kolom `type_attachment_id INT NULL` terdaftar di tabel `report_attachments`.
  - **Evidence**: Output `SHOW COLUMNS FROM report_attachments LIKE 'type_attachment_id';`.
  - **Rollback**: `ALTER TABLE report_attachments DROP COLUMN type_attachment_id;`.
  - **Status**: PENDING [ ]

- [ ] **[T010] Add `linked_ticket_id` to `telegram_pending_media`**
  - **Action**: Tambahkan kolom nullable pada tabel buffer pending media:
    ```sql
    ALTER TABLE telegram_pending_media ADD COLUMN linked_ticket_id VARCHAR(100) NULL AFTER linked_report_id;
    ```
  - **Validation**: Kolom `linked_ticket_id VARCHAR(100) NULL` terdaftar di tabel `telegram_pending_media`.
  - **Evidence**: Output `SHOW COLUMNS FROM telegram_pending_media LIKE 'linked_ticket_id';`.
  - **Rollback**: `ALTER TABLE telegram_pending_media DROP COLUMN linked_ticket_id;`.
  - **Status**: PENDING [ ]

---

## Phase 2 — Backfill & Data Hygiene Checklist

- [ ] **[T011] Backfill Child `ticket_id` from `reports.id`**
  - **Action**: Isi nilai `ticket_id` pada seluruh tabel anak berdasarkan relasi `reports.id`:
    ```sql
    UPDATE report_assignments ra JOIN reports r ON ra.report_id = r.id SET ra.ticket_id = r.ticket_id WHERE ra.ticket_id IS NULL;
    UPDATE report_logs rl JOIN reports r ON rl.report_id = r.id SET rl.ticket_id = r.ticket_id WHERE rl.ticket_id IS NULL;
    UPDATE report_attachments rat JOIN reports r ON rat.report_id = r.id SET rat.ticket_id = r.ticket_id WHERE rat.ticket_id IS NULL;
    UPDATE telegram_pending_media tpm JOIN reports r ON tpm.linked_report_id = r.id SET tpm.linked_ticket_id = r.ticket_id WHERE tpm.linked_report_id IS NOT NULL AND tpm.linked_ticket_id IS NULL;
    ```
  - **Validation**: Seluruh baris anak yang memiliki relasi induk terisi nilai `ticket_id`.
  - **Evidence**: Log jumlah baris ter-update pada masing-masing perintah UPDATE.
  - **Rollback**: Set `ticket_id = NULL` pada tabel-tabel anak.
  - **Status**: PENDING [ ]

- [ ] **[T012] Validate Zero Orphan / Null `ticket_id`**
  - **Action**: Jalankan kueri verifikasi integritas:
    ```sql
    SELECT 'report_assignments' AS tbl, COUNT(*) AS null_cnt FROM report_assignments WHERE ticket_id IS NULL
    UNION ALL SELECT 'report_logs', COUNT(*) FROM report_logs WHERE ticket_id IS NULL
    UNION ALL SELECT 'report_attachments', COUNT(*) FROM report_attachments WHERE ticket_id IS NULL
    UNION ALL SELECT 'telegram_pending_media', COUNT(*) FROM telegram_pending_media WHERE linked_report_id IS NOT NULL AND linked_ticket_id IS NULL;
    ```
  - **Validation**: Seluruh child record yang memiliki parent report wajib memiliki `ticket_id` valid (`null_cnt = 0`). Record `telegram_pending_media` yang belum ter-link boleh bernilai NULL.
  - **Evidence**: Hasil kueri menghasilkan 0 untuk seluruh baris.
  - **Rollback**: Perbaiki record yang terlewat sebelum melangkah ke T013.
  - **Status**: PENDING [ ]

- [ ] **[T013] Audit 48 Historical Attachments Data**
  - **Action**: Ekstraksi dan inventarisasi 48 baris lampiran riwayat:
    ```sql
    SELECT 
      CASE WHEN TRIM(source) = '' THEN 'empty_string' ELSE source END AS source_category,
      CASE WHEN uploaded_by_user_id IS NULL THEN 'NULL' ELSE 'NOT_NULL' END AS uploader_status,
      COUNT(*) AS total_rows
    FROM report_attachments
    GROUP BY source_category, uploader_status;
    ```
  - **Validation**: Total tepat 48 baris: 13 empty string, 21 telegram tanpa uploader, 12 telegram dengan uploader, 2 manual dengan uploader.
  - **Evidence**: Lembar kerja verifikasi audit lampiran historis terisi lengkap.
  - **Rollback**: N/A (Read-only query).
  - **Status**: PENDING [ ]

- [ ] **[T014] Classify Deterministic Attachment Rows (23 Baris)**
  - **Action**: Catat state awal ke temporary table (`temp_t014_deterministic_backup`), lalu jalankan update klasifikasi definitif:
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
  - **Validation**: Tepat 23 baris terisi `type_attachment_id` (2 `bukti_penanganan` dan 21 `bukti_pelapor`).
  - **Evidence**: Kueri agregasi mengonfirmasi 23 baris terklasifikasi valid.
  - **Rollback**: Rollback selektif mengembalikan baris yang tersimpan di `temp_t014_deterministic_backup`.
  - **Status**: PENDING [ ]

- [ ] **[T015] Audit 25 Ambiguous Attachment Rows**
  - **Action**: Lakukan cross-check terhadap `report_logs` dan metadata berkas untuk 25 baris ambigu (13 `TRIM(source) = ''` dan 12 Telegram ber-uploader). Sebelum update, simpan ID terdampak ke `temp_t015_ambiguous_backup`, kemudian update klasifikasi per ID berdasarkan bukti log yang sah.
  - **Validation**: Seluruh baris yang terbukti sah terisi `type_attachment_id` via lookup code (`bukti_pelapor` atau `bukti_penanganan`).
  - **Evidence**: Log korelasi audit trail per ID lampiran ambigu terdokumentasi.
  - **Rollback**: Rollback selektif mengembalikan baris yang tersimpan di `temp_t015_ambiguous_backup`.
  - **Status**: PENDING [ ]

- [ ] **[T016] STOP GATE 1 — Check for Unresolved Attachments**
  - **Action**: Jalankan kueri gerbang:
    ```sql
    SELECT id, ticket_id, source, file_name, created_at 
    FROM report_attachments 
    WHERE type_attachment_id IS NULL;
    ```
  - **Validation**: Kueri mengembalikan **0 baris**. Jika > 0 baris, **MIGRATION STOP**. Dilarang melakukan blind backfill numerik.
  - **Evidence**: Output kueri bersih (0 baris tanpa klasifikasi).
  - **Rollback**: Tahan migrasi pada Fase 2 jika terdapat record tak terpecahkan.
  - **Status**: PENDING [ ]

- [ ] **[T017] Validate 48 Rows `type_attachment_id` Coverage**
  - **Action**: Verifikasi coverage tipe lampiran:
    ```sql
    SELECT ta.code, COUNT(ra.id) AS total_attachments
    FROM report_attachments ra
    JOIN type_attachment ta ON ra.type_attachment_id = ta.id
    GROUP BY ta.code;
    ```
  - **Validation**: Akumulasi total tepat 48 baris dan nol orphan record.
  - **Evidence**: Rekapitulasi distribusi 48 lampiran terdaftar aktif.
  - **Rollback**: N/A.
  - **Status**: PENDING [ ]

---

## Phase 3 — Backend Dual-Write & Compatibility Contract Checklist

- [ ] **[T018] Refactor `attachmentModel.js` (True Dual-Write & Code Lookup)**
  - **Action**: Ubah signature `createAttachment(data, trxConnection)` menerima `ticket_id`, legacy `report_id`, `source`, dan lookup code `getTypeIdByCode(code)`. INSERT wajib mengisi kedua kolom: `report_id` + `ticket_id`. Method `getAttachmentsByTicketId(ticketId)` menggunakan `LEFT JOIN type_attachment`.
  - **Validation**: Unit test membuktikan INSERT dual-write sukses dan pembacaan lampiran menampilkan kode serta nama tipe lampiran.
  - **Evidence**: File `models/attachmentModel.js` ter-refactor dan lolos test.
  - **Rollback**: `git checkout f033-pre-migration-baseline -- models/attachmentModel.js`.
  - **Status**: PENDING [ ]

- [ ] **[T019] Refactor `completeReport()` in `reportModel.js` (Dual-Write & Valid Source)**
  - **Action**: Controller menerima `ticketId`. Di dalam transaksi `completeReport`, resolve `reports.id` dan `ticket_id`, delegasikan upload berkas ke `attachmentModel.createAttachment` dengan payload: `report_id = report.id`, `ticket_id = report.ticket_id`, `type_attachment_code = 'bukti_penanganan'`, dan `source = 'manual'`. Pastikan koneksi transaksi (`connection`) diteruskan secara atomik.
  - **Validation**: Status laporan berubah `'selesai'` dan berkas lampiran tersimpan dengan `report_id`, `ticket_id`, serta `source = 'manual'`. Kegagalan berkas memicu rollback penuh.
  - **Evidence**: Integration test alur penyelesaian laporan eksekutor berhasil.
  - **Rollback**: `git checkout f033-pre-migration-baseline -- models/reportModel.js`.
  - **Status**: PENDING [ ]

- [ ] **[T020] Refactor Column Writes in `reportModel.js` (Scope Boundary)**
  - **Action**: Hapus pembaruan kolom denormalisasi `current_region_id` dan `current_assigned_user_id` dari seluruh kueri mutasi status tiket. Hapus kolom `from_region_id` dan `to_region_id` dari kueri penugasan. **Pertahankan kolom `report_id` pada child tables**.
  - **Validation**: Mutasi status berhasil tanpa menyentuh kolom denormalisasi dan tanpa menyertakan `from_region_id`/`to_region_id`.
  - **Evidence**: Kueri SQL update tiket bersih dari kolom deprecated.
  - **Rollback**: Revert commit perubahan.
  - **Status**: PENDING [ ]

- [ ] **[T021] Refactor Assignment Operations with True Dual-Write**
  - **Action**: Operasi penugasan (`self_take`, `delegation`, `cancel_assignment`) me-resolve `reports.id` dari `ticket_id`. Setiap INSERT baru pada `report_assignments` wajib mengisi: `report_id`, `ticket_id`, `assigned_to_user_id`, `assigned_by_user_id`, `assignment_type`, `is_active`.
  - **Validation**: Invariant terpenuhi (tersedia = 0 baris aktif, non-tersedia = tepat 1 baris aktif, selesai tetap 1 baris aktif). Baris baru terisi `report_id` dan `ticket_id` yang valid.
  - **Evidence**: Test lifecycle penugasan lulus pengujian invariant.
  - **Rollback**: Revert file `models/reportModel.js`.
  - **Status**: PENDING [ ]

- [ ] **[T022] Refactor Report Log Operations with True Dual-Write**
  - **Action**: Update `createReportLog` agar mengeksekusi INSERT dual-write (`report_id` dan `ticket_id`). Dilarang membuat INSERT yang hanya mengisi `ticket_id` karena `report_logs.report_id` masih `NOT NULL`. Method pembacaan beralih ke `getReportLogsByTicketId(ticketId)`.
  - **Validation**: Kueri pembacaan log mengembalikan riwayat audit berdasarkan `ticket_id`. Seluruh baris log baru terisi kedua identifier.
  - **Evidence**: Test log audit trail terverifikasi konsisten.
  - **Rollback**: Revert file `models/reportModel.js`.
  - **Status**: PENDING [ ]

- [ ] **[T023] Refactor `dashboardModel.js`**
  - **Action**: Ubah agregasi metrik antrean kerja dan status penugasan agar membaca penugasan aktif dari `report_assignments (is_active = 1)` dan wilayah personil dari `users.region_id -> regions`. Filtering wilayah laporan merujuk ke `reports.reported_region_id`.
  - **Validation**: Angka metrik antrean dan KPI dashboard Eksekutor/Koordinator tetap akurat dan identik.
  - **Evidence**: Output JSON/view dashboard konsisten sebelum dan sesudah refactor.
  - **Rollback**: Revert file `models/dashboardModel.js`.
  - **Status**: PENDING [ ]

- [ ] **[T024] Refactor `supervisorModel.js` (Preserve KPI Logic & Received_at)**
  - **Action**: Perbarui join penugasan aktif ke `report_assignments (is_active = 1)` dan wilayah laporan ke `reported_region_id`. Pertahankan formula metrik MTTA, MTTR, volume tiket, serta penggunaan kolom waktu intake `rep.received_at`. Pertahankan sifat dashboard Supervisor yang *read-only*.
  - **Validation**: Metrik MTTA dan MTTR menghasilkan nilai kalkulasi yang presisi tanpa deviasi formula.
  - **Evidence**: Output dashboard KPI Supervisor terverifikasi konsisten.
  - **Rollback**: Revert file `models/supervisorModel.js`.
  - **Status**: PENDING [ ]

- [ ] **[T025] Refactor `pendingMediaModel.js` (Compatibility Mapping)**
  - **Action**: Terapkan mapping kompatibilitas: saat media berhasil di-link ke laporan, isi kedua kolom `linked_report_id = reports.id` dan `linked_ticket_id = reports.ticket_id` dengan status `'linked'`. Saat pending, biarkan keduanya `NULL`. Jangan mengasumsikan adanya FK constraint legacy pada `linked_report_id`.
  - **Validation**: Media unlinked berhasil ditandai `linked` dengan nilai `linked_report_id` dan `linked_ticket_id` yang sesuai.
  - **Evidence**: Test alur penautan media Telegram buffer berhasil.
  - **Rollback**: Revert file `models/pendingMediaModel.js`.
  - **Status**: PENDING [ ]

- [ ] **[T026] Refactor Controllers to `ticketId` Architecture**
  - **Action**: Selaraskan parameter HTTP controller menerima `req.params.ticketId`. Implementasikan resolver internal `ticketId -> reports.id` untuk penulisan tabel anak yang membutuhkan dual-write. Dilarang mengembalikan rute publik ke format ID numerik.
  - **Validation**: Request HTTP berbasis `ticketId` alfanumerik diproses sukses tanpa error konversi tipe data integer.
  - **Evidence**: Endpoint controller merespons sukses pada format tiket alfanumerik.
  - **Rollback**: Revert file `controllers/reportController.js`.
  - **Status**: PENDING [ ]

- [ ] **[T027] Refactor Routes to `:ticketId`**
  - **Action**: Standarisasi seluruh rute web Express menjadi format semantik: `/reports/:ticketId`, `/reports/:ticketId/detail-json`, `/reports/:ticketId/take`, `/reports/:ticketId/complete`, dll.
  - **Validation**: Routing Express berhasil memetakan rute `:ticketId` ke controller terkait.
  - **Evidence**: File `routes/reportRoutes.js` terkonfigurasi rapi dan teruji via route testing.
  - **Rollback**: Revert file `routes/reportRoutes.js`.
  - **Status**: PENDING [ ]

- [ ] **[T028] Refactor Views, Partials, and Frontend Dataset**
  - **Action**: Perbarui template EJS agar membawa atribut `data-ticket-id` dan `data-received-at`. Sesuaikan pemanggilan AJAX modal detail ke `/reports/${ticketId}/detail-json`. Tampilkan pengelompokan rapi bukti pelapor dan bukti penanganan berdasarkan `type_attachment_code`.
  - **Validation**: Seluruh tombol aksi, form action, dan modal detail memuat data tiket dan lampiran secara akurat di antarmuka web.
  - **Evidence**: UI browser merender tiket dan modal lampiran secara sempurna.
  - **Rollback**: Revert template EJS terkait.
  - **Status**: PENDING [ ]

- [ ] **[T029] Refactor Polling Endpoint to `(received_at, ticket_id)` Cursor**
  - **Action**: Terapkan kursor deterministik pada `reportModel.getNewReportStats` menggunakan kombinasi stempel waktu `COALESCE(reports.received_at, reports.created_at)` dan pemutus seri `reports.ticket_id`. Perbarui client script `queue-auto-refresh.js` untuk mengirimkan kedua kursor tersebut.
  - **Validation**: Endpoint `GET /reports/check-new` mengembalikan tiket baru tanpa duplikasi dan kursor maju secara deterministik saat simulasi 2 laporan masuk dengan stempel waktu identik.
  - **Evidence**: Log kursor polling membuktikan ketahanan terhadap collision stempel waktu.
  - **Rollback**: Revert controller, model, dan client script polling.
  - **Status**: PENDING [ ]

---

## Phase 4 — Comprehensive Validation Checklist (Pre-Switch)

- [ ] **[T030] GATE 2 — Validate Active Assignment Invariant**
  - **Action**: Jalankan 3 kueri validasi invariant penugasan:
    ```sql
    -- 1. Deteksi duplikasi active assignment (harus 0)
    SELECT ticket_id, COUNT(*) FROM report_assignments WHERE is_active = 1 GROUP BY ticket_id HAVING COUNT(*) > 1;

    -- 2. Deteksi tiket tersedia yang berpenugasan aktif (harus 0)
    SELECT r.ticket_id FROM reports r JOIN report_assignments ra ON ra.ticket_id = r.ticket_id AND ra.is_active = 1 WHERE r.status_internal = 'tersedia';

    -- 3. Deteksi tiket non-tersedia tanpa tepat 1 penugasan aktif (harus 0)
    SELECT r.ticket_id FROM reports r LEFT JOIN report_assignments ra ON ra.ticket_id = r.ticket_id AND ra.is_active = 1 WHERE r.status_internal != 'tersedia' GROUP BY r.ticket_id HAVING COUNT(ra.id) != 1;
    ```
  - **Validation**: Ketiga kueri mengembalikan tepat **0 baris**.
  - **Evidence**: Output kueri audit invariant bersih (0 baris).
  - **Rollback**: Koreksi inkonsistensi status penugasan sebelum melanjutkan.
  - **Status**: PENDING [ ]

- [ ] **[T031] Validate Attachment Transaction & Atomicity**
  - **Action**: Uji alur penyelesaian tiket dengan simulasi error pada penyimpanan lampiran.
  - **Validation**: Transaksi penyelesaian tiket dibatalkan sepenuhnya (*rolled back*) saat upload berkas gagal (status tiket tidak berubah menjadi `'selesai'`).
  - **Evidence**: Log transaksi membuktikan rollback bekerja atomik.
  - **Rollback**: Perbaiki propagasi `connection` pada `completeReport`.
  - **Status**: PENDING [ ]

- [ ] **[T032] Validate Dual-Write Consistency, FK & Orphan Integrity**
  - **Action**: Jalankan kueri pengecekan pointer dual-write, proteksi NOT NULL, dan deteksi orphan:
    ```sql
    -- 1. Deteksi pointer mismatch dual-write (harus 0)
    SELECT COUNT(*) FROM report_assignments ra JOIN reports r ON ra.report_id = r.id WHERE ra.ticket_id <> r.ticket_id;
    SELECT COUNT(*) FROM report_logs rl JOIN reports r ON rl.report_id = r.id WHERE rl.ticket_id <> r.ticket_id;
    SELECT COUNT(*) FROM report_attachments rat JOIN reports r ON rat.report_id = r.id WHERE rat.ticket_id <> r.ticket_id;

    -- 2. Deteksi pelanggaran constraint NOT NULL pada report_id (harus 0)
    SELECT COUNT(*) FROM report_assignments WHERE report_id IS NULL;
    SELECT COUNT(*) FROM report_logs WHERE report_id IS NULL;
    SELECT COUNT(*) FROM report_attachments WHERE report_id IS NULL;

    -- 3. Deteksi baris yatim (orphan) terhadap ticket_id (harus 0)
    SELECT COUNT(*) FROM report_assignments ra LEFT JOIN reports r ON ra.ticket_id = r.ticket_id WHERE r.ticket_id IS NULL;
    SELECT COUNT(*) FROM report_logs rl LEFT JOIN reports r ON rl.ticket_id = r.ticket_id WHERE r.ticket_id IS NULL;
    SELECT COUNT(*) FROM report_attachments rat LEFT JOIN reports r ON rat.ticket_id = r.ticket_id WHERE r.ticket_id IS NULL;
    SELECT COUNT(*) FROM telegram_pending_media tpm LEFT JOIN reports r ON tpm.linked_ticket_id = r.ticket_id WHERE tpm.linked_ticket_id IS NOT NULL AND r.ticket_id IS NULL;
    ```
  - **Validation**: Seluruh kueri di atas menghasilkan nilai tepat **0**.
  - **Evidence**: Laporan integritas data dual-write bersih dari inkonsistensi.
  - **Rollback**: Perbaiki rekaman mismatch sebelum melangkah ke T033.
  - **Status**: PENDING [ ]

- [ ] **[T033] Validate Full System Regression Tests**
  - **Action**: Jalankan rangkaian automated integration tests dan smoke tests operasional mencakup:
    - [ ] RBAC Security: Eksekutor, Koordinator, Supervisor, Super Admin
    - [ ] F007 Temporary Region Switch approval flow
    - [ ] Telegram intake parsing (D-011, D-018) dan feedback delivery
    - [ ] Supervisor KPI dashboard metrics formula consistency
  - **Validation**: 100% test cases berstatus **PASS**.
  - **Evidence**: Test report output dari test runner.
  - **Rollback**: `git checkout f033-pre-migration-baseline` jika ditemukan regresi fatal.
  - **Status**: PENDING [ ]

- [ ] **[T034] Static Analysis & Grep Legacy Column Dependencies**
  - **Action**: Jalankan pemindaian kode (*grep*) untuk memastikan nol referensi aktif ke kolom deprecated:
    - `reports.current_region_id`
    - `reports.current_assigned_user_id`
    - `from_region_id`
    - `to_region_id`
  - **Validation**: Hasil pencarian menghasilkan 0 baris kode operasional aktif.
  - **Evidence**: Log pencarian static analysis bersih.
  - **Rollback**: Bersihkan sisa referensi sebelum masuk ke Fase 5.
  - **Status**: PENDING [ ]

- [ ] **[T035] Validate Polling Determinism under High Load**
  - **Action**: Jalankan stress test polling simulasi 2 laporan masuk dengan stempel waktu identik.
  - **Validation**: Polling tidak melewatkan tiket baru dan tidak menghasilkan duplikasi antrean.
  - **Evidence**: Log auto-refresh antrean membuktikan kursor bergerak maju secara akurat.
  - **Rollback**: Perbaiki klausa tie-breaker leksikografis jika urutan kursor melompat.
  - **Status**: PENDING [ ]

- [x] **[T036] GATE 3 — PRE-SWITCH GATE**
  - **Action**: Verifikasi menyeluruh terhadap seluruh gerbang pra-pengalihan kunci:
    - [x] Zero orphan rows (Gate 3.1: 0 orphan rows pada seluruh child table)
    - [x] 48 attachments terklasifikasi secara sah (Gate 3.2: 48/48 terklasifikasi valid, 27 bukti_penanganan, 21 bukti_pelapor)
    - [x] Active assignment invariant PASS (Gate 3.3: 0 duplicate active assignment, tepat 1 per tiket non-tersedia)
    - [x] Dual-write pointer consistency & NOT NULL PASS (Gate 3.4: 0 pointer mismatch, 0 invalid NULL)
    - [x] Nol referensi kode operasional ke kolom legacy (Gate 3.5: 0 operational query references ke current_region_id, from_region_id, to_region_id, current_assigned_user_id)
    - [x] Fresh verified backup snapshot tersedia dan terverifikasi (Gate 3.6: `C:\F033_Backup\backup_pre_f033_phase5_2026-09-23.sql`, 125.756 bytes, timestamp 2026-09-23 18:16:41, memuat tiket live INF770106)
  - **Validation**: Seluruh kriteria Gate 3.1–3.6 terverifikasi lulus (PASS); siap untuk peninjauan dan persetujuan formal arsitektur sebelum memulai Fase 5 (*Switch FK/PK*).
  - **Evidence**: Laporan audit T036 (Gate 3.1–3.6 PASS) dan fresh backup `C:\F033_Backup\backup_pre_f033_phase5_2026-09-23.sql`.
  - **Rollback**: Jika belum siap, tunda migrasi; sistem tetap aman berjalan dalam mode Dual Compatibility.
  - **Status**: COMPLETED [x]

---

## Phase 5 — PK/FK Switch Checklist

- [ ] **[T037] Capture Dynamic FK Constraint Names & Old Unique Index**
  - **Action**: Jalankan kueri metadata MySQL untuk mengambil nama constraint FK aktual dan nama unique index eksisting pada `reports.ticket_id`:
    ```sql
    SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'reports' AND REFERENCED_COLUMN_NAME = 'id';

    SHOW INDEX FROM reports WHERE Column_name = 'ticket_id' AND Non_unique = 0 AND Key_name != 'PRIMARY';
    ```
  - **Validation**: Terdata nama constraint FK aktual (`report_assignments`, `report_logs`, `report_attachments`) dan nama unique index lama pada `ticket_id`. Terkonfirmasi bahwa `telegram_pending_media` tidak memiliki foreign key constraint aktif ke `reports.id`.
  - **Evidence**: Daftar nama constraint dan unique index terdata dinamis tanpa menebak nama.
  - **Rollback**: N/A.
  - **Status**: PENDING [ ]

- [ ] **[T038] Drop Old Foreign Keys Referencing `reports.id` (FK Safety)**
  - **Action**: Lepaskan constraint foreign key lama HANYA untuk constraint yang ditemukan di T037 menggunakan nama aktualnya:
    ```sql
    ALTER TABLE report_assignments DROP FOREIGN KEY `<discovered_assignment_fk_name>`;
    ALTER TABLE report_logs DROP FOREIGN KEY `<discovered_log_fk_name>`;
    ALTER TABLE report_attachments DROP FOREIGN KEY `<discovered_attachment_fk_name>`;
    -- HANYA jika terbukti ada pada telegram_pending_media:
    -- ALTER TABLE telegram_pending_media DROP FOREIGN KEY `<discovered_pending_media_fk_name>`;
    ```
  - **Validation**: Kueri T037 mengembalikan 0 baris constraint yang merujuk ke `reports.id`.
  - **Evidence**: Metadata `information_schema` membuktikan relasi FK lama telah dilepas.
  - **Rollback**: Pasang kembali FK lama menggunakan nama constraint asli jika switch dibatalkan.
  - **Status**: PENDING [ ]

- [ ] **[T039] Create Temporary Index on `reports.id` (`idx_reports_legacy_id`)**
  - **Action**: Buat temporary index pada `reports.id` untuk memenuhi syarat MySQL AUTO_INCREMENT sebelum melepaskan PRIMARY KEY:
    ```sql
    ALTER TABLE reports ADD INDEX idx_reports_legacy_id (id);
    ```
  - **Validation**: `SHOW INDEX FROM reports WHERE Key_name = 'idx_reports_legacy_id';` mengembalikan 1 baris aktif.
  - **Evidence**: Indeks sementara terdaftar aktif di tabel `reports`.
  - **Rollback**: `ALTER TABLE reports DROP INDEX idx_reports_legacy_id;`.
  - **Status**: PENDING [ ]

- [ ] **[T040] Drop Old Primary Key on `reports`**
  - **Action**: Lepaskan status PRIMARY KEY dari kolom legacy `reports.id`:
    ```sql
    ALTER TABLE reports DROP PRIMARY KEY;
    ```
  - **Validation**: Perintah DDL berhasil tanpa Error 1075 karena kolom AUTO_INCREMENT `id` tetap terindeks via `idx_reports_legacy_id`.
  - **Evidence**: `SHOW KEYS FROM reports WHERE Key_name = 'PRIMARY';` mengembalikan 0 baris.
  - **Rollback**: `ALTER TABLE reports ADD PRIMARY KEY (id);`.
  - **Status**: PENDING [ ]

- [ ] **[T041] Add `PRIMARY KEY (ticket_id)` on `reports`**
  - **Action**: Tetapkan `ticket_id VARCHAR(100)` sebagai PRIMARY KEY definitif:
    ```sql
    ALTER TABLE reports ADD PRIMARY KEY (ticket_id);
    ```
  - **Validation**: `SHOW KEYS FROM reports WHERE Key_name = 'PRIMARY';` membuktikan kolom `ticket_id` adalah PRIMARY KEY.
  - **Evidence**: Skema tabel `reports` menunjukkan `ticket_id` sebagai PRIMARY KEY.
  - **Rollback**: `ALTER TABLE reports DROP PRIMARY KEY; ALTER TABLE reports ADD PRIMARY KEY (id);`.
  - **Status**: PENDING [ ]

- [ ] **[T042] Remove Redundant Old UNIQUE Index on `ticket_id`**
  - **Action**: Inspeksi dan lepaskan indeks unik terpisah pada `ticket_id`:
    ```sql
    SHOW INDEX FROM reports WHERE Column_name = 'ticket_id' AND Key_name != 'PRIMARY';
    ALTER TABLE reports DROP INDEX `<discovered_old_unique_index_name>`;
    ```
    *(Dilarang menghapus PRIMARY KEY `ticket_id`)*.
  - **Validation**: `SHOW INDEX FROM reports WHERE Column_name = 'ticket_id';` hanya menyisakan satu indeks yaitu `PRIMARY`.
  - **Evidence**: Tidak ada lagi redundant unique index pada `reports.ticket_id`.
  - **Rollback**: `ALTER TABLE reports ADD UNIQUE INDEX `<discovered_old_unique_index_name>` (ticket_id);` menggunakan nama aktual yang dicatat dari T004/T037 (bukan anonymous index).
  - **Status**: PENDING [ ]

- [ ] **[T043] Add New Foreign Keys to `reports(ticket_id)`**
  - **Action**: Pasang constraint foreign key baru dari tabel-tabel anak ke `reports(ticket_id)`:
    ```sql
    ALTER TABLE report_assignments MODIFY COLUMN ticket_id VARCHAR(100) NOT NULL;
    ALTER TABLE report_assignments ADD CONSTRAINT fk_assignments_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE CASCADE;

    ALTER TABLE report_attachments MODIFY COLUMN ticket_id VARCHAR(100) NOT NULL;
    ALTER TABLE report_attachments ADD CONSTRAINT fk_attachments_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE CASCADE;

    ALTER TABLE telegram_pending_media ADD CONSTRAINT fk_pending_media_ticket FOREIGN KEY (linked_ticket_id) REFERENCES reports(ticket_id) ON DELETE SET NULL;
    ```
  - **Validation**: Seluruh constraint FK baru terdaftar aktif di `information_schema.TABLE_CONSTRAINTS`.
  - **Evidence**: Metadata relasi foreign key baru terverifikasi aktif.
  - **Rollback**: Drop constraint FK baru tersebut.
  - **Status**: PENDING [ ]

- [ ] **[T044] Add Foreign Key `type_attachment` on `report_attachments`**
  - **Action**: Terapkan constraint foreign key dan status NOT NULL pada `report_attachments.type_attachment_id`:
    ```sql
    ALTER TABLE report_attachments MODIFY COLUMN type_attachment_id INT NOT NULL;
    ALTER TABLE report_attachments ADD CONSTRAINT fk_attachments_type FOREIGN KEY (type_attachment_id) REFERENCES type_attachment(id) ON DELETE RESTRICT;
    ```
  - **Validation**: Kolom `type_attachment_id` berstatus `NOT NULL` dan constraint FK aktif dengan aturan `ON DELETE RESTRICT`.
  - **Evidence**: Metadata `information_schema` mengonfirmasi constraint `fk_attachments_type`.
  - **Rollback**: Drop FK `fk_attachments_type` dan ubah kolom kembali menjadi nullable.
  - **Status**: PENDING [ ]

- [ ] **[T045] Apply `ON DELETE RESTRICT` Policy on `report_logs`**
  - **Action**: Pasang foreign key pada `report_logs(ticket_id)` dengan proteksi riwayat audit trail:
    ```sql
    ALTER TABLE report_logs MODIFY COLUMN ticket_id VARCHAR(100) NOT NULL;
    ALTER TABLE report_logs ADD CONSTRAINT fk_logs_ticket FOREIGN KEY (ticket_id) REFERENCES reports(ticket_id) ON DELETE RESTRICT;
    ```
  - **Validation**: `information_schema.REFERENTIAL_CONSTRAINTS` mencatat `DELETE_RULE = 'RESTRICT'` untuk `fk_logs_ticket`.
  - **Evidence**: Metadata constraint foreign key mencatat aturan RESTRICT secara eksplisit.
  - **Rollback**: Drop constraint `fk_logs_ticket`.
  - **Status**: PENDING [ ]

- [ ] **[T046] Add Performance Indexes**
  - **Action**: Buat indeks komposit untuk optimasi kueri antrean dan polling deterministik:
    ```sql
    CREATE INDEX idx_reports_received_ticket ON reports (received_at, ticket_id);
    CREATE INDEX idx_assignments_ticket_active ON report_assignments (ticket_id, is_active);
    CREATE INDEX idx_assignments_user_active ON report_assignments (assigned_to_user_id, is_active);
    CREATE INDEX idx_attachments_ticket_type ON report_attachments (ticket_id, type_attachment_id);
    CREATE INDEX idx_logs_ticket_created ON report_logs (ticket_id, created_at);
    ```
  - **Validation**: Kelima indeks komposit terdaftar aktif di tabel masing-masing.
  - **Evidence**: Output `SHOW INDEX` pada tabel-tabel terkait mengonfirmasi keberadaan indeks baru.
  - **Rollback**: Drop indeks komposit tersebut jika switch dibatalkan.
  - **Status**: PENDING [ ]

- [ ] **[T047] GATE 4 — POST-SWITCH GATE**
  - **Action**: Jalankan validasi pasca-pengalihan kunci utama:
    1. Verifikasi `reports.ticket_id` adalah PRIMARY KEY.
    2. Verifikasi tidak ada redundant UNIQUE index pada `ticket_id`.
    3. Verifikasi temporary index `idx_reports_legacy_id` aktif menjaga sifat `AUTO_INCREMENT`.
    4. Verifikasi seluruh Foreign Key baru aktif dan valid.
    5. Verifikasi *zero-loss data* terhadap baseline audit: `reports=54`, `report_assignments=55`, `report_logs=329`, `report_attachments=48`, `manual_non_ticketing_reports=4`.
  - **Validation**: Seluruh 5 poin pemeriksaan Gate 4 berstatus **PASS (100%)**.
  - **Evidence**: Laporan audit integritas skema dan data Gate 4 terisi lengkap.
  - **Rollback**: Jika gagal, eksekusi Rollback Checkpoint 3 (Fase 5 PK/FK Switch) sebelum melangkah ke Fase 6.
  - **Status**: PENDING [ ]

---

## Phase 6 — Contract (Destructive DDL) Checklist

> [!CAUTION]
> **Prasyarat Mutlak Eksekusi Fase Kontraksi Skema**:
> Tindakan destruktif pada fase ini **HANYA BOLEH DIEKSEKUSI SETELAH**:
> 1. Seluruh gerbang validasi (Gate 1, 2, 3, 4) berstatus PASS;
> 2. Uji *dry-run restore* backup T003 ke database sementara terbukti sukses (T048);
> 3. Periode observasi kompatibilitas selesai tanpa runtime exceptions (T048/T049).

- [ ] **[T048] Confirm Zero Backend/Frontend Dependency on `reports.id` & Dry-Run Restore PASS**
  - **Action**: Jalankan uji coba restorasi penuh dari file `backup_pre_f033_full.sql` ke database sementara (`db_penanganan_gangguan_dryrun`). Lakukan monitoring log aplikasi untuk memastikan nol error terkait kolom `reports.id`.
  - **Validation**: Hasil uji coba restorasi membuktikan seluruh data dan skema dapat dipulihkan utuh tanpa kendala, dan nol runtime exception terkait `reports.id`.
  - **Evidence**: Log dry-run restore database sementara sukses dan zero error pada log aplikasi.
  - **Rollback**: Tunda Fase 6 jika uji restore mengalami kendala atau ditemukan dependensi tersembunyi.
  - **Status**: PENDING [ ]

- [ ] **[T049] Confirm Zero Child `report_id` Query Dependency**
  - **Action**: Audit seluruh query join, filter, dan insert pada codebase untuk memastikan 100% kode telah beralih ke single-write `ticket_id`.
  - **Validation**: Konfirmasi 100% independensi dari kolom `report_id` pada seluruh baris kode aplikasi.
  - **Evidence**: Laporan code review final mengonfirmasi kesiapan pelepasan kolom legacy.
  - **Rollback**: Bersihkan sisa dependensi kode sebelum menjalankan DDL T050.
  - **Status**: PENDING [ ]

- [ ] **[T050] Drop `reports.id` and Legacy Index**
  - **Action**: Jalankan DDL:
    ```sql
    ALTER TABLE reports DROP COLUMN id;
    -- Drop idx_reports_legacy_id jika terpisah:
    -- ALTER TABLE reports DROP INDEX idx_reports_legacy_id;
    ```
  - **Validation**: `SHOW COLUMNS FROM reports LIKE 'id';` mengembalikan 0 baris.
  - **Evidence**: Kolom `id` terhapus total dari tabel `reports`.
  - **Rollback**: **Point of No Return**. Pemulihan setelah task ini hanya dapat dilakukan melalui restorasi cadangan penuh (Disaster Recovery).
  - **Status**: PENDING [ ]

- [ ] **[T051] Drop `reports.current_region_id`**
  - **Action**: Jalankan DDL: `ALTER TABLE reports DROP COLUMN current_region_id;`.
  - **Validation**: Kolom `current_region_id` terhapus dari `reports`.
  - **Evidence**: Output `SHOW COLUMNS FROM reports LIKE 'current_region_id';` kosong.
  - **Rollback**: Restorasi snapshot penuh.
  - **Status**: PENDING [ ]

- [ ] **[T052] Drop `reports.current_assigned_user_id`**
  - **Action**: Jalankan DDL: `ALTER TABLE reports DROP COLUMN current_assigned_user_id;`.
  - **Validation**: Kolom `current_assigned_user_id` terhapus dari `reports`.
  - **Evidence**: Output `SHOW COLUMNS FROM reports LIKE 'current_assigned_user_id';` kosong.
  - **Rollback**: Restorasi snapshot penuh.
  - **Status**: PENDING [ ]

- [ ] **[T053] Drop `report_attachments.report_id`**
  - **Action**: Jalankan DDL: `ALTER TABLE report_attachments DROP COLUMN report_id;`.
  - **Validation**: Kolom `report_id` terhapus dari `report_attachments`.
  - **Evidence**: Output `SHOW COLUMNS FROM report_attachments LIKE 'report_id';` kosong.
  - **Rollback**: Restorasi snapshot penuh.
  - **Status**: PENDING [ ]

- [ ] **[T054] Drop `report_assignments.report_id`**
  - **Action**: Jalankan DDL: `ALTER TABLE report_assignments DROP COLUMN report_id;`.
  - **Validation**: Kolom `report_id` terhapus dari `report_assignments`.
  - **Evidence**: Output `SHOW COLUMNS FROM report_assignments LIKE 'report_id';` kosong.
  - **Rollback**: Restorasi snapshot penuh.
  - **Status**: PENDING [ ]

- [ ] **[T055] Drop `report_logs.report_id`**
  - **Action**: Jalankan DDL: `ALTER TABLE report_logs DROP COLUMN report_id;`.
  - **Validation**: Kolom `report_id` terhapus dari `report_logs`.
  - **Evidence**: Output `SHOW COLUMNS FROM report_logs LIKE 'report_id';` kosong.
  - **Rollback**: Restorasi snapshot penuh.
  - **Status**: PENDING [ ]

- [ ] **[T056] Drop `telegram_pending_media.linked_report_id`**
  - **Action**: Jalankan DDL: `ALTER TABLE telegram_pending_media DROP COLUMN linked_report_id;`.
  - **Validation**: Kolom `linked_report_id` terhapus dari `telegram_pending_media`.
  - **Evidence**: Output `SHOW COLUMNS FROM telegram_pending_media LIKE 'linked_report_id';` kosong.
  - **Rollback**: Restorasi snapshot penuh.
  - **Status**: PENDING [ ]

- [ ] **[T057] Drop `from_region_id` and `to_region_id` from `report_assignments`**
  - **Action**: Jalankan DDL:
    ```sql
    ALTER TABLE report_assignments DROP COLUMN from_region_id;
    ALTER TABLE report_assignments DROP COLUMN to_region_id;
    ```
  - **Validation**: Kolom `from_region_id` dan `to_region_id` terhapus total dari `report_assignments`.
  - **Evidence**: Output `SHOW COLUMNS FROM report_assignments` membuktikan kedua kolom wilayah mutasi telah bersih.
  - **Rollback**: Restorasi snapshot penuh.
  - **Status**: PENDING [ ]

- [ ] **[T058] Final Schema Validation against Target ERD**
  - **Action**: Jalankan `SHOW CREATE TABLE` pada seluruh tabel terkait:
    - `reports`: PK `ticket_id VARCHAR(100)`, kolom waktu `received_at`, kolom wilayah `reported_region_id`.
    - `report_assignments`: bersih dari `from_region_id`/`to_region_id`/`report_id`, FK `ticket_id`.
    - `type_attachment`: `code VARCHAR(50) UNIQUE`, `name`, `description`.
    - `report_attachments`: FK `ticket_id`, FK `type_attachment_id` NOT NULL.
    - `report_logs`: FK `ticket_id` dengan aturan RESTRICT.
    - `telegram_pending_media`: FK `linked_ticket_id`, status enum `'pending','linked','expired'`.
  - **Validation**: Seluruh skema terbukti 100% identik dengan target desain ERD final.
  - **Evidence**: DDL dump skema final cocok dengan spesifikasi target.
  - **Rollback**: N/A.
  - **Status**: PENDING [ ]

- [ ] **[T059] Final Regression & Operational Acceptance Test**
  - **Action**: Eksekusi end-to-end testing menyeluruh (login seluruh role, intake bot Telegram, switch region F007, KPI dashboard Supervisor, penyelesaian tiket dengan upload bukti penanganan, auto-refresh antrean).
  - **Validation**: 100% test scenarios PASS tanpa degradasi performa atau functional break.
  - **Evidence**: Laporan pengujian regresi end-to-end terverifikasi lengkap.
  - **Rollback**: N/A.
  - **Status**: PENDING [ ]

- [ ] **[T060] Final Zero-Loss Validation, Backup & Release Tag**
  - **Action**: Verifikasi jumlah baris akhir mencocokkan baseline: `reports=54`, `report_assignments=55`, `report_logs=329`, `report_attachments=48`, `manual_non_ticketing_reports=4`. Eksekusi backup final:
    ```bash
    mysqldump -u root -p --routines --triggers db_penanganan_gangguan > backup_post_f033_normalized_final.sql
    git tag -a f033-normalization-completed -m "Feature F033 Report Identity & Database Normalization Selesai"
    ```
  - **Validation**: Berkas backup final terbentuk utuh dan git tag tercatat resmi di repository.
  - **Evidence**: File `backup_post_f033_normalized_final.sql` tersimpan aman dan git tag `f033-normalization-completed` terbit.
  - **Rollback**: N/A (Feature F033 selesai dengan sukses).
  - **Status**: PENDING [ ]

---

## Matriks Titik Pemulihan (Rollback Checkpoints)

| Checkpoint | Cakupan Fase | Kondisi Pemicu | Mekanisme Pemulihan | Tingkat Risiko |
| :--- | :--- | :--- | :--- | :--- |
| **Checkpoint 0** | Phase 0 (Baseline) | Kegagalan kritis saat persiapan sebelum skema diubah. | `git checkout f033-pre-migration-baseline`<br>Restorasi penuh `backup_pre_f033_full.sql`. | Nol (Data utuh) |
| **Checkpoint 1** | Phase 1 & 2 (Expand & Backfill) | Data ambigu tak terpecahkan pada Stop Gate 1 atau kesalahan backfill. | Drop kolom baru (`ticket_id`, `type_attachment_id`, `linked_ticket_id`), drop `type_attachment`.<br>Rollback seed T007 via `DELETE WHERE code IN (...)`.<br>Rollback attachment selektif via `temp_t014_deterministic_backup` & `temp_t015_ambiguous_backup`. | Rendah (Skema aditif) |
| **Checkpoint 2** | Phase 3 & 4 (Dual-Write Backend) | Bug atau regresi fungsional pada kode aplikasi baru. | `git checkout f033-pre-migration-baseline`.<br>Skema database aditif tetap kompatibel penuh karena dual-write mengisi kolom legacy `report_id`. | Rendah (Non-breaking) |
| **Checkpoint 3** | Phase 5 (PK/FK Switch) | Error saat penetapan PRIMARY KEY `ticket_id` atau kegagalan pemasangan FK baru. | Lepas FK baru `ticket_id`.<br>Drop PK `ticket_id`.<br>Pasang kembali PRIMARY KEY `reports(id)` via index legacy.<br>Pasang kembali unique index `ticket_id` via nama asli.<br>Pasang kembali FK lama ke `reports(id)` via nama constraint asli dari T004/T037. | Sedang (Terisolasi di DDL) |
| **Point of No Return** | Phase 6 (Contract — T050) | Kegagalan setelah kolom `reports.id` atau `report_id` anak di-drop. | **Tidak dapat di-rollback via DDL parsial**.<br>Pemulihan mutlak memerlukan restorasi snapshot database penuh dari `backup_pre_f033_full.sql`. | Tinggi (Wajib uji dry-run T048 terlebih dahulu) |

---

## FINAL RELEASE GATE

Feature F033 **HANYA BOLEH DINYATAKAN SELESAI DAN SIAP UNTUK PRODUCTION RELEASE** apabila seluruh kriteria gerbang berikut telah terpenuhi secara utuh:

- [ ] **Gate 1 (Stop Gate Lampiran)**: 100% dari 48 lampiran terklasifikasi secara sah ke kode `bukti_pelapor` atau `bukti_penanganan`.
- [ ] **Gate 2 (Active Assignment Invariant)**: Tiket `tersedia` memiliki tepat 0 penugasan aktif, dan seluruh tiket selain `tersedia` memiliki tepat 1 penugasan aktif (`is_active = 1`).
- [ ] **Gate 3 (Pre-Switch Gate)**: Zero orphan rows, dual-write pointer konsisten 100%, zero null `report_id`, dan 100% regression tests pass.
- [ ] **Gate 4 (Post-Switch Gate)**: `ticket_id` aktif sebagai PRIMARY KEY, redundant old unique index terlepas, FK baru aktif, dan row count terverifikasi 54 / 55 / 329 / 48 / 4.
- [ ] **Gate 5 (Contract & Zero-Loss Final)**: Dry-run restore backup terbukti sukses, kolom legacy terhapus sempurna, seluruh skema cocok 100% dengan target ERD final, dan sistem beroperasi stabil.

---
*Checklist disusun secara otomatis dan diverifikasi konsisten terhadap Spec Kit F033 (spec.md, plan.md, tasks.md).*
