# RE-VERIFIKASI IMPLEMENTASI SISTEM - KOREKSI ANALISIS

**Tanggal**: 18 Agustus 2026 (Perbaikan berdasarkan klarifikasi pengguna + data aktual)  
**Sumber**: Source code inspection + UI screenshots + CSV data sample  
**Status**: ✅ VERIFIKASI ULANG dengan data sebenarnya

---

## 🔄 KOREKSI UTAMA DARI ANALISIS SEBELUMNYA

### KOREKSI 1: Eksekutor DAPAT Membuat Laporan Manual

**Analisis Lama**: ❌ SALAH  
"Eksekutor TIDAK dapat membuat laporan manual di `/reports`"

**Fakta Sebenarnya**: ✅ BENAR (sesuai sistem Anda)  
Eksekutor **DAPAT** membuat laporan manual dengan akses di 2 tempat berbeda:

#### A. Laporan Manual Queue (Tabel `reports`, source='manual')
**Route**: POST `/reports`  
**Akses**: **Koordinator & Super Admin**  
**Bukti**: routes/reportRoutes.js:34-43
```javascript
router.post(
  '/',
  ensureAuthenticated,
  ensureRole('koordinator', 'super_admin'),  // HANYA kedua role ini
  reportController.createManualReport
);
```

#### B. Laporan Non-Ticketing Manual (Tabel `manual_non_ticketing_reports`)
**Route**: POST `/manual-reports`  
**Akses**: **Eksekutor & Koordinator**  
**Bukti**: routes/manualReportRoutes.js:20-23
```javascript
router.post(
  '/',
  ensureRole('eksekutor', 'koordinator'),  // EKSEKUTOR termasuk!
  manualReportController.store
);
```

**PERBEDAAN KUNCI**:
- Laporan di `/reports` masuk ke queue antrean tiket (`reports` table)
- Laporan di `/manual-reports` adalah non-ticketing work log (`manual_non_ticketing_reports` table)

**Screenshot Bukti**: Anda menampilkan dashboard "Laporan Manual" sebagai Eksekutor, yang adalah `/manual-reports` (bukan `/reports`)

---

### KOREKSI 2: Supervisor HANYA Bisa Melihat (Read-Only)

**Analisis Lama**: ✅ BENAR (konsisten dengan data)  
"Supervisor adalah read-only"

**Verifikasi Ulang**: ✅ DIKONFIRMASI
- Route `/reports` GET → Supervisor included  
- Route `/reports` POST → Supervisor TIDAK included
- Route `/manual-reports` GET → Supervisor TIDAK included
- Route `/manual-reports` POST → Supervisor TIDAK included

**Bukti**:
- routes/reportRoutes.js:8-11 (GET `/reports` includes `supervisor`)
- routes/reportRoutes.js:34-43 (POST `/reports` excludes `supervisor`)
- routes/manualReportRoutes.js:10-13 (GET `/manual-reports` includes `supervisor` ❓ PERLU VERIFIKASI)
- routes/manualReportRoutes.js:20-23 (POST `/manual-reports` excludes `supervisor`)

**❓ Pertanyaan**: Screenshot UI menunjukkan Anda logged as "Eksekutor", bukan Supervisor. Apakah Supervisor benar-benar bisa VIEW `/manual-reports` atau hanya `/reports`?

---

### KOREKSI 3: Status `tersedia` vs `baru` Adalah Alias Operasional

**Analisis Lama**: ❌ SALAH  
"Status `baru` ada di enum tapi tidak digunakan"

**Fakta Sebenarnya**: ✅ BENAR (tapi penjelasan salah)

**Penjelasan Benar**:
```
ENUM tersedia di schema: 'baru', 'tersedia', 'diambil', ...

Alasan `baru` tidak digunakan:
- Database enum dibuat untuk future-proofing
- Dalam implementasi aktual, tiket langsung masuk dengan `tersedia`
- `baru` dan `tersedia` secara semantik adalah SAMA (keduanya = "belum diambil")
- Query dashboard menghitung: CASE WHEN status IN ('baru', 'tersedia') ...
  (Ini mempersiapkan untuk jika di masa depan ada tiket dengan status `baru`)
```

**Bukti Query**:
```sql
-- models/reportModel.js, line 1160
COALESCE(SUM(CASE WHEN reports.status_internal IN ('baru', 'tersedia') THEN 1 ELSE 0 END), 0) AS available
```

