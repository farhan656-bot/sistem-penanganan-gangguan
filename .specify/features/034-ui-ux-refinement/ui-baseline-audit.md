# UI/UX Baseline & Design Token Pre-Implementation Audit (T065)
## F034 — UI/UX Refinement & Anti-Slop

> **Status:** AUDIT COMPLETED / PRE-IMPLEMENTATION GATE PASSED
> **Mode:** STRICT EXECUTION / READ-ONLY
> **Baseline Release:** F033 — Report Identity & Database Normalization (`17b305c14dcc2ed23cf75c8bd641b6bcabb1cf6d`, Tag `f033-normalization-completed`)
> **Otoritas Desain:** [DESIGN.md](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/.specify/features/034-ui-ux-refinement/DESIGN.md) & Human Approval Gate
> **Filter Mutu:** [anti-slop-governance.md](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/.specify/features/034-ui-ux-refinement/anti-slop-governance.md)

---

## 1. Executive Summary

Dokumen ini merupakan laporan audit menyeluruh terhadap kondisi visual, design tokens, komponen antarmuka, tata letak responsif, aksesibilitas, dan aset skrip aplikasi **Sistem Informasi Pengelolaan dan Monitoring Penanganan Gangguan Layanan PT Telkom Sumbar Witel Padang** sebelum pengerjaan implementasi UI/UX F034 (T066 s.d. T084) dimulai.

Audit T065 dilakukan dalam mode **STRICT READ-ONLY**. Tidak ada berkas produksi (`controllers/`, `models/`, `routes/`, `services/`, `views/`, `public/css/`, `public/js/`), basis data MySQL, atau konfigurasi package yang dimodifikasi selama audit ini.

### Temuan Utama (Key Highlights)
1. **Design Tokens Mismatch:**
   - Variabel `:root` pada [public/css/app.css](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/css/app.css) saat ini menggunakan `--app-radius: 0.75rem` (12px) dan `--app-radius-sm: 0.5rem` (8px), sedangkan [DESIGN.md](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/.specify/features/034-ui-ux-refinement/DESIGN.md) menetapkan `--app-radius: 0.5rem` (8px) dan `--app-radius-sm: 0.375rem` (6px).
   - Terdapat token yang belum didefinisikan secara modular di `:root`: `--app-primary-subtle`, `--app-surface-subtle`, `--app-border-focus`, `--app-text-primary`, `--app-text-secondary`, dan semantic status color tokens.
