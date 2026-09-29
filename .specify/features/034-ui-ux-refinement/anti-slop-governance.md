# Anti-Slop Integration Review & Governance Framework — F034

> **Status:** APPROVED GOVERNANCE (T064)
> **Klasifikasi:** Agent Workspace Quality Filter & Subordinate Governance Rule
> **Ruang Lingkup:** Project-Scoped (Hanya berlaku di dalam workspace `sistem-penanganan-gangguan`)
> **Otoritas Desain & Bisnis:** `DESIGN.md` & `Human Approval Gate` (Bukan Anti-Slop)

---

## 1. Status Integrasi Anti-Slop (Integration Status)
* **Tipe Komponen:** Agent Skills & Prompt Instructions (`.agents/skills/*`, `.agents/rules/*`).
* **Dependensi Runtime:** **NOL (0%)**. Repositori `anti-slop` tidak bertindak sebagai library JavaScript/Node.js, tidak di-`require()` atau di-`import` pada kode aplikasi, dan tidak tercatat pada `package.json` / `package-lock.json`.
* **Cakupan Wilayah Kerja:** *Project-Scoped* murni di dalam repositori workspace. Tidak mencemari konfigurasi sistem global pengguna.

---

## 2. Hirarki Tata Kelola (Governance Hierarchy)

Anti-slop ditempatkan secara tegas sebagai **lapis penyaring kualitas pasif (*subordinate quality filter*)**. Hirarki pengambilan keputusan berjalan dari atas ke bawah:

```text
┌────────────────────────────────────────────────────────┐
│             ATURAN PROYEK & ARSITEKTUR                 │
│      (AGENTS.md, docs/WORKFLOW_TA.md, Constitution)     │
│   • MVC, CommonJS, MySQL2, No-ORM, Bootstrap 5         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              HUMAN APPROVAL GATE (USER)                │
│   • Pemilik sah TA & pemegang keputusan final          │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 PANDUAN DESAIN PROYEK                  │
│       (.specify/.../DESIGN.md & spec.md)               │
│   • Identitas Telkom Red, token warna, tipografi       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│            TASK-SPECIFIC AUTHORIZATION                 │
│       (.specify/.../tasks.md & checklist.md)           │
│   • Otorisasi eksplisit task yang sedang aktif         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│           ANTI-SLOP QUALITY FILTER LAYER               │
│       (.agents/skills/* & .agents/rules/*)             │
│   • Mencegah pola AI slop, kode tiruan, copy klise     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             IMPLEMENTASI KODE & PENGUJIAN              │
│       (views/, public/css/app.css, unit tests)         │
└────────────────────────────────────────────────────────┘
```

> **PRINSIP HUKUM TERTINGGI:**
> Anti-slop **DILARANG KERAS** membatalkan, melangkahi, atau mengubah keputusan bisnis, model data, relasi relasional F033, routing, middleware, ataupun panduan visual `DESIGN.md`.

---

## 3. Penggunaan yang Diizinkan (Allowed Usage)
1. **Penyaring Komentar Kode (`antislop-code`):**
   - Menghapus komentar basa-basi (*"// initialize variable"*, *"// workflow step 1"*), banner dekoratif, atau emoji AI pada file JavaScript.
   - Tetap mempertahankan komentar yang menjelaskan aturan bisnis unik, asumsi algoritma, atau batasan keamanan.
2. **Penyaring Bahasa & Copywriting (`antislop-copywriting`):**
   - Menghilangkan kata klise pemasaran AI (*"unlock"*, *"seamless"*, *"empower"*, *"elevate"*, *"game-changer"*).
   - Memastikan teks berbahasa Indonesia operasional formal yang lugas dan sesuai terminologi Telkom.
3. **Penyaring Desain UI (`antislop-ui`):**
   - Mencegah timbulnya gradien ungu/violet generik, radius pil 999px berlebihan, dan kartu melayang tanpa fungsi.
   - Mengarahkan implementasi agar patuh pada token yang telah ditetapkan di `DESIGN.md`.