**Praktik Ini Benar** karena:
- Enum lebih fleksibel untuk perubahan di masa depan
- Query sudah mempersiapkan untuk keduanya
- Tidak menambah kompleksitas

---

## ✅ BAGIAN A: VERIFIKASI AKURAT - LAPORAN MANUAL vs TELEGRAM BOT

### A.1 Dua Saluran Utama Input Laporan

#### **Saluran 1: Telegram Bot**
**Tabel**: `reports` (source_channel = 'telegram')  
**Akses**: Otomatis via Telegram (tidak ada kontrol akses, public)  
**Inisiator**: User/Reporter via Telegram Bot  
**Alur**:
1. Reporter kirim pesan ke Bot Telegram
2. Bot parsing via telegramBotService.handleIncomingMessage()
3. Insert ke `reports` table dengan status='tersedia'
4. Bot send konfirmasi ke Telegram

**Data Sample dari CSV Anda**:
```
Contoh tiket dari Telegram Bot (format WFM/UIM/DSC):
- Tanggal Tiket: 2025-03-21 04:38:46.0
- Ticket ID: INF002757714
- Order ID: SC1001713243
- Summary: OSM An error occurred while calling process interaction
- Status WFM: OPEN
- Service ID: 1-87H-4985_111402140826_PDBDT00168-N_WiFi_Wifi_MESH
```

**Screenshot Bukti**: Tab "Daftar Antrean Kerja" di dashboard eksekutor menunjukkan tiket dari bot

---

#### **Saluran 2A: Manual Report Queue (Koordinator/Super Admin)**
**Tabel**: `reports` (source_channel = 'manual')  
**Akses**: POST `/reports` → ensureRole('koordinator', 'super_admin')  
**Inisiator**: Koordinator atau Super Admin via web form  
**Alur**:
1. Koordinator/Super Admin → /reports/create
2. Fill form dengan ticket_id, order_id, summary, region, dll
3. POST /reports → reportController.createManualReport()
4. INSERT ke `reports` table dengan status='tersedia'
5. Redirect ke /reports dengan flash message

**Form Fields**: ticket_id, order_id, wo_number, service_type, segment, provider, dll (14 fields)  
**Contoh**: Screenshot menunjukkan form dengan "Pencarian", "Dari Tanggal", "Sampai Tanggal", "STO", dll

**Bukti Route**:
- routes/reportRoutes.js:27-30 (GET form, koordinator/super_admin only)
- routes/reportRoutes.js:34-43 (POST submit, koordinator/super_admin only)

---

#### **Saluran 2B: Manual Non-Ticketing Report (Eksekutor/Koordinator)**
**Tabel**: `manual_non_ticketing_reports` (TERPISAH dari reports table)  
**Akses**: POST `/manual-reports` → ensureRole('eksekutor', 'koordinator')  
**Inisiator**: Eksekutor atau Koordinator via web form  
**Alur**:
1. Eksekutor/Koordinator → /manual-reports/create
2. Fill form dengan 21+ work tracking fields
3. POST /manual-reports → manualReportController.store()
4. INSERT ke `manual_non_ticketing_reports` table
5. Redirect ke /manual-reports dengan flash message

**Data Fields** (28 kolom di DB):
- OSM Order ID, STO, SC, NCX Order ID, NCLI
- Details, Activity, Work Type, Ticket Resolved status
- Date tracking, Personnel info, Pengerjaan/S/E fields
- Region ID, Created By, Updated By, timestamps

**Contoh dari screenshot Anda**:
```
Table: Laporan Manual
Row 1:
  - Tanggal: 18/08/2026
  - STO: dsfdgf
  - Pelanggan: sdfsqsg rterth
  - Aktivitas: etdg
  - Pengerjaan: sfdfd
  - S/E: erdfd
  - Details: dfgdfgfh
  - Dibuat Oleh: farhan muhammad

Row 2:
  - Tanggal: 13/07/2026
  - STO: BLS
  - Pelanggan: HENDRA AGUSTI 1-R5RWLIE
  - Aktivitas: FALLOUT DATA CONS
  - Pengerjaan: NON-UIMTOOLS
  - S/E: solved
  - Details: fthyfgfyg
  - Dibuat Oleh: farhan muhammad
```

