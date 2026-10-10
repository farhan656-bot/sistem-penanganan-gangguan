const test = require('node:test');
const assert = require('node:assert/strict');
const reportModel = require('../../models/reportModel');

test('Work Status Tabs & Model Filter: delegated vs in_progress', async (t) => {
  await t.test('1. getReportWorkStatusCounts includes delegated count and separates from in_progress', async () => {
    const counts = await reportModel.getReportWorkStatusCounts({}, { role: 'super_admin' });
    
    assert.ok(typeof counts.all === 'number', 'counts.all must be a number');
    assert.ok(typeof counts.available === 'number', 'counts.available must be a number');
    assert.ok(typeof counts.in_progress === 'number', 'counts.in_progress must be a number');
    assert.ok(typeof counts.delegated === 'number', 'counts.delegated must be a number');
    assert.ok(typeof counts.completed === 'number', 'counts.completed must be a number');
    assert.ok(typeof counts.follow_up === 'number', 'counts.follow_up must be a number');
    assert.ok(typeof counts.escalated === 'number', 'counts.escalated must be a number');

    // Total of all status buckets should equal total reports
    const sumBuckets = counts.available + counts.in_progress + counts.delegated + counts.completed + counts.follow_up + counts.escalated;
    assert.equal(sumBuckets, counts.all, 'Sum of all status buckets must equal total count');
  });

  await t.test('2. getReports with workStatus: delegated only returns didelegasikan reports', async () => {
    const reports = await reportModel.getReports(
      { workStatus: 'delegated', limit: 10, offset: 0 },
      { role: 'super_admin' }
    );

    for (const report of reports) {
      assert.equal(report.status_internal, 'didelegasikan', 'Every report returned must have status_internal = didelegasikan');
    }
  });

  await t.test('3. getReports with workStatus: in_progress only returns diambil reports', async () => {
    const reports = await reportModel.getReports(
      { workStatus: 'in_progress', limit: 10, offset: 0 },
      { role: 'super_admin' }
    );

    for (const report of reports) {
      assert.equal(report.status_internal, 'diambil', 'Every report returned must have status_internal = diambil');
    }
  });

  await t.test('4. getReportWorkStatusCounts for koordinator separates team_in_progress and my_in_progress', async () => {
    const koordinatorUser = { id: 2, role: 'koordinator', region_id: 1 };
    const counts = await reportModel.getReportWorkStatusCounts({}, koordinatorUser);

    assert.ok(typeof counts.team_in_progress === 'number', 'counts.team_in_progress must be a number');
    assert.ok(typeof counts.my_in_progress === 'number', 'counts.my_in_progress must be a number');
    assert.equal(
      counts.team_in_progress + counts.my_in_progress,
      counts.in_progress,
      'team_in_progress + my_in_progress must equal in_progress'
    );
  });

  await t.test('5. getReports with workStatus: team_in_progress does not return tickets assigned to koordinator', async () => {
    const koordinatorUser = { id: 2, role: 'koordinator', region_id: 1 };
    const reports = await reportModel.getReports(
      { workStatus: 'team_in_progress', limit: 20, offset: 0 },
      koordinatorUser
    );

    for (const report of reports) {
      assert.equal(report.status_internal, 'diambil');
      assert.notEqual(report.assigned_to_user_id, koordinatorUser.id);
    }
  });

  await t.test('6. dashboardModel.getKoordinatorDashboard returns separated team_in_progress and my_in_progress', async () => {
    const dashboardModel = require('../../models/dashboardModel');
    const koordinatorUser = { id: 2, role: 'koordinator', region_id: 1 };
    const dash = await dashboardModel.getKoordinatorDashboard(koordinatorUser);

    assert.ok(dash.summary);
    assert.ok(typeof dash.summary.total_team_in_progress === 'number');
    assert.ok(typeof dash.summary.total_my_in_progress === 'number');
    assert.equal(
      dash.summary.total_team_in_progress + dash.summary.total_my_in_progress,
      dash.summary.total_in_progress
    );
    assert.ok(Array.isArray(dash.myActiveReports));
  });

  t.after(async () => {
    const pool = require('../../config/db');
    await pool.end();
  });
});
