# Technical Plan — Optional Notes and Evidence with Required DIIT Code

## Feature ID
F023

## Feature Name
Optional Notes and Evidence with Required DIIT Code

## Objective
Menyesuaikan validasi form dan backend untuk proses selesai, return, dan eskalasi agar catatan serta bukti bersifat opsional sesuai status, dengan kode DIIT tetap wajib khusus status eskalasi.

## Existing Context
Sistem sudah memiliki:
- status `selesai`
- status `perlu_tindak_lanjut`
- status `eskalasi`
- kolom `completion_notes`
- kolom `completion_status`
- kolom `diit_code`
- upload bukti penyelesaian
- paste screenshot F016
- feedback Telegram
- report_logs
- F018 Koordinator dapat membantu pekerjaan tiket
- F022 wording return sudah disederhanakan

## Important Boundary
F023 hanya mengubah validasi input dan label/help text jika diperlukan.

Jangan ubah:
- database
- Telegram intake
- Telegram parsing
- F017 manual report
- F018 coordinator access
- F019 modal tabs
- F021 button cleanup
- F022 wording return

## Files Likely Impacted

Kemungkinan:
```text
views/reports/complete.ejs
views/reports/update.ejs
views/partials/complete-report-modal.ejs
views/partials/report-action-modal.ejs
controllers/reportController.js
models/reportModel.js
public/js/app.js