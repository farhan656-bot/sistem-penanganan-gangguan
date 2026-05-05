const reportModel = require('../models/reportModel');
const userModel = require('../models/userModel');
const attachmentModel = require('../models/attachmentModel');
const {
  sendAssignedFeedback,
  sendInProgressFeedback,
  sendCompletedFeedback
} = require('../services/telegramFeedbackService');

const ALLOWED_FINAL_STATUSES = ['selesai', 'perlu_tindak_lanjut', 'eskalasi'];
const OPPOSITE_REGION_MAP = {
  PDG: 'BKT',
  BKT: 'PDG'
};

function buildManualReportFormData(body = {}) {
  return {
    fallout_type: body.fallout_type || '',
    ticket_id: body.ticket_id || '',
    order_id: body.order_id || '',
    wo_number: body.wo_number || '',
    service_type: body.service_type || '',
    segment: body.segment || '',
    provider: body.provider || '',
    telkom_area: body.telkom_area || '',
    branch_name: body.branch_name || '',
    cluster_name: body.cluster_name || '',
    sto: body.sto || '',
    summary: body.summary || '',
    service_id: body.service_id || '',
    status_wfm: body.status_wfm || '',
    status_andalas: body.status_andalas || '',
    reported_region_id: body.reported_region_id || ''
  };
}

async function triggerTelegramFeedback(reportId, currentUser, feedbackType) {
  const payload = await reportModel.getTelegramFeedbackPayloadByReportId(reportId);

  if (!payload) {
    return;
  }

  if (!payload.telegram_chat_id) {
    await reportModel.logTelegramFeedback(
      reportId,
      'telegram_feedback_failed',
      `Feedback ${feedbackType} tidak dikirim karena telegram_chat_id kosong.`,
      currentUser.id
    );
    return;
  }

  try {
    if (feedbackType === 'assigned') {
      await sendAssignedFeedback({
        chatId: payload.telegram_chat_id,
        ticketId: payload.ticket_id,
        orderId: payload.order_id || '-',
        executorName: currentUser.full_name
      });

      await reportModel.logTelegramFeedback(
        reportId,
        'telegram_feedback_assigned',
        `Feedback assigned terkirim ke chat ${payload.telegram_chat_id}.`,
        currentUser.id
      );
      return;
    }

    if (feedbackType === 'in_progress') {
      await sendInProgressFeedback({
        chatId: payload.telegram_chat_id,
        ticketId: payload.ticket_id,
        orderId: payload.order_id || '-',
        executorName: currentUser.full_name
      });

      await reportModel.logTelegramFeedback(
        reportId,
        'telegram_feedback_in_progress',
        `Feedback in-progress terkirim ke chat ${payload.telegram_chat_id}.`,
        currentUser.id
      );
      return;
    }

    if (feedbackType === 'completed') {
      await sendCompletedFeedback({
        chatId: payload.telegram_chat_id,
        ticketId: payload.ticket_id,
        orderId: payload.order_id || '-'
      });

      await reportModel.logTelegramFeedback(
        reportId,
        'telegram_feedback_completed',
        `Feedback completed terkirim ke chat ${payload.telegram_chat_id}.`,
        currentUser.id
      );
    }
  } catch (error) {
    await reportModel.logTelegramFeedback(
      reportId,
      'telegram_feedback_failed',
      `Gagal kirim feedback ${feedbackType}: ${error.message || error}`,
      currentUser.id
    );
  }
}

