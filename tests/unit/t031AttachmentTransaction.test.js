const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../../config/db');
const attachmentModel = require('../../models/attachmentModel');
const reportModel = require('../../models/reportModel');
describe('T031 — Validate Attachment Transaction & Read Integrity', () => {
  after(async () => {
    await pool.end();
  });
  describe('1. Audit Attachment & Report Model Signatures and Queries', () => {
    it('attachmentModel.createAttachment menerima trxConnection opsional dan menggunakannya', async () => {
      assert.equal(typeof attachmentModel.createAttachment, 'function');
      let customConnUsed = false;
      const fakeConn = {
        query: async (sql) => {
          customConnUsed = true;
          if (String(sql).includes('FROM type_attachment')) {
            return [[{ id: 2 }]];
          }
          return [{ insertId: 12345 }];
        }
      };
      const id = await attachmentModel.createAttachment({
        report_id: 1,
        ticket_id: 'INF000001',
        type_attachment_code: 'bukti_penanganan',
        file_name: 'test.jpg'
      }, fakeConn);
      assert.equal(id, 12345);
      assert.equal(customConnUsed, true, 'trxConnection harus digunakan saat diberikan');
    });
    it('attachmentModel.getAttachmentsByTicketId melakukan LEFT JOIN type_attachment', async () => {
      assert.equal(typeof attachmentModel.getAttachmentsByTicketId, 'function');
      const rows = await attachmentModel.getAttachmentsByTicketId('INF000001');
      assert.ok(Array.isArray(rows));
      assert.ok(rows.length > 0);
      const first = rows[0];
      assert.equal(first.ticket_id, 'INF000001');
      assert.ok('type_attachment_id' in first);
      assert.ok('type_attachment_code' in first);
      assert.ok('type_attachment_name' in first);
      assert.equal(first.type_attachment_code, 'bukti_penanganan');
      assert.equal(first.type_attachment_name, 'Bukti Penanganan (Sistem)');
    });
    it('attachmentModel.getAttachmentsByReportId menyertakan type_attachment_code dan type_attachment_name', async () => {
      assert.equal(typeof attachmentModel.getAttachmentsByReportId, 'function');
      const rows = await attachmentModel.getAttachmentsByReportId(1);
      assert.ok(Array.isArray(rows));
      assert.ok(rows.length > 0);
      const first = rows[0];
      assert.ok('type_attachment_id' in first);
      assert.ok('type_attachment_code' in first);
      assert.ok('type_attachment_name' in first);
      assert.equal(first.type_attachment_code, 'bukti_penanganan');
    });
    it('reportModel.getAttachmentsByReportId melakukan LEFT JOIN type_attachment', async () => {
      assert.equal(typeof reportModel.getAttachmentsByReportId, 'function');
      const rows = await reportModel.getAttachmentsByReportId(1);
      assert.ok(Array.isArray(rows));
      assert.ok(rows.length > 0);
      const first = rows[0];
      assert.ok('type_attachment_id' in first);
      assert.ok('type_attachment_code' in first);
      assert.ok('type_attachment_name' in first);
      assert.equal(first.type_attachment_code, 'bukti_penanganan');
    });
    it('reportModel.getAttachmentsByTicketId tersedia dan mendelegasikan ke attachmentModel', async () => {
      assert.equal(typeof reportModel.getAttachmentsByTicketId, 'function');
      const rows = await reportModel.getAttachmentsByTicketId('INF000001');
      assert.ok(Array.isArray(rows));
      assert.ok(rows.length > 0);
      assert.equal(rows[0].type_attachment_code, 'bukti_penanganan');
    });
    it('bukti_pelapor dari Telegram terbaca dengan type_attachment_id=1 dan type_attachment_code=bukti_pelapor', async () => {
      const rows = await attachmentModel.getAttachmentsByTicketId('INF000124');
      assert.ok(Array.isArray(rows));
      assert.ok(rows.length > 0);
      const pelapor = rows.find(r => r.type_attachment_code === 'bukti_pelapor');
      assert.ok(pelapor, 'Harus ada lampiran bukti_pelapor untuk tiket INF000124');
      assert.equal(pelapor.type_attachment_id, 1);
      assert.equal(pelapor.type_attachment_name, 'Bukti Pelapor (Telegram)');
    });
  });
  describe('2. Atomic Transaction Propagation & Rollback Verification', () => {
    it('completeReport menggunakan trxConnection untuk update status, insert attachment, dan insert log', async () => {
      const callLog = [];
      const mockConn = {
        beginTransaction: async () => { callLog.push('beginTransaction'); },
        query: async (sql, params) => {
          callLog.push({ action: 'query', sql: String(sql).trim().substring(0, 30), params });
          if (String(sql).includes('FOR UPDATE')) {
            return [[{
              id: 9999,
              ticket_id: 'TEST-TRX-001',
              status_internal: 'diambil',
              reported_region_id: 1,
              current_region_id: 1,
              current_assigned_user_id: 42
            }]];
          }
          if (String(sql).includes('report_assignments')) {
            return [[{ assigned_to_user_id: 42 }]];
          }
          if (String(sql).includes('UPDATE reports')) {
            return [{ affectedRows: 1 }];
          }
          if (String(sql).includes('SELECT id FROM type_attachment')) {
            return [[{ id: 2 }]];
          }
          if (String(sql).includes('INSERT INTO report_attachments')) {
            return [{ insertId: 8888 }];
          }
          if (String(sql).includes('SELECT id, ticket_id FROM reports')) {
            return [[{ id: 9999, ticket_id: 'TEST-TRX-001' }]];
          }
          if (String(sql).includes('INSERT INTO report_logs')) {
            return [{ insertId: 7777 }];
          }
          return [[]];
        },
        commit: async () => { callLog.push('commit'); },
        rollback: async () => { callLog.push('rollback'); },
        release: () => { callLog.push('release'); }
      };
      const originalGetConnection = pool.getConnection;
      pool.getConnection = async () => mockConn;
      try {
        const currentUser = { id: 42, full_name: 'Eksekutor Test', role: 'eksekutor' };
        const formData = {
          completion_status: 'selesai',
          completion_notes: 'Pekerjaan selesai dilakukan.'
        };
        const fileData = [{
          filename: 'bukti-selesai.jpg',
          originalname: 'bukti-selesai.jpg',
          mimetype: 'image/jpeg',
          size: 2048,
          path: 'public/uploads/reports/bukti-selesai.jpg'
        }];
        const result = await reportModel.completeReport('TEST-TRX-001', currentUser, formData, fileData);
        assert.equal(result.success, true);
        // Verify transaction sequence
        assert.equal(callLog[0], 'beginTransaction');
        assert.ok(callLog.includes('commit'), 'Harus memanggil commit');
        assert.ok(!callLog.includes('rollback'), 'Tidak boleh memanggil rollback saat sukses');
        assert.equal(callLog[callLog.length - 1], 'release', 'Harus memanggil release di blok finally');
      } finally {
        pool.getConnection = originalGetConnection;
      }
    });
    it('Ketika insert attachment gagal, completeReport melakukan rollback penuh tanpa menyimpan perubahan status atau log', async () => {
      const callLog = [];
      const mockConn = {
        beginTransaction: async () => { callLog.push('beginTransaction'); },
        query: async (sql, params) => {
          callLog.push({ action: 'query', sql: String(sql).trim().substring(0, 30) });
          if (String(sql).includes('FOR UPDATE')) {
            return [[{
              id: 9999,
              ticket_id: 'TEST-TRX-ERR',
              status_internal: 'diambil',
              reported_region_id: 1,
              current_region_id: 1,
              current_assigned_user_id: 42
            }]];
          }
          if (String(sql).includes('report_assignments')) {
            return [[{ assigned_to_user_id: 42 }]];
          }
          if (String(sql).includes('UPDATE reports')) {
            return [{ affectedRows: 1 }];
          }
          if (String(sql).includes('SELECT id FROM type_attachment')) {
            // Simulasi error saat menyimpan attachment
            throw new Error('SIMULASI_GAGAL_ATTACHMENT: Disk IO failure saat menyimpan berkas');
          }
          return [[]];
        },
        commit: async () => { callLog.push('commit'); },
        rollback: async () => { callLog.push('rollback'); },
        release: () => { callLog.push('release'); }
      };
      const originalGetConnection = pool.getConnection;
      pool.getConnection = async () => mockConn;
      try {
        const currentUser = { id: 42, full_name: 'Eksekutor Test', role: 'eksekutor' };
        const formData = {
          completion_status: 'selesai',
          completion_notes: 'Pekerjaan selesai.'
        };
        const fileData = [{
          filename: 'bukti-err.jpg',
          originalname: 'bukti-err.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          path: 'public/uploads/reports/bukti-err.jpg'
        }];
        await assert.rejects(
          async () => {
            await reportModel.completeReport('TEST-TRX-ERR', currentUser, formData, fileData);
          },
          /SIMULASI_GAGAL_ATTACHMENT/
        );
        // Verify transaction rollback behavior
        assert.equal(callLog[0], 'beginTransaction');
        assert.ok(callLog.includes('rollback'), 'Harus memanggil rollback saat attachment gagal');
        assert.ok(!callLog.includes('commit'), 'JANGAN memanggil commit saat terjadi kegagalan');
        assert.equal(callLog[callLog.length - 1], 'release', 'Harus memanggil release di blok finally');
      } finally {
        pool.getConnection = originalGetConnection;
      }
    });
  });
  describe('3. Live Database Isolated Rollback Test (Zero Mutation Guarantee)', () => {
    it('Uji transaksi live: rollback membatalkan seluruh operasi laporan, attachment, dan log secara atomik', async () => {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        // 1. Dapatkan region valid untuk dummy insert di dalam transaksi
        const [regions] = await conn.query('SELECT id FROM regions LIMIT 1');
        const regionId = regions[0].id;
        // 2. Dapatkan user valid untuk dummy insert
        const [users] = await conn.query('SELECT id FROM users LIMIT 1');
        const userId = users[0].id;
        const testTicketId = 'T031-TEST-ISOLATED';
        // 3. Insert report sementara di dalam transaksi yang akan di-rollback
        const [repResult] = await conn.query(
          `
          INSERT INTO reports
          (
            ticket_id, source_channel, summary, status_internal,
            reported_region_id, current_region_id, current_assigned_user_id,
            created_at, updated_at
          )
          VALUES (?, 'telegram', 'T031 Atomic Test Report', 'diambil', ?, ?, ?, NOW(), NOW())
          `,
          [testTicketId, regionId, regionId, userId]
        );
        const testReportId = repResult.insertId;
        // 4. Update status ke 'selesai' di dalam transaksi
        await conn.query(
          `
          UPDATE reports
          SET status_internal = 'selesai', completion_status = 'selesai', updated_at = NOW()
          WHERE id = ?
          `,
          [testReportId]
        );
        // 5. Simpan attachment penanganan dengan type_attachment_code = 'bukti_penanganan'
        const attachmentId = await attachmentModel.createAttachment({
          report_id: testReportId,
          ticket_id: testTicketId,
          type_attachment_code: 'bukti_penanganan',
          source: 'manual',
          uploaded_by_user_id: userId,
          file_name: 'test-evidence.jpg',
          file_path: '/uploads/reports/test-evidence.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024
        }, conn);
        assert.ok(attachmentId > 0);
        // 6. Simpan log laporan di dalam transaksi
        await reportModel.createReportLog({
          report_id: testReportId,
          ticket_id: testTicketId,
          user_id: userId,
          action: 'complete_report',
          description: 'Laporan diselesaikan dalam uji transaksi atomik T031.'
        }, conn);
        // 7. Verifikasi di dalam transaksi: attachment tersimpan dengan type_attachment_id = 2
        const [innerRows] = await conn.query(
          `
          SELECT ra.*, ta.code AS type_attachment_code, ta.name AS type_attachment_name
          FROM report_attachments ra
          LEFT JOIN type_attachment ta ON ra.type_attachment_id = ta.id
          WHERE ra.id = ?
          `,
          [attachmentId]
        );
        assert.equal(innerRows.length, 1);
        assert.equal(innerRows[0].ticket_id, testTicketId);
        assert.equal(innerRows[0].type_attachment_id, 2);
        assert.equal(innerRows[0].type_attachment_code, 'bukti_penanganan');
        // 8. SIMULASI ROLLBACK: Batalkan transaksi sepenuhnya
        await conn.rollback();
        // 9. Verifikasi di luar transaksi pada connection baru: data uji TIDAK tertinggal di database live!
        const [outerReports] = await pool.query(
          'SELECT id FROM reports WHERE ticket_id = ?',
          [testTicketId]
        );
        assert.equal(outerReports.length, 0, 'Report uji harus 0 setelah rollback');
        const [outerAttachments] = await pool.query(
          'SELECT id FROM report_attachments WHERE ticket_id = ?',
          [testTicketId]
        );
        assert.equal(outerAttachments.length, 0, 'Attachment uji harus 0 setelah rollback');
        const [outerLogs] = await pool.query(
          'SELECT id FROM report_logs WHERE ticket_id = ?',
          [testTicketId]
        );
        assert.equal(outerLogs.length, 0, 'Log uji harus 0 setelah rollback');
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    });
  });
  describe('4. Controller Attachment Serialization & Classification Integrity', () => {
    const reportController = require('../../controllers/reportController');
    it('buildAttachmentPayload menyertakan ticket_id, type_attachment_id, type_attachment_code, dan type_attachment_name', () => {
      const sample = {
        id: 10,
        ticket_id: 'INF000001',
        type_attachment_id: 2,
        type_attachment_code: 'bukti_penanganan',
        type_attachment_name: 'Bukti Penanganan (Sistem)',
        source: 'manual',
        file_name: 'selesai.jpg',
        file_path: '/uploads/reports/selesai.jpg',
        mime_type: 'image/jpeg',
        file_type: 'image',
        file_size: 2048,
        caption: 'Foto bukti',
        uploaded_by_name: 'Eksekutor Padang',
        created_at: new Date('2026-09-22T10:00:00Z')
      };
      const payload = reportController.buildAttachmentPayload(sample);
      assert.equal(payload.id, 10);
      assert.equal(payload.ticket_id, 'INF000001');
      assert.equal(payload.type_attachment_id, 2);
      assert.equal(payload.type_attachment_code, 'bukti_penanganan');
      assert.equal(payload.type_attachment_name, 'Bukti Penanganan (Sistem)');
      assert.equal(payload.file_name, 'selesai.jpg');
      assert.equal(payload.uploaded_by_name, 'Eksekutor Padang');
    });
    it('isCompletionEvidenceAttachment dan isTelegramAttachment mengklasifikasi berdasarkan type_attachment_code', () => {
      const evidence = {
        type_attachment_code: 'bukti_penanganan',
        file_name: 'evidence.jpg'
      };
      const telegram = {
        type_attachment_code: 'bukti_pelapor',
        file_name: 'pelapor.jpg'
      };
      assert.equal(reportController.isCompletionEvidenceAttachment(evidence), true);
      assert.equal(reportController.isCompletionEvidenceAttachment(telegram), false);
      assert.equal(reportController.isTelegramAttachment(telegram), true);
      assert.equal(reportController.isTelegramAttachment(evidence), false);
    });
    it('splitReportAttachments memisahkan lampiran bukti penanganan dan media Telegram dengan benar', () => {
      const mixed = [
        { id: 1, type_attachment_code: 'bukti_penanganan', file_name: 'penanganan1.jpg' },
        { id: 2, type_attachment_code: 'bukti_pelapor', file_name: 'telegram1.jpg' },
        { id: 3, type_attachment_code: 'bukti_penanganan', file_name: 'penanganan2.jpg' }
      ];
      const split = reportController.splitReportAttachments(mixed);
      assert.equal(split.completionAttachments.length, 2);
      assert.equal(split.telegramAttachments.length, 1);
      assert.equal(split.completionAttachments[0].id, 1);
      assert.equal(split.completionAttachments[1].id, 3);
      assert.equal(split.telegramAttachments[0].id, 2);
    });
  });
});
