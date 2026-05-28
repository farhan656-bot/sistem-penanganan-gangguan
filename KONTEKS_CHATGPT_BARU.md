# Konteks untuk ChatGPT Baru

Gunakan dokumen ini sebagai konteks awal untuk melanjutkan pembahasan dan pekerjaan pada Tugas Akhir saya.

## Identitas Proyek

Saya sedang mengerjakan Tugas Akhir dengan judul:

**Perancangan Sistem Informasi Pengelolaan dan Monitoring Penanganan Gangguan Layanan Berbasis Bot Telegram dengan Role-Based Access Control (RBAC) pada Divisi Data Management PT Telkom Sumbar Wilayah Telekomunikasi (Witel) Padang**

Sistem ini adalah sistem internal/prototipe operasional untuk membantu Divisi Data Management PT Telkom Sumbar Witel Padang dalam mengelola antrean laporan gangguan, mencegah pengambilan tiket ganda, mencatat waktu penanganan, mendukung delegasi lintas wilayah, dan menyediakan dashboard monitoring.

Sistem ini **bukan pengganti sistem inti Telkom**. Tiket/laporan utama tetap berasal dari sistem inti Telkom, sedangkan sistem ini membantu monitoring dan pengelolaan proses penanganannya.

## Kondisi Proposal

File draft proposal saya berada di:

`C:\backup draft proposal\DRAFT PROPOSAL TA FARHAN (backup).docx`

Kondisi terakhir:

- **Bab 1 sudah benar secara arah utama**.
- Bab 1 sudah menambahkan role baru, yaitu **Superadmin**.
- **Bab 2 dan Bab 3 belum sepenuhnya diperbaiki** karena masih banyak bagian yang menyebut RBAC dengan empat peran lama.
- Target saat ini adalah menyelaraskan Bab 2 dan Bab 3 agar konsisten dengan Bab 1 dan implementasi sistem saat ini.

## Peran Pengguna Saat Ini

Sistem saat ini memiliki 5 role utama:

1. **Pelapor**
   - Mengirim laporan melalui Bot Telegram.
   - Tidak login ke dashboard web.

2. **Pegawai Eksekutor**
   - Login ke dashboard.
   - Melihat tiket wilayah sendiri dan tiket yang didelegasikan kepadanya.
   - Mengambil tiket dengan status `tersedia`.
   - Menandai pekerjaan sedang berjalan.
   - Menyelesaikan tiket dengan bukti dan catatan penyelesaian.
   - Dapat mengajukan temporary region switch.

3. **Koordinator**
   - Login ke dashboard.
   - Melihat antrean laporan.
   - Mendelegasikan tiket lintas wilayah.
   - Membatalkan penugasan aktif.
   - Menyetujui atau menolak pengajuan temporary region switch.
   - Dapat menambahkan laporan manual.

4. **Supervisor / Manajer**
   - Login ke dashboard.
   - Mengakses dashboard KPI dan monitoring.
   - Bersifat read-only.
   - Tidak boleh mengubah data transaksional tiket.

5. **Superadmin**
   - Login ke dashboard.
   - Mengelola data user sistem.
   - Menambah, mengubah, mengaktifkan, dan menonaktifkan user.
   - Mengatur role dan wilayah/district user.
   - Pada implementasi saat ini juga tersedia akses administratif untuk laporan manual dan antrean laporan sebagai fallback, tetapi peran utamanya tetap manajemen user.

## Stack dan Arsitektur Implementasi

Project menggunakan:

- Node.js
- Express.js
- MySQL
- `mysql2/promise`
- EJS
- Bootstrap 5
- `express-session`
- CommonJS
- `node-telegram-bot-api`
- `multer` untuk upload bukti/lampiran

Aturan teknis penting:

- Gunakan struktur MVC yang sudah ada.
- SQL tetap berada di file model.
- Gunakan `mysql2/promise`.
- Jangan menggunakan ORM.
- Jangan menggunakan ES Modules.
- Jangan memperkenalkan React, Vue, Tailwind, atau framework frontend lain.
- Jangan mengubah logic Telegram bot, ticket lifecycle, F007 region switch, atau KPI supervisor tanpa permintaan eksplisit.

## Struktur Folder Penting

- `app.js`: entry point aplikasi Express dan inisialisasi Telegram bot.
- `controllers/`: controller untuk auth, dashboard, report, user, region switch, dan bot.
- `models/`: query MySQL dan business logic berbasis database.
- `routes/`: routing Express dan middleware role.
- `views/`: halaman EJS.
- `services/telegramBotService.js`: logic intake, media, dan text enrichment Telegram.
- `services/telegramFeedbackService.js`: pengiriman feedback ke Telegram.
- `utils/telegramParser.js`: parsing format laporan Telegram.
- `.specify/features/`: dokumentasi Spec Kit fitur F001 sampai F008.
- `.specify/project-status.md`: status fitur terbaru.

