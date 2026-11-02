const telegramReporterModel = require('../models/telegramReporterModel');
const telegramBotService = require('../services/telegramBotService');

async function index(req, res) {
  try {
    const { status, agency, search } = req.query;
    const filters = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filters.status = status;
    }
    if (agency && ['TELKOM', 'HD', 'TELKOMSEL'].includes(agency.toUpperCase())) {
      filters.agency = agency.toUpperCase();
    }
    if (search && String(search).trim()) {
      filters.search = String(search).trim();
    }

    const [reporters, counts] = await Promise.all([
      telegramReporterModel.getAllReporters(filters),
      telegramReporterModel.getStatusCounts()
    ]);

    res.render('super_admin/reporters/index', {
      title: 'Pendaftar Bot Telegram',
      reporters,
      counts,
      currentStatus: filters.status || 'all',
      currentAgency: filters.agency || 'all',
      searchQuery: filters.search || '',
      activePath: '/super-admin/reporters'
    });
  } catch (error) {
    console.error('Error listing telegram reporters:', error);
    req.flash('error_msg', 'Gagal memuat data pendaftar bot Telegram.');
    res.redirect('/dashboard/super-admin');
  }
}

async function approve(req, res) {
  try {
    const id = req.params.id;
    const reporter = await telegramReporterModel.findById(id);

    if (!reporter) {
      req.flash('error_msg', 'Data pendaftar tidak ditemukan.');
      return res.redirect('/super-admin/reporters');
    }

    const success = await telegramReporterModel.approveReporter(id, req.session.user.id);
    if (success) {
      await telegramBotService.notifyReporterApproval(reporter);
      req.flash('success_msg', `Pendaftaran pelapor ${reporter.full_name} (${reporter.nik} - ${reporter.agency}) berhasil disetujui.`);
    } else {
      req.flash('error_msg', 'Gagal menyetujui pendaftaran pelapor.');
    }

    res.redirect('/super-admin/reporters');
  } catch (error) {
    console.error('Error approving telegram reporter:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat menyetujui pendaftar.');
    res.redirect('/super-admin/reporters');
  }
}

async function reject(req, res) {
  try {
    const id = req.params.id;
    const { rejection_reason } = req.body;
    const reporter = await telegramReporterModel.findById(id);

    if (!reporter) {
      req.flash('error_msg', 'Data pendaftar tidak ditemukan.');
      return res.redirect('/super-admin/reporters');
    }

    const reason = rejection_reason && String(rejection_reason).trim()
      ? String(rejection_reason).trim()
      : 'Data pendaftaran tidak memenuhi kriteria verifikasi unit.';

    const success = await telegramReporterModel.rejectReporter(id, req.session.user.id, reason);
    if (success) {
      await telegramBotService.notifyReporterRejection(reporter, reason);
      req.flash('warning_msg', `Pendaftaran pelapor ${reporter.full_name} telah ditolak.`);
    } else {
      req.flash('error_msg', 'Gagal menolak pendaftaran pelapor.');
    }

    res.redirect('/super-admin/reporters');
  } catch (error) {
    console.error('Error rejecting telegram reporter:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat menolak pendaftar.');
    res.redirect('/super-admin/reporters');
  }
}

module.exports = {
  index,
  approve,
  reject
};