4. **Audit Aksesibilitas (`antislop-human`):**
   - Menguji rasio kontras teks (minimal 4.5:1) menggunakan script `contrast-check.py` atau formula WCAG 2.1 AA.
   - Memastikan elemen interaktif memiliki fokus keyboard yang terlihat jelas.
5. **Audit Tata Letak Mobile (`antislop-layoutmobile`):**
   - Memastikan antarmuka tidak mengalami patahan layout (*horizontal overflow*) dan mendukung Adaptive Card Layout pada resolusi sempit `<576px`.

---

## 4. Perilaku yang Dilarang Keras (Prohibited Usage)
1. **DILARANG Mengubah Arsitektur Backend:**
   - Tidak boleh mengusulkan atau menerapkan ORM (Prisma/Sequelize/TypeORM).
   - Tidak boleh mengubah sistem modul CommonJS menjadi ES Modules.
   - Tidak boleh memindahkan kueri SQL dari direktori `models/`.
2. **DILARANG Mengubah Kontrak Database F033:**
   - Tidak boleh memunculkan kembali kolom usang `reports.id`, `current_region_id`, `current_assigned_user_id`, dll.
   - Tidak boleh mengubah foreign key yang sudah mengikat ke `reports.ticket_id`.
   - Tidak boleh mengubah invariant: `tersedia` (0 active assignment) dan non-`tersedia` (1 active assignment).
3. **DILARANG Menambahkan Framework Frontend Eksternal:**
   - Tidak boleh mengintroduksi Tailwind CSS, React, Vue, Svelte, Shadcn, atau runtime UI framework lain. Sistem tetap Bootstrap 5 murni + `app.css`.
4. **DILARANG Redesign Otomatis Tanpa Task Eksplisit:**
   - Agen dilarang melakukan *"auto-beautification"* atau refactoring massal secara diam-diam di luar task yang sedang dikerjakan.
5. **DILARANG Menciptakan Kebutuhan Bisnis Fiktif:**
   - Agen dilarang menambah metrik statistik palsu, kartu statistik fiktif, atau field form fiktif hanya untuk mengisi ruang kosong.

---

## 5. Hubungan dengan DESIGN.md & SDD
* **Sumber Kebenaran Visual:** `DESIGN.md` mendefinisikan token warna Telkom Red (`#e11d2a`), warna status oranye (`#ea580c`), tipografi, radius sudut terstandarisasi, dan hierarki antrean.
* **Fungsi Anti-Slop:** Memastikan kode CSS dan HTML yang ditulis untuk merealisasikan `DESIGN.md` bebas dari sisa kebiasaan buruk AI. Jika terjadi pertentangan antara aturan umum anti-slop dengan `DESIGN.md`, maka **`DESIGN.md` MENANG MUTLAK**.
* **Kepatuhan SDD:** Setiap perubahan UI hanya dieksekusi berdasarkan urutan task resmi pada `tasks.md` (mulai dari T066 design tokens, T067 shared layout, T068 login, hingga T084 release checkpoint).

---

## 6. Prosedur Pencopotan / Rollback Anti-Slop (Removal Procedure)
Apabila di masa mendatang modul anti-slop ingin dinonaktifkan atau dihapus seluruhnya dari proyek, langkahnya bersifat non-destruktif dan instan:
1. Hapus direktori `.agents/skills/` dan `.agents/rules/`.
2. Hapus blok `<!-- antislop:start --> ... <!-- antislop:end -->` pada akhir berkas `AGENTS.md`.
3. Aplikasi web tetap berjalan 100% normal tanpa gangguan apa pun karena tidak ada ikatan dependensi kode runtime aplikasi terhadap anti-slop.

---

## 7. Batasan Penggunaan pada Task-Task Mendatang (T065 – T084)
* Pada task implementasi visual mendatang (T066 s.d. T079), filter anti-slop akan aktif secara otomatis pada proses penulisan kode di IDE untuk memastikan output memenuhi kriteria penerimaan.
* Setiap penyelesaian batch wajib melewati verifikasi regresi (`git diff --check`, pengujian unit invariant F033, dan pemeriksaan konsol browser).
