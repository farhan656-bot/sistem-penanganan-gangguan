# PROJECT DECISIONS

Dokumen ini berisi keputusan final yang telah ditetapkan dalam pengembangan Sistem Informasi Pengelolaan dan Monitoring Penanganan Gangguan Layanan serta penyusunan Tugas Akhir.

Keputusan dalam dokumen ini tidak boleh diubah secara sepihak oleh AI. Jika source code, database, specification, atau rekomendasi teknis bertentangan dengan keputusan di dokumen ini, AI wajib melaporkan konflik terlebih dahulu dan menunggu instruksi.

---

## D-001 — Fungsi Tabel `reports`

Status: FINAL

Tabel `reports` digunakan untuk menyimpan tiket gangguan utama yang berasal dari Bot Telegram.

Nilai:

```text
reports.source_channel = 'telegram'
```

Jangan menambahkan `manual` ke enum `reports.source_channel`.

Alasan:

* Tiket utama berasal dari Bot Telegram.
* Laporan manual non-ticketing memiliki tabel terpisah.
* Struktur database live telah diverifikasi.

---

## D-002 — Laporan Manual Non-Ticketing

Status: FINAL

Laporan manual non-ticketing disimpan pada:

```text
manual_non_ticketing_reports
```

Fungsi:

* mencatat pekerjaan atau aktivitas operasional yang tidak menjadi tiket gangguan;
* tidak masuk ke antrean ticketing;
* tidak menggunakan lifecycle tiket pada `reports`.

Hak akses:

* Eksekutor → dapat membuat dan melihat;
* Koordinator → dapat membuat dan melihat;
* Superadmin → dapat melihat;
* Supervisor → tidak menggunakan modul ini.

---

## D-003 — Legacy Manual Ticketing

Status: FINAL

Fitur manual ticketing pada:

```text
/reports/create
```

telah dinonaktifkan.

Alasan:

* tidak diperlukan dalam alur final sistem;
* `reports` diperuntukkan bagi tiket Telegram;
* terdapat modul manual non-ticketing terpisah.

Jangan mengaktifkan kembali alur tersebut tanpa keputusan baru.

---

## D-004 — Attachment Source

Status: FINAL

Field:

```text
report_attachments.source
```

digunakan untuk menunjukkan asal media.

Aturan:

```text
Telegram media → 'telegram'
Web upload → 'manual'
```

Completion evidence yang diunggah melalui dashboard termasuk:

```text
source = 'manual'
```

Jangan menggunakan:

```text
source = 'completion'
```

---

## D-005 — Telegram Media

Status: FINAL

Media Telegram yang menjadi bagian dari implementasi utama adalah:

* foto;
* dokumen.

Media Telegram menggunakan:

```text
source = 'telegram'
```

Media Telegram yang belum dapat dikaitkan dengan tiket dapat disimpan sementara pada:

```text
telegram_pending_media
```

Dukungan video/audio tidak boleh diklaim sebagai fitur implementasi utama tanpa verifikasi tambahan.

---

## D-006 — Ticket Lifecycle

Status: FINAL

Lifecycle internal tiket menggunakan:

```text
tersedia
→ diambil
→ selesai
```

atau:

```text
tersedia
→ didelegasikan
→ selesai
```

Hasil akhir dapat berupa:

```text
selesai
perlu_tindak_lanjut
eskalasi
```

`status_internal` merupakan lifecycle internal sistem.

`status_wfm` merupakan informasi terpisah yang berkaitan dengan status pada WFM.

---

## D-007 — Status `baru`

Status: FINAL

Database masih memiliki:

```text
status_internal = 'baru'
```

sebagai nilai enum/default database.

Namun alur aplikasi yang aktif menetapkan tiket Telegram secara eksplisit ke:

```text
tersedia
```

Jangan mengubah status database hanya untuk menyamakan default dengan alur aplikasi tanpa analisis dan keputusan terlebih dahulu.

---

## D-008 — Temporary Region Switch

