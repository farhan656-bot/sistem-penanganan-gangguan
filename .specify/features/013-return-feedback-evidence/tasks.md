# Tasks — Return Feedback Evidence

## Feature ID
F013

## Analysis
- [ ] Review constitution project
- [ ] Review copilot/custom instructions
- [ ] Review flow status `perlu_tindak_lanjut`
- [ ] Review controller penyelesaian/status tiket
- [ ] Review Telegram feedback service
- [ ] Review report log
- [ ] Review form penyelesaian jika ada helper text
- [ ] Pastikan F013 hanya mengubah feedback return/perlu_tindak_lanjut

## Search References
- [ ] Cari teks `perlu_tindak_lanjut`
- [ ] Cari teks `perlu tindak lanjut`
- [ ] Cari teks `completion_status`
- [ ] Cari teks `telegramFeedback`
- [ ] Cari teks `sendFeedback`
- [ ] Cari teks `completion_notes`
- [ ] Cari teks `evidence`
- [ ] Cari teks `dikembalikan`
- [ ] Cari function pengiriman feedback Telegram
- [ ] Cari log feedback Telegram gagal/berhasil

## Telegram Feedback Service
- [ ] Buka service Telegram feedback
- [ ] Cari branch/status `perlu_tindak_lanjut`
- [ ] Ubah pesan menjadi tiket dikembalikan
- [ ] Tambahkan kalimat meminta evidence dilengkapi
- [ ] Pastikan Ticket ID tampil
- [ ] Jika catatan ada, tampilkan catatan
- [ ] Jika catatan kosong, jangan tampilkan blok catatan
- [ ] Pastikan format pesan rapi
- [ ] Jangan ubah pesan status `selesai`
- [ ] Jangan ubah pesan status `eskalasi`

## Controller Flow
- [ ] Buka controller penyelesaian tiket
- [ ] Pastikan status `perlu_tindak_lanjut` tetap diproses
- [ ] Pastikan report log tetap dibuat
- [ ] Pastikan feedback Telegram dipanggil untuk tiket Telegram
- [ ] Pastikan tiket non-Telegram tidak error
- [ ] Jangan ubah validasi status `selesai`
- [ ] Jangan ubah validasi status `eskalasi`
- [ ] Jangan tambah kode DIIT

## Notes Handling
- [ ] Trim catatan return
- [ ] Jika catatan hanya spasi, perlakukan sebagai kosong
- [ ] Jika catatan ada, kirim dalam pesan Telegram
- [ ] Jika catatan kosong, jangan tampilkan label `Catatan:`
- [ ] Pastikan catatan tetap tersimpan sesuai logic lama
- [ ] Jangan membuat catatan wajib jika sebelumnya tidak wajib untuk status ini kecuali logic lama memang begitu

## Optional UI Helper Text
- [ ] Jika ada helper text untuk status `perlu_tindak_lanjut`, sesuaikan wording
- [ ] Gunakan kalimat: `Gunakan status ini jika tiket perlu dikembalikan kepada pelapor untuk melengkapi evidence.`
- [ ] Jangan menambah field baru
- [ ] Jangan mengubah layout besar
- [ ] Jangan mengubah modal detail kecuali perlu menampilkan teks yang sudah ada

## Non-Telegram Safety
- [ ] Test tiket tanpa `telegram_chat_id`
- [ ] Pastikan status tetap tersimpan
- [ ] Pastikan log tetap dibuat
- [ ] Pastikan tidak terjadi error saat feedback dilewati
- [ ] Pastikan error Telegram dicatat jika pengiriman gagal

## Regression Safety
- [ ] Jangan ubah flow `selesai`
- [ ] Jangan ubah catatan opsional F012
- [ ] Jangan ubah flow `eskalasi`
- [ ] Jangan tambah kolom database
- [ ] Jangan ubah Telegram intake
- [ ] Jangan ubah Telegram parsing
- [ ] Jangan ubah pending media
- [ ] Jangan ubah text enrichment
- [ ] Jangan ubah Region Switch F007
- [ ] Jangan ubah KPI Supervisor
- [ ] Jangan ubah RBAC middleware

## Functional Testing
- [ ] Login sebagai Eksekutor
- [ ] Ambil tiket Telegram
- [ ] Proses status `perlu_tindak_lanjut` dengan catatan
- [ ] Pastikan pesan Telegram menyebut tiket dikembalikan
- [ ] Pastikan pesan Telegram meminta evidence dilengkapi
- [ ] Pastikan catatan tampil pada pesan Telegram
- [ ] Proses status `perlu_tindak_lanjut` tanpa catatan jika bisa
- [ ] Pastikan tidak ada label catatan kosong
- [ ] Test tiket non-Telegram jika ada
- [ ] Pastikan tidak error
- [ ] Pastikan log aktivitas dibuat
- [ ] Test status `selesai` tanpa catatan tetap berjalan
- [ ] Test status `eskalasi` tetap berjalan seperti sebelumnya
- [ ] Test Telegram intake laporan baru
- [ ] Login sebagai Supervisor dan pastikan read-only

## Documentation
- [ ] Screenshot/status pesan Telegram tiket dikembalikan
- [ ] Screenshot pesan Telegram dengan catatan return
- [ ] Screenshot log aktivitas
- [ ] Screenshot status tiket `perlu_tindak_lanjut`
- [ ] Catat file service yang berubah
- [ ] Catat file controller yang berubah jika ada
- [ ] Catat hasil testing manual