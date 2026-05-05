# Checklist — Temporary Region Switch Approval

## Request Checklist
- [ ] Eksekutor dapat membuka menu pengajuan switch region
- [ ] Eksekutor dapat mengajukan region tujuan
- [ ] Alasan pengajuan wajib diisi
- [ ] Pengajuan tersimpan dengan status `pending`

## Approval Checklist
- [ ] Koordinator dapat melihat daftar pending request
- [ ] Koordinator dapat approve request
- [ ] Koordinator dapat reject request
- [ ] Request approved memiliki `start_at` dan `end_at`

## Access Checklist
- [ ] Region utama user tetap tidak berubah
- [ ] Saat approval aktif, eksekutor melihat tiket region utama
- [ ] Saat approval aktif, eksekutor melihat tiket region tambahan
- [ ] Saat approval expired, region tambahan tidak lagi tampil

## Safety Checklist
- [ ] Request ke region yang sama dengan home region ditolak
- [ ] Duplicate active request ke region yang sama ditolak
- [ ] Request yang sudah approved tidak bisa diapprove lagi
- [ ] Request yang sudah rejected tidak memberi akses region

## UX Checklist
- [ ] Menu baru tampil untuk eksekutor
- [ ] Menu baru tampil untuk koordinator
- [ ] Status request mudah dipahami
- [ ] Halaman approval mudah dibaca

## Evidence Checklist
- [ ] Screenshot request pending
- [ ] Screenshot request approved
- [ ] Screenshot request rejected
- [ ] Screenshot task pool dua region aktif
- [ ] Screenshot kondisi setelah expiry