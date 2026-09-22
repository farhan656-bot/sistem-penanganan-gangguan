const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const pool = require('../../config/db');
const reportController = require('../../controllers/reportController');

const filename = path.resolve(__dirname, '../../models/reportModel.js');

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
  const moduleObj = { exports: {} };
  vm.runInThisContext(
    `(function(require, module, exports, __filename, __dirname) {${source}\n})`,
    { filename }
  )((id) => {
    if (id === '../config/db') return isolatedPool;
    return localRequire(id);
  }, moduleObj, moduleObj.exports, filename, path.dirname(filename));
  return moduleObj.exports;
}

describe('T035 — Validate Polling Determinism (GET /reports/check-new)', () => {
  describe('1. Controller Cursor Parsing & Validation Unit Tests', () => {
    function createMockRes() {
      const res = {
        statusCode: 200,
        jsonData: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.jsonData = data;
          return this;
        }
      };
      return res;
    }

    it('Menerima kursor komposit valid since_received_at (ISO-8601) dan since_ticket_id', async () => {
      const req = {
        query: {
          since_received_at: '2026-09-22T10:00:00.000Z',
          since_ticket_id: 'INF-1001',
          work_status: 'all'
        },
        session: { user: { id: 7, role: 'super_admin' } }
      };
      const res = createMockRes();

      await reportController.checkNewReports(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.ok(typeof res.jsonData.newCount === 'number');
      assert.ok(typeof res.jsonData.hasNewReports === 'boolean');
    });

    it('Menolak format stempel waktu invalid pada since_received_at dengan HTTP 400', async () => {
      const req = {
        query: {
          since_received_at: 'invalid-date-format',
          since_ticket_id: 'INF-1001'
        },
        session: { user: { id: 7, role: 'super_admin' } }
      };
      const res = createMockRes();

      await reportController.checkNewReports(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Parameter cursor polling tidak valid/);
    });

    it('Menolak since_ticket_id yang melebihi batas 100 karakter dengan HTTP 400', async () => {
      const req = {
        query: {
          since_received_at: '2026-09-22T10:00:00.000Z',
          since_ticket_id: 'A'.repeat(101)
        },
        session: { user: { id: 7, role: 'super_admin' } }
      };
      const res = createMockRes();

      await reportController.checkNewReports(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Parameter cursor polling tidak valid/);
    });

    it('Backward compatibility: menerima kursor legacy since_id numerik jika timestamp tidak disediakan', async () => {
      const req = {
        query: {
          since_id: '10'
        },
        session: { user: { id: 7, role: 'super_admin' } }
      };
      const res = createMockRes();

      await reportController.checkNewReports(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.ok(typeof res.jsonData.newCount === 'number');
    });

    it('Menolak request tanpa since_received_at dan tanpa since_id valid dengan HTTP 400', async () => {
      const req = {
        query: {
          since_id: 'not-a-number'
        },
        session: { user: { id: 7, role: 'super_admin' } }
      };
      const res = createMockRes();

      await reportController.checkNewReports(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.jsonData.success, false);
      assert.match(res.jsonData.message, /Parameter since_id tidak valid/);
    });
  });

  describe('2. Deterministic Composite Cursor Integration Tests (Database Isolated Transaction)', () => {
    it('Skenario 1, 3, 4: Dua report dengan received_at berbeda, kursor sebelum R1, kursor pada R1, kursor pada R2', async (t) => {
      const connection = await pool.getConnection();
      const ticketId1 = `POLL-D1-${randomUUID().slice(0, 8)}`;
      const ticketId2 = `POLL-D2-${randomUUID().slice(0, 8)}`;
      const t1 = new Date('2026-09-22T08:00:00.000Z');
      const t2 = new Date('2026-09-22T08:05:00.000Z');

      try {
        await connection.beginTransaction();
        const source = fs.readFileSync(filename, 'utf8');
        const model = loadModel(source, connection);
        const currentUser = { id: 7, role: 'super_admin' };

        await connection.query(`
          INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, current_region_id, received_at, created_at, updated_at)
          VALUES (?, 'telegram', 'Polling Diff Time 1', 'tersedia', 1, 1, ?, NOW(), NOW())
        `, [ticketId1, t1]);

        await connection.query(`
          INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, current_region_id, received_at, created_at, updated_at)
          VALUES (?, 'telegram', 'Polling Diff Time 2', 'tersedia', 1, 1, ?, NOW(), NOW())
        `, [ticketId2, t2]);

        // Langkah A: Kursor sebelum report pertama
        const resBefore = await model.getNewReportStats({
          sinceReceivedAt: new Date('2026-09-22T07:55:00.000Z'),
          sinceTicketId: '',
          sinceId: 0
        }, currentUser);

        assert.equal(resBefore.newCount, 2);
        assert.equal(new Date(resBefore.latest_received_at).toISOString(), t2.toISOString());
        assert.equal(resBefore.latest_ticket_id, ticketId2);

        // Langkah B: Kursor tepat pada report pertama (T1, ticketId1)
        const resOnR1 = await model.getNewReportStats({
          sinceReceivedAt: t1,
          sinceTicketId: ticketId1,
          sinceId: 0
        }, currentUser);

        // Harus mengembalikan persis 1 laporan (R2), R1 TIDAK boleh terduplikasi
        assert.equal(resOnR1.newCount, 1);
        assert.equal(new Date(resOnR1.latest_received_at).toISOString(), t2.toISOString());
        assert.equal(resOnR1.latest_ticket_id, ticketId2);

        // Langkah C: Kursor tepat pada report kedua / terakhir (T2, ticketId2)
        const resOnR2 = await model.getNewReportStats({
          sinceReceivedAt: t2,
          sinceTicketId: ticketId2,
          sinceId: 0
        }, currentUser);

        // Tidak ada lagi laporan baru, kursor tidak boleh mundur
        assert.equal(resOnR2.newCount, 0);
        assert.equal(new Date(resOnR2.latest_received_at).toISOString(), t2.toISOString());
        assert.equal(resOnR2.latest_ticket_id, ticketId2);

        t.diagnostic('Verified: Distinct timestamp progression and zero duplicate');
      } finally {
        await connection.rollback();
        connection.release();
      }
    });

    it('Skenario 2, 5, 6: Dua report dengan received_at SAMA tetapi ticket_id berbeda (lexicographic tie-breaker)', async (t) => {
      const connection = await pool.getConnection();
      // Pastikan urutan leksikografis jelas: T-SAME-AAA < T-SAME-BBB
      const ticketIdA = `POLL-S-AAA-${randomUUID().slice(0, 6)}`;
      const ticketIdB = `POLL-S-BBB-${randomUUID().slice(0, 6)}`;
      assert.ok(ticketIdA < ticketIdB, 'Ticket A harus lebih kecil secara leksikografis daripada Ticket B');

      const tSame = new Date('2026-09-22T09:00:00.000Z');

      try {
        await connection.beginTransaction();
        const source = fs.readFileSync(filename, 'utf8');
        const model = loadModel(source, connection);
        const currentUser = { id: 7, role: 'super_admin' };

        await connection.query(`
          INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, current_region_id, received_at, created_at, updated_at)
          VALUES (?, 'telegram', 'Same Time Report A', 'tersedia', 1, 1, ?, NOW(), NOW())
        `, [ticketIdA, tSame]);

        await connection.query(`
          INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, current_region_id, received_at, created_at, updated_at)
          VALUES (?, 'telegram', 'Same Time Report B', 'tersedia', 1, 1, ?, NOW(), NOW())
        `, [ticketIdB, tSame]);

        // Langkah A: Kursor sebelum kedua laporan ber-timestamp sama
        const resBefore = await model.getNewReportStats({
          sinceReceivedAt: new Date('2026-09-22T08:59:00.000Z'),
          sinceTicketId: '',
          sinceId: 0
        }, currentUser);

        assert.equal(resBefore.newCount, 2);
        assert.equal(new Date(resBefore.latest_received_at).toISOString(), tSame.toISOString());
        assert.equal(resBefore.latest_ticket_id, ticketIdB, 'Tie-breaker harus memilih ticket_id terbesar secara leksikografis');

        // Langkah B: Kursor berada tepat di antara dua report (pada timestamp sama, since_ticket_id = ticketIdA)
        const resBetween = await model.getNewReportStats({
          sinceReceivedAt: tSame,
          sinceTicketId: ticketIdA,
          sinceId: 0
        }, currentUser);

        // Hanya report B yang dikembalikan! Report A tidak terduplikasi
        assert.equal(resBetween.newCount, 1);
        assert.equal(new Date(resBetween.latest_received_at).toISOString(), tSame.toISOString());
        assert.equal(resBetween.latest_ticket_id, ticketIdB);

        // Langkah C: Kursor berada tepat pada report B (laporan terakhir ber-timestamp sama)
        const resAfter = await model.getNewReportStats({
          sinceReceivedAt: tSame,
          sinceTicketId: ticketIdB,
          sinceId: 0
        }, currentUser);

        assert.equal(resAfter.newCount, 0);
        assert.equal(new Date(resAfter.latest_received_at).toISOString(), tSame.toISOString());
        assert.equal(resAfter.latest_ticket_id, ticketIdB);

        t.diagnostic('Verified: Identical timestamp lexicographic tie-breaker works deterministically');
      } finally {
        await connection.rollback();
        connection.release();
      }
    });

    it('Skenario 7 & 8: Simulasi beruntun auto-refresh polling menjamin pergerakan kursor monoton tanpa duplikasi', async () => {
      const connection = await pool.getConnection();
      const ticketId1 = `POLL-SEQ-1-${randomUUID().slice(0, 6)}`;
      const ticketId2 = `POLL-SEQ-2-${randomUUID().slice(0, 6)}`;
      const t1 = new Date('2026-09-22T10:00:00.000Z');
      const t2 = new Date('2026-09-22T10:05:00.000Z');

      try {
        await connection.beginTransaction();
        const source = fs.readFileSync(filename, 'utf8');
        const model = loadModel(source, connection);
        const currentUser = { id: 7, role: 'super_admin' };

        // Insert report pertama
        await connection.query(`
          INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, current_region_id, received_at, created_at, updated_at)
          VALUES (?, 'telegram', 'Sequential Report 1', 'tersedia', 1, 1, ?, NOW(), NOW())
        `, [ticketId1, t1]);

        let clientCursor = {
          receivedAt: new Date('2026-09-22T09:50:00.000Z'),
          ticketId: ''
        };

        // Poll 1: Deteksi report 1
        const poll1 = await model.getNewReportStats({
          sinceReceivedAt: clientCursor.receivedAt,
          sinceTicketId: clientCursor.ticketId,
          sinceId: 0
        }, currentUser);

        assert.equal(poll1.newCount, 1);
        assert.equal(poll1.latest_ticket_id, ticketId1);

        // Update kursor klien maju ke report 1
        clientCursor = {
          receivedAt: new Date(poll1.latest_received_at),
          ticketId: poll1.latest_ticket_id
        };

        // Poll 1.5: Tidak ada laporan baru, kursor tetap stabil
        const pollIdle = await model.getNewReportStats({
          sinceReceivedAt: clientCursor.receivedAt,
          sinceTicketId: clientCursor.ticketId,
          sinceId: 0
        }, currentUser);
        assert.equal(pollIdle.newCount, 0);
        assert.equal(new Date(pollIdle.latest_received_at).toISOString(), clientCursor.receivedAt.toISOString());
        assert.equal(pollIdle.latest_ticket_id, clientCursor.ticketId);

        // Insert report kedua
        await connection.query(`
          INSERT INTO reports (ticket_id, source_channel, summary, status_internal, reported_region_id, current_region_id, received_at, created_at, updated_at)
          VALUES (?, 'telegram', 'Sequential Report 2', 'tersedia', 1, 1, ?, NOW(), NOW())
        `, [ticketId2, t2]);

        // Poll 2: Deteksi report 2, tanpa menduplikasi report 1
        const poll2 = await model.getNewReportStats({
          sinceReceivedAt: clientCursor.receivedAt,
          sinceTicketId: clientCursor.ticketId,
          sinceId: 0
        }, currentUser);

        assert.equal(poll2.newCount, 1);
        assert.equal(poll2.latest_ticket_id, ticketId2);

        // Verifikasi kursor maju secara monoton (t2 > t1)
        assert.ok(
          new Date(poll2.latest_received_at) > clientCursor.receivedAt,
          'Kursor waktu harus maju secara monoton'
        );

        // Update kursor klien ke report 2
        clientCursor = {
          receivedAt: new Date(poll2.latest_received_at),
          ticketId: poll2.latest_ticket_id
        };

        // Poll 3: Tidak ada lagi laporan baru
        const poll3 = await model.getNewReportStats({
          sinceReceivedAt: clientCursor.receivedAt,
          sinceTicketId: clientCursor.ticketId,
          sinceId: 0
        }, currentUser);

        assert.equal(poll3.newCount, 0);
        assert.equal(new Date(poll3.latest_received_at).toISOString(), clientCursor.receivedAt.toISOString());
        assert.equal(poll3.latest_ticket_id, clientCursor.ticketId);
      } finally {
        await connection.rollback();
        connection.release();
      }
    });
  });

  describe('3. Zero Live Database Mutation Verification', () => {
    after(async () => {
      await pool.end();
    });

    it('Verifikasi row counts database live tetap persis sama dengan baseline T005', async () => {
      const expectedBaseline = {
        reports: 48,
        report_assignments: 53,
        report_logs: 265,
        report_attachments: 46,
        telegram_pending_media: 8,
        type_attachment: 2
      };

      for (const [table, expectedCount] of Object.entries(expectedBaseline)) {
        const [[row]] = await pool.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
        assert.equal(
          Number(row.cnt),
          expectedCount,
          `Tabel ${table} harus memiliki ${expectedCount} baris (aktual: ${row.cnt})`
        );
      }
    });
  });
});
