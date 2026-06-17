# Feature Spec — Layout & Branding Cleanup

## Feature ID
F026

## Feature Name
Layout & Branding Cleanup

## Summary
Fitur ini merapikan tampilan layout sistem, khususnya pada sidebar, branding/logo, topbar, dan tombol aksi pada daftar antrean kerja. Tombol aksi seperti Detail dan Kerjakan harus tampil rapi, langsung terlihat, dan tidak menggunakan dropdown agar pekerjaan pegawai tetap cepat.

## Business Background
Setelah revisi fitur utama selesai, ditemukan beberapa masalah tampilan yang memengaruhi kenyamanan pengguna. Tombol aksi pada daftar antrean kerja terlihat tidak rapi, informasi login muncul ganda, dan logo sistem masih menggunakan placeholder "TG". Tampilan perlu dirapikan agar sistem terlihat lebih profesional dan nyaman digunakan oleh pegawai.

## Problem Statement
Pada halaman daftar antrean kerja, tombol Detail dan Kerjakan masih terlihat tidak beraturan. Selain itu, sidebar masih menampilkan informasi "Login sebagai" padahal identitas pengguna sudah ada di topbar kanan atas. Logo "TG" juga perlu diganti dengan logo Telkom agar branding sistem lebih sesuai dengan objek penelitian.

## Goals
1. Merapikan tampilan tombol Detail dan Kerjakan.
2. Menampilkan tombol aksi secara langsung tanpa dropdown.
3. Menghapus bagian "Login sebagai" dari sidebar.
4. Mengganti logo placeholder "TG" dengan logo Telkom.
5. Merapikan spacing sidebar dan topbar.
6. Merapikan kolom Aksi pada tabel daftar antrean kerja.
7. Menjaga tombol Detail tetap membuka modal F019.
8. Menjaga tombol Kerjakan tetap menjalankan flow kerja yang sudah ada.
9. Meningkatkan kenyamanan visual pengguna.

## Non-Goals
1. Tidak mengubah database.
2. Tidak mengubah flow ticketing.
3. Tidak mengubah Telegram intake.
4. Tidak mengubah Telegram parsing.
5. Tidak mengubah upload file.
6. Tidak mengubah validasi DIIT.
7. Tidak mengubah F017 laporan manual.
8. Tidak mengubah F018 akses kerja Koordinator.
9. Tidak mengubah F019 modal tabs.
10. Tidak mengubah F021 button cleanup logic.
11. Tidak mengubah F022 wording return.
12. Tidak mengubah F023 validation.
13. Tidak mengubah F024 upload strategy.
14. Tidak mengubah F025 telegram sender identity.
15. Tidak membuat dropdown aksi.

## Actors
- Eksekutor
- Koordinator
- Supervisor
- Super Admin

## Functional Requirements

### FR-01 — Clean Action Buttons
Tombol Detail dan Kerjakan harus tampil rapi dalam kolom Aksi.

### FR-02 — No Action Dropdown
Sistem tidak boleh menggunakan dropdown untuk aksi utama pada daftar antrean kerja.

### FR-03 — Direct Action Buttons
Aksi utama harus langsung terlihat agar pegawai tidak perlu klik tambahan.

### FR-04 — Preserve Detail Button
Tombol Detail tetap membuka modal detail laporan.

### FR-05 — Preserve Work Button
Tombol Kerjakan tetap menjalankan flow pengerjaan sesuai role dan status tiket.

### FR-06 — Action Column Width
Kolom Aksi harus cukup lebar agar tombol tidak bertumpuk secara berantakan.

### FR-07 — Remove Sidebar Login Info
Bagian "Login sebagai" di sidebar harus dihapus karena identitas user sudah tersedia di topbar.

### FR-08 — Replace TG Logo
Logo placeholder "TG" harus diganti dengan logo Telkom.

### FR-09 — Preserve Topbar User Identity
Identitas user di pojok kanan atas tetap ditampilkan.

### FR-10 — Responsive Layout
Tampilan tetap rapi pada ukuran layar desktop dan tidak merusak struktur tabel.

## UI Rules

### Action Button Rules
Tombol pada kolom Aksi:

```text
[Detail] [Kerjakan]