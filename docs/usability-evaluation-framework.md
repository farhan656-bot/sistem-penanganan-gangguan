# T081 — Usability Evaluation Framework
## Sistem Informasi Pengelolaan dan Monitoring Penanganan Gangguan Layanan Berbasis Bot Telegram dengan Role-Based Access Control (RBAC)
### Divisi Data Management PT Telkom Sumbar Wilayah Telekomunikasi (Witel) Padang

---

## 1. Tujuan Evaluasi

Dokumen ini disusun sebagai instrumen operasional pengujian kebutuhan non-fungsional **NF-05 Usability** untuk naskah Tugas Akhir. Evaluasi ini bertujuan untuk:
1. Mengetahui tingkat kemudahan penggunaan antarmuka web sistem informasi berdasarkan pengalaman pengguna langsung (*direct user experience*).
2. Mengevaluasi pemahaman pengguna terhadap fungsi-fungsi utama operasional sistem sesuai dengan hak akses masing-masing (*operational clarity*).
3. Mengevaluasi keterbacaan, kejelasan tata letak, dan pemindaian informasi laporan gangguan dan metrik kinerja pada antarmuka web (*information readability & scannability*).
4. Mengevaluasi kemudahan dan kelancaran navigasi antarmuka dalam menjalankan alur tugas kerja (*ease of navigation*).

> **Status Keterlaksanaan Pengujian:**
> Sesuai batasan naskah proposal Tugas Akhir, evaluasi langsung dengan responden pengguna operasional **belum dilaksanakan**. Dokumen ini berfungsi sebagai **kerangka kerja dan instrumen evaluasi siap pakai** (*ready-to-use evaluation instrument*) yang akan diisi pada saat proses pengujian lapangan bersama responden pengguna PT Telkom Sumbar Witel Padang.

---

## 2. Dasar Evaluasi

Evaluasi usability ini berlandaskan pada spesifikasi kebutuhan non-fungsional yang telah didefinisikan dalam naskah proposal Tugas Akhir:

* **Kode Kebutuhan:** NF-05 (Usability).
* **Definisi Proposal:** Menguji kemudahan penggunaan sistem melalui evaluasi pengguna terhadap antarmuka, informasi, dan navigasi sistem.
* **Metode Pengujian Proposal:** Pengujian direncanakan menggunakan evaluasi langsung terhadap pengguna (*direct user evaluation*) dengan menjalankan skenario tugas operasional yang relevan, dilanjutkan dengan pengisian instrumen evaluasi.
* **Baseline Implementasi:** Sistem telah melalui seluruh tahapan perbaikan antarmuka F034 (T066 s.d. T080) yang mencakup standardisasi tata letak, konsistensi token desain, perbaikan kontras WCAG AA, kejelasan fokus keyboard, dan verifikasi nol regresi fungsional.

---

## 3. Aspek Usability

Instrumen evaluasi diturunkan secara langsung dari 3 (tiga) aspek utama yang telah ditetapkan dalam proposal Tugas Akhir:

### 3.1 Pemahaman Fungsi Sistem (*System Functional Understanding*)
Menilai sejauh mana antarmuka sistem membantu pengguna memahami kegunaan fitur dan alur kerja operasional. Aspek ini mengukur:
* Kejelasan peran tombol aksi utama (misal: "Ambil Tugas", "Selesaikan", "Delegasikan").
* Kemudahan membedakan fungsi antarhalaman dashboard per peran.
* Kejelasan pesan umpan balik sistem (notifikasi sukses, peringatan, atau pesan validasi form).

### 3.2 Keterbacaan Informasi (*Information Readability & Status Clarity*)
Menilai kenyamanan dan kejelasan visual pengguna saat memindai dan membaca informasi operasional pada layar. Aspek ini mengukur:
* Kejelasan identifikasi status tiket gangguan melalui label status dan warna semantik (tersedia, diambil, didelegasikan, selesai, perlu tindak lanjut, eskalasi).
* Keterbacaan tabel antrean kerja tanpa kepadatan yang melelahkan mata (*density with readability*).
* Kejelasan informasi rincian teknis pada modal dan halaman detail tiket.
* Kejelasan ringkasan metrik angka pada kartu KPI dan dashboard supervisor.

