const reportModel = require('../models/reportModel');
const userModel = require('../models/userModel');
const attachmentModel = require('../models/attachmentModel');
const {
  cleanupUploadedFiles,
  getUploadedEvidenceFiles
} = require('../middlewares/uploadMiddleware');
const {
  sendAssignedFeedback,
  sendInProgressFeedback,
  sendCompletedFeedback,
  sendReturnEvidenceFeedback,
  sendEscalationFeedback
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

function normalizeJsonValue(value) {
  return value === undefined ? null : value;
}

function isAjaxRequest(req) {
  const requestedWith = String(req.get('X-Requested-With') || '').trim().toLowerCase();
  const acceptHeader = String(req.get('Accept') || '').trim().toLowerCase();

  return requestedWith === 'xmlhttprequest' || acceptHeader.includes('application/json');
}

function normalizeReportReturnPath(req, fallbackPath) {
  const requestHost = req.get('host');
  const candidates = [
    req.body && typeof req.body.return_to === 'string' ? req.body.return_to : '',
    req.get('Referrer') || '',
    req.get('Referer') || ''
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const url = new URL(candidate, `${req.protocol}://${requestHost}`);
      const isSameHost = url.host === requestHost;
      const safePath = `${url.pathname}${url.search}`;

      if (
        isSameHost &&
        (safePath === '/reports' || safePath.startsWith('/reports/') || safePath.startsWith('/reports?'))
      ) {
        return safePath;
      }
    } catch (error) {
      // Ignore malformed return targets and use the known fallback below.
    }
  }

  return fallbackPath;
}

function sendQuickActionSuccess(req, res, result, redirectPath) {
  const message = result && result.message ? result.message : 'Aksi laporan berhasil diproses.';

  if (isAjaxRequest(req)) {
    return res.json({
      success: true,
      message,
      redirectUrl: redirectPath
    });
  }

  req.flash('success_msg', message);
  return res.redirect(redirectPath);
}

function sendQuickActionError(req, res, error, fallbackMessage, redirectPath) {
  const message = error && error.message ? error.message : fallbackMessage;

  if (isAjaxRequest(req)) {
    return res.status(400).json({
      success: false,
      message
    });
  }

  req.flash('error_msg', message);
  return res.redirect(redirectPath);
}

function buildReportDetailPayload(report) {
  return {
    id: normalizeJsonValue(report.id),
    source_channel: normalizeJsonValue(report.source_channel),
    telegram_sender_id: normalizeJsonValue(report.telegram_sender_id),
    telegram_sender_username: normalizeJsonValue(report.telegram_sender_username),
    telegram_sender_first_name: normalizeJsonValue(report.telegram_sender_first_name),
    telegram_sender_last_name: normalizeJsonValue(report.telegram_sender_last_name),
    fallout_type: normalizeJsonValue(report.fallout_type),
    ticket_id: normalizeJsonValue(report.ticket_id),
    order_id: normalizeJsonValue(report.order_id),
    wo_number: normalizeJsonValue(report.wo_number),
    service_type: normalizeJsonValue(report.service_type),
    segment: normalizeJsonValue(report.segment),
    provider: normalizeJsonValue(report.provider),
    telkom_area: normalizeJsonValue(report.telkom_area),
    branch_name: normalizeJsonValue(report.branch_name),
    cluster_name: normalizeJsonValue(report.cluster_name),
    sto: normalizeJsonValue(report.sto),
    summary: normalizeJsonValue(report.summary),
    service_id: normalizeJsonValue(report.service_id),
    status_internal: normalizeJsonValue(report.status_internal),
    status_wfm: normalizeJsonValue(report.status_wfm),
    status_andalas: normalizeJsonValue(report.status_andalas),
    completion_status: normalizeJsonValue(report.completion_status),
    completion_notes: normalizeJsonValue(report.completion_notes),
    diit_code: normalizeJsonValue(report.diit_code),
    reported_region_code: normalizeJsonValue(report.reported_region_code),
    reported_region_name: normalizeJsonValue(report.reported_region_name),
    current_region_code: normalizeJsonValue(report.current_region_code),
    current_region_name: normalizeJsonValue(report.current_region_name),
    assigned_user_name: normalizeJsonValue(report.assigned_user_name),
    received_at: normalizeJsonValue(report.received_at),
    taken_at: normalizeJsonValue(report.taken_at),
    resolved_at: normalizeJsonValue(report.resolved_at),
    closed_at: normalizeJsonValue(report.closed_at),
    created_at: normalizeJsonValue(report.created_at),
    updated_at: normalizeJsonValue(report.updated_at)
  };
}

