# Specification — F034: UI/UX Refinement & Anti-Slop

## 1. Feature Identity
- **Feature ID**: F034
- **Feature Name**: UI/UX Refinement & Anti-Slop Filter
- **Previous Baseline**: F033 (Report Identity & Database Normalization, commit `17b305c14dcc2ed23cf75c8bd641b6bcabb1cf6d`, tag `f033-normalization-completed`)
- **Status**: DRAFT / SPEC-DRIVEN SPECIFICATION

---

## 2. Problem Statement
Sistem informasi saat ini telah matang secara fungsional dan integritas data (F001 s.d. F008, F032 query indexing, dan F033 normalisasi database). Namun, antarmuka pengguna (UI/UX) masih memiliki beberapa kelemahan:
1. **Pola Desain AI Generic ("Slop")**: Terdapat sisa gaya visual instan (seperti badge TM inisial dengan inline style, variasi rounded corners yang tidak seragam, kontras teks abu-abu yang terlalu rendah pada teks pembantu, dan copy placeholder).
2. **Hierarki Aksi & Informasi Belum Optimal**: Di beberapa halaman kerja operasional (antrean kerja, modal detail tiket, dan dashboard eksekutor), aksi primer (misal: "Ambil Tugas", "Selesaikan") bersaing secara visual dengan tombol sekunder atau data tabular yang padat.
3. **Kesesuaian Workflow Per Peran**: Kebutuhan operasional cepat Eksekutor (fokus scan & klaim tiket) berbeda dengan Koordinator (fokus monitoring distribusi & delegasi lintas wilayah) dan Supervisor (monitoring KPI read-only), namun beberapa pola tata letak masih berbagi struktur yang monoton tanpa diferensiasi fokus tugas.
4. **Kesiapan Naskah Skripsi/TA**: Dokumentasi implementasi antarmuka pada naskah Tugas Akhir (Bab II wireframe/teori Garrett, Bab IV implementasi antarmuka, dan Bab V evaluasi kegunaan) membutuhkan standardisasi tampilan yang otentik, formal, dan mencerminkan aplikasi operasional nyata PT Telkom Sumbar Witel Padang.

---

## 3. Background
Pada iterasi F008 sebelumnya, telah dilakukan standardisasi tata letak global (sidebar, topbar, standardisasi tabel, dan badge). Setelah F008, sistem mengalami evolusi besar di backend dan database (F010 s.d. F033), termasuk normalisasi total identitas tiket menjadi `reports.ticket_id` dan perbaikan integritas relasional child table. F034 hadir sebagai tahap penyempurnaan UI/UX berbasis prinsip operasional dan filter *anti-slop* tanpa mengulang refactoring F008 maupun mengubah arsitektur backend.

---

## 4. Current UI State
Berdasarkan audit inventarisasi `views/` dan `public/css/app.css`:
- **Framework CSS**: Bootstrap 5.3.3 via CDN, didukung oleh stylesheet kustom `public/css/app.css` (457 baris).
- **Struktur Halaman**: Menggunakan layout gabungan (sidebar kiri sticky 264px, topbar atas 60px, konten utama flex).
- **Komponen Parsial**:
  - `views/partials/sidebar.ejs`
  - `views/partials/topbar.ejs`
  - `views/partials/page-header.ejs`
  - `views/partials/flash.ejs`
  - `views/partials/report-work-status-tabs.ejs`
  - `views/partials/report-queue-table.ejs`
  - `views/partials/report-pagination.ejs`
  - `views/partials/report-action-buttons.ejs`
  - `views/partials/report-detail-modal.ejs`
  - `views/partials/status-badge.ejs`
- **Frontend JavaScript**: `public/js/app.js` (1474 baris) menangani auto-dismiss alert, retensi posisi scroll, modal fetch, dynamic tabs, dan polling antrean deterministik (10s aktif / 60s inaktif); `public/js/supervisor-dashboard.js` (208 baris) mengelola grafik Chart.js.

---

## 5. Goals
1. **Menghilangkan Pola "AI Slop"**: Menghapus sisa-sisa elemen dekoratif tidak fungsional, inline styles, placeholder klise, dan inkonsistensi tipografi/warna.
2. **Meningkatkan Kejelasan Aksi (Action Clarity)**: Membedakan secara tegas aksi primer (*Primary CTA*) dengan aksi sekunder pada antrean kerja dan detail laporan.
3. **Meningkatkan Kepadatan Informasi yang Nyaman Dibaca (*Density with Readability*)**: Memastikan tabel antrean kerja mudah dipindai (*scannable*) oleh teknisi operasional tanpa melelahkan mata.
4. **Meningkatkan Aksesibilitas (*Accessibility*)**: Memperbaiki rasio kontras teks pembantu, fokus navigasi keyboard, dan kejelasan status tanpa hanya mengandalkan kode warna.
5. **Menjaga Otentisitas Identitas Perusahaan**: Memperkuat identitas resmi Telkom Witel Padang yang profesional dan fungsional.

