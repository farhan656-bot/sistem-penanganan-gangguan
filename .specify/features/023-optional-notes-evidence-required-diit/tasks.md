
---

# `tasks.md`

```md
# Tasks — Optional Notes and Evidence with Required DIIT Code

## Feature ID
F023

## Analysis
- [ ] Cari form penyelesaian tiket
- [ ] Cari form update pengerjaan
- [ ] Cari input `completion_notes`
- [ ] Cari input upload bukti
- [ ] Cari input `diit_code`
- [ ] Cari validasi status `selesai`
- [ ] Cari validasi status `perlu_tindak_lanjut`
- [ ] Cari validasi status `eskalasi`
- [ ] Cari flow Koordinator F018

## Frontend Validation
- [ ] Catatan tidak required untuk selesai
- [ ] Bukti tidak required untuk selesai
- [ ] Catatan required untuk perlu_tindak_lanjut
- [ ] Bukti tidak required untuk perlu_tindak_lanjut
- [ ] Catatan tidak required untuk eskalasi
- [ ] Bukti tidak required untuk eskalasi
- [ ] Kode DIIT required untuk eskalasi
- [ ] Label/help text sesuai status
- [ ] Tidak ada required HTML yang salah

## Backend Validation
- [ ] Status selesai boleh tanpa catatan
- [ ] Status selesai boleh tanpa bukti
- [ ] Status perlu_tindak_lanjut wajib catatan
- [ ] Status perlu_tindak_lanjut boleh tanpa bukti
- [ ] Status eskalasi wajib kode DIIT
- [ ] Status eskalasi boleh tanpa catatan
- [ ] Status eskalasi boleh tanpa bukti
- [ ] Bukti tetap tersimpan jika diunggah
- [ ] Kode DIIT disimpan untuk eskalasi
- [ ] Kode DIIT tidak wajib untuk status lain

## Telegram Feedback
- [ ] Feedback selesai tetap berjalan
- [ ] Feedback return tetap mengikuti F022
- [ ] Feedback eskalasi tetap memakai kode DIIT
- [ ] Tidak ada perubahan Telegram intake
- [ ] Tidak ada perubahan parsing Telegram

## Report Logs
- [ ] Log selesai tercatat
- [ ] Log return tercatat
- [ ] Log eskalasi tercatat
- [ ] Actor Eksekutor tercatat
- [ ] Actor Koordinator tercatat

## Coordinator and Executor
- [ ] Eksekutor bisa selesai tanpa catatan/bukti
- [ ] Koordinator bisa selesai tanpa catatan/bukti
- [ ] Eksekutor bisa return dengan catatan tanpa bukti
- [ ] Koordinator bisa return dengan catatan tanpa bukti
- [ ] Eksekutor bisa eskalasi dengan kode DIIT tanpa catatan/bukti
- [ ] Koordinator bisa eskalasi dengan kode DIIT tanpa catatan/bukti

## Regression Safety
- [ ] Jangan ubah database
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah F017 manual report
- [ ] Jangan ubah F018 coordinator access
- [ ] Jangan ubah F019 modal tabs
- [ ] Jangan ubah F021 button cleanup
- [ ] Jangan ubah F022 wording return
- [ ] Jangan ubah RBAC

## Testing
- [ ] Test selesai tanpa catatan/bukti
- [ ] Test selesai dengan catatan
- [ ] Test selesai dengan bukti
- [ ] Test return tanpa catatan
- [ ] Test return dengan catatan
- [ ] Test eskalasi tanpa kode DIIT
- [ ] Test eskalasi dengan kode DIIT
- [ ] Test Telegram feedback
- [ ] Test report_logs