Status: FINAL

Temporary Region Switch memberikan akses sementara kepada Eksekutor terhadap region lain.

Aturan:

* home region tidak berubah;
* Eksekutor mengajukan request;
* Koordinator approve/reject;
* akses memiliki periode berlaku;
* akses tambahan berakhir setelah expiry.

Wilayah operasional:

```text
PDG ↔ BKT
```

---

## D-009 — Role-Based Access Control

Status: FINAL

Role yang digunakan:

1. pelapor
2. eksekutor
3. koordinator
4. supervisor
5. super_admin

Supervisor bersifat read-only terhadap operasi utama.

RBAC diterapkan melalui autentikasi, middleware role, route protection, dan pembatasan akses data sesuai kebutuhan.

---

## D-010 — Arsitektur Backend

Status: FINAL

Aplikasi menggunakan:

```text
pola MVC sederhana
```

Alur utama:

```text
Routes
→ Controllers
→ Models
→ Database
```

Komponen pendukung:

* middlewares;
* services;
* utils;
* views;
* config.

Jangan menggunakan istilah:

```text
Clean Architecture
Production-ready
```

kecuali terdapat bukti dan keputusan baru yang mendukung istilah tersebut.

---

## D-011 — Telegram Integration

Status: FINAL

Bot Telegram menggunakan:

```text
node-telegram-bot-api
```

dengan mode:

```text
polling
```

Bukan webhook.

Alur:

```text
Telegram
→ telegramBotService
→ telegramParser
→ reportModel
→ MySQL
→ feedback Telegram
```

Parsing menggunakan pola/rule yang telah ditentukan dan bukan AI/NLP.

---

## D-012 — WFM/Core System

Status: FINAL

Sistem penelitian tidak menggantikan core system Telkom.

Tidak ada integrasi API langsung dengan backend WFM/core system yang menjadi bagian utama penelitian.

Pekerjaan teknis tetap dilakukan pada sistem inti Telkom.

Sistem penelitian berfungsi untuk:

* pengelolaan;
* penugasan;
* monitoring;
* pencatatan aktivitas;
* pencatatan status penanganan.

---

## D-013 — Database Live

Status: VERIFIED

Database aktif:

```text
db_penanganan_gangguan
```

Hasil verifikasi langsung:

* 11 tabel;
* 21 foreign key.

Verifikasi dilakukan melalui aplikasi dan phpMyAdmin secara read-only.

Database yang telah diverifikasi meliputi:

* roles;
* regions;
* users;
* reports;
* report_assignments;
* report_logs;
* report_attachments;
* telegram_pending_media;
* manual_non_ticketing_reports;
* region_switch_requests;
* sessions.

---

## D-014 — Bab IV dan Bab V

Status: FINAL

Bab IV berfokus pada:

```text
Analisis dan Perancangan
```

Bab V berfokus pada:

```text
Implementasi dan Pengujian
```

Aturan:

```text
Bab IV = bagaimana sistem dirancang

Bab V = bagaimana rancangan diterapkan dalam implementasi aktual
```

Bab V tidak boleh sekadar mengulang diagram dan penjelasan Bab IV.

---

## D-015 — Source of Truth

Status: FINAL

Prioritas sumber ditentukan berdasarkan jenis informasi.

### Fakta implementasi

Untuk mengetahui kondisi implementasi yang benar-benar terjadi, prioritasnya:

1. source code aktual;
2. database aktual;
3. hasil pengujian aktual.

### Keputusan desain dan aturan proyek

Untuk mengetahui aturan atau keputusan yang harus dipertahankan dalam proyek, prioritasnya:

1. `DECISIONS.md`;
2. specification/requirement yang telah disetujui.

### Dokumentasi lama

Dokumentasi lama hanya digunakan sebagai referensi dan tidak boleh mengalahkan source code, database, specification, atau keputusan final yang lebih baru dan telah disetujui.

Jika terdapat konflik antara source code/database dengan keputusan final:

