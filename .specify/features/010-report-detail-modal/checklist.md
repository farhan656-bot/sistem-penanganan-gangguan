# Checklist — Report Detail Modal

## Modal Checklist
- [ ] Tombol Detail tersedia pada daftar antrean laporan
- [ ] Tombol Detail membuka popup/modal
- [ ] Modal memiliki judul Detail Laporan
- [ ] Modal memiliki tombol Tutup/Close
- [ ] Modal dapat ditutup dengan baik
- [ ] Modal responsif pada layar laptop
- [ ] Modal tidak merusak tabel daftar laporan
- [ ] Modal dapat membuka data tiket berbeda

## Main Data Checklist
- [ ] Modal menampilkan Ticket ID
- [ ] Modal menampilkan Order ID
- [ ] Modal menampilkan WO Number jika ada
- [ ] Modal menampilkan Source Channel
- [ ] Modal menampilkan Service Type
- [ ] Modal menampilkan Segment
- [ ] Modal menampilkan Provider
- [ ] Modal menampilkan Telkom Area
- [ ] Modal menampilkan Branch
- [ ] Modal menampilkan Cluster
- [ ] Modal menampilkan STO
- [ ] Modal menampilkan Summary
- [ ] Modal menampilkan Service ID jika ada

## Status and Region Checklist
- [ ] Modal menampilkan region/wilayah
- [ ] Modal menampilkan assigned user jika ada
- [ ] Modal menampilkan status internal
- [ ] Modal menampilkan status WFM
- [ ] Modal menampilkan status Andalas
- [ ] Modal menampilkan completion status jika ada
- [ ] Modal menampilkan completion notes jika ada
- [ ] Status tampil rapi sebagai badge jika tersedia

## Time Checklist
- [ ] Modal menampilkan received_at jika ada
- [ ] Modal menampilkan taken_at jika ada
- [ ] Modal menampilkan resolved_at jika ada
- [ ] Modal menampilkan closed_at jika ada
- [ ] Modal menampilkan created_at
- [ ] Modal menampilkan updated_at jika ada
- [ ] Tanggal tampil dalam format mudah dibaca

## Attachment and Media Checklist
- [ ] Modal menampilkan attachment jika ada
- [ ] Modal menampilkan bukti penyelesaian jika ada
- [ ] Modal menampilkan media Telegram jika ada
- [ ] Modal menampilkan empty state jika attachment kosong
- [ ] Modal menampilkan empty state jika media Telegram kosong
- [ ] Media kosong tidak menyebabkan error
- [ ] Attachment/media dapat dibuka atau dipreview sesuai fitur lama

## Access Safety Checklist
- [ ] Detail modal hanya bisa dibuka user login
- [ ] Route JSON detail dilindungi middleware jika ada
- [ ] Eksekutor mengikuti aturan akses yang sudah ada
- [ ] Koordinator mengikuti aturan akses yang sudah ada
- [ ] Supervisor tetap read-only
- [ ] Super Admin tidak mendapat aksi operasional baru
- [ ] Role middleware tidak rusak

## Regression Checklist
- [ ] Flow ambil tiket tidak berubah
- [ ] Flow selesai tiket tidak berubah
- [ ] Flow delegasi tidak berubah
- [ ] Telegram intake tidak berubah
- [ ] Telegram feedback tidak berubah
- [ ] Region Switch F007 tidak berubah
- [ ] KPI Supervisor tidak berubah
- [ ] Database tidak berubah

## Manual Verification Checklist
- [ ] Login sebagai Eksekutor
- [ ] Buka daftar antrean kerja
- [ ] Klik Detail pada tiket pertama
- [ ] Tutup modal
- [ ] Klik Detail pada tiket lain
- [ ] Login sebagai Koordinator
- [ ] Buka daftar antrean laporan
- [ ] Klik Detail
- [ ] Login sebagai Supervisor
- [ ] Pastikan detail hanya read-only
- [ ] Login sebagai Super Admin jika punya akses antrean
- [ ] Pastikan detail modal tampil
- [ ] Pastikan filter daftar laporan tetap berjalan
- [ ] Pastikan tombol aksi lain tetap berjalan

## Evidence Checklist
- [ ] Screenshot daftar antrean dengan tombol Detail
- [ ] Screenshot modal detail laporan
- [ ] Screenshot modal detail dengan attachment
- [ ] Screenshot modal detail dengan media Telegram
- [ ] Screenshot modal detail tanpa attachment/media
- [ ] Catatan file yang diubah
- [ ] Catatan route baru jika ada
- [ ] Catatan hasil testing manual