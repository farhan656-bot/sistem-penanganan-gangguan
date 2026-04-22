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
        regions.name AS region_name
     FROM users
     JOIN roles ON users.role_id = roles.id
     LEFT JOIN regions ON users.region_id = regions.id
     WHERE roles.name = 'eksekutor'
       AND users.is_active = 1
       AND regions.code = ?
     ORDER BY users.full_name ASC`,
    [regionCode]
  );

  return rows;
}

module.exports = {
  findByUsername,
  findById,
  getEksekutorUsers,
  getEksekutorUsersByRegionCode
};