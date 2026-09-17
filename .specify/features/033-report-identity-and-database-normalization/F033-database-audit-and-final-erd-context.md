# F033 — Database Audit & Final ERD Context

## Tujuan

Dokumen ini menjadi **authoritative context** untuk Feature F033:
`033-report-identity-and-database-normalization`.

Gunakan dokumen ini bersama ERD final di project.

**Prinsip utama:**
- `CURRENT DATABASE` = fakta kondisi database yang sedang berjalan berdasarkan audit.
- `FINAL ERD / TARGET` = desain target yang telah diputuskan.
- Jangan mencampurkan current state dengan target state.
- Jangan mengubah source code atau database hanya berdasarkan dokumen ini.
- Data historis yang ambigu tidak boleh ditebak.

---

# 1. FINAL ERD / TARGET DESIGN

## 1.1 Report Identity

Target:
- `reports.ticket_id` menjadi **PRIMARY KEY** dan identifier utama/bisnis laporan.
- `reports.id` adalah identifier legacy yang akan dimigrasikan bertahap.
- Setiap laporan dari alur Telegram memiliki `ticket_id` yang berbeda.
- Child table yang mereferensikan report targetnya menggunakan `ticket_id`.

## 1.2 Assignment

Target `report_assignments` menjadi **single source of truth** assignment.

Kolom target:
- `id`
- `ticket_id`
- `assigned_to_user_id`
- `assigned_by_user_id`
- `assignment_type`
- `notes`
- `is_active`
- `assigned_at`

Target ERD **tidak menggunakan**:
- `from_region_id`
- `to_region_id`

Jangan menambahkan kembali kedua kolom tersebut hanya untuk menyimpan salinan region user.

Penanggung jawab aktif diperoleh melalui:
`report_assignments.assigned_to_user_id` → `users.id`

## 1.3 Region

Tiga konsep harus dibedakan.

### Region asal laporan
`reports.reported_region_id`

Makna:
- wilayah asal/fisik gangguan atau wilayah laporan dibuat.

### Region home user
`users.region_id`

Makna:
- region yang melekat pada user.

### Temporary Region Switch
`region_switch_requests`

Makna:
- mekanisme akses sementara ke region lain sesuai proses bisnis F007.

Untuk mendapatkan region user/penanggung jawab:
`report_assignments.assigned_to_user_id`
→ `users.id`
→ `users.region_id`
→ `regions.id`

Jangan menyimpan salinan region user pada `report_assignments` pada target final.

## 1.4 Attachment

Target:
`report_attachments.ticket_id` → `reports.ticket_id`

Tambahkan:
`report_attachments.type_attachment_id` → `type_attachment.id`

Target `type_attachment` minimal:
- `id`
- `code`
- `label`
- `description`

Business key:
- `code = 'bukti_pelapor'`
- `code = 'bukti_penanganan'`

Jangan membuat business logic bergantung pada numeric ID seperti 1 atau 2.

Makna:
- `source` = asal teknis attachment (`telegram` / `manual`)
- `type_attachment` = fungsi/jenis bukti dalam proses bisnis
- `uploaded_by_user_id` = user internal yang mengunggah, jika ada

### Bukti pelapor
- berasal dari Telegram
- `source = 'telegram'`
- `type = bukti_pelapor`
- `uploaded_by_user_id = NULL`

### Bukti penanganan
- diunggah user internal melalui sistem
- `source = 'manual'`
- `type = bukti_penanganan`
- `uploaded_by_user_id = currentUser.id`

## 1.5 Report Logs

Target:
`report_logs.ticket_id` → `reports.ticket_id`
`report_logs.user_id` → `users.id`

`report_logs` adalah histori/audit trail. Jangan menggunakan `ON DELETE CASCADE` tanpa justifikasi karena histori harus dilindungi.

## 1.6 Pending Media

Target:
`telegram_pending_media.linked_ticket_id` → `reports.ticket_id`

Jangan langsung mengganti polling numeric cursor `reports.id > ?` menjadi string comparison `ticket_id > ?`.

Polling memerlukan cursor deterministik berdasarkan atribut urutan yang sesuai desain.

---

# 2. CURRENT DATABASE — FAKTA HASIL AUDIT

Database:
`db_penanganan_gangguan`

