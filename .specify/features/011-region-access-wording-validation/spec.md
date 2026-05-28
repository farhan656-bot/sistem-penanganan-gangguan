# Feature Spec — Region Access Wording Validation

## Feature ID
F011

## Feature Name
Region Access Wording Validation

## Summary
Fitur ini memastikan narasi dan teks pada sistem terkait region sudah sesuai dengan alur operasional yang berjalan. Pada sistem, Eksekutor secara default hanya dapat melihat dan mengerjakan tiket sesuai region utama masing-masing. Eksekutor dapat melihat tiket dari region lain hanya jika mengajukan temporary region switch dan disetujui oleh Koordinator. Setelah disetujui dan masih dalam masa aktif, tiket dari region tambahan akan terlihat pada Eksekutor tersebut.

F011 tidak mengubah logic akses region, tidak mengubah query tiket, dan tidak mengubah Region Switch F007. Feature ini hanya melakukan pengecekan dan perbaikan wording jika ditemukan narasi yang kurang tepat.

## Business Background
Berdasarkan revisi pembimbing lapangan Telkom, sistem tidak perlu menampilkan indikasi overwork, overload, atau beban kerja berlebih. Pembagian region pada sistem digunakan untuk membantu manajemen pelaporan dan monitoring wilayah. Alur teknis yang sudah berjalan adalah Eksekutor mengerjakan tiket sesuai region masing-masing, sedangkan akses ke region lain diperoleh melalui temporary region switch yang harus disetujui oleh Koordinator.

## Problem Statement
Jika terdapat narasi pada UI yang menyebut overwork, overload, atau beban kerja berlebih, maka narasi tersebut dapat menimbulkan pemahaman yang tidak sesuai dengan proses kerja sebenarnya. Sistem perlu menggunakan penjelasan bahwa region digunakan untuk pengelompokan laporan, monitoring wilayah, dan pengaturan akses kerja berdasarkan region utama serta temporary region switch.

## Goals
1. Memastikan tidak ada narasi overwork, overload, atau beban kerja berlebih pada UI.
2. Memastikan penjelasan region sesuai dengan alur sistem yang sudah berjalan.
3. Menjelaskan bahwa Eksekutor secara default hanya melihat tiket region utama.
4. Menjelaskan bahwa akses region lain diperoleh melalui temporary region switch.
5. Menjelaskan bahwa temporary region switch harus disetujui Koordinator.
6. Menjaga logic Region Switch F007 tetap tidak berubah.
7. Menjaga query tiket, filter region, RBAC, Telegram bot, dan dashboard KPI tetap tidak berubah.

## Non-Goals
1. Tidak mengubah logic Region Switch F007.
2. Tidak mengubah query visibilitas tiket.
3. Tidak mengubah aturan akses tiket berdasarkan region.
4. Tidak mengubah flow pengajuan region switch.
5. Tidak mengubah flow approval/reject region switch.
6. Tidak mengubah flow delegasi tiket.
7. Tidak mengubah flow pengambilan tiket.
8. Tidak mengubah flow penyelesaian tiket.
9. Tidak mengubah Telegram bot.
10. Tidak mengubah struktur database.
11. Tidak mengubah role middleware.

## Actors

### Primary Actors
- Eksekutor
- Koordinator

### Secondary Actors
- Supervisor
- Super Admin

## Preconditions
1. Sistem sudah memiliki region PDG dan BKT.
2. Sistem sudah memiliki user Eksekutor dengan region utama.
3. Sistem sudah memiliki fitur temporary region switch.
4. Eksekutor dapat mengajukan akses sementara ke region lain.
5. Koordinator dapat menyetujui atau menolak pengajuan region switch.
6. Tiket region tambahan hanya terlihat jika region switch aktif.
7. Logic tersebut sudah berjalan dan tidak boleh diubah.

## Postconditions

### Jika berhasil
1. Tidak ada wording yang menyebut overwork/overload pada UI.
2. Narasi region menjelaskan manajemen pelaporan dan monitoring wilayah.
3. Narasi region switch menjelaskan akses sementara lintas region.
4. Eksekutor tetap hanya melihat region utama secara default.
5. Eksekutor tetap melihat region tambahan hanya jika switch disetujui dan masih aktif.
6. Koordinator tetap dapat approve/reject region switch.
7. Tidak ada perubahan business logic.

### Jika gagal
1. Narasi overwork/overload masih muncul.
2. AI atau developer mengubah logic region switch yang sudah benar.
3. Query tiket berdasarkan region berubah.
4. Eksekutor melihat tiket region lain tanpa approval.
5. Fitur region switch menjadi rusak.

## Functional Requirements

### FR-01 — Search Incorrect Wording
Sistem atau developer harus mengecek apakah terdapat teks overwork, overload, beban kerja berlebih, wilayah overload, atau narasi sejenis pada UI.

### FR-02 — Replace Incorrect Wording
Jika ditemukan wording yang kurang tepat, wording tersebut harus diganti dengan narasi manajemen pelaporan dan monitoring wilayah.

### FR-03 — Explain Default Region Access
Jika terdapat helper text atau keterangan akses region, sistem harus menjelaskan bahwa Eksekutor secara default hanya melihat tiket sesuai region utama.

### FR-04 — Explain Temporary Region Switch
Jika terdapat helper text atau keterangan region switch, sistem harus menjelaskan bahwa akses region lain diperoleh melalui pengajuan temporary region switch.

### FR-05 — Explain Coordinator Approval
Jika terdapat keterangan region switch, sistem harus menjelaskan bahwa akses tambahan aktif setelah disetujui Koordinator.

### FR-06 — Preserve Region Switch Logic
Perubahan wording tidak boleh mengubah alur pengajuan, approval, rejection, expiration, atau akses sementara pada Region Switch F007.

### FR-07 — Preserve Ticket Visibility
Perubahan wording tidak boleh mengubah aturan visibilitas tiket berdasarkan region utama atau region switch aktif.

### FR-08 — Preserve RBAC
Perubahan wording tidak boleh mengubah middleware role atau hak akses pengguna.

### FR-09 — Preserve Telegram Bot
Perubahan wording tidak boleh mengubah Telegram intake, parsing, pending media, text enrichment, atau feedback.

## Business Rules
1. Eksekutor secara default hanya melihat tiket sesuai region utama.
2. Eksekutor dapat melihat tiket region lain hanya jika temporary region switch disetujui Koordinator.
3. Temporary region switch bersifat sementara.
4. Region digunakan untuk membantu manajemen pelaporan dan monitoring wilayah.
5. Region tidak digunakan sebagai indikator overwork atau overload.
6. Koordinator tetap menjadi pihak yang menyetujui atau menolak pengajuan region switch.
7. Supervisor tetap read-only.
8. Super Admin tetap berfokus pada manajemen user.

## Suggested Wording

Gunakan narasi berikut jika diperlukan:

> Eksekutor secara default hanya dapat melihat dan menangani tiket sesuai region utama. Akses ke region lain dapat diperoleh melalui temporary region switch setelah disetujui oleh Koordinator.

Atau:

> Pembagian region digunakan untuk membantu manajemen pelaporan dan monitoring wilayah. Tiket dari region lain hanya akan tampil apabila akses region sementara telah disetujui oleh Koordinator dan masih aktif.

Atau:

> Temporary region switch digunakan untuk memberikan akses sementara ke region lain berdasarkan persetujuan Koordinator.

Hindari narasi berikut:

> Region switch digunakan karena region mengalami overload.

> Wilayah ini mengalami overwork.

> Eksekutor membantu region lain karena beban kerja berlebih.

> Region lain sedang terlalu banyak beban.

## UI Requirements
1. Tidak ada teks overwork pada UI.
2. Tidak ada teks overload pada UI.
3. Tidak ada teks beban kerja berlebih pada UI.
4. Tidak ada indikator wilayah overload.
5. Form region switch menggunakan narasi akses sementara lintas region.
6. Dashboard atau antrean menggunakan narasi manajemen pelaporan/monitoring wilayah jika diperlukan.
7. Teks baru harus singkat dan mudah dipahami.
8. Tidak ada tombol, fitur, atau aksi baru.

## Acceptance Criteria

### AC-01
Given pencarian global dilakukan pada kata `overwork`  
When F011 selesai  
Then tidak ada teks UI aktif yang menggunakan kata tersebut.

### AC-02
Given pencarian global dilakukan pada kata `overload`  
When F011 selesai  
Then tidak ada teks UI aktif yang menggunakan kata tersebut.

### AC-03
Given Eksekutor membuka halaman pengajuan region switch  
When halaman tampil  
Then narasi menjelaskan akses sementara lintas region berdasarkan approval Koordinator.

### AC-04
Given Eksekutor belum memiliki region switch aktif  
When membuka daftar antrean  
Then Eksekutor tetap hanya melihat tiket region utama sesuai logic lama.

### AC-05
Given Eksekutor memiliki region switch yang disetujui dan masih aktif  
When membuka daftar antrean  
Then tiket dari region tambahan tetap terlihat sesuai logic lama.

### AC-06
Given Koordinator membuka approval region switch  
When F011 selesai  
Then approval dan reject tetap berjalan seperti sebelumnya.

### AC-07
Given Supervisor membuka dashboard KPI  
When F011 selesai  
Then dashboard tetap read-only dan KPI tidak berubah.

### AC-08
Given Bot Telegram menerima laporan baru  
When F011 selesai  
Then laporan tetap masuk seperti sebelumnya.

## Edge Cases
1. Kata overwork hanya muncul di komentar kode.
2. Kata overload hanya muncul di dokumentasi lama.
3. Teks beban kerja muncul tetapi bukan konteks overload.
4. Helper text region switch terlalu panjang.
5. Narasi region muncul di lebih dari satu halaman.
6. Developer tidak menemukan teks yang perlu diubah.
7. AI mencoba mengubah logic padahal hanya diminta validasi wording.

## Data Requirements
1. Tidak ada tabel baru.
2. Tidak ada kolom baru.
3. Tidak ada perubahan data lama.
4. Tidak ada migration.
5. Tidak ada ALTER TABLE.

## Out of Scope
1. Mengubah logic Region Switch F007.
2. Mengubah filter tiket.
3. Mengubah akses region.
4. Mengubah query ticket visibility.
5. Mengubah detail modal.
6. Mengubah completion notes.
7. Mengubah feedback Telegram.
8. Menambahkan kode DIIT.