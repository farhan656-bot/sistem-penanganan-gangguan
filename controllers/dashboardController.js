const supervisorModel = require('../models/supervisorModel');

function eksekutorDashboard(req, res) {
  res.render('eksekutor/dashboard', {
    title: 'Dashboard Eksekutor'
  });
}

function koordinatorDashboard(req, res) {
  res.render('koordinator/dashboard', {
    title: 'Dashboard Koordinator'
  });
}

function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return '-';
  }

  const totalMinutes = Math.round(Number(minutes));
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} jam ${remainingMinutes} menit`;
  }

  return `${remainingMinutes} menit`;
}

async function supervisorDashboard(req, res) {
  try {
    const summary = await supervisorModel.getSummaryKPI();
    const regionSummary = await supervisorModel.getRegionSummary();
    const userPerformance = await supervisorModel.getUserPerformance();

    res.render('supervisor/dashboard', {
      title: 'Dashboard Supervisor',
      summary: {
        total_reports: summary.total_reports || 0,
        total_available: summary.total_available || 0,
        total_in_progress: summary.total_in_progress || 0,
        total_completed: summary.total_completed || 0,
        avg_response: formatMinutes(summary.avg_response_minutes),
        avg_resolution: formatMinutes(summary.avg_resolution_minutes)
      },
      regionSummary,
      userPerformance,
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
  supervisorDashboard
};