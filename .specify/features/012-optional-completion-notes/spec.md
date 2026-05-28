# Feature Spec — Optional Completion Notes

## Feature ID
F012

## Feature Name
Optional Completion Notes

## Summary
Fitur ini menyesuaikan alur penyelesaian tiket normal agar catatan penyelesaian tidak wajib diisi ketika status akhir tiket adalah `selesai`. Berdasarkan revisi pembimbing lapangan Telkom, jika tidak ada masalah dalam penyelesaian tiket, Eksekutor cukup menekan tombol selesai. Catatan penyelesaian hanya bersifat opsional apabila Eksekutor perlu menambahkan keterangan tertentu.

## Business Background
Pada sistem sebelumnya, penyelesaian tiket mewajibkan Eksekutor mengisi catatan penyelesaian. Setelah dilakukan review bersama pembimbing lapangan, catatan penyelesaian tidak perlu diwajibkan untuk tiket yang selesai normal. Hal ini bertujuan agar proses penyelesaian tiket menjadi lebih sederhana dan sesuai dengan kebutuhan operasional. Catatan tetap dapat digunakan apabila terdapat informasi tambahan yang perlu dicatat.

## Problem Statement
Validasi catatan penyelesaian yang wajib diisi pada semua status akhir membuat proses penyelesaian tiket normal menjadi kurang efisien. Untuk tiket yang selesai tanpa kendala, Eksekutor seharusnya dapat menyelesaikan tiket hanya dengan menekan tombol selesai tanpa harus mengisi catatan.

## Goals
1. Menjadikan catatan penyelesaian opsional untuk status `selesai`.
2. Memungkinkan Eksekutor menyelesaikan tiket normal tanpa mengisi catatan.
3. Tetap menyimpan catatan jika Eksekutor mengisinya.
4. Menjaga penyimpanan waktu penyelesaian tetap berjalan.
5. Menjaga log aktivitas penyelesaian tetap dibuat.
6. Menjaga Telegram feedback status selesai tetap berjalan.
7. Tidak mengubah flow `perlu_tindak_lanjut`.
8. Tidak mengubah flow `eskalasi`.

## Non-Goals
1. Tidak mengubah flow return atau `perlu_tindak_lanjut`.
2. Tidak mengubah feedback Telegram untuk `perlu_tindak_lanjut`.
3. Tidak mengubah flow eskalasi.
4. Tidak menambahkan kode DIIT.
5. Tidak mengubah status tiket.
6. Tidak mengubah flow pengambilan tiket.
7. Tidak mengubah flow delegasi.
8. Tidak mengubah Region Switch F007.
9. Tidak mengubah dashboard KPI.
10. Tidak mengubah struktur database.
11. Tidak mengubah role middleware.

## Actors

### Primary Actor
- Eksekutor

### Secondary Actors
- Koordinator
- Supervisor
- Super Admin
- Pelapor Telegram

## Preconditions
1. Eksekutor sudah login.
2. Tiket sudah berada dalam status yang dapat diselesaikan oleh Eksekutor sesuai rule sistem.
3. Eksekutor adalah penanggung jawab aktif tiket.
4. Sistem sudah memiliki form atau aksi penyelesaian tiket.
5. Sistem sudah memiliki field `completion_notes`.
6. Sistem sudah memiliki status akhir `selesai`, `perlu_tindak_lanjut`, dan `eskalasi`.
7. Sistem sudah memiliki report log.
8. Sistem sudah memiliki Telegram feedback untuk tiket dari Telegram.

## Postconditions

### Jika berhasil
1. Eksekutor dapat menyelesaikan tiket dengan status `selesai` tanpa mengisi catatan.
2. Jika catatan diisi, catatan tetap tersimpan.
3. Status tiket berubah menjadi `selesai`.
4. `resolved_at` dan `closed_at` tetap tersimpan sesuai logic lama.
5. Log aktivitas tetap dibuat.
6. Feedback Telegram status selesai tetap dikirim jika tiket berasal dari Telegram.
7. Flow `perlu_tindak_lanjut` dan `eskalasi` tidak berubah.

### Jika gagal
1. Sistem masih menolak penyelesaian status `selesai` ketika catatan kosong.
2. Catatan opsional tidak tersimpan ketika diisi.
3. Log penyelesaian tidak dibuat.
4. Telegram feedback selesai terganggu.
5. Flow status lain ikut berubah tanpa diminta.

## Functional Requirements

### FR-01 — Completion Notes Optional for Selesai
Sistem harus mengizinkan `completion_notes` kosong ketika status akhir tiket adalah `selesai`.

### FR-02 — Preserve Notes if Filled
Jika Eksekutor mengisi catatan saat status `selesai`, sistem tetap harus menyimpan catatan tersebut.

### FR-03 — Remove Required Attribute for Selesai
Pada UI/form penyelesaian, field catatan tidak boleh selalu wajib untuk status `selesai`.

### FR-04 — Preserve Completion Status
Sistem tetap harus menyimpan `completion_status` sesuai status yang dipilih.

### FR-05 — Preserve Ticket Status Update
Saat status akhir `selesai`, status tiket tetap harus berubah menjadi `selesai` sesuai logic lama.

### FR-06 — Preserve Completion Time
Sistem tetap harus menyimpan waktu penyelesaian seperti `resolved_at` dan/atau `closed_at` sesuai logic lama.

