const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ticketStatusMeta } = require('../../utils/viewHelpers');

describe('Unit Test: utils/viewHelpers.js', () => {
  describe('ticketStatusMeta()', () => {
    it('1. harus mengembalikan badge dan label yang tepat untuk empat status operasional utama', () => {
      const tersedia = ticketStatusMeta('tersedia');
      assert.deepEqual(tersedia, {
        cls: 'text-bg-primary',
        label: 'Tersedia'
      });

      const diambil = ticketStatusMeta('diambil');
      assert.deepEqual(diambil, {
        cls: 'text-bg-warning',
        label: 'Diambil'
      });

      const didelegasikan = ticketStatusMeta('didelegasikan');
      assert.deepEqual(didelegasikan, {
        cls: 'text-bg-info',
        label: 'Didelegasikan'
      });

      const selesai = ticketStatusMeta('selesai');
      assert.deepEqual(selesai, {
        cls: 'text-bg-success',
        label: 'Selesai'
      });
    });

    it('2. harus mengembalikan badge dan label yang tepat untuk status tindak lanjut dan eskalasi', () => {
      const tindakLanjut = ticketStatusMeta('perlu_tindak_lanjut');
      assert.deepEqual(tindakLanjut, {
        cls: 'text-bg-warning',
        label: 'Perlu Tindak Lanjut'
      });

      const eskalasi = ticketStatusMeta('eskalasi');
      assert.deepEqual(eskalasi, {
        cls: 'text-bg-danger',
        label: 'Eskalasi'
      });
    });

    it('3. harus mengembalikan badge secondary dan label dash untuk status baru', () => {
      const baru = ticketStatusMeta('baru');
      assert.deepEqual(baru, {
        cls: 'text-bg-secondary',
        label: '-'
      });
    });

    it('4. harus menangani status tidak dikenal, input null, dan format huruf besar/spasi dengan benar', () => {
      // Input null, undefined, atau string kosong
      const nullStatus = ticketStatusMeta(null);
      assert.deepEqual(nullStatus, {
        cls: 'text-bg-secondary',
        label: '-'
      });

      const emptyStatus = ticketStatusMeta('');
      assert.deepEqual(emptyStatus, {
        cls: 'text-bg-secondary',
        label: '-'
      });

      // Status tidak dikenal
      const unknownStatus = ticketStatusMeta('status_khusus');
      assert.deepEqual(unknownStatus, {
        cls: 'text-bg-secondary',
        label: 'Status Khusus'
      });

      // Huruf besar dan trailing spaces yang dinormalisasi
      const uppercaseStatus = ticketStatusMeta('  TERSEDIA  ');
      assert.deepEqual(uppercaseStatus, {
        cls: 'text-bg-primary',
        label: 'Tersedia'
      });
    });
  });
});
