# Plan — F034: UI/UX Refinement & Anti-Slop

## Overview
Rencana implementasi terstruktur untuk F034 mencakup 13 fase bertahap (Phase 0 hingga Phase 12). Setiap fase memiliki cakupan terisolasi untuk memastikan stabilitas fungsional sistem dan kepatuhan arsitektur sebelum melanjutkan ke fase berikutnya.

---

## Phase Breakdown

### Phase 0 — Preflight & Baseline Verification
- **Objective**: Memverifikasi kesiapan lingkungan kerja, konsistensi git, dan integritas rilis F033 secara *read-only*.
- **Scope**:
  - Pemeriksaan git status, HEAD commit (`17b305c`), dan tag `f033-normalization-completed`.
  - Verifikasi integritas schema database (relasi `reports.ticket_id`).
  - Pembuatan kerangka dokumen SDD di `.specify/features/034-ui-ux-refinement/`.
- **Dependencies**: Tidak ada (fondasi awal).
- **Validation**: Git baseline terverifikasi, tes regresi F033 lulus 11/11 suite.
- **Rollback/Safety Note**: Hanya operasi baca (*read-only*), tidak ada modifikasi kode aplikasi.

---

### Phase 1 — Comprehensive UI Inventory
- **Objective**: Mendata seluruh halaman, template partial EJS, stylesheet CSS, dan skrip JavaScript antarmuka secara mendalam.
- **Scope**:
  - Inventarisasi berkas di `views/` (auth, eksekutor, koordinator, supervisor, super_admin, reports, manual-reports, users, partials).
  - Analisis dependensi aset di `public/css/app.css` dan `public/js/`.
- **Dependencies**: Phase 0.
- **Validation**: Matriks inventarisasi UI terdokumentasi lengkap dengan mapping rute HTTP dan peran pengguna.
- **Rollback/Safety Note**: Dokumen analisis murni, tidak ada risiko regresi sistem.

---

### Phase 2 — UX Audit & Operational Friction Analysis
- **Objective**: Mengevaluasi friksi alur pengguna, kejelasan hierarki informasi, dan pemetaan pola AI-slop pada kode aktual.
- **Scope**:
  - Audit berbasis 5 peran pengguna dan 10 prinsip operasional (P1 s.d. P10).
  - Identifikasi temuan *AI Slop* (`UI-SLOP-xxx`).
- **Dependencies**: Phase 1.
- **Validation**: Daftar temuan UX dan AI-slop terdokumentasi dengan bukti lokasi berkas nyata.
- **Rollback/Safety Note**: Evaluasi analitis, tidak menyentuh kode aplikasi.

---

### Phase 3 — Design Direction & DESIGN.md Formulation
- **Objective**: Menetapkan arah desain visual formal dan autentik khas Telkom Witel Padang sebagai panduan tunggal proyek.
- **Scope**:
  - Penyusunan `DESIGN.md` yang memuat identitas visual, tokens warna, tipografi, hierarki tata letak, dan konvensi status.
  - Penegasan bahwa arah visual berasal dari proyek, bukan dari generator eksternal.
- **Dependencies**: Phase 2.
- **Validation**: Persetujuan `DESIGN.md` oleh Human Approval Gate.
- **Rollback/Safety Note**: Dokumen acuan arah desain, tidak mengubah runtime sistem.

---

### Phase 4 — Design Tokens & Shared CSS Refinement
- **Objective**: Menstandarkan variabel CSS tokens pada `public/css/app.css` agar terstruktur, mudah dirawat, dan konsisten.
- **Scope**:
  - Pembersihan token warna, radius, elevasi bayangan, dan utilitas tipografi.
  - Penghapusan aturan CSS mati/usang tanpa menambah dependensi baru.
- **Dependencies**: Phase 3.
- **Validation**: Verifikasi tampilan layout global tidak mengalami pergeseran atau kerusakan visual mendadak.
- **Rollback/Safety Note**: Cadangan `app.css` siap dipulihkan jika timbul regresi styling.

---

### Phase 5 — Shared Layout & Primitives Standardization
- **Objective**: Menyempurnakan komponen tata letak bersama (sidebar, topbar, page-header, dan flash messages).
- **Scope**:
  - Standardisasi `views/partials/sidebar.ejs` dan `views/partials/topbar.ejs`.
  - Penataan brand mark logo Telkom dan indikator role pengguna.
  - Perbaikan komponen alert/flash message auto-dismiss.
- **Dependencies**: Phase 4.
- **Validation**: Navigasi sidebar berfungsi mulus pada seluruh role pengguna; alert tampil rapi.
- **Rollback/Safety Note**: Perubahan terisolasi pada direktori `views/partials/`.

---

