const test = require('node:test');
const assert = require('node:assert/strict');
const ejs = require('ejs');
const path = require('node:path');
const pool = require('../../config/db');
const reportModel = require('../../models/reportModel');
const telegramFeedbackService = require('../../services/telegramFeedbackService');

test('Re-open Escalated Ticket and Re-escalation Workflow', async (t) => {
  t.after(async () => {
    await pool.end();
  });
  await t.test('1. Formatting Telegram Feedback untuk Re-open dan Re-eskalasi', () => {
    // Pesan Re-open
    const reopenMsg = telegramFeedbackService.sendReopenedFeedback ? true : false;
    assert.ok(reopenMsg, 'sendReopenedFeedback harus terdefinisi');

    // Pesan Eskalasi awal
    const initialEscMsg = telegramFeedbackService.sendEscalationFeedback;
    assert.ok(initialEscMsg, 'sendEscalationFeedback harus terdefinisi');
  });

  await t.test('2. Menolak reopen jika tiket tidak ditemukan', async () => {
    await assert.rejects(
      async () => {
        await reportModel.reopenReport('INF-NON-EXISTENT-999', {
          id: 1,
          full_name: 'Tester',
          role: 'eksekutor'
        });
      },
      {
        message: 'Laporan tidak ditemukan.'
      }
    );
  });

  await t.test('3. Menolak reopen jika status tiket bukan eskalasi', async () => {
    const testTicketId = 'TEST-STATUS-' + Date.now();
    await pool.query(
      `INSERT INTO reports (
        ticket_id, order_id, summary, reported_region_id, status_internal,
        received_at, created_at, updated_at
      ) VALUES (?, ?, ?, 1, 'tersedia', NOW(), NOW(), NOW())`,
      [testTicketId, 'ORD-' + testTicketId, 'Test bukan eskalasi']
    );

    try {
      await assert.rejects(
        async () => {
          await reportModel.reopenReport(testTicketId, {
            id: 1,
            full_name: 'Tester',
            role: 'eksekutor'
          });
        },
        {
          message: 'Hanya laporan dengan status eskalasi yang dapat dibuka kembali (re-open).'
        }
      );
    } finally {
      await pool.query('DELETE FROM reports WHERE ticket_id = ?', [testTicketId]);
    }
  });

  await t.test('4. Menolak reopen jika eksekutor bukan penanggung jawab tiket', async () => {
    // Ambil dua eksekutor berbeda
    const [executors] = await pool.query(
      `SELECT users.id, users.full_name, roles.name AS role, users.region_id
       FROM users
       JOIN roles ON users.role_id = roles.id
       WHERE roles.name = 'eksekutor' AND users.is_active = 1
       LIMIT 2`
    );

    assert.ok(executors.length >= 1, 'Harus ada minimal 1 eksekutor');
    const assignedUser = executors[0];
    const otherUser = executors.length > 1
      ? executors[1]
      : { id: assignedUser.id + 9999, full_name: 'Other', role: 'eksekutor', region_id: assignedUser.region_id };

    const testTicketId = 'TEST-AUTH-' + Date.now();
    await pool.query(
      `INSERT INTO reports (
        ticket_id, order_id, summary, reported_region_id, status_internal,
        completion_status, diit_code, received_at, created_at, updated_at
      ) VALUES (?, ?, ?, 1, 'eskalasi', 'eskalasi', 'DIIT-999', NOW(), NOW(), NOW())`,
      [testTicketId, 'ORD-' + testTicketId, 'Test unauthorized reopen']
    );

    // Assignment ke assignedUser
    await pool.query(
      `INSERT INTO report_assignments (
        ticket_id, assigned_to_user_id, assigned_by_user_id, assignment_type, is_active, assigned_at
      ) VALUES (?, ?, ?, 'self_take', 1, NOW())`,
      [testTicketId, assignedUser.id, assignedUser.id]
    );

    try {
      await assert.rejects(
        async () => {
          // Eksekutor login adalah otherUser
          await reportModel.reopenReport(testTicketId, otherUser);
        },
        {
          message: 'Anda bukan penanggung jawab laporan ini.'
        }
      );
    } finally {
      await pool.query('DELETE FROM report_assignments WHERE ticket_id = ?', [testTicketId]);
      await pool.query('DELETE FROM reports WHERE ticket_id = ?', [testTicketId]);
    }
  });

  await t.test('5. Sukses Re-open tiket eskalasi: status menjadi diambil, log tercatat, siap dikerjakan ulang', async () => {
    // Cari user eksekutor aktif di database
    const [userRows] = await pool.query(
      `SELECT users.id, users.full_name, roles.name AS role, users.region_id, regions.code AS region_code
       FROM users
       JOIN roles ON users.role_id = roles.id
       LEFT JOIN regions ON users.region_id = regions.id
       WHERE roles.name = 'eksekutor' AND users.is_active = 1
       LIMIT 1`
    );

    assert.ok(userRows.length > 0, 'Harus ada eksekutor aktif di database untuk test');
    const executor = userRows[0];

    const testTicketId = 'TEST-REOPEN-' + Date.now();
    await pool.query(
      `INSERT INTO reports (
        ticket_id, order_id, summary, reported_region_id, status_internal,
        completion_status, diit_code, resolved_at, closed_at, received_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'eskalasi', 'eskalasi', 'DIIT-TEST-123', NOW(), NOW(), NOW(), NOW(), NOW())`,
      [testTicketId, 'ORD-' + testTicketId, 'Test reopen flow', executor.region_id]
    );

    await pool.query(
      `INSERT INTO report_assignments (
        ticket_id, assigned_to_user_id, assigned_by_user_id, assignment_type, is_active, assigned_at
      ) VALUES (?, ?, ?, 'self_take', 1, NOW())`,
      [testTicketId, executor.id, executor.id]
    );

    await pool.query(
      `INSERT INTO report_logs (
        ticket_id, user_id, action, description, created_at
      ) VALUES (?, ?, 'escalate_report', 'Laporan awal dieskalasi ke DIIT', NOW())`,
      [testTicketId, executor.id]
    );

    try {
      // 1. Eksekutor membuka kembali tiket
      const reopenResult = await reportModel.reopenReport(testTicketId, executor);
      assert.equal(reopenResult.success, true);

      // 2. Verifikasi status database
      const [updatedReportRows] = await pool.query(
        `SELECT status_internal, status_wfm, completion_status, resolved_at, closed_at FROM reports WHERE ticket_id = ?`,
        [testTicketId]
      );
      assert.equal(updatedReportRows.length, 1);
      const rep = updatedReportRows[0];
      assert.equal(rep.status_internal, 'diambil');
      assert.equal(rep.status_wfm, 'In Progress');
      assert.equal(rep.completion_status, null);
      assert.equal(rep.resolved_at, null);
      assert.equal(rep.closed_at, null);

      // 3. Verifikasi is_escalated_before pada getReportByTicketId
      const detail = await reportModel.getReportByTicketId(testTicketId, executor);
      assert.equal(detail.is_escalated_before, true);

      // 4. Verifikasi log reopen tercatat
      const [logRows] = await pool.query(
        `SELECT action, description FROM report_logs WHERE ticket_id = ? AND action = 'reopen_escalated_report'`,
        [testTicketId]
      );
      assert.equal(logRows.length, 1);
      assert.ok(logRows[0].description.includes('dibuka kembali'));

      // 5. Eksekutor memproses Re-eskalasi
      const reescalateResult = await reportModel.completeReport(
        testTicketId,
        executor,
        {
          completion_status: 'eskalasi',
          diit_code: 'DIIT-TEST-456'
        },
        []
      );
      assert.equal(reescalateResult.success, true);
      assert.equal(reescalateResult.isReescalation, true);
      assert.ok(reescalateResult.message.includes('re-eskalasi'));

      // 6. Verifikasi log re-eskalasi
      const [reLogRows] = await pool.query(
        `SELECT action FROM report_logs WHERE ticket_id = ? AND action = 're_escalate_report'`,
        [testTicketId]
      );
      assert.equal(reLogRows.length, 1);
    } finally {
      await pool.query('DELETE FROM report_logs WHERE ticket_id = ?', [testTicketId]);
      await pool.query('DELETE FROM report_assignments WHERE ticket_id = ?', [testTicketId]);
      await pool.query('DELETE FROM reports WHERE ticket_id = ?', [testTicketId]);
    }
  });

  await t.test('6. Action button partial merender tombol Re-open untuk tiket eskalasi', async () => {
    const templatePath = path.resolve(__dirname, '../../views/partials/report-action-buttons.ejs');

    // Tiket eskalasi milik eksekutor login
    const htmlAssigned = await ejs.renderFile(templatePath, {
      report: {
        ticket_id: 'INF77019674',
        status_internal: 'eskalasi',
        assigned_to_user_id: 10
      },
      currentUser: {
        id: 10,
        role: 'eksekutor'
      }
    });

    assert.ok(htmlAssigned.includes('Re-open'), 'Harus menampilkan tombol Re-open untuk penanggung jawab tiket');
    assert.ok(htmlAssigned.includes('/reports/INF77019674/reopen'), 'Action form harus mengarah ke /reports/:ticketId/reopen');

    // Tiket eskalasi milik orang lain dilihat oleh eksekutor lain
    const htmlOther = await ejs.renderFile(templatePath, {
      report: {
        ticket_id: 'INF77019674',
        status_internal: 'eskalasi',
        assigned_to_user_id: 10
      },
      currentUser: {
        id: 20,
        role: 'eksekutor'
      }
    });

    assert.ok(!htmlOther.includes('Re-open'), 'Tidak boleh menampilkan tombol Re-open untuk eksekutor bukan penanggung jawab');
  });
});
