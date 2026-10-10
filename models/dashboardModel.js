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

  let availableAccessSql = '1=0';
  const summaryParams = [];

  if (accessibleRegionIds.length > 0) {
    availableAccessSql = `reports.reported_region_id IN (${buildPlaceholders(accessibleRegionIds)})`;
    summaryParams.push(...accessibleRegionIds);
  }

  summaryParams.push(userId);

  const [summaryResult, assignedResult, regionStatsResult] = await Promise.all([
    pool.query(
      `
      SELECT
        dashboard_counts.metric,
        dashboard_counts.total
      FROM (
        SELECT
          'available' AS metric,
          COUNT(*) AS total
        FROM reports
        WHERE status_internal = 'tersedia'
          AND ${availableAccessSql}

        UNION ALL

        SELECT
          reports.status_internal AS metric,
          COUNT(*) AS total
        FROM reports
        JOIN report_assignments ra ON ra.ticket_id = reports.ticket_id AND ra.is_active = 1
        WHERE ra.assigned_to_user_id = ?
          AND reports.status_internal IN (
            'diambil',
            'didelegasikan',
            'selesai',
            'perlu_tindak_lanjut',
            'eskalasi'
          )
        GROUP BY reports.status_internal
      ) dashboard_counts
      `,
      summaryParams
    ),
    pool.query(
      `
      SELECT
        reports.ticket_id,
        reports.order_id,
        reports.summary,
        reports.status_internal,
        reports.reported_region_id,
        reports.received_at,
        reports.taken_at,
        reports.updated_at,
        regions.code AS region_code,
        regions.name AS region_name,
        ra.assignment_type,
        u.region_id AS assigned_user_region_id
      FROM reports
      JOIN report_assignments ra ON ra.ticket_id = reports.ticket_id AND ra.is_active = 1
      JOIN users u ON ra.assigned_to_user_id = u.id
      LEFT JOIN regions ON reports.reported_region_id = regions.id
      WHERE ra.assigned_to_user_id = ?
        AND reports.status_internal IN (
          'diambil',
          'didelegasikan',
          'selesai',
          'perlu_tindak_lanjut',
          'eskalasi'
        )
      ORDER BY
        COALESCE(reports.taken_at, reports.updated_at, reports.received_at) DESC,
        reports.ticket_id DESC
      LIMIT ?
      `,
      [userId, safeAssignedLimit]
    ),
    pool.query(
      `
      SELECT
        regions.id AS region_id,
        regions.code AS region_code,
        regions.name AS region_name,
        COALESCE(SUM(reports.status_internal = 'tersedia'), 0) AS total_available,
        COALESCE(SUM(DATE(reports.received_at) = CURDATE()), 0) AS today_incoming
      FROM regions
      LEFT JOIN reports ON reports.reported_region_id = regions.id
      WHERE regions.code IN ('PDG', 'BKT')
      GROUP BY regions.id, regions.code, regions.name
      ORDER BY FIELD(regions.code, 'PDG', 'BKT')
      `
    )
  ]);

  const countByMetric = (summaryResult[0] || []).reduce((counts, row) => {
    counts[row.metric] = toNumber(row.total);
    return counts;
  }, {});

  const homeRegionId = Number(currentUser.region_id);
  const activeExtraSet = new Set(extraRegionIds.map(Number));

  const regionComparison = (regionStatsResult[0] || []).map((row) => {
    const regId = Number(row.region_id);
    const isHome = regId === homeRegionId;
    const isSwitched = !isHome && activeExtraSet.has(regId);
    return {
      region_id: regId,
      region_code: row.region_code,
      region_name: row.region_name,
      total_available: toNumber(row.total_available),
      today_incoming: toNumber(row.today_incoming),
      is_home: isHome,
      is_accessible: isHome || activeExtraSet.has(regId),
      is_switched_active: isSwitched
    };
  });

  const homeRegionStat = regionComparison.find((r) => r.is_home);
  const otherRegionStat = regionComparison.find((r) => !r.is_home);

  let switchRecommendation = {
    type: 'balanced',
    title: 'Beban Kerja Seimbang',
    message: 'Distribusi tiket antar wilayah terpantau seimbang dan terkendali.',
    actionText: null,
    actionUrl: null,
    badgeClass: 'text-bg-secondary'
  };

  const isSwitchedActive = Boolean(otherRegionStat && otherRegionStat.is_switched_active);

  if (isSwitchedActive && otherRegionStat) {
    switchRecommendation = {
      type: 'switch_active',
      title: 'Mode Perbantuan Aktif',
      message: `Anda sedang memiliki akses sementara ke ${otherRegionStat.region_name} (berlaku hingga 23:59 WIB).`,
      actionText: `Lihat Antrean ${otherRegionStat.region_name}`,
      actionUrl: '/reports?work_status=available',
      badgeClass: 'text-bg-success'
    };
  } else if (homeRegionStat && otherRegionStat) {
    const homeAvailable = homeRegionStat.total_available;
    const otherAvailable = otherRegionStat.total_available;

    if (otherAvailable > homeAvailable && otherAvailable > 0) {
      switchRecommendation = {
        type: 'recommend_switch',
        title: 'Disarankan Perbantuan Wilayah',
        message: `Antrean di ${otherRegionStat.region_name} lebih tinggi (${otherAvailable} tiket menunggu penanganan) dibanding antrean ${homeRegionStat.region_name} (${homeAvailable} tiket). Pertimbangkan perbantuan wilayah.`,
        actionText: 'Ajukan Switch Region',
        actionUrl: '/region-switch/my',
        badgeClass: 'text-bg-warning'
      };
    } else if (homeAvailable > 0) {
      switchRecommendation = {
        type: 'focus_home',
        title: 'Fokus Wilayah Utama',
        message: `Wilayah utama Anda (${homeRegionStat.region_name}) masih memiliki ${homeAvailable} tiket antrean siap diambil. Prioritaskan tiket di wilayah utama.`,
        actionText: 'Lihat Antrean Wilayah',
        actionUrl: '/reports?work_status=available',
        badgeClass: 'text-bg-info'
      };
    }
  }

  const latestAssignedReports = (assignedResult[0] || []).map((row) => {
    const isDelegated = row.assignment_type === 'delegation';
    const isCrossRegion = Boolean(
      row.reported_region_id &&
      row.assigned_user_region_id &&
      Number(row.reported_region_id) !== Number(row.assigned_user_region_id)
    );
    const isRegionSwitch = Boolean(
      row.assignment_type === 'self_take' &&
      isCrossRegion
    );
    return {
      ...row,
      is_delegated: isDelegated,
      is_cross_region: isCrossRegion,
      is_region_switch: isRegionSwitch
    };
  });

  return {
    summary: {
      total_available: toNumber(countByMetric.available),
      total_my_in_progress: toNumber(countByMetric.diambil)
        + toNumber(countByMetric.didelegasikan),
      total_completed: toNumber(countByMetric.selesai),
      total_follow_up: toNumber(countByMetric.perlu_tindak_lanjut),
      total_escalated: toNumber(countByMetric.eskalasi)
    },
    latestAssignedReports,
    regionComparison,
    switchRecommendation
  };
}

