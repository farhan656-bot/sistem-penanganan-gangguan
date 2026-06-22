
---

# `plan.md`

```md id="dxxi5f"
# Technical Plan — Query Indexing and Performance Optimization

## Feature ID
F032

## Feature Name
Query Indexing and Performance Optimization

## Objective
Mengoptimalkan query dan indexing agar sistem tetap stabil saat jumlah laporan meningkat, terutama pada daftar antrean kerja, dashboard, pagination, dan auto-refresh polling.

## Important Boundary
F032 adalah tahap optimasi dan stabilisasi.

Jangan ubah:
- Telegram intake
- Telegram parsing
- alur ambil tiket
- alur selesai
- alur return
- alur eskalasi
- upload file
- modal detail
- dashboard logic besar-besaran
- queue segmentation F029
- pagination F030
- auto-refresh F031

## Files Likely Impacted

Kemungkinan file:

```text id="d2ngh5"
models/reportModel.js
models/dashboardModel.js
controllers/reportController.js
controllers/dashboardController.js
database/migrations/032_add_performance_indexes.sql