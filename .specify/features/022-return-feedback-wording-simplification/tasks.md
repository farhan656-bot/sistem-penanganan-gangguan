
---

# `tasks.md`

```md id="bgjdh6"
# Tasks — Return Feedback Wording Simplification

## Feature ID
F022

## Analysis
- [ ] Cari string `Mohon lengkapi evidence`
- [ ] Cari string `lengkapi evidence`
- [ ] Cari string `perlu_tindak_lanjut`
- [ ] Cari logic feedback Telegram return
- [ ] Cari template pesan return
- [ ] Cari flow return oleh Eksekutor
- [ ] Cari flow return oleh Koordinator

## Wording Update
- [ ] Hapus kalimat permintaan evidence dari pesan return
- [ ] Pastikan catatan return tetap tampil
- [ ] Gunakan fallback catatan jika kosong
- [ ] Jangan ubah pesan selesai
- [ ] Jangan ubah pesan eskalasi
- [ ] Jangan ubah pesan delegasi jika ada

## Return Flow Safety
- [ ] Status tetap berubah ke `perlu_tindak_lanjut`
- [ ] Log return tetap tercatat
- [ ] Telegram feedback return tetap dikirim
- [ ] Return oleh Eksekutor tetap berjalan
- [ ] Return oleh Koordinator tetap berjalan
- [ ] Upload bukti opsional tetap aman

## Regression Safety
- [ ] Jangan ubah database
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah pending media
- [ ] Jangan ubah text enrichment
- [ ] Jangan ubah F017 manual report
- [ ] Jangan ubah F018 coordinator access
- [ ] Jangan ubah F019 modal tabs
- [ ] Jangan ubah F021 button cleanup
- [ ] Jangan ubah RBAC

## Testing
- [ ] Test return oleh Eksekutor
- [ ] Test return oleh Koordinator
- [ ] Cek pesan Telegram return
- [ ] Pastikan tidak ada kalimat evidence
- [ ] Pastikan catatan return tampil
- [ ] Test selesai
- [ ] Test eskalasi DIIT
- [ ] Test log return