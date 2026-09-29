# UI Inventory & Component Mapping Matrix — F034

> **Task ID:** T062
> **Status:** COMPLETED / VERIFIED
> **Baseline Commit:** `17b305c14dcc2ed23cf75c8bd641b6bcabb1cf6d` (Tag: `f033-normalization-completed`)
> **Karakteristik Task:** Read-Only Inventory, Structural Audit, Component Dependency Mapping.

---

## 1. Ringkasan Eksekutif Inventarisasi
Sistem antarmuka pengguna dibangun menggunakan arsitektur server-side rendering (SSR) dengan **EJS 5.0.2** yang dipadukan dengan **Bootstrap 5.3.3**, stylesheet terpusat `public/css/app.css` (457 baris), serta skrip pendukung `public/js/app.js` (1474 baris) dan `public/js/supervisor-dashboard.js` (208 baris).

Inventarisasi mencakup **19 berkas halaman view**, **10 berkas partials reusable**, **1 berkas CSS utama**, dan **2 berkas JavaScript frontend**. Seluruh komponen mengonsumsi data yang telah dinormalisasi pada F033 dengan identitas kanonikal `reports.ticket_id`.

---

## 2. Matriks Inventarisasi Berkas Halaman (Views)

| No | File Path | Route HTTP & Method | Role Pengguna | Layout / Partials yang Dimuat | Primary Task & Information | Primary Action | Secondary Actions | Responsive Behavior | Temuan UX / AI-Slop Terkait | Target Task F034 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `views/auth/login.ejs` | `GET /auth/login` | Publik / Unauthenticated | Standalone (CSS `app.css`, JS `app.js`) | Autentikasi pengguna internal Telkom ke sistem | Submit form login (`POST /auth/login`) | Toggle visibility password, baca bantuan | Container terpusat responsif (`col-md-7 col-lg-5`) | **UI-SLOP-001** (Badge inisial `TM`), **UI-SLOP-002** (Teks bantuan terpotong) | **T068** |
| 2 | `views/eksekutor/dashboard.ejs` | `GET /dashboard/eksekutor` | `eksekutor` | `sidebar`, `topbar`, `flash`, `page-header`, status badge | Pantau ringkasan metrik tiket (Tersedia, Tiket Saya, Selesai, Tindak Lanjut, Eskalasi) & 5 tiket assigned terbaru | Navigasi ke `/reports` (Buka Antrean) | Klik baris tiket menuju detail | Grid kartu metrik 5 kolom bertumpuk rapi di mobile | Penumpukan 5 kartu metrik di mobile (<576px) cukup tinggi | **T069** |
| 3 | `views/eksekutor/reports/index.ejs` | `GET /eksekutor/reports` | `eksekutor` | Alias wrapper menuju `reports/index` | Antrean operasional tiket eksekutor | Klaim tiket / Ambil tugas | Filter wilayah & tab status | Mewarisi antrean kerja terpadu | - | **T070** |
| 4 | `views/eksekutor/region-switch/index.ejs` | `GET /region-switch/my` | `eksekutor` | `sidebar`, `topbar`, `flash`, `page-header` | Riwayat pengajuan akses sementara ke region lain beserta hitung mundur durasi kedaluwarsa | Ajukan Switch Region (`/region-switch/create`) | Meninjau status approval Koordinator | Tabel riwayat terbungkus `table-responsive` | Format teks countdown waktu perlu dipastikan kontrasnya | **T077** |
| 5 | `views/eksekutor/region-switch/create.ejs` | `GET /region-switch/create` | `eksekutor` | `sidebar`, `topbar`, `flash`, `page-header` | Formulir pengajuan izin akses region sementara (PDG $\leftrightarrow$ BKT) | Submit pengajuan (`POST /region-switch/create`) | Batal / Kembali ke daftar | Form responsif `col-lg-8` | Dropdown region tujuan perlu validasi visual | **T077** |
| 6 | `views/koordinator/dashboard.ejs` | `GET /dashboard/koordinator` | `koordinator` | `sidebar`, `topbar`, `flash`, `page-header` | Pantau distribusi tiket, status antrean, beban kerja per teknisi, dan switch region aktif | Navigasi ke `/reports` atau `/region-switch/pending` | Tinjau delegasi aktif | Grid kartu metrik dan tabel ringkasan teknisi | Hirarki visual antara tiket lokal dan tiket delegasi dapat dipertegas | **T073** |
| 7 | `views/koordinator/reports/index.ejs` | `GET /koordinator/reports` | `koordinator` | Alias wrapper menuju `reports/index` | Antrean supervisi dan redistribusi tugas koordinator | Delegasikan tiket / Batalkan tugas | Filter wilayah & status | Mewarisi antrean kerja terpadu | - | **T073** |
| 8 | `views/koordinator/reports/show.ejs` | `GET /koordinator/reports/:id` | `koordinator` | Alias wrapper menuju `reports/show` | Detail tiket khusus sudut pandang delegasi koordinator | Delegasikan / Batalkan tugas | Tinjau log audit | Mewarisi detail laporan | - | **T073** |
| 9 | `views/koordinator/region-switch/index.ejs` | `GET /region-switch/pending` | `koordinator` | `sidebar`, `topbar`, `flash`, `page-header` | Daftar pengajuan izin akses region sementara yang menunggu persetujuan | Tombol Setujui (`POST .../approve`) | Tombol Tolak (`POST .../reject`) | Tabel tindakan dengan tombol aksi inline | Tombol Approve/Reject inline butuh konfirmasi modal aman | **T077** |
| 10 | `views/supervisor/dashboard.ejs` | `GET /dashboard/supervisor` | `supervisor` | `sidebar`, `topbar`, `flash`, `page-header`, Chart.js | Monitoring performa SLA/KPI, Response Time, Resolution Time, Sebaran gangguan per STO, Tiket eskalasi | Terapkan Filter Tanggal & District | Reset filter, klik anchor in-page section | Grid kartu multi-row dan kanvas grafik Chart.js | Halaman sangat panjang (507 baris EJS), butuh pemisahan section yang lebih tajam | **T074** |
| 11 | `views/super_admin/dashboard.ejs` | `GET /dashboard/super-admin` | `super_admin` | `sidebar`, `topbar`, `flash`, `page-header` | Ringkasan akun sistem, pengguna aktif/nonaktif, total laporan, total region | Manajemen User (`/users`) | Tambah User (`/users/create`) | Grid kartu metrik administrasi 6 kolom | Kartu klik navigasi perlu efek hover yang lebih eksplisit | **T075** |
| 12 | `views/reports/index.ejs` | `GET /reports` | Multi-role | `sidebar`, `topbar`, `flash`, `page-header`, `tabs`, `table`, `modal` | Antrean kerja terpusat, polling pembaruan otomatis (10s/60s), tab status tiket | Pindah Tab Status / Ambil Tugas | Filter Wilayah, Pencarian, Paginasi | Form filter horizontal, tabel dengan scroll | **Decision C**: Tabel 13 kolom butuh Adaptive Card Layout di `<576px` | **T070, T078** |
| 13 | `views/reports/show.ejs` | `GET /reports/:id` | Multi-role | `sidebar`, `topbar`, `flash`, `page-header`, status badge | Rincian lengkap tiket gangguan, media Telegram, unggah bukti penyelesaian | Selesaikan Tiket / Ambil Tugas | Unggah foto bukti (termasuk paste event), kembali | Form upload bukti flexbox responsif | **UI-SLOP-004** (Query string cache busting `?v=f016-evidence-paste`) | **T071, T072** |
| 14 | `views/manual-reports/index.ejs` | `GET /manual-reports` | Eksekutor, Koordinator, Superadmin | `sidebar`, `topbar`, `flash`, `page-header`, pagination | Daftar pekerjaan non-ticketing terpisah dari bot Telegram | Tambah Laporan Manual (`/manual-reports/create`) | Filter pencarian, filter tanggal | Tabel 8 kolom terbungkus `table-responsive` | Filter pencarian 4 kolom di mobile perlu pembungkusan rapi | **T076** |
| 15 | `views/manual-reports/create.ejs` | `GET /manual-reports/create` | Eksekutor, Koordinator | `sidebar`, `topbar`, `flash`, `page-header` | Formulir perekaman pekerjaan manual (21 field spesifik) | Simpan Laporan Manual (`POST /manual-reports`) | Batal / Reset | Form multi-kolom `row g-3` | Kepadatan form 21 field butuh pengelompokan visual (fieldsets) | **T076** |
| 16 | `views/manual-reports/show.ejs` | `GET /manual-reports/:id` | Eksekutor, Koordinator, Superadmin | `sidebar`, `topbar`, `flash`, `page-header` | Rincian lengkap laporan pekerjaan non-ticketing | Edit / Perbarui | Kembali ke daftar | Kartu rincian 2 kolom | Metadata teknis butuh label kontras | **T076** |
| 17 | `views/users/index.ejs` | `GET /users` | `super_admin` | `sidebar`, `topbar`, `flash`, `page-header` | Daftar akun pengguna internal, role, district, dan status keaktifan | Tambah User (`/users/create`) | Edit Akun User, Ubah Status Aktif/Nonaktif | Tabel pengguna dengan kolom aksi terpusat | Badge status akun perlu kontras terstandar | **T075** |
| 18 | `views/users/create.ejs` | `GET /users/create` | `super_admin` | `sidebar`, `topbar`, `flash`, `page-header` | Formulir pembuatan user baru (nama, username, password, role, district) | Simpan User (`POST /users`) | Batal / Kembali ke `/users` | Form vertikal `col-lg-6` | Petunjuk password minimal & role butuh helper text jelas | **T075** |
| 19 | `views/users/edit.ejs` | `GET /users/:id/edit` | `super_admin` | `sidebar`, `topbar`, `flash`, `page-header` | Formulir pengubahan data user dan reset password opsional | Perbarui User (`POST /users/:id`) | Batal / Kembali | Form vertikal `col-lg-6` | Helper text pergantian password perlu dibedakan dari create | **T075** |

