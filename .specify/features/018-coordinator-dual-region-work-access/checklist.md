# Checklist — Coordinator Dual Region Work Access

## Coordinator Access Checklist
- [ ] Koordinator dapat melihat laporan PDG
- [ ] Koordinator dapat melihat laporan BKT
- [ ] Koordinator tidak perlu region switch
- [ ] Koordinator dapat filter PDG
- [ ] Koordinator dapat filter BKT
- [ ] Koordinator dapat membuka detail laporan PDG
- [ ] Koordinator dapat membuka detail laporan BKT

## Coordinator Action Checklist
- [ ] Delegasi laporan PDG tetap berjalan
- [ ] Delegasi laporan BKT tetap berjalan
- [ ] Batalkan penugasan tetap berjalan jika tersedia
- [ ] Aksi Koordinator tidak error pada laporan region berbeda
- [ ] Tidak ada aksi baru yang tidak diperlukan

## Executor Safety Checklist
- [ ] Eksekutor PDG tanpa switch hanya melihat PDG
- [ ] Eksekutor BKT tanpa switch hanya melihat BKT
- [ ] Eksekutor dengan switch aktif melihat region tambahan
- [ ] Eksekutor dengan switch expired tidak melihat region tambahan
- [ ] Region Switch F007 tetap berjalan
- [ ] UI Eksekutor tidak berubah

## UI Checklist
- [ ] Filter region Koordinator menampilkan PDG
- [ ] Filter region Koordinator menampilkan BKT
- [ ] Badge region tetap tampil jelas
- [ ] Empty state tetap rapi
- [ ] UI Supervisor tidak berubah
- [ ] UI Super Admin tidak berubah

## Regression Checklist
- [ ] Telegram intake tetap berjalan
- [ ] Telegram parsing tidak berubah
- [ ] Pending media tidak berubah
- [ ] Text enrichment tidak berubah
- [ ] Return feedback tidak berubah
- [ ] Eskalasi DIIT tidak berubah
- [ ] Upload bukti tidak berubah
- [ ] Manual report F017 tidak berubah
- [ ] KPI Supervisor tidak berubah
- [ ] Database tidak berubah

## Manual Testing Checklist
- [ ] Login Koordinator
- [ ] Buka daftar laporan
- [ ] Cek laporan PDG
- [ ] Cek laporan BKT
- [ ] Filter PDG
- [ ] Filter BKT
- [ ] Buka detail PDG
- [ ] Buka detail BKT
- [ ] Test delegasi
- [ ] Login Eksekutor PDG
- [ ] Pastikan hanya PDG tanpa switch
- [ ] Login Eksekutor BKT
- [ ] Pastikan hanya BKT tanpa switch
- [ ] Test Eksekutor dengan switch aktif
- [ ] Login Supervisor
- [ ] Pastikan read-only
- [ ] Kirim laporan Telegram baru

## Evidence Checklist
- [ ] Screenshot Koordinator melihat semua region
- [ ] Screenshot filter PDG
- [ ] Screenshot filter BKT
- [ ] Screenshot Eksekutor tetap region sendiri
- [ ] Screenshot Region Switch tetap berjalan
- [ ] Catatan file yang diubah
- [ ] Catatan hasil testing