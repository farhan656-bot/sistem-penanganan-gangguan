const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const axios = require('axios');
const reportModel = require('../../models/reportModel');
const telegramReporterModel = require('../../models/telegramReporterModel');
const attachmentModel = require('../../models/attachmentModel');
const { handleIncomingMessage } = require('../../services/telegramBotService');

describe('Unit Test: Telegram Bot Concise Report Intake & New Registration', () => {
  let createdReportTicketIds = [];
  let createdReporterUserIds = [];
  let origAxiosGet;
  let origWriteFile;

  beforeEach(() => {
    origAxiosGet = axios.get;
    origWriteFile = fs.promises.writeFile;
    axios.get = async () => ({ data: Buffer.from('fake image content') });
    fs.promises.writeFile = async () => {};
  });

  afterEach(async () => {
    axios.get = origAxiosGet;
    fs.promises.writeFile = origWriteFile;

    const pool = require('../../config/db');
    for (const tid of createdReportTicketIds) {
      await pool.query('DELETE FROM report_attachments WHERE ticket_id = ?', [tid]);
      await pool.query('DELETE FROM report_logs WHERE ticket_id = ?', [tid]);
      await pool.query('DELETE FROM reports WHERE ticket_id = ?', [tid]);
    }
    createdReportTicketIds = [];

    for (const uid of createdReporterUserIds) {
      await pool.query('DELETE FROM telegram_reporters WHERE telegram_user_id = ?', [uid]);
    }
    createdReporterUserIds = [];
  });

  // Mock bot object
  function createMockBot() {
    const sentMessages = [];
    return {
      sentMessages,
      sendMessage: async (chatId, text, options) => {
        sentMessages.push({ chatId, text, options });
        return { message_id: 99999, chat: { id: chatId }, text };
      },
      sendChatAction: async () => true,
      getFileLink: async () => 'https://api.telegram.org/file/botmock/photos/mock.jpg',
      getFile: async () => ({
        file_id: 'test_file_id',
        file_path: 'photos/file_0.jpg'
      })
    };
  }

  test('1. Pendaftaran pelapor format baru via bot (Private Chat)', async () => {
    const mockBot = createMockBot();
    const testUserId = '999888111';
    createdReporterUserIds.push(testUserId);

    const message = {
      message_id: 101,
      chat: { id: testUserId, type: 'private' },
      from: { id: testUserId, username: 'tester_bot', first_name: 'Tester' },
      text: `DAFTAR\nNAMA: Budi Prakoso\nNIK: 887766\nPERUSAHAAN: TELKOM AKSES\nUNIT: DAMAN\nASAL: BKT`
    };

    await handleIncomingMessage(mockBot, message);

    assert.equal(mockBot.sentMessages.length, 1);
    assert.match(mockBot.sentMessages[0].text, /Pendaftaran Berhasil Dikirim/);
    assert.match(mockBot.sentMessages[0].text, /TELKOM AKSES/);
    assert.match(mockBot.sentMessages[0].text, /DAMAN/);
    assert.match(mockBot.sentMessages[0].text, /BKT/);

    const reporter = await telegramReporterModel.findByTelegramUserId(testUserId);
    assert.ok(reporter);
    assert.equal(reporter.full_name, 'Budi Prakoso');
    assert.equal(reporter.nik, '887766');
    assert.equal(reporter.company, 'TELKOM AKSES');
    assert.equal(reporter.unit, 'DAMAN');
    assert.equal(reporter.region_id, 2);
  });

  test('2. Laporan baru format ringkas (Foto + Caption) dari pelapor yang disetujui (Approved)', async () => {
    const mockBot = createMockBot();
    const testUserId = '777666555';
    createdReporterUserIds.push(testUserId);

    // Daftarkan dan setujui pelapor dengan region Bukittinggi (BKT)
    await telegramReporterModel.createOrUpdateRegistration({
      telegram_user_id: testUserId,
      telegram_username: 'pelapor_bkt',
      telegram_chat_id: testUserId,
      full_name: 'Siti Rahma',
      nik: '334455',
      company: 'TELKOM',
      unit: 'HD',
      region_id: 2,
      agency: 'TELKOM'
    });
    const reporterRow = await telegramReporterModel.findByTelegramUserId(testUserId);
    await telegramReporterModel.approveReporter(reporterRow.id, 1);

    const testTicketId = 'INF' + Math.floor(10000000 + Math.random() * 90000000);
    createdReportTicketIds.push(testTicketId);

    const message = {
      message_id: 202,
      chat: { id: '-1009999999', type: 'supergroup' },
      from: { id: testUserId, username: 'pelapor_bkt', first_name: 'Siti' },
      photo: [
        { file_id: 'ph1', file_size: 50000, width: 800, height: 600 }
      ],
      caption: `Mohon bantuannya kakak abang\nPDAk42604010118299835ce7c0\n${testTicketId}|UIM-env:Server-OrderLevelError-1035: Service 3-4253CUG1_111409110913_INTERNET not found for action Modify\nTerimakasih kakak abang`
    };

    await handleIncomingMessage(mockBot, message);

    assert.equal(mockBot.sentMessages.length, 1);
    assert.match(mockBot.sentMessages[0].text, new RegExp(testTicketId));
    assert.match(mockBot.sentMessages[0].text, /PDAk42604010118299835ce7c0/);
    assert.match(mockBot.sentMessages[0].text, /Siti Rahma/);
    assert.match(mockBot.sentMessages[0].text, /BKT/);

    // Verifikasi data laporan di database
    const pool = require('../../config/db');
    const [rows] = await pool.query('SELECT * FROM reports WHERE ticket_id = ?', [testTicketId]);
    const created = rows[0];
    assert.ok(created);
    assert.equal(created.ticket_id, testTicketId);
    assert.equal(created.order_id, 'PDAk42604010118299835ce7c0');
    assert.equal(created.reported_region_id, 2); // Bukittinggi sesuai reporter
    assert.match(created.summary, /Service 3-4253CUG1/);
    assert.equal(created.service_id, '111409110913_INTERNET');
    assert.equal(created.status_internal, 'tersedia');

    // Verifikasi lampiran bukti foto tersimpan
    const attachments = await attachmentModel.getAttachmentsByTicketId(testTicketId);
    assert.ok(attachments.length > 0);
    assert.equal(attachments[0].type_attachment_code, 'bukti_pelapor');
    assert.equal(attachments[0].source, 'telegram');
  });

  test('3. Laporan format ringkas ditolak jika pengirim belum terdaftar / belum disetujui', async () => {
    const mockBot = createMockBot();
    const unapprovedUserId = '1122334455';
    const testTicketId = 'INF' + Math.floor(10000000 + Math.random() * 90000000);

    const message = {
      message_id: 303,
      chat: { id: '-1009999999', type: 'supergroup' },
      from: { id: unapprovedUserId, username: 'unknown_user', first_name: 'Unknown' },
      photo: [
        { file_id: 'ph1', file_size: 50000, width: 800, height: 600 }
      ],
      caption: `MOph261029120938540b44fe0\n${testTicketId}|\nUIM-env:Server-OrderLevelError-1070 : Unable to find service trail\n\n111404100949 Andriany maentrofa\n\nMoban kk bg terimakasih`
    };

    await handleIncomingMessage(mockBot, message);

    assert.equal(mockBot.sentMessages.length, 1);
    assert.match(mockBot.sentMessages[0].text, /Laporan Tidak Dapat Diproses/);
    assert.match(mockBot.sentMessages[0].text, /belum terdaftar atau belum disetujui/);

    const report = await reportModel.findByTicketId(testTicketId);
    assert.equal(report, null);
  });
});