**Bukti Route**:
- routes/manualReportRoutes.js:15-18 (GET form, eksekutor/koordinator only)
- routes/manualReportRoutes.js:20-23 (POST submit, eksekutor/koordinator only)

---

### A.2 Perbedaan Kunci: Reports vs Manual Non-Ticketing Reports

| Aspek | Tabel `reports` | Tabel `manual_non_ticketing_reports` |
|---|---|---|
| **Saluran Input** | Telegram Bot + Manual Web Form | Manual Web Form Only |
| **Route** | /reports | /manual-reports |
| **Akses CREATE** | Telegram (public) + Koordinator/Super Admin | Eksekutor + Koordinator |
| **Akses VIEW** | Eksekutor/Koordinator/Supervisor/Super Admin | Eksekutor/Koordinator/Super Admin (?) |
| **Status Tracking** | Status Internal (tersedia→diambil→selesai) | No status tracking (work log) |
| **Assignment** | User dapat ambil/delegasi | No assignment workflow |
| **source_channel** | 'telegram' atau 'manual' | N/A (implicit) |
| **Workflow** | Tiketing penuh (SLA tracking) | Work log tanpa SLA |
| **Priority** | High (urgent) | Medium (documentation) |
| **Kolom** | 37 kolom (ticket tracking) | 28 kolom (work details) |

---

### A.3 Akses Control Summary

| Role | `/reports` GET | `/reports` POST (Manual) | `/manual-reports` GET | `/manual-reports` POST | Lihat Telegram | Buat Telegram |
|---|---|---|---|---|---|---|
| Eksekutor | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ (hanya via Bot) |
| Koordinator | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (via Bot) |
| Supervisor | ✅ | ❌ | ❓ | ❌ | ✅ | ❌ |
| Super Admin | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ (via Bot) |
| Pelapor | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (via Bot) |

**❓ Pertanyaan Klarifikasi**: 
- Apakah Supervisor bisa akses `/manual-reports/` ? (routes/manualReportRoutes.js line 10-13)

---

## ✅ BAGIAN B: VERIFIKASI LAPORAN DARI DATA CSV ANDA

### B.1 Struktur Data CSV (Export_Fallout_20260330_095144_DAMAN.csv)

**Kolom CSV**:
```
Tanggal Tiket, Ticket ID, Order ID, WO Number, Service Type,
Segment, Provider, Telkom Daerah, Branch, Cluster, STO,
Summary, Service ID, Status WFM, Status Andalas
```

**Analisis Isi**:
- **Status WFM**: Selalu "OPEN" (belum selesai di WFM)
- **Status Andalas**: Kosong (belum integrated ke Andalas)
- **Ticket ID Format**: INF########## (e.g., INF002757714)
- **Service Type**: UIM: DSC, UIM: NCX, WFM: NCX (backend system identifiers)
- **Provider**: TELKOMSEL, TELKOM (EBIS), TELKOM (RETAIL)

**Interpretasi**: Data ini adalah **EXPORT dari Backend System WFM/UIM**, bukan dari sistem Anda.

---

### B.2 Data Flow Dari Backend ke Sistem Anda

**Hipotesis Alur**:
```
1. Backend WFM/UIM System
   ↓ (generate ticket dengan status OPEN)
2. External Data Sync
   ↓ (export ke CSV atau pull via API)
3. Sistem Anda
   ↓ (receive via Telegram Bot OR Manual Import)
4. Tabel `reports`
   ↓ (track dengan status: tersedia → diambil → selesai)
5. Feedback ke Backend
   ↓ (send status update, resolution, DIIT code)
6. Backend Log
   ↓ (mark as resolved/escalated)
```

**Dalam konteks sistem Anda**:
- ✅ Tiket masuk via **Telegram Bot** (dari reporter manual di chat)
- ✅ Tiket bisa dibuat manual via **Web Form** (Koordinator/Super Admin)
- ❓ Tiket dari **Backend WFM** masuk via apa? (API? Manual Import? Script cron?)

---

### B.3 Mapping CSV Fields ke Tabel `reports`

