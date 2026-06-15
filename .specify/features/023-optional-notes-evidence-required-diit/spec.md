# Feature Spec — Optional Notes and Evidence with Required DIIT Code

## Feature ID
F023

## Feature Name
Optional Notes and Evidence with Required DIIT Code

## Summary
Fitur ini merapikan aturan input pada proses penyelesaian, return, dan eskalasi tiket. Catatan dan upload bukti dibuat opsional untuk status selesai dan eskalasi. Untuk status perlu_tindak_lanjut, catatan return tetap disarankan wajib agar feedback Telegram tetap jelas. Kode DIIT tetap wajib khusus untuk status eskalasi.

## Business Background
Berdasarkan revisi pembimbing lapangan, catatan dan bukti tidak selalu wajib saat tiket diselesaikan atau dieskalasikan. Namun, untuk eskalasi ke DIIT, kode DIIT tetap wajib karena menjadi identitas tindak lanjut eskalasi. Pada status return/perlu_tindak_lanjut, catatan tetap penting karena pesan Telegram return hanya mengirim catatan dari sistem.

## Problem Statement
Aturan validasi input pada penyelesaian tiket perlu disesuaikan agar tidak memberatkan pengguna. Jika catatan dan bukti selalu wajib, Eksekutor atau Koordinator dapat terhambat ketika pekerjaan sebenarnya sudah selesai tetapi tidak membutuhkan catatan panjang atau bukti tambahan. Namun, sistem tetap harus menjaga validasi penting seperti kode DIIT pada eskalasi.

## Goals
1. Membuat catatan opsional untuk status selesai.
2. Membuat upload bukti opsional untuk status selesai.
3. Membuat upload bukti opsional untuk status perlu_tindak_lanjut.
4. Membuat catatan return tetap wajib atau minimal sangat disarankan untuk status perlu_tindak_lanjut.
5. Membuat catatan opsional untuk status eskalasi.
6. Membuat upload bukti opsional untuk status eskalasi.
7. Menjaga kode DIIT wajib untuk status eskalasi.
8. Menjaga feedback Telegram tetap berjalan.
9. Menjaga report_logs tetap tercatat.
10. Menjaga flow Koordinator F018 tetap berjalan.

## Non-Goals
1. Tidak mengubah database.
2. Tidak mengubah Telegram intake.
3. Tidak mengubah Telegram parsing.
4. Tidak mengubah pending media.
5. Tidak mengubah text enrichment.
6. Tidak mengubah F017 manual report.
7. Tidak mengubah F018 coordinator access.
8. Tidak mengubah F019 modal tabs.
9. Tidak mengubah F021 button cleanup.
10. Tidak mengubah wording return F022 kecuali mengikuti catatan return.
11. Tidak membuat role baru.
12. Tidak mengubah struktur tabel reports.
13. Tidak mengubah struktur tabel report_attachments.
14. Tidak mengubah struktur tabel report_logs.

## Actors
- Eksekutor
- Koordinator
- Pelapor Telegram

## Final Validation Rules

### Status `selesai`
Catatan:
- opsional

Upload bukti:
- opsional

Kode DIIT:
- tidak diperlukan

Jika catatan kosong, sistem tetap boleh menyelesaikan tiket.

### Status `perlu_tindak_lanjut`
Catatan:
- wajib direkomendasikan
- sebaiknya wajib secara sistem agar feedback Telegram jelas

Upload bukti:
- opsional

Kode DIIT:
- tidak diperlukan

Jika catatan kosong, sistem sebaiknya menolak dan meminta user mengisi catatan return.

### Status `eskalasi`
Catatan:
- opsional

Upload bukti:
- opsional

Kode DIIT:
- wajib

Jika kode DIIT kosong, sistem harus menolak eskalasi.

## Functional Requirements

### FR-01 — Completed Notes Optional
Sistem tidak boleh mewajibkan catatan saat status `selesai`.

### FR-02 — Completed Evidence Optional
Sistem tidak boleh mewajibkan upload bukti saat status `selesai`.

### FR-03 — Return Notes Required
Sistem sebaiknya mewajibkan catatan saat status `perlu_tindak_lanjut`.

### FR-04 — Return Evidence Optional
Sistem tidak boleh mewajibkan upload bukti saat status `perlu_tindak_lanjut`.

### FR-05 — Escalation Notes Optional
Sistem tidak boleh mewajibkan catatan saat status `eskalasi`.

### FR-06 — Escalation Evidence Optional
Sistem tidak boleh mewajibkan upload bukti saat status `eskalasi`.

### FR-07 — Escalation DIIT Required
Sistem wajib meminta kode DIIT saat status `eskalasi`.

### FR-08 — Preserve Telegram Feedback
Telegram feedback tetap dikirim sesuai status.

### FR-09 — Preserve Report Logs
Setiap aksi tetap tercatat di `report_logs`.

### FR-10 — Preserve Evidence Upload
Jika user mengunggah bukti, file tetap tersimpan seperti sebelumnya.

### FR-11 — Preserve Coordinator Work Actions
Koordinator tetap dapat melakukan selesai, return, dan eskalasi sesuai F018.

## Expected Behavior

### Selesai tanpa catatan dan tanpa bukti
Allowed.

### Selesai dengan catatan tanpa bukti
Allowed.

### Selesai tanpa catatan dengan bukti
Allowed.

### Return tanpa catatan
Rejected atau tampil validasi bahwa catatan return wajib.

### Return dengan catatan tanpa bukti
Allowed.

### Eskalasi tanpa kode DIIT
Rejected.

### Eskalasi dengan kode DIIT tanpa catatan dan tanpa bukti
Allowed.

### Eskalasi dengan kode DIIT dan catatan
Allowed.

### Eskalasi dengan kode DIIT dan bukti
Allowed.

## Acceptance Criteria

### AC-01
Given Eksekutor memilih status selesai  
When catatan dan bukti kosong  
Then sistem tetap dapat menyelesaikan tiket.

### AC-02
Given Koordinator memilih status selesai  
When catatan dan bukti kosong  
Then sistem tetap dapat menyelesaikan tiket.

### AC-03
Given user memilih status perlu_tindak_lanjut  
When catatan return kosong  
Then sistem menolak dan meminta catatan return.

### AC-04
Given user memilih status perlu_tindak_lanjut  
When catatan diisi dan bukti kosong  
Then sistem menerima return.

### AC-05
Given user memilih status eskalasi  
When kode DIIT kosong  
Then sistem menolak eskalasi.

### AC-06
Given user memilih status eskalasi  
When kode DIIT diisi, catatan kosong, dan bukti kosong  
Then sistem menerima eskalasi.

### AC-07
Given user mengunggah bukti opsional  
When status selesai/return/eskalasi diproses  
Then bukti tetap tersimpan.

### AC-08
Given status selesai/return/eskalasi diproses  
When tiket memiliki telegram_chat_id  
Then feedback Telegram tetap terkirim.

### AC-09
Given status selesai/return/eskalasi diproses  
When cek report_logs  
Then log aktivitas tetap tercatat.

## Out of Scope
1. Perubahan format UI besar.
2. Perubahan tabel.
3. Perubahan Telegram intake.
4. Perubahan role.
5. Perubahan F017-F022.