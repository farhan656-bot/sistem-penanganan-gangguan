# SOP & Triad Collaboration Workflow — Proyek Tugas Akhir (TA)

Dokumen ini mendefinisikan model kolaborasi segitiga (*Triad Collaboration Model*) dan prosedur operasi standar (*Standard Operating Procedure / SOP*) dalam pengerjaan Tugas Akhir:

> **Judul TA:** *Perancangan Sistem Informasi Pengelolaan dan Monitoring Penanganan Gangguan Layanan Berbasis Bot Telegram dengan Role-Based Access Control (RBAC) pada Divisi Data Management PT Telkom Sumbar Wilayah Telekomunikasi (Witel) Padang*

---

## 1. Triad Collaboration Model (Model Kolaborasi Segitiga)

Proyek TA ini dikerjakan melalui kolaborasi terstruktur antara tiga entitas dengan batas tanggung jawab yang tegas:

```text
┌────────────────────────────────────────────────────────┐
│                      ANDA                              │
│              (Human Approval Gate)                     │
│      • Pemilik sah & penentu keputusan akhir           │
│      • Memberikan izin/approval sebelum eksekusi       │
│      • Menjembatani orkestrator dan implementer        │
└──────────────┬──────────────────────────▲──────────────┘
               │                          │
        Instruksi Tugas            Laporan Eksekusi
        hasil orkestrasi           & Bukti Testing
               │                          │
┌──────────────▼──────────┐      ┌────────┴──────────────┐
│        CHATGPT          │      │      ANTIGRAVITY      │
│  (Orchestrator/Auditor) │      │ (Implementer & Tester)│
│ • Merumuskan spec & plan│      │ • Eksekusi kode di IDE│
│ • Audit arsitektur TA   │      │ • Refactoring aman    │
│ • Penyelarasan naskah   │      │ • Menjalankan test    │
│   proposal Bab 1-5      │      │ • Filter anti-slop    │
└─────────────────────────┘      └───────────────────────┘
```

### Rincian Peran:

### A. Anda (Pemilik Proyek TA) — *Human Approval Gate*
1. **Otoritas Tertinggi**: Pemegang hak keputusan final atas setiap perubahan kode, skema basis data, maupun isi naskah laporan TA.
2. **Gerbang Persetujuan (*Approval Gate*)**: Memvalidasi setiap rencana kerja yang dirumuskan oleh ChatGPT sebelum dieksekusi oleh Antigravity.
3. **Penyambung Alur**: Membawa rencana tugas dari ChatGPT ke Antigravity, dan membawa laporan hasil eksekusi Antigravity kembali ke ChatGPT untuk diaudit.

### B. ChatGPT — *Orchestrator / Reviewer / Auditor*
1. **Orkestrasi Sistem**: Merancang arah teknis, menyusun *Spec Kit* (`spec.md`, `plan.md`, `tasks.md`, `checklist.md`), dan merumuskan arsitektur sistem.
2. **Reviewer & Auditor**: Mengaudit kode dan perubahan yang dilaporkan Antigravity terhadap standar teoritis, batasan bisnis Telkom Witel Padang, serta konsistensi proposal TA.
3. **Penyelarasan Naskah Akademik**: Menjaga agar implementasi sistem sinkron dengan penulisan Bab 1 hingga Bab 5 naskah Tugas Akhir.

### C. Antigravity — *Implementer / Refactorer + Eksekutor Test*
1. **Implementasi Presisi**: Menulis dan merekayasa kode di dalam IDE secara presisi sesuai instruksi yang disetujui.
2. **Prinsip *Minimal Safe Change***: Hanya memodifikasi berkas yang relevan, menjaga fitur yang sudah stabil (F001–F008, F032, F033), dan tidak melakukan perombakan arsitektur di luar mandat.
3. **Eksekutor Pengujian**: Menjalankan pengujian otomatis (*unit testing*, *regression testing*, dan *invariant check*) secara berkala di terminal IDE.
4. **Penerapan *Anti-Slop***: Menerapkan filter kualitas pada kode (tanpa komentar sampah/mock tiruan), tampilan UI (Bootstrap murni tanpa template klise AI), dan teks teknis.
5. **Pelaporan Faktual**: Menyajikan laporan transparan mengenai berkas yang diubah, ringkasan teknis, dan bukti eksekusi pengujian untuk diaudit kembali.

