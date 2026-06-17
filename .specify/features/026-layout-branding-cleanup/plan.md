
---

# `plan.md`

```md id="fhm4il"
# Technical Plan — Layout & Branding Cleanup

## Feature ID
F026

## Feature Name
Layout & Branding Cleanup

## Objective
Merapikan layout sistem, branding, sidebar, topbar, dan tombol aksi agar sistem lebih nyaman digunakan dan terlihat lebih profesional.

## Important Boundary
F026 hanya memperbaiki tampilan layout dan branding.

Jangan ubah:
- database
- Telegram intake
- Telegram parsing
- flow ticketing
- flow selesai
- flow return
- flow eskalasi
- upload file
- F017 manual report
- F018 coordinator work access
- F019 modal tabs
- F021 button cleanup rules
- F022 return wording
- F023 validation
- F024 upload validation
- F025 telegram sender identity

## Main Scope
1. Rapikan tombol Detail dan Kerjakan.
2. Jangan gunakan dropdown aksi.
3. Hapus informasi "Login sebagai" dari sidebar.
4. Ganti logo TG dengan logo Telkom.
5. Rapikan spacing sidebar/topbar.
6. Rapikan kolom Aksi pada tabel daftar antrean kerja.

## Files Likely Impacted

Kemungkinan file:

```text
views/partials/sidebar.ejs
views/partials/topbar.ejs
views/reports/index.ejs
views/koordinator/reports/index.ejs
views/dashboard/*.ejs
public/css/app.css
public/images/telkom-logo.png