---

## 6. Non-Goals
1. **BUKAN Penggantian Framework**: DILARANG mengganti Bootstrap 5 dengan Tailwind, React, Vue, Svelte, atau framework UI lainnya.
2. **BUKAN Perubahan Arsitektur Backend**: DILARANG mengubah arsitektur MVC, CommonJS, database schema, model SQL, routing, middleware auth, maupun session management.
3. **BUKAN Perubahan Alur Bisnis / Lifecycle**: DILARANG mengubah logika siklus tiket (`tersedia`, `diambil`, `didelegasikan`, `selesai`, `perlu_tindak_lanjut`, `eskalasi`), aturan delegasi lintas wilayah PDG-BKT, aturan Temporary Region Switch F007, atau integritas Bot Telegram F006.
4. **BUKAN Auto-Beautification Tanpa Arah**: F034 tidak menambahkan animasi dekoratif berlebih, efek glassmorphism, gradien neon, atau elemen kosmetik yang tidak memiliki tujuan operasional.

---

## 7. Users & Roles
1. **Pegawai Eksekutor**:
   - Job utama: Memindai antrean kerja tiket wilayahnya, mengambil tugas (*claim*), memperbarui progres, dan mengunggah bukti penyelesaian.
   - Kebutuhan UI: Tampilan antrean yang ringkas, tombol "Ambil Tugas" dan "Selesaikan" yang mencolok dan cepat diakses, form upload bukti yang andal.
2. **Koordinator**:
   - Job utama: Memantau beban kerja teknisi, melakukan delegasi penugasan lintas wilayah (PDG $\leftrightarrow$ BKT), membatalkan penugasan macet, menyetujui/menolak pengajuan region switch.
   - Kebutuhan UI: Visibilitas status penugasan aktif, pembedaan jelas antara tiket lokal vs delegasi, aksi delegasi yang aman dari salah klik.
3. **Supervisor / Manajer**:
   - Job utama: Monitoring KPI dan analisis kinerja operasional (Response Time, Resolution Time, distribusi gangguan per STO/wilayah).
   - Kebutuhan UI: Dashboard read-only yang informatif, ringkasan metrik berbasis kartu tanpa kebingungan hierarki, tabel tiket eskalasi yang menonjol.
4. **Superadmin**:
   - Job utama: Manajemen data akun pengguna, pengaturan role, region, dan status aktif/nonaktif akun.
   - Kebutuhan UI: Formulir manajemen user yang bersih, tabel user dengan indikator status aktif/nonaktif yang jelas.
5. **Pelapor (Telegram Bot)**:
   - Tidak menggunakan antarmuka web, hanya menerima output teks dan feedback melalui bot Telegram.

---

## 8. UX Principles
- **P1 — Operational Clarity**: Pengguna langsung memahami item mana yang membutuhkan tindakan segera.
- **P2 — Action Clarity**: Tombol aksi primer harus jelas terlihat dan berbeda dari aksi sekunder atau navigasi.
- **P3 — Information Hierarchy**: Data operasional (nomor tiket, status, wilayah, waktu) tidak boleh kalah bersaing dengan elemen dekoratif.
- **P4 — Density with Readability**: Mendukung pemindaian puluhan tiket dengan nyaman tanpa teks bertumpuk atau spasi kosong berlebihan.
- **P5 — Status Clarity**: Status tiket harus dapat diidentifikasi secara visual melalui teks label eksplisit dan icon pendukung, bukan hanya warna background.
- **P6 — Role Relevance**: Setiap role hanya melihat data dan kontrol yang relevan dengan tanggung jawab operasionalnya.
- **P7 — Progressive Disclosure**: Rincian teknis mendalam (log histori, metadata teknis Telegram) diletakkan di dalam modal atau tab, tidak mengotori antrean utama.
- **P8 — Consistency**: Bahasa visual, ukuran font, padding tombol, dan notifikasi konsisten di seluruh modul.
- **P9 — Responsive Behavior**: Antarmuka tetap fungsional dan tidak rusak (*no horizontal overflow break*) pada layar desktop, tablet, maupun mobile.
- **P10 — Human/Product Authenticity**: Menghindari elemen visual generik buatan AI (misal: widget tanpa fungsi, kartu statistik palsu, animasi melayang).

---

## 9. UI Scope
1. **Shared Layout & Primitives**:
   - Header aplikasi, sidebar navigasi, topbar profil/logout, alert flash message.
2. **Halaman Login**:
   - Formulir login, logo/brand mark, penanganan error dan visibility password.
3. **Daftar Antrean Kerja (`/reports`)**:
   - Tab status pekerjaan (`Semua`, `Tersedia`, `Sedang Dikerjakan`, `Selesai`, `Perlu Tindak Lanjut`, `Eskalasi`).
   - Formulir filter wilayah dan input pencarian.
   - Tabel antrean kerja dan penomoran halaman (*pagination*).
