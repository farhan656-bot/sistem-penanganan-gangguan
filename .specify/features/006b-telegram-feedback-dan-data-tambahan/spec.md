# Feature Spec — Telegram Feedback dan Data Tambahan

## Feature ID
F006B

## Feature Name
Telegram Feedback dan Data Tambahan

## Summary
Fitur ini melanjutkan integrasi Bot Telegram setelah intake dasar selesai. Sistem harus mengirim feedback status operasional ke Telegram ketika tiket diambil, sedang dikerjakan, dan selesai. Selain itu, sistem harus dapat menerima pesan tambahan yang terkait dengan tiket yang sudah ada dan menyatukannya ke tiket tersebut.

## Business Background
Diskusi lapangan menunjukkan bahwa bot tidak hanya dipakai untuk menerima tiket baru, tetapi juga untuk memberikan feedback operasional, seperti:
- tiket diterima,
- tiket diambil (assigned),
- tiket sedang dikerjakan (in progress),
- tiket selesai.
Selain itu, terdapat contoh bot yang menerima data tambahan panjang dan memberi balasan bahwa data tambahan otomatis disatukan ke tiket yang sama. Pada laporan tertentu juga ada sambungan berupa foto dokumentasi lokasi atau tempat pelaporan. 

## Problem Statement
Setelah intake dasar selesai, sistem masih belum lengkap jika:
- bot belum mengirim feedback status dari aksi operasional di dashboard,
- data tambahan dari pelapor belum dapat disatukan ke tiket lama,
- pelapor tidak mendapat kepastian bahwa tiketnya sedang diproses atau sudah selesai.

## Goals
1. Mengirim feedback Telegram saat tiket diambil.
2. Mengirim feedback Telegram saat tiket masuk status dikerjakan / in progress.
3. Mengirim feedback Telegram saat tiket selesai.
4. Menerima data tambahan untuk tiket yang sudah ada.
5. Menggabungkan data tambahan ke tiket yang sama.
6. Menyimpan jejak aktivitas integrasi Telegram secara aman.

## Non-Goals
1. Belum membangun NLP/AI parsing bebas.
2. Belum membuat workflow grup Telegram.
3. Belum membuat sinkronisasi dua arah penuh dengan sistem inti Telkom.
4. Belum mengolah foto sebagai OCR atau ekstraksi otomatis.

## Actors

### Primary Actors
- Pelapor
- Pegawai Eksekutor

### Secondary Actors
- Koordinator
- Sistem Bot Telegram

## Preconditions
1. F006A intake dasar sudah berjalan.
2. Tiket dari Telegram sudah tersimpan dengan `telegram_chat_id`.
3. Web dashboard sudah memiliki aksi ambil tugas dan penyelesaian tiket.
4. Bot Telegram aktif dalam mode polling.

## Postconditions

### Jika berhasil
1. Bot mengirim feedback sesuai aksi operasional.
2. Data tambahan tersimpan dan dikaitkan ke tiket yang tepat.
3. Pelapor mendapat notifikasi status yang relevan.
4. Log aktivitas integrasi Telegram tercatat.

### Jika gagal
1. Aksi operasional pada web tetap tidak boleh rusak.
2. Kegagalan kirim feedback harus tercatat.
3. Sistem tidak boleh membuat tiket duplikat karena data tambahan.

## Functional Requirements

### FR-01 — Feedback Ticket Accepted
Sistem sudah memiliki feedback tiket diterima dari F006A dan tetap harus dipertahankan.

### FR-02 — Feedback Assigned
Saat tiket diambil oleh eksekutor, sistem harus mengirim feedback ke Telegram bahwa tiket telah diambil (assigned) oleh nama eksekutor. Contoh pola balasan sudah terlihat pada diskusi lapangan. 

### FR-03 — Feedback In Progress
Saat tiket dinyatakan sedang dikerjakan, sistem harus mengirim feedback ke Telegram bahwa tiket sedang dikerjakan oleh nama eksekutor. Pola balasan ini juga ada pada contoh lapangan. 

