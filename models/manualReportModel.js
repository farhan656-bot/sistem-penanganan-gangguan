const pool = require('../config/db');

const MANUAL_REPORT_TEXT_FIELDS = [
  'details',
  'osm_order_id',
  'sto',
  'sc',
  'order_ncx_id',
  'ncli',
  'customer_name',
  'alpro_before',
  'alpro_name',
  'ticket_incident',
  'incident',
  'witel',
  'k_kontak',
  'user_id_text',
  'transaction_type',
  'fallout_type',
  'activity',
  'work_type',
  'ticket_resolved',
  'ticket_resolved_2',
  'se_status'
];

function normalizeOptionalText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  return text ? text : null;
}

function normalizeDate(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  return text ? text : null;
}

function normalizeOptionalId(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function restrictToOwnReports(sql, params, currentUser) {
  if (!currentUser || !currentUser.role) {
    return `${sql} AND 1 = 0 `;
  }

  if (currentUser.role === 'super_admin') {
    return sql;
  }

  if (currentUser.role === 'eksekutor' || currentUser.role === 'koordinator') {
    params.push(currentUser.id);
    return `${sql} AND manual_non_ticketing_reports.created_by = ? `;
  }

  return `${sql} AND 1 = 0 `;
}

async function createManualReport(data) {
  const payload = {};

  MANUAL_REPORT_TEXT_FIELDS.forEach((field) => {
    payload[field] = normalizeOptionalText(data[field]);
  });

  const [result] = await pool.query(
    `
    INSERT INTO manual_non_ticketing_reports
    (
      report_date,
      details,
      osm_order_id,
      sto,
      sc,
      order_ncx_id,
      ncli,
      customer_name,
      alpro_before,
      alpro_name,
      ticket_incident,
      incident,
      witel,
      k_kontak,
      user_id_text,
      transaction_type,
      fallout_type,
      activity,
      work_type,
      ticket_resolved,
      ticket_resolved_2,
      se_status,
      region_id,
      created_by,
      updated_by,
      created_at,
      updated_at
    )
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [
      normalizeDate(data.report_date),
      payload.details,
      payload.osm_order_id,
      payload.sto,
      payload.sc,
      payload.order_ncx_id,
      payload.ncli,
      payload.customer_name,
      payload.alpro_before,
      payload.alpro_name,
      payload.ticket_incident,
      payload.incident,
      payload.witel,
      payload.k_kontak,
      payload.user_id_text,
      payload.transaction_type,
      payload.fallout_type,
      payload.activity,
      payload.work_type,
      payload.ticket_resolved,
      payload.ticket_resolved_2,
      payload.se_status,
      normalizeOptionalId(data.region_id),
      normalizeOptionalId(data.created_by),
      normalizeOptionalId(data.updated_by || data.created_by)
    ]
  );

  return result.insertId;
}

async function getManualReports(filters = {}, currentUser) {
  let sql = `
    SELECT
      manual_non_ticketing_reports.*,
      regions.code AS region_code,
      regions.name AS region_name,
      creator.full_name AS created_by_name,
      updater.full_name AS updated_by_name
    FROM manual_non_ticketing_reports
    LEFT JOIN regions ON manual_non_ticketing_reports.region_id = regions.id
    LEFT JOIN users creator ON manual_non_ticketing_reports.created_by = creator.id
    LEFT JOIN users updater ON manual_non_ticketing_reports.updated_by = updater.id
    WHERE 1 = 1
  `;

  const params = [];
  sql = restrictToOwnReports(sql, params, currentUser);

  if (filters.search) {
    sql += `
      AND (
        manual_non_ticketing_reports.details LIKE ?
        OR manual_non_ticketing_reports.osm_order_id LIKE ?
        OR manual_non_ticketing_reports.sc LIKE ?
        OR manual_non_ticketing_reports.order_ncx_id LIKE ?
        OR manual_non_ticketing_reports.ncli LIKE ?
        OR manual_non_ticketing_reports.customer_name LIKE ?
        OR manual_non_ticketing_reports.ticket_incident LIKE ?
        OR manual_non_ticketing_reports.incident LIKE ?
      )
    `;
    const keyword = `%${filters.search}%`;
    params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
  }

  if (filters.date_from) {
    sql += ` AND manual_non_ticketing_reports.report_date >= ? `;
    params.push(filters.date_from);
  }

  if (filters.date_to) {
    sql += ` AND manual_non_ticketing_reports.report_date <= ? `;
    params.push(filters.date_to);
  }

  if (filters.sto) {
    sql += ` AND manual_non_ticketing_reports.sto LIKE ? `;
    params.push(`%${filters.sto}%`);
  }

  if (filters.activity) {
    sql += ` AND manual_non_ticketing_reports.activity LIKE ? `;
    params.push(`%${filters.activity}%`);
  }

  if (filters.work_type) {
    sql += ` AND manual_non_ticketing_reports.work_type LIKE ? `;
    params.push(`%${filters.work_type}%`);
  }

  if (filters.se_status) {
    sql += ` AND manual_non_ticketing_reports.se_status LIKE ? `;
    params.push(`%${filters.se_status}%`);
  }

  sql += `
    ORDER BY
      manual_non_ticketing_reports.report_date DESC,
      manual_non_ticketing_reports.created_at DESC,
      manual_non_ticketing_reports.id DESC
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getManualReportById(id, currentUser) {
  let sql = `
    SELECT
      manual_non_ticketing_reports.*,
      regions.code AS region_code,
      regions.name AS region_name,
      creator.full_name AS created_by_name,
      updater.full_name AS updated_by_name
    FROM manual_non_ticketing_reports
    LEFT JOIN regions ON manual_non_ticketing_reports.region_id = regions.id
    LEFT JOIN users creator ON manual_non_ticketing_reports.created_by = creator.id
    LEFT JOIN users updater ON manual_non_ticketing_reports.updated_by = updater.id
    WHERE manual_non_ticketing_reports.id = ?
  `;

  const params = [id];
  sql = restrictToOwnReports(sql, params, currentUser);

  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
}

module.exports = {
  createManualReport,
  getManualReports,
  getManualReportById
};