## Status Fitur Implementasi

Fitur utama yang sudah selesai:

- F001 Superadmin User Management
- F002 Ticket Lifecycle and Status Handling
- F003 Assignment / Delegation Related Flow
- F004 Supervisor KPI Dashboard Refinement
- F005 Manual Report Entry
- F006 Telegram Bot Intake / Feedback / Text Enrichment
- F007 Temporary Region Switch Approval
- F008 UI/UX Refinement and Layout Standardization

Catatan penting:

- F008 sudah selesai sampai final safety check. Jangan re-implement F008.
- Temporary Region Switch F007 sudah selesai dan bekerja.
- Supervisor dashboard harus tetap read-only.
- Telegram bot logic jangan diubah kecuali diminta secara eksplisit.

## Status Tiket Aktif

Status tiket yang digunakan dalam implementasi saat ini:

- `tersedia`
- `diambil`
- `didelegasikan`
- `selesai`
- `perlu_tindak_lanjut`
- `eskalasi`

Catatan penting:

- Status `baru` **tidak digunakan dalam implementasi aktif**.
- Laporan dari Telegram bot dan laporan manual langsung masuk dengan status `tersedia`.
- Beberapa dokumen lama/spec masih menyebut `baru`, tetapi konteks terbaru project menyatakan status tersebut tidak dipakai.

## Aturan Bisnis Utama

Eksekutor:

- Hanya dapat mengambil tiket dengan status `tersedia`.
- Hanya dapat mengambil tiket wilayah sendiri.
- Dapat melihat tiket wilayah sendiri dan tiket yang ditugaskan/didelegasikan kepadanya.
- Jika temporary region switch disetujui dan masih aktif, eksekutor dapat melihat akses wilayah tambahan secara sementara.

Koordinator:

- Dapat melakukan delegasi tiket.
- Dapat membatalkan penugasan aktif.
- Dapat approve/reject pengajuan temporary region switch.
- Delegasi hanya boleh lintas wilayah PDG dan BKT sesuai aturan.

Supervisor:

- Hanya monitoring KPI.
- Tidak boleh mengubah tiket, assignment, region switch, atau data operasional.

Superadmin:

- Mengelola user, role, status aktif akun, dan wilayah user.
- Jangan disamakan dengan koordinator operasional.

## Aturan Delegasi

- Delegasi hanya dilakukan oleh koordinator.
- Delegasi dapat dilakukan pada tiket status:
  - `tersedia`
  - `diambil`
  - `didelegasikan`
- Delegasi tidak mengubah district/wilayah asal tiket.
- Delegasi hanya mengubah penanggung jawab aktif.
- Tiket wilayah `PDG` hanya boleh didelegasikan ke eksekutor wilayah `BKT`.
- Tiket wilayah `BKT` hanya boleh didelegasikan ke eksekutor wilayah `PDG`.

## Region Switch F007

Temporary Region Switch sudah diimplementasikan.

Aturan:

- Eksekutor dapat mengajukan akses sementara ke region lain.
- Koordinator dapat menyetujui atau menolak.
- Home region permanen user tidak boleh berubah.
- Jika disetujui, akses tambahan berlaku sementara sampai akhir hari.
- Akses expired tidak boleh lagi memberikan visibilitas region tambahan.

## Telegram Bot

Bot Telegram digunakan untuk:

- menerima laporan gangguan dengan format teks terstruktur,
- melakukan text parsing berbasis aturan,
- menolak format tidak valid,
- menolak duplikasi ticket ID,
- menerima media atau dokumen tambahan,
- menghubungkan media ke tiket,
- melakukan text enrichment untuk field tambahan,
- memberi feedback ke Telegram saat tiket diambil, sedang dikerjakan, atau selesai.

Bot tidak menggunakan AI/NLP. Parsing dilakukan berdasarkan pola label seperti:

- `TICKET ID`
- `ORDER ID`
- `SUMMARY`
- `REGION`
- dan field pendukung lain.

## Hal yang Perlu Diperbaiki di Bab 2 dan Bab 3 Proposal

Fokus revisi utama adalah menyelaraskan Bab 2 dan Bab 3 dengan penambahan role **Superadmin** dan stack implementasi terbaru.

Bagian yang perlu diperbaiki:

1. **Bab 2 - RBAC**
   - Masih menyebut sistem melibatkan empat peran utama.
   - Ubah menjadi lima role: Pelapor, Superadmin, Pegawai Eksekutor, Koordinator, dan Supervisor/Manajer.
   - Jelaskan bahwa Superadmin bertugas mengelola user, role, status akun, dan wilayah user.

2. **Bab 2 - Use Case Diagram**
   - Masih menyebut empat aktor.
   - Tambahkan aktor Superadmin.
   - Use case Superadmin mencakup login, melihat dashboard admin, mengelola user, menambah user, mengubah user, mengaktifkan/nonaktifkan user, dan mengatur role/wilayah user.

