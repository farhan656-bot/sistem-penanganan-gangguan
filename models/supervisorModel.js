const pool = require('../config/db');

const REPORT_STATUSES = [
  'baru',
  'tersedia',
  'diambil',
  'didelegasikan',
  'selesai',
  'perlu_tindak_lanjut',
  'eskalasi'
];

function normalizeFilters(filters = {}) {
  const normalized = {
    startDateTime: typeof filters.startDateTime === 'string' ? filters.startDateTime : null,
    endDateTime: typeof filters.endDateTime === 'string' ? filters.endDateTime : null,
    regionId: Number(filters.regionId) || null,
    status: typeof filters.status === 'string' ? filters.status.trim().toLowerCase() : 'all'
  };

  if (!normalized.startDateTime || !normalized.endDateTime) {
    normalized.startDateTime = null;
    normalized.endDateTime = null;
  }

  if (!REPORT_STATUSES.includes(normalized.status)) {
    normalized.status = 'all';
  }

  return normalized;
}

function buildReportWhereClause(filters, tableAlias = 'reports') {
  const normalized = normalizeFilters(filters);
  const conditions = [];
  const params = [];

  if (normalized.startDateTime && normalized.endDateTime) {
    conditions.push(`${tableAlias}.received_at BETWEEN ? AND ?`);
    params.push(normalized.startDateTime, normalized.endDateTime);
  }

  if (normalized.regionId) {
    conditions.push(`${tableAlias}.reported_region_id = ?`);
    params.push(normalized.regionId);
  }

  if (normalized.status !== 'all') {
    conditions.push(`${tableAlias}.status_internal = ?`);
    params.push(normalized.status);
  }

  const sql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { sql, params, normalized };
}

function buildReportJoinFilterClause(filters, tableAlias = 'rep', { includeRegion = true } = {}) {
  const normalized = normalizeFilters(filters);
  const conditions = [];
  const params = [];

  if (normalized.startDateTime && normalized.endDateTime) {
    conditions.push(`${tableAlias}.received_at BETWEEN ? AND ?`);
    params.push(normalized.startDateTime, normalized.endDateTime);
  }

  if (includeRegion && normalized.regionId) {
    conditions.push(`${tableAlias}.reported_region_id = ?`);
    params.push(normalized.regionId);
  }

  if (normalized.status !== 'all') {
    conditions.push(`${tableAlias}.status_internal = ?`);
    params.push(normalized.status);
  }

  const sql = conditions.length > 0 ? ` AND ${conditions.join(' AND ')}` : '';
  return { sql, params, normalized };
}

async function getSummaryKPI(filters = {}) {
  const { sql: whereSql, params } = buildReportWhereClause(filters, 'rep');

  const [[summary]] = await pool.query(
    `
    SELECT
      COUNT(*) AS total_reports,
      COALESCE(SUM(CASE WHEN rep.status_internal = 'tersedia' THEN 1 ELSE 0 END), 0) AS total_available,
      COALESCE(SUM(CASE WHEN rep.status_internal IN ('diambil', 'didelegasikan') THEN 1 ELSE 0 END), 0) AS total_in_progress,
      COALESCE(SUM(CASE WHEN rep.status_internal = 'selesai' THEN 1 ELSE 0 END), 0) AS total_completed,
      COALESCE(SUM(CASE WHEN rep.status_internal = 'perlu_tindak_lanjut' THEN 1 ELSE 0 END), 0) AS total_follow_up,
      COALESCE(SUM(CASE WHEN rep.status_internal = 'eskalasi' THEN 1 ELSE 0 END), 0) AS total_escalated,
      ROUND(AVG(
        CASE
          WHEN rep.taken_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, rep.received_at, rep.taken_at)
          ELSE NULL
        END
      ), 2) AS avg_response_minutes,
      ROUND(AVG(
        CASE
          WHEN rep.taken_at IS NOT NULL AND rep.resolved_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, rep.taken_at, rep.resolved_at)
          ELSE NULL
        END
      ), 2) AS avg_resolution_minutes,
      ROUND(
        CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE (SUM(CASE WHEN rep.status_internal = 'selesai' THEN 1 ELSE 0 END) / COUNT(*)) * 100
        END,
        2
      ) AS completion_rate,
      (
        COALESCE(SUM(CASE WHEN rep.status_internal = 'tersedia' THEN 1 ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN rep.status_internal IN ('diambil', 'didelegasikan') THEN 1 ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN rep.status_internal = 'perlu_tindak_lanjut' THEN 1 ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN rep.status_internal = 'eskalasi' THEN 1 ELSE 0 END), 0)
      ) AS active_backlog
    FROM reports rep
    ${whereSql}
    `,
    params
  );

  return summary || {
    total_reports: 0,
    total_available: 0,
    total_in_progress: 0,
    total_completed: 0,
    total_follow_up: 0,
    total_escalated: 0,
    avg_response_minutes: null,
    avg_resolution_minutes: null,
    completion_rate: 0,
    active_backlog: 0
  };
}

