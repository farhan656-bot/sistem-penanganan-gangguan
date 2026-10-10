const test = require('node:test');
const assert = require('node:assert/strict');
const reportModel = require('../../models/reportModel');

test('Koordinator Assignment & Delegation Strict Workflow Rules', async (t) => {
  const koordinatorUser = {
    id: 5,
    username: 'koordinator',
    full_name: 'Koordinator Utama',
    role: 'koordinator'
  };

  await t.test('1. Koordinator tidak dapat mendelegasikan tiket yang sedang diambil oleh eksekutor', async () => {
    // INF000123 berstatus 'diambil' oleh eksekutor (id: 1)
    await assert.rejects(
      async () => {
        // Coba delegasikan ke eksekutor BKT (id: 3)
        await reportModel.delegateReport('INF000123', koordinatorUser, 3, 'Uji coba delegasi langsung');
      },
      {
        message: 'Tiket sudah memiliki penanggung jawab aktif atau tidak tersedia. Batalkan penugasan terlebih dahulu sebelum melakukan delegasi.'
      }
    );
  });

  await t.test('2. Koordinator tidak dapat menandai In Progress tiket yang sedang diambil oleh eksekutor lain', async () => {
    // INF000123 berstatus 'diambil' oleh eksekutor (id: 1)
    await assert.rejects(
      async () => {
        await reportModel.markReportInProgress('INF000123', koordinatorUser);
      },
      {
        message: 'Tiket ini sedang ditangani oleh teknisi lain. Batalkan penugasan terlebih dahulu jika ingin mengambil alih pengerjaan.'
      }
    );
  });

  await t.test('3. Koordinator tidak dapat menyelesaikan tiket yang sedang diambil oleh eksekutor lain', async () => {
    // INF000123 berstatus 'diambil' oleh eksekutor (id: 1)
    await assert.rejects(
      async () => {
        await reportModel.completeReport(
          'INF000123',
          koordinatorUser,
          { completion_status: 'selesai', completion_notes: 'Penyelesaian sepihak' },
          []
        );
      },
      {
        message: 'Tiket ini sedang ditangani oleh teknisi lain. Batalkan penugasan terlebih dahulu jika ingin mengambil alih pengerjaan.'
      }
    );
  });
});
