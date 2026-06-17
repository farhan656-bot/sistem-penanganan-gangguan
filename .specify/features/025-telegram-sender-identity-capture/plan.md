
---

# `plan.md`

```md id="0b6b15"
# Technical Plan — Telegram Sender Identity Capture

## Feature ID
F025

## Feature Name
Telegram Sender Identity Capture

## Objective
Menyimpan identitas akun Telegram pengirim laporan ke tabel `reports` dan menampilkannya pada modal/detail laporan agar sumber laporan lebih mudah ditelusuri.

## Existing Context
Sistem saat ini sudah memiliki:
- Bot Telegram
- Telegram intake
- parsing laporan Telegram
- `telegram_chat_id`
- `telegram_message_id`
- tabel `reports`
- modal detail laporan F019
- media Telegram
- feedback Telegram
- report logs

## Important Boundary
F025 hanya menambahkan penyimpanan dan tampilan identitas pengirim Telegram.

Jangan ubah:
- database schema
- Telegram parsing utama
- media Telegram
- feedback Telegram
- flow selesai
- flow return
- flow eskalasi
- F017 manual report
- F018 coordinator access
- F019 modal tabs
- F021 button cleanup
- F022 wording return
- F023 validation rules

## Database Impact
Tidak ada perubahan database pada F025 karena kolom sudah tersedia.

Kolom yang digunakan:
```text id="sviy34"
telegram_sender_id
telegram_sender_username
telegram_sender_first_name
telegram_sender_last_name