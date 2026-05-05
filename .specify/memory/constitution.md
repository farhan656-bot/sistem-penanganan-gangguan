# Constitution — Sistem Pengelolaan Tiket Gangguan

## 1. Nama dan Tujuan Sistem
Sistem ini bernama **Sistem Pengelolaan Tiket Gangguan Berbasis Bot Telegram dan Web Dashboard**.

Tujuan utama sistem:
- menerima laporan gangguan dari Bot Telegram,
- mengelola antrean kerja penanganan gangguan,
- mencegah pengambilan tiket ganda,
- mendukung delegasi penanggung jawab lintas district,
- mencatat waktu respons dan waktu penyelesaian,
- menyediakan dashboard monitoring dan KPI,
- menerapkan kontrol akses berbasis role.

Sistem ini adalah **sistem penengah/internal**, bukan pengganti sistem inti Telkom.

---

## 2. Ruang Lingkup Sistem
Sistem hanya mencakup proses:
- penerimaan laporan gangguan dari Bot Telegram,
- penampilan antrean kerja pada dashboard web,
- pengambilan tugas oleh eksekutor,
- delegasi tugas oleh koordinator,
- pembatalan penugasan oleh koordinator,
- konfirmasi penyelesaian,
- tindak lanjut / eskalasi,
- monitoring dashboard supervisor,
- pengelolaan user oleh super admin.

Sistem **tidak** melakukan integrasi langsung ke sistem inti Telkom melalui API.

---

## 3. Role Pengguna
Sistem memiliki 5 role utama:

### 3.1 Pelapor
- Mengirim laporan gangguan melalui Bot Telegram.
- Tidak login ke dashboard web.

### 3.2 Pegawai Eksekutor
- Login ke dashboard.
- Melihat tiket district miliknya sendiri.
- Melihat tiket dari district lain yang didelegasikan kepadanya.
- Mengambil tiket yang tersedia pada district sendiri.
- Menyelesaikan tiket yang menjadi tanggung jawabnya.

### 3.3 Koordinator
- Login ke dashboard.
- Melihat seluruh tiket.
- Mendelegasikan tiket lintas district.
- Membatalkan penugasan aktif.
- Mengatur redistribusi beban kerja operasional.

### 3.4 Supervisor / Manajer
- Login ke dashboard.
- Memiliki hak akses read-only.
- Melihat dashboard KPI dan monitoring operasional.
- Tidak boleh mengubah data transaksional tiket.

### 3.5 Super Admin
- Login ke dashboard.
- Mengelola user sistem.
- Menambah, mengubah, mengaktifkan, dan menonaktifkan user.
- Mengatur role dan district user.

---

## 4. Aturan Bisnis Inti

### 4.1 Aturan Pengambilan Tiket
- Eksekutor hanya dapat mengambil tiket dengan status `tersedia`.
- Eksekutor hanya dapat mengambil tiket district miliknya sendiri.
- Saat tiket diambil, sistem wajib:
  - mengubah status tiket,
  - menetapkan penanggung jawab aktif,
  - mencatat waktu ambil,
  - menyimpan log aktivitas,
  - mencegah pengambilan ganda dengan transaksi database.

### 4.2 Aturan Delegasi
- Delegasi dilakukan hanya oleh koordinator.
- Delegasi dapat dilakukan untuk tiket dengan status:
  - `tersedia`
  - `diambil`
  - `didelegasikan`
- Delegasi **tidak memindahkan district tiket**.
- Delegasi hanya memindahkan **penanggung jawab aktif**.
- Jika tiket district `PDG`, maka delegasi hanya boleh ke eksekutor district `BKT`.
- Jika tiket district `BKT`, maka delegasi hanya boleh ke eksekutor district `PDG`.

### 4.3 Aturan Pembatalan Penugasan
- Pembatalan penugasan hanya dapat dilakukan oleh koordinator.
- Pembatalan hanya berlaku untuk tiket berstatus:
  - `diambil`
  - `didelegasikan`
- Setelah dibatalkan:
  - tiket kembali ke status `tersedia`,
  - penanggung jawab aktif dihapus,
  - histori aktivitas tetap disimpan.