### 3.3 Kemudahan Navigasi (*Ease of Navigation*)
Menilai kelancaran dan efisiensi pengguna saat berpindah antarhalaman atau menjelajahi komponen antarmuka. Aspek ini mengukur:
* Kemudahan menemukan menu kerja operasional pada sidebar navigasi.
* Efektivitas penggunaan filter pencarian kata kunci dan filter wilayah (PDG/BKT).
* Kemudahan perpindahan tab status pekerjaan pada antrean laporan.
* Aksesibilitas navigasi pada form bertahap dan jendela dialog modal.

---

## 4. Karakteristik Pengguna (Responden)

Pengujian usability dilakukan dengan melibatkan pengguna internal PT Telkom Sumbar Witel Padang yang mewakili 4 (empat) peran berbasis Role-Based Access Control (RBAC) pada antarmuka web:

| Peran (Role) | Karakteristik Pengguna | Tanggung Jawab Operasional Utama |
| :--- | :--- | :--- |
| **Pegawai Eksekutor** | Teknisi lapangan / petugas penanganan gangguan wilayah Padang (PDG) dan Bukittinggi (BKT). | Memindai antrean kerja wilayahnya, mengklaim tiket (*self-take*), mencatat penanganan, menyelesaikan tiket dengan unggah bukti, membuat laporan manual, dan mengajukan Temporary Region Switch bila ditugaskan lintas wilayah. |
| **Koordinator** | Koordinator lapangan / Helpdesk operasional penanganan gangguan. | Memantau distribusi beban kerja teknisi, melakukan delegasi penugasan tiket lintas wilayah (PDG $\leftrightarrow$ BKT), membatalkan penugasan macet, menyetujui/menolak pengajuan Temporary Region Switch, dan input laporan manual. |
| **Supervisor / Manajer** | Pimpinan / Manajer operasional Divisi Data Management. | Memantau ringkasan performa layanan secara berkala melalui kartu KPI dan grafik kinerja (Response Time, Resolution Time, tren eskalasi) dengan hak akses *read-only* murni (tanpa mutasi operasional). |
| **Superadmin** | Administrator sistem informasi internal Divisi Data Management. | Mengelola data akun pengguna (tambah, perbarui, nonaktifkan), konfigurasi wilayah penugasan (home region), dan pemeliharaan akun sistem. |

*(Catatan: Peran **Pelapor** berinteraksi secara eksklusif melalui Bot Telegram dan tidak mengakses dashboard web, sehingga evaluasi kegunaan antarmuka web difokuskan pada keempat peran internal di atas).*

---

## 5. Skenario / Tugas Evaluasi (*Task Scenarios*)

Sebelum mengisi instrumen kuesioner, responden diminta menjalankan serangkaian tugas interaktif pada lingkungan prototipe sistem sesuai perannya:

### 5.1 Skenario Pengujian untuk Role Eksekutor
* **EKS-01 (Autentikasi):** Masuk ke sistem menggunakan akun eksekutor, memeriksa fitur lihat/sembunyikan password, dan memastikan berhasil diarahkan ke `/dashboard/eksekutor`.
* **EKS-02 (Pemindaian Antrean):** Membuka halaman Daftar Antrean Kerja (`/reports`), membaca ringkasan jumlah tiket per status pada tab kerja, dan memfilter tiket berdasarkan wilayah (PDG/BKT) serta kata kunci pencarian.
* **EKS-03 (Pemeriksaan Detail Laporan):** Membuka detail tiket melalui tombol "Detail", memeriksa kejelasan informasi teknis, riwayat log penanganan, dan lampiran bukti pelapor pada tab rincian.
* **EKS-04 (Penyelesaian Tiket):** Membuka form penyelesaian tiket, memeriksa kejelasan area catatan penyelesaian dan area unggah bukti foto (paste/drop zone).
* **EKS-05 (Laporan Manual):** Membuka menu Laporan Manual (`/manual-reports`), melihat daftar laporan, dan membuka form tambah laporan manual non-ticketing.
* **EKS-06 (Temporary Region Switch):** Membuka menu Pengajuan Switch Region (`/region-switch/my`) dan membuka formulir permohonan akses wilayah sementara.

### 5.2 Skenario Pengujian untuk Role Koordinator
* **KOOR-01 (Autentikasi):** Masuk ke sistem menggunakan akun koordinator dan memeriksa ringkasan beban kerja teknisi pada `/dashboard/koordinator`.
* **KOOR-02 (Antrean & Delegasi):** Membuka Daftar Antrean Kerja (`/reports`), membuka tiket wilayah lain, dan memeriksa antarmuka dialog konfirmasi delegasi penugasan.
* **KOOR-03 (Approval Region Switch):** Membuka halaman persetujuan akses wilayah (`/region-switch/pending`), memeriksa daftar permohonan dari teknisi eksekutor, dan membuka dialog persetujuan/penolakan dengan pengisian alasan.
* **KOOR-04 (Laporan Manual):** Membuka modul Laporan Manual non-ticketing untuk meninjau rekaman data gangguan yang dicatat secara langsung.

