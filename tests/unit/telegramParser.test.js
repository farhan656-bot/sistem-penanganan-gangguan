const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseTelegramCoreMessage,
  parseTelegramEnrichmentMessage,
  extractTicketIdFromText,
  hasCoreIntakeStructure
} = require('../../utils/telegramParser');

describe('Unit Test: utils/telegramParser.js', () => {
  describe('parseTelegramCoreMessage()', () => {
    it('1. harus berhasil mem-parsing pesan laporan dengan format lengkap dan valid', () => {
      const validMessage = [
        'TICKET ID: INF000123',
        'ORDER ID: ORD000123',
        'WO NUMBER: WO000123',
        'SERVICE TYPE: INTERNET',
        'SEGMENT: ENTERPRISE',
        'PROVIDER: TELKOM',
        'TELKOM AREA: SUMBAR',
        'BRANCH: PADANG',
        'CLUSTER: KOTA PADANG',
        'STO: BDT',
        'SUMMARY: Gangguan koneksi internet pelanggan area Padang',
        'SERVICE ID: SRV000123',
        'STATUS WFM: OPEN',
        'STATUS ANDALAS: -',
        'REGION: PDG'
      ].join('\n');

      const result = parseTelegramCoreMessage(validMessage);

      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
      assert.notEqual(result.data, null);
      assert.equal(result.data.ticket_id, 'INF000123');
      assert.equal(result.data.order_id, 'ORD000123');
      assert.equal(result.data.summary, 'Gangguan koneksi internet pelanggan area Padang');
      assert.equal(result.data.region, 'PDG');
      assert.equal(result.data.branch_name, 'PADANG');
      assert.equal(result.data.sto, 'BDT');
    });

    it('2. harus mengembalikan isValid false jika input pesan kosong, null, atau non-string', () => {
      const emptyResult = parseTelegramCoreMessage('');
      const whitespaceResult = parseTelegramCoreMessage('   \n  \t ');
      const nullResult = parseTelegramCoreMessage(null);
      const undefinedResult = parseTelegramCoreMessage(undefined);

      assert.equal(emptyResult.isValid, false);
      assert.deepEqual(emptyResult.errors, ['Pesan laporan kosong.']);
      assert.equal(emptyResult.data, null);

      assert.equal(whitespaceResult.isValid, false);
      assert.deepEqual(whitespaceResult.errors, ['Pesan laporan kosong.']);

      assert.equal(nullResult.isValid, false);
      assert.deepEqual(nullResult.errors, ['Pesan laporan kosong.']);

      assert.equal(undefinedResult.isValid, false);
      assert.deepEqual(undefinedResult.errors, ['Pesan laporan kosong.']);
    });

    it('3. harus mengembalikan daftar error jika ada field wajib yang tidak lengkap', () => {
      // Hanya ada TICKET ID dan REGION, kurang ORDER ID dan SUMMARY
      const incompleteMessage = [
        'TICKET ID: INF000456',
        'REGION: BKT'
      ].join('\n');

      const result = parseTelegramCoreMessage(incompleteMessage);

      assert.equal(result.isValid, false);
      assert.equal(result.data, null);
      assert.ok(result.errors.includes('Field ORDER_ID wajib diisi.'));
      assert.ok(result.errors.includes('Field SUMMARY wajib diisi.'));
      assert.equal(result.errors.length, 2);
    });

    it('4. harus menolak kode REGION di luar PDG atau BKT', () => {
      const invalidRegionMessage = [
        'TICKET ID: INF000789',
        'ORDER ID: ORD000789',
        'SUMMARY: Gangguan router',
        'REGION: JKT'
      ].join('\n');

      const result = parseTelegramCoreMessage(invalidRegionMessage);

      assert.equal(result.isValid, false);
      assert.equal(result.data, null);
      assert.ok(result.errors.includes('Field REGION tidak valid. Gunakan PDG atau BKT.'));
    });

    it('5. harus berhasil menormalisasi variasi alias label huruf kecil dan spasi', () => {
      const variedMessage = [
        'ticket id : INF000999',
        'ORDERID: ORD000999',
        'summary : Gangguan link fiber optik',
        'branch name : PADANG',
        'region: bkt'
      ].join('\n');

      const result = parseTelegramCoreMessage(variedMessage);

      assert.equal(result.isValid, true);
      assert.equal(result.errors.length, 0);
      assert.equal(result.data.ticket_id, 'INF000999');
      assert.equal(result.data.order_id, 'ORD000999');
      assert.equal(result.data.summary, 'Gangguan link fiber optik');
      assert.equal(result.data.branch_name, 'PADANG');
      assert.equal(result.data.region, 'BKT');
    });
  });

  describe('parseTelegramEnrichmentMessage()', () => {
    it('1. harus berhasil mem-parsing pesan enrichment yang valid dengan Ticket ID dan atribut pengayaan', () => {
      const validEnrichment = [
        'TICKET ID: INF000123',
        'BRANCH: PADANG',
        'STO: BDT',
        'SERVICE TYPE: INTERNET',
        'STATUS WFM: IN_PROGRESS'
      ].join('\n');

      const result = parseTelegramEnrichmentMessage(validEnrichment);

      assert.equal(result.isValid, true);
      assert.equal(result.hasTicketId, true);
      assert.equal(result.ticketId, 'INF000123');
      assert.equal(result.errors.length, 0);
      assert.equal(result.fields.branch_name, 'PADANG');
      assert.equal(result.fields.sto, 'BDT');
      assert.equal(result.fields.service_type, 'INTERNET');
      assert.equal(result.fields.status_wfm, 'IN_PROGRESS');
    });

    it('2. harus mengembalikan isValid false jika pesan enrichment tidak menyertakan Ticket ID', () => {
      const noTicketIdMessage = [
        'BRANCH: PADANG',
        'STO: BDT'
      ].join('\n');

      const result = parseTelegramEnrichmentMessage(noTicketIdMessage);

      assert.equal(result.isValid, false);
      assert.equal(result.hasTicketId, false);
      assert.equal(result.ticketId, null);
      assert.ok(result.errors.includes('Ticket ID tidak ditemukan pada data tambahan.'));
    });

    it('3. harus mengembalikan isValid false jika Ticket ID ada tetapi tidak ada field atribut yang valid', () => {
      const noValidFieldsMessage = [
        'TICKET ID: INF000123',
        'UNKNOWN_FIELD_1: Nilai',
        'CUSTOM_FIELD_2: Data'
      ].join('\n');

      const result = parseTelegramEnrichmentMessage(noValidFieldsMessage);

      assert.equal(result.isValid, false);
      assert.equal(result.hasTicketId, true);
      assert.equal(result.ticketId, 'INF000123');
      assert.deepEqual(result.fields, {});
      assert.ok(result.errors.includes('Tidak ada field tambahan yang valid.'));
    });

    it('4. harus mengembalikan isValid false pada input kosong, null, atau hanya whitespace', () => {
      const emptyResult = parseTelegramEnrichmentMessage('');
      const whitespaceResult = parseTelegramEnrichmentMessage('   \n  ');
      const nullResult = parseTelegramEnrichmentMessage(null);

      assert.equal(emptyResult.isValid, false);
      assert.equal(emptyResult.hasTicketId, false);
      assert.deepEqual(emptyResult.errors, ['Pesan tambahan kosong.']);

      assert.equal(whitespaceResult.isValid, false);
      assert.equal(whitespaceResult.hasTicketId, false);
      assert.deepEqual(whitespaceResult.errors, ['Pesan tambahan kosong.']);

      assert.equal(nullResult.isValid, false);
      assert.equal(nullResult.hasTicketId, false);
      assert.deepEqual(nullResult.errors, ['Pesan tambahan kosong.']);
    });
  });

  describe('extractTicketIdFromText()', () => {
    it('1. harus berhasil mengekstrak Ticket ID standar dari teks berlabel TICKET ID', () => {
      const text = 'TICKET ID: INF990001\nSEGMENT: RETAIL';
      const result = extractTicketIdFromText(text);
      assert.equal(result, 'INF990001');
    });

    it('2. harus mengembalikan null dan TIDAK menelan newline menjadi ORDER ID: jika TICKET ID kosong', () => {
      const invalidIntake = [
        'TICKET ID:',
        'ORDER ID:',
        'SUMMARY: Kendala',
        'REGION: PDG'
      ].join('\n');

      const result = extractTicketIdFromText(invalidIntake);
      assert.equal(result, null);
    });

    it('3. harus mengembalikan null jika input pesan kosong, null, atau non-string', () => {
      assert.equal(extractTicketIdFromText(''), null);
      assert.equal(extractTicketIdFromText('   '), null);
      assert.equal(extractTicketIdFromText(null), null);
      assert.equal(extractTicketIdFromText(undefined), null);
    });

    it('4. harus berhasil mengekstrak Ticket ID dengan variasi spasi horizontal dan huruf kecil', () => {
      const variedText = '  ticket id  :   inf-000555  \nBRANCH: PADANG';
      const result = extractTicketIdFromText(variedText);
      assert.equal(result, 'INF-000555');
    });
  });

  describe('hasCoreIntakeStructure()', () => {
    it('1. harus mengembalikan true untuk pesan yang memiliki struktur template core intake meski field kosong', () => {
      const tc05Payload = [
        'FALLOUT TYPE: DAMAN',
        'TANGGAL TIKET: 2026-08-25 09:51:33',
        'TICKET ID:',
        'ORDER ID:',
        'WO NUMBER:',
        'SERVICE TYPE: WFM: DSC',
        'SEGMENT:',
        'PROVIDER: TELKOMSEL',
        'TELKOM AREA: INNER SUMBAR JAMBI',
        'BRANCH: PADANG',
        'CLUSTER: KOTA PADANG',
        'STO: PDC',
        'SUMMARY: Kendala Teknik|ODP FULL pt3',
        'SERVICE ID: 2004',
        'STATUS WFM: OPEN',
        'STATUS ANDALAS: -',
        'REGION: PDG'
      ].join('\n');

      assert.equal(hasCoreIntakeStructure(tc05Payload), true);

      const minimalInvalidCore = [
        'TICKET ID:',
        'ORDER ID:',
        'SUMMARY: Kendala',
        'REGION: PDG'
      ].join('\n');

      assert.equal(hasCoreIntakeStructure(minimalInvalidCore), true);
    });

    it('2. harus mengembalikan false untuk pesan enrichment yang hanya memuat TICKET ID dan atribut tambahan', () => {
      const enrichmentText = [
        'TICKET ID: INF990001',
        'SEGMENT: RETAIL'
      ].join('\n');

      assert.equal(hasCoreIntakeStructure(enrichmentText), false);

      const multiFieldEnrichment = [
        'TICKET ID: INF990001',
        'BRANCH: PADANG',
        'STO: BDT',
        'PROVIDER: TELKOMSEL'
      ].join('\n');

      assert.equal(hasCoreIntakeStructure(multiFieldEnrichment), false);
    });

    it('3. harus mengembalikan false untuk pesan teks bebas, kosong, atau non-string', () => {
      assert.equal(hasCoreIntakeStructure('Halo bot, mau lapor gangguan internet'), false);
      assert.equal(hasCoreIntakeStructure(''), false);
      assert.equal(hasCoreIntakeStructure(null), false);
      assert.equal(hasCoreIntakeStructure(undefined), false);
    });
  });

  describe('Regression TC-05: Disambiguasi Core Intake vs Text Enrichment', () => {
    it('1. Regression 1: pesan template core intake dengan field wajib kosong harus menghasilkan isValid=false dan extractTicketIdFromText() null', () => {
      const input = [
        'TICKET ID:',
        'ORDER ID:',
        'SUMMARY: Kendala',
        'REGION: PDG'
      ].join('\n');

      const coreParsed = parseTelegramCoreMessage(input);
      assert.equal(coreParsed.isValid, false);
      assert.ok(coreParsed.errors.includes('Field TICKET_ID wajib diisi.'));
      assert.ok(coreParsed.errors.includes('Field ORDER_ID wajib diisi.'));

      const extractedId = extractTicketIdFromText(input);
      assert.notEqual(extractedId, 'ORDER ID:');
      assert.equal(extractedId, null);

      assert.equal(hasCoreIntakeStructure(input), true);
    });

    it('2. Regression 2: valid enrichment (TICKET ID: INF990001, SEGMENT: RETAIL) harus dikenali sebagai enrichment', () => {
      const input = [
        'TICKET ID: INF990001',
        'SEGMENT: RETAIL'
      ].join('\n');

      assert.equal(hasCoreIntakeStructure(input), false);

      const enrichmentParsed = parseTelegramEnrichmentMessage(input);
      assert.equal(enrichmentParsed.isValid, true);
      assert.equal(enrichmentParsed.hasTicketId, true);
      assert.equal(enrichmentParsed.ticketId, 'INF990001');
      assert.equal(enrichmentParsed.fields.segment, 'RETAIL');
    });

    it('3. Regression 3: enrichment dengan Ticket ID yang formatnya valid tetap menghasilkan hasTicketId=true dan ticketId yang benar', () => {
      const input = [
        'TICKET ID: INF999999',
        'BRANCH: PADANG',
        'STO: BDT'
      ].join('\n');

      assert.equal(hasCoreIntakeStructure(input), false);

      const enrichmentParsed = parseTelegramEnrichmentMessage(input);
      assert.equal(enrichmentParsed.isValid, true);
      assert.equal(enrichmentParsed.hasTicketId, true);
      assert.equal(enrichmentParsed.ticketId, 'INF999999');
      assert.equal(enrichmentParsed.fields.branch_name, 'PADANG');
      assert.equal(enrichmentParsed.fields.sto, 'BDT');
    });

    it('4. Regression 4: valid core intake tetap berhasil di-parsing dengan lengkap dan valid', () => {
      const input = [
        'TICKET ID: INF000123',
        'ORDER ID: ORD000123',
        'WO NUMBER: WO000123',
        'SERVICE TYPE: INTERNET',
        'SEGMENT: ENTERPRISE',
        'PROVIDER: TELKOM',
        'TELKOM AREA: SUMBAR',
        'BRANCH: PADANG',
        'CLUSTER: KOTA PADANG',
        'STO: BDT',
        'SUMMARY: Gangguan koneksi internet pelanggan area Padang',
        'SERVICE ID: SRV000123',
        'STATUS WFM: OPEN',
        'STATUS ANDALAS: -',
        'REGION: PDG'
      ].join('\n');

      assert.equal(hasCoreIntakeStructure(input), true);

      const coreParsed = parseTelegramCoreMessage(input);
      assert.equal(coreParsed.isValid, true);
      assert.equal(coreParsed.errors.length, 0);
      assert.equal(coreParsed.data.ticket_id, 'INF000123');
      assert.equal(coreParsed.data.order_id, 'ORD000123');
      assert.equal(coreParsed.data.summary, 'Gangguan koneksi internet pelanggan area Padang');
      assert.equal(coreParsed.data.region, 'PDG');
      assert.equal(coreParsed.data.branch_name, 'PADANG');
      assert.equal(coreParsed.data.sto, 'BDT');
    });
  });
});
