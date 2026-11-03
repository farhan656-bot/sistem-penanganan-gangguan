const pool = require('../config/db');

async function createOrUpdateRegistration(data, trxConnection = null) {
  const conn = trxConnection || pool;
  const sql = `
    INSERT INTO telegram_reporters (
      telegram_user_id,
      telegram_username,
      telegram_chat_id,
      full_name,
      nik,
      agency,
      status,
      rejection_reason,
      approved_by_user_id,
      approved_at,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      telegram_username = VALUES(telegram_username),
      telegram_chat_id = VALUES(telegram_chat_id),
      full_name = VALUES(full_name),
      nik = VALUES(nik),
      agency = VALUES(agency),
      status = 'pending',
      rejection_reason = NULL,
      approved_by_user_id = NULL,
      approved_at = NULL,
      updated_at = NOW()
  `;

  const [result] = await conn.query(sql, [
    String(data.telegram_user_id),
    data.telegram_username ? String(data.telegram_username) : null,
    String(data.telegram_chat_id),
    String(data.full_name).trim(),
    String(data.nik).trim(),
    String(data.agency).trim().toUpperCase()
  ]);

  return result.insertId || result.affectedRows;
}

async function findByTelegramUserId(telegramUserId, trxConnection = null) {
  if (!telegramUserId) return null;
  const conn = trxConnection || pool;
  const sql = `
    SELECT
      tr.*,
      u.full_name AS approved_by_name
    FROM telegram_reporters tr
    LEFT JOIN users u ON tr.approved_by_user_id = u.id
    WHERE tr.telegram_user_id = ?
    LIMIT 1
  `;
  const [rows] = await conn.query(sql, [String(telegramUserId)]);
  return rows[0] || null;
}

async function findById(id, trxConnection = null) {
  if (!id) return null;
  const conn = trxConnection || pool;
  const sql = `
    SELECT
      tr.*,
      u.full_name AS approved_by_name
    FROM telegram_reporters tr
    LEFT JOIN users u ON tr.approved_by_user_id = u.id
    WHERE tr.id = ?
    LIMIT 1
  `;
  const [rows] = await conn.query(sql, [Number(id)]);
  return rows[0] || null;
}

async function getAllReporters(filters = {}, trxConnection = null) {
  const conn = trxConnection || pool;
  const conditions = [];
  const params = [];

  if (filters.status && ['pending', 'approved', 'rejected'].includes(filters.status)) {
    conditions.push('tr.status = ?');
    params.push(filters.status);
  }

  if (filters.agency && ['TELKOM', 'HD', 'TELKOMSEL'].includes(filters.agency.toUpperCase())) {
    conditions.push('tr.agency = ?');
    params.push(filters.agency.toUpperCase());
  }

  if (filters.search && String(filters.search).trim()) {
    const term = `%${String(filters.search).trim()}%`;
    conditions.push('(tr.full_name LIKE ? OR tr.nik LIKE ? OR tr.telegram_username LIKE ?)');
    params.push(term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let paginationSql = '';
  if (filters.limit !== undefined && filters.limit !== null) {
    const limit = Math.max(1, parseInt(filters.limit, 10) || 10);
    const offset = Math.max(0, parseInt(filters.offset, 10) || 0);
    paginationSql = 'LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }

  const sql = `
    SELECT
      tr.*,
      u.full_name AS approved_by_name
    FROM telegram_reporters tr
    LEFT JOIN users u ON tr.approved_by_user_id = u.id
    ${whereClause}
    ORDER BY
      CASE WHEN tr.status = 'pending' THEN 0 ELSE 1 END,
      tr.created_at DESC
    ${paginationSql}
  `;

  const [rows] = await conn.query(sql, params);
  return rows;
}

async function countReporters(filters = {}, trxConnection = null) {
  const conn = trxConnection || pool;
  const conditions = [];
  const params = [];

  if (filters.status && ['pending', 'approved', 'rejected'].includes(filters.status)) {
    conditions.push('tr.status = ?');
    params.push(filters.status);
  }

  if (filters.agency && ['TELKOM', 'HD', 'TELKOMSEL'].includes(filters.agency.toUpperCase())) {
    conditions.push('tr.agency = ?');
    params.push(filters.agency.toUpperCase());
  }

  if (filters.search && String(filters.search).trim()) {
    const term = `%${String(filters.search).trim()}%`;
    conditions.push('(tr.full_name LIKE ? OR tr.nik LIKE ? OR tr.telegram_username LIKE ?)');
    params.push(term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(1) AS total
    FROM telegram_reporters tr
    ${whereClause}
  `;

  const [rows] = await conn.query(sql, params);
  return Number(rows[0]?.total || 0);
}

async function getStatusCounts(trxConnection = null) {
  const conn = trxConnection || pool;
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
    FROM telegram_reporters
  `;
  const [rows] = await conn.query(sql);
  const row = rows[0] || {};
  return {
    total: Number(row.total || 0),
    pending: Number(row.pending || 0),
    approved: Number(row.approved || 0),
    rejected: Number(row.rejected || 0)
  };
}

async function approveReporter(id, adminUserId, trxConnection = null) {
  const conn = trxConnection || pool;
  const sql = `
    UPDATE telegram_reporters
    SET
      status = 'approved',
      approved_by_user_id = ?,
      approved_at = NOW(),
      rejection_reason = NULL,
      updated_at = NOW()
    WHERE id = ?
  `;
  const [result] = await conn.query(sql, [
    adminUserId ? Number(adminUserId) : null,
    Number(id)
  ]);
  return result.affectedRows > 0;
}

async function rejectReporter(id, adminUserId, rejectionReason = null, trxConnection = null) {
  const conn = trxConnection || pool;
  const sql = `
    UPDATE telegram_reporters
    SET
      status = 'rejected',
      approved_by_user_id = ?,
      approved_at = NOW(),
      rejection_reason = ?,
      updated_at = NOW()
    WHERE id = ?
  `;
  const [result] = await conn.query(sql, [
    adminUserId ? Number(adminUserId) : null,
    rejectionReason ? String(rejectionReason).trim() : 'Tidak memenuhi kriteria',
    Number(id)
  ]);
  return result.affectedRows > 0;
}

module.exports = {
  createOrUpdateRegistration,
  findByTelegramUserId,
  findById,
  getAllReporters,
  countReporters,
  getStatusCounts,
  approveReporter,
  rejectReporter
};
