# Checklist — Separate Completion Evidence and Telegram Media

## Data Separation Checklist
- [ ] Attachment source `telegram` tidak tampil di Bukti Penyelesaian
- [ ] Attachment source `telegram` tampil di Media Telegram
- [ ] Attachment non-telegram tampil di Bukti Penyelesaian
- [ ] Source NULL tidak menyebabkan error
- [ ] Data lama tetap aman
- [ ] Database tidak berubah

## Full Detail Page Checklist
- [ ] Bagian Bukti Penyelesaian memakai data completion evidence
- [ ] Bagian Media Telegram memakai data media Telegram
- [ ] Bukti Penyelesaian kosong jika Eksekutor belum upload bukti
- [ ] Empty state Bukti Penyelesaian tampil jelas
- [ ] Media Telegram kosong menampilkan empty state
- [ ] Tombol Buka tetap berfungsi
- [ ] Tampilan tidak tercampur lagi

## Modal Detail Checklist
- [ ] Modal detail tetap bisa dibuka
- [ ] Modal detail tetap memisahkan bukti penyelesaian dan media Telegram
- [ ] Modal tidak error untuk tiket lama
- [ ] Modal tidak error untuk tiket tanpa attachment
- [ ] Modal tidak error untuk tiket dengan keduanya

## Regression Checklist
- [ ] Upload bukti penyelesaian tetap berjalan
- [ ] Penyelesaian status selesai tetap berjalan
- [ ] Return evidence F013 tetap berjalan
- [ ] Eskalasi DIIT F014 tetap berjalan
- [ ] Telegram intake tidak berubah
- [ ] Pending media tidak berubah
- [ ] Text enrichment tidak berubah
- [ ] Region Switch F007 tidak berubah
- [ ] KPI Supervisor tidak berubah
- [ ] RBAC tidak berubah

## Manual Verification Checklist
- [ ] Buka tiket hanya dengan media Telegram
- [ ] Pastikan Bukti Penyelesaian kosong
- [ ] Pastikan Media Telegram berisi media pelapor
- [ ] Upload bukti penyelesaian sebagai Eksekutor
- [ ] Buka halaman detail penuh
- [ ] Pastikan bukti Eksekutor tampil di Bukti Penyelesaian
- [ ] Pastikan media pelapor tetap di Media Telegram
- [ ] Buka modal detail
- [ ] Pastikan modal tetap benar
- [ ] Test tiket tanpa attachment
- [ ] Test tiket dengan attachment lama

## Evidence Checklist
- [ ] Screenshot Bukti Penyelesaian sebelum ada upload Eksekutor
- [ ] Screenshot Media Telegram
- [ ] Screenshot Bukti Penyelesaian setelah upload Eksekutor
- [ ] Screenshot modal detail
- [ ] Catatan file yang berubah
- [ ] Catatan hasil testing manual