function buildAttachmentPayload(file) {
  return {
    id: normalizeJsonValue(file.id),
    source: normalizeJsonValue(file.source),
    file_name: normalizeJsonValue(file.file_name || file.original_name || file.stored_name),
    file_path: normalizeJsonValue(file.file_path),
    mime_type: normalizeJsonValue(file.mime_type),
    file_type: normalizeJsonValue(file.file_type),
    file_size: normalizeJsonValue(file.file_size),
    caption: normalizeJsonValue(file.caption),
    uploaded_by_name: normalizeJsonValue(file.uploaded_by_name),
    created_at: normalizeJsonValue(file.created_at)
  };
}

function buildTelegramLogMediaPayload(item) {
  const media = item && item.media ? item.media : {};

  return {
    log_id: normalizeJsonValue(item.log_id),
    created_at: normalizeJsonValue(item.created_at),
    file_name: normalizeJsonValue(media.file_name || media.original_name || media.stored_name),
    file_path: normalizeJsonValue(media.file_path || media.url),
    mime_type: normalizeJsonValue(media.mime_type || media.mimeType),
    file_type: normalizeJsonValue(media.file_type || media.type),
    file_size: normalizeJsonValue(media.file_size || media.size),
    caption: normalizeJsonValue(media.caption)
  };
}

function buildReportLogPayload(log) {
  return {
    id: normalizeJsonValue(log.id),
    report_id: normalizeJsonValue(log.report_id),
    user_id: normalizeJsonValue(log.user_id),
    user_name: normalizeJsonValue(log.user_name),
    actor_name: normalizeJsonValue(log.actor_name),
    action: normalizeJsonValue(log.action),
    description: normalizeJsonValue(log.description),
    created_at: normalizeJsonValue(log.created_at)
  };
}

function hasAttachmentValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function getAttachmentSource(file) {
  return String(file && file.source ? file.source : '').trim().toLowerCase();
}

function hasTelegramMetadata(file) {
  return Boolean(file) && (
    hasAttachmentValue(file.telegram_file_id) ||
    hasAttachmentValue(file.telegram_file_unique_id)
  );
}

function isCompletionEvidenceAttachment(file) {
  if (!file) {
    return false;
  }

  if (hasTelegramMetadata(file)) {
    return false;
  }

  return hasAttachmentValue(file.uploaded_by_user_id) || hasAttachmentValue(file.file_name);
}

function isTelegramAttachment(file) {
  if (!file) {
    return false;
  }

  if (hasTelegramMetadata(file)) {
    return true;
  }

  if (isCompletionEvidenceAttachment(file)) {
    return false;
  }

  return getAttachmentSource(file) === 'telegram';
}

function splitReportAttachments(attachments) {
  const sourceAttachments = Array.isArray(attachments) ? attachments : [];

  return {
    completionAttachments: sourceAttachments.filter((file) => !isTelegramAttachment(file)),
    telegramAttachments: sourceAttachments.filter(isTelegramAttachment)
  };
}

async function redirectCompleteWithError(req, res, reportId, message) {
  await cleanupUploadedFiles(req);
  req.flash('error_msg', message);
  return res.redirect(`/reports/${reportId}`);
}

async function triggerTelegramFeedback(reportId, currentUser, feedbackType, options = {}) {
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

    if (feedbackType === 'return_evidence') {
      await sendReturnEvidenceFeedback({
        chatId: payload.telegram_chat_id,
        ticketId: payload.ticket_id,
        orderId: payload.order_id || '-',
        notes: options.notes
      });

      await reportModel.logTelegramFeedback(
        reportId,
        'telegram_feedback_return_evidence',
        `Feedback return evidence terkirim ke chat ${payload.telegram_chat_id}.`,
        currentUser.id
      );
    }

    if (feedbackType === 'escalation') {
      await sendEscalationFeedback({
        chatId: payload.telegram_chat_id,
        ticketId: payload.ticket_id,
        orderId: payload.order_id || '-',
        diitCode: options.diitCode || payload.diit_code
      });

      await reportModel.logTelegramFeedback(
        reportId,
        'telegram_feedback_escalation',
        `Feedback escalation DIIT terkirim ke chat ${payload.telegram_chat_id}.`,
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
    const {
      completionAttachments,
      telegramAttachments
    } = splitReportAttachments(attachments);

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
      attachments: completionAttachments,
      completionAttachments,
      telegramAttachments,
      eksekutorUsers
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat detail laporan.');
    return res.redirect('/reports');
  }
}

async function showReportDetailJson(req, res) {
  try {
    const reportId = req.params.id;
    const report = await reportModel.getReportById(reportId, req.session.user);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan atau tidak dapat diakses.'
      });
    }

    const attachments = await reportModel.getAttachmentsByReportId(reportId);
    const telegramAttachments = await attachmentModel.getAttachmentsByReportId(reportId);
    const telegramLogMedia = await reportModel.getTelegramAdditionalMediaByReportId(reportId);
    const reportLogs = await reportModel.getReportLogsByReportId(reportId);

    return res.json({
      success: true,
      fallbackUrl: `/reports/${report.id}`,
      report: buildReportDetailPayload(report),
      attachments: (attachments || [])
        .filter((file) => !isTelegramAttachment(file))
        .map(buildAttachmentPayload),
      telegramMedia: (telegramAttachments || [])
        .filter(isTelegramAttachment)
        .map(buildAttachmentPayload),
      telegramLogMedia: (telegramLogMedia || []).map(buildTelegramLogMediaPayload),
      reportLogs: (reportLogs || []).map(buildReportLogPayload)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat detail laporan.'
    });
  }
}