async function getRegionSummary(filters = {}) {
  const normalized = normalizeFilters(filters);
  const { sql: joinFilterSql, params: joinParams } = buildReportJoinFilterClause(
    normalized,
    'rep',
    { includeRegion: false }
  );

  const whereConditions = [];
  const whereParams = [];

  if (normalized.regionId) {
    whereConditions.push('r.id = ?');
    whereParams.push(normalized.regionId);
  }

  const regionWhereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
    SELECT
      r.id AS region_id,
      r.code AS region_code,
      r.name AS region_name,
      COUNT(rep.ticket_id) AS total_reports,
      COALESCE(SUM(CASE WHEN rep.status_internal = 'tersedia' THEN 1 ELSE 0 END), 0) AS total_available,
      COALESCE(SUM(CASE WHEN rep.status_internal IN ('diambil', 'didelegasikan') THEN 1 ELSE 0 END), 0) AS total_in_progress,
      COALESCE(SUM(CASE WHEN rep.status_internal = 'selesai' THEN 1 ELSE 0 END), 0) AS total_completed,
      COALESCE(SUM(CASE WHEN rep.status_internal = 'perlu_tindak_lanjut' THEN 1 ELSE 0 END), 0) AS total_follow_up,
      COALESCE(SUM(CASE WHEN rep.status_internal = 'eskalasi' THEN 1 ELSE 0 END), 0) AS total_escalated
    FROM regions r
    LEFT JOIN reports rep
      ON rep.reported_region_id = r.id
      ${joinFilterSql}
    ${regionWhereSql}
    GROUP BY r.id, r.code, r.name
    ORDER BY r.code ASC
    `,
    [...joinParams, ...whereParams]
  );

  return Array.isArray(rows) ? rows : [];
}

async function getUserPerformance(filters = {}) {
  const normalized = normalizeFilters(filters);
  const { sql: joinFilterSql, params: joinParams } = buildReportJoinFilterClause(
    normalized,
    'rep',
    { includeRegion: true }
  );

  const userConditions = ["ro.name = 'eksekutor'"];
  const userParams = [];

  if (normalized.regionId) {
    userConditions.push('u.region_id = ?');
    userParams.push(normalized.regionId);
  }

  const [rows] = await pool.query(
    `
    SELECT
      u.id,
      u.full_name,
      reg.code AS region_code,
      reg.name AS region_name,
      COUNT(rep.ticket_id) AS total_handled,
      COALESCE(SUM(CASE WHEN rep.status_internal = 'selesai' THEN 1 ELSE 0 END), 0) AS total_completed,
      ROUND(AVG(
        CASE
          WHEN rep.taken_at IS NOT NULL AND rep.resolved_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, rep.taken_at, rep.resolved_at)
          ELSE NULL
        END
      ), 2) AS avg_resolution_minutes
    FROM users u
    JOIN roles ro ON u.role_id = ro.id
    LEFT JOIN regions reg ON u.region_id = reg.id
    LEFT JOIN (
      reports rep
      JOIN report_assignments ra
        ON ra.ticket_id = rep.ticket_id
       AND ra.is_active = 1
    ) ON ra.assigned_to_user_id = u.id
      ${joinFilterSql}
    WHERE ${userConditions.join(' AND ')}
    GROUP BY u.id, u.full_name, reg.code, reg.name
    ORDER BY total_completed DESC, total_handled DESC, u.full_name ASC
    `,
    [...joinParams, ...userParams]
  );

  return Array.isArray(rows) ? rows : [];
}

async function getStatusChartData(filters = {}) {
  const { sql: whereSql, params } = buildReportWhereClause(filters, 'rep');

  const [rows] = await pool.query(
    `
    SELECT
      rep.status_internal AS status,
      COUNT(*) AS total
    FROM reports rep
    ${whereSql}
    GROUP BY rep.status_internal
    ORDER BY FIELD(rep.status_internal, 'baru', 'tersedia', 'diambil', 'didelegasikan', 'selesai', 'perlu_tindak_lanjut', 'eskalasi')
    `,
    params
  );

  return Array.isArray(rows) ? rows : [];
}

async function getTrendChartData(filters = {}) {
  const { sql: whereSql, params } = buildReportWhereClause(filters, 'rep');

  const [rows] = await pool.query(
    `
    SELECT
      DATE(rep.received_at) AS bucket_date,
      COUNT(*) AS total
    FROM reports rep
    ${whereSql}
    GROUP BY DATE(rep.received_at)
    ORDER BY bucket_date ASC
    `,
    params
  );

  return Array.isArray(rows) ? rows : [];
}

async function getRegionComparisonChartData(filters = {}) {
  const normalized = normalizeFilters(filters);
  const { sql: joinFilterSql, params: joinParams } = buildReportJoinFilterClause(
    normalized,
    'rep',
    { includeRegion: false }
  );

  const whereConditions = [];
  const whereParams = [];

  if (normalized.regionId) {
    whereConditions.push('r.id = ?');
    whereParams.push(normalized.regionId);
  }

  const regionWhereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
    SELECT
      r.id AS region_id,
      r.code AS region_code,
      r.name AS region_name,
      COUNT(rep.ticket_id) AS total
    FROM regions r
    LEFT JOIN reports rep
      ON rep.reported_region_id = r.id
      ${joinFilterSql}
    ${regionWhereSql}
    GROUP BY r.id, r.code, r.name
    ORDER BY total DESC, r.code ASC
    `,
    [...joinParams, ...whereParams]
  );

  return Array.isArray(rows) ? rows : [];
}

