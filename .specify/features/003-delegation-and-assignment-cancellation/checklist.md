# Checklist — Delegation and Assignment Cancellation

## Functional Checklist
- [ ] Koordinator dapat membuka form delegasi
- [ ] Koordinator dapat mendelegasikan tiket `tersedia`
- [ ] Koordinator dapat mendelegasikan tiket `diambil`
- [ ] Koordinator dapat mendelegasikan tiket `didelegasikan`
- [ ] Delegasi tidak mengubah district tiket
- [ ] Delegasi mengubah penanggung jawab aktif
- [ ] Koordinator dapat membatalkan assignment aktif
- [ ] Pembatalan assignment mengembalikan tiket ke status `tersedia`

## District Rule Checklist
- [ ] Tiket PDG hanya menampilkan eksekutor BKT
- [ ] Tiket BKT hanya menampilkan eksekutor PDG
- [ ] User tujuan yang dipilih harus role `eksekutor`
- [ ] User tujuan harus aktif

## Visibility Checklist
- [ ] Eksekutor melihat tiket district sendiri
- [ ] Eksekutor melihat tiket yang didelegasikan kepadanya
- [ ] Eksekutor tidak melihat tiket lintas district yang tidak didelegasikan kepadanya

## Access Control Checklist
- [ ] Hanya koordinator bisa delegasi
- [ ] Hanya koordinator bisa batalkan assignment
- [ ] Eksekutor tidak bisa akses aksi delegasi
- [ ] Eksekutor tidak bisa akses aksi batal tugas
- [ ] Supervisor tidak bisa akses aksi delegasi/batal tugas

## Data Integrity Checklist
- [ ] `current_assigned_user_id` berubah saat delegasi
- [ ] `current_region_id` tidak berubah saat delegasi
- [ ] Assignment lama menjadi nonaktif
- [ ] Assignment baru tercatat
- [ ] Saat cancel assignment, `current_assigned_user_id` menjadi NULL
- [ ] Saat cancel assignment, `status_internal` kembali ke `tersedia`

## Logging Checklist
- [ ] Log `delegate_report` tersimpan
- [ ] Log `cancel_assignment` tersimpan
- [ ] Deskripsi log memuat pelaku dan alasan

## Negative Test Checklist
- [ ] Delegasi gagal jika target user kosong
- [ ] Delegasi gagal jika target user bukan eksekutor
- [ ] Delegasi gagal jika target user district-nya salah
- [ ] Delegasi gagal jika target sama dengan assignee aktif
- [ ] Pembatalan gagal jika tiket tidak punya assignee aktif
- [ ] Pembatalan gagal jika status tiket tidak valid

## Evidence Checklist
- [ ] Screenshot form delegasi PDG ke BKT
- [ ] Screenshot form delegasi BKT ke PDG
- [ ] Screenshot tiket setelah assignee berubah
- [ ] Screenshot setelah assignment dibatalkan
- [ ] Screenshot log delegasi
- [ ] Screenshot log pembatalan