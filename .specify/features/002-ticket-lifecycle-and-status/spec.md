# Feature Spec — Ticket Lifecycle & Status

## Feature ID
F002

## Feature Name
Ticket Lifecycle & Status

## Summary
Fitur ini mendefinisikan lifecycle tiket gangguan dari saat tiket masuk ke sistem hingga mencapai hasil akhir operasional. Sistem harus mendukung status tiket yang lebih realistis sesuai proses lapangan, termasuk kondisi tiket selesai, perlu tindak lanjut, atau perlu eskalasi ke tim lain.

## Business Background
Hasil diskusi lapangan menunjukkan bahwa waktu respons dihitung sejak tiket masuk, bukan sejak tiket diambil. Selain itu, tiket yang sudah dikerjakan tidak selalu langsung final selesai. Dalam beberapa kondisi, tiket masih bisa membutuhkan tindak lanjut atau perlu dieskalasikan ke tim lain seperti DIT/Sygap.

## Problem Statement
Saat ini sistem masih terlalu sederhana jika hanya memakai status akhir `selesai`. Kondisi lapangan membutuhkan status yang lebih representatif agar:
- SLA bisa dihitung dengan benar,
- tiket yang belum final tetap tercatat,
- dashboard supervisor lebih akurat,
- alur kerja koordinator dan eksekutor lebih sesuai kebutuhan operasional.

## Goals
1. Menetapkan status tiket yang final dan konsisten.
2. Mendukung perhitungan SLA dari tiket masuk.
3. Mendukung hasil akhir tiket:
   - selesai
   - perlu tindak lanjut
   - eskalasi
4. Menyesuaikan UI, badge status, filter, dan dashboard KPI dengan status baru.
5. Menjaga agar lifecycle tiket tetap konsisten dengan role dan aturan bisnis yang sudah ada.

## Non-Goals
1. Feature ini belum membahas parsing format laporan Bot Telegram.
2. Feature ini belum membahas feedback otomatis ke Bot Telegram.
3. Feature ini belum membahas integrasi ke API sistem inti Telkom.
4. Feature ini belum membahas reopen penuh multi-step workflow yang kompleks.

## Actors
### Primary Actors
- Pegawai Eksekutor
- Koordinator

### Secondary Actors
- Supervisor
- Super Admin

## Preconditions
1. Tiket sudah tersimpan di tabel `reports`.
2. Role dan RBAC sudah berjalan.
3. Fitur ambil tugas, delegasi, dan batal tugas sudah ada.

## Postconditions
### Jika berhasil
1. Status tiket berubah sesuai aksi operasional.
2. Waktu respons dan penyelesaian tercatat dengan benar.
3. Dashboard dan daftar tiket menampilkan status yang benar.
4. Log aktivitas status tersimpan.

### Jika gagal
1. Status tiket tidak berubah.
2. Data waktu tidak berubah.
3. Sistem menampilkan pesan kesalahan yang sesuai.

## Functional Requirements

### FR-01 — Status Internal Final
Sistem harus mendukung status internal berikut:
- `baru`
- `tersedia`
- `diambil`
- `didelegasikan`
- `selesai`
- `perlu_tindak_lanjut`
- `eskalasi`

### FR-02 — Perhitungan Waktu Respons
Sistem harus menghitung waktu respons sejak `received_at` sampai `taken_at`.

### FR-03 — Perhitungan Waktu Penyelesaian
Sistem harus menghitung waktu penyelesaian sejak `taken_at` sampai `resolved_at`.

### FR-04 — Penyelesaian oleh Eksekutor
Saat eksekutor mengirim hasil penanganan, sistem harus mengizinkan pemilihan hasil akhir:
- selesai
- perlu tindak lanjut
- eskalasi

### FR-05 — Catatan Penyelesaian
Setiap hasil akhir harus disertai catatan penyelesaian.

### FR-06 — Bukti Penyelesaian
Sistem harus tetap mendukung unggahan bukti file pada proses submit hasil akhir.

### FR-07 — Tindak Lanjut
Jika hasil akhir adalah `perlu_tindak_lanjut`, status tiket tidak dianggap final selesai.

### FR-08 — Eskalasi
Jika hasil akhir adalah `eskalasi`, status tiket harus mencerminkan bahwa penanganan perlu diteruskan ke tim lain.

### FR-09 — Filter dan Tampilan Status
Halaman antrean tiket harus mendukung filter dan badge untuk seluruh status final.

### FR-10 — Dashboard KPI
Dashboard supervisor harus menghitung data KPI dengan mempertimbangkan status baru.

## Business Rules
1. Waktu respons dimulai dari tiket masuk ke sistem.
2. Waktu penyelesaian dimulai dari tiket diambil dan berakhir saat hasil akhir disubmit.
3. `selesai` berarti penanganan selesai pada sisi sistem ini.
4. `perlu_tindak_lanjut` berarti tiket belum final dan masih memerlukan proses lanjutan.
5. `eskalasi` berarti tiket perlu diteruskan ke tim lain.
6. Tindak lanjut dan eskalasi tetap harus dicatat di log.
7. Hanya eksekutor penanggung jawab aktif yang boleh submit hasil akhir tiket.
8. Koordinator tetap bisa melihat dan mengelola tiket yang belum final.

## Data Requirements
### Main Table
- `reports`

### Columns impacted
- `status_internal`
- `taken_at`
- `resolved_at`
- `completion_notes`
- `completion_status`

## Acceptance Criteria

### AC-01
Given tiket baru masuk  
When tiket disimpan  
Then status awal sesuai aturan sistem.

### AC-02
Given tiket sudah diambil  
When eksekutor submit hasil akhir `selesai`  
Then status tiket menjadi `selesai`.

### AC-03
Given tiket sudah diambil  
When eksekutor submit hasil akhir `perlu_tindak_lanjut`  
Then status tiket menjadi `perlu_tindak_lanjut`.

### AC-04
Given tiket sudah diambil  
When eksekutor submit hasil akhir `eskalasi`  
Then status tiket menjadi `eskalasi`.

### AC-05
Given supervisor membuka dashboard  
When data KPI dihitung  
Then waktu respons dan penyelesaian memakai definisi SLA yang benar.

### AC-06
Given pengguna membuka daftar tiket  
When filter status dipakai  
Then seluruh status baru dapat difilter dan ditampilkan dengan badge yang sesuai.

## Edge Cases
1. Eksekutor mencoba submit hasil akhir untuk tiket yang bukan tanggung jawabnya.
2. Tiket belum diambil tetapi dipaksa submit hasil akhir.
3. Catatan penyelesaian kosong.
4. File bukti tidak diunggah.
5. Status akhir tidak dipilih.
6. KPI masih menghitung status lama saja.