4. **Modal Detail & Halaman Detail Laporan (`/reports/:id`)**:
   - Tab Overview, Bukti/Lampiran, Media Telegram, dan Histori Log Penanganan.
   - Komponen upload bukti penyelesaian (termasuk fitur paste image).
5. **Dashboard Role-Specific**:
   - Dashboard Eksekutor (`/dashboard/eksekutor`).
   - Dashboard Koordinator (`/dashboard/koordinator`).
   - Dashboard Supervisor (`/dashboard/supervisor`).
   - Dashboard Superadmin (`/dashboard/super-admin`).
6. **Modul Pengajuan & Approval Region Switch (`/region-switch/*`)**:
   - Halaman riwayat pengajuan eksekutor dan antrean approval koordinator.
7. **Modul Laporan Manual Non-Ticketing (`/manual-reports/*`)**:
   - Tabel laporan manual dan form pembuatan laporan.
8. **Modul Pengelolaan User (`/users/*`)**:
   - Tabel daftar user, form tambah, dan form edit user.

---

## 10. Functional Preservation Constraints
1. **Identitas Relasional F033 Wajib Terjaga**:
   - Seluruh tampilan dan form WAJIB mengonsumsi `reports.ticket_id`. Kolom `reports.id` yang sudah dihapus tidak boleh direferensikan kembali.
2. **Invariant Penugasan Terjaga**:
   - Tiket `tersedia` memiliki 0 penugasan aktif.
   - Tiket non-`tersedia` memiliki tepat 1 penugasan aktif.
3. **Hak Akses Role (RBAC) Terjaga**:
   - Supervisor tetap read-only murni (tidak ada tombol mutasi).
   - Eksekutor hanya dapat mengambil tiket sesuai region aktif/switch.
   - Koordinator memiliki hak delegasi dan pembatalan penugasan.
4. **Fitur Auto-Refresh Polling**:
   - Polling antrean otomatis (interval 10s aktif / 60s inaktif) pada `public/js/app.js` tetap berfungsi tanpa reload halaman penuh.

---

## 11. Accessibility Expectations
- Kontras warna teks memenuhi WCAG 2.1 AA (minimal 4.5:1 untuk teks normal).
- Setiap form input memiliki label terkait (`<label for="...">` atau `aria-label`).
- Elemen interaktif (tombol, link, tab) memiliki *focus ring* yang jelas saat diakses menggunakan keyboard.
- Badge status menyertakan label tekstual eksplisit.

---

## 12. Responsive Expectations
- **Desktop ($\ge 1200\text{px}$)**: Sidebar persisten, tabel lebar penuh dengan kolom lengkap.
- **Tablet ($768\text{px} - 1199\text{px}$)**: Penyesuaian grid kartu metrik, pembungkusan kontrol filter.
- **Mobile ($< 768\text{px}$)**: Sidebar beralih ke navigasi responsif, tabel dilengkapi pembungkus `table-responsive`, tombol aksi tersusun rapi tanpa terpotong.

---

## 13. Role of Anti-Slop
- Repositori `anti-slop` diposisikan sebagai **Quality Filter & Audit Layer**, bukan sebagai otoritas penentu gaya visual.
- Arah desain visual murni ditentukan oleh kebutuhan operasional Telkom dan berkas `DESIGN.md` proyek ini.
- Skills `antislop-ui`, `antislop-code`, `antislop-copywriting`, `antislop-human`, dan `antislop-layoutmobile` memvalidasi hasil akhir dari cacat generik AI.

---

## 14. TA Documentation Relationship
- Penyesuaian UI dalam F034 menjadi rujukan utama dalam sinkronisasi naskah Tugas Akhir:
  - **Bab II**: Kerangka kerja konseptual User Interface / User Experience (Garrett Model).
  - **Bab III**: Desain antarmuka sistem (mockup/wireframe final).
  - **Bab IV**: Hasil implementasi antarmuka per peran pengguna dan tangkapan layar sistem.
  - **Bab V**: Evaluasi kegunaan sistem (*Usability Testing*) dan analisis performa interaksi.
- Penyesuaian naskah TA untuk F034 dipisahkan secara tegas dari penyesuaian naskah untuk F033 (normalisasi database).

---

## 15. Acceptance Criteria
1. Seluruh 8 modul antarmuka diaudit dan disempurnakan sesuai prinsip P1 s.d. P10.
2. Tidak ada kesalahan JavaScript pada konsol peramban (*zero browser console errors*).
3. Integritas fungsional dan pengujian unit (`node --test`) tetap lulus 100%.
4. Laporan audit *anti-slop* berstatus PASS pada gate pengiriman.
5. Tangkapan layar dan dokumentasi implementasi siap diselaraskan ke naskah TA.

---

## 16. Explicit Safety Constraints
- DILARANG mengubah file database, migration SQL, atau controller business logic.
- DILARANG menjalankan git reset, clean, commit, push, atau tag selama tahap preflight dan audit.
- Pekerjaan implementasi hanya boleh dieksekusi per batch setelah disetujui oleh Reviewer/Human Gate.
