const pool = require('../config/db');
const regionSwitchModel = require('./regionSwitchModel');

const COORDINATOR_REGION_CODES = ['PDG', 'BKT'];

function buildPlaceholders(values) {
  return values.map(() => '?').join(', ');
}

function normalizeLimit(value, fallback, maximum) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

function toNumber(value) {
  return Number(value) || 0;
}

function uniquePositiveIds(values) {
  return [...new Set(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  )];
}

async function getCoordinatorRegions() {
  const placeholders = buildPlaceholders(COORDINATOR_REGION_CODES);
  const [rows] = await pool.query(
    `
    SELECT id, code, name
    FROM regions
    WHERE code IN (${placeholders})
    ORDER BY FIELD(code, 'PDG', 'BKT')
    `,
    COORDINATOR_REGION_CODES
  );

  return rows;
}

async function getEksekutorDashboard(currentUser, { assignedLimit = 5 } = {}) {
  const userId = Number(currentUser && currentUser.id);

  if (!userId) {
    throw new Error('User Eksekutor tidak valid.');
  }

  const extraRegionIds = await regionSwitchModel.getActiveExtraRegionsByUserId(userId);
  const accessibleRegionIds = uniquePositiveIds([
    currentUser.region_id,
    ...extraRegionIds
  ]);
  const safeAssignedLimit = normalizeLimit(assignedLimit, 5, 10);

  let availableAccessSql = 'reports.current_assigned_user_id = ?';
  const summaryParams = [];

  if (accessibleRegionIds.length > 0) {
    availableAccessSql = `(
      reports.current_region_id IN (${buildPlaceholders(accessibleRegionIds)})
      OR reports.current_assigned_user_id = ?
    )`;
    summaryParams.push(...accessibleRegionIds, userId);
  } else {
    summaryParams.push(userId);
  }

  summaryParams.push(userId, userId, userId, userId);

  const [summaryResult, assignedResult] = await Promise.all([
    pool.query(
      `
      SELECT
        COALESCE(SUM(
          CASE
            WHEN reports.status_internal = 'tersedia'
              AND ${availableAccessSql}
            THEN 1 ELSE 0
          END
        ), 0) AS total_available,
        COALESCE(SUM(
          CASE
            WHEN reports.status_internal IN ('diambil', 'didelegasikan')
              AND reports.current_assigned_user_id = ?
            THEN 1 ELSE 0
          END
        ), 0) AS total_my_in_progress,
        COALESCE(SUM(
          CASE
            WHEN reports.status_internal = 'selesai'
              AND reports.current_assigned_user_id = ?
            THEN 1 ELSE 0
          END
        ), 0) AS total_completed,
        COALESCE(SUM(
          CASE
            WHEN reports.status_internal = 'perlu_tindak_lanjut'
              AND reports.current_assigned_user_id = ?
            THEN 1 ELSE 0
          END
        ), 0) AS total_follow_up,
        COALESCE(SUM(
          CASE
            WHEN reports.status_internal = 'eskalasi'
              AND reports.current_assigned_user_id = ?
            THEN 1 ELSE 0
          END
        ), 0) AS total_escalated
      FROM reports
      `,
      summaryParams
    ),
    pool.query(
      `
      SELECT
        reports.id,
        reports.ticket_id,
        reports.order_id,
        reports.summary,
        reports.status_internal,
        reports.received_at,
        reports.taken_at,
        reports.updated_at,
        regions.code AS region_code,
        regions.name AS region_name
      FROM reports
      LEFT JOIN regions ON reports.current_region_id = regions.id
      WHERE reports.current_assigned_user_id = ?
        AND reports.status_internal IN (
          'diambil',
          'didelegasikan',
          'selesai',
          'perlu_tindak_lanjut',
          'eskalasi'
        )
      ORDER BY
        COALESCE(reports.taken_at, reports.updated_at, reports.received_at) DESC,
        reports.id DESC
      LIMIT ?
      `,
      [userId, safeAssignedLimit]
    )
  ]);

  const summaryRow = summaryResult[0][0] || {};

  return {
    summary: {
      total_available: toNumber(summaryRow.total_available),
      total_my_in_progress: toNumber(summaryRow.total_my_in_progress),
      total_completed: toNumber(summaryRow.total_completed),
      total_follow_up: toNumber(summaryRow.total_follow_up),
      total_escalated: toNumber(summaryRow.total_escalated)
    },
    latestAssignedReports: assignedResult[0] || []
  };
}

