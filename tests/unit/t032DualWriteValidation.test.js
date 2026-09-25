const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../../config/db');
const attachmentModel = require('../../models/attachmentModel');
const reportModel = require('../../models/reportModel');
const pendingMediaModel = require('../../models/pendingMediaModel');

describe('T032 — Dual-Write / FK / Orphan Validation', () => {
  after(async () => {
    await pool.end();
  });

  describe('1. Database Invariant & Orphan Checks (Live DB Read-Only)', () => {

    it('report_assignments: 0 orphans dan 0 mismatch terhadap reports', async () => {
      const [orphanReportId] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM report_assignments ra
        LEFT JOIN reports r ON r.id = ra.report_id
        WHERE r.id IS NULL
      `);
      assert.equal(Number(orphanReportId[0].count), 0, 'Orphan report_id harus 0');

      const [orphanTicketId] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM report_assignments ra
        LEFT JOIN reports r ON r.ticket_id = ra.ticket_id
        WHERE r.ticket_id IS NULL
      `);
      assert.equal(Number(orphanTicketId[0].count), 0, 'Orphan ticket_id harus 0');

      const [mismatch] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM report_assignments ra
        JOIN reports r ON r.id = ra.report_id
        WHERE ra.ticket_id <> r.ticket_id
           OR ra.ticket_id IS NULL
      `);
      assert.equal(Number(mismatch[0].count), 0, 'Mismatch assignments harus 0');
    });

    it('report_logs: 0 orphan ticket_id terhadap reports', async () => {
      const [orphanTicketId] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM report_logs rl
        LEFT JOIN reports r ON r.ticket_id = rl.ticket_id
        WHERE r.ticket_id IS NULL
      `);

      assert.equal(
        Number(orphanTicketId[0].count),
        0,
        'Orphan logs ticket_id harus 0'
      );
    });

    it('report_attachments: 0 orphans, 0 mismatch, dan type_attachment_id valid', async () => {
      const [orphanReportId] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM report_attachments ra
        LEFT JOIN reports r ON r.id = ra.report_id
        WHERE r.id IS NULL
      `);
      assert.equal(Number(orphanReportId[0].count), 0, 'Orphan attachments report_id harus 0');

      const [orphanTicketId] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM report_attachments ra
        LEFT JOIN reports r ON r.ticket_id = ra.ticket_id
        WHERE r.ticket_id IS NULL
      `);
      assert.equal(Number(orphanTicketId[0].count), 0, 'Orphan attachments ticket_id harus 0');

      const [mismatch] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM report_attachments ra
        JOIN reports r ON r.id = ra.report_id
        WHERE ra.ticket_id <> r.ticket_id
           OR ra.ticket_id IS NULL
      `);
      assert.equal(Number(mismatch[0].count), 0, 'Mismatch attachments harus 0');

      const [invalidType] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM report_attachments ra
        LEFT JOIN type_attachment ta ON ta.id = ra.type_attachment_id
        WHERE ra.type_attachment_id IS NULL
           OR ta.id IS NULL
      `);
      assert.equal(Number(invalidType[0].count), 0, 'Invalid type_attachment_id harus 0');
    });

    it('telegram_pending_media: linked rows konsisten dan unlinked rows tetap valid NULL', async () => {
      const [orphanLinkedTicket] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM telegram_pending_media tpm
        LEFT JOIN reports r ON r.ticket_id = tpm.linked_ticket_id
        WHERE tpm.linked_ticket_id IS NOT NULL
          AND r.ticket_id IS NULL
      `);
      assert.equal(Number(orphanLinkedTicket[0].count), 0, 'Orphan linked_ticket_id harus 0');

      const [invalidLinked] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM telegram_pending_media tpm
        LEFT JOIN reports r ON r.ticket_id = tpm.linked_ticket_id
        WHERE tpm.status = 'linked'
          AND (tpm.linked_ticket_id IS NULL OR r.ticket_id IS NULL)
      `);
      assert.equal(Number(invalidLinked[0].count), 0, 'Linked media tanpa valid linked_ticket_id harus 0');

      const [unlinkedRows] = await pool.query(`
        SELECT COUNT(*) AS count
        FROM telegram_pending_media
        WHERE status = 'pending'
          AND linked_ticket_id IS NULL
      `);
      assert.ok(Number(unlinkedRows[0].count) >= 1, 'Harus ada minimal 1 pending unlinked media dengan linked_ticket_id NULL');
    });

    it('Foreign keys existing tetap aktif dan mereferensikan reports.id', async () => {
      const [fkRows] = await pool.query(`
        SELECT
          CONSTRAINT_NAME,
          TABLE_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = 'db_penanganan_gangguan'
          AND CONSTRAINT_NAME IN ('fk_assign_report', 'fk_logs_report', 'fk_attach_report')
      `);

      assert.equal(fkRows.length, 3, 'Ketiga FK harus terdaftar di information_schema');
      const assignFk = fkRows.find(fk => fk.CONSTRAINT_NAME === 'fk_assign_report');
      assert.ok(assignFk);
      assert.equal(assignFk.TABLE_NAME, 'report_assignments');
      assert.equal(assignFk.COLUMN_NAME, 'report_id');
      assert.equal(assignFk.REFERENCED_TABLE_NAME, 'reports');
      assert.equal(assignFk.REFERENCED_COLUMN_NAME, 'id');

      const logsFk = fkRows.find(fk => fk.CONSTRAINT_NAME === 'fk_logs_report');
      assert.ok(logsFk);
      assert.equal(logsFk.TABLE_NAME, 'report_logs');
      assert.equal(logsFk.COLUMN_NAME, 'report_id');

      const attachFk = fkRows.find(fk => fk.CONSTRAINT_NAME === 'fk_attach_report');
      assert.ok(attachFk);
      assert.equal(attachFk.TABLE_NAME, 'report_attachments');
      assert.equal(attachFk.COLUMN_NAME, 'report_id');
    });
  });

  describe('2. Dual-Write Contract & Resolution Helpers Unit Testing', () => {
    it('attachmentModel.resolveAttachmentReportIdentity: konsisten saat kedua ID cocok', async () => {
      const result = await attachmentModel.resolveAttachmentReportIdentity({
        report_id: 1,
        ticket_id: 'INF000001'
      });
      assert.equal(result.id, 1);
      assert.equal(result.ticket_id, 'INF000001');
    });

    it('attachmentModel.resolveAttachmentReportIdentity: auto-resolve ticket_id saat hanya report_id diberikan', async () => {
      const result = await attachmentModel.resolveAttachmentReportIdentity({
        report_id: 1
      });
      assert.equal(result.id, 1);
      assert.equal(result.ticket_id, 'INF000001');
    });

    it('attachmentModel.resolveAttachmentReportIdentity: auto-resolve report_id saat hanya ticket_id diberikan', async () => {
      const result = await attachmentModel.resolveAttachmentReportIdentity({
        ticket_id: 'INF000001'
      });
      assert.equal(result.id, 1);
      assert.equal(result.ticket_id, 'INF000001');
    });

    it('attachmentModel.resolveAttachmentReportIdentity: menolak jika report_id dan ticket_id tidak ada', async () => {
      await assert.rejects(
        async () => {
          await attachmentModel.resolveAttachmentReportIdentity({});
        },
        /Identitas laporan/
      );
    });

    it('attachmentModel.resolveAttachmentTypeCode: mendeteksi bukti_pelapor untuk sumber Telegram', () => {
      const telegramItem = attachmentModel.resolveAttachmentTypeCode({ source: 'telegram' });
      assert.equal(telegramItem, 'bukti_pelapor');

      const mediaItem = attachmentModel.resolveAttachmentTypeCode({ telegram_file_id: 'xyz123' });
      assert.equal(mediaItem, 'bukti_pelapor');

      const manualItem = attachmentModel.resolveAttachmentTypeCode({ source: 'manual' });
      assert.equal(manualItem, 'bukti_penanganan');
    });

    it('pendingMediaModel.markPendingMediaLinked: menautkan media ke ticket_id yang valid', async () => {
      let executedSql = '';
      let executedParams = [];
      const fakeConn = {
        query: async (sql, params) => {
          if (String(sql).includes('FROM reports')) {
            if (params[0] === 'T-UNKNOWN') {
              return [[]];
            }
            return [[{ ticket_id: 'T-PDG-MATCH' }]];
          }
          if (String(sql).includes('UPDATE telegram_pending_media')) {
            executedSql = sql;
            executedParams = params;
            return [{ affectedRows: 1 }];
          }
          return [[]];
        }
      };

      // 1. Sukses menautkan dengan ticket_id
      await pendingMediaModel.markPendingMediaLinked(100, 'T-PDG-MATCH', null, fakeConn);
      assert.ok(executedSql.includes('UPDATE telegram_pending_media'));
      assert.ok(executedSql.includes('linked_ticket_id = ?'));
      assert.ok(!executedSql.includes('linked_report_id'));
      assert.equal(executedParams[0], 'T-PDG-MATCH');
      assert.equal(executedParams[1], 100);

      // 2. Error jika laporan tidak ditemukan
      await assert.rejects(
        async () => {
          await pendingMediaModel.markPendingMediaLinked(100, 'T-UNKNOWN', null, fakeConn);
        },
        /Laporan tidak ditemukan untuk menautkan pending media/
      );
    });
  });

  describe('3. Application Flow Isolated Transaction Tests (Zero Live DB Mutation)', () => {
    it('Flow 1 & 2: create report dan self_take assignment menghasilkan dual-write identik pada child', async () => {
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        const [regions] = await conn.query('SELECT id FROM regions LIMIT 1');
        const [users] = await conn.query('SELECT id, full_name FROM users WHERE role_id = 2 LIMIT 1');
        const regionId = regions[0].id;
        const user = users[0];

        const testTicketId = 'T032-TEST-FLOW-1';

        // 1. Create Report
        const [repResult] = await conn.query(
          `
          INSERT INTO reports
          (
            ticket_id, source_channel, summary, status_internal,
            reported_region_id, current_region_id,
            created_at, updated_at
          )
          VALUES (?, 'telegram', 'T032 Flow Validation Report', 'tersedia', ?, ?, NOW(), NOW())
          `,
          [testTicketId, regionId, regionId]
        );
        const testReportId = repResult.insertId;

        // Create Report Log for creation
        await reportModel.createReportLog({
          report_id: testReportId,
          ticket_id: testTicketId,
          user_id: user.id,
          action: 'create_telegram_report',
          description: 'Laporan dibuat dalam flow test T032.'
        }, conn);

        // 2. Take Report (Assignment)
        await conn.query(
          `
          INSERT INTO report_assignments
          (
            report_id, ticket_id, assigned_to_user_id, assigned_by_user_id,
            assignment_type, notes, is_active, assigned_at
          )
          VALUES (?, ?, ?, ?, 'self_take', 'Ambil mandiri test.', 1, NOW())
          `,
          [testReportId, testTicketId, user.id, user.id]
        );

        await reportModel.createReportLog({
          report_id: testReportId,
          ticket_id: testTicketId,
          user_id: user.id,
          action: 'take_report',
          description: 'Laporan diambil.'
        }, conn);

        // 3. Verifikasi di dalam transaksi: report_assignments dual-write cocok
        const [assignRows] = await conn.query(
          'SELECT report_id, ticket_id FROM report_assignments WHERE ticket_id = ?',
          [testTicketId]
        );
        assert.equal(assignRows.length, 1);
        assert.equal(assignRows[0].report_id, testReportId);
        assert.equal(assignRows[0].ticket_id, testTicketId);

        // 4. Verifikasi di dalam transaksi: report_logs dual-write cocok
        const [logRows] = await conn.query(
          'SELECT ticket_id FROM report_logs WHERE ticket_id = ?',
          [testTicketId]
        );

        assert.equal(logRows.length, 2);
        assert.equal(logRows[0].ticket_id, testTicketId);
        assert.equal(logRows[1].ticket_id, testTicketId);

        // 5. ROLLBACK PENUH
        await conn.rollback();

        // 6. Verifikasi di luar transaksi: 0 mutasi permanen
        const [checkReports] = await pool.query('SELECT id FROM reports WHERE ticket_id = ?', [testTicketId]);
        assert.equal(checkReports.length, 0);

        const [checkAssign] = await pool.query('SELECT id FROM report_assignments WHERE ticket_id = ?', [testTicketId]);
        assert.equal(checkAssign.length, 0);

        const [checkLogs] = await pool.query('SELECT id FROM report_logs WHERE ticket_id = ?', [testTicketId]);
        assert.equal(checkLogs.length, 0);
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    });

    it('Flow 3 & 4: attachment upload dan telegram media linking menghasilkan dual-write identik', async () => {
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        const [regions] = await conn.query('SELECT id FROM regions LIMIT 1');
        const [users] = await conn.query('SELECT id FROM users WHERE role_id = 2 LIMIT 1');
        const regionId = regions[0].id;
        const userId = users[0].id;

        const testTicketId = 'T032-TEST-FLOW-2';

        // 1. Create Report
        const [repResult] = await conn.query(
          `
          INSERT INTO reports
          (
            ticket_id, source_channel, summary, status_internal,
            reported_region_id, current_region_id,
            created_at, updated_at
          )
          VALUES (?, 'telegram', 'T032 Flow 2 Report', 'diambil', ?, ?, NOW(), NOW())
          `,
          [testTicketId, regionId, regionId]
        );
        const testReportId = repResult.insertId;

        // 2. Upload attachment dengan auto-resolve (hanya oper report_id)
        const attachmentId = await attachmentModel.createAttachment({
          report_id: testReportId,
          source: 'manual',
          file_name: 'flow-evidence.jpg',
          file_path: '/uploads/flow-evidence.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          uploaded_by_user_id: userId
        }, conn);

        // 3. Verifikasi attachment memiliki ticket_id terisi secara dual-write dan type_attachment_id valid
        const [attRows] = await conn.query(
          `
          SELECT ra.*, ta.code AS type_attachment_code
          FROM report_attachments ra
          LEFT JOIN type_attachment ta ON ra.type_attachment_id = ta.id
          WHERE ra.id = ?
          `,
          [attachmentId]
        );
        assert.equal(attRows.length, 1);
        assert.equal(attRows[0].report_id, testReportId);
        assert.equal(attRows[0].ticket_id, testTicketId, 'ticket_id harus terisi identik dengan reports');
        assert.equal(attRows[0].type_attachment_code, 'bukti_penanganan');

        // 4. Create Pending Media (unlinked state)
        const [mediaResult] = await conn.query(
          `
          INSERT INTO telegram_pending_media
          (
            chat_id,
            telegram_message_id,
            telegram_file_id,
            file_type,
            mime_type,
            stored_name,
            file_path,
            status,
            linked_ticket_id,
            created_at
          )
          VALUES (
            '12345678',
            '99999',
            'TEST_FILE_ID_99999',
            'photo',
            'image/jpeg',
            'test-photo.jpg',
            '/tmp/photo.jpg',
            'pending',
            NULL,
            NOW()
          )
          `
        );
        const pendingMediaId = mediaResult.insertId;

        // Verifikasi unlinked state memiliki linked_ticket_id=NULL
        const [pendingRows] = await conn.query(
          'SELECT status, linked_ticket_id FROM telegram_pending_media WHERE id = ?',
          [pendingMediaId]
        );
        assert.equal(pendingRows[0].status, 'pending');
        assert.equal(pendingRows[0].linked_ticket_id, null);

        // 5. Link Pending Media ke Report
        await pendingMediaModel.markPendingMediaLinked(pendingMediaId, testTicketId, null, conn);

        // Verifikasi linked state memiliki linked_ticket_id terisi konsisten
        const [linkedRows] = await conn.query(
          'SELECT status, linked_ticket_id FROM telegram_pending_media WHERE id = ?',
          [pendingMediaId]
        );
        assert.equal(linkedRows[0].status, 'linked');
        assert.equal(linkedRows[0].linked_ticket_id, testTicketId);

        // 6. ROLLBACK PENUH
        await conn.rollback();

        // 7. Verifikasi di luar transaksi: 0 mutasi permanen
        const [checkReports] = await pool.query('SELECT id FROM reports WHERE ticket_id = ?', [testTicketId]);
        assert.equal(checkReports.length, 0);

        const [checkAttachments] = await pool.query('SELECT id FROM report_attachments WHERE ticket_id = ?', [testTicketId]);
        assert.equal(checkAttachments.length, 0);

        const [checkMedia] = await pool.query('SELECT id FROM telegram_pending_media WHERE id = ?', [pendingMediaId]);
        assert.equal(checkMedia.length, 0);
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    });
  });
});
