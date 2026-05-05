# Checklist — Ticket Lifecycle & Status

## Database Checklist
- [ ] Enum `status_internal` sudah diperbarui
- [ ] Status baru bisa disimpan ke database
- [ ] Data lama tetap aman

## Functional Checklist
- [ ] Eksekutor bisa submit hasil akhir `selesai`
- [ ] Eksekutor bisa submit hasil akhir `perlu_tindak_lanjut`
- [ ] Eksekutor bisa submit hasil akhir `eskalasi`
- [ ] Hanya penanggung jawab aktif yang bisa submit hasil akhir
- [ ] Catatan penyelesaian tetap wajib
- [ ] Bukti file tetap wajib
- [ ] `resolved_at` tercatat saat submit hasil akhir

## UI Checklist
- [ ] List tiket menampilkan badge `selesai`
- [ ] List tiket menampilkan badge `perlu_tindak_lanjut`
- [ ] List tiket menampilkan badge `eskalasi`
- [ ] Filter status mendukung semua status baru
- [ ] Form detail tiket menampilkan pilihan hasil akhir baru

## KPI Checklist
- [ ] Waktu respons tetap dihitung dari `received_at` ke `taken_at`
- [ ] Waktu penyelesaian tetap dihitung dari `taken_at` ke `resolved_at`
- [ ] Tiket `selesai` dihitung final selesai
- [ ] Tiket `perlu_tindak_lanjut` tidak dihitung final selesai
- [ ] Dashboard supervisor tetap tampil normal setelah update

## Logging Checklist
- [ ] Submit `selesai` tercatat di log
- [ ] Submit `perlu_tindak_lanjut` tercatat di log
- [ ] Submit `eskalasi` tercatat di log

## Negative Test Checklist
- [ ] Submit hasil akhir tanpa status gagal
- [ ] Submit hasil akhir tanpa catatan gagal
- [ ] Submit hasil akhir tanpa bukti gagal
- [ ] User non-penanggung jawab tidak bisa submit hasil akhir

## Evidence Checklist
- [ ] Screenshot tiket status selesai
- [ ] Screenshot tiket status perlu tindak lanjut
- [ ] Screenshot tiket status eskalasi
- [ ] Screenshot filter list tiket
- [ ] Screenshot dashboard supervisor setelah perubahan