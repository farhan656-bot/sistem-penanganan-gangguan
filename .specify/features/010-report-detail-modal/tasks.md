# Tasks — Report Detail Modal

## Feature ID
F010

## Analysis
- [ ] Review constitution project
- [ ] Review copilot/custom instructions
- [ ] Review struktur route laporan
- [ ] Review controller laporan
- [ ] Review model laporan
- [ ] Review view daftar antrean laporan
- [ ] Review view detail laporan lama
- [ ] Review data attachment laporan
- [ ] Review data media Telegram
- [ ] Pastikan F010 hanya mengubah tampilan detail menjadi modal

## Existing Detail Flow Review
- [ ] Cari tombol/link Detail pada daftar laporan
- [ ] Cari route detail laporan lama
- [ ] Cari controller detail laporan lama
- [ ] Cari model query detail laporan
- [ ] Catat field yang sudah ditampilkan pada detail lama
- [ ] Catat field yang tersedia pada daftar laporan
- [ ] Catat apakah attachment tampil pada detail lama
- [ ] Catat apakah media Telegram tampil pada detail lama

## Modal Structure
- [ ] Tambahkan modal Bootstrap 5 pada halaman daftar laporan
- [ ] Modal memiliki title “Detail Laporan”
- [ ] Modal memiliki body untuk data tiket
- [ ] Modal memiliki tombol Tutup/Close
- [ ] Modal responsif pada layar laptop
- [ ] Modal tidak merusak tabel daftar laporan
- [ ] Modal tidak menambahkan aksi operasional baru

## Detail Button
- [ ] Ubah tombol Detail agar membuka modal
- [ ] Tambahkan report id pada tombol Detail
- [ ] Pastikan tombol Detail tetap tampil rapi
- [ ] Pastikan tombol Detail tidak menyebabkan reload penuh jika modal digunakan
- [ ] Pertahankan route detail lama sebagai fallback jika diperlukan

## Detail Data
- [ ] Tampilkan Ticket ID
- [ ] Tampilkan Order ID
- [ ] Tampilkan WO Number jika ada
- [ ] Tampilkan Source Channel
- [ ] Tampilkan Service Type
- [ ] Tampilkan Segment
- [ ] Tampilkan Provider
- [ ] Tampilkan Telkom Area
- [ ] Tampilkan Branch
- [ ] Tampilkan Cluster
- [ ] Tampilkan STO
- [ ] Tampilkan Summary
- [ ] Tampilkan Service ID jika ada
- [ ] Tampilkan Region
- [ ] Tampilkan Assigned User jika ada
- [ ] Tampilkan Status Internal
- [ ] Tampilkan Status WFM
- [ ] Tampilkan Status Andalas
- [ ] Tampilkan Completion Status jika ada
- [ ] Tampilkan Completion Notes jika ada
- [ ] Tampilkan Received At jika ada
- [ ] Tampilkan Taken At jika ada
- [ ] Tampilkan Resolved At jika ada
- [ ] Tampilkan Closed At jika ada
- [ ] Tampilkan Created At
- [ ] Tampilkan Updated At jika ada

## JSON Endpoint If Needed
- [ ] Tentukan apakah modal butuh endpoint JSON
- [ ] Jika ya, buat route detail JSON
- [ ] Lindungi route dengan middleware login
- [ ] Terapkan aturan akses yang sama dengan detail lama
- [ ] Controller memanggil model
- [ ] Query detail tetap berada di model
- [ ] Response JSON tidak mengirim data sensitif
- [ ] Field NULL dikirim aman

## Attachment and Telegram Media
- [ ] Ambil data attachment laporan jika tersedia
- [ ] Tampilkan attachment sebagai link atau preview
- [ ] Tampilkan empty state jika attachment kosong
- [ ] Ambil data media Telegram jika tersedia
- [ ] Tampilkan media Telegram sebagai link atau preview
- [ ] Tampilkan empty state jika media Telegram kosong
- [ ] Pastikan media kosong tidak menyebabkan error

## UI Formatting
- [ ] Field NULL tampil sebagai `-`
- [ ] Tanggal diformat agar mudah dibaca
- [ ] Summary panjang tidak merusak modal
- [ ] Status tampil sebagai badge jika komponen badge tersedia
- [ ] Section detail dikelompokkan dengan rapi
- [ ] Modal dapat ditutup setelah dibuka
- [ ] Modal dapat membuka tiket berbeda tanpa data tertukar

## RBAC Safety
- [ ] Route detail modal hanya untuk user login
- [ ] Eksekutor mengikuti akses tiket yang sudah ada
- [ ] Koordinator mengikuti akses tiket yang sudah ada
- [ ] Supervisor tetap read-only
- [ ] Super Admin tidak mendapat aksi operasional baru
- [ ] Middleware role tidak diubah sembarangan

## Regression Safety
- [ ] Jangan ubah flow ambil tiket
- [ ] Jangan ubah flow selesai tiket
- [ ] Jangan ubah flow delegasi tiket
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram feedback
- [ ] Jangan ubah Region Switch F007
- [ ] Jangan ubah KPI Supervisor
- [ ] Jangan ubah database

## Functional Testing
- [ ] Test login Eksekutor
- [ ] Test buka daftar antrean Eksekutor
- [ ] Test buka detail modal dari tiket tersedia
- [ ] Test buka detail modal dari tiket diambil
- [ ] Test login Koordinator
- [ ] Test buka detail modal dari daftar Koordinator
- [ ] Test login Supervisor
- [ ] Test detail tetap read-only
- [ ] Test login Super Admin jika punya akses antrean
- [ ] Test modal untuk tiket tanpa attachment
- [ ] Test modal untuk tiket dengan attachment
- [ ] Test modal untuk tiket dengan media Telegram
- [ ] Test membuka modal beberapa tiket berbeda
- [ ] Test filter daftar laporan tetap berjalan
- [ ] Test tombol aksi lain tetap berjalan

## Documentation
- [ ] Screenshot daftar antrean dengan tombol Detail
- [ ] Screenshot modal detail laporan
- [ ] Screenshot modal detail dengan attachment/media
- [ ] Screenshot modal detail tiket tanpa attachment/media
- [ ] Catat file view yang berubah
- [ ] Catat route baru jika ada
- [ ] Catat controller/model yang berubah jika ada
- [ ] Catat hasil testing manual