### 5.3 Skenario Pengujian untuk Role Supervisor
* **SPV-01 (Autentikasi & Ringkasan KPI):** Masuk ke sistem menggunakan akun supervisor dan memeriksa tampilan kartu metrik performa (MTTR, MTTA, Resolution Rate) pada `/dashboard/supervisor`.
* **SPV-02 (Analisis Visual Grafik):** Meninjau grafik visualisasi kinerja penanganan tiket (Chart.js) dan berpindah antar-tab analisis wilayah serta evaluasi kinerja teknisi.
* **SPV-03 (Verifikasi Sifat Read-Only):** Membuka halaman antrean kerja dan memastikan tidak ada tombol aksi mutasi operasional (klaim/selesai) yang dapat mengubah integritas data operasional.

### 5.4 Skenario Pengujian untuk Role Superadmin
* **ADM-01 (Autentikasi & Dashboard Admin):** Masuk ke sistem menggunakan akun superadmin dan meninjau ringkasan statistik sistem pada `/dashboard/super-admin`.
* **ADM-02 (Daftar Pengguna):** Membuka menu Manajemen User (`/users`), memindai data tabel pengguna, dan memeriksa kejelasan badge role serta status aktif/nonaktif akun.
* **ADM-03 (Formulir Akun Pengguna):** Membuka formulir tambah user (`/users/create`) dan form edit user (`/users/:id/edit`) untuk mengevaluasi kejelasan pengelompokan input data pengguna.

---

## 6. Instrumen Evaluasi

### 6.1 Identitas Responden
* **Kode Responden:** `[ RESP-.... ]` *(contoh: RESP-EKS-01)*
* **Role Pengguna:** `[ ] Eksekutor  [ ] Koordinator  [ ] Supervisor  [ ] Superadmin`
* **Wilayah Tugas:** `[ ] Padang (PDG)  [ ] Bukittinggi (BKT)  [ ] Kantor Witel Sumbar`
* **Lama Bertugas di Unit:** `[ ] < 1 tahun  [ ] 1 - 3 tahun  [ ] > 3 tahun`
* **Tanggal Pelaksanaan:** `........................................`

### 6.2 Petunjuk Pengisian
1. Pastikan Anda telah menyelesaikan seluruh skenario tugas yang ditentukan untuk peran Anda.
2. Bacalah setiap butir pernyataan di bawah ini dengan saksama.
3. Berikan penilaian yang paling mencerminkan pengalaman Anda saat menggunakan sistem.
4. Tidak ada jawaban benar atau salah; penilaian objektif Anda sangat berharga bagi penyempurnaan sistem dan penyusunan Tugas Akhir.

---

## 7. Skala Penilaian

> **Status Metodologis Skala:**
> **USULAN INSTRUMEN OPERASIONAL (MEMERLUKAN KONFIRMASI AKADEMIK PEMBIMBING/PENGUJI)**
> Karena naskah proposal belum menetapkan skala pengukuran secara eksplisit, instrumen ini menggunakan **Skala Likert 5-Tingkat** bertingkat simetris yang umum digunakan pada pengujian perangkat lunak sistem informasi:

| Nilai Skor | Keterangan Pilihan Jawaban |
| :---: | :--- |
| **1** | Sangat Tidak Setuju (STS) |
| **2** | Tidak Setuju (TS) |
| **3** | Cukup Setuju / Netral (N) |
| **4** | Setuju (S) |
| **5** | Sangat Setuju (SS) |

---

## 8. Pemetaan Butir Pertanyaan terhadap Aspek Usability

Berikut adalah 15 (lima belas) butir pernyataan evaluasi yang telah dipetakan secara ketat terhadap ketiga aspek usability proposal dan relevansi perannya:

