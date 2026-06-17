# Checklist — File Upload Storage Strategy

## Storage Checklist
- [ ] File disimpan di folder upload
- [ ] Database hanya menyimpan path/metadata
- [ ] File binary tidak disimpan di database
- [ ] Nama file aman
- [ ] Folder upload rapi

## Limit Checklist
- [ ] Ukuran file dibatasi
- [ ] Jumlah file dibatasi
- [ ] Tipe file dibatasi
- [ ] File valid diterima
- [ ] File tidak valid ditolak

## Security Checklist
- [ ] EXE ditolak
- [ ] Script file ditolak
- [ ] Path traversal dicegah
- [ ] Nama file tidak mentah dari user
- [ ] Server tidak crash saat file tidak valid

## Feature Checklist
- [ ] Upload bukti tetap berjalan
- [ ] Paste screenshot tetap berjalan
- [ ] Media Telegram tetap berjalan
- [ ] Tab Bukti Penyelesaian tetap berjalan
- [ ] Tab Media Telegram tetap berjalan
- [ ] F023 tetap berjalan

## Error Message Checklist
- [ ] Pesan file terlalu besar jelas
- [ ] Pesan tipe file tidak didukung jelas
- [ ] Pesan jumlah file terlalu banyak jelas
- [ ] User dapat memahami penyebab upload gagal

## Regression Checklist
- [ ] Database tidak berubah
- [ ] Telegram intake tidak berubah
- [ ] Telegram parsing tidak berubah
- [ ] F017 tidak berubah
- [ ] F018 tidak berubah
- [ ] F019 tidak berubah
- [ ] F021 tidak berubah
- [ ] F022 tidak berubah
- [ ] F023 tidak berubah