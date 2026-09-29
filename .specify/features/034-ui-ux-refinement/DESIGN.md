# DESIGN.md — F034 Design Direction & Visual Language

> **Status:** APPROVED DESIGN DIRECTION (T063)
> **Otoritas Desain:** Ditentukan oleh kebutuhan operasional PT Telkom Sumbar Witel Padang dan konteks Tugas Akhir.
> **Peran Anti-Slop:** Quality Filter pasif (pengendali mutu output), bukan penentu arah gaya visual.
> **Prinsip Utama:**
> `CONTENT > DECORATION` • `ACTION CLARITY > VISUAL EFFECT` • `CONSISTENCY > NOVELTY` • `OPERATIONAL SPEED > MARKETING STYLE`

---

## 1. Product Identity & Context
- **Nama Produk:** Sistem Informasi Pengelolaan dan Monitoring Penanganan Gangguan Layanan (Sistem Tiket Gangguan)
- **Instansi:** PT Telkom Indonesia (Persero) Tbk — Wilayah Telekomunikasi (Witel) Sumatera Barat, Divisi Data Management, Padang.
- **Karakter Visual:** Enterprise Operational Tool, Cepat, Tegas, Presisi, Andal, Bebas Distraksi.
- **Konteks Operasional:** Digunakan setiap hari oleh teknisi lapangan (Eksekutor), Koordinator operasional, Supervisor/Manajer, dan Superadmin di Witel Padang (PDG) dan Bukittinggi (BKT). Sistem memediasi antrean gangguan layanan IndiHome/Telkom yang masuk melalui Bot Telegram. Pemindaian cepat (*fast scanning*), kejelasan status tiket, dan kemudahan eksekusi penugasan adalah prioritas mutlak.

---

## 2. Design System Tokens & Rules

### A. Color System
Skema warna mengadopsi identitas korporat Telkom secara proporsional sebagai aksen aksi fungsional di atas permukaan netral yang nyaman di mata teknisi:

* **Primary Accent (Telkom Red):**
  - `--app-primary`: `#e11d2a` (Aksen aksi utama, border fokus formulir, menu navigasi aktif)
  - `--app-primary-hover`: `#c81824`
  - `--app-primary-active`: `#ad1520`
  - `--app-primary-subtle`: `rgba(225, 29, 42, 0.08)` (Highlight baris terpilih atau badge aktif)
* **Surfaces & Backgrounds:**
  - `--app-bg`: `#f6f7f9` (Abu-abu netral sangat terang peredam silau monitor)
  - `--app-surface`: `#ffffff` (Permukaan kartu, modal, dan tabel)
  - `--app-surface-subtle`: `rgba(0, 0, 0, 0.02)` (Header tabel, stripe selang-seling halus)
* **Borders & Dividers:**
  - `--app-border`: `rgba(0, 0, 0, 0.10)` (Batas pemisah terstruktur dan tipis)
  - `--app-border-focus`: `rgba(225, 29, 42, 0.45)` (Batas input saat aktif)
* **Typography Colors:**
  - `--app-text-primary`: `#212529` (Kontras 13.5:1 terhadap background putih, terbaca sangat tajam)
  - `--app-text-secondary`: `#495057` (Kontras 7.0:1 terhadap background putih, untuk label data sekunder)
  - `--app-text-muted`: `#6c757d` (Kontras 4.6:1 terhadap background putih, teks pelengkap minimal WCAG AA)
* **Functional Semantics (Status Tiket & Sistem):**
  - `tersedia`: `--app-status-available`: `#0d6efd` (Primary Blue) — Tiket baru siap diambil.
  - `diambil`: `--app-status-in-progress`: `#d97706` (Amber/Kuning Tua) — Sedang dikerjakan teknisi.
  - `didelegasikan`: `--app-status-delegated`: `#0284c7` (Sky/Teal Blue) — Delegasi aktif antar-wilayah.
  - `selesai`: `--app-status-completed`: `#16a34a` (Success Green) — Pekerjaan tuntas dengan bukti.
  - `perlu_tindak_lanjut`: `--app-status-follow-up`: `#ea580c` (Orange Alert Tegas — **Approved Decision A**) — Membutuhkan penanganan tambahan / revisi bukti, berbeda jelas dari warna kuning `diambil`.
  - `eskalasi`: `--app-status-escalated`: `#dc2626` (Danger Red) — Gangguan kritis / eskalasi teknis.
  - `netral / nonaktif`: `--app-status-neutral`: `#6c757d` (Secondary Gray) — Akun nonaktif / expired.

> **PENTING (Status Clarity):** Status tidak boleh dibedakan hanya berdasarkan warna! Setiap badge wajib menyertakan **label teks Bahasa Indonesia yang baku** dan eksplisit.

