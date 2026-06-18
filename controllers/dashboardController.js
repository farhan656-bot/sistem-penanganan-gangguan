const supervisorModel = require('../models/supervisorModel');
const userModel = require('../models/userModel');
const dashboardModel = require('../models/dashboardModel');

async function eksekutorDashboard(req, res) {
  try {
    const dashboardData = await dashboardModel.getEksekutorDashboard(req.session.user);

    return res.render('eksekutor/dashboard', {
      title: 'Dashboard Eksekutor',
      ...dashboardData
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat dashboard Eksekutor.');
    return res.redirect('/auth/login');
  }
}

async function koordinatorDashboard(req, res) {
  try {
    const dashboardData = await dashboardModel.getKoordinatorDashboard();

    return res.render('koordinator/dashboard', {
      title: 'Dashboard Koordinator',
      ...dashboardData
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat dashboard Koordinator.');
    return res.redirect('/auth/login');
  }
}

async function superAdminDashboard(req, res) {
  try {
    const dashboardData = await dashboardModel.getSuperAdminDashboard();

    return res.render('super_admin/dashboard', {
      title: 'Dashboard Super Admin',
      ...dashboardData
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat dashboard Super Admin.');
    return res.redirect('/auth/login');
  }
}

function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return '-';
  }

  const totalMinutes = Math.max(0, Math.round(Number(minutes)));
  const days = Math.floor(totalMinutes / 1440);
  const minutesAfterDays = totalMinutes % 1440;
  const hours = Math.floor(minutesAfterDays / 60);
  const remainingMinutes = minutesAfterDays % 60;

  if (days > 0) {
    return `${days} hari ${hours} jam ${remainingMinutes} menit`;
  }

  if (hours > 0) {
    return `${hours} jam ${remainingMinutes} menit`;
  }

  return `${remainingMinutes} menit`;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toMySqlDateTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const second = pad2(date.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function parseDateOnly(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const [year, month, day] = trimmed.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateISO(value) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
}

function normalizePeriod(value) {
  const allowed = ['all', 'today', 'last_7_days', 'this_month', 'custom'];
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : 'all';
  return allowed.includes(normalized) ? normalized : 'all';
}

function buildReportDateRange(period, startDate, endDate) {
  const now = new Date();

  if (period === 'today') {
    return {
      start: startOfDay(now),
      end: now
    };
  }

  if (period === 'last_7_days') {
    const start = startOfDay(new Date(now));
    start.setDate(start.getDate() - 6);
    return {
      start,
      end: now
    };
  }

  if (period === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: startOfDay(start),
      end: now
    };
  }

  if (period === 'custom') {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);

    if (!start || !end) {
      return { start: null, end: null };
    }

    const startDateTime = startOfDay(start);
    const endDateTime = endOfDay(end);

    if (startDateTime.getTime() > endDateTime.getTime()) {
      return { start: null, end: null };
    }

    return { start: startDateTime, end: endDateTime };
  }

  return { start: null, end: null };
}

async function supervisorDashboard(req, res) {
  try {
    const period = normalizePeriod(req.query.period);
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : 'all';
    const regionIdFromQuery = Number(req.query.regionId) || null;
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : '';
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : '';

    const regions = await userModel.getAllRegions();
    const validRegionIds = new Set((regions || []).map((r) => Number(r.id)).filter(Boolean));
    const regionId = regionIdFromQuery && validRegionIds.has(Number(regionIdFromQuery))
      ? Number(regionIdFromQuery)
      : null;

    const dateRange = buildReportDateRange(period, startDate, endDate);
    const startDateTime = toMySqlDateTime(dateRange.start);
    const endDateTime = toMySqlDateTime(dateRange.end);

    const filters = {
      startDateTime,
      endDateTime,
      regionId,
      status
    };

    const [
      summary,
      regionSummary,
      userPerformance,
      statusChartRows,
      trendChartRows,
      regionComparisonRows,
      attentionTickets,
      regionSwitchHistory
    ] = await Promise.all([
      supervisorModel.getSummaryKPI(filters),
      supervisorModel.getRegionSummary(filters),
      supervisorModel.getUserPerformance(filters),
      supervisorModel.getStatusChartData(filters),
      supervisorModel.getTrendChartData(filters),
      supervisorModel.getRegionComparisonChartData(filters),
      supervisorModel.getAttentionTickets(filters),
      supervisorModel.getRegionSwitchHistory(filters)
    ]);

    const statusLabelMap = {
      baru: 'Baru',
      tersedia: 'Tersedia',
      diambil: 'Diambil',
      didelegasikan: 'Didelegasikan',
      selesai: 'Selesai',
      perlu_tindak_lanjut: 'Perlu Tindak Lanjut',
      eskalasi: 'Eskalasi'
    };

    const statusChartData = {
      labels: (statusChartRows || []).map((row) => statusLabelMap[row.status] || row.status),
      data: (statusChartRows || []).map((row) => Number(row.total) || 0),
      statuses: (statusChartRows || []).map((row) => row.status)
    };

    const trendChartData = {
      labels: (trendChartRows || []).map((row) => formatDateISO(row.bucket_date)),
      data: (trendChartRows || []).map((row) => Number(row.total) || 0)
    };

    const nonZeroRegionComparisonRows = (regionComparisonRows || []).filter(
      (row) => (Number(row.total) || 0) > 0
    );

    const regionComparisonChartData = {
      labels: nonZeroRegionComparisonRows.map((row) => row.region_code || '-'),
      data: nonZeroRegionComparisonRows.map((row) => Number(row.total) || 0)
    };

    res.render('supervisor/dashboard', {
      title: 'Dashboard Supervisor',
      filters: {
        period,
        startDate: startDate || '',
        endDate: endDate || '',
        regionId: regionId || '',
        status: status || 'all'
      },
      regions: Array.isArray(regions) ? regions : [],
      reportStatuses: (supervisorModel.REPORT_STATUSES || []).filter((st) => st !== 'baru'),
      summary: {
        total_reports: Number(summary?.total_reports) || 0,
        total_available: Number(summary?.total_available) || 0,
        total_in_progress: Number(summary?.total_in_progress) || 0,
        total_completed: Number(summary?.total_completed) || 0,
        total_follow_up: Number(summary?.total_follow_up) || 0,
        total_escalated: Number(summary?.total_escalated) || 0,
        completion_rate: Number(summary?.completion_rate) || 0,
        active_backlog: Number(summary?.active_backlog) || 0,
        avg_response: formatMinutes(summary?.avg_response_minutes),
        avg_resolution: formatMinutes(summary?.avg_resolution_minutes)
      },
      regionSummary: Array.isArray(regionSummary) ? regionSummary : [],
      userPerformance: Array.isArray(userPerformance) ? userPerformance : [],
      attentionTickets: Array.isArray(attentionTickets) ? attentionTickets : [],
      regionSwitchHistory: Array.isArray(regionSwitchHistory) ? regionSwitchHistory : [],
      charts: {
        status: statusChartData,
        trend: trendChartData,
        regionComparison: regionComparisonChartData
      },
      statusLabelMap,
      formatDateTime,
      formatMinutes
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat dashboard supervisor.');
    return res.redirect('/auth/login');
  }
}

module.exports = {
  eksekutorDashboard,
  koordinatorDashboard,
  superAdminDashboard,
  supervisorDashboard
};