### 4.4 Aturan Visibilitas Tiket
- Eksekutor hanya dapat melihat:
  - tiket pada district sendiri,
  - dan tiket yang didelegasikan kepadanya.
- Koordinator dapat melihat semua tiket.
- Supervisor dapat melihat dashboard KPI tanpa akses perubahan data.
- Super Admin tidak mengelola tiket operasional, tetapi mengelola user dan role.

---

## 5. SLA dan Waktu Operasional
- **Waktu respons** dihitung sejak tiket masuk ke sistem (`received_at`) sampai tiket diambil/ditugaskan (`taken_at`).
- **Waktu penyelesaian** dihitung sejak tiket mulai ditangani (`taken_at`) sampai tiket dinyatakan selesai atau sampai status akhir ditetapkan (`resolved_at`).

---

## 6. Status Tiket
Status internal minimum yang digunakan sistem:

- `baru`
- `tersedia`
- `diambil`
- `didelegasikan`
- `selesai`
- `perlu_tindak_lanjut`
- `eskalasi`

Makna:
- `baru`: tiket baru diterima sistem
- `tersedia`: tiket siap diambil/ditugaskan
- `diambil`: tiket diambil oleh eksekutor district asal
- `didelegasikan`: tiket ditugaskan oleh koordinator ke eksekutor district lain
- `selesai`: penanganan selesai
- `perlu_tindak_lanjut`: masih perlu tindakan lanjutan
- `eskalasi`: perlu diteruskan ke tim lain seperti DIT/Sygap

---

## 7. Bukti dan Catatan Penyelesaian
Saat tiket diproses ke status akhir, sistem wajib mendukung:
- catatan penyelesaian,
- status akhir penanganan,
- bukti lampiran seperti screenshot, gambar, atau PDF.

---

## 8. Audit dan Logging
Setiap aksi penting wajib dicatat ke log:
- tiket diterima
- tiket diambil
- tiket didelegasikan
- penugasan dibatalkan
- tiket diselesaikan
- tiket masuk tindak lanjut
- tiket dieskalasikan

Log harus menyimpan:
- ticket id
- user pelaku
- aksi
- deskripsi
- waktu kejadian

---

## 9. Prinsip Implementasi Teknis
Stack utama:
- Node.js
- Express.js
- MySQL (XAMPP / localhost)
- EJS
- Bootstrap 5
- express-session
- mysql2/promise
- multer untuk upload file

Aturan teknis:
- gunakan arsitektur MVC sederhana,
- gunakan transaksi database untuk operasi kritis,
- gunakan middleware auth dan role,
- hindari ORM tambahan,
- prioritaskan keterbacaan dan maintainability.

---

## 10. Prinsip UI/UX
UI/UX harus mengikuti gaya enterprise yang rapi dan konsisten, dengan referensi visual bernuansa Telkom Indonesia:
- dominan putih / abu terang,
- aksen merah Telkom untuk elemen penting,
- biru/abu untuk komponen netral dan informasi,
- layout dashboard bersih,
- tipografi mudah dibaca,
- card dan tabel informatif,
- badge status jelas,
- navigasi sederhana,
- tampilan operasional cepat dipahami oleh user lapangan.

Prinsip UX:
- minim klik untuk aksi utama,
- semua aksi penting harus memberi feedback,
- detail tiket mudah dipahami,
- status dan penanggung jawab harus selalu terlihat jelas.

---

## 11. Larangan Perubahan Tanpa Persetujuan
Perubahan berikut tidak boleh dilakukan tanpa persetujuan eksplisit:
- mengubah arti role,
- mengubah aturan delegasi lintas district,
- mengubah dasar perhitungan SLA,
- memindahkan district tiket saat delegasi,
- memberi akses pembatalan tugas kepada selain koordinator,
- menghapus pencatatan log aktivitas.

---

## 12. Prioritas Pengembangan
Urutan prioritas fitur:
1. Super Admin & User Management
2. Finalisasi lifecycle tiket dan status
3. Delegasi & pembatalan assignment
4. Dashboard KPI Supervisor
5. Integrasi Bot Telegram
6. Feedback dan update status via bot