| No | Kode Item | Butir Pernyataan Evaluasi | Aspek Usability | Role Relevan |
| :---: | :---: | :--- | :--- | :--- |
| 1 | **PF-01** | Saya dapat memahami fungsi dan alur kerja utama sistem melalui tombol dan menu yang tersedia pada antarmuka. | Pemahaman Fungsi Sistem | Semua Role |
| 2 | **PF-02** | Tombol tindakan utama (seperti Ambil Tugas, Selesaikan, Delegasikan, atau Simpan) terlihat jelas dan mudah dibedakan dari tombol sekunder. | Pemahaman Fungsi Sistem | Eksekutor, Koordinator, Superadmin |
| 3 | **PF-03** | Pesan notifikasi (berhasil, peringatan, atau gagal) memberikan informasi yang jelas mengenai hasil dari tindakan yang saya lakukan. | Pemahaman Fungsi Sistem | Semua Role |
| 4 | **PF-04** | Label, istilah teknis operasional, dan petunjuk input pada formulir mudah dipahami sesuai kebiasaan kerja di unit penanganan gangguan. | Pemahaman Fungsi Sistem | Semua Role |
| 5 | **PF-05** | Pada peran Supervisor, tampilan antarmuka memperjelas fungsi monitoring kinerja tanpa membingungkan pengguna dengan tombol aksi operasional. | Pemahaman Fungsi Sistem | Supervisor |
| 6 | **KI-01** | Informasi status tiket gangguan (tersedia, diambil, selesai, eskalasi, dll.) dapat diidentifikasi secara cepat dan jelas melalui teks label status. | Keterbacaan Informasi | Eksekutor, Koordinator, Supervisor |
| 7 | **KI-02** | Tabel antrean kerja menyajikan informasi laporan secara teratur, rapi, dan mudah dipindai tanpa membuat mata cepat lelah. | Keterbacaan Informasi | Semua Role |
| 8 | **KI-03** | Kontras warna teks, label, dan latar belakang antarmuka nyaman dibaca serta tidak kabur. | Keterbacaan Informasi | Semua Role |
| 9 | **KI-04** | Jendela modal ringkasan detail tiket menyajikan data teknis, histori penanganan, dan foto bukti dengan struktur tab yang runtut dan informatif. | Keterbacaan Informasi | Eksekutor, Koordinator, Supervisor |
| 10 | **KI-05** | Angka metrik pada kartu KPI dan visualisasi grafik performa pada dashboard menyajikan ringkasan kinerja yang mudah dipahami sekilas. | Keterbacaan Informasi | Supervisor, Koordinator |
| 11 | **KN-01** | Menu navigasi pada sidebar tersusun secara logis dan memudahkan saya beralih antarhalaman kerja tanpa tersesat. | Kemudahan Navigasi | Semua Role |
| 12 | **KN-02** | Fitur pencarian kata kunci dan penyaringan wilayah (Padang/Bukittinggi) bekerja secara efektif dalam mempersempit daftar laporan. | Kemudahan Navigasi | Eksekutor, Koordinator, Supervisor |
| 13 | **KN-03** | Tab klasifikasi pekerjaan (Tersedia, Sedang Dikerjakan, Selesai, dll.) mempermudah pemilahan tiket sesuai tahapan penanganan aktif. | Kemudahan Navigasi | Eksekutor, Koordinator, Supervisor |
| 14 | **KN-04** | Penomoran halaman (*pagination*) pada tabel antrean dan riwayat laporan mudah dioperasikan. | Kemudahan Navigasi | Semua Role |
| 15 | **KN-05** | Dialog konfirmasi atau modal dapat dibuka, ditutup, dan dikendalikan dengan mudah menggunakan mouse maupun tombol keyboard. | Kemudahan Navigasi | Semua Role |

---

## 9. Format Pengumpulan Data Mentah (*Data Collection Sheet*)

Tabel di bawah ini disiapkan sebagai lembar pencatatan hasil jawaban responden nyata:

| No | Kode Responden | Role | Wilayah | Skor PF (1-5) | Skor KI (6-10) | Skor KN (11-15) | Total Skor | Catatan Kualitatif / Masukan Pengguna |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| 1 | `[ RESP-01 ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ Belum diisi - menunggu pengujian ]` |
| 2 | `[ RESP-02 ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ Belum diisi - menunggu pengujian ]` |
| 3 | `[ RESP-03 ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ Belum diisi - menunggu pengujian ]` |
| 4 | `[ RESP-04 ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ Belum diisi - menunggu pengujian ]` |
| 5 | `[ RESP-05 ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ ..... ]` | `[ Belum diisi - menunggu pengujian ]` |
| ... | `...` | `...` | `...` | `...` | `...` | `...` | `...` | `...` |