---

## 3. Matriks Komponen Parsial Bersama (Partials)

| No | File Path | Fungsi Utama | Dependensi Konteks | Elemen Interaktif & Markup Utama | Temuan UX / AI-Slop & Keputusan Approval | Target Task F034 |
|---|---|---|---|---|---|---|
| 1 | `views/partials/sidebar.ejs` | Navigasi menu utama samping (sticky desktop 264px) | `currentUser`, `activePath` | Logo Telkom (`telkom-logo.png`), fallback brand text, daftar link dinamis berbasis role | Sudah menggunakan logo Telkom resmi, kontras link aktif sudah baik | **T067** |
| 2 | `views/partials/topbar.ejs` | Header bilah atas aplikasi (tinggi 60px) | `currentUser`, `pageTitle`, `roleMeta` | Judul dinamis, nama lengkap user, badge role, tombol logout | Tombol logout merah outline perlu konfirmasi jika sesi aktif | **T067** |
| 3 | `views/partials/page-header.ejs` | Header area konten halaman | `pageTitle`, `pageSubtitle`, `pageActions` | Slot flexbox judul, subtitle abu-abu, dan container tombol aksi | Standar layout baik; perlu dipastikan padding konsisten di mobile | **T067** |
| 4 | `views/partials/flash.ejs` | Menampilkan pesan umpan balik (success/error) | `success_msg`, `error_msg` | Alert Bootstrap dismissible dengan integrasi auto-dismiss timer | Auto-dismiss 4 detik via JS berjalan baik | **T067** |
| 5 | `views/partials/report-work-status-tabs.ejs` | Tab navigasi filter status pekerjaan di `/reports` | `workStatusTabs`, `activeWorkStatusTab` | Nav-tabs horizontal dengan badge counter jumlah tiket per status | Scroll horizontal tipis pada mobile; perlu indikator visual tab aktif | **T070** |
| 6 | `views/partials/report-queue-table.ejs` | Tabel rendering daftar antrean tiket gangguan | `reports`, `pagination`, `filters`, `currentUser` | Tabel 13 kolom, status badge, action buttons, empty state | **Decision C**: Butuh Adaptive Card View pada viewport `<576px` | **T070, T078** |
| 7 | `views/partials/report-action-buttons.ejs` | Grup tombol aksi per baris tiket | `report`, `currentUser` | Tombol `Detail`, `Ambil`, `Kerjakan`, `Delegasi`, `Batalkan` | Tombol `Ambil` (POST form) vs `Detail` (link) perlu hierarki visual primer-sekunder | **T070** |
| 8 | `views/partials/report-detail-modal.ejs` | Modal AJAX ringkasan tiket gangguan | Bootstrap Modal (`#reportDetailModal`) | Nav tabs: Overview, Bukti, Media Telegram, Log Penanganan | Menghindari re-fetch berlebih saat modal dibuka berulang kali | **T071** |
| 9 | `views/partials/status-badge.ejs` | Komponen visual rendering badge status | `type`, `value`, `utils/viewHelpers.js` | `<span class="badge ...">` | **UI-SLOP-003 & Decision A**: `perlu_tindak_lanjut` harus oranye tua (`#ea580c`) | **T066, T070** |
| 10 | `views/partials/report-pagination.ejs` | Bilah navigasi penomoran halaman | `pagination`, `filters` | Pagination Bootstrap (Prev, nomor halaman, Next) | Pemilihan halaman pada mobile tidak boleh pecah keluar layar | **T070, T078** |