### B. Typography Hierarchy
Menggunakan System UI Font Stack (`system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`) agar peramban merender teks dengan latensi nol (*zero font download delay*):

| Hirarki Elemen | Ukuran (rem / px) | Font Weight | Line Height | Keterangan & Penggunaan |
|---|---|---|---|---|
| **H1 / Page Title** | `1.25rem` (20px) | `700` (Bold) | `1.2` | Judul halaman operasional pada page-header |
| **H2 / Section Title** | `1.05rem` (16.8px) | `600` (Semi-bold) | `1.3` | Judul kartu atau segmen dashboard |
| **H3 / Card Metric Number**| `1.5rem` (24px) | `700` (Bold) | `1.1` | Angka statistik metrik KPI dashboard |
| **Body Regular** | `0.875rem` (14px) | `400` (Regular) | `1.45` | Teks isi standar, sel data tabel, isi modal |
| **Body Semi-bold / Field Label** | `0.875rem` (14px) | `600` (Semi-bold) | `1.3` | Label input form, header kolom tabel |
| **Helper / Caption Text** | `0.8125rem` (13px) | `400` (Regular) | `1.3` | Petunjuk pengisian form, subtitle halaman |
| **Micro / Status Badge Text** | `0.75rem` (12px) | `600` (Semi-bold) | `1.0` | Label teks di dalam badge status |
| **Monospace Technical Data** | `0.8125rem` (13px) | `500` (Medium) | `1.2` | Ticket ID, Order ID, STO (`font-monospace`) |

### C. Spacing Scale
Standarisasi skala kelipatan 4px berbasis rem:
- `0.25rem` (4px): Gap mikro antar-icon dan label.
- `0.5rem` (8px): Padding dalam tombol kecil, margin antar-tombol inline.
- `0.75rem` (12px): Padding dalam input formulir, padding vertikal sel tabel.
- `1.0rem` (16px): Padding dalam kartu metrik standar.
- `1.25rem` (20px): Padding container konten mobile.
- `1.5rem` (24px): Padding container konten desktop.

### D. Corner Radius Scale
Menghindari sudut gelembung bulat berlebih (DILARANG pill 999px di seluruh elemen):
- `--app-radius`: `0.5rem` (8px) — Untuk container kartu utama, dialog modal, dan kotak upload bukti.
- `--app-radius-sm`: `0.375rem` (6px) — Untuk tombol, kontrol input form, select, dan badge status.

### E. Elevations & Shadows Scale
- `--app-shadow-none`: `none`
- `--app-shadow-card`: `0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)` (Sangat halus, menyatu dengan border tipis).
- `--app-shadow-modal`: `0 10px 25px rgba(0, 0, 0, 0.10)` (Elevasi fokus pada pop-up dialog).
- Dilarang menggunakan bayangan tebal melayang (*floating drop-shadow*) yang mendistraksi pemindaian mata teknisi.

---

## 3. Component Design Rules

### A. Buttons & Actions
* **Primary Button (`.btn-primary`):**
  - Background Telkom Red (`#e11d2a`), teks putih. Digunakan HANYA untuk aksi primer tunggal (misal: "Ambil Tugas", "Selesaikan", "Terapkan Filter").
* **Secondary / Action Navigation Button (`.btn-outline-secondary`):**
  - Border abu-abu tipis, teks abu-abu gelap. Digunakan untuk navigasi pendukung (misal: "Detail", "Kembali", "Reset").
* **Warning / Follow-up Action (`.btn-warning` / `.btn-outline-warning`):**
  - Digunakan untuk penandaan eskalasi atau konfirmasi tindak lanjut.
* **Danger Button (`.btn-outline-danger`):**
  - Digunakan untuk aksi pembatalan penugasan atau logout. Wajib menyertakan dialog konfirmasi.
* **Button Sizes:**
  - Standard table action: `.btn-sm` (padding `0.25rem 0.65rem`, font `0.8125rem`). Target sentuh di mobile diperbesar minimal `38px` tinggi total.

### B. Forms & Inputs
* Setiap kontrol form wajib memiliki `<label class="form-label fw-semibold">`.
* Tanda wajib diisi menggunakan `<span class="text-danger fw-bold ms-1">*</span>`.
* Status fokus: Border berubah menjadi `rgba(225, 29, 42, 0.45)` dengan box-shadow halus `0 0 0 0.2rem rgba(225, 29, 42, 0.12)`.
* Teks bantuan (*helper text*) menggunakan kelas `.form-text text-secondary` berukuran `0.8125rem` dengan kontras terjamin (bukan teks abu-abu pudar).

### C. Tables & Work Queues (Desktop/Tablet)
* Header tabel (`thead th`): Background `rgba(0, 0, 0, 0.02)`, warna font `#343a40`, font-size `0.8125rem`, border-bottom `1px solid var(--app-border)`.
* Baris tabel (`tbody tr`): Efek hover halus `rgba(0, 0, 0, 0.02)`.
* Kolom Aksi (`.app-table-actions`): Berada di kolom paling kanan dengan lebar terkunci, tombol aksi primer diletakkan paling kanan agar konsisten dijangkau.

