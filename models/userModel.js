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

async function getAllUsers() {
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
     ORDER BY users.id ASC`
  );

  return rows;
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
  getAllRoles,
  getAllRegions,
  isUsernameTaken,
  createUser,
  updateUser
};