| CSV Field | Reports Tabel | Mapping | Contoh |
|---|---|---|---|
| Tanggal Tiket | received_at | Timestamp | 2025-03-21 04:38:46 |
| Ticket ID | ticket_id | Direct | INF002757714 |
| Order ID | order_id | Direct | SC1001713243 |
| WO Number | wo_number | Direct | - |
| Service Type | service_type | Direct | UIM: DSC |
| Segment | segment | Direct | ENTERPRISE |
| Provider | provider | Direct | TELKOM (EBIS) |
| Telkom Daerah | reported_region_id | Map to regions | INNER SUMBAR JAMBI → ID 1 |
| Branch | branch_name | Direct | PADANG |
| Cluster | cluster_name | Direct | KOTA PADANG |
| STO | sto | Direct | BDT |
| Summary | summary | Direct | OSM error message |
| Service ID | service_id | Direct | 1-87H-4985_... |
| Status WFM | status_wfm | Direct | OPEN |
| Status Andalas | status_andalas | Direct | NULL |

---

### B.4 Status dan Workflow Data Anda

**CSV Data**:
- Semua Status WFM = "OPEN" (belum selesai)
- Tidak ada Progress tracking (single snapshot)
- Tidak ada assignment info (siapa yang handle)
- Tidak ada resolved_at / closed_at (belum ditutup)

**Ini Menunjukkan**:
```
1. CSV adalah EXPORT dari backend WFM (read-only snapshot)
2. Belum ada status update di sistem Anda
3. Tiket masih dalam status awal (tersedia/baru) di sistem Anda
4. Eksekutor belum ada yang ambil (no taken_at)
5. Belum ada resolution (no resolved_at)
```

---

## ✅ BAGIAN C: KESIMPULAN VERIFIKASI ULANG

### C.1 Koreksi Akurat

| Klaim Lama | Status | Koreksi | Bukti |
|---|---|---|---|
| "Eksekutor tidak bisa membuat laporan manual" | ❌ SALAH | Eksekutor **DAPAT** membuat di `/manual-reports` (non-ticketing) | routes/manualReportRoutes.js |
| "Ada 3 saluran input terpisah" | ⚠️ SETENGAH | Ada **2 saluran**: Telegram Bot + Manual Web Form. Laporan manual web punya 2 tabel berbeda | routes/reportRoutes vs routes/manualReportRoutes |
| "Status `baru` tidak pernah digunakan" | ✅ BENAR | Tapi penjelasan: ini intentional, mempersiapkan future + backward-compat | reportModel.js line 1160 |
| "Supervisor read-only" | ✅ BENAR | Dikonfirmasi, hanya GET `/reports` | routes/reportRoutes.js |

### C.2 Perbaharuan Urutan Prioritas untuk Bab V

**Prioritas 1 (Critical)**: 
- Jelaskan 2 saluran input (Telegram Bot vs Manual Form)
- Jelaskan tabel `reports` vs `manual_non_ticketing_reports`
- Clarify eksekutor's role dalam manual non-ticketing

**Prioritas 2 (Important)**:
- Jelaskan access control per role per saluran
- Jelaskan workflow tiket (status progression)
- Jelaskan data sync dengan backend WFM

**Prioritas 3 (Nice-to-have)**:
- Status enum design rationale
- Future-proofing untuk fitur baru

---

## ❓ PERTANYAAN UNTUK KLARIFIKASI LANJUTAN

1. **Supervisor Access**: Apakah Supervisor benar-benar bisa VIEW `/manual-reports` atau hanya `/reports`?
   - Route saat ini: routes/manualReportRoutes.js:10-13 include 'supervisor'
   - Apakah ini intentional atau oversight?

2. **Backend WFM Integration**: Bagaimana tiket dari CSV (backend WFM) masuk ke sistem Anda?
   - Via Telegram Bot (reporter forward)?
   - Via API pull/push?
   - Via manual import?
   - Via scheduled cron script?

3. **Status Tracking**: Di CSV Anda, semua Status WFM = "OPEN". Apakah:
   - Data tersebut adalah export sekali (snapshot)?
   - Atau real-time sync dengan backend?
   - Bagaimana update Status WFM saat tiket selesai di sistem Anda?

4. **Manual Non-Ticketing Purpose**: Apa perbedaan semantik antara:
   - Laporan manual di `/reports` (ticketing queue)
   - Laporan manual di `/manual-reports` (work log)?
   - Kapan eksekutor pakai yang mana?

---

**Dokumen ini SIAP untuk integrasi ke Bab V setelah Anda klarifikasi poin2 ❓ di atas.**