---

## 4. Matriks Stylesheet & Frontend JavaScript

| Berkas | Ukuran / Baris | Tanggung Jawab Operasional | Analisis Friksi & Temuan | Target Task F034 |
|---|---|---|---|---|
| `public/css/app.css` | 457 baris | Design tokens `:root`, override primary Telkom Red (`#e11d2a`), layout sidebar/topbar, table styling, paste evidence zone, status tabs. | - Radius badge 999px pil ekstrem (**UI-SLOP-003**).<br>- Belum ada utility token warna status oranye `#ea580c` (**Decision A**).<br>- Media query mobile butuh styling khusus Adaptive Card Layout (**Decision C**). | **T066, T078** |
| `public/js/app.js` | 1474 baris | Auto-dismiss flash message, quick-action scroll preservation, AJAX detail modal loader, adaptive queue polling (10s aktif / 60s inaktif), paste image upload handler. | - Script fungsional dan stabil.<br>- Terdapat pemanggilan versi cache-busting manual ad-hoc di EJS (**UI-SLOP-004**). | **T070, T072** |
| `public/js/supervisor-dashboard.js` | 208 baris | Inisialisasi grafik Chart.js (doughnut chart status distribusi tiket dan bar chart performa). | - Mengonsumsi variabel warna status Bootstrap.<br>- Perlu sinkronisasi warna jika status `perlu_tindak_lanjut` diubah ke oranye. | **T074** |

