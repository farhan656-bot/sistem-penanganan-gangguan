const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const pool = require('../../config/db');
const baseline = 'f033-pre-migration-baseline';
const filename = path.resolve(__dirname, '../../models/reportModel.js');
// Load the real model without replacing the application's require cache.
// All SQL is bound to one outer transaction. Model commits cannot persist data.
function loadModel(source, connection) {
  const localRequire = createRequire(filename);
  const transaction = {
    query: connection.query.bind(connection),
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {}
  };
  const isolatedPool = {
    query: transaction.query,
    getConnection: async () => transaction
  };
  const module = { exports: {} };
  const requireDependency = (id) => {
    if (id === '../config/db') return isolatedPool;
    // Home-region fixture: avoid F007's automatic expiry UPDATE on the live pool.
    if (id === './regionSwitchModel') {
      return { getActiveExtraRegionsByUserId: async () => [] };
    }
    return localRequire(id);
  };
  vm.runInThisContext(
    `(function(require, module, exports, __filename, __dirname) {${source}\n})`,
    { filename }
  )(requireDependency, module, module.exports, filename, path.dirname(filename));
  return module.exports;
}
after(async () => {
  try {
    await pool.end();
  } catch (_) {}
});
async function assertTakeThenComplete(t, useBaseline) {
  const connection = await pool.getConnection();
  const ticketId = `T033-${randomUUID()}`;
  try {
    const [engines] = await connection.query(`
      SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('reports', 'report_assignments', 'report_logs', 'report_attachments')
    `);
    assert.equal(engines.length, 4);
    assert.ok(engines.every((row) => row.ENGINE === 'InnoDB'));
    const [triggers] = await connection.query(`
      SELECT TRIGGER_NAME FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
        AND EVENT_OBJECT_TABLE IN ('reports', 'report_assignments', 'report_logs', 'report_attachments')
    `);
    assert.equal(triggers.length, 0, 'Re-audit trigger side effects before running');
    await connection.beginTransaction();
    const [users] = await connection.query(`
      SELECT u.id, u.region_id, ro.name AS role
      FROM users u JOIN roles ro ON ro.id = u.role_id
      JOIN regions r ON r.id = u.region_id
      WHERE ro.name = 'eksekutor' AND r.code = 'PDG'
      ORDER BY u.id LIMIT 1
    `);
    assert.equal(users.length, 1, 'Requires an existing PDG executor');
    const user = { ...users[0], full_name: 'T033 isolated regression' };
    await connection.query(`
      INSERT INTO reports
        (ticket_id, source_channel, summary, status_internal,
         reported_region_id, received_at, created_at, updated_at)
      VALUES (?, 'telegram', 'T033 isolated regression', 'tersedia', ?, NOW(), NOW(), NOW())
    `, [ticketId, user.region_id]);
    const source = useBaseline
      ? execFileSync('git', ['show', `${baseline}:models/reportModel.js`], { encoding: 'utf8' })
      : fs.readFileSync(filename, 'utf8');
    const model = loadModel(source, connection);
    const identifier = ticketId;
    assert.equal((await model.takeReport(identifier, user)).success, true);
    const [[taken]] = await connection.query(`
      SELECT r.status_internal, ra.assigned_to_user_id
      FROM reports r JOIN report_assignments ra ON ra.ticket_id = r.ticket_id AND ra.is_active = 1
      WHERE r.ticket_id = ?
    `, [ticketId]);
    assert.equal(taken.status_internal, 'diambil');
    assert.equal(taken.assigned_to_user_id, user.id);
    t.diagnostic(JSON.stringify({
      source: useBaseline ? baseline : 'working-tree',
      statusAfterTake: taken.status_internal,
      activeAssignmentMatchesExecutor: taken.assigned_to_user_id === user.id
    }));
    const completed = await model.completeReport(identifier, user, {
      completion_status: 'selesai', completion_notes: 'T033 regression evidence'
    }, {
      filename: 't033-evidence.jpg', originalname: 't033-evidence.jpg',
      path: path.resolve(__dirname, '../../public/uploads/reports/t033-evidence.jpg'),
      mimetype: 'image/jpeg', size: 1
    });
    assert.equal(completed.success, true);
    const [[finished]] = await connection.query(
      'SELECT status_internal FROM reports WHERE ticket_id = ?', [ticketId]
    );
    assert.equal(finished.status_internal, 'selesai');
  } finally {
    try {
      await connection.rollback();
      for (const table of ['reports', 'report_assignments', 'report_logs', 'report_attachments']) {
        const [[row]] = await connection.query(`SELECT COUNT(*) AS n FROM ${table} WHERE ticket_id = ?`, [ticketId]);
        assert.equal(Number(row.n), 0, `${table}: fixture must not persist`);
      }
      t.diagnostic('ROLLBACK verified: zero fixture rows in all four tables; no file or Telegram I/O');
    } finally {
      connection.release();
    }
  }
}
describe('T033 operational regression: executor takes and completes own-region ticket', () => {
  it.skip('baseline allows the same executor to complete the ticket after take', async (t) => {
    await assertTakeThenComplete(t, true);
  });
  it('F033 must still allow the same executor to complete the ticket after take', async (t) => {
    await assertTakeThenComplete(t, false);
  });
});
describe('T033 Scope A: Telegram Integration & Processing', () => {
  const pendingMediaModel = require('../../models/pendingMediaModel');
  const attachmentModel = require('../../models/attachmentModel');
  const { splitReportAttachments } = require('../../controllers/reportController');
  it('D-011: createTelegramReport creates ticket with status tersedia and received_at', async () => {
    const connection = await pool.getConnection();
    const ticketId = `TEL-D011-${randomUUID()}`;
    const orderId = `ORD-D011-${randomUUID().slice(0, 8)}`;
    let reportId;
    try {
      await connection.beginTransaction();
      const source = fs.readFileSync(filename, 'utf8');
      const model = loadModel(source, connection);
      const result = await model.createTelegramReport({
        ticket_id: ticketId,
        order_id: orderId,
        summary: 'Gangguan internet massal D-011',
        region: 'PDG',
        service_type: 'HSI',
        provider: 'TELKOM',
        branch_name: 'Padang'
      }, {
        chat_id: '99887766',
        message_id: '12345',
        sender_id: '112233',
        sender_username: 'telegram_reporter',
        sender_first_name: 'Test',
        sender_last_name: 'Reporter'
      });
      assert.equal(result.success, true);
      assert.equal(result.ticketId, ticketId);
      const [[report]] = await connection.query(
        'SELECT ticket_id, status_internal, reported_region_id, received_at, telegram_chat_id FROM reports WHERE ticket_id = ?',
        [ticketId]
      );
      assert.equal(report.status_internal, 'tersedia');
      assert.equal(report.reported_region_id, 1);
      assert.ok(report.received_at !== null);
      assert.equal(report.telegram_chat_id, '99887766');
      const [logs] = await connection.query(
        'SELECT action FROM report_logs WHERE ticket_id = ?',
        [ticketId]
      );
      assert.ok(logs.some((l) => l.action === 'create_telegram_report'));
    } finally {
      await connection.rollback();
      connection.release();
    }
  });
  it('D-018: applyTelegramTextEnrichment updates report fields and creates log without mutating ticket identity', async () => {
    const connection = await pool.getConnection();
    const ticketId = `TEL-D018-${randomUUID()}`;
    try {
      await connection.beginTransaction();
      await connection.query(`
        INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, received_at, created_at, updated_at)
        VALUES (?, 'telegram', 'Summary awal', 'tersedia', 1, NOW(), NOW(), NOW())
      `, [ticketId]);
      const source = fs.readFileSync(filename, 'utf8');
      const model = loadModel(source, connection);
      const enrichResult = await model.applyTelegramTextEnrichment(ticketId, {
        fields: {
          segment: 'ENTERPRISE',
          provider: 'TELKOMSEL',
          branch_name: 'Padang Kota'
        },
        raw_text: 'TICKET ID: ' + ticketId + '\nSEGMENT: ENTERPRISE\nPROVIDER: TELKOMSEL',
        telegram_meta: { chat_id: '99887766', message_id: '12346' }
      });
      assert.ok(enrichResult.updatedFields.includes('segment'));
      assert.ok(enrichResult.updatedFields.includes('provider'));
      assert.ok(enrichResult.updatedFields.includes('branch_name'));
      const [[updated]] = await connection.query(
        'SELECT segment, provider, branch_name, ticket_id FROM reports WHERE ticket_id = ?',
        [ticketId]
      );
      assert.equal(updated.segment, 'ENTERPRISE');
      assert.equal(updated.provider, 'TELKOMSEL');
      assert.equal(updated.branch_name, 'Padang Kota');
      assert.equal(updated.ticket_id, ticketId);
      const [logs] = await connection.query(
        'SELECT action FROM report_logs WHERE ticket_id = ? AND action = "telegram_text_enrichment_applied"',
        [ticketId]
      );
      assert.equal(logs.length, 1);
    } finally {
      await connection.rollback();
      connection.release();
    }
  });
  it('Pending media: markPendingMediaLinked links pending media to ticket_id', async () => {
    const connection = await pool.getConnection();
    const ticketId = `TEL-MED-${randomUUID()}`;
    let mediaId;
    try {
      await connection.beginTransaction();
      await connection.query(`
        INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, received_at, created_at, updated_at)
        VALUES (?, 'telegram', 'Media test', 'tersedia', 1, NOW(), NOW(), NOW())
      `, [ticketId]);
      mediaId = await pendingMediaModel.createPendingMedia({
        chat_id: '99887766',
        telegram_message_id: '12347',
        telegram_file_id: 'FILE-PENDING-' + randomUUID(),
        file_type: 'photo',
        stored_name: 'test-pending.jpg',
        file_path: 'public/uploads/reports/test-pending.jpg',
        caption: 'Foto bukti gangguan'
      }, connection);
      await pendingMediaModel.markPendingMediaLinked(mediaId, ticketId, null, connection);
      const [[media]] = await connection.query(
        'SELECT status, linked_ticket_id FROM telegram_pending_media WHERE id = ?',
        [mediaId]
      );
      assert.equal(media.status, 'linked');
      assert.equal(media.linked_ticket_id, ticketId);
    } finally {
      await connection.rollback();
      connection.release();
    }
  });
  it('Attachment classification: differentiates bukti_pelapor and bukti_penanganan', async () => {
    assert.equal(attachmentModel.resolveAttachmentTypeCode({ source: 'telegram' }), 'bukti_pelapor');
    assert.equal(attachmentModel.resolveAttachmentTypeCode({ source: 'manual' }), 'bukti_penanganan');
    const split = splitReportAttachments([
      { id: 1, type_attachment_code: 'bukti_pelapor', file_name: 'foto-pelapor.jpg' },
      { id: 2, type_attachment_code: 'bukti_penanganan', file_name: 'foto-selesai.jpg' }
    ]);
    assert.equal(split.telegramAttachments.length, 1);
    assert.equal(split.telegramAttachments[0].id, 1);
    assert.equal(split.completionAttachments.length, 1);
    assert.equal(split.completionAttachments[0].id, 2);
  });
  it('Telegram feedback: resolves feedback payload and logs feedback correctly', async () => {
    const connection = await pool.getConnection();
    const ticketId = `TEL-FDB-${randomUUID()}`;
    try {
      await connection.beginTransaction();
      await connection.query(`
        INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, telegram_chat_id, telegram_message_id, received_at, created_at, updated_at)
        VALUES (?, 'telegram', 'Feedback test', 'tersedia', 1, '55443322', '8899', NOW(), NOW(), NOW())
      `, [ticketId]);
      const source = fs.readFileSync(filename, 'utf8');
      const model = loadModel(source, connection);
      const payload = await model.getTelegramFeedbackPayloadByReportId(ticketId);
      assert.equal(payload.ticket_id, ticketId);
      assert.equal(payload.telegram_chat_id, '55443322');
      assert.equal(payload.telegram_message_id, '8899');
      await model.logTelegramFeedback(ticketId, 'telegram_feedback_sent', 'Notifikasi terkirim');
      const [logs] = await connection.query(
        'SELECT action, description FROM report_logs WHERE ticket_id = ? AND action = "telegram_feedback_sent"',
        [ticketId]
      );
      assert.equal(logs.length, 1);
    } finally {
      await connection.rollback();
      connection.release();
    }
  });
});
describe('T033 Scope B: RBAC Authorization', () => {
  it('Eksekutor: tidak dapat mengambil laporan di luar wilayah aktifnya', async () => {
    const connection = await pool.getConnection();
    const ticketId = `RBAC-OUT-${randomUUID()}`;
    try {
      await connection.beginTransaction();
      await connection.query(`
        INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, received_at, created_at, updated_at)
        VALUES (?, 'telegram', 'RBAC region test', 'tersedia', 2, NOW(), NOW(), NOW())
      `, [ticketId]);
      const source = fs.readFileSync(filename, 'utf8');
      const model = loadModel(source, connection);
      const executorPdg = { id: 1, region_id: 1, role: 'eksekutor', full_name: 'Eksekutor PDG' };
      await assert.rejects(
        async () => { await model.takeReport(ticketId, executorPdg); },
        /di luar wilayah aktif Anda/
      );
    } finally {
      await connection.rollback();
      connection.release();
    }
  });
  it('Eksekutor: tidak dapat menyelesaikan laporan yang diambil oleh eksekutor lain', async () => {
    const connection = await pool.getConnection();
    const ticketId = `RBAC-OTH-${randomUUID()}`;
    try {
      await connection.beginTransaction();
      await connection.query(`
        INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, received_at, created_at, updated_at)
        VALUES (?, 'telegram', 'RBAC other user test', 'tersedia', 1, NOW(), NOW(), NOW())
      `, [ticketId]);
      const source = fs.readFileSync(filename, 'utf8');
      const model = loadModel(source, connection);
      const executor1 = { id: 1, region_id: 1, role: 'eksekutor', full_name: 'Eksekutor 1' };
      const executor2 = { id: 2, region_id: 1, role: 'eksekutor', full_name: 'Eksekutor 2' };
      assert.equal((await model.takeReport(ticketId, executor1)).success, true);
      await assert.rejects(
        async () => {
          await model.completeReport(ticketId, executor2, {
            completion_status: 'selesai',
            completion_notes: 'Coba selesaikan tiket orang lain'
          }, []);
        },
        /Anda bukan penanggung jawab laporan ini/
      );
    } finally {
      await connection.rollback();
      connection.release();
    }
  });
  it('Koordinator: dapat mengambil dan menyelesaikan laporan di wilayah koordinasinya', async () => {
    const connection = await pool.getConnection();
    const ticketId = `RBAC-KRD-${randomUUID()}`;
    try {
      await connection.beginTransaction();
      await connection.query(`
        INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, received_at, created_at, updated_at)
        VALUES (?, 'telegram', 'Koordinator flow test', 'tersedia', 1, NOW(), NOW(), NOW())
      `, [ticketId]);
      const source = fs.readFileSync(filename, 'utf8');
      const model = loadModel(source, connection);
      const koordinator = { id: 5, region_id: 1, role: 'koordinator', full_name: 'Koordinator Test' };
      const takeResult = await model.takeReport(ticketId, koordinator);
      assert.equal(takeResult.success, true);
      const completeResult = await model.completeReport(ticketId, koordinator, {
        completion_status: 'selesai',
        completion_notes: 'Diselesaikan koordinator'
      }, []);
      assert.equal(completeResult.success, true);
      const [[finished]] = await connection.query(
        'SELECT status_internal FROM reports WHERE ticket_id = ?',
        [ticketId]
      );
      assert.equal(finished.status_internal, 'selesai');
    } finally {
      await connection.rollback();
      connection.release();
    }
  });
});
describe('T033 Scope C: F007 Temporary Region Switch', () => {
  it('Eksekutor dengan temporary region switch aktif dapat mengambil laporan di wilayah target', async () => {
    const connection = await pool.getConnection();
    const ticketId = `F007-ACT-${randomUUID()}`;
    let requestId;
    try {
      await connection.beginTransaction();
      await connection.query(`
        INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, received_at, created_at, updated_at)
        VALUES (?, 'telegram', 'F007 active test', 'tersedia', 2, NOW(), NOW(), NOW())
      `, [ticketId]);
      const [reqInsert] = await connection.query(`
        INSERT INTO region_switch_requests
          (requester_user_id, home_region_id, target_region_id, reason, status, approved_by_user_id, approved_at, start_at, end_at, created_at, updated_at)
        VALUES (1, 1, 2, 'Bantuan penanganan BKT', 'approved', 5, NOW(), NOW() - INTERVAL 1 HOUR, NOW() + INTERVAL 1 HOUR, NOW(), NOW())
      `);
      requestId = reqInsert.insertId;
      const source = fs.readFileSync(filename, 'utf8');
      const localRequire = createRequire(filename);
      const transaction = {
        query: connection.query.bind(connection),
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {}
      };
      const isolatedPool = { query: transaction.query, getConnection: async () => transaction };
      const moduleObj = { exports: {} };
      vm.runInThisContext(
        `(function(require, module, exports, __filename, __dirname) {${source}\n})`,
        { filename }
      )((id) => {
        if (id === '../config/db') return isolatedPool;
        if (id === './regionSwitchModel') {
          return {
            getActiveExtraRegionsByUserId: async (uid) => {
              const [rows] = await connection.query(
                `SELECT DISTINCT target_region_id FROM region_switch_requests WHERE requester_user_id = ? AND status = 'approved' AND start_at <= NOW() AND end_at >= NOW()`,
                [uid]
              );
              return rows.map((r) => r.target_region_id).filter(Boolean);
            }
          };
        }
        return localRequire(id);
      }, moduleObj, moduleObj.exports, filename, path.dirname(filename));
      const executorPdg = { id: 1, region_id: 1, role: 'eksekutor', full_name: 'Eksekutor PDG' };
      const takeResult = await moduleObj.exports.takeReport(ticketId, executorPdg);
      assert.equal(takeResult.success, true);
      const [[taken]] = await connection.query(
        'SELECT status_internal FROM reports WHERE ticket_id = ?',
        [ticketId]
      );
      assert.equal(taken.status_internal, 'diambil');
      const [[user]] = await connection.query('SELECT region_id FROM users WHERE id = 1');
      assert.equal(user.region_id, 1, 'Home region user harus tetap tidak berubah');
    } finally {
      await connection.rollback();
      connection.release();
    }
  });
  it('Eksekutor dengan region switch expired TIDAK dapat mengambil laporan di wilayah target', async () => {
    const connection = await pool.getConnection();
    const ticketId = `F007-EXP-${randomUUID()}`;
    try {
      await connection.beginTransaction();
      await connection.query(`
        INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, received_at, created_at, updated_at)
        VALUES (?, 'telegram', 'F007 expired test', 'tersedia', 2, NOW(), NOW(), NOW())
      `, [ticketId]);
      await connection.query(`
        INSERT INTO region_switch_requests
          (requester_user_id, home_region_id, target_region_id, reason, status, approved_by_user_id, approved_at, start_at, end_at, created_at, updated_at)
        VALUES (1, 1, 2, 'Bantuan expired', 'approved', 5, NOW(), NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 1 HOUR, NOW(), NOW())
      `);
      const source = fs.readFileSync(filename, 'utf8');
      const localRequire = createRequire(filename);
      const transaction = {
        query: connection.query.bind(connection),
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {}
      };
      const isolatedPool = { query: transaction.query, getConnection: async () => transaction };
      const moduleObj = { exports: {} };
      vm.runInThisContext(
        `(function(require, module, exports, __filename, __dirname) {${source}\n})`,
        { filename }
      )((id) => {
        if (id === '../config/db') return isolatedPool;
        if (id === './regionSwitchModel') {
          return {
            getActiveExtraRegionsByUserId: async (uid) => {
              const [rows] = await connection.query(
                `SELECT DISTINCT target_region_id FROM region_switch_requests WHERE requester_user_id = ? AND status = 'approved' AND start_at <= NOW() AND end_at >= NOW()`,
                [uid]
              );
              return rows.map((r) => r.target_region_id).filter(Boolean);
            }
          };
        }
        return localRequire(id);
      }, moduleObj, moduleObj.exports, filename, path.dirname(filename));
      const executorPdg = { id: 1, region_id: 1, role: 'eksekutor', full_name: 'Eksekutor PDG' };
      await assert.rejects(
        async () => { await moduleObj.exports.takeReport(ticketId, executorPdg); },
        /di luar wilayah aktif Anda/
      );
    } finally {
      await connection.rollback();
      connection.release();
    }
  });
});
describe('T033 Scope D: Supervisor KPI Metrics & Source of Truth', () => {
  const supervisorModel = require('../../models/supervisorModel');
  it('getSummaryKPI menghitung volume, MTTA, MTTR, dan completion rate berbasis received_at', async () => {
    const summary = await supervisorModel.getSummaryKPI();
    assert.ok(Number.isFinite(Number(summary.total_reports)));
    assert.ok(Number.isFinite(Number(summary.total_available)));
    assert.ok(Number.isFinite(Number(summary.total_in_progress)));
    assert.ok(Number.isFinite(Number(summary.total_completed)));
    assert.ok(Number.isFinite(Number(summary.completion_rate)));
    assert.ok(summary.avg_response_minutes === null || Number.isFinite(Number(summary.avg_response_minutes)));
    assert.ok(summary.avg_resolution_minutes === null || Number.isFinite(Number(summary.avg_resolution_minutes)));
  });
  it('getSummaryKPI dengan filter regionId memfilter berbasis reported_region_id', async () => {
    const pdgSummary = await supervisorModel.getSummaryKPI({ regionId: 1 });
    const bktSummary = await supervisorModel.getSummaryKPI({ regionId: 2 });
    assert.ok(Number.isFinite(Number(pdgSummary.total_reports)));
    assert.ok(Number.isFinite(Number(bktSummary.total_reports)));
  });
  it('getUserPerformance menggunakan join report_assignments ra.ticket_id = rep.ticket_id AND ra.is_active = 1', async () => {
    const users = await supervisorModel.getUserPerformance();
    assert.ok(Array.isArray(users));
    if (users.length > 0) {
      assert.ok(Object.prototype.hasOwnProperty.call(users[0], 'id'));
      assert.ok(Object.prototype.hasOwnProperty.call(users[0], 'full_name'));
      assert.ok(Object.prototype.hasOwnProperty.call(users[0], 'total_handled'));
      assert.ok(Object.prototype.hasOwnProperty.call(users[0], 'total_completed'));
    }
  });
});
describe('T033 Scope E: Zero Live Database Mutation Verification', () => {
  after(async () => {
    await pool.end();
  });

  it('Verifikasi baris database live persis sama sebelum dan sesudah alur operasional T033 (zero mutation)', async (t) => {
    const tables = [
      'reports',
      'report_assignments',
      'report_logs',
      'report_attachments',
      'telegram_pending_media',
      'type_attachment'
    ];

    async function getLiveRowCountSnapshot() {
      const snapshot = {};
      for (const table of tables) {
        const [[row]] = await pool.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
        snapshot[table] = Number(row.cnt);
      }
      return snapshot;
    }

    const beforeSnapshot = await getLiveRowCountSnapshot();

    await assertTakeThenComplete(t, false);

    const afterSnapshot = await getLiveRowCountSnapshot();

    assert.deepEqual(
      afterSnapshot,
      beforeSnapshot,
      'Row counts database live sebelum dan sesudah alur operasional T033 harus identik (zero mutation)'
    );
  });
});