2. **Tabrakan Warna Status (Status Color Collision):**
   - Status `perlu_tindak_lanjut` masih menggunakan kelas Bootstrap `text-bg-warning`, yang bertabrakan identik dengan status `diambil` baik pada [utils/viewHelpers.js](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/utils/viewHelpers.js#L54-L57), [tests/unit/viewHelpers.test.js](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/tests/unit/viewHelpers.test.js#L34-L39), maupun diagram chart supervisor di [public/js/supervisor-dashboard.js](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/js/supervisor-dashboard.js#L38-L42).
   - Belum ada kelas CSS dan token khusus untuk `--app-status-follow-up: #ea580c` (Oranye Tua) sesuai Keputusan A [DESIGN.md](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/.specify/features/034-ui-ux-refinement/DESIGN.md#L45).
3. **Pill Radius & 999px:**
   - Ditemukan aturan global `.badge { border-radius: 999px; }` pada [public/css/app.css:129](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/css/app.css#L129) dan kelas `rounded-pill` pada [views/partials/report-work-status-tabs.ejs:15](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-work-status-tabs.ejs#L15), yang melanggar batasan radius [DESIGN.md](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/.specify/features/034-ui-ux-refinement/DESIGN.md#L75).
4. **Halaman Login (Auth):**
   - Masih menggunakan kotak inisial generik `TM` dengan inline styling pada [views/auth/login.ejs:16-18](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs#L16-L18).
   - Kalimat bantuan pada [views/auth/login.ejs:64](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs#L64) mengalami copy terpotong (*truncated text*): *"Jika mengalami kendala login, super admin."*
5. **Antrean Tiket Mobile (<576px):**
   - Format antrean pada [views/partials/report-queue-table.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-queue-table.ejs) masih berupa tabel lebar 13 kolom dalam pembungkus `.table-responsive` tanpa Adaptive Card Layout. Hal ini menyebabkan *horizontal scrolling* panjang di ponsel sempit dan tombol aksi di kolom ke-13 sulit dijangkau.
6. **Cache-Busting Query Strings:**
   - Ditemukan sebanyak 21 kemunculan query string versi (`?v=...`) lintas 14 berkas view dengan 6 variasi string yang berbeda-beda secara *ad-hoc*.

Seluruh temuan telah dipetakan secara rapi ke task implementasi resmi F034 (T066 s.d. T081) tanpa menyisakan item `UNMAPPED`.

---

## 2. Audit Scope

Pemeriksaan mencakup penelaahan mendalam terhadap berkas-berkas berikut:

| Kategori | Jalur Berkas | Jumlah Baris / Ukuran | Fokus Pemeriksaan |
|---|---|---|---|
| **Stylesheets** | [public/css/app.css](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/css/app.css) | 457 baris | Token warna, radius, bayangan, layout, utilitas |
| **Scripts Frontend** | [public/js/app.js](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/js/app.js) | 1,474 baris | Event handler, auto-dismiss alert, quick action, modal |
| **Scripts Chart** | [public/js/supervisor-dashboard.js](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/js/supervisor-dashboard.js) | 208 baris | Pemetaan warna chart KPI status tiket |
| **Aset Gambar** | [public/images/telkom-logo.png](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/images/telkom-logo.png) | 200,384 bytes | Keberadaan dan integritas aset logo resmi |
| **Auth Views** | [views/auth/login.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs) | 89 baris | Brand mark, copy helper, inline styles, form layout |
| **Shared Layout** | [views/partials/sidebar.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/sidebar.ejs) | 66 baris | Navigasi peran, brand mark, link aktif |
| **Shared Layout** | [views/partials/topbar.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/topbar.ejs) | 35 baris | Header user, badge role, tombol logout, inline style |
| **Shared Layout** | [views/partials/page-header.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/page-header.ejs) | 27 baris | Hirarki judul, subtitle, tombol aksi |
| **Shared Layout** | [views/partials/flash.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/flash.ejs) | 34 baris | Komponen alert, auto-dismiss, warna alert |
| **Partials Tiket** | [views/partials/report-queue-table.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-queue-table.ejs) | 82 baris | 13 kolom antrean, aksi, responsivitas |
| **Partials Tiket** | [views/partials/report-action-buttons.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-action-buttons.ejs) | 57 baris | Tombol aksi operasional (Ambil, Kerjakan, Delegasi) |
| **Partials Tiket** | [views/partials/report-work-status-tabs.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-work-status-tabs.ejs) | 23 baris | Nav tabs, pill badge, penghitung jumlah tiket |
| **Partials Tiket** | [views/partials/report-detail-modal.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-detail-modal.ejs) | 119 baris | Modal detail, tab navigasi modal, empty state |
| **Partials Tiket** | [views/partials/status-badge.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/status-badge.ejs) | 13 baris | Pemanggilan helper status badge |
| **Partials Tiket** | [views/partials/report-pagination.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-pagination.ejs) | 72 baris | Kontrol navigasi halaman antrean |
| **Helper View** | [utils/viewHelpers.js](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/utils/viewHelpers.js) | 114 baris | Pemetaan kelas dan label status tiket |
| **Unit Tests** | [tests/unit/viewHelpers.test.js](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/tests/unit/viewHelpers.test.js) | 85 baris | Asersi unit test pemetaan status tiket |

---

## 3. Design Token Baseline

### A. Color Tokens
Perbandingan token warna aktual ([app.css](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/css/app.css#L6-L24)) terhadap [DESIGN.md](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/.specify/features/034-ui-ux-refinement/DESIGN.md#L21-L47):

| Token | Nilai Aktual (`app.css`) | Spesifikasi `DESIGN.md` | Status Evaluasi | Target Task |
|---|---|---|---|---|
| `--app-primary` | `#e11d2a` | `#e11d2a` | **MATCH (PASS)** | T066 |
| `--app-primary-hover` | `#c81824` | `#c81824` | **MATCH (PASS)** | T066 |
| `--app-primary-active` | `#ad1520` | `#ad1520` | **MATCH (PASS)** | T066 |
| `--app-primary-subtle` | *Tidak ada di `:root`* | `rgba(225, 29, 42, 0.08)` | **MISSING (FAIL)** | T066 |
| `--app-bg` | `#f6f7f9` | `#f6f7f9` | **MATCH (PASS)** | T066 |
| `--app-surface` | `#ffffff` | `#ffffff` | **MATCH (PASS)** | T066 |
| `--app-surface-subtle` | *Tidak ada di `:root`* | `rgba(0, 0, 0, 0.02)` | **MISSING (FAIL)** | T066 |
| `--app-border` | `rgba(0, 0, 0, 0.10)` | `rgba(0, 0, 0, 0.10)` | **MATCH (PASS)** | T066 |
| `--app-border-focus` | *Hardcoded di `.form-control:focus`* | `rgba(225, 29, 42, 0.45)` | **PARTIAL** | T066 |
| `--app-text-primary` | *Tidak ada di `:root`* | `#212529` | **MISSING (FAIL)** | T066 |
| `--app-text-secondary` | *Tidak ada di `:root`* | `#495057` | **MISSING (FAIL)** | T066 |
| `--app-text-muted` | Dinamai `--app-muted: #6c757d` | `--app-text-muted: #6c757d` | **NAME MISMATCH** | T066 |

### B. Status Semantics Tokens & Collision Analysis
Evaluasi terhadap semantik 6 status tiket operasional:

| Status Tiket | Kelas Aktual (`viewHelpers.js`) | Token Spesifikasi `DESIGN.md` | Nilai Hex Target | Evaluasi Masalah | Target Task |
|---|---|---|---|---|---|
| `tersedia` | `text-bg-primary` | `--app-status-available` | `#0d6efd` | Sesuai Bootstrap default, belum ada token CSS | T066, T070 |
| `diambil` | `text-bg-warning` | `--app-status-in-progress` | `#d97706` | Sesuai Bootstrap warning | T066, T070 |
| `didelegasikan`| `text-bg-info` | `--app-status-delegated` | `#0284c7` | Sesuai Bootstrap info | T066, T070 |
| `selesai` | `text-bg-success` | `--app-status-completed` | `#16a34a` | Sesuai Bootstrap success | T066, T070 |
| `perlu_tindak_lanjut` | `text-bg-warning` | `--app-status-follow-up` | `#ea580c` | **CRITICAL COLLISION:** Bertabrakan 100% dengan status `diambil` (keduanya kuning)! | T066, T070, T071, T072 |
| `eskalasi` | `text-bg-danger` | `--app-status-escalated` | `#dc2626` | Sesuai Bootstrap danger | T066, T070 |
| `netral/nonaktif` | `text-bg-secondary` | `--app-status-neutral` | `#6c757d` | Sesuai Bootstrap secondary | T066, T074 |

> [!CAUTION]
> **Temuan Khusus Status Collision:**
> Pada [utils/viewHelpers.js:57](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/utils/viewHelpers.js#L57) dan [public/js/supervisor-dashboard.js:41](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/js/supervisor-dashboard.js#L41), status `perlu_tindak_lanjut` dan `diambil` keduanya memetakan ke kelas/token `warning`. Hal ini membingungkan teknisi di antrean dan membuat irisan chart supervisor memiliki warna yang sama persis. Diperlukan penambahan token `--app-status-follow-up: #ea580c` dan styling badge khusus pada T066, serta pembaruan asersi pengujian di [tests/unit/viewHelpers.test.js](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/tests/unit/viewHelpers.test.js#L34-L39).

### C. Typography Baseline
- **Font Family:** Menggunakan font bawaan Bootstrap (system stack). Sesuai dengan spesifikasi `DESIGN.md`.
- **H1 / Page Title:** Ditata secara ad-hoc menggunakan `.h4 mb-1` (login) atau `.h6 mb-0` (topbar) atau `.h5 mb-0` (page-header). Belum ada standarisasi ukuran `1.25rem` (20px).
- **H2 / Section Title:** Menggunakan `.h6 mb-1` atau kelas heading default Bootstrap.
- **H3 / Card Metric:** Ukuran angka statistik di dashboard supervisor dan eksekutor menggunakan kombinasi `.h2` atau `.h4` Bootstrap.
- **Body & Label:** Menggunakan ukuran default browser `1rem` (16px) kecuali jika diberi kelas `.small` (14px). Belum terpusat pada `0.875rem` (14px) untuk body text operasional enterprise.
- **Monospace Identifier:** Kolom `Ticket ID` pada [report-queue-table.ejs:42](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-queue-table.ejs#L42) hanya menggunakan `.fw-semibold` tanpa kelas `.font-monospace`, sehingga karakter alfanumerik tiket (misal: `IN...`) tidak memiliki perataan lebar karakter yang presisi.

### D. Spacing Baseline
- Pola spacing aktual didominasi kelas utilitas Bootstrap: `p-4`, `p-md-4`, `p-1`, `mb-3`, `gap-2`, `gap-3`.
- Pada [app.css:59-65](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/css/app.css#L59-L65), `.app-page-content` telah menggunakan `1.25rem` (20px) pada mobile dan `1.5rem` (24px) pada desktop (`min-width: 992px`), yang sesuai dengan kelipatan skala 4px [DESIGN.md](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/.specify/features/034-ui-ux-refinement/DESIGN.md#L65-L73).
- Padding sel tabel pada [app.css:94-96](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/css/app.css#L94-L96) belum distandarisasi ke `0.75rem` (12px).

### E. Corner Radius Baseline
- **Nilai Aktual di CSS:**
  - `--app-radius: 0.75rem` (12px) $\rightarrow$ Terlalu besar untuk enterprise operational tool (DESIGN.md menetapkan `0.5rem` / 8px).
  - `--app-radius-sm: 0.5rem` (8px) $\rightarrow$ Terlalu besar untuk tombol dan input (DESIGN.md menetapkan `0.375rem` / 6px).
- **Pelanggaran Radius 999px & Pill:**
  - [public/css/app.css:129](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/css/app.css#L129): `.badge { border-radius: 999px; }` $\rightarrow$ Seluruh badge berbentuk kapsul bulat berlebihan.
  - [views/partials/report-work-status-tabs.ejs:15](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-work-status-tabs.ejs#L15): `<span class="badge rounded-pill ...">` $\rightarrow$ Penggunaan kelas Bootstrap `rounded-pill`.
  - [views/auth/login.ejs:16](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs#L16): `border-radius: 16px;` pada kotak inisial `TM`.

### F. Elevation & Shadows Baseline
- **Nilai Aktual di CSS:**
  - `--app-shadow: 0 6px 18px rgba(0, 0, 0, 0.06)`
  - `--app-shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.06)`
- **Kesesuaian:**
  - Bayangan aktual memiliki radius kabur (*blur radius*) yang agak lebar (10px–18px), memberikan kesan kartu sedikit melayang.
  - Sesuai [DESIGN.md:80-84](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/.specify/features/034-ui-ux-refinement/DESIGN.md#L80-L84), bayangan kartu harus diubah menjadi lebih rapat dan tajam (`--app-shadow-card: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)`), serta menambahkan `--app-shadow-modal: 0 10px 25px rgba(0, 0, 0, 0.10)`.

---

## 4. Component Baseline Matrix

Evaluasi terhadap 15 komponen standar antarmuka:

| No | Komponen | Kondisi Aktual | Aturan `DESIGN.md` | Status | Berkas Terdampak | Target Task |
|---|---|---|---|---|---|---|
| 1 | **Buttons** | Menggunakan `.btn` dengan radius `0.5rem`, target sentuh mobile ~31px | Radius `0.375rem`, touch target mobile minimal `38px`, aksi primer di kanan | **PARTIAL** | `app.css`, `report-action-buttons.ejs` | T066, T070, T078 |
| 2 | **Forms** | Menggunakan `.form-control` dengan radius `0.5rem`, border-focus merah hardcoded | Radius `0.375rem`, token `--app-border-focus`, label eksplisit dengan required mark | **PARTIAL** | `app.css`, `views/**/form*.ejs` | T066, T068, T075 |
| 3 | **Tables** | Header abu-abu tipis, aksi di kanan (`.app-table-actions`), tanpa monospace ID | Header font-size `0.8125rem`, Ticket ID `font-monospace`, hover halus | **PARTIAL** | `app.css`, `report-queue-table.ejs` | T066, T070 |
| 4 | **Status Badges** | Radius `999px`, status `perlu_tindak_lanjut` bertabrakan warna dengan `diambil` | Radius `0.375rem`, warna oranye `#ea580c`, dilarang pill | **FAIL** | `app.css`, `viewHelpers.js`, `status-badge.ejs` | T066, T070, T071 |
| 5 | **Cards** | Radius `0.75rem`, shadow `0 2px 10px rgba(0,0,0,0.06)` | Radius `0.5rem`, shadow card rapat `0 1px 3px ...` | **PARTIAL** | `app.css`, views kartu | T066, T067 |
| 6 | **Modals** | Radius default Bootstrap, judul `h1` di modal header | Radius `0.5rem`, shadow modal `0 10px 25px ...`, tab tematik rapi | **PARTIAL** | `app.css`, `report-detail-modal.ejs` | T066, T071 |
| 7 | **Tabs** | Menggunakan Bootstrap nav-tabs dengan overflow scroll tipis, badge menggunakan `rounded-pill` | Tabs dengan border bottom halus, counter badge radius `0.375rem` tanpa pill | **PARTIAL** | `report-work-status-tabs.ejs` | T066, T070 |
| 8 | **Sidebar** | Sticky desktop 264px, brand mark logo Telkom + fallback, collapsible di mobile | Sticky navigation, branding Telkom konsisten, badge status role | **PASS** | `app.css`, `sidebar.ejs` | T067 |
| 9 | **Topbar** | Sticky header 60px, nama user, role badge, tombol logout, inline style line-height | Header rapi bebas inline style, kontras teks optimal | **PARTIAL** | `topbar.ejs` | T067 |
| 10 | **Page Header** | Flex header dengan judul dan subtitle terstruktur | Standarisasi H1 `1.25rem` dan subtitle `0.8125rem` | **PASS** | `page-header.ejs` | T067 |
| 11 | **Flash Alerts** | Alert dismissible dengan auto-dismiss 4000ms untuk success, border radius `0.75rem` | Radius `0.5rem`, standarisasi alert sistem | **PARTIAL** | `app.css`, `flash.ejs` | T066, T067, T077 |
| 12 | **Pagination** | Pilihan tiket per halaman (10, 25, 50), text info data, link Previous/Next | Navigasi halaman responsif, tombol sentuh mudah | **PASS** | `report-pagination.ejs` | T070, T078 |
| 13 | **Login Brand Mark**| Kotak inisial `TM` ungu/merah muda dengan inline styles 56x56px radius 16px | Dihilangkan, diganti aset `telkom-logo.png` terstandarisasi (Decision B) | **FAIL** | `views/auth/login.ejs` | T068 |
| 14 | **Report Queue** | Tabel 13 kolom dalam `table-responsive`, tidak ada layout mobile adaptif | Adaptive Card Layout pada mobile (<576px), tabel tetap pada desktop (Decision C) | **FAIL** | `report-queue-table.ejs` | T070, T078 |
| 15 | **Mobile Responsive** | Sidebar stacking di `<992px`, tabel lebar overflow di `<576px` | Reflow layout bersih, zero horizontal scroll pada antrean | **PARTIAL** | `app.css`, `report-queue-table.ejs` | T070, T078 |

---

## 5. Anti-Slop Baseline Findings

Berdasarkan framework tata kelola mutu [anti-slop-governance.md](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/.specify/features/034-ui-ux-refinement/anti-slop-governance.md), berikut adalah katalog temuan anti-slop baseline yang terdeteksi pada kode aktual:

### Finding AS-001: Truncated Copy pada Kalimat Bantuan Login
- **ID:** `AS-FIND-001`
- **Lokasi:** [views/auth/login.ejs:64](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs#L64)
- **Bukti Aktual:**
  ```html
  <div class="mt-3 text-muted small">
    Gunakan akun yang telah didaftarkan oleh administrator. Jika mengalami kendala login, super admin.
  </div>
  ```
- **Masalah:** Kalimat terpotong (*truncated copy*) di akhir kalimat (`"...super admin."`). Merusak kredibilitas profesional dan kejelasan instruksi pengguna.
- **Kategori Anti-Slop:** `antislop-copywriting` (Incomplete/Truncated Copy).
- **Severity:** HIGH
- **Confidence:** HIGH (100% fakta kode)
- **Task Tujuan:** `T068` (Login Page Refinement)

### Finding AS-002: Generic AI Brand Mark Placeholder (`TM` Box)
- **ID:** `AS-FIND-002`
- **Lokasi:** [views/auth/login.ejs:16-18](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs#L16-L18)
- **Bukti Aktual:**
  ```html
  <div class="d-inline-flex align-items-center justify-content-center mb-3" style="width: 56px; height: 56px; border-radius: 16px; background: rgba(225, 29, 42, 0.10);">
    <span class="fw-bold text-primary" style="font-size: 18px;">TM</span>
  </div>
  ```
- **Masalah:** Placeholder merek generik buatan AI (*generic AI placeholder mark*) menggunakan huruf `TM` yang tidak mencerminkan identitas korporat Telkom Witel Padang.
- **Kategori Anti-Slop:** `antislop-ui` (Generic AI Branding / Placeholder Aesthetic).
- **Severity:** HIGH
- **Confidence:** HIGH
- **Task Tujuan:** `T068` (Login Page Refinement — Digantikan oleh `telkom-logo.png`)

### Finding AS-003: Aturan Pill Radius 999px Berlebihan pada Badge
- **ID:** `AS-FIND-003`
- **Lokasi:** [public/css/app.css:129](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/css/app.css#L129) dan [views/partials/report-work-status-tabs.ejs:15](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-work-status-tabs.ejs#L15)
- **Bukti Aktual:**
  ```css
  /* app.css:129 */
  .badge {
    border-radius: 999px;
    font-weight: 600;
  }
  ```
  ```html
  <!-- report-work-status-tabs.ejs:15 -->
  <span class="badge rounded-pill <%= tab.active ? 'text-bg-primary' : 'text-bg-light' %>">
  ```
- **Masalah:** Pola visual AI slop umum berupa gelembung pil melengkung ekstrem (999px / `.rounded-pill`) yang bertentangan dengan estetika enterprise tool presisi.
- **Kategori Anti-Slop:** `antislop-ui` (Excessive Pill Radius).
- **Severity:** MEDIUM
- **Confidence:** HIGH
- **Task Tujuan:** `T066` (Design Tokens) & `T070` (Queue Status Tabs)

### Finding AS-004: Inline Styling yang Tidak Baku pada Halaman dan Komponen
- **ID:** `AS-FIND-004`
- **Lokasi:** [views/auth/login.ejs:12,16,17](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs#L12), [views/partials/topbar.ejs:22,23](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/topbar.ejs#L22), [views/reports/show.ejs:185](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/reports/show.ejs#L185)
- **Bukti Aktual:**
  - `style="min-height: 100vh;"`
  - `style="line-height: 1.1"`
  - `style="max-height: 280px; object-fit: cover; width: 100%;"`
  - `style="width: 56px; height: 56px; border-radius: 16px; background: rgba(225, 29, 42, 0.10);"`
- **Masalah:** Penulisan gaya visual secara inline (*inline CSS smell*) yang menyulitkan pemeliharaan dan inkonsisten dengan kelas terpusat `app.css`.
- **Kategori Anti-Slop:** `antislop-code` (Inline Styling Pollution).
- **Severity:** MEDIUM
- **Confidence:** HIGH
- **Task Tujuan:** `T066` (Utility classes di `app.css`), `T067` (Topbar), `T068` (Login), `T071` (Reports Show)

### Finding AS-005: Tabrakan Semantik Warna Status Tiket
- **ID:** `AS-FIND-005`
- **Lokasi:** [utils/viewHelpers.js:54,57](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/utils/viewHelpers.js#L54) dan [public/js/supervisor-dashboard.js:38,41](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/js/supervisor-dashboard.js#L38)
- **Bukti Aktual:**
  ```javascript
  /* viewHelpers.js */
  diambil: { cls: 'text-bg-warning', label: 'Diambil' },
  perlu_tindak_lanjut: { cls: 'text-bg-warning', label: 'Perlu Tindak Lanjut' },
  ```
- **Masalah:** Dua status operasional dengan signifikansi yang sangat berbeda (sedang dikerjakan vs butuh tindakan revisi/eskalasi) menggunakan warna peringatan kuning yang sama persis tanpa diferensiasi kontras visual.
- **Kategori Anti-Slop:** `antislop-human` / `antislop-ui` (Action Clarity & Visual Collision).
- **Severity:** HIGH
- **Confidence:** HIGH
- **Task Tujuan:** `T066` (Tokens), `T070` (Queue), `T071` (Detail Modal), `T072` (Supervisor Charts)

---

## 6. Responsive Baseline

Audit tata letak pada berbagai breakpoint:

### A. Breakpoint `< 576px` (Mobile Viewport)
- **Kondisi Aktual Antrean:** Tabel antrean kerja ([report-queue-table.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/partials/report-queue-table.ejs)) memiliki lebar minimum render ~1,100px karena memuat 13 kolom (No, Ticket ID, Order ID, Layanan, Provider, Branch, Cluster, STO, Ringkasan, Wilayah, Status, Assigned To, Aksi).
- **Dampak Pengguna:** Pada layar ponsel selebar 360px – 412px, teknisi harus melakukan geser horizontal (*horizontal panning*) yang melelahkan hanya untuk menjangkau tombol "Ambil" atau "Kerjakan" di kolom paling kanan.
- **Status Adaptive Cards:** Belum ada markup kartu adaptif (`.d-md-none` atau media query mobile) pada antrean saat ini.
- **Target Solusi:** `T070` dan `T078` mengimplementasikan **Adaptive Card Layout (<576px)** sesuai arsitektur [DESIGN.md Section 4.B](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/.specify/features/034-ui-ux-refinement/DESIGN.md#L144-L162).

### B. Breakpoint `576px – 767px` (Small Tablet)
- Tabel antrean mulai terbaca lebih baik, namun kolom aksi tetap membutuhkan pembungkus horizontal scroll.
- Tombol aksi berukuran kecil (`.btn-sm`) membutuhkan penyesuaian touch target agar tidak sulit ditekan di layar sentuh tablet.

### C. Breakpoint `768px – 1199px` (Tablet Lebar / Laptop Ringan)
- Sidebar navigasi (`264px`) berposisi sticky di kiri dengan konten di kanan.
- Tata letak berjalan stabil tanpa pemotongan konten kritis.

### D. Breakpoint `≥ 1200px` (Desktop Operasional)
- Tabel 13 kolom tampil optimal dan proporsional. Seluruh kolom data dan tombol aksi berada dalam satu bidang pandang tanpa scroll horizontal.

### E. Analisis Integritas JavaScript / DOM Hook
Skrip [public/js/app.js](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/public/js/app.js) mengikat sejumlah listener berdasarkan atribut data berikut pada baris tabel:
- `data-report-detail-url`: Untuk memicu pembukaan modal rincian JSON.
- `data-ticket-quick-action`: Untuk penanganan form aksi cepat (Ambil tiket).
- `data-action-type="take"` dan `data-ticket-id`: Untuk menyimpan posisi scroll (`restoreQuickActionScroll`).

> [!IMPORTANT]
> **Safety Contract untuk T070/T078:**
> Ketika mengimplementasikan Adaptive Card Layout pada mobile, elemen kartu **WAJIB** menyertakan atribut data yang sama persis (`data-ticket-quick-action`, `data-action-type`, `data-ticket-id`, `data-report-detail-url`) agar fungsionalitas JavaScript pada `app.js` tetap berjalan normal tanpa duplikasi kode atau regresi.

---

## 7. Accessibility Baseline (WCAG 2.1 AA)

Audit kepatuhan aksesibilitas terhadap antarmuka eksisting:

| Kriteria Aksesibilitas | Kondisi Aktual | Evaluasi | Catatan & Rekomendasi | Target Task |
|---|---|---|---|---|
| **Rasio Kontras Teks Normal** | Teks `#212529` di atas `#ffffff` menghasilkan rasio kontras 13.5:1; `#495057` menghasilkan 7.0:1. | **PASS** | Memenuhi syarat minimal 4.5:1 (WCAG AA). | T066 |
| **Kontras Teks Muted** | Kelas `.text-muted` (`#6c757d`) di atas `#f6f7f9` menghasilkan rasio kontras ~4.2:1. | **RISK** | Sedikit di bawah 4.5:1 pada latar belakang abu-abu sangat terang. Perlu penyesuaian `--app-text-muted` ke `#636b74` (4.6:1). | T066, T079 |
| **Status Fokus Keyboard** | Input form memiliki outline merah transparan saat `:focus`, namun tautan navigasi, tombol, dan tab belum memiliki `:focus-visible` ring eksplisit. | **PARTIAL** | Tambahkan aturan global `:focus-visible` dengan outline 2px dan offset 2px di `app.css`. | T066, T079 |
| **Navigasi Keyboard Tab/Modal** | Modal detail menggunakan Bootstrap modal & tablist yang mendukung navigasi tombol Tab, Enter, dan Escape. | **PASS** | Aksesibel melalui keyboard native. | T071, T079 |
| **Asosiasi Label & Form** | Sebagian besar input memiliki label teks, namun input username pada [login.ejs:47](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs#L47) belum memiliki pasangan atribut `id` dan `for`. | **PARTIAL** | Tambahkan `id="usernameInput"` dan `<label for="usernameInput">`. | T068, T079 |
| **Semantik Tombol** | Tombol aksi Ambil menggunakan `<button type="submit">`, link detail menggunakan `<a class="btn">`. | **PASS** | Semantik elemen HTML tepat. | T070 |
| **Keterbacaan Status Badge** | Seluruh badge status selalu menyertakan label teks Bahasa Indonesia eksplisit (tidak hanya mengandalkan warna). | **PASS** | Sangat baik untuk pengguna dengan defisiensi penglihatan warna (*color-blindness*). | T070, T071 |
| **Target Sentuh Mobile** | Tombol aksi antrean berukuran `.btn-sm` dengan tinggi ~31px. | **FAIL** | Di bawah standar target sentuh minimum mobile (`38px` – `44px`). Perlu diperbesar pada viewport mobile. | T070, T078 |

---

## 8. Cache-Busting Baseline

Hasil audit penelusuran query string versi (`?v=...`) pada pemanggilan berkas CSS dan JavaScript di seluruh folder `views/`:

### Rekapitulasi Berkas & Nilai Versi (21 Kemunculan)
1. **Nilai Versi: `?v=flash-auto-dismiss-20260505-2` (10 berkas):**
   - [views/auth/login.ejs:72](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs#L72) (`/js/app.js`)
   - [views/eksekutor/dashboard.ejs:161](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/eksekutor/dashboard.ejs#L161) (`/js/app.js`)
   - [views/eksekutor/region-switch/create.ejs:89](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/eksekutor/region-switch/create.ejs#L89) (`/js/app.js`)
   - [views/eksekutor/region-switch/index.ejs:103](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/eksekutor/region-switch/index.ejs#L103) (`/js/app.js`)
   - [views/koordinator/dashboard.ejs:233](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/koordinator/dashboard.ejs#L233) (`/js/app.js`)
   - [views/koordinator/region-switch/index.ejs:98](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/koordinator/region-switch/index.ejs#L98) (`/js/app.js`)
   - [views/super_admin/dashboard.ejs:153](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/super_admin/dashboard.ejs#L153) (`/js/app.js`)
   - [views/users/create.ejs:126](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/users/create.ejs#L126) (`/js/app.js`)
   - [views/users/edit.ejs:111](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/users/edit.ejs#L111) (`/js/app.js`)
   - [views/users/index.ejs:84](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/users/index.ejs#L84) (`/js/app.js`)
2. **Nilai Versi: `?v=f031-adaptive-polling-10s` (3 berkas):**
   - [views/reports/index.ejs:92](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/reports/index.ejs#L92) (`/js/app.js`)
   - [views/koordinator/reports/index.ejs:96](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/koordinator/reports/index.ejs#L96) (`/js/app.js`)
   - [views/eksekutor/reports/index.ejs:96](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/eksekutor/reports/index.ejs#L96) (`/js/app.js`)
3. **Nilai Versi: `?v=f016-evidence-paste` (2 berkas):**
   - [views/reports/show.ejs:8](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/reports/show.ejs#L8) (`/css/app.css`)
   - [views/koordinator/reports/show.ejs:8](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/koordinator/reports/show.ejs#L8) (`/css/app.css`)
4. **Nilai Versi: `?v=f027-smooth-ticket-action-ux` (2 berkas):**
   - [views/reports/show.ejs:399](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/reports/show.ejs#L399) (`/js/app.js`)
   - [views/koordinator/reports/show.ejs:420](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/koordinator/reports/show.ejs#L420) (`/js/app.js`)
5. **Nilai Versi: `?v=f017-manual-report` (3 berkas):**
   - [views/manual-reports/create.ejs:289](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/manual-reports/create.ejs#L289) (`/js/app.js`)
   - [views/manual-reports/index.ejs:174](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/manual-reports/index.ejs#L174) (`/js/app.js`)
   - [views/manual-reports/show.ejs:193](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/manual-reports/show.ejs#L193) (`/js/app.js`)
6. **Nilai Versi: `?v=f025-telegram-sender-identity` (1 berkas):**
   - [views/supervisor/dashboard.ejs:498](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/supervisor/dashboard.ejs#L498) (`/js/app.js`)

### Analisis Inkonsistensi
Pola penamaan versi saat ini sangat *ad-hoc* karena dibuat per-fitur masa lalu (F016, F017, F025, F027, F031, dan tanggal darurat). Hal ini rentan menyebabkan peramban menyajikan berkas CSS/JS usang (*stale cache*) saat F034 merilis perbaikan visual.
- **Rekomendasi Standardisasi:** Pada task `T077`, seluruh query string statis ini akan distandarisasi ke satu tag versi seragam (misal: `?v=f034-ui-ux-refinement-v1`) atau melalui konstanta helper view tunggal.

---

## 9. Implementation Task Mapping

Pemetaan seluruh temuan baseline ke task resmi F034:

| Kategori Temuan | Ringkasan Temuan | Berkas Terkait | Task Alokasi F034 | Status Alokasi |
|---|---|---|---|---|
| **Design Tokens** | Radius (`0.5rem`/`0.375rem`), bayangan rapat, token warna primer & subtle | `public/css/app.css` | **T066** — Design Tokens | MAPPED |
| **Status Semantics** | Token `--app-status-follow-up: #ea580c`, pemisahan warna `perlu_tindak_lanjut` vs `diambil` | `app.css`, `viewHelpers.js` | **T066**, **T070**, **T071** | MAPPED |
| **Layout & Nav** | Pembersihan inline style topbar, penyempurnaan sidebar & page-header | `topbar.ejs`, `sidebar.ejs` | **T067** — Shared Layout | MAPPED |
| **Auth & Branding** | Penggantian kotak `TM` dengan `telkom-logo.png`, perbaikan copy terpotong | `views/auth/login.ejs` | **T068** — Login Page | MAPPED |
| **Eksekutor UX** | Penataan hierarki tiket aktif saya vs antrean wilayah | `views/eksekutor/dashboard.ejs`| **T069** — Eksekutor Dash | MAPPED |
| **Antrean Kerja** | Penghilangan pill radius pada tabs, monospace Ticket ID, integrasi status baru | `report-queue-table.ejs`, tabs | **T070** — Task Pool Queue | MAPPED |
| **Modal & Detail** | Radius modal `0.5rem`, shadow modal, tab bukti sistem & telegram | `report-detail-modal.ejs` | **T071** — Detail Modal | MAPPED |
| **KPI Supervisor** | Penyelarasan warna chart status (pemisahan warna `perlu_tindak_lanjut`) | `supervisor-dashboard.js` | **T072** — Supervisor Dash | MAPPED |
| **Koordinator UX** | Penegasan visual delegasi aktif lintas wilayah PDG-BKT | `koordinator/dashboard.ejs` | **T073** — Koordinator Dash | MAPPED |
| **Superadmin UX** | Standarisasi tabel pengguna dan indikator keaktifan akun | `views/users/*` | **T074** — User Mgmt UI | MAPPED |
| **Manual Reports** | Standarisasi formulir pelaporan manual gangguan | `views/manual-reports/*` | **T075** — Manual Report UI | MAPPED |
| **Region Switch** | Standarisasi alur pengajuan dan approval temporary switch | `views/**/region-switch/*` | **T076** — Region Switch UI | MAPPED |
| **Cache & Flash** | Penyatuan 21 query string versi statis & timing flash alerts | Semua views yang memanggil JS | **T077** — Cache & Alerts | MAPPED |
| **Mobile Adaptive** | Implementasi Adaptive Card Layout (<576px) pada antrean tiket | `app.css`, queue partials | **T078** — Mobile Adaptive | MAPPED |
| **Aksesibilitas** | Global `:focus-visible` ring, touch targets 38px, kontras teks | `app.css`, partials | **T079** — Accessibility | MAPPED |
| **Kualitas Mutu** | Audit menyeluruh kepatuhan anti-slop pasca implementasi | Seluruh berkas UI F034 | **T080** — Anti-Slop Audit | MAPPED |
| **Regresi Sistem** | Validasi fungsional dan integritas data F033 (11/11 tests pass) | Seluruh test suite | **T081** — Visual & Regres | MAPPED |

*Catatan: Tidak ada temuan yang berstatus UNMAPPED.*

---

## 10. Regression Safety & F033 Contract Protection

Untuk memastikan proses implementasi UI F034 tidak merusak stabilitas operasional yang telah dicapai pada rilis F033:
1. **Database Schema Intact:**
   - Tidak ada migration baru atau perubahan skema tabel basis data `db_penanganan_gangguan`.
   - Foreign key relasional tunggal `reports.ticket_id` tetap menjadi jangkar utama seluruh entitas tiket (`report_assignments`, `report_status_logs`, `report_media`, `report_telegram_metadata`, `manual_reports`).
2. **Business Invariant Guarantee:**
   - Invariant tiket tetap dilindungi secara ketat:
     - Tiket status `tersedia`: memiliki tepat 0 active assignment.
     - Tiket status non-`tersedia` (`diambil`, `didelegasikan`, `selesai`, `perlu_tindak_lanjut`, `eskalasi`): memiliki tepat 1 active assignment.
3. **MVC Architecture Strictness:**
   - Modifikasi visual pada F034 dibatasi secara ketat pada lapisan Presentasi (`views/` dan `public/css/`).
   - Logika bisnis pada `controllers/`, pemodelan kueri SQL pada `models/`, dan integrasi bot pada `services/` tetap **UNTOUCHED**.
4. **Read-Only Verification (T065):**
   - Perintah validasi git mengonfirmasi nol byte perubahan pada kode produksi aplikasi selama eksekusi task T065.

---

## 11. T065 Exit Criteria

| Kriteria Penerimaan (Exit Criteria) | Status | Keterangan Verifikasi |
|---|---|---|
| Audit komparasi aktual vs `DESIGN.md` selesai secara mendalam | **MEMENUHI** | Analisis warna, tipografi, spacing, radius, dan shadow lengkap. |
| Seluruh 15 komponen baseline terdokumentasi status dan berkasnya | **MEMENUHI** | Matriks 15 komponen lengkap dengan status PASS/PARTIAL/FAIL. |
| Audit anti-slop menemukan finding terstruktur dan terklasifikasi | **MEMENUHI** | 5 finding struktural (`AS-FIND-001` s.d. `AS-FIND-005`) tercatat. |
| Analisis tabel 13 kolom antrean mobile terdokumentasi jelas | **MEMENUHI** | Karakteristik overflow dan data hook integrasi JS terpetakan. |
| Katalog seluruh 21 cache-busting query string tersusun | **MEMENUHI** | 21 query string lintas 14 berkas view terdata rinci. |
| Seluruh temuan terpetakan ke task resmi F034 tanpa unmapped items | **MEMENUHI** | Matriks pemetaan T066 – T081 lengkap dan tertutup. |
| Status read-only aplikasi terjaga (zero code change di production) | **MEMENUHI** | Tidak ada modifikasi pada `views/`, `public/`, `models/`, dll. |
| Dokumen `ui-baseline-audit.md` dibuat pada direktori spesifikasi | **MEMENUHI** | Tersimpan pada `.specify/features/034-ui-ux-refinement/`. |

---

## 12. Open Questions & Recommendations

1. **Pembaruan Asersi Unit Test untuk Status `perlu_tindak_lanjut`:**
   - *Pertanyaan:* Pada saat task T066/T070 mengimplementasikan kelas status baru untuk `perlu_tindak_lanjut` (misalnya `.text-bg-status-follow-up` atau kelas khusus oranye `#ea580c`), apakah pengujian [tests/unit/viewHelpers.test.js:35-38](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/tests/unit/viewHelpers.test.js#L35-L38) diizinkan diperbarui asersinya agar tetap sinkron?
   - *Rekomendasi:* Ya, pembaruan asersi unit test view helper wajib dilakukan di task T066/T070 agar test suite tetap lulus 100% dan mencerminkan kelas status oranye yang baru.
2. **Pola Cache-Busting Versioning:**
   - *Pertanyaan:* Apakah standarisasi cache-busting pada T077 sebaiknya menggunakan string statis tunggal (misal `?v=f034-v1`) di setiap template atau menggunakan variabel konfigurasi global di `app.locals` Express?
   - *Rekomendasi:* Menggunakan variabel tunggal atau string seragam pada template EJS agar tidak mengubah bootstrap middleware backend yang tidak perlu.