## 2.1 Jumlah Data Saat Audit

- `reports` = **54**
- `report_assignments` = **55**
- `report_logs` = **329**
- `report_attachments` = **48**
- `manual_non_ticketing_reports` = **4**

## 2.2 reports — Struktur Aktual

Dari `DESCRIBE reports`:
- `id` = `bigint(20)`, PRIMARY KEY, AUTO_INCREMENT, NOT NULL
- `ticket_id` = `varchar(100)`, UNIQUE, NOT NULL
- `reported_region_id` = `int(11)`, nullable
- `current_region_id` = `int(11)`, nullable
- `current_assigned_user_id` = `int(11)`, nullable
- `created_at` = timestamp, NOT NULL
- `updated_at` = timestamp, NOT NULL

Validasi:
- ticket_id NULL/kosong = **0**
- duplicate `ticket_id` = **0 baris**

## 2.3 Foreign Key Aktual

### reports
- `current_assigned_user_id` → `users.id`
- `current_region_id` → `regions.id`
- `reported_region_id` → `regions.id`

### report_assignments
- `assigned_by_user_id` → `users.id`
- `assigned_to_user_id` → `users.id`
- `from_region_id` → `regions.id`
- `to_region_id` → `regions.id`
- `report_id` → `reports.id`

### report_logs
- `report_id` → `reports.id`
- `user_id` → `users.id`

### report_attachments
- `report_id` → `reports.id`
- `uploaded_by_user_id` → `users.id`

### users
- `region_id` → `regions.id`
- `role_id` → `roles.id`

### region_switch_requests
- `requester_user_id` → `users.id`
- `approved_by_user_id` → `users.id`
- `home_region_id` → `regions.id`
- `target_region_id` → `regions.id`

---

# 3. HASIL VALIDASI INTEGRITAS DATA

Query orphan relationship yang telah dilakukan menghasilkan **0 baris** untuk:
- `report_logs.report_id` tanpa parent report
- `report_logs.user_id` tanpa parent user
- `report_attachments.report_id` tanpa parent report
- `report_attachments.uploaded_by_user_id` tanpa parent user
- `report_assignments.report_id` tanpa parent report
- `report_assignments.assigned_to_user_id` tanpa parent user
- `report_assignments.assigned_by_user_id` tanpa parent user
- `report_assignments.from_region_id` tanpa parent region
- `report_assignments.to_region_id` tanpa parent region

Validasi master:
- duplicate username = tidak ditemukan
- orphan role pada users = tidak ditemukan
- duplicate role name = tidak ditemukan
- null/empty role name = tidak ditemukan
- duplicate region code = tidak ditemukan
- null/empty region code/name = tidak ditemukan

Validasi `manual_non_ticketing_reports`:
- duplicate OSM order → NCX order = tidak ditemukan
- duplicate NCX order → OSM order = tidak ditemukan
- duplicate OSM order → NCLI = tidak ditemukan
- duplicate OSM order → STO = tidak ditemukan
- duplicate OSM order → ALPRO name = tidak ditemukan
- duplicate OSM order → ALPRO before = tidak ditemukan
- duplicate NCLI → customer name = tidak ditemukan

Catatan:
Banyak `report_logs` pada satu `report_id` **bukan otomatis duplicate log**. Itu dapat merupakan histori beberapa aksi terhadap report yang sama.

---

# 4. DATA REAL report_attachments

Total = **48**.

Distribusi `source`:
- `source` kosong = **13**
- `source = telegram` = **33**
- `source = manual` = **2**

Distribusi uploader:
- `telegram` tanpa `uploaded_by_user_id` = **21**
- `telegram` dengan `uploaded_by_user_id` = **12**
- `manual` dengan `uploaded_by_user_id` = **2**

## Historical Data Exception

Jangan menyimpulkan:
`source = telegram` → pasti `bukti_pelapor`

untuk seluruh data lama.

Jangan melakukan backfill:
- `telegram → bukti_pelapor`
- `manual → bukti_penanganan`

secara buta.

Alasan:
- ada 12 attachment `telegram` dengan `uploaded_by_user_id` terisi
- ada 13 attachment dengan source kosong
- asal record historis tidak selalu dapat ditentukan hanya dari `source` dan uploader