async function takeReport(req, res) {
  const redirectPath = normalizeReportReturnPath(req, '/reports');

  try {
    const reportId = req.params.id;
    const result = await reportModel.takeReport(reportId, req.session.user);
    await triggerTelegramFeedback(reportId, req.session.user, 'assigned');

    return sendQuickActionSuccess(req, res, result, redirectPath);
  } catch (error) {
    console.error(error);
    return sendQuickActionError(req, res, error, 'Gagal mengambil laporan.', redirectPath);
  }
}

async function markReportInProgress(req, res) {
  const fallbackPath = `/reports/${req.params.id}`;
  const redirectPath = normalizeReportReturnPath(req, fallbackPath);

  try {
    const reportId = req.params.id;
    const result = await reportModel.markReportInProgress(reportId, req.session.user);
    await triggerTelegramFeedback(reportId, req.session.user, 'in_progress');

    return sendQuickActionSuccess(req, res, result, redirectPath);
  } catch (error) {
    console.error(error);
    return sendQuickActionError(req, res, error, 'Gagal menandai laporan sedang dikerjakan.', redirectPath);
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
      return redirectCompleteWithError(req, res, reportId, 'Status akhir wajib dipilih.');
    }

    if (!ALLOWED_FINAL_STATUSES.includes(completionStatus)) {
      return redirectCompleteWithError(req, res, reportId, 'Status akhir tidak valid.');
    }

    req.body.completion_status = completionStatus;

    const completionNotes =
      typeof req.body.completion_notes === 'string'
        ? req.body.completion_notes.trim()
        : '';

    if (completionStatus === 'perlu_tindak_lanjut' && !completionNotes) {
      return redirectCompleteWithError(req, res, reportId, 'Catatan return wajib diisi untuk status perlu tindak lanjut.');
    }

    req.body.completion_notes = completionNotes;

    const diitCode =
      typeof req.body.diit_code === 'string'
        ? req.body.diit_code.trim()
        : '';

    if (completionStatus === 'eskalasi' && !diitCode) {
      return redirectCompleteWithError(req, res, reportId, 'Kode DIIT wajib diisi untuk status eskalasi.');
    }

    if (completionStatus === 'eskalasi' && diitCode.length > 100) {
      return redirectCompleteWithError(req, res, reportId, 'Kode DIIT maksimal 100 karakter.');
    }

    req.body.diit_code = completionStatus === 'eskalasi' ? diitCode : '';

    const result = await reportModel.completeReport(
      reportId,
      req.session.user,
      req.body,
      getUploadedEvidenceFiles(req)
    );

    if (completionStatus === 'perlu_tindak_lanjut') {
      await triggerTelegramFeedback(reportId, req.session.user, 'return_evidence', {
        notes: req.body.completion_notes
      });
    } else if (completionStatus === 'eskalasi') {
      await triggerTelegramFeedback(reportId, req.session.user, 'escalation', {
        diitCode
      });
    } else {
      await triggerTelegramFeedback(reportId, req.session.user, 'completed');
    }

    req.flash('success_msg', result.message);
    return res.redirect(`/reports/${reportId}`);
  } catch (error) {
    console.error(error);
    await cleanupUploadedFiles(req);
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
  showReportDetailJson,
  takeReport,
  markReportInProgress,
  completeReport,
  delegateReport,
  cancelAssignment
};
