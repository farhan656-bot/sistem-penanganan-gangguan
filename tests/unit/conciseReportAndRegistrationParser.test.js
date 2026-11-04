const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseTelegramConciseReport,
  parseReporterRegistration,
  buildRegistrationFormatExample
} = require('../../utils/telegramParser');

describe('Concise Report & New Registration Parser', () => {
  test('1. Parsir laporan ringkas Sample 1 (Foto 1)', () => {
    const raw = `MOph261029120938540b44fe0
INF010036287|
UIM-env:Server-OrderLevelError-1070 : Unable to find service trail at Broadband_Access_RFS service created by autodesign

111404100949 Andriany maentrofa

Moban kk bg terimakasih`;

    const parsed = parseTelegramConciseReport(raw);
    assert.equal(parsed.isConciseReport, true);
    assert.equal(parsed.isValid, true);
    assert.equal(parsed.data.ticket_id, 'INF010036287');
    assert.equal(parsed.data.order_id, 'MOph261029120938540b44fe0');
    assert.match(parsed.data.summary, /Unable to find service trail/);
    assert.equal(parsed.data.service_id, '111404100949');
  });

  test('2. Parsir laporan ringkas Sample 2 (Foto 2)', () => {
    const raw = `Mohon bantuannya kakak abang
PDAk42604010118299835ce7c0
INF007650310|UIM-env:Server-OrderLevelError-1035: Service 3-4253CUG1_111409110913_INTERNET not found for action Modify
Terimakasih kakak abang`;

    const parsed = parseTelegramConciseReport(raw);
    assert.equal(parsed.isConciseReport, true);
    assert.equal(parsed.isValid, true);
    assert.equal(parsed.data.ticket_id, 'INF007650310');
    assert.equal(parsed.data.order_id, 'PDAk42604010118299835ce7c0');
    assert.match(parsed.data.summary, /Service 3-4253CUG1/);
    assert.equal(parsed.data.service_id, '111409110913_INTERNET');
  });

  test('3. Registrasi pelapor format baru (NAMA, NIK, PERUSAHAAN, UNIT, ASAL)', () => {
    const text = `DAFTAR
NAMA: Ahmad Fauzi
NIK: 654321
PERUSAHAAN: TELKOM AKSES
UNIT: DAMAN
ASAL: BKT`;

    const result = parseReporterRegistration(text);
    assert.equal(result.isRegistrationAttempt, true);
    assert.equal(result.isValid, true);
    assert.equal(result.data.full_name, 'Ahmad Fauzi');
    assert.equal(result.data.nik, '654321');
    assert.equal(result.data.company, 'TELKOM AKSES');
    assert.equal(result.data.unit, 'DAMAN');
    assert.equal(result.data.region_code, 'BKT');
    assert.equal(result.data.region_id, 2);
  });

  test('4. Registrasi pelapor dengan nama wilayah panjang (PADANG)', () => {
    const text = `DAFTAR
NAMA: Budi Santoso
NIK: 112233
PERUSAHAAN: TELKOM
UNIT: HD
ASAL: PADANG`;

    const result = parseReporterRegistration(text);
    assert.equal(result.isValid, true);
    assert.equal(result.data.region_code, 'PDG');
    assert.equal(result.data.region_id, 1);
  });

  test('5. Validasi kesalahan registrasi pelapor', () => {
    const invalidText = `DAFTAR
NAMA:
NIK: 123
PERUSAHAAN:
UNIT:
ASAL: MEDAN`;

    const result = parseReporterRegistration(invalidText);
    assert.equal(result.isRegistrationAttempt, true);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.length >= 4);
    assert.ok(result.errors.some((e) => e.includes('NAMA')));
    assert.ok(result.errors.some((e) => e.includes('NIK')));
    assert.ok(result.errors.some((e) => e.includes('PERUSAHAAN')));
    assert.ok(result.errors.some((e) => e.includes('ASAL')));
  });

  test('6. Format contoh registrasi sesuai ketentuan', () => {
    const example = buildRegistrationFormatExample();
    assert.match(example, /PERUSAHAAN:/);
    assert.match(example, /UNIT:/);
    assert.match(example, /ASAL: PDG/);
  });
});

