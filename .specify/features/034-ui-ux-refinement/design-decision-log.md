# Design Decision Log — F034: UI/UX Refinement & Anti-Slop

Dokumen ini mencatat keputusan desain arsitektural antarmuka pengguna, justifikasi operasional, komponen terdampak, tugas implementasi terkait, analisis risiko regresi, dan status persetujuan (*Human Approval Gate*).

---

## Log Keputusan Desain

### DECISION-F034-001: Pembedaan Visual Badge Status `perlu_tindak_lanjut`
* **Deskripsi Keputusan:** Menetapkan warna status `perlu_tindak_lanjut` menggunakan warna oranye tua (`#ea580c`) dengan teks kontras tinggi dan radius standar token (`--app-radius-sm`: `6px`), menggantikan badge pill kuning warning `text-bg-warning` (999px).
* **Alasan / Justifikasi:** Pada baseline sebelumnya, status `diambil` (sedang dikerjakan normal) dan `perlu_tindak_lanjut` (tiket bermasalah/memerlukan revisi bukti) sama-sama menggunakan warna kuning amber `text-bg-warning`. Hal ini memicu ambiguitas operasional bagi teknisi dan koordinator (`UI-SLOP-003`).
* **Komponen Terdampak:**
  - `utils/viewHelpers.js` (`ticketStatusMeta()`)
  - `views/partials/status-badge.ejs`
  - `public/css/app.css` (penambahan utility class `--app-status-follow-up` dan `.app-badge-follow-up`)
  - `public/js/supervisor-dashboard.js` (`statusTokenMap`)
  - `tests/unit/viewHelpers.test.js` (sinkronisasi assert badge class)
* **Task F034 Terkait:** T066 (CSS Tokens) dan T070 (Work Queue Refinement).
* **Risiko Regresi:** Rendah. Hanya memengaruhi kelas CSS visual dan pengujian unit helper. Tidak mengubah nama enum status database (`perlu_tindak_lanjut`).
* **Status Approval:** **APPROVED BY HUMAN APPROVAL GATE**

---

### DECISION-F034-002: Penggantian Inisial Generik "TM" dengan Logo Resmi Telkom pada Halaman Login
* **Deskripsi Keputusan:** Menghilangkan badge inisial "TM" generik ber-inline style pada [views/auth/login.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs) dan menggantinya dengan asset resmi `public/images/telkom-logo.png` yang dibungkus kelas CSS terpusat `.app-brand-logo-login`.
* **Alasan / Justifikasi:** Kotak merah dengan inisial "TM" merupakan artefak generator AI instan (`UI-SLOP-001`) yang menurunkan kredibilitas visual aplikasi enterprise resmi PT Telkom Indonesia Witel Padang. Asset `telkom-logo.png` sudah tersedia dan berhasil digunakan di sidebar.
* **Komponen Terdampak:**
  - `views/auth/login.ejs`
  - `public/css/app.css` (kelas `.app-brand-login` dan `.app-brand-logo-login`)
* **Task F034 Terkait:** T068 (Login Page Refinement).
* **Risiko Regresi:** Nol. Perubahan murni pada elemen visual halaman login. Alur autentikasi `POST /auth/login` tidak tersentuh.
* **Status Approval:** **APPROVED BY HUMAN APPROVAL GATE**

---

### DECISION-F034-003: Koreksi Teks Bantuan Login Terpotong
* **Deskripsi Keputusan:** Memperbaiki teks bantuan login pada [views/auth/login.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs) dari kalimat terpotong `"...kendala login, super admin."` menjadi kalimat formal lengkap: `"Gunakan akun yang telah didaftarkan oleh administrator. Jika mengalami kendala login, hubungi Superadmin Divisi Data Management."`
* **Alasan / Justifikasi:** Kalimat terpotong merupakan indikasi cacat output AI (`UI-SLOP-002`) yang membingungkan teknisi baru saat gagal login.
* **Komponen Terdampak:**
  - `views/auth/login.ejs`
* **Task F034 Terkait:** T068 (Login Page Refinement).
* **Risiko Regresi:** Nol. Perubahan copy statis.
* **Status Approval:** **APPROVED BY HUMAN APPROVAL GATE**

---

### DECISION-F034-004: Penerapan Adaptive Card Layout untuk Antrean Kerja pada Viewport Mobile (<576px)
* **Deskripsi Keputusan:** Mengadopsi tata letak kartu adaptif (*Adaptive Card Layout*) untuk antrean tiket pada layar sempit `<576px`, sementara layar tablet dan desktop ($\ge 576\text{px}$) tetap menggunakan tabel 13 kolom yang sudah ada.
* **Alasan / Justifikasi:** Tabel 13 kolom pada layar ponsel (<576px) menuntut horizontal scrolling yang melelahkan bagi teknisi lapangan untuk menjangkau kolom ke-13 (Tombol "Ambil Tugas" / "Detail"). Kartu adaptif menyajikan Ticket ID, Status, STO/Lokasi, Ringkasan, dan Primary Action secara langsung dan terjangkau ibu jari.
* **Komponen Terdampak:**
  - `views/partials/report-queue-table.ejs`
  - `public/css/app.css` (`@media (max-width: 575.98px)`)
* **Task F034 Terkait:** T070 (Work Queue Refinement) dan T078 (Responsive Refinement).
* **Risiko Regresi:** Rendah. Data tiket yang dikonsumsi identik; logika controller, filter query, pagination, dan endpoint AJAX tetap tidak berubah.
* **Status Approval:** **APPROVED BY HUMAN APPROVAL GATE**

---

### DECISION-F034-005: Pembatasan Skala Radius Sudut (Anti-Pill 999px)
* **Deskripsi Keputusan:** Menstandarkan skala radius sudut menjadi dua varian saja: `--app-radius: 0.5rem (8px)` untuk container kartu/modal dan `--app-radius-sm: 0.375rem (6px)` untuk tombol, input form, dan status badge. Menghapus radius gelembung 999px pada status badge.
* **Alasan / Justifikasi:** Radius bulat ekstrem 999px pada badge memberi kesan template kasual yang bertentangan dengan karakter sistem operasional enterprise Telkom yang tegas dan presisi.
* **Komponen Terdampak:**
  - `public/css/app.css`
* **Task F034 Terkait:** T066 (Design Tokens).
* **Risiko Regresi:** Nol. Penyesuaian visual token CSS murni.
* **Status Approval:** **APPROVED BY HUMAN APPROVAL GATE**

---

### DECISION-F034-006: Tata Kelola Anti-Slop sebagai Filter Kualitas Pasif
* **Deskripsi Keputusan:** Menetapkan repositori `anti-slop` murni sebagai filter penjamin mutu (penyaring komentar sampah, penghalang kode halusinasi/mock pura-pura, dan audit rasio kontras teks), bukan sebagai penentu arah desain visual. Arah visual murni bersumber dari dokumen `DESIGN.md`.
* **Alasan / Justifikasi:** Menjaga independensi desain enterprise Telkom dan memastikan seluruh batasan arsitektur non-negotiable (MVC, CommonJS, MySQL2, no-ORM, Bootstrap 5) tidak pernah dilanggar oleh generator otomatis.
* **Komponen Terdampak:**
  - Dokumen governance `.agents/rules/antislop.md` dan `AGENTS.md`.
* **Task F034 Terkait:** T064 (Anti-Slop Integration Review) dan T079 (Accessibility Audit).
* **Risiko Regresi:** Nol.
* **Status Approval:** **APPROVED BY HUMAN APPROVAL GATE**
