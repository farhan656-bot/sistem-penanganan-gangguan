# Checklist — Region Access Wording Validation

## Wording Checklist
- [ ] Tidak ada teks `overwork` pada UI aktif
- [ ] Tidak ada teks `overload` pada UI aktif
- [ ] Tidak ada teks `beban kerja berlebih` pada UI aktif
- [ ] Tidak ada teks `wilayah overload` pada UI aktif
- [ ] Tidak ada indikator overwork pada dashboard
- [ ] Tidak ada label wilayah overload
- [ ] Teks region tidak menyesatkan

## Correct Region Flow Checklist
- [ ] Narasi menjelaskan Eksekutor default hanya melihat region utama
- [ ] Narasi menjelaskan akses region lain melalui temporary region switch
- [ ] Narasi menjelaskan approval dilakukan oleh Koordinator
- [ ] Narasi menjelaskan akses region tambahan bersifat sementara
- [ ] Narasi menjelaskan region untuk manajemen pelaporan dan monitoring wilayah

## Region Switch Safety Checklist
- [ ] Pengajuan region switch tetap berjalan
- [ ] Approval region switch tetap berjalan
- [ ] Reject region switch tetap berjalan
- [ ] Expired region switch tetap berjalan jika ada
- [ ] Tiket region tambahan tampil jika switch approved dan aktif
- [ ] Tiket region tambahan tidak tampil jika switch expired/tidak aktif
- [ ] Logic F007 tidak berubah

## Ticket Visibility Checklist
- [ ] Eksekutor tanpa switch hanya melihat region utama
- [ ] Eksekutor dengan switch aktif melihat region tambahan
- [ ] Filter region tetap berjalan
- [ ] Query tiket tidak berubah
- [ ] Assignment logic tidak berubah
- [ ] Delegation logic tidak berubah
- [ ] Status tiket tidak berubah

## Business Logic Safety Checklist
- [ ] Tidak ada perubahan flow ambil tugas
- [ ] Tidak ada perubahan flow penyelesaian tiket
- [ ] Tidak ada perubahan flow delegasi
- [ ] Tidak ada perubahan Telegram bot
- [ ] Tidak ada perubahan dashboard KPI
- [ ] Tidak ada perubahan database
- [ ] Tidak ada perubahan role middleware

## Role Safety Checklist
- [ ] Eksekutor tetap bisa login
- [ ] Eksekutor tetap bisa mengajukan region switch
- [ ] Koordinator tetap bisa login
- [ ] Koordinator tetap bisa approve/reject region switch
- [ ] Supervisor tetap read-only
- [ ] Super Admin tidak terdampak

## Telegram Safety Checklist
- [ ] Telegram bot tetap berjalan
- [ ] Telegram intake tetap menerima laporan valid
- [ ] Telegram parsing tidak berubah
- [ ] Pending media tidak berubah
- [ ] Text enrichment tidak berubah
- [ ] Feedback Telegram tidak berubah

## Manual Verification Checklist
- [ ] Cari `overwork` di seluruh project
- [ ] Cari `overload` di seluruh project
- [ ] Cari `beban kerja berlebih` di seluruh project
- [ ] Login sebagai Eksekutor
- [ ] Buka daftar antrean Eksekutor
- [ ] Buka form region switch
- [ ] Ajukan region switch
- [ ] Login sebagai Koordinator
- [ ] Approve region switch
- [ ] Login kembali sebagai Eksekutor
- [ ] Pastikan tiket region tambahan tampil
- [ ] Login sebagai Supervisor
- [ ] Buka dashboard supervisor
- [ ] Kirim laporan Telegram baru

## Evidence Checklist
- [ ] Screenshot hasil pencarian `overwork`
- [ ] Screenshot hasil pencarian `overload`
- [ ] Screenshot form region switch
- [ ] Screenshot daftar antrean Eksekutor
- [ ] Screenshot approval region switch
- [ ] Screenshot dashboard supervisor tetap read-only
- [ ] Catatan file yang berubah
- [ ] Catatan teks lama dan teks baru jika ada
- [ ] Catatan hasil testing manual