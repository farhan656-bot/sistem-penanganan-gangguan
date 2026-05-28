# Checklist — Remove Manual Report Entry

## Manual Report UI Checklist
- [ ] Menu laporan manual tidak muncul di sidebar Super Admin
- [ ] Menu laporan manual tidak muncul di sidebar Koordinator
- [ ] Shortcut laporan manual tidak muncul di dashboard Super Admin
- [ ] Shortcut laporan manual tidak muncul di dashboard Koordinator
- [ ] Tombol tambah laporan manual tidak muncul dari halaman utama
- [ ] Form laporan manual tidak ditautkan dari UI
- [ ] Layout dashboard tetap rapi setelah menu/card dihapus

## Data Safety Checklist
- [ ] Tabel `reports` tidak dihapus
- [ ] Data laporan lama tidak dihapus
- [ ] Data laporan Telegram tetap tampil
- [ ] Tidak ada perubahan struktur database
- [ ] Tidak ada migration/ALTER TABLE untuk F009

## Telegram Safety Checklist
- [ ] Telegram bot tetap berjalan
- [ ] Telegram intake tetap menerima laporan valid
- [ ] Ticket ID duplikat tetap ditolak
- [ ] Laporan Telegram tetap masuk status `tersedia`
- [ ] Telegram parsing tidak berubah
- [ ] Pending media tidak berubah
- [ ] Text enrichment tidak berubah

## Role Safety Checklist
- [ ] Super Admin tetap bisa login
- [ ] Super Admin tetap bisa mengelola user
- [ ] Koordinator tetap bisa login
- [ ] Koordinator tetap bisa membuka antrean laporan
- [ ] Koordinator tetap bisa approval region switch
- [ ] Eksekutor tetap bisa login
- [ ] Eksekutor tetap bisa membuka antrean kerja
- [ ] Supervisor tetap bisa login
- [ ] Supervisor tetap read-only

## Route Safety Checklist
- [ ] Route manual report tidak muncul di UI
- [ ] Tidak ada link aktif menuju form laporan manual
- [ ] Jika route manual report masih ada, route tidak merusak sistem
- [ ] Tidak ada route penting lain yang terhapus
- [ ] Middleware role tidak berubah

## Manual Verification Checklist
- [ ] Login sebagai Super Admin
- [ ] Cek sidebar Super Admin
- [ ] Cek dashboard Super Admin
- [ ] Login sebagai Koordinator
- [ ] Cek sidebar Koordinator
- [ ] Cek dashboard Koordinator
- [ ] Login sebagai Eksekutor
- [ ] Cek dashboard Eksekutor
- [ ] Login sebagai Supervisor
- [ ] Cek dashboard Supervisor
- [ ] Buka daftar antrean laporan
- [ ] Kirim laporan dari Telegram
- [ ] Pastikan laporan Telegram masuk ke antrean

## Evidence Checklist
- [ ] Screenshot sidebar Super Admin
- [ ] Screenshot dashboard Super Admin
- [ ] Screenshot sidebar Koordinator
- [ ] Screenshot dashboard Koordinator
- [ ] Screenshot daftar antrean laporan
- [ ] Screenshot laporan Telegram masuk
- [ ] Catatan file yang diubah
- [ ] Catatan hasil testing manual