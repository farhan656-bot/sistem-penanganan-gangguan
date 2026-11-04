const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractBotCommand,
  handleIncomingMessage
} = require('../../services/telegramBotService');
const {
  formatReporterMention,
  buildAssignedMessage,
  buildInProgressMessage,
  buildCompletedMessage,
  buildReturnEvidenceMessage,
  buildEscalationMessage,
  buildReopenedMessage,
  sendMessageToChat,
  sendAssignedFeedback,
  sendCompletedFeedback
} = require('../../services/telegramFeedbackService');
const telegramReporterModel = require('../../models/telegramReporterModel');
const reportModel = require('../../models/reportModel');
const pendingMediaModel = require('../../models/pendingMediaModel');

test('Unit Test: Telegram Scoped Commands, Bot Username Parsing & Mention/Quote Replies', async (t) => {
  await t.test('1. extractBotCommand mampu mengenali command dengan dan tanpa @bot_username', () => {
    // Tanpa @username
    assert.deepEqual(extractBotCommand('/format'), { command: 'format', args: '' });
    assert.deepEqual(extractBotCommand('/bantuan'), { command: 'bantuan', args: '' });
    assert.deepEqual(extractBotCommand('/status'), { command: 'status', args: '' });
    assert.deepEqual(extractBotCommand('/daftar'), { command: 'daftar', args: '' });
    assert.deepEqual(extractBotCommand('/start 123'), { command: 'start', args: '123' });

    // Dengan @bot_username (format Telegram grup)
    assert.deepEqual(extractBotCommand('/format@telkom_sumbar_ticket_bot'), { command: 'format', args: '' });
    assert.deepEqual(extractBotCommand('/bantuan@telkom_sumbar_ticket_bot'), { command: 'bantuan', args: '' });
    assert.deepEqual(extractBotCommand('/status@telkom_sumbar_ticket_bot'), { command: 'status', args: '' });
    assert.deepEqual(extractBotCommand('/daftar@telkom_sumbar_ticket_bot'), { command: 'daftar', args: '' });

    // Pesan teks biasa bukan command
    assert.equal(extractBotCommand('Halo admin'), null);
    assert.equal(extractBotCommand('TICKET ID: INF12345'), null);
    assert.equal(extractBotCommand(null), null);
    assert.equal(extractBotCommand(''), null);
  });

  await t.test('2. Command grup dengan @bot_username direspons dengan tepat', async () => {
    let sentText = '';
    let sentOptions = null;
    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        sentText = text;
        sentOptions = options;
      }
    };

    // /format@bot di grup -> kirim template format
    await handleIncomingMessage(mockBot, {
      message_id: 101,
      chat: { id: -1001234567, type: 'supergroup' },
      from: { id: 991, username: 'user_telkom' },
      text: '/format@telkom_sumbar_ticket_bot'
    });
    assert.equal(sentText.includes('Kirim laporan incident dengan format berikut'), true);
    assert.deepEqual(sentOptions, { reply_to_message_id: 101 });

    // /bantuan@bot di grup -> menu ringkas khusus grup
    await handleIncomingMessage(mockBot, {
      message_id: 102,
      chat: { id: -1001234567, type: 'group' },
      from: { id: 991, username: 'user_telkom' },
      text: '/bantuan@telkom_sumbar_ticket_bot'
    });
    assert.equal(sentText.includes('Daftar Perintah Grup'), true);
    assert.equal(sentText.includes('/format'), true);
    assert.equal(sentText.includes('Private Chat'), true);
    assert.deepEqual(sentOptions, { reply_to_message_id: 102 });

    // /status@bot di grup -> diarahkan ke private chat
    await handleIncomingMessage(mockBot, {
      message_id: 103,
      chat: { id: -1001234567, type: 'group' },
      from: { id: 991, username: 'user_telkom' },
      text: '/status@telkom_sumbar_ticket_bot'
    });
    assert.equal(sentText.includes('Private Chat langsung'), true);
    assert.deepEqual(sentOptions, { reply_to_message_id: 103 });

    // /daftar@bot di grup -> diarahkan ke private chat demi kerahasiaan NIK
    await handleIncomingMessage(mockBot, {
      message_id: 104,
      chat: { id: -1001234567, type: 'group' },
      from: { id: 991, username: 'user_telkom' },
      text: '/daftar@telkom_sumbar_ticket_bot'
    });
    assert.equal(sentText.includes('Demi kerahasiaan data pribadi (NIK)'), true);
    assert.deepEqual(sentOptions, { reply_to_message_id: 104 });
  });

  await t.test('3. formatReporterMention menyusun tag @username atau nama pelapor', () => {
    // Pelapor dengan username
    assert.equal(formatReporterMention({ reporterUsername: 'farhan_dev', reporterName: 'Farhan Muhammad' }), '@farhan_dev');
    assert.equal(formatReporterMention({ reporterUsername: '@farhan_dev', reporterName: 'Farhan Muhammad' }), '@farhan_dev');

    // Pelapor tanpa username tapi ada nama lengkap
    assert.equal(formatReporterMention({ reporterUsername: null, reporterName: 'Farhan Muhammad' }), 'Farhan Muhammad');
    assert.equal(formatReporterMention({ reporterUsername: '', reporterFirstName: 'Farhan' }), 'Farhan');

    // Kosong
    assert.equal(formatReporterMention({}), '');
    assert.equal(formatReporterMention(null), '');
  });

  await t.test('4. Pesan feedback lifecycle menyertakan mention pelapor', () => {
    // Assigned
    const assigned = buildAssignedMessage('INF111', 'ORD222', 'Budi Santoso', '@farhan_dev');
    assert.equal(assigned.includes('Halo @farhan_dev,'), true);
    assert.equal(assigned.includes('Tiket INF111'), true);
    assert.equal(assigned.includes('ASSIGNED'), true);

    // In Progress
    const inProgress = buildInProgressMessage('INF111', 'ORD222', 'Budi Santoso', '@farhan_dev');
    assert.equal(inProgress.includes('Halo @farhan_dev,'), true);
    assert.equal(inProgress.includes('In Progress'), true);

    // Completed
    const completed = buildCompletedMessage('INF111', 'ORD222', '@farhan_dev');
    assert.equal(completed.includes('Halo @farhan_dev, Pengerjaan Tiket INF111'), true);
    assert.equal(completed.includes('SELESAI'), true);

    // Return Evidence
    const returnEvidence = buildReturnEvidenceMessage('INF111', 'ORD222', 'Bukti foto buram', '@farhan_dev');
    assert.equal(returnEvidence.includes('Halo @farhan_dev,'), true);
    assert.equal(returnEvidence.includes('Bukti foto buram'), true);

    // Escalation
    const escalation = buildEscalationMessage('INF111', 'ORD222', 'DIIT-999', false, '@farhan_dev');
    assert.equal(escalation.includes('Halo @farhan_dev,'), true);
    assert.equal(escalation.includes('DIIT-999'), true);

    // Reopened
    const reopened = buildReopenedMessage('INF111', 'ORD222', 'Budi Santoso', '@farhan_dev');
    assert.equal(reopened.includes('Halo @farhan_dev,'), true);
    assert.equal(reopened.includes('Re-open'), true);
  });

  await t.test('5. sendMessageToChat meneruskan reply_to_message_id dengan fallback aman', async () => {
    const telegramBotService = require('../../services/telegramBotService');
    const origGetBot = telegramBotService.getTelegramBotInstance;

    let callCount = 0;
    let lastOptions = null;

    // Skenario A: quote reply berhasil
    telegramBotService.getTelegramBotInstance = () => ({
      sendMessage: async (chatId, text, options) => {
        callCount++;
        lastOptions = options;
        return { message_id: 555 };
      }
    });

    try {
      await sendMessageToChat('-1001234567890', 'Pesan feedback', { reply_to_message_id: 1010 });
      assert.equal(callCount, 1);
      assert.deepEqual(lastOptions, { reply_to_message_id: 1010 });

      // Skenario B: quote reply gagal (misal pesan asli sudah dihapus di Telegram), fallback tanpa reply_to_message_id
      callCount = 0;
      telegramBotService.getTelegramBotInstance = () => ({
        sendMessage: async (chatId, text, options) => {
          callCount++;
          if (options && options.reply_to_message_id) {
            throw new Error('ETELEGRAM: 400 Bad Request: message to be replied not found');
          }
          lastOptions = options;
          return { message_id: 556 };
        }
      });

      await sendMessageToChat('-1001234567890', 'Pesan feedback fallback', { reply_to_message_id: 9999 });
      assert.equal(callCount, 2); // 1 gagal quote reply, 1 fallback berhasil
    } finally {
      telegramBotService.getTelegramBotInstance = origGetBot;
    }
  });

  await t.test('6. Konfirmasi penerimaan laporan ringkas menyertakan mention pelapor dan reply_to_message_id', async () => {
    const sentMessages = [];
    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        sentMessages.push({ chatId, text, options });
      }
    };

    const origFindByTicketId = reportModel.findByTicketId;
    const origCreateTelegramReport = reportModel.createTelegramReport;
    const origFindReporter = telegramReporterModel.findByTelegramUserId;
    const origGetPendingMedia = pendingMediaModel.getLatestPendingMediaByChatId;

    pendingMediaModel.getLatestPendingMediaByChatId = async () => null;

    let isCreated = false;
    reportModel.findByTicketId = async (tId) => {
      if (isCreated && tId === 'INF010036287') {
        return {
          ticket_id: 'INF010036287',
          telegram_sender_id: 4321,
          status_internal: 'tersedia'
        };
      }
      return null;
    };

    telegramReporterModel.findByTelegramUserId = async () => ({
      id: 2,
      full_name: 'Farhan Muhammad',
      company: 'TELKOM',
      unit: 'DAMAN',
      region_code: 'PDG',
      status: 'approved'
    });
    reportModel.createTelegramReport = async (data) => {
      isCreated = true;
      return {
        ticketId: data.ticket_id,
        orderId: data.order_id
      };
    };

    try {
      const conciseGroupMessage = {
        message_id: 701,
        chat: { id: -1009876543, type: 'group' },
        from: {
          id: 4321,
          username: 'farhan_dev',
          first_name: 'Farhan'
        },
        caption: 'M0ph261029120938540b44fe0\nINF010036287|\nUIM-env:Server-OrderLevelError-1070\n111404100949'
      };

      await handleIncomingMessage(mockBot, conciseGroupMessage);

      assert.ok(sentMessages.length >= 1);
      const intakeMsg = sentMessages[0];
      assert.equal(intakeMsg.text.includes('Halo @farhan_dev'), true);
      assert.equal(intakeMsg.text.includes('Tiket INF010036287 | Order ID: M0ph261029120938540b44fe0 telah diterima'), true);
      assert.equal(intakeMsg.text.includes('dari pelapor Farhan Muhammad (TELKOM - DAMAN PDG)'), true);
      assert.deepEqual(intakeMsg.options, { reply_to_message_id: 701 });
    } finally {
      reportModel.findByTicketId = origFindByTicketId;
      reportModel.createTelegramReport = origCreateTelegramReport;
      telegramReporterModel.findByTelegramUserId = origFindReporter;
      pendingMediaModel.getLatestPendingMediaByChatId = origGetPendingMedia;
    }
  });

  await t.test('7. initTelegramBotService mendaftarkan scoped commands (private vs group)', () => {
    // Verifikasi skema perintah privat vs grup
    const privateCommands = [
      { command: 'daftar', description: 'Registrasi akun pelapor resmi' },
      { command: 'status', description: 'Cek status persetujuan akun pelapor' },
      { command: 'format', description: 'Contoh format penulisan laporan gangguan' },
      { command: 'bantuan', description: 'Panduan bantuan dan menu bot' }
    ];

    const groupCommands = [
      { command: 'format', description: 'Contoh format penulisan laporan gangguan' },
      { command: 'bantuan', description: 'Panduan bantuan dan menu bot' }
    ];

    assert.equal(groupCommands.some((c) => c.command === 'daftar'), false, 'Menu grup TIDAK boleh memuat /daftar');
    assert.equal(groupCommands.some((c) => c.command === 'status'), false, 'Menu grup TIDAK boleh memuat /status');
    assert.equal(privateCommands.some((c) => c.command === 'daftar'), true, 'Menu privat WAJIB memuat /daftar');
    assert.equal(privateCommands.some((c) => c.command === 'status'), true, 'Menu privat WAJIB memuat /status');
  });
});