3. **Bab 2 - Penelitian Terkait / State of the Art**
   - Jika masih menyebut RBAC empat peran, ubah menjadi lima role.
   - Kebaruan penelitian sebaiknya menyebut kombinasi Bot Telegram, dashboard task pool, fitur Ambil Tugas untuk mencegah double-claim, pencatatan waktu, delegasi lintas wilayah, dashboard KPI read-only, dan Superadmin untuk manajemen user.

4. **Bab 2 - Metode Waterfall / Alat Pembangunan Sistem**
   - Ada bagian yang masih menyebut **Prisma ORM**.
   - Implementasi project saat ini **tidak memakai Prisma**.
   - Ubah menjadi Node.js, Express.js, MySQL, dan `mysql2/promise`.
   - Jelaskan `mysql2/promise` sebagai library/driver untuk menjalankan query MySQL secara asynchronous dengan pola Promise.

5. **Bab 3 - Objek Kajian / Wawancara / Analisis**
   - Jika masih menyebut batas kewenangan empat peran, ubah menjadi lima role.
   - Tambahkan Superadmin sebagai role administratif yang mengelola pengguna sistem.

6. **Bab 3 - Metode Pengembangan Sistem**
   - Ubah frasa "RBAC empat peran" menjadi "RBAC lima role".
   - Sesuaikan daftar role dengan Bab 1.

7. **Bab 3 - Tahap Desain**
   - Use Case Diagram dan rancangan RBAC harus memuat Superadmin.
   - Desain basis data harus mendukung user, role, region, status aktif akun, laporan, assignment, log aktivitas, attachment, dan region switch.

8. **Bab 3 - Tahap Implementasi**
   - Hapus atau ganti penyebutan Prisma ORM.
   - Gunakan deskripsi implementasi: Node.js, Express.js, MySQL, `mysql2/promise`, EJS, Bootstrap 5, dan Bot Telegram.

9. **Bab 3 - Alur Penelitian**
   - Jika masih menyebut implementasi dengan Prisma ORM, ubah menjadi `mysql2/promise`.
   - Pastikan alur tetap Waterfall: identifikasi masalah, pengumpulan data, analisis, desain, implementasi, pengujian, evaluasi, penyusunan laporan.

## Catatan Istilah

Gunakan istilah secara konsisten:

- Gunakan **Superadmin** atau **Super Admin**, pilih satu gaya dan konsisten.
- Di kode role bernama `super_admin`.
- Di proposal boleh menggunakan istilah naratif **Superadmin**.
- Jangan menyebut "empat peran" lagi kecuali sedang menjelaskan versi lama.
- Lebih aman memakai "lima role" atau "lima peran utama".

## Instruksi untuk ChatGPT Baru

Saat membantu saya, prioritaskan hal berikut:

1. Jika membahas proposal, gunakan bahasa akademik Indonesia yang formal tetapi tetap jelas.
2. Jangan mengubah arah Bab 1 karena Bab 1 sudah dianggap benar.
3. Fokuskan revisi Bab 2 dan Bab 3 pada konsistensi role Superadmin, RBAC lima role, dan stack implementasi tanpa ORM.
4. Jangan membuat klaim bahwa sistem menggantikan sistem inti Telkom.
5. Jangan menyarankan integrasi API langsung ke sistem inti Telkom karena proposal membatasi sistem tanpa integrasi API ke core system.
6. Jangan menyebut AI/NLP untuk Telegram bot karena bot menggunakan text parsing berbasis aturan.
7. Jangan mengubah aturan bisnis utama seperti lifecycle tiket, delegasi, region switch, Telegram bot, atau KPI supervisor tanpa permintaan eksplisit.
8. Jika memberi saran revisi paragraf, tulis dalam bentuk paragraf siap tempel ke proposal.

## Prompt Singkat untuk Memulai ChatGPT Baru

Saya sedang mengerjakan proposal Tugas Akhir tentang Sistem Informasi Pengelolaan dan Monitoring Penanganan Gangguan Layanan Berbasis Bot Telegram dengan RBAC pada Divisi Data Management PT Telkom Sumbar Witel Padang. Bab 1 sudah saya perbaiki dan sudah menambahkan role Superadmin, tetapi Bab 2 dan Bab 3 masih perlu diselaraskan karena masih menyebut RBAC empat peran dan ada bagian yang masih menyebut Prisma ORM. Implementasi project saat ini memakai Node.js, Express.js, MySQL, `mysql2/promise`, EJS, Bootstrap 5, CommonJS, dan Bot Telegram berbasis text parsing aturan tetap. Role aktif sistem adalah Pelapor, Superadmin, Pegawai Eksekutor, Koordinator, dan Supervisor/Manajer. Tolong bantu saya merevisi Bab 2 dan Bab 3 secara akademik agar konsisten dengan Bab 1, implementasi sistem, dan batasan penelitian.