async function getAttentionTickets(filters = {}, { limit = 15 } = {}) {
  const normalized = normalizeFilters(filters);
  const whereParts = [];
  const params = [];

  whereParts.push("rep.status_internal IN ('perlu_tindak_lanjut', 'eskalasi')");

  if (normalized.startDateTime && normalized.endDateTime) {
    whereParts.push('rep.received_at BETWEEN ? AND ?');
    params.push(normalized.startDateTime, normalized.endDateTime);
  }

  if (normalized.regionId) {
    whereParts.push('rep.reported_region_id = ?');
    params.push(normalized.regionId);
  }

  if (normalized.status !== 'all') {
    whereParts.push('rep.status_internal = ?');
    params.push(normalized.status);
  }

  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(50, Number(limit))) : 15;

  const [rows] = await pool.query(
    `
    SELECT
      rep.ticket_id,
      rep.order_id,
      rep.summary,
      rep.status_internal,
      rep.received_at,
      rep.taken_at,
      rep.resolved_at,
      reg.code AS region_code,
      reg.name AS region_name,
      u.full_name AS assigned_user_name
    FROM reports rep
    LEFT JOIN regions reg ON rep.reported_region_id = reg.id
    LEFT JOIN report_assignments ra
      ON ra.ticket_id = rep.ticket_id
     AND ra.is_active = 1
    LEFT JOIN users u ON ra.assigned_to_user_id = u.id
    ${whereSql}
    ORDER BY rep.received_at DESC
    LIMIT ${safeLimit}
    `,
    params
  );

  return Array.isArray(rows) ? rows : [];
}

async function getRegionSwitchHistory(filters = {}, { limit = 20 } = {}) {
  const normalized = normalizeFilters(filters);
  const whereParts = [];
  const params = [];

  if (normalized.startDateTime && normalized.endDateTime) {
    whereParts.push('req.requested_at BETWEEN ? AND ?');
    params.push(normalized.startDateTime, normalized.endDateTime);
  }

  if (normalized.regionId) {
    whereParts.push('(req.home_region_id = ? OR req.target_region_id = ?)');
    params.push(normalized.regionId, normalized.regionId);
  }

  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(100, Number(limit))) : 20;

  const [rows] = await pool.query(
    `
    SELECT
      req.id,
      req.status,
      req.reason,
      req.requested_at,
      req.approved_at,
      req.start_at,
      req.end_at,
      req.rejection_reason,
      requester.full_name AS requester_name,
      home.code AS home_region_code,
      home.name AS home_region_name,
      target.code AS target_region_code,
      target.name AS target_region_name,
      approver.full_name AS approved_by_name
    FROM region_switch_requests req
    LEFT JOIN users requester ON req.requester_user_id = requester.id
    LEFT JOIN regions home ON req.home_region_id = home.id
    LEFT JOIN regions target ON req.target_region_id = target.id
    LEFT JOIN users approver ON req.approved_by_user_id = approver.id
    ${whereSql}
    ORDER BY req.requested_at DESC
    LIMIT ${safeLimit}
    `,
    params
  );

  return Array.isArray(rows) ? rows : [];
}

module.exports = {
  getSummaryKPI,
  getRegionSummary,
  getUserPerformance,
  getStatusChartData,
  getTrendChartData,
  getRegionComparisonChartData,
  getAttentionTickets,
  getRegionSwitchHistory,
  REPORT_STATUSES
};