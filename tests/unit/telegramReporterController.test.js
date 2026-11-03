const test = require('node:test');
const assert = require('node:assert/strict');
const reporterController = require('../../controllers/telegramReporterController');
const telegramReporterModel = require('../../models/telegramReporterModel');
const telegramBotService = require('../../services/telegramBotService');

test('Unit Test: controllers/telegramReporterController.js', async (t) => {
  await t.test('1. index() harus merender super_admin/reporters/index dengan filter dan data', async () => {
    const origGetAll = telegramReporterModel.getAllReporters;
    const origGetCounts = telegramReporterModel.getStatusCounts;
    const origCount = telegramReporterModel.countReporters;

    telegramReporterModel.getAllReporters = async (filters) => {
      assert.equal(filters.status, 'pending');
      return [{ id: 1, full_name: 'Farhan', nik: '123456', agency: 'TELKOM', status: 'pending' }];
    };

    telegramReporterModel.countReporters = async () => 1;

    telegramReporterModel.getStatusCounts = async () => ({
      total: 1,
      pending: 1,
      approved: 0,
      rejected: 0
    });

    let renderedView = null;
    let renderedData = null;

    const req = {
      query: { status: 'pending' }
    };
    const res = {
      render: (view, data) => {
        renderedView = view;
        renderedData = data;
      }
    };

    try {
      await reporterController.index(req, res);
      assert.equal(renderedView, 'super_admin/reporters/index');
      assert.equal(renderedData.currentStatus, 'pending');
      assert.equal(renderedData.reporters.length, 1);
      assert.equal(renderedData.counts.pending, 1);
      assert.ok(renderedData.pagination);
      assert.equal(renderedData.pagination.totalItems, 1);
      assert.equal(renderedData.pagination.perPage, 10);
    } finally {
      telegramReporterModel.getAllReporters = origGetAll;
      telegramReporterModel.getStatusCounts = origGetCounts;
      telegramReporterModel.countReporters = origCount;
    }
  });

  await t.test('2. approve() harus memanggil model approveReporter, mengirim notifikasi, dan redirect', async () => {
    const origFindById = telegramReporterModel.findById;
    const origApprove = telegramReporterModel.approveReporter;
    const origNotify = telegramBotService.notifyReporterApproval;

    let approvedId = null;
    let notificationSent = false;
    let flashType = null;
    let flashMsg = null;
    let redirectedPath = null;

    telegramReporterModel.findById = async (id) => ({
      id,
      full_name: 'Farhan Muhammad',
      nik: '123456',
      agency: 'TELKOM',
      telegram_chat_id: '998877'
    });

    telegramReporterModel.approveReporter = async (id, adminId) => {
      approvedId = id;
      return true;
    };

    telegramBotService.notifyReporterApproval = async () => {
      notificationSent = true;
      return true;
    };

    const req = {
      params: { id: '5' },
      session: { user: { id: 10 } },
      flash: (type, msg) => {
        flashType = type;
        flashMsg = msg;
      }
    };
    const res = {
      redirect: (path) => {
        redirectedPath = path;
      }
    };

    try {
      await reporterController.approve(req, res);
      assert.equal(approvedId, '5');
      assert.equal(notificationSent, true);
      assert.equal(flashType, 'success_msg');
      assert.equal(redirectedPath, '/super-admin/reporters');
    } finally {
      telegramReporterModel.findById = origFindById;
      telegramReporterModel.approveReporter = origApprove;
      telegramBotService.notifyReporterApproval = origNotify;
    }
  });

  await t.test('3. reject() harus memanggil model rejectReporter dengan alasan, mengirim notifikasi, dan redirect', async () => {
    const origFindById = telegramReporterModel.findById;
    const origReject = telegramReporterModel.rejectReporter;
    const origNotify = telegramBotService.notifyReporterRejection;

    let rejectedId = null;
    let rejectedReason = null;
    let notificationSent = false;
    let flashType = null;
    let redirectedPath = null;

    telegramReporterModel.findById = async (id) => ({
      id,
      full_name: 'Budi Santoso',
      nik: '654321',
      agency: 'HD',
      telegram_chat_id: '112233'
    });

    telegramReporterModel.rejectReporter = async (id, adminId, reason) => {
      rejectedId = id;
      rejectedReason = reason;
      return true;
    };

    telegramBotService.notifyReporterRejection = async (rep, reason) => {
      notificationSent = true;
      return true;
    };

    const req = {
      params: { id: '7' },
      body: { rejection_reason: 'NIK tidak valid' },
      session: { user: { id: 10 } },
      flash: (type, msg) => {
        flashType = type;
      }
    };
    const res = {
      redirect: (path) => {
        redirectedPath = path;
      }
    };

    try {
      await reporterController.reject(req, res);
      assert.equal(rejectedId, '7');
      assert.equal(rejectedReason, 'NIK tidak valid');
      assert.equal(notificationSent, true);
      assert.equal(flashType, 'warning_msg');
      assert.equal(redirectedPath, '/super-admin/reporters');
    } finally {
      telegramReporterModel.findById = origFindById;
      telegramReporterModel.rejectReporter = origReject;
      telegramBotService.notifyReporterRejection = origNotify;
    }
  });
});

