# Tasks — Region Access Wording Validation

## Feature ID
F011

## Analysis
- [ ] Review constitution project
- [ ] Review copilot/custom instructions
- [ ] Review alur region yang sudah berjalan
- [ ] Review halaman daftar antrean Eksekutor
- [ ] Review halaman pengajuan region switch
- [ ] Review halaman riwayat region switch
- [ ] Review halaman approval region switch Koordinator
- [ ] Review dashboard yang memuat informasi region
- [ ] Pastikan F011 hanya validasi/perbaikan wording

## Global Search
- [ ] Cari teks `overwork`
- [ ] Cari teks `overload`
- [ ] Cari teks `beban kerja berlebih`
- [ ] Cari teks `beban berlebih`
- [ ] Cari teks `beban terlalu tinggi`
- [ ] Cari teks `wilayah overload`
- [ ] Cari teks `region overload`
- [ ] Cari teks `beban kerja`
- [ ] Cari teks `region lain`
- [ ] Cari teks `switch region`
- [ ] Cari teks `temporary region switch`

## Classification
- [ ] Tandai teks yang tampil di UI
- [ ] Tandai helper text form
- [ ] Tandai alert atau flash message
- [ ] Tandai label dashboard
- [ ] Tandai komentar kode
- [ ] Tandai dokumentasi internal
- [ ] Tandai nama variabel/function
- [ ] Jangan ubah nama variabel/function jika tidak perlu

## Wording Replacement
- [ ] Jika ada `overwork`, ganti dengan narasi manajemen pelaporan/monitoring wilayah
- [ ] Jika ada `overload`, ganti dengan narasi manajemen pelaporan/monitoring wilayah
- [ ] Jika ada `beban kerja berlebih`, ganti dengan narasi pengelompokan region
- [ ] Jika ada helper text region yang kurang tepat, sesuaikan
- [ ] Jika ada helper text region switch, jelaskan akses sementara lintas region
- [ ] Pastikan teks baru tidak terlalu panjang
- [ ] Pastikan teks baru mudah dipahami user

## Correct Wording
- [ ] Gunakan: `Pembagian region digunakan untuk membantu manajemen pelaporan dan monitoring wilayah.`
- [ ] Gunakan: `Eksekutor secara default hanya dapat melihat tiket sesuai region utama.`
- [ ] Gunakan: `Tiket dari region lain akan tampil jika temporary region switch telah disetujui Koordinator dan masih aktif.`
- [ ] Gunakan: `Akses region sementara digunakan untuk mendukung kebutuhan operasional lintas region berdasarkan persetujuan Koordinator.`

## Region Switch Safety
- [ ] Jangan ubah route region switch
- [ ] Jangan ubah controller pengajuan region switch
- [ ] Jangan ubah controller approval region switch
- [ ] Jangan ubah controller rejection region switch
- [ ] Jangan ubah query region switch
- [ ] Jangan ubah validasi region switch
- [ ] Jangan ubah expired logic region switch
- [ ] Jangan ubah akses sementara region

## Ticket Visibility Safety
- [ ] Jangan ubah query daftar tiket
- [ ] Jangan ubah filter region
- [ ] Jangan ubah visibility tiket Eksekutor
- [ ] Jangan ubah assignment logic
- [ ] Jangan ubah delegation logic
- [ ] Jangan ubah status tiket
- [ ] Jangan ubah flow ambil tugas

## Dashboard Safety
- [ ] Dashboard Eksekutor tetap tampil
- [ ] Dashboard Koordinator tetap tampil
- [ ] Dashboard Supervisor tetap read-only
- [ ] Dashboard Super Admin tidak terdampak
- [ ] KPI Supervisor tidak berubah
- [ ] Tidak ada tombol aksi baru

## Telegram Safety
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah Telegram pending media
- [ ] Jangan ubah Telegram text enrichment
- [ ] Jangan ubah Telegram feedback
- [ ] Test laporan Telegram tetap masuk

## Functional Testing
- [ ] Login sebagai Eksekutor
- [ ] Buka daftar antrean Eksekutor
- [ ] Pastikan tiket region utama tetap tampil
- [ ] Buka form region switch
- [ ] Pastikan wording sudah benar
- [ ] Ajukan region switch
- [ ] Login sebagai Koordinator
- [ ] Approve region switch
- [ ] Login kembali sebagai Eksekutor
- [ ] Pastikan tiket region tambahan tampil jika switch aktif
- [ ] Reject pengajuan region switch lain jika ada
- [ ] Pastikan reject tetap berjalan
- [ ] Login sebagai Supervisor
- [ ] Pastikan dashboard supervisor read-only
- [ ] Kirim laporan Telegram baru
- [ ] Pastikan laporan masuk

## Verification
- [ ] Pencarian `overwork` tidak menemukan teks UI aktif
- [ ] Pencarian `overload` tidak menemukan teks UI aktif
- [ ] Pencarian `beban kerja berlebih` tidak menemukan teks UI aktif
- [ ] Narasi region sesuai alur sistem
- [ ] Narasi region switch sesuai approval Koordinator
- [ ] Tidak ada perubahan database
- [ ] Tidak ada perubahan business logic
- [ ] Tidak ada perubahan RBAC middleware

## Documentation
- [ ] Screenshot hasil pencarian `overwork`
- [ ] Screenshot hasil pencarian `overload`
- [ ] Screenshot halaman form region switch
- [ ] Screenshot daftar antrean Eksekutor
- [ ] Screenshot approval region switch Koordinator
- [ ] Catat teks lama yang diganti jika ada
- [ ] Catat teks baru yang digunakan
- [ ] Catat file yang berubah
- [ ] Catat hasil testing manual