---

## 2. Standard Operating Procedure (SOP) Tahapan Kerja

Setiap penambahan fitur baru atau perbaikan *bug* wajib melalui 4 fase berikut:

### Fase 1: Perencanaan & Penyusunan Spesifikasi (ChatGPT & Anda)
1. ChatGPT menganalisis kebutuhan dan menyusun spesifikasi (konsep, flow, kueri database, atau task Spec Kit).
2. Anda meninjau rancangan tersebut.
3. Anda memberikan persetujuan (*approval*) untuk melanjutkan ke tahap eksekusi.

### Fase 2: Penerusan Instruksi ke IDE (Anda ke Antigravity)
1. Anda menyalin/meneruskan instruksi tugas yang sudah disetujui ke dalam chat Antigravity di IDE.
2. Antigravity mengonfirmasi pemahaman lingkup tugas dan batasan yang berlaku.

### Fase 3: Eksekusi Kode, Filter Anti-Slop, dan Pengujian (Antigravity)
1. Antigravity membaca berkas-berkas terkait dan aturan proyek (`AGENTS.md`, `.specify/`, dll.).
2. Antigravity melakukan perubahan kode secara aman (*minimal safe change*).
3. Modul *anti-slop* aktif menyaring agar kode tetap bersih dan UI tetap profesional sesuai standar Telkom.
4. Antigravity menjalankan pengujian unit/regresi menggunakan test runner (`node --test ...` atau skrip verifikasi DB).

### Fase 4: Pelaporan & Audit Ulang (Antigravity ke Anda, lalu ke ChatGPT)
1. Antigravity memberikan laporan terstruktur:
   * Daftar berkas yang diubah.
   * Ringkasan perubahan logika.
   * Bukti status eksekusi pengujian (*test pass/fail*).
2. Anda membawa laporan tersebut kembali ke ChatGPT.
3. ChatGPT melakukan audit akhir terhadap kesesuaian implementasi dengan naskah TA.
4. Jika audit lulus, pekerjaan dinyatakan **DONE**; jika ada temuan, ChatGPT merumuskan instruksi perbaikan spesifik untuk diulang ke Fase 2.

---

## 3. Aturan Arsitektur & Batasan Non-Negosiasi

Seluruh entitas (khususnya Antigravity sebagai pelaksana) wajib tunduk pada batasan teknis berikut:
* **Stack Inti**: Node.js, Express.js, MySQL (XAMPP / `mysql2/promise`), EJS, Bootstrap 5, express-session.
* **Format Modul**: CommonJS murni (`require` dan `module.exports`). Tidak menggunakan ES Modules.
* **Arsitektur**: MVC murni. Seluruh kueri SQL wajib berada di dalam direktori `models/`.
* **Tanpa ORM**: Tidak menggunakan Prisma, Sequelize, atau ORM lain.
* **Tanpa Framework Frontend Tambahan**: Tidak menggunakan React, Vue, Tailwind CSS, dll.
* **Integritas Bisnis**:
  * Fitur F001 s.d. F008 yang sudah stabil tidak boleh dirombak ulang tanpa instruksi khusus.
  * Role `supervisor` bersifat *read-only*.
  * Bot Telegram tidak menggunakan AI/NLP (menggunakan regex/pattern parsing deterministik).
  * Sistem ini adalah *internal operational system*, bukan pengganti sistem inti Telkom, dan tidak memiliki integrasi API langsung ke core system Telkom.
