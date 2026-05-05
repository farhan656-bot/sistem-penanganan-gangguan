# Checklist — Manual Report Entry

## Access Checklist
- [ ] Koordinator dapat membuka form input manual
- [ ] Super Admin dapat membuka form input manual
- [ ] Role lain tidak dapat membuka form input manual

## Functional Checklist
- [ ] User dapat mengisi data tiket manual
- [ ] Ticket ID tersimpan
- [ ] Order ID tersimpan
- [ ] Summary tersimpan
- [ ] District awal tersimpan
- [ ] `source_channel` menjadi `manual`
- [ ] `status_internal` menjadi `tersedia`
- [ ] `received_at` terisi otomatis

## Validation Checklist
- [ ] `ticket_id` wajib
- [ ] `summary` wajib
- [ ] district wajib
- [ ] ticket_id duplikat ditolak

## Queue Checklist
- [ ] Tiket hasil input manual muncul di daftar antrean
- [ ] Tiket bisa diambil sesuai rule yang sudah ada
- [ ] District tiket terbaca dengan benar

## Logging Checklist
- [ ] Log `create_manual_report` tersimpan
- [ ] Deskripsi log memuat siapa yang input dan ticket_id

## UI Checklist
- [ ] Form tampil rapi
- [ ] Dropdown district berfungsi
- [ ] Tombol tambah laporan hanya muncul pada role yang benar
- [ ] Flash message sukses/gagal tampil dengan benar

## Negative Test Checklist
- [ ] Submit tanpa ticket_id gagal
- [ ] Submit tanpa summary gagal
- [ ] Submit tanpa district gagal
- [ ] Submit ticket_id duplikat gagal
- [ ] User tanpa hak akses ditolak

## Evidence Checklist
- [ ] Screenshot form input manual
- [ ] Screenshot hasil input berhasil
- [ ] Screenshot tiket muncul di task pool
- [ ] Screenshot error duplicate ticket_id
- [ ] Screenshot log create_manual_report