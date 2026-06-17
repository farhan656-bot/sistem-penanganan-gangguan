# Feature Spec — Telegram Sender Identity Capture

## Feature ID
F025

## Feature Name
Telegram Sender Identity Capture

## Summary
Fitur ini menambahkan pencatatan identitas pengirim laporan dari Telegram. Sistem akan menyimpan Telegram sender ID, username, first name, dan last name dari pengirim laporan saat pesan Telegram diterima oleh bot. Data tersebut kemudian ditampilkan pada detail laporan agar asal laporan lebih mudah ditelusuri.

## Important Update
Kolom identitas pengirim Telegram sudah tersedia pada tabel `reports`.

Kolom yang sudah tersedia:
- `telegram_sender_id`
- `telegram_sender_username`
- `telegram_sender_first_name`
- `telegram_sender_last_name`

Jangan menjalankan ALTER TABLE lagi.
Jangan mengubah struktur database lagi pada F025.

## Business Background
Pembimbing lapangan menyarankan agar pengirim laporan Telegram juga dapat dibaca username-nya. Hal ini berguna agar laporan yang masuk melalui bot Telegram lebih mudah ditelusuri, terutama jika laporan berasal dari grup atau beberapa orang pelapor.

## Problem Statement
Saat ini sistem sudah menyimpan `telegram_chat_id` dan `telegram_message_id`, tetapi belum menyimpan identitas akun pengirim laporan. Akibatnya, sistem hanya mengetahui dari chat mana laporan berasal, tetapi belum menampilkan siapa user Telegram yang mengirim laporan tersebut.

## Goals
1. Menyimpan Telegram sender ID pengirim laporan.
2. Menyimpan Telegram username pengirim jika tersedia.
3. Menyimpan first name pengirim jika tersedia.
4. Menyimpan last name pengirim jika tersedia.
5. Menampilkan identitas pengirim Telegram pada detail laporan.
6. Menjaga Telegram intake tetap berjalan.
7. Menjaga parsing laporan tetap berjalan.
8. Menjaga laporan lama tetap aman walaupun data pengirim kosong.

## Non-Goals
1. Tidak mengubah database lagi.
2. Tidak membuat tabel baru.
3. Tidak mengubah format utama parsing laporan Telegram.
4. Tidak mengubah media Telegram.
5. Tidak mengubah flow penyelesaian tiket.
6. Tidak mengubah flow return.
7. Tidak mengubah flow eskalasi.
8. Tidak mengubah F017 laporan manual.
9. Tidak mengubah F018 akses Koordinator.
10. Tidak mengubah F019 modal tab.
11. Tidak mengubah F021 button cleanup.
12. Tidak mengubah F022 wording return.
13. Tidak mengubah F023 validasi.
14. Tidak membuat integrasi profile Telegram tambahan.
15. Tidak melakukan validasi akun Telegram terhadap database user internal.

## Actors
- Pelapor Telegram
- Eksekutor
- Koordinator
- Supervisor
- Super Admin

## Data Source
Data pengirim diambil dari object pesan Telegram, biasanya dari:

```js
msg.from