### D. Cards
* **Kapan Card Digunakan:** Mengelompokkan satu kesatuan tugas operasional mandiri (misal: tabel antrean kerja, ringkasan metrik statistik terpisah, form input terisolasi).
* **Kapan Card DILARANG:** Dilarang membuat kartu di dalam kartu (*nested cards*) tanpa tujuan fungsional, dilarang membungkus setiap field form ke dalam kartu mini.

### E. Modals
* Menggunakan header bertingkat: Judul Tiket di kiri atas, badge status di kanan.
* Tab tematik rapi: Overview Data, Bukti Penyelesaian, Media Bot Telegram, Histori Penanganan.
* Tombol aksi tutup dialog diletakkan jelas di footer modal.

### F. Brand Mark & Login (Approved Decision B)
* Pada [views/auth/login.ejs](file:///c:/Users/VICTUS/sistem-penanganan-gangguan/views/auth/login.ejs), kotak inisial generik `TM` resmi **DIHILANGKAN**.
* Digantikan oleh komponen logo resmi Telkom:
  ```html
  <div class="app-brand-login mb-3 text-center">
    <img src="/images/telkom-logo.png" alt="PT Telkom Indonesia" class="app-brand-logo-login">
  </div>
  ```
* Seluruh styling diatur melalui kelas CSS pada `app.css` tanpa inline style.

---

## 4. Work Queue Priority & Mobile Adaptive Card Layout

### A. Hierarki Informasi Antrean Kerja (Queue Priority)
Setiap tiket dalam antrean memiliki hierarki pembacaan:
1. **Ticket ID** (Identitas primer pelacakan, monospace tebal).
2. **Status Tiket** (Badge warna eksplisit dengan label teks jelas).
3. **Lokasi & STO** (STO, Cluster, Branch, Wilayah `PDG`/`BKT`).
4. **Ringkasan Gangguan** (Deskripsi keluhan teknis dari pelapor).
5. **Aksi Primer** (Tombol "Ambil Tugas" bagi tiket tersedia, atau "Kerjakan" bagi tiket aktif).
6. **Aksi Sekunder** (Tombol "Detail" untuk membuka rincian modal).

### B. Mobile Adaptive Card Layout (<576px Viewport — Approved Decision C)
Pada resolusi ponsel sempit (<576px), antrean tiket beralih dari format tabel lebar 13 kolom menjadi **Adaptive Card Layout**:
* **Struktur Kartu Tiket Mobile:**
  ```text
  ┌────────────────────────────────────────────────────────┐
  │ [Ticket ID: IN12345678]             [Status: TERSEDIA] │
  ├────────────────────────────────────────────────────────┤
  │ Lokasi  : STO KBL - Padang (PDG)                       │
  │ Keluhan : Internet Los Merah, Modem Mati Total         │
  │ Masuk   : 10 menit lalu (28 Sep, 10:15 WIB)            │
  ├────────────────────────────────────────────────────────┤
  │ [ Tombol Detail ]                 [ TOMBOL AMBIL TUGAS ]│
  └────────────────────────────────────────────────────────┘
  ```
* **Keuntungan Operasional:**
  - Teknisi di lapangan tidak perlu menggeser horizontal (*no horizontal scroll exhaustion*).
  - Tombol aksi primer ("Ambil Tugas") besar dan mudah ditekan ibu jari (*tap-friendly*).
  - Tampilan desktop/tablet tetap menggunakan tabel 13 kolom lengkap tanpa regresi.

---

## 5. Role-Based UX Differentiation

Sistem menghindari keseragaman artifisial. Setiap dashboard dioptimalkan untuk karakter operasional perannya:

### A. Pegawai Eksekutor (Fokus: Kecepatan Klaim & Pelaporan Tuntas)
- Dashboard memprioritaskan: **Tiket Saya yang Sedang Dikerjakan** di posisi paling atas.
- Tombol aksi cepat: "Ambil Tugas" langsung dari antrean wilayahnya; form penyelesaian menyediakan area paste foto bukti langsung dari clipboard.

### B. Koordinator (Fokus: Monitoring Distribusi & Delegasi Lintas Wilayah)
- Dashboard memprioritaskan: **Visibilitas Beban Kerja Teknisi** dan **Antrean Tiket Macet**.
- Kontrol aksi: Tombol delegasi lintas wilayah PDG-BKT memiliki pembeda visual dengan indikator "Delegasi Aktif"; tabel persetujuan temporary region switch mudah diakses.

### C. Supervisor / Manajer (Fokus: Analisis KPI Read-Only)
- Dashboard memprioritaskan: **Kartu Ringkasan Metrik SLA** (Response Time, Resolution Time) dan **Grafik Distribusi Gangguan**.
- Karakteristik: Read-only murni, kontrol form hanya berupa filter tanggal dan district; tidak ada tombol mutasi transaksional.

### D. Superadmin (Fokus: Keamanan Akun & Tata Kelola Pengguna)
- Dashboard memprioritaskan: **Status Keaktifan Akun** (Aktif vs Nonaktif) dan **Total User per Role/District**.
- Formulir manajemen user menyediakan instruksi keamanan dan dropdown wilayah yang terpetakan jelas.

---

## 6. Accessibility & Responsive Standards

### A. Aksesibilitas (Target: WCAG 2.1 AA Pratikum)
- Rasio kontras teks minimal 4.5:1 untuk teks normal dan 3.0:1 untuk teks tebal/besar.
- Status fokus keyboard terlihat tegas (`:focus-visible`) dengan outline/ring Telkom Red berjarak 2px.
- Target sentuh tombol pada perangkat mobile minimal `38px` – `44px` tinggi total.
- Label teks status eksplisit wajib menyertai setiap badge warna.

### B. Responsive Breakpoints
- `< 576px` (Mobile): Adaptive Card Layout untuk antrean kerja, sidebar diciutkan, tombol aksi full-width pada modal.
- `576px – 767px` (Tablet Kecil): Tabel antrean mendukung horizontal scroll dengan sticky action column, kartu metrik grid 2 kolom.
- `768px – 1199px` (Tablet Lebar / Laptop Ringan): Layout standar, sidebar sticky 264px, tabel kolom lengkap.
- `≥ 1200px` (Desktop Operasional): Lebar penuh maksimal tanpa padding berlebih, visualisasi grafik supervisor sejajar.

---

## 7. Copywriting Guidelines (Anti-Slop Standard)

Seluruh teks antarmuka menggunakan **Bahasa Indonesia formal operasional Telkom**.

| Hindari (Gaya AI Slop / Marketing Cliché) | Gunakan (Standar Operasional Formal Telkom) |
|---|---|
| *"Kelola pekerjaan Anda secara seamless dan empower performa tim"* | *"Daftar Antrean Kerja Penanganan Gangguan"* |
| *"Unlock powerful ticket insights"* | *"Ringkasan Metrik Kinerja Operasional"* |
| *"Tingkatkan kepuasan pelanggan generasi baru"* | *"Selesaikan Laporan Gangguan"* |
| *"Oops! Terjadi kesalahan misterius"* | *"Gagal menyimpan data: [Alasan Spesifik]"* |
| *"Jika mengalami kendala login, super admin"* (Copy terpotong) | *"Jika mengalami kendala login, hubungi Superadmin Divisi Data Management."* |

---

## 8. TA Documentation Alignment

Perubahan desain visual pada F034 ini diselaraskan secara metodologis dengan dokumen naskah Tugas Akhir:

* **Bab II — Tinjauan Pustaka (Kerangka Kerja UI/UX):**
  - Menguraikan penerapan kerangka kerja *The Elements of User Experience* (Jesse James Garrett): bidang *Surface* (desain visual Telkom), *Skeleton* (tata letak kartu & tabel), *Structure* (alur klaim & delegasi), *Scope* (spesifikasi fungsional RBAC), dan *Strategy* (kebutuhan operasional Witel Padang).
* **Bab III — Analisis dan Perancangan Antarmuka:**
  - Mockup wireframe antarmuka diperbarui mencerminkan tata letak sidebar sticky, perbaikan logo Telkom di login, dan Adaptive Card antrean mobile.
* **Bab IV — Hasil dan Pembahasan Implementasi:**
  - Tangkapan layar antarmuka diperbarui pada modul Login, Antrean Kerja, Modal Bukti, dan Dashboard per Peran dengan data uji yang telah dinormalisasi.
* **Bab V — Pengujian dan Evaluasi:**
  - Menyiapkan instrumen evaluasi kegunaan sistem (*Usability Testing*) berbasis skenario tugas riil untuk Eksekutor, Koordinator, dan Supervisor.

---

## 9. Status Open Design Questions
Seluruh 3 pertanyaan desain dari T061 telah **RESOLVED / CLOSED** melalui *Human Approval Gate*:
1. `perlu_tindak_lanjut` badge color $\rightarrow$ **CLOSED: Disetujui `#ea580c` (Oranye Tua).**
2. Login brand mark $\rightarrow$ **CLOSED: Disetujui menggunakan `telkom-logo.png`.**
3. Mobile ticket queue $\rightarrow$ **CLOSED: Disetujui menggunakan Adaptive Card Layout (<576px).**

Tidak ada pertanyaan desain terbuka yang tersisa pada T063.
