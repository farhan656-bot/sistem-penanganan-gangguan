# Tasks — F034: UI/UX Refinement & Anti-Slop

## Candidate Task List (T061 – T084)

Setiap tugas disusun berurutan dengan kriteria penyelesaian (*exit criteria*) dan dependensi yang ketat. Seluruh tugas implementasi berstatus `PENDING` dan baru boleh dieksekusi setelah mendapatkan persetujuan pada task sebelumnya.

---

### [x] T061 — F034 UI/UX Preflight & SDD Initialization
- **Deskripsi**: Verifikasi git baseline (F033 commit `17b305c`), audit read-only, tinjauan anti-slop, dan inisialisasi dokumen SDD F034 (`spec.md`, `plan.md`, `tasks.md`, `checklist.md`, `DESIGN.md`).
- **Target File**: `.specify/features/034-ui-ux-refinement/*`
- **Exit Criteria**: Baseline terkonfirmasi, tidak ada modifikasi kode aplikasi, dokumen SDD terbentuk, T061 PASS.
- **Status**: IN PROGRESS / PREFLIGHT COMPLETION

---

### [x] T062 — UI Inventory & Component Mapping
- **Deskripsi**: Melakukan pemetaan mendalam terhadap seluruh berkas view EJS, partials, stylesheet, dan skrip antarmuka dengan detail properti dan aksi per halaman.
- **Target File**: `views/*`, `public/css/app.css`, `public/js/*`, `.specify/features/034-ui-ux-refinement/ui-inventory-matrix.md`
- **Exit Criteria**: Matriks inventarisasi lengkap tersimpan di dokumen analisis F034 (`ui-inventory-matrix.md`).
- **Status**: COMPLETED


---

### [x] T063 — Design Direction & UI/UX Specification
- **Deskripsi**: Menyusun dan memfinalisasi dokumen panduan arah desain visual (`DESIGN.md`) dan catatan keputusan desain (`design-decision-log.md`) berdasarkan keputusan yang disetujui Human Approval Gate.
- **Target File**: `.specify/features/034-ui-ux-refinement/DESIGN.md`, `.specify/features/034-ui-ux-refinement/design-decision-log.md`
- **Exit Criteria**: `DESIGN.md` difinalisasi tanpa penanda `[NEEDS REVIEW]`, `design-decision-log.md` mendokumentasikan seluruh approved decisions.
- **Status**: COMPLETED


---

### [x] T064 — Anti-Slop Integration Review & Governance
- **Deskripsi**: Mengkaji integrasi repositori `anti-slop` sebagai quality filter di level agen workspace, memastikan kepatuhan non-destruktif terhadap arsitektur TA.
- **Target File**: `.agents/skills/*`, `.agents/rules/*`, `AGENTS.md`, `.specify/features/034-ui-ux-refinement/anti-slop-governance.md`
- **Exit Criteria**: Panduan tata kelola filter anti-slop disetujui (`anti-slop-governance.md`).
- **Status**: COMPLETED


---

### [x] T065 — UI/UX Baseline & Design Token Pre-Implementation Audit
- **Deskripsi**: Melakukan audit baseline visual dan design-token terhadap kondisi aktual aplikasi sebelum implementasi UI dimulai (`ui-baseline-audit.md`).
- **Target File**: `.specify/features/034-ui-ux-refinement/ui-baseline-audit.md`
- **Exit Criteria**: `ui-baseline-audit.md` selesai disusun, komparasi tokens vs DESIGN.md tuntas, 15 komponen terpetakan, dan zero production code modified.
- **Status**: COMPLETED

---