async function getKoordinatorDashboard(currentUserOrOptions = {}, options = {}) {
  let currentUser = {};
  let opts = {};

  if (currentUserOrOptions && (currentUserOrOptions.id || currentUserOrOptions.role)) {
    currentUser = currentUserOrOptions;
    opts = options || {};
  } else {
    opts = currentUserOrOptions || {};
  }
  const activityLimit = opts.activityLimit || 8;
  const currentUserId = Number(currentUser.id) || 0;

  const regions = await getCoordinatorRegions();
  const regionIds = uniquePositiveIds(regions.map((region) => region.id));
  const safeActivityLimit = normalizeLimit(activityLimit, 8, 20);

  if (regionIds.length === 0) {
    return {
      summary: {
        total_reports: 0,
        total_available: 0,
        total_in_progress: 0,
        total_team_in_progress: 0,
        total_my_in_progress: 0,
        total_delegated: 0,
        total_completed: 0,
        total_follow_up: 0,
        total_escalated: 0
      },
      regionSummary: [],
      latestActivities: [],
      myActiveReports: []
    };
  }

  const placeholders = buildPlaceholders(regionIds);

  let reportDateCondition = '';
  const regionSummaryParams = [];
  if (opts.startDateTime && opts.endDateTime) {
    reportDateCondition = 'AND reports.received_at BETWEEN ? AND ?';
    regionSummaryParams.push(opts.startDateTime, opts.endDateTime);
  }
  regionSummaryParams.push(...regionIds);

  let periodTakenCondition = '';
  let periodCompletedCondition = '';
  const eksekutorParams = [];
  if (opts.startDateTime && opts.endDateTime) {
    periodTakenCondition = 'AND (ra.assigned_at BETWEEN ? AND ?)';
    eksekutorParams.push(opts.startDateTime, opts.endDateTime);
    periodCompletedCondition = 'AND (rep.resolved_at BETWEEN ? AND ?)';
    eksekutorParams.push(opts.startDateTime, opts.endDateTime);
  }

  const queries = [
    pool.query(
      `
      SELECT
        regions.id AS region_id,
        regions.code AS region_code,
        regions.name AS region_name,
        COUNT(reports.ticket_id) AS total_reports,
        COALESCE(SUM(reports.status_internal = 'tersedia'), 0) AS total_available,
        COALESCE(SUM(reports.status_internal = 'diambil'), 0) AS total_in_progress,
        COALESCE(SUM(reports.status_internal = 'diambil' AND (ra.assigned_to_user_id IS NULL OR ra.assigned_to_user_id != ${currentUserId})), 0) AS total_team_in_progress,
        COALESCE(SUM(reports.status_internal = 'diambil' AND ra.assigned_to_user_id = ${currentUserId}), 0) AS total_my_in_progress,
        COALESCE(SUM(reports.status_internal = 'didelegasikan'), 0) AS total_delegated,
        COALESCE(SUM(reports.status_internal = 'selesai'), 0) AS total_completed,
        COALESCE(SUM(reports.status_internal = 'perlu_tindak_lanjut'), 0) AS total_follow_up,
        COALESCE(SUM(reports.status_internal = 'eskalasi'), 0) AS total_escalated
      FROM regions
      LEFT JOIN reports ON reports.reported_region_id = regions.id ${reportDateCondition}
      LEFT JOIN report_assignments ra ON ra.ticket_id = reports.ticket_id AND ra.is_active = 1
      WHERE regions.id IN (${placeholders})
      GROUP BY regions.id, regions.code, regions.name
      ORDER BY FIELD(regions.code, 'PDG', 'BKT')
      `,
      regionSummaryParams
    ),
    pool.query(
      `
      SELECT
        report_logs.id,
        report_logs.action,
        LEFT(report_logs.description, 240) AS description,
        report_logs.created_at,
        reports.ticket_id AS report_id,
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
      JOIN reports ON reports.ticket_id = report_logs.ticket_id
      LEFT JOIN regions ON reports.reported_region_id = regions.id
      LEFT JOIN users ON users.id = report_logs.user_id
      WHERE reports.reported_region_id IN (${placeholders})
      ORDER BY report_logs.created_at DESC, report_logs.id DESC
      LIMIT ?
      `,
      [...regionIds, safeActivityLimit]
    ),
    pool.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.username,
        r.code AS region_code,
        r.name AS region_name,
        (
          SELECT COUNT(*)
          FROM report_assignments ra
          JOIN reports rep ON rep.ticket_id = ra.ticket_id
          WHERE ra.assigned_to_user_id = u.id
            AND ra.is_active = 1
            AND rep.status_internal = 'diambil'
        ) AS active_tickets,
        (
          SELECT COUNT(*)
          FROM report_assignments ra
          WHERE ra.assigned_to_user_id = u.id
            ${periodTakenCondition}
        ) AS period_taken,
        (
          SELECT COUNT(*)
          FROM report_assignments ra
          JOIN reports rep ON rep.ticket_id = ra.ticket_id
          WHERE ra.assigned_to_user_id = u.id
            AND rep.status_internal = 'selesai'
            ${periodCompletedCondition}
        ) AS period_completed
      FROM users u
      JOIN roles ro ON u.role_id = ro.id
      JOIN regions r ON u.region_id = r.id
      WHERE ro.name = 'eksekutor' AND r.code IN ('PDG', 'BKT') AND u.is_active = 1
      ORDER BY FIELD(r.code, 'PDG', 'BKT'), active_tickets ASC, u.full_name ASC
      `,
      eksekutorParams
    )
  ];

  if (currentUserId > 0) {
    queries.push(
      pool.query(
        `
        SELECT
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
        JOIN report_assignments ra ON ra.ticket_id = reports.ticket_id AND ra.is_active = 1
        LEFT JOIN regions ON reports.reported_region_id = regions.id
        WHERE ra.assigned_to_user_id = ?
          AND reports.status_internal = 'diambil'
        ORDER BY COALESCE(reports.taken_at, reports.updated_at, reports.received_at) DESC
        LIMIT 5
        `,
        [currentUserId]
      )
    );
  }

  const results = await Promise.all(queries);
  const regionSummaryResult = results[0];
  const activityResult = results[1];
  const eksekutorResult = results[2];
  const myActiveResult = results[3];

  const regionSummary = (regionSummaryResult[0] || []).map((row) => ({
    ...row,
    total_reports: toNumber(row.total_reports),
    total_available: toNumber(row.total_available),
    total_in_progress: toNumber(row.total_in_progress),
    total_team_in_progress: toNumber(row.total_team_in_progress),
    total_my_in_progress: toNumber(row.total_my_in_progress),
    total_delegated: toNumber(row.total_delegated),
    total_completed: toNumber(row.total_completed),
    total_follow_up: toNumber(row.total_follow_up),
    total_escalated: toNumber(row.total_escalated),
    is_overloaded: false
  }));

  // Disparity evaluation between PDG and BKT
  const pdgStat = regionSummary.find((r) => r.region_code === 'PDG');
  const bktStat = regionSummary.find((r) => r.region_code === 'BKT');
  let disparityAlert = null;

  if (pdgStat && bktStat) {
    const pdgAvail = pdgStat.total_available;
    const bktAvail = bktStat.total_available;
    const diff = pdgAvail - bktAvail;

    if (diff >= 3 && (pdgAvail >= bktAvail * 2 || bktAvail <= 2)) {
      pdgStat.is_overloaded = true;
      disparityAlert = {
        overloaded_region_code: 'PDG',
        overloaded_region_name: 'Padang',
        overloaded_count: pdgAvail,
        other_region_code: 'BKT',
        other_region_name: 'Bukittinggi',
        other_count: bktAvail,
        difference: diff,
        message: `Antrean tiket di wilayah Padang (PDG) tinggi (${pdgAvail} tiket tersedia) dibanding Bukittinggi (${bktAvail} tiket). Disarankan mendelegasikan tiket Padang ke teknisi Bukittinggi yang memiliki beban kerja ringan.`
      };
    } else if (diff <= -3 && (bktAvail >= pdgAvail * 2 || pdgAvail <= 2)) {
      bktStat.is_overloaded = true;
      disparityAlert = {
        overloaded_region_code: 'BKT',
        overloaded_region_name: 'Bukittinggi',
        overloaded_count: bktAvail,
        other_region_code: 'PDG',
        other_region_name: 'Padang',
        other_count: pdgAvail,
        difference: Math.abs(diff),
        message: `Antrean tiket di wilayah Bukittinggi (BKT) tinggi (${bktAvail} tiket tersedia) dibanding Padang (${pdgAvail} tiket). Disarankan mendelegasikan tiket Bukittinggi ke teknisi Padang yang memiliki beban kerja ringan.`
      };
    }
  }

  const eksekutorWorkload = (eksekutorResult[0] || []).map((row) => {
    const active = toNumber(row.active_tickets);
    let load_badge = {
      level: 'senggang',
      label: 'Senggang (0 Aktif)',
      badgeClass: 'text-bg-success-subtle text-success border border-success-subtle',
      canDelegate: true,
      recommendation: 'Sangat Disarankan'
    };
    if (active === 1) {
      load_badge = {
        level: 'ringan',
        label: 'Ringan (1 Aktif)',
        badgeClass: 'text-bg-info-subtle text-info border border-info-subtle',
        canDelegate: true,
        recommendation: 'Siap Terima Delegasi'
      };
    } else if (active >= 2 && active <= 3) {
      load_badge = {
        level: 'sedang',
        label: `${active} Aktif (Sedang)`,
        badgeClass: 'text-bg-warning-subtle text-warning-emphasis border border-warning-subtle',
        canDelegate: false,
        recommendation: 'Sedang Beroperasi'
      };
    } else if (active >= 4) {
      load_badge = {
        level: 'padat',
        label: `${active} Aktif (Padat)`,
        badgeClass: 'text-bg-danger-subtle text-danger border border-danger-subtle',
        canDelegate: false,
        recommendation: 'Kapasitas Penuh'
      };
    }

    return {
      ...row,
      active_tickets: active,
      period_taken: toNumber(row.period_taken),
      period_completed: toNumber(row.period_completed),
      load_badge
    };
  });

  const summary = regionSummary.reduce((totals, row) => ({
    total_reports: totals.total_reports + row.total_reports,
    total_available: totals.total_available + row.total_available,
    total_in_progress: totals.total_in_progress + row.total_in_progress,
    total_team_in_progress: totals.total_team_in_progress + row.total_team_in_progress,
    total_my_in_progress: totals.total_my_in_progress + row.total_my_in_progress,
    total_delegated: totals.total_delegated + row.total_delegated,
    total_completed: totals.total_completed + row.total_completed,
    total_follow_up: totals.total_follow_up + row.total_follow_up,
    total_escalated: totals.total_escalated + row.total_escalated
  }), {
    total_reports: 0,
    total_available: 0,
    total_in_progress: 0,
    total_team_in_progress: 0,
    total_my_in_progress: 0,
    total_delegated: 0,
    total_completed: 0,
    total_follow_up: 0,
    total_escalated: 0
  });

  return {
    summary,
    regionSummary,
    disparityAlert,
    eksekutorWorkload,
    latestActivities: activityResult[0] || [],
    myActiveReports: (myActiveResult && myActiveResult[0]) || []
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