* jangan langsung mengubah kode;
* jangan menganggap source code otomatis lebih benar;
* laporkan konflik;
* sebutkan file/fungsi/database yang terlibat;
* jelaskan dampaknya;
* tunggu keputusan final.

AI tidak boleh menyelesaikan konflik tersebut secara sepihak.

---

## D-016 — Aturan Perubahan Kode

Status: FINAL

AI tidak boleh:

* mengubah kode tanpa instruksi eksplisit;
* mengubah database tanpa instruksi eksplisit;
* menjalankan migration secara otomatis;
* menghapus fitur tanpa impact analysis;
* melakukan refactor besar tanpa kebutuhan.

Perubahan harus:

* minimal;
* terukur;
* dapat diverifikasi;
* tidak merusak fitur yang sudah berjalan.

Setiap bug fix atau perubahan teknis harus diverifikasi melalui pengujian yang relevan sebelum dinyatakan selesai.

---

## D-017 — Workflow AI

Status: FINAL

Pembagian tugas:

### ChatGPT

* reviewer utama;
* pengarah akademik;
* menjaga konsistensi Bab II–V;
* menentukan keputusan final;
* melakukan review terhadap hasil audit, implementasi, dan pengujian.

### Codex

* source-code auditor;
* debugging;
* implementasi perubahan;
* verification/testing teknis.

### GitHub Copilot

* secondary source-code analysis;
* pencarian fungsi/file;
* eksplorasi cepat.

### Antigravity

* analisis project;
* cross-check source code;
* reasoning terhadap konteks project;
* membantu pekerjaan teknis sesuai instruksi.

Tidak ada AI yang boleh mengambil keputusan final sendiri ketika terdapat konflik requirement, source code, database, atau dokumen Tugas Akhir.

Workflow kerja yang harus diikuti:

```text
Audit
→ Analisis
→ Usulan
→ Persetujuan/Keputusan
→ Implementasi
→ Verification
→ Testing
→ Review
→ Dokumentasi
```

AI tidak boleh melewati tahap keputusan ketika perubahan menyangkut requirement, arsitektur, database, atau behavior sistem.

---

## D-018 — Telegram Invalid Intake vs Enrichment Disambiguation

Status: FINAL

Pesan Telegram yang memiliki struktur template intake tetapi tidak memenuhi field wajib harus diproses sebagai **invalid core intake** dan tidak langsung dialihkan ke text enrichment atau pending media linking.

Ekstraksi Ticket ID dari teks harus dibatasi pada satu baris agar karakter newline tidak menyebabkan baris berikutnya terbaca sebagai Ticket ID.

Alasan:

Pada pengujian Black Box TC-05 ditemukan defect ketika nilai `TICKET ID` kosong. Proses ekstraksi Ticket ID menangkap `ORDER ID:` dari baris berikutnya, sehingga pesan invalid tidak menghasilkan respons validasi format sebagaimana yang diharapkan.

Perbaikan dilakukan pada:

* `utils/telegramParser.js`;
* `services/telegramBotService.js`;
* `tests/unit/telegramParser.test.js`.

Dampak:

Perbaikan harus mempertahankan:

* valid intake Telegram;
* text enrichment dengan Ticket ID yang valid;
* pending media linking;
* duplicate ticket handling.

Verifikasi:

* regression test berhasil;
* seluruh automated unit test tetap PASS;
* setelah perbaikan, total automated unit test menjadi 27 test;
* hasil pengujian: 27 pass dan 0 fail;
* TC-05 diuji ulang secara langsung melalui Bot Telegram;
* hasil retest TC-05 menunjukkan sistem menampilkan validasi `TICKET_ID` dan `ORDER_ID` wajib diisi;
* sistem tidak lagi menghasilkan respons `Ticket ID ORDER ID: tidak ditemukan.` pada kondisi Ticket ID kosong.

D-018 dianggap sebagai keputusan final dan menjadi aturan implementasi untuk pembedaan antara invalid core intake dan text enrichment.

---