### Phase 6 — Role-Specific UI Refinement (Batch Execution)
- **Objective**: Menyempurnakan antarmuka spesifik per peran berdasarkan prioritas tugas operasionalnya.
- **Scope**:
  - **Batch 6A**: Halaman Login (`views/auth/login.ejs`).
  - **Batch 6B**: Antrean Kerja & Filter (`views/reports/index.ejs`, partials tabel).
  - **Batch 6C**: Detail Laporan & Modal Bukti (`views/reports/show.ejs`, modal detail).
  - **Batch 6D**: Dashboard Eksekutor & Koordinator (`views/eksekutor/*`, `views/koordinator/*`).
  - **Batch 6E**: Dashboard Supervisor & Superadmin (`views/supervisor/*`, `views/super_admin/*`).
  - **Batch 6F**: Modul Pendukung (Manual Reports & Region Switch).
- **Dependencies**: Phase 5.
- **Validation**: Eksekusi pengujian per batch, memastikan tidak ada controller/model yang tersentuh.
- **Rollback/Safety Note**: Dikerjakan satu modul per satu iterasi dengan validasi ketat.

---

### Phase 7 — Responsive Layout Refinement
- **Objective**: Mengoptimalkan fluiditas dan daya adaptasi antarmuka pada berbagai resolusi layar.
- **Scope**:
  - Penanganan tabel antrean kerja pada layar sempit/mobile (`table-responsive`).
  - Pembungkusan tombol aksi (*action buttons*) agar tidak mengalami tumpang tindih.
  - Penyesuaian drawer sidebar pada perangkat mobile.
- **Dependencies**: Phase 6.
- **Validation**: Pengujian pada breakpoint 375px (mobile), 768px (tablet), dan 1280px (desktop) tanpa horizontal scroll yang merusak.
- **Rollback/Safety Note**: Penyesuaian murni menggunakan media query CSS di `app.css`.

---

### Phase 8 — Accessibility & Interaction States
- **Objective**: Memastikan standar aksesibilitas dasar (WCAG 2.1 AA) dan kejelasan status interaksi.
- **Scope**:
  - Verifikasi rasio kontras teks (minimal 4.5:1).
  - Penyempurnaan status *hover*, *focus-visible*, *active*, dan *disabled* pada seluruh kontrol formulir dan tombol.
  - Penambahan atribut pendukung pembaca layar (`aria-label`, `aria-expanded`).
- **Dependencies**: Phase 7.
- **Validation**: Audit kontras warna menggunakan `contrast-check.py` dari modul `antislop-human`.
- **Rollback/Safety Note**: Modifikasi terisolasi pada atribut HTML dan deklarasi CSS state.

---

### Phase 9 — UI & Functional Regression Testing
- **Objective**: Memverifikasi bahwa seluruh alur operasional sistem berjalan sempurna tanpa efek samping visual maupun logis.
- **Scope**:
  - Menjalankan seluruh rangkaian tes otomatis (`node --test tests/unit/*.test.js`).
  - Verifikasi konsistensi kueri database live.
  - Pengecekan konsol JavaScript pada setiap rute utama.
- **Dependencies**: Phase 8.
- **Validation**: 100% tes otomatis lulus, 0 error JavaScript pada konsol browser.
- **Rollback/Safety Note**: Jika ditemukan kegagalan, lakukan rollback spesifik pada berkas UI yang bermasalah.

---

### Phase 10 — Usability Evaluation Formulation
- **Objective**: Menyusun data instrumen evaluasi kegunaan sistem untuk kebutuhan pengujian akademik.
- **Scope**:
  - Penyusunan skenario pengujian tugas (*task scenario*) per peran untuk dievaluasi pada naskah TA.
  - Perhitungan indikator kemudahan penggunaan (*System Usability Scale* / metrik penyelesaian tugas).
- **Dependencies**: Phase 9.
- **Validation**: Dokumen skenario evaluasi siap digunakan untuk Bab V TA.
- **Rollback/Safety Note**: Dokumen evaluasi murni, tidak memengaruhi kode produksi.

---

### Phase 11 — Thesis Documentation Synchronization
- **Objective**: Menyelaraskan naskah naskah laporan Tugas Akhir (Bab II, IV, dan V) dengan hasil implementasi UI final.
- **Scope**:
  - Pengambilan tangkapan layar antarmuka terbaru (*high-resolution, consistent zoom*).
  - Pembaruan deskripsi antarmuka pada naskah proposal/laporan TA.
  - Pemisahan tegas antara catatan perbaikan F033 (database) dan F034 (antarmuka).
- **Dependencies**: Phase 10.
- **Validation**: Matriks keselarasan naskah TA terverifikasi MATCH.
- **Rollback/Safety Note**: Penulisan dokumentasi pendukung, tidak mengubah runtime.

---

### Phase 12 — Final Acceptance & Release Gate
- **Objective**: Memverifikasi seluruh kriteria penerimaan terpenuhi dan mengunci rilis F034.
- **Scope**:
  - Review menyeluruh checklist F034.
  - Laporan akhir kesiapan rilis.
  - Penguncian tag rilis setelah mendapatkan otorisasi eksplisit dari Human Approval Gate.
- **Dependencies**: Phase 11.
- **Validation**: Seluruh item checklist berstatus PASS.
- **Rollback/Safety Note**: Git tag dan commit hanya dibuat atas persetujuan eksplisit pengguna.
