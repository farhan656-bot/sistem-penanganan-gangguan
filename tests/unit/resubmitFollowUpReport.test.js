const test = require('node:test');
const assert = require('node:assert/strict');
const reportModel = require('../../models/reportModel');
const { parseTelegramAllFields } = require('../../utils/telegramParser');

test('Resubmit Follow Up Report (Perlu Tindak Lanjut) Workflow', async (t) => {
  await t.test('1. parseTelegramAllFields mengekstrak Ticket ID dan atribut perbaikan', () => {
    const text = [
      'TICKET ID: INF770188',
      'STO: BDT',
      'ORDER ID: ORD770188-REV',
      'SUMMARY: Kendala kabel diperbaiki, mohon proses ulang'
    ].join('\n');

    const parsed = parseTelegramAllFields(text);
    assert.equal(parsed.ticketId, 'INF770188');
    assert.equal(parsed.fields.sto, 'BDT');
    assert.equal(parsed.fields.order_id, 'ORD770188-REV');
    assert.equal(parsed.fields.summary, 'Kendala kabel diperbaiki, mohon proses ulang');
  });

  await t.test('2. Menolak resubmit jika tiket bukan berstatus perlu_tindak_lanjut', async () => {
    // INF000123 berstatus 'diambil', bukan 'perlu_tindak_lanjut'
    await assert.rejects(
      async () => {
        await reportModel.resubmitFollowUpReport('INF000123', {
          fields: { sto: 'BDT' }
        });
      },
      {
        message: 'Hanya laporan berstatus perlu tindak lanjut yang dapat di-resubmit.'
      }
    );
  });

  await t.test('3. Menolak resubmit jika Ticket ID tidak terdaftar', async () => {
    await assert.rejects(
      async () => {
        await reportModel.resubmitFollowUpReport('INF999999NONEXISTENT', {
          fields: { sto: 'BDT' }
        });
      },
      {
        message: 'Laporan tidak ditemukan.'
      }
    );
  });

  await t.test('4. Berhasil memproses resubmit tiket perlu_tindak_lanjut: status menjadi tersedia, field diperbarui, dan is_resubmitted menjadi true', async () => {
    const pool = require('../../config/db');
    const testTicketId = 'TEST-RESUBMIT-' + Date.now();

    // 1. Buat tiket uji dengan status 'perlu_tindak_lanjut'
    await pool.query(
      `INSERT INTO reports (
        ticket_id, order_id, summary, reported_region_id, status_internal,
        status_wfm, completion_status, completion_notes, received_at, created_at, updated_at
      ) VALUES (?, ?, ?, 1, 'perlu_tindak_lanjut', 'In Progress', 'perlu_tindak_lanjut', 'Kurang data STO', NOW(), NOW(), NOW())`,
      [testTicketId, 'ORD-' + testTicketId, 'Kendala awal']
    );

    try {
      // 2. Jalankan resubmit
      const result = await reportModel.resubmitFollowUpReport(testTicketId, {
        fields: {
          sto: 'BDT',
          summary: 'Summary telah diperbaiki oleh pelapor'
        },
        telegram_meta: {
          chat_id: 123456789,
          sender_username: 'pelapor_test'
        }
      });

      assert.equal(result.success, true);
      assert.equal(result.ticketId, testTicketId);

      // 3. Verifikasi kondisi tiket setelah resubmit
      const updatedReport = await reportModel.getReportByTicketId(testTicketId);
      assert.ok(updatedReport, 'Tiket harus ditemukan');
      assert.equal(updatedReport.status_internal, 'tersedia', 'Status tiket harus kembali ke tersedia');
      assert.equal(updatedReport.status_wfm, 'OPEN', 'Status WFM harus direset ke OPEN');
      assert.equal(updatedReport.completion_status, null, 'completion_status harus direset ke null');
      assert.equal(updatedReport.completion_notes, null, 'completion_notes harus direset ke null');
      assert.equal(updatedReport.sto, 'BDT', 'Field STO harus diperbarui');
      assert.equal(updatedReport.summary, 'Summary telah diperbaiki oleh pelapor', 'Field summary harus diperbarui');
      assert.equal(updatedReport.is_resubmitted, true, 'is_resubmitted harus bernilai true');
    } finally {
      // 4. Bersihkan data pengujian
      await pool.query('DELETE FROM report_logs WHERE ticket_id = ?', [testTicketId]);
      await pool.query('DELETE FROM reports WHERE ticket_id = ?', [testTicketId]);
    }
  });
});
