const pool = require('../config/db');

async function findByUsername(username) {
  const [rows] = await pool.query(
    `SELECT 
        users.id,
        users.full_name,
        users.username,
        users.password_hash,
        users.is_active,
        users.role_id,
        users.region_id,
        roles.name AS role_name,
        regions.code AS region_code,
        regions.name AS region_name
     FROM users
     JOIN roles ON users.role_id = roles.id
     LEFT JOIN regions ON users.region_id = regions.id
     WHERE users.username = ?`,
    [username]
  );

  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT 
        users.id,
        users.full_name,
        users.username,
        users.is_active,
        users.role_id,
        users.region_id,
        roles.name AS role_name,
        regions.code AS region_code,
        regions.name AS region_name
     FROM users
     JOIN roles ON users.role_id = roles.id
     LEFT JOIN regions ON users.region_id = regions.id
     WHERE users.id = ?`,
    [id]
  );

  return rows[0] || null;
}

async function getEksekutorUsers() {
  const [rows] = await pool.query(
    `SELECT
        users.id,
        users.full_name,
        users.username,
        users.region_id,
        regions.code AS region_code,
        regions.name AS region_name
     FROM users
     JOIN roles ON users.role_id = roles.id
     LEFT JOIN regions ON users.region_id = regions.id
     WHERE roles.name = 'eksekutor'
       AND users.is_active = 1
     ORDER BY regions.code ASC, users.full_name ASC`
  );

  return rows;
}

async function getEksekutorUsersByRegionCode(regionCode) {
  const [rows] = await pool.query(
    `SELECT
        users.id,
        users.full_name,
        users.username,
        users.region_id,
        regions.code AS region_code,
        regions.name AS region_name,
        COALESCE(SUM(CASE WHEN rep.status_internal = 'diambil' AND ra.is_active = 1 THEN 1 ELSE 0 END), 0) AS active_tickets
     FROM users
     JOIN roles ON users.role_id = roles.id
     LEFT JOIN regions ON users.region_id = regions.id
     LEFT JOIN report_assignments ra ON ra.assigned_to_user_id = users.id AND ra.is_active = 1
     LEFT JOIN reports rep ON rep.ticket_id = ra.ticket_id
     WHERE roles.name = 'eksekutor'
       AND users.is_active = 1
       AND regions.code = ?
     GROUP BY users.id, users.full_name, users.username, users.region_id, regions.code, regions.name
     ORDER BY active_tickets ASC, users.full_name ASC`,
    [regionCode]
  );

  return rows.map((r) => ({
    ...r,
    active_tickets: Number(r.active_tickets) || 0
  }));
}

async function getAllUsers(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.search && String(filters.search).trim()) {
    const term = `%${String(filters.search).trim()}%`;
    conditions.push('(users.full_name LIKE ? OR users.username LIKE ? OR roles.name LIKE ? OR regions.code LIKE ?)');
    params.push(term, term, term, term);
  }

  if (filters.role_id) {
    conditions.push('users.role_id = ?');
    params.push(Number(filters.role_id));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let paginationSql = '';
  if (filters.limit !== undefined && filters.limit !== null) {
    const limit = Math.max(1, parseInt(filters.limit, 10) || 10);
    const offset = Math.max(0, parseInt(filters.offset, 10) || 0);
    paginationSql = 'LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }

  const sql = `SELECT
        users.id,
        users.full_name,
        users.username,
        users.is_active,
        users.role_id,
        users.region_id,
        roles.name AS role_name,
        regions.code AS region_code,
        regions.name AS region_name
     FROM users
     JOIN roles ON users.role_id = roles.id
     LEFT JOIN regions ON users.region_id = regions.id
     ${whereClause}
     ORDER BY users.id ASC
     ${paginationSql}`;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function countUsers(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.search && String(filters.search).trim()) {
    const term = `%${String(filters.search).trim()}%`;
    conditions.push('(users.full_name LIKE ? OR users.username LIKE ? OR roles.name LIKE ? OR regions.code LIKE ?)');
    params.push(term, term, term, term);
  }

  if (filters.role_id) {
    conditions.push('users.role_id = ?');
    params.push(Number(filters.role_id));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `SELECT COUNT(1) AS total
     FROM users
     JOIN roles ON users.role_id = roles.id
     LEFT JOIN regions ON users.region_id = regions.id
     ${whereClause}`;

  const [rows] = await pool.query(sql, params);
  return Number(rows[0]?.total || 0);
}

async function getAllRoles() {
  const [rows] = await pool.query(
    `SELECT id, name
     FROM roles
     WHERE name != 'pelapor'
     ORDER BY name ASC`
  );

  return rows;
}

async function getAllRegions() {
  const [rows] = await pool.query(
    `SELECT id, code, name
     FROM regions
     ORDER BY code ASC`
  );

  return rows;
}

async function isUsernameTaken(username, excludeUserId = null) {
  const query = excludeUserId
    ? 'SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1'
    : 'SELECT id FROM users WHERE username = ? LIMIT 1';

  const params = excludeUserId ? [username, excludeUserId] : [username];
  const [rows] = await pool.query(query, params);
  return rows.length > 0;
}

async function createUser(userData) {
  const [result] = await pool.query(
    `INSERT INTO users
      (full_name, username, password_hash, role_id, region_id, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userData.full_name,
      userData.username,
      userData.password_hash,
      userData.role_id,
      userData.region_id,
      userData.is_active
    ]
  );

  return result.insertId;
}

async function updateUser(id, userData) {
  if (userData.password_hash) {
    await pool.query(
      `UPDATE users
       SET full_name = ?,
           username = ?,
           password_hash = ?,
           role_id = ?,
           region_id = ?,
           is_active = ?
       WHERE id = ?`,
      [
        userData.full_name,
        userData.username,
        userData.password_hash,
        userData.role_id,
        userData.region_id,
        userData.is_active,
        id
      ]
    );
  } else {
    await pool.query(
      `UPDATE users
       SET full_name = ?,
           username = ?,
           role_id = ?,
           region_id = ?,
           is_active = ?
       WHERE id = ?`,
      [
        userData.full_name,
        userData.username,
        userData.role_id,
        userData.region_id,
        userData.is_active,
        id
      ]
    );
  }
}

module.exports = {
  findByUsername,
  findById,
  getEksekutorUsers,
  getEksekutorUsersByRegionCode,
  getAllUsers,
  countUsers,
  getAllRoles,
  getAllRegions,
  isUsernameTaken,
  createUser,
  updateUser
};