### FR-07 — Preserve Activity Log
Sistem tetap harus membuat log aktivitas ketika tiket diselesaikan.

### FR-08 — Preserve Telegram Feedback for Selesai
Jika tiket berasal dari Telegram, sistem tetap harus mengirim feedback bahwa tiket telah selesai.

### FR-09 — Do Not Change Return Flow
Perubahan ini tidak boleh mengubah validasi, pesan, atau logic untuk status `perlu_tindak_lanjut`.

### FR-10 — Do Not Change Escalation Flow
Perubahan ini tidak boleh mengubah validasi, pesan, atau logic untuk status `eskalasi`.

### FR-11 — RBAC Safety
Hanya role yang sebelumnya berhak menyelesaikan tiket yang tetap dapat menjalankan aksi penyelesaian.

## Business Rules
1. Catatan penyelesaian untuk status `selesai` bersifat opsional.
2. Tiket selesai normal dapat diproses hanya dengan menekan tombol selesai.
3. Catatan penyelesaian tetap dapat diisi jika diperlukan.
4. Perubahan ini hanya berlaku untuk status `selesai`.
5. Status `perlu_tindak_lanjut` dan `eskalasi` tidak termasuk scope F012.
6. Penyelesaian tiket tetap hanya dapat dilakukan oleh Eksekutor yang berhak sesuai aturan sistem.
7. Log aktivitas penyelesaian tetap wajib dibuat.
8. Supervisor tetap read-only.
9. Telegram bot intake tidak boleh berubah.

## UI Requirements
1. Label catatan penyelesaian menunjukkan bahwa catatan bersifat opsional untuk status `selesai`.
2. Placeholder atau helper text dapat menjelaskan bahwa catatan hanya diisi jika diperlukan.
3. Field catatan tidak boleh memiliki atribut `required` secara permanen untuk status `selesai`.
4. Tombol selesai tetap jelas.
5. Form penyelesaian tetap menggunakan tampilan Bootstrap 5 yang sudah ada.
6. Tidak ada field baru pada F012.
7. Tidak ada perubahan besar pada layout.

## Suggested Wording

Gunakan label:

> Catatan Penyelesaian (Opsional)

Gunakan helper text:

> Isi catatan hanya jika diperlukan. Untuk tiket yang selesai tanpa kendala, catatan dapat dikosongkan.

Atau:

> Catatan tidak wajib untuk status selesai.

## Acceptance Criteria

### AC-01
Given Eksekutor membuka form penyelesaian tiket  
When status akhir adalah `selesai` dan catatan dikosongkan  
Then sistem tetap berhasil menyelesaikan tiket.

### AC-02
Given Eksekutor menyelesaikan tiket dengan status `selesai` tanpa catatan  
When data disimpan  
Then status tiket berubah menjadi `selesai`.

### AC-03
Given Eksekutor menyelesaikan tiket dengan status `selesai` tanpa catatan  
When data disimpan  
Then `resolved_at` dan/atau `closed_at` tetap tersimpan sesuai logic lama.

### AC-04
Given Eksekutor menyelesaikan tiket dengan status `selesai` tanpa catatan  
When data disimpan  
Then log aktivitas penyelesaian tetap dibuat.

### AC-05
Given Eksekutor menyelesaikan tiket dengan status `selesai` dan mengisi catatan  
When data disimpan  
Then catatan tersebut tetap tersimpan.

### AC-06
Given tiket berasal dari Telegram  
When tiket diselesaikan dengan status `selesai` tanpa catatan  
Then feedback Telegram selesai tetap dikirim.

### AC-07
Given F012 selesai diterapkan  
When status `perlu_tindak_lanjut` digunakan  
Then flow lama tetap berjalan dan tidak berubah.

### AC-08
Given F012 selesai diterapkan  
When status `eskalasi` digunakan  
Then flow lama tetap berjalan dan tidak berubah.

### AC-09
Given Supervisor membuka dashboard  
When F012 selesai diterapkan  
Then Supervisor tetap read-only.

### AC-10
Given Telegram bot menerima laporan baru  
When F012 selesai diterapkan  
Then Telegram intake tetap berjalan seperti sebelumnya.

## Edge Cases
1. Catatan kosong string `""`.
2. Catatan hanya berisi spasi.
3. Catatan diisi dengan teks pendek.
4. Catatan diisi dengan teks panjang.
5. Tiket bukan berasal dari Telegram.
6. Telegram feedback gagal dikirim.
7. Eksekutor bukan penanggung jawab mencoba menyelesaikan tiket.
8. Status akhir selain `selesai` dipilih.
9. Field catatan masih memiliki required di frontend.
10. Backend masih memvalidasi catatan wajib untuk semua status.

## Data Requirements
1. Tidak ada tabel baru.
2. Tidak ada kolom baru.
3. Tidak ada perubahan struktur database.
4. Field `completion_notes` tetap digunakan.
5. `completion_notes` boleh `NULL` atau string kosong untuk status `selesai`, sesuai konvensi database yang sudah ada.

## Out of Scope
1. Perubahan feedback Telegram return.
2. Perubahan feedback Telegram eskalasi.
3. Penambahan kode DIIT.
4. Perubahan detail modal.
5. Perubahan region wording.
6. Perubahan laporan manual.
7. Perubahan Region Switch F007.
8. Perubahan KPI Supervisor.