Data ambigu harus:
1. diaudit,
2. diklasifikasikan jika metadata/bukti cukup,
3. ditandai/ditahan jika ambigu,
4. baru diberi `type_attachment_id`.

---

# 5. BUKTI PROSES BISNIS ATTACHMENT

Fakta yang telah dikonfirmasi:
- Bukti yang dikirim lewat Telegram berasal dari **pelapor**.
- User internal (coordinator/executor) mengunggah bukti penyelesaian melalui sistem/dashboard.
- User internal bukan pengirim bukti awal melalui Telegram.
- `source` menunjukkan kanal teknis.
- `type_attachment` menunjukkan fungsi bukti dalam proses bisnis.

Dugaan bahwa attachment lama berubah otomatis ketika user internal mengunggah bukti penyelesaian **belum terbukti** dari audit kode/data.

---

# 6. CURRENT BACKEND — FAKTA AUDIT

## 6.1 attachmentModel.js

Ada:
`createAttachment(data)`

Fungsi ini melakukan:
`INSERT INTO report_attachments`

dan menerima antara lain:
- `report_id`
- `source`
- `telegram_file_id`
- `telegram_file_unique_id`
- `file_type`
- `mime_type`
- `original_name`
- `file_name`
- `stored_name`
- `file_path`
- `file_size`
- `caption`
- `uploaded_by_user_id`
- `created_at`

Poin penting:
```js
data.source || 'telegram'
```

Artinya jika caller tidak mengirim source, default model adalah `telegram`.

`attachmentModel.js` juga memiliki:
`getAttachmentsByReportId(reportId)`

yang melakukan `LEFT JOIN users` untuk mendapatkan nama uploader.

## 6.2 reportModel.js — completeReport()

`completeReport()` ada pada workspace aktif.

Fungsi ini:
1. mencari report dengan `reports.id`
2. membaca:
   - `ticket_id`
   - `status_internal`
   - `current_region_id`
   - `current_assigned_user_id`
3. memvalidasi role/ownership
4. mengubah status penyelesaian
5. melakukan `INSERT` attachment internal secara langsung
6. menggunakan:
   - `source = 'manual'`
   - `uploaded_by_user_id = currentUser.id`
7. menulis log menggunakan `report_id`

Kesimpulan:
Upload internal pada kode aktif yang diperiksa **tidak mengubah source menjadi telegram**; ia secara eksplisit menggunakan `manual`.

## 6.3 Telegram

Audit menemukan `telegramBotService.js` memanggil:
`attachmentModel.createAttachment(...)`

untuk alur Telegram.

Target:
- `source = telegram`
- `type = bukti_pelapor`
- `uploaded_by_user_id = NULL`

---

# 7. MASALAH BACKEND TERKONFIRMASI

## 7.1 Assignment redundant

Current:
- `reports.current_assigned_user_id`
- `report_assignments.assigned_to_user_id`

Impact analysis menunjukkan `report_assignments` telah digunakan untuk INSERT/UPDATE tetapi belum menjadi sumber utama SELECT assignment aktif.

Target:
- assignment aktif dibaca dari `report_assignments`
- bukan dari `reports.current_assigned_user_id`

## 7.2 Region redundant

Current:
- `reports.current_region_id`
- `report_assignments.from_region_id`
- `report_assignments.to_region_id`

Target:
- `reports.reported_region_id` = region asal
- `users.region_id` = region home user
- region penanggung jawab diperoleh dari active assignment → user → user.region_id
- temporary access berasal dari `region_switch_requests`

## 7.3 Attachment INSERT tersebar

Current:
1. `attachmentModel.createAttachment()`
2. SQL INSERT langsung di `reportModel.completeReport()`

Target:
- operasi penyimpanan attachment dipusatkan melalui `attachmentModel`

## 7.4 Attachment READ berpotensi redundant

Audit backend menunjukkan lebih dari satu implementasi pengambilan attachment.

Target:
- satu sumber query/model attachment yang jelas.

---

# 8. CURRENT REGION VS TARGET REGION

CURRENT DATABASE:
- `reports.current_region_id` masih ada
- `report_assignments.from_region_id` masih ada
- `report_assignments.to_region_id` masih ada