### FR-04 — Feedback Completed
Saat tiket selesai, sistem harus mengirim feedback ke Telegram bahwa pengerjaan tiket telah selesai dan pelapor diminta mengecek kembali. Pola ini juga sudah dicontohkan di diskusi lapangan. 

### FR-05 — Additional Data Merge
Jika pelapor mengirim data tambahan yang masih merujuk ke tiket yang sudah ada, sistem harus mengenali ticket ID dan mengaitkan data tambahan tersebut ke tiket yang sama, bukan membuat tiket baru. Hal ini sesuai dengan contoh balasan “Data Tambahan Diterima! Otomatis disatukan ke tiket …”. 

### FR-06 — Additional Data Acknowledgement
Saat data tambahan berhasil diterima, bot harus mengirim balasan bahwa data tambahan telah diterima dan disatukan ke tiket.

### FR-07 — Attachment Handling Baseline
Sistem harus menyiapkan dukungan penerimaan media/foto sebagai data tambahan yang terkait tiket, minimal menyimpan referensi file Telegram atau metadata dasar untuk tahap awal. Diskusi lapangan menunjukkan adanya sambungan berupa foto dokumentasi lokasi/tempat pelaporan. 

### FR-08 — No Duplicate Ticket on Additional Data
Pesan tambahan tidak boleh membuat tiket baru jika ticket ID sudah ada.

### FR-09 — Error Feedback
Jika ticket ID pada data tambahan tidak ditemukan atau format tidak valid, bot harus mengirim balasan error yang aman dan jelas.

### FR-10 — Logging
Sistem harus mencatat:
- feedback assigned,
- feedback in progress,
- feedback completed,
- data tambahan diterima,
- kegagalan kirim feedback.

## Business Rules
1. Data tambahan harus merujuk ke ticket ID yang sudah ada.
2. Feedback assigned dikirim saat aksi ambil tugas berhasil.
3. Feedback in progress dikirim saat status kerja masuk tahap pengerjaan.
4. Feedback completed dikirim saat tiket selesai.
5. Kegagalan kirim Telegram tidak boleh membatalkan transaksi utama web dashboard.
6. Data tambahan harus dianggap sebagai pelengkap tiket, bukan tiket baru. 

## Data Requirements

### Main Tables
- `reports`
- `report_logs`

### Supporting Tables (recommended if needed)
- `report_additional_data` atau tabel serupa untuk data tambahan
- atau menggunakan tabel log/attachment yang sudah ada jika dipilih

### Important Existing Fields
- `ticket_id`
- `order_id`
- `telegram_chat_id`
- `telegram_message_id`
- `status_internal`
- `current_assigned_user_id`
- `completion_status`

## Acceptance Criteria

### AC-01
Given tiket diambil oleh eksekutor  
When aksi ambil tugas berhasil  
Then bot mengirim pesan assigned ke chat Telegram tiket tersebut.

### AC-02
Given tiket masuk tahap dikerjakan  
When aksi in-progress dipicu  
Then bot mengirim pesan bahwa tiket sedang dikerjakan.

### AC-03
Given tiket selesai  
When konfirmasi selesai berhasil  
Then bot mengirim pesan bahwa tiket telah selesai dikerjakan.

### AC-04
Given pelapor mengirim data tambahan untuk ticket ID yang sudah ada  
When sistem memproses pesan  
Then data tambahan dikaitkan ke tiket yang sama dan bot mengirim balasan konfirmasi.

### AC-05
Given pelapor mengirim data tambahan dengan ticket ID yang tidak ditemukan  
When sistem memproses pesan  
Then bot menolak dan memberi balasan yang sesuai.

## Edge Cases
1. `telegram_chat_id` tiket kosong.
2. Bot gagal kirim pesan feedback.
3. Ticket ID pada data tambahan tidak ada.
4. Data tambahan terlalu panjang.
5. Pelapor mengirim media tanpa ticket ID yang jelas.
6. Tiket selesai tetapi feedback Telegram gagal terkirim.