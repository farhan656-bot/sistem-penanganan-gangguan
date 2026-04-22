const pool = require('../config/db');

async function getSummaryKPI() {
  const [[summary]] = await pool.query(`
    SELECT
      COUNT(*) AS total_reports,
      SUM(CASE WHEN status_internal = 'tersedia' THEN 1 ELSE 0 END) AS total_available,
      SUM(CASE WHEN status_internal IN ('diambil', 'didelegasikan') THEN 1 ELSE 0 END) AS total_in_progress,
      SUM(CASE WHEN status_internal = 'selesai' THEN 1 ELSE 0 END) AS total_completed,
      ROUND(AVG(
        CASE
          WHEN taken_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, received_at, taken_at)
          ELSE NULL
        END
      ), 2) AS avg_response_minutes,
      ROUND(AVG(
        CASE
          WHEN taken_at IS NOT NULL AND resolved_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, taken_at, resolved_at)
          ELSE NULL
        END
      ), 2) AS avg_resolution_minutes
    FROM reports
  `);

  return summary;
}

async function getRegionSummary() {
  const [rows] = await pool.query(`
    SELECT
      r.code AS region_code,
      r.name AS region_name,
      COUNT(rep.id) AS total_reports,
      SUM(CASE WHEN rep.status_internal = 'tersedia' THEN 1 ELSE 0 END) AS total_available,
      SUM(CASE WHEN rep.status_internal IN ('diambil', 'didelegasikan') THEN 1 ELSE 0 END) AS total_in_progress,
      SUM(CASE WHEN rep.status_internal = 'selesai' THEN 1 ELSE 0 END) AS total_completed
    FROM regions r
    LEFT JOIN reports rep ON rep.current_region_id = r.id
    GROUP BY r.id, r.code, r.name
    ORDER BY r.code ASC
  `);

  return rows;
}

async function getUserPerformance() {
  const [rows] = await pool.query(`
    SELECT
      u.id,
      u.full_name,
      reg.code AS region_code,
      COUNT(rep.id) AS total_handled,
      SUM(CASE WHEN rep.status_internal = 'selesai' THEN 1 ELSE 0 END) AS total_completed,
      ROUND(AVG(
        CASE
          WHEN rep.taken_at IS NOT NULL AND rep.resolved_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, rep.taken_at, rep.resolved_at)
          ELSE NULL
        END
      ), 2) AS avg_resolution_minutes
    FROM users u
    JOIN roles ro ON u.role_id = ro.id
    LEFT JOIN regions reg ON u.region_id = reg.id
    LEFT JOIN reports rep ON rep.current_assigned_user_id = u.id
    WHERE ro.name = 'eksekutor'
    GROUP BY u.id, u.full_name, reg.code
    ORDER BY total_completed DESC, total_handled DESC, u.full_name ASC
  `);

  return rows;
}

module.exports = {
  getSummaryKPI,
  getRegionSummary,
  getUserPerformance
};