async function listReports(req, res) {
  try {
    const filters = {
      search: req.query.search || '',
      status: req.query.status || '',
      region: req.query.region || ''
    };

    const reports = await reportModel.getReports(filters, req.session.user);

    const viewName = req.session.user.role === 'eksekutor'
      ? 'eksekutor/reports/index'
      : req.session.user.role === 'koordinator'
        ? 'koordinator/reports/index'
        : 'reports/index';

    res.render(viewName, {
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

async function showCreateReportForm(req, res) {
  try {
    const regions = await reportModel.getRegions();

    const viewName = req.session.user.role === 'super_admin'
      ? 'super_admin/reports-create'
      : req.session.user.role === 'koordinator'
        ? 'koordinator/reports/create'
        : 'reports/create';

    return res.render(viewName, {
      title: 'Tambah Laporan Manual',
      regions,
      formData: buildManualReportFormData()
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat form input laporan manual.');

    if (req.session.user.role === 'super_admin') {
      return res.redirect('/dashboard/super-admin');
    }

    return res.redirect('/reports');
  }
}

async function createManualReport(req, res) {
  try {
    const ticketId = typeof req.body.ticket_id === 'string' ? req.body.ticket_id.trim() : '';
    const summary = typeof req.body.summary === 'string' ? req.body.summary.trim() : '';
    const reportedRegionId = Number(req.body.reported_region_id);

    if (!ticketId) {
      req.flash('error_msg', 'Ticket ID wajib diisi.');
      return res.redirect('/reports/create');
    }

    if (!summary) {
      req.flash('error_msg', 'Ringkasan gangguan wajib diisi.');
      return res.redirect('/reports/create');
    }

    if (!reportedRegionId) {
      req.flash('error_msg', 'Wilayah awal wajib dipilih.');
      return res.redirect('/reports/create');
    }

    const result = await reportModel.createManualReport(req.body, req.session.user);
    req.flash('success_msg', result.message);
    return res.redirect('/reports');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal membuat laporan manual.');
    return res.redirect('/reports/create');
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
    const telegramAttachments = await attachmentModel.getAttachmentsByReportId(reportId);

    let eksekutorUsers = [];

    if (req.session.user.role === 'koordinator') {
      const targetRegionCode = OPPOSITE_REGION_MAP[report.current_region_code];

      if (targetRegionCode) {
        eksekutorUsers = await userModel.getEksekutorUsersByRegionCode(targetRegionCode);
      }
    }

    const viewName = req.session.user.role === 'koordinator'
      ? 'koordinator/reports/show'
      : 'reports/show';

    res.render(viewName, {
      title: 'Detail Laporan',
      report,
      attachments,
      telegramAttachments,
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
    await triggerTelegramFeedback(reportId, req.session.user, 'assigned');

    req.flash('success_msg', result.message);
    return res.redirect('/reports');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal mengambil laporan.');
    return res.redirect('/reports');
  }
}

async function markReportInProgress(req, res) {
  try {
    const reportId = req.params.id;
    const result = await reportModel.markReportInProgress(reportId, req.session.user);
    await triggerTelegramFeedback(reportId, req.session.user, 'in_progress');

    req.flash('success_msg', result.message);
    return res.redirect(`/reports/${reportId}`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal menandai laporan sedang dikerjakan.');
    return res.redirect(`/reports/${req.params.id}`);
  }
}

async function completeReport(req, res) {
  try {
    const reportId = req.params.id;
    const completionStatus =
      typeof req.body.completion_status === 'string'
        ? req.body.completion_status.trim().toLowerCase()
        : '';

    if (!completionStatus) {
      req.flash('error_msg', 'Status akhir wajib dipilih.');
      return res.redirect(`/reports/${reportId}`);
    }

    if (!ALLOWED_FINAL_STATUSES.includes(completionStatus)) {
      req.flash('error_msg', 'Status akhir tidak valid.');
      return res.redirect(`/reports/${reportId}`);
    }

    req.body.completion_status = completionStatus;

    const result = await reportModel.completeReport(
      reportId,
      req.session.user,
      req.body,
      req.file
    );
    await triggerTelegramFeedback(reportId, req.session.user, 'completed');

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
    const { target_user_id } = req.body;
    const delegation_notes =
      typeof req.body.delegation_notes === 'string'
        ? req.body.delegation_notes.trim()
        : '';

    if (!target_user_id) {
      req.flash('error_msg', 'Pegawai tujuan delegasi wajib dipilih.');
      return res.redirect(`/reports/${reportId}`);
    }

    if (!delegation_notes) {
      req.flash('error_msg', 'Alasan delegasi wajib diisi.');
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
    const cancel_notes =
      typeof req.body.cancel_notes === 'string'
        ? req.body.cancel_notes.trim()
        : '';

    if (!cancel_notes) {
      req.flash('error_msg', 'Alasan pembatalan wajib diisi.');
      return res.redirect(`/reports/${reportId}`);
    }

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
  showCreateReportForm,
  createManualReport,
  listReports,
  showReportDetail,
  takeReport,
  markReportInProgress,
  completeReport,
  delegateReport,
  cancelAssignment
};