async function getKoordinatorDashboard({ activityLimit = 8 } = {}) {
  const regions = await getCoordinatorRegions();
  const regionIds = uniquePositiveIds(regions.map((region) => region.id));
  const safeActivityLimit = normalizeLimit(activityLimit, 8, 20);

  if (regionIds.length === 0) {
    return {
      summary: {
        total_reports: 0,
        total_available: 0,
        total_in_progress: 0,
        total_delegated: 0,
        total_completed: 0,
        total_follow_up: 0,
        total_escalated: 0
      },
      regionSummary: [],
      latestActivities: []
    };
  }

  const placeholders = buildPlaceholders(regionIds);
  const [summaryResult, regionSummaryResult, activityResult] = await Promise.all([
    pool.query(
      `
      SELECT
        COUNT(*) AS total_reports,
        COALESCE(SUM(reports.status_internal = 'tersedia'), 0) AS total_available,
        COALESCE(SUM(reports.status_internal = 'diambil'), 0) AS total_in_progress,
        COALESCE(SUM(reports.status_internal = 'didelegasikan'), 0) AS total_delegated,
        COALESCE(SUM(reports.status_internal = 'selesai'), 0) AS total_completed,
        COALESCE(SUM(reports.status_internal = 'perlu_tindak_lanjut'), 0) AS total_follow_up,
        COALESCE(SUM(reports.status_internal = 'eskalasi'), 0) AS total_escalated
      FROM reports
      WHERE reports.current_region_id IN (${placeholders})
      `,
      regionIds
    ),
    pool.query(
      `
      SELECT
        regions.id AS region_id,
        regions.code AS region_code,
        regions.name AS region_name,
        COUNT(reports.id) AS total_reports,
        COALESCE(SUM(reports.status_internal = 'tersedia'), 0) AS total_available,
        COALESCE(SUM(reports.status_internal = 'diambil'), 0) AS total_in_progress,
        COALESCE(SUM(reports.status_internal = 'didelegasikan'), 0) AS total_delegated,
        COALESCE(SUM(reports.status_internal = 'selesai'), 0) AS total_completed,
        COALESCE(SUM(reports.status_internal = 'perlu_tindak_lanjut'), 0) AS total_follow_up,
        COALESCE(SUM(reports.status_internal = 'eskalasi'), 0) AS total_escalated
      FROM regions
      LEFT JOIN reports ON reports.current_region_id = regions.id
      WHERE regions.id IN (${placeholders})
      GROUP BY regions.id, regions.code, regions.name
      ORDER BY FIELD(regions.code, 'PDG', 'BKT')
      `,
      regionIds
    ),
    pool.query(
      `
      SELECT
        report_logs.id,
        report_logs.action,
        LEFT(report_logs.description, 240) AS description,
        report_logs.created_at,
        reports.id AS report_id,
        reports.ticket_id,
        reports.order_id,
        reports.status_internal,
        regions.code AS region_code,
        CASE
          WHEN users.full_name IS NOT NULL THEN users.full_name
          WHEN report_logs.action LIKE 'telegram_%'
            OR report_logs.action = 'create_telegram_report'
            OR report_logs.action = 'telegram_additional_data_received'
          THEN 'Telegram Bot'
          ELSE 'Sistem'
        END AS actor_name
      FROM report_logs
      JOIN reports ON reports.id = report_logs.report_id
      LEFT JOIN regions ON reports.current_region_id = regions.id
      LEFT JOIN users ON users.id = report_logs.user_id
      WHERE reports.current_region_id IN (${placeholders})
      ORDER BY report_logs.created_at DESC, report_logs.id DESC
      LIMIT ?
      `,
      [...regionIds, safeActivityLimit]
    )
  ]);

  const summaryRow = summaryResult[0][0] || {};

  return {
    summary: {
      total_reports: toNumber(summaryRow.total_reports),
      total_available: toNumber(summaryRow.total_available),
      total_in_progress: toNumber(summaryRow.total_in_progress),
      total_delegated: toNumber(summaryRow.total_delegated),
      total_completed: toNumber(summaryRow.total_completed),
      total_follow_up: toNumber(summaryRow.total_follow_up),
      total_escalated: toNumber(summaryRow.total_escalated)
    },
    regionSummary: (regionSummaryResult[0] || []).map((row) => ({
      ...row,
      total_reports: toNumber(row.total_reports),
      total_available: toNumber(row.total_available),
      total_in_progress: toNumber(row.total_in_progress),
      total_delegated: toNumber(row.total_delegated),
      total_completed: toNumber(row.total_completed),
      total_follow_up: toNumber(row.total_follow_up),
      total_escalated: toNumber(row.total_escalated)
    })),
    latestActivities: activityResult[0] || []
  };
}

async function getSuperAdminDashboard() {
  const [userSummaryResult, reportResult, manualReportResult, regionResult, roleResult] =
    await Promise.all([
      pool.query(
        `
        SELECT
          COUNT(*) AS total_users,
          COALESCE(SUM(is_active = 1), 0) AS total_active_users,
          COALESCE(SUM(is_active = 0), 0) AS total_inactive_users
        FROM users
        `
      ),
      pool.query('SELECT COUNT(*) AS total_reports FROM reports'),
      pool.query(
        'SELECT COUNT(*) AS total_manual_reports FROM manual_non_ticketing_reports'
      ),
      pool.query('SELECT COUNT(*) AS total_regions FROM regions'),
      pool.query(
        `
        SELECT
          roles.id AS role_id,
          roles.name AS role_name,
          COUNT(users.id) AS total_users,
          COALESCE(SUM(users.is_active = 1), 0) AS total_active_users,
          COALESCE(SUM(users.is_active = 0), 0) AS total_inactive_users
        FROM roles
        LEFT JOIN users ON users.role_id = roles.id
        GROUP BY roles.id, roles.name
        ORDER BY roles.name ASC
        `
      )
    ]);

  const userSummary = userSummaryResult[0][0] || {};
  const reportSummary = reportResult[0][0] || {};
  const manualReportSummary = manualReportResult[0][0] || {};
  const regionSummary = regionResult[0][0] || {};

  return {
    summary: {
      total_users: toNumber(userSummary.total_users),
      total_active_users: toNumber(userSummary.total_active_users),
      total_inactive_users: toNumber(userSummary.total_inactive_users),
      total_reports: toNumber(reportSummary.total_reports),
      total_manual_reports: toNumber(manualReportSummary.total_manual_reports),
      total_regions: toNumber(regionSummary.total_regions)
    },
    usersByRole: (roleResult[0] || []).map((row) => ({
      ...row,
      total_users: toNumber(row.total_users),
      total_active_users: toNumber(row.total_active_users),
      total_inactive_users: toNumber(row.total_inactive_users)
    }))
  };
}

module.exports = {
  getEksekutorDashboard,
  getKoordinatorDashboard,
  getSuperAdminDashboard
};