---

## 5. Pemetaan Keputusan Human Approval Gate Terhadap Komponen

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        KEPUTUSAN HUMAN APPROVAL GATE                                   │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
  [KEPUTUSAN A]               [KEPUTUSAN B]               [KEPUTUSAN C]
  Status Badge Oranye         Logo Resmi Login            Mobile Adaptive Card
  (#ea580c)                   (/images/telkom-logo.png)   (<576px Viewport)
         │                           │                           │
         ▼                           ▼                           ▼
  Komponen Terdampak:         Komponen Terdampak:         Komponen Terdampak:
  • utils/viewHelpers.js      • views/auth/login.ejs      • views/partials/
  • views/partials/           • public/css/app.css          report-queue-table.ejs
    status-badge.ejs          (hapus inline styles)       • public/css/app.css
  • public/css/app.css                                      (@media <576px)
  • supervisor-dashboard.js                               • public/js/app.js
         │                           │                           │
         ▼                           ▼                           ▼
  Dieksekusi Pada:            Dieksekusi Pada:            Dieksekusi Pada:
  Task T066 & T070            Task T068                   Task T070 & T078
```

---

## 6. Kesimpulan & Status Kesiapan Task
* Inventarisasi mendalam terhadap seluruh 29 template view/partials dan dependensi CSS/JS telah tuntas dipetakan.
* Tidak ada komponen produksi yang diubah pada task ini (Read-Only Inventory).
* Seluruh temuan dan keputusan Human Approval Gate telah terpetakan secara presisi ke task eksekusi yang sesuai.