*(Catatan: Jumlah baris responden disesuaikan dengan kuota sampel aktual yang disetujui).*

---

## 10. Metode Analisis yang Diusulkan (*Analysis Formulation*)

> **Status Metodologis Analisis:**
> **USULAN FORMULASI ANALISIS (MEMERLUKAN KONFIRMASI AKADEMIK)**

Untuk mengolah data jawaban instrumen setelah pengujian lapangan selesai, diusulkan metode statistik deskriptif berbasis persentase kelayakan skor Likert:

### 10.1 Rumus Perhitungan Persentase Aspek
$$\text{Persentase Kelayakan Aspek (\%)} = \frac{\sum X}{\sum X_{\text{maksimal}}} \times 100\%$$

Di mana:
* $\sum X$: Total skor aktual yang diperoleh dari seluruh responden pada aspek yang dinilai.
* $\sum X_{\text{maksimal}}$: Total skor ideal/maksimum ($N \times \text{jumlah butir pertanyaan pada aspek} \times 5$).
* $N$: Jumlah total responden yang berpartisipasi.

### 10.2 Rumus Perhitungan Rata-Rata Butir (*Mean Score*)
$$\bar{x} = \frac{\sum x_i}{N}$$

Di mana:
* $\bar{x}$: Nilai rata-rata butir pernyataan (rentang 1.00 s.d. 5.00).
* $\sum x_i$: Jumlah skor penilaian dari seluruh responden pada butir ke-$i$.
* $N$: Jumlah responden yang menilai butir tersebut.

---

## 11. Format Kriteria Interpretasi Hasil

> **Status Kriteria:**
> **DRAFT INTERPRETASI (BELUM TERISI / MENUNGGU HASIL PENGUJIAN AKTUAL)**

Kriteria interpretasi persentase kelayakan usability yang lazim digunakan dalam penelitian evaluasi sistem informasi (skala interval kontinum):

| Rentang Persentase Kelayakan | Kategori Kriteria Kelayakan Usability | Status Kebutuhan NF-05 |
| :---: | :--- | :---: |
| **81.00% – 100.00%** | Sangat Baik / Sangat Layak | Terpenuhi (Berhasil) |
| **61.00% – 80.00%** | Baik / Layak | Terpenuhi (Berhasil) |
| **41.00% – 60.00%** | Cukup Baik / Cukup Layak | Perlu Tindak Lanjut Minor |
| **21.00% – 40.00%** | Kurang Baik / Kurang Layak | Belum Terpenuhi (Gagal) |
| **0.00% – 20.00%** | Sangat Buruk / Sangat Tidak Layak | Belum Terpenuhi (Gagal) |

---

## 12. Batasan dan Hal yang Memerlukan Konfirmasi

Agar dokumen ini tetap akuntabel secara akademik dan tidak mendahului proses pengujian formal, berikut adalah butir-butir yang dicatat secara transparan sebagai hal yang **memerlukan konfirmasi dari Dosen Pembimbing / Penguji**:

1. **Konfirmasi Skala Pengukuran:**
   Proposal asli hanya menyebutkan "evaluasi pengguna" tanpa menetapkan skala baku. Penggunaan Skala Likert 5-tingkat dalam dokumen ini merupakan usulan kerja operasional agar instrumen siap diuji.
2. **Konfirmasi Penentuan Ukuran Sampel ($N$):**
   Jumlah responden operasional (apakah melibatkan seluruh teknisi Divisi Data Management atau sampel purposif perwakilan shift/wilayah) belum ditetapkan secara numerik dalam proposal dan memerlukan konfirmasi kuota resmi.
3. **Konfirmasi Penggunaan Instrumen Standar Internasional vs. Instrumen Kustom:**
   Apakah dosen pembimbing menghendaki kuesioner kustom berbasis 3 aspek NF-05 ini, atau menghendaki adopsi instrumen standar seperti *System Usability Scale* (SUS) 10-item atau *USE Questionnaire*.
4. **Pemisahan Pengujian Sistem Otomatis vs. Pengujian Responden:**
   Hasil pengujian otomatis T080 (100% unit tests pass, zero console error, responsive pass) adalah verifikasi stabilitas teknis kode antarmuka, dan **bukan merupakan klaim kelulusan pengujian usability pengguna nyata**. Pengujian pengguna NF-05 tetap berstatus tertunda hingga instrumen ini diisi oleh responden sesungguhnya di lapangan.
