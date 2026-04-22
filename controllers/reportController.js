const reportModel = require('../models/reportModel');
const userModel = require('../models/userModel');

async function listReports(req, res) {
  try {
    const filters = {
      search: req.query.search || '',
      status: req.query.status || '',
      region: req.query.region || ''
    };

    const reports = await reportModel.getReports(filters, req.session.user);

    res.render('reports/index', {
      title: 'Daftar Antrean Kerja',
      reports,
      filters
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat daftar laporan.');
    res.redirect('/');
  }
}

async function showReportDetail(req, res) {
  try {
    const reportId = req.params.id;
    const report = await reportModel.getReportById(reportId, req.session.user);

    if (!report) {
      req.flash('error_msg', 'Laporan tidak ditemukan.');
      return res.redirect('/reports');
    }

    const attachments = await reportModel.getAttachmentsByReportId(reportId);

    let eksekutorUsers = [];

    if (req.session.user.role === 'koordinator') {
      const targetRegionCode =
        report.current_region_code === 'PDG' ? 'BKT' : 'PDG';

      eksekutorUsers = await userModel.getEksekutorUsersByRegionCode(targetRegionCode);
    }

    res.render('reports/show', {
      title: 'Detail Laporan',
      report,
      attachments,
      eksekutorUsers
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat detail laporan.');
    return res.redirect('/reports');
  }
}

async function takeReport(req, res) {
  try {
    const reportId = req.params.id;
    const result = await reportModel.takeReport(reportId, req.session.user);

    req.flash('success_msg', result.message);
    return res.redirect('/reports');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal mengambil laporan.');
    return res.redirect('/reports');
  }
}

async function completeReport(req, res) {
  try {
    const reportId = req.params.id;
    const result = await reportModel.completeReport(
      reportId,
      req.session.user,
      req.body,
      req.file
    );

    req.flash('success_msg', result.message);
    return res.redirect(`/reports/${reportId}`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal menyelesaikan laporan.');
    return res.redirect(`/reports/${req.params.id}`);
  }
}

async function delegateReport(req, res) {
  try {
    const reportId = req.params.id;
    const { target_user_id, delegation_notes } = req.body;

    if (!target_user_id) {
      req.flash('error_msg', 'Pegawai tujuan delegasi wajib dipilih.');
      return res.redirect(`/reports/${reportId}`);
    }

    const result = await reportModel.delegateReport(
      reportId,
      req.session.user,
      target_user_id,
      delegation_notes
    );

    req.flash('success_msg', result.message);
    return res.redirect(`/reports/${reportId}`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal melakukan delegasi.');
    return res.redirect(`/reports/${req.params.id}`);
  }
}

async function cancelAssignment(req, res) {
  try {
    const reportId = req.params.id;
    const { cancel_notes } = req.body;

    const result = await reportModel.cancelAssignment(
      reportId,
      req.session.user,
      cancel_notes
    );

    req.flash('success_msg', result.message);
    return res.redirect(`/reports/${reportId}`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal membatalkan penugasan.');
    return res.redirect(`/reports/${req.params.id}`);
  }
}

module.exports = {
  listReports,
  showReportDetail,
  takeReport,
  completeReport,
  delegateReport,
  cancelAssignment
};