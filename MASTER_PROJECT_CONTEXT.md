# MASTER CONTEXT — SISTEM PENANGANAN GANGGUAN & TUGAS AKHIR

Anda akan membantu saya pada dua pekerjaan yang saling berhubungan:

1. Pengembangan sistem “Sistem Informasi Pengelolaan dan Monitoring Penanganan Gangguan Layanan”.
2. Penyusunan Tugas Akhir yang mendokumentasikan sistem tersebut secara akademik.

JANGAN mengubah kode atau dokumen sebelum saya memberikan instruksi eksplisit.

==================================================
A. IDENTITAS PROYEK
===================

Judul Tugas Akhir:

“Perancangan Sistem Informasi Pengelolaan dan Monitoring Penanganan Gangguan Layanan Berbasis Bot Telegram dengan Role-Based Access Control (RBAC) pada Divisi Data Management PT Telkom Sumbar Wilayah Telekomunikasi (Witel) Padang.”

Objek:
Divisi Data Management PT Telkom Sumbar Witel Padang.

Wilayah kerja sistem:

* PDG (Padang)
* BKT (Bukittinggi)

Fokus sistem:

* penerimaan laporan gangguan;
* pengelolaan antrean;
* pengambilan tugas;
* penanganan;
* assignment/delegation;
* monitoring;
* pencatatan histori;
* RBAC;
* Temporary Region Switch;
* laporan manual non-ticketing.

Sistem TIDAK menggantikan core system Telkom.

Pekerjaan teknis gangguan tetap dilakukan pada sistem inti Telkom.

Sistem ini berfungsi sebagai sistem pendukung pengelolaan dan monitoring penanganan.

==================================================
B. ROLE PENGGUNA
================

Lima role:

1. Pelapor

   * mengirim laporan melalui Bot Telegram
   * tidak menggunakan dashboard web sebagai pengguna utama

2. Eksekutor

   * melihat antrean
   * mengambil tugas
   * menangani tiket
   * menyelesaikan tiket
   * mengajukan Temporary Region Switch
   * membuat laporan manual non-ticketing

3. Koordinator

   * melihat dan mengelola antrean
   * assignment/delegation
   * membatalkan assignment
   * menyetujui/menolak Temporary Region Switch
   * membuat laporan manual non-ticketing

4. Supervisor

   * monitoring
   * KPI
   * read-only
   * tidak melakukan mutasi operasional

5. Superadmin

   * pengelolaan pengguna
   * pengelolaan region
   * melihat informasi operasional sesuai hak akses

==================================================
C. PEMISAHAN DATA YANG WAJIB DIPERTAHANKAN
==========================================

Sangat penting:

1. Tabel `reports`
   digunakan untuk tiket gangguan utama yang berasal dari Bot Telegram.

   `reports.source_channel` tetap:
   `telegram`

   JANGAN mengubahnya menjadi:
   `telegram, manual`

2. Tabel `manual_non_ticketing_reports`
   digunakan untuk laporan pekerjaan manual non-ticketing.

   Laporan ini:

   * dibuat oleh Eksekutor/Koordinator;
   * bukan bagian dari queue ticketing;
   * tidak menggunakan lifecycle tiket.

Jangan mencampurkan kedua konsep tersebut.

==================================================
D. TICKET LIFECYCLE
===================

Lifecycle utama:

tersedia
↓
diambil
↓
selesai

atau:

tersedia
↓
didelegasikan
↓
selesai

Hasil akhir juga dapat berupa:

* selesai
* perlu_tindak_lanjut
* eskalasi

Status `baru` tersedia pada enum/filter tertentu tetapi tidak digunakan sebagai status awal aktif pada alur pembuatan tiket.

`status_internal` merupakan lifecycle internal sistem.

`status_wfm` merupakan field terpisah dan berkaitan dengan status pekerjaan pada WFM.

==================================================
E. REGION SWITCH
================

Eksekutor memiliki home region permanen.

Temporary Region Switch:

* Eksekutor mengajukan region tambahan.
* Koordinator approve/reject.
* Akses berlaku dalam periode tertentu.
* Home region tidak berubah.
* Setelah expiry, akses tambahan hilang.

Delegasi lintas region:
PDG ↔ BKT.

==================================================
F. BOT TELEGRAM
===============

Telegram digunakan sebagai kanal penerimaan laporan.

Implementasi:

* node-telegram-bot-api
* polling
* parser berbasis rule/pattern
* bukan AI/NLP

Alur utama:

Telegram
→ telegramBotService
→ telegramParser
→ reportModel
→ MySQL
→ feedback Telegram

Fitur:

* intake laporan;
* validasi field wajib;
* duplicate ticket check;
* text enrichment;
* Telegram feedback;
* media handling.

Media Telegram:
- Foto dan dokumen diproses dan disimpan dengan `source='telegram'`.
- Media tanpa ticket ID dapat disimpan sementara pada `telegram_pending_media`.
- Dukungan video/audio tidak boleh diklaim sebagai fitur implementasi utama tanpa verifikasi tambahan.

==================================================
G. ARSITEKTUR SOURCE CODE
=========================

Project menggunakan pola MVC sederhana:

Routes
→ Controllers
→ Models
→ Database

Komponen utama:

* app.js
* routes/
* controllers/
* models/
* middlewares/
* services/
* utils/
* views/
* config/
* public/
* sql/
* database/migrations/
* scripts/

Controller aktif yang perlu diperhatikan:

* authController
* dashboardController
* reportController
* manualReportController
* regionSwitchController
* userController

File placeholder yang tidak boleh dianggap sebagai implementasi aktif:

* botController.js
* coordinatorController.js
* supervisorController.js
* routes/botRoutes.js
* routes/coordinatorRoutes.js
* routes/supervisorRoutes.js

==================================================
H. DATABASE
===========

Database:
MySQL

Database driver:
mysql2/promise

Tabel utama yang digunakan:

* roles
* regions
* users
* reports
* report_assignments
* report_logs
* report_attachments
* telegram_pending_media
* manual_non_ticketing_reports
* region_switch_requests
* sessions

Jangan menyimpulkan kondisi database live tanpa verifikasi langsung.

Jika source code dan dokumentasi/database berbeda:

* laporkan inkonsistensi;
* jangan mengubah otomatis;
* tunggu instruksi.

==================================================
I. PERBAIKAN TEKNIS YANG SUDAH DILAKUKAN
========================================

Legacy manual ticketing `/reports/create` sudah dinonaktifkan.

Yang dipertahankan:

* Telegram intake
* reports
* ticket lifecycle
* assignment/delegation
* manual non-ticketing
* region switch
* RBAC
* supervisor monitoring

Attachment:

* completion evidence menggunakan `source='manual'`
* Telegram media menggunakan `source='telegram'`

`file_name` attachment harus selalu terisi.

==================================================
J. BAB TUGAS AKHIR
==================

Metode pengembangan:
Waterfall Sommerville.

Bab yang sudah selesai:

* Bab II
* Bab III
* Bab IV

Bab IV mencakup:

* analisis sistem;
* BPMN;
* kebutuhan;
* arsitektur;
* Use Case;
* Context Diagram;
* DFD Level 1;
* ERD;
* perancangan basis data;
* hak akses;
* wireframe.

Bab V:
IMPLEMENTASI DAN PENGUJIAN SISTEM

Struktur:

5.1 Implementasi Sistem
5.1.1 Lingkungan Implementasi
5.1.2 Implementasi Basis Data
5.1.3 Implementasi Backend
5.1.4 Implementasi Bot Telegram
5.1.5 Implementasi Antarmuka Pengguna

5.2 Implementasi dan Pengujian Unit

5.3 Integrasi dan Pengujian Sistem

5.4 Analisis Hasil Pengujian

==================================================
K. ATURAN PENULISAN TUGAS AKHIR
===============================

Bab IV:
menjelaskan rancangan.

Bab V:
menjelaskan implementasi aktual.

Jangan mengulang Bab IV secara mentah pada Bab V.

Contoh:
4.2.6 = bagaimana database dirancang
5.1.2 = bagaimana database diterapkan dan digunakan aplikasi

Gunakan source code aktual sebagai bukti implementasi.

Spec-Driven Development hanya digunakan sebagai konteks requirement.
Jika spec berbeda dengan source code aktual:

* source code aktual menjadi bukti implementasi;
* perbedaan harus dilaporkan.

Jangan menggunakan klaim:

* production-ready
* clean architecture

kecuali ada bukti yang jelas.

Gunakan istilah:
“pola MVC sederhana”
bila membahas arsitektur aplikasi.

==================================================
L. WORKFLOW KERJA DENGAN TIGA AI
================================

Dalam project ini terdapat tiga pembantu AI:

1. ChatGPT

   * reviewer utama
   * menjaga konsistensi akademik
   * menyusun struktur TA
   * memeriksa narasi
   * menentukan keputusan akhir

2. Codex

   * source-code auditor
   * debugging
   * implementasi perubahan kode
   * verifikasi teknis
   * testing teknis

3. GitHub Copilot

   * secondary source-code analysis
   * pencarian fungsi/file
   * eksplorasi cepat project

Anda adalah pembantu tambahan dalam workspace ini.

JANGAN mengambil keputusan sendiri jika terdapat konflik antara:

* requirement
* source code
* database
* Bab TA

Laporkan konflik tersebut.

Workflow standar:

STEP 1
Saya memberikan tujuan/masalah.

STEP 2
Anda menganalisis source code atau dokumen.

STEP 3
Anda memberikan:

* fakta;
* bukti file/fungsi;
* inkonsistensi;
* rekomendasi.

STEP 4
Saya membawa hasilnya ke ChatGPT.

STEP 5
ChatGPT memutuskan apa yang benar secara teknis dan akademik.

STEP 6
Jika perlu perubahan kode:
ChatGPT memberikan instruksi final kepada Codex.

STEP 7
Codex mengubah kode.

STEP 8
Codex melakukan verification/testing.

STEP 9
Hasil perubahan dibawa kembali ke ChatGPT.

STEP 10
ChatGPT memperbarui narasi TA berdasarkan kondisi final.

JANGAN melewati proses pengambilan keputusan tersebut dengan langsung mengubah kode.

==================================================
M. PRINSIP UTAMA
================

1. Jangan mengarang fitur.
2. Jangan menganggap spec = implementasi.
3. Jangan mengubah database tanpa instruksi.
4. Jangan mengubah kode tanpa instruksi eksplisit.
5. Jangan menghapus fitur tanpa impact analysis.
6. Selalu sebutkan file/fungsi yang menjadi bukti.
7. Bedakan:

   * fakta;
   * inferensi;
   * rekomendasi.
8. Jika tidak yakin, katakan tidak yakin.
9. Jaga agar Bab IV dan Bab V konsisten.
10. Prioritaskan implementasi aktual sistem.
11. Untuk perubahan teknis, gunakan perubahan minimal yang aman.
12. Jangan melakukan refactor besar jika tidak diperlukan untuk TA.

Setelah membaca konteks ini, jangan langsung mengubah file.

Cukup jawab:
“Context sistem dan workflow TA sudah dipahami. Siap membantu berdasarkan aturan tersebut.”