### [x] T066 — Design Tokens & Shared Visual Language
- **Deskripsi**: Menstandardisasi variabel CSS tokens pada `public/css/app.css` (warna, radius, bayangan, status semantics) sesuai arahan `DESIGN.md`.
- **Target File**: `public/css/app.css`, `utils/viewHelpers.js`, `public/js/supervisor-dashboard.js`, `tests/unit/viewHelpers.test.js`
- **Exit Criteria**: CSS tokens bersih, modular, dan tervalidasi di seluruh layout; pemisahan warna `perlu_tindak_lanjut` (#ea580c) aktif; radius 999px dieliminasi.
- **Status**: COMPLETED

---

### [x] T067 — Shared Layout & Navigation Refinement
- **Deskripsi**: Menyempurnakan sidebar (`sidebar.ejs`), topbar (`topbar.ejs`), page header, dan sistem alert flash (`flash.ejs`).
- **Target File**: `views/partials/sidebar.ejs`, `views/partials/topbar.ejs`, `views/partials/page-header.ejs`, `views/partials/flash.ejs`, `public/css/app.css`
- **Exit Criteria**: Navigasi sticky berfungsi sempurna, branding Telkom konsisten, badge status role rapi, inline styling topbar dihilangkan.
- **Status**: COMPLETED

---

### [x] T068 — Login Page Refinement
- **Deskripsi**: Memperbaiki tata letak login (`views/auth/login.ejs`), memperbaiki copy teks bantuan yang terpotong, standardisasi brand mark, dan state password visibility.
- **Target File**: `views/auth/login.ejs`, `public/css/app.css`
- **Exit Criteria**: Tampilan login profesional, tipografi rapi, bebas inline styles tidak baku, TM diganti telkom-logo.png, copy terpotong diperbaiki, label id/for asosiasi lengkap.
- **Status**: COMPLETED

---

### [x] T069 — Eksekutor Dashboard Refinement
- **Deskripsi**: Menyempurnakan dashboard eksekutor (`views/eksekutor/dashboard.ejs`) dengan hierarki metrik tiket aktif yang jelas dan pemisahan tiket yang ditugaskan.
- **Target File**: `views/eksekutor/dashboard.ejs`
- **Exit Criteria**: Eksekutor dapat memantau tiket aktif dan tiket yang perlu tindakan segera secara intuitif.
- **Status**: COMPLETED

---

### [x] T070 — Task Pool & Work Queue Refinement
- **Deskripsi**: Menyempurnakan tabel antrean kerja (`report-queue-table.ejs`), tab status pekerjaan, dan formulir filter pencarian pada `/reports`.
- **Target File**: `views/reports/index.ejs`, `views/partials/report-queue-table.ejs`, `views/partials/report-work-status-tabs.ejs`, `views/partials/report-pagination.ejs`
- **Exit Criteria**: Pemindaian tiket nyaman, kontras tinggi, pagination dan filter responsif.
- **Status**: COMPLETED

---

### [x] T071 — Report Detail & Modal Refinement
- **Deskripsi**: Menyempurnakan tampilan halaman detail laporan (`reports/show.ejs`) dan modal ringkasan (`report-detail-modal.ejs`) dengan segmentasi tab yang bersih.
- **Target File**: `views/reports/show.ejs`, `views/partials/report-detail-modal.ejs`
- **Exit Criteria**: Informasi teknis terstruktur rapi, log histori terbaca jelas tanpa visual clutter.
- **Status**: COMPLETED

---

### [x] T072 — Completion & Escalation UI Refinement
- **Deskripsi**: Menyempurnakan antarmuka penyelesaian tiket, form catatan opsional, dan area unggah bukti (paste upload zone) agar ramah pengguna.
- **Target File**: `views/reports/show.ejs`, `public/css/app.css`
- **Exit Criteria**: Teknisi dapat menyelesaikan tugas dan mengunggah foto bukti dengan cepat dan andal.
- **Status**: COMPLETED

---

### [x] T073 — Koordinator Dashboard & Delegation UI Refinement
- **Deskripsi**: Menyempurnakan dashboard koordinator dan dialog delegasi lintas wilayah agar alur delegasi PDG-BKT memiliki konfirmasi yang aman dari salah klik.
- **Target File**: `views/koordinator/dashboard.ejs`, `views/koordinator/reports/*`
- **Exit Criteria**: Visibilitas beban kerja teknisi dan aksi delegasi terpampang jelas.
- **Status**: COMPLETED

---

### [x] T074 — Supervisor KPI Dashboard Refinement
- **Deskripsi**: Menyempurnakan kartu metrik KPI dan visualisasi grafik Chart.js pada `/dashboard/supervisor` tanpa mengubah hak akses read-only.
- **Target File**: `views/supervisor/dashboard.ejs`, `public/js/supervisor-dashboard.js`
- **Exit Criteria**: Ringkasan performa (Response Time, Resolution Time) mudah dipahami pimpinan secara sekilas.
- **Status**: COMPLETED

---

### [x] T075 — Superadmin User Management UI Refinement
- **Deskripsi**: Menyempurnakan antarmuka kelola user (`views/users/*`) dan dashboard administrasi (`views/super_admin/dashboard.ejs`).
- **Target File**: `views/super_admin/dashboard.ejs`, `views/users/index.ejs`, `views/users/create.ejs`, `views/users/edit.ejs`
- **Exit Criteria**: Form user bersih, validasi input terarah, badge status akun jelas.
- **Status**: COMPLETED

---

### [x] T076 — Manual Non-Ticketing UI Refinement
- **Deskripsi**: Menyempurnakan form dan tabel laporan manual non-ticketing (`views/manual-reports/*`) yang memuat banyak field agar tetap rapi dan terkelompok logis.
- **Target File**: `views/manual-reports/index.ejs`, `views/manual-reports/create.ejs`, `views/manual-reports/show.ejs`
- **Exit Criteria**: Form multi-kolom rapi, tidak melelahkan saat penginputan data panjang.
- **Status**: COMPLETED

---

### [x] T077 — Region Switch UI Refinement
- **Deskripsi**: Menyempurnakan tampilan pengajuan Temporary Region Switch eksekutor dan tabel persetujuan koordinator.
- **Target File**: `views/eksekutor/region-switch/*`, `views/koordinator/region-switch/*`
- **Exit Criteria**: Status akses sementara dan durasi kedaluwarsa tampil transparan.
- **Status**: COMPLETED

---

### [x] T078 — Responsive Behavior Refinement
- **Deskripsi**: Menguji dan menyempurnakan tata letak pada breakpoint mobile (375px), tablet (768px), dan desktop (1280px).
- **Target File**: `public/css/app.css`
- **Exit Criteria**: Tidak ada horizontal overflow pada seluruh layar uji.
- **Status**: COMPLETED

---

### [x] T079 — Accessibility & Interaction States Audit
- **Deskripsi**: Audit kepatuhan rasio kontras warna (WCAG AA), status fokus keyboard, dan atribut ARIA menggunakan skrip audit.
- **Target File**: Seluruh views dan partials.
- **Exit Criteria**: Lulus uji rasio kontras 4.5:1 untuk teks normal; fokus keyboard terlihat jelas.
- **Status**: COMPLETED

---

### [x] T080 — Full System UI & Functional Regression
- **Deskripsi**: Menjalankan seluruh unit test dan regression test untuk menjamin 0 efek samping terhadap fungsionalitas sistem.
- **Target File**: `tests/unit/*.test.js`
- **Exit Criteria**: 100% tes otomatis lulus, console browser bebas pesan galat.
- **Status**: COMPLETED

---

### [x] T081 — Usability Evaluation Formulation
- **Deskripsi**: Menyusun format evaluasi kegunaan sistem untuk kebutuhan pengujian naskah TA.
- **Target File**: `docs/usability-evaluation-framework.md` (atau dokumen pendukung TA).
- **Exit Criteria**: Dokumen instrumen evaluasi selesai dan siap pakai.
- **Status**: COMPLETED

---

### [x] T082 — Thesis Documentation Synchronization
- **Deskripsi**: Menyelaraskan naskah Bab II, IV, dan V dengan tangkapan layar antarmuka terbaru dan deskripsi fitur terkini.
- **Target File**: Dokumen naskah TA (`DRAFT PROPOSAL TA FARHAN (FIX).docx`), `docs/screenshots/`.
- **Exit Criteria**: Seluruh deskripsi antarmuka di naskah berstatus MATCH terhadap implementasi.
- **Status**: COMPLETED

---

### [x] T083 — Final UI Acceptance Review
- **Deskripsi**: Pemeriksaan menyeluruh terhadap kriteria penerimaan F034 bersama Human Approval Gate dan Orchestrator.
- **Target File**: `.specify/features/034-ui-ux-refinement/checklist.md`
- **Exit Criteria**: Semua gate berstatus PASS.
- **Status**: COMPLETED

---

### [x] T084 — F034 Release Checkpoint
- **Deskripsi**: Mengunci rilis F034 (commit, tag `f034-ui-ux-refinement`, dan pembaruan master continuity) setelah otorisasi resmi.
- **Target File**: Repository git release.
- **Exit Criteria**: Baseline rilis F034 terkunci rapi di git.
- **Status**: COMPLETED