TARGET ERD:
- `reports.current_region_id` dihapus
- `report_assignments.from_region_id` dihapus
- `report_assignments.to_region_id` dihapus
- `reports.reported_region_id` dipertahankan
- `users.region_id` menjadi sumber region user

Jangan mencampurkan current schema dengan final ERD.

---

# 9. CURRENT REPORT ID VS TARGET TICKET ID

CURRENT:
- `reports.id` = PK
- child tables memakai `report_id`
- pending media masih memakai `linked_report_id`

TARGET:
- `reports.ticket_id` = PK
- `report_assignments.ticket_id`
- `report_logs.ticket_id`
- `report_attachments.ticket_id`
- `telegram_pending_media.linked_ticket_id`

Migration harus bertahap.

**Jangan langsung DROP `reports.id`.**

---

# 10. ROUTE / CONTROLLER TARGET

Current backend masih banyak memakai:
`req.params.id`

Target:
`req.params.ticketId`

Contoh target:
`/reports/INF000123/complete`

Perubahan route dilakukan setelah model/service dan database siap.

---

# 11. POLLING

Current polling masih bergantung pada `reports.id` / MAX(id).

Jangan mengganti begitu saja:
`reports.id > ?`
menjadi:
`reports.ticket_id > ?`

Karena `ticket_id` adalah string dan bukan numeric cursor.

Polling perlu desain cursor deterministik menggunakan atribut waktu dan tie-breaker yang sesuai.

---

# 12. DESIGN DECISIONS / CONSTRAINTS F033

1. `reports.ticket_id` menjadi PK / identifier utama.
2. `report_assignments` menjadi single source of truth assignment.
3. `reports.current_assigned_user_id` dihapus dari target.
4. `reports.current_region_id` dihapus dari target.
5. `reports.reported_region_id` dipertahankan sebagai region asal.
6. `users.region_id` tetap menjadi region user.
7. `report_assignments.from_region_id` dan `to_region_id` tidak ada pada ERD target.
8. `report_attachments` menggunakan `ticket_id`.
9. `report_logs` menggunakan `ticket_id`.
10. pending media menggunakan `linked_ticket_id`.
11. `report_attachments` memiliki `type_attachment_id`.
12. `type_attachment.code` menjadi business key.
13. `source` membedakan kanal teknis `telegram` / `manual`.
14. Telegram/pelapor = bukti pelapor.
15. Internal user = bukti penanganan.
16. Historical attachment anomaly tidak boleh ditebak.
17. Migration dilakukan bertahap dan dapat divalidasi.
18. Query backend digunakan untuk memperoleh relasi; informasi redundant tidak disimpan ulang.

---

# 13. HAL YANG TIDAK BOLEH DILAKUKAN

Jangan:
- menghapus `reports.id` sebelum seluruh dependency dipindahkan
- blind search-and-replace `report_id` → `ticket_id`
- menghapus `reported_region_id`
- mengembalikan `from_region_id` / `to_region_id` pada target ERD
- mengklasifikasikan seluruh attachment lama hanya berdasarkan source
- hardcode `type_attachment_id = 1/2`
- menganggap 12 Telegram + uploader internal pasti berasal dari bug
- mengubah alur bisnis Telegram, take, delegation, cancellation, completion, return, escalation, atau Temporary Region Switch secara tidak perlu
- melakukan migration tanpa backup dan validasi

---

# 14. TARGET ARCHITECTURE RINGKAS

```text
regions
   ↑
users
   ↑
report_assignments
   ↑
reports
   ├── report_logs
   ├── report_attachments ──→ type_attachment
   └── other report-related data
```

Identifier:
`reports.ticket_id` → child `.ticket_id`

Assignment:
`report_assignments.assigned_to_user_id`
→ `users.region_id`
→ `regions`

Attachment:
- Telegram → `source=telegram` + `type=bukti_pelapor`
- Internal upload → `source=manual` + `type=bukti_penanganan`

---

# 15. WORKFLOW F033

Gunakan urutan:

`SPEC → PLAN → TASKS → IMPLEMENT → TEST → CHECKLIST`

Pada tahap specification/planning:
- jangan mengubah kode
- jangan mengubah database
- jangan melakukan migration

Implementasi dilakukan setelah specification dan plan disetujui.
