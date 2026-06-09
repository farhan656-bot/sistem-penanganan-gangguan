const manualReportModel = require('../models/manualReportModel');

const MANUAL_REPORT_FIELDS = [
  'details',
  'osm_order_id',
  'sto',
  'sc',
  'order_ncx_id',
  'ncli',
  'customer_name',
  'alpro_before',
  'alpro_name',
  'ticket_incident',
  'incident',
  'witel',
  'k_kontak',
  'user_id_text',
  'transaction_type',
  'fallout_type',
  'activity',
  'work_type',
  'ticket_resolved',
  'ticket_resolved_2',
  'se_status'
];

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getTodayDateInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function isValidDateInput(value) {
  const text = normalizeText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }

  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function buildFormData(source = {}) {
  const formData = {
    report_date: normalizeText(source.report_date) || getTodayDateInputValue()
  };

  MANUAL_REPORT_FIELDS.forEach((field) => {
    formData[field] = normalizeText(source[field]);
  });

  return formData;
}

function buildFilters(query = {}) {
  return {
    search: normalizeText(query.search),
    date_from: normalizeText(query.date_from),
    date_to: normalizeText(query.date_to),
    sto: normalizeText(query.sto),
    activity: normalizeText(query.activity),
    work_type: normalizeText(query.work_type),
    se_status: normalizeText(query.se_status)
  };
}

function buildPayload(formData, currentUser) {
  return {
    ...formData,
    region_id: currentUser.region_id || null,
    created_by: currentUser.id,
    updated_by: currentUser.id
  };
}

function renderCreateForm(res, formData, errorMessages = []) {
  return res.render('manual-reports/create', {
    title: 'Tambah Laporan Manual',
    formData,
    error_msg: errorMessages
  });
}

async function index(req, res) {
  try {
    const filters = buildFilters(req.query);
    const manualReports = await manualReportModel.getManualReports(filters, req.session.user);

    return res.render('manual-reports/index', {
      title: 'Laporan Manual',
      manualReports,
      filters
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat daftar laporan manual.');
    return res.redirect('/');
  }
}

function create(req, res) {
  return renderCreateForm(res, buildFormData());
}

async function store(req, res) {
  try {
    const formData = buildFormData(req.body);
    const errors = [];

    if (!isValidDateInput(formData.report_date)) {
      errors.push('Tanggal laporan wajib valid.');
    }

    if (!formData.details) {
      errors.push('Details wajib diisi.');
    }

    if (errors.length > 0) {
      return renderCreateForm(res, formData, errors);
    }

    const reportId = await manualReportModel.createManualReport(
      buildPayload(formData, req.session.user)
    );

    req.flash('success_msg', 'Laporan manual non-ticketing berhasil disimpan.');
    return res.redirect(`/manual-reports/${reportId}`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', error.message || 'Gagal menyimpan laporan manual.');
    return res.redirect('/manual-reports/create');
  }
}

async function show(req, res) {
  try {
    const manualReport = await manualReportModel.getManualReportById(
      req.params.id,
      req.session.user
    );

    if (!manualReport) {
      req.flash('error_msg', 'Laporan manual tidak ditemukan atau tidak dapat diakses.');
      return res.redirect('/manual-reports');
    }

    return res.render('manual-reports/show', {
      title: 'Detail Laporan Manual',
      manualReport
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Gagal memuat detail laporan manual.');
    return res.redirect('/manual-reports');
  }
}

module.exports = {
  index,
  create,
  store,
  show
};
