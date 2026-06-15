
---

# `plan.md`

```md id="zv0ntk"
# Technical Plan — Return Feedback Wording Simplification

## Feature ID
F022

## Feature Name
Return Feedback Wording Simplification

## Objective
Menghapus kalimat permintaan evidence dari feedback Telegram untuk status `perlu_tindak_lanjut` dan memastikan pesan return hanya menampilkan catatan dari sistem.

## Existing Context
Sistem sudah memiliki:
- Telegram feedback
- status `perlu_tindak_lanjut`
- completion/update report flow
- report logs
- role Eksekutor
- role Koordinator
- F018 coordinator work action
- F021 UI button cleanup

## Important Boundary
F022 hanya mengubah wording feedback return.

Jangan ubah:
- database
- Telegram intake
- Telegram parsing
- pending media
- text enrichment
- flow selesai
- flow eskalasi DIIT
- F017 manual report
- F018 coordinator access
- F019 modal tabs
- F021 button cleanup

## Files Likely Impacted

Kemungkinan file:
```text
services/telegramService.js
services/telegramFeedbackService.js
controllers/reportController.js
models/reportModel.js
utils/telegramMessageFormatter.js