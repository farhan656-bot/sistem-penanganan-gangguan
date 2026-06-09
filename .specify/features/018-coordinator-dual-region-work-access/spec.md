# Feature Spec — Coordinator Dual Region Work Access

## Feature ID
F018

## Feature Name
Coordinator Dual Region Work Access

## Summary
Fitur ini menyesuaikan hak akses Koordinator agar dapat melakukan pekerjaan pelaporan untuk dua region, yaitu PDG dan BKT, tanpa perlu mengajukan temporary region switch. Perubahan ini hanya berlaku untuk role Koordinator. Logic akses Eksekutor tetap tidak berubah, yaitu Eksekutor hanya melihat region utama secara default dan dapat melihat region lain hanya jika temporary region switch disetujui dan masih aktif.

## Business Background
Berdasarkan revisi pembimbing lapangan, Koordinator memiliki kebutuhan operasional untuk menangani pelaporan pada dua region. Koordinator berperan dalam pemantauan, pengelolaan, delegasi, dan koordinasi laporan, sehingga akses terhadap dua region diperlukan agar Koordinator dapat bekerja lebih fleksibel. Namun, hal ini tidak berlaku untuk Eksekutor karena Eksekutor tetap bekerja berdasarkan region utama masing-masing, kecuali mendapat akses sementara melalui region switch.

## Problem Statement
Saat ini akses region pada sistem masih mengikuti pembagian region user. Untuk Koordinator, pembatasan ini dapat menghambat pekerjaan pelaporan lintas region. Sistem perlu menyesuaikan logic agar Koordinator dapat mengakses laporan dari PDG dan BKT tanpa region switch, sementara logic Eksekutor tetap aman dan tidak berubah.

## Goals
1. Memberikan Koordinator akses kerja untuk dua region, yaitu PDG dan BKT.
2. Memungkinkan Koordinator melihat laporan dari PDG dan BKT.
3. Memungkinkan Koordinator melakukan delegasi atau pengelolaan laporan sesuai kewenangan lama pada dua region.
4. Memastikan Koordinator tidak perlu region switch.
5. Menjaga logic Eksekutor tetap tidak berubah.
6. Menjaga logic temporary region switch untuk Eksekutor tetap berjalan.
7. Menjaga flow ticketing, Telegram, dan dashboard tetap aman.

## Non-Goals
1. Tidak mengubah logic Eksekutor.
2. Tidak menghapus temporary region switch.
3. Tidak memberikan Eksekutor akses dua region secara default.
4. Tidak mengubah role Supervisor.
5. Tidak mengubah role Super Admin.
6. Tidak mengubah Telegram intake.
7. Tidak mengubah parsing Telegram.
8. Tidak mengubah flow selesai, return, atau eskalasi DIIT.
9. Tidak mengubah modul laporan manual F017.
10. Tidak mengubah struktur database kecuali benar-benar diperlukan.
11. Tidak menambahkan role baru.

## Actors

### Primary Actor
- Koordinator

### Affected Actor
- Eksekutor

### Secondary Actors
- Supervisor
- Super Admin

## Preconditions
1. Sistem sudah memiliki role Koordinator.
2. Sistem sudah memiliki region PDG dan BKT.
3. Sistem sudah memiliki laporan/tiket pada tabel `reports`.
4. Sistem sudah memiliki filter laporan berdasarkan region.
5. Sistem sudah memiliki temporary region switch untuk Eksekutor.
6. Sistem sudah memiliki flow delegasi dan pembatalan penugasan oleh Koordinator.

## Postconditions

### Jika berhasil
1. Koordinator dapat melihat laporan dari PDG dan BKT.
2. Koordinator dapat melakukan tindakan operasional sesuai kewenangan lama pada laporan PDG dan BKT.
3. Koordinator tidak perlu mengajukan region switch.
4. Eksekutor tetap hanya melihat region utama secara default.
5. Eksekutor tetap membutuhkan temporary region switch untuk melihat region lain.
6. Telegram intake tetap berjalan.
7. Dashboard Supervisor tetap tidak berubah.

### Jika gagal
1. Koordinator masih hanya melihat satu region.
2. Eksekutor ikut mendapat akses dua region secara default.
3. Region switch Eksekutor rusak.
4. Query laporan menjadi tidak sesuai.
5. Dashboard atau Telegram ikut terganggu.

## Functional Requirements

### FR-01 — Coordinator Can Access PDG and BKT
Sistem harus mengizinkan Koordinator melihat laporan dari region PDG dan BKT.

### FR-02 — Coordinator Does Not Need Region Switch
Koordinator tidak perlu mengajukan temporary region switch untuk mengakses dua region.

### FR-03 — Preserve Executor Region Access
Eksekutor tetap hanya melihat laporan sesuai region utama, kecuali memiliki temporary region switch yang approved dan aktif.

### FR-04 — Preserve Executor Region Switch
Temporary region switch untuk Eksekutor tetap berjalan seperti sebelumnya.

### FR-05 — Preserve Coordinator Actions
Koordinator tetap dapat melakukan aksi yang sebelumnya sudah tersedia, seperti delegasi dan pembatalan penugasan, pada laporan yang dapat diaksesnya.

### FR-06 — Preserve Report Filters
Filter region pada daftar laporan tetap dapat digunakan. Untuk Koordinator, filter harus dapat menampilkan PDG dan BKT.

### FR-07 — Preserve Supervisor Read-Only
Supervisor tetap read-only dan tidak mendapat aksi operasional baru.

### FR-08 — Preserve Super Admin
Super Admin tidak terdampak oleh perubahan logic Koordinator.

### FR-09 — No Telegram Impact
Perubahan ini tidak boleh mengubah Telegram intake, parsing, pending media, text enrichment, atau feedback.

### FR-10 — No Manual Report Impact
Perubahan ini tidak boleh mengubah modul laporan manual non-ticketing F017.

## Business Rules
1. Koordinator dapat mengakses laporan dari PDG dan BKT.
2. Koordinator tidak menggunakan temporary region switch.
3. Eksekutor tetap menggunakan logic region utama dan temporary region switch.
4. Supervisor tetap read-only.
5. Super Admin tetap mengikuti hak akses administrasi yang sudah ada.
6. Perubahan hanya berlaku pada akses laporan/tiket Koordinator.
7. Laporan manual non-ticketing tidak termasuk scope F018.
8. Region switch tetap digunakan untuk Eksekutor, bukan Koordinator.

## Recommended Logic

Untuk Koordinator:

```text
allowedRegions = ['PDG', 'BKT']