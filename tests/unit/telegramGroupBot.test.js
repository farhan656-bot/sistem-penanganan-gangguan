const test = require('node:test');
const assert = require('node:assert/strict');
const reportModel = require('../../models/reportModel');
const telegramReporterModel = require('../../models/telegramReporterModel');
const {
  isPrivateChat,
  isGroupChat,
  isSupportedChat,
  sendBotMessage,
  handleIncomingMessage
} = require('../../services/telegramBotService');

test('Unit Test: Telegram Group Bot Support & Reporter Registration Gatekeeper', async (t) => {
  await t.test('1. Validasi tipe obrolan (chat.type)', () => {
    assert.equal(isPrivateChat({ chat: { type: 'private' } }), true);
    assert.equal(isPrivateChat({ chat: { type: 'group' } }), false);
    assert.equal(isPrivateChat({ chat: { type: 'supergroup' } }), false);

    assert.equal(isGroupChat({ chat: { type: 'group' } }), true);
    assert.equal(isGroupChat({ chat: { type: 'supergroup' } }), true);
    assert.equal(isGroupChat({ chat: { type: 'private' } }), false);
    assert.equal(isGroupChat({ chat: { type: 'channel' } }), false);

    assert.equal(isSupportedChat({ chat: { type: 'private' } }), true);
    assert.equal(isSupportedChat({ chat: { type: 'group' } }), true);
    assert.equal(isSupportedChat({ chat: { type: 'supergroup' } }), true);
    assert.equal(isSupportedChat({ chat: { type: 'channel' } }), false);
  });

  await t.test('2. sendBotMessage menyertakan reply_to_message_id untuk pesan grup', async () => {
    let capturedChatId = null;
    let capturedText = null;
    let capturedOptions = null;

    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        capturedChatId = chatId;
        capturedText = text;
        capturedOptions = options;
        return { message_id: 999 };
      }
    };

    // Kasus pesan grup
    const groupMessage = {
      message_id: 1234,
      chat: { id: -1001234567890, type: 'group' }
    };
    await sendBotMessage(mockBot, -1001234567890, 'Halo grup', groupMessage);
    assert.equal(capturedChatId, -1001234567890);
    assert.equal(capturedText, 'Halo grup');
    assert.deepEqual(capturedOptions, { reply_to_message_id: 1234 });

    // Kasus pesan private chat (tanpa reply_to_message_id)
    const privateMessage = {
      message_id: 5678,
      chat: { id: 888999, type: 'private' }
    };
    await sendBotMessage(mockBot, 888999, 'Halo private', privateMessage);
    assert.equal(capturedChatId, 888999);
    assert.equal(capturedText, 'Halo private');
    assert.deepEqual(capturedOptions, {});
  });

  await t.test('3. Obrolan santai di grup (tanpa format tiket) harus diabaikan secara silent (Anti-Spam)', async () => {
    let called = false;
    const mockBot = {
      sendMessage: async () => {
        called = true;
      }
    };

    const casualGroupMessage = {
      message_id: 555,
      chat: { id: -1009999999, type: 'group' },
      from: { id: 111, first_name: 'Budi' },
      text: 'moban som tom nyo cin bro'
    };

    await handleIncomingMessage(mockBot, casualGroupMessage);
    assert.equal(called, false, 'Bot tidak boleh membalas percakapan santai di grup');
  });

  await t.test('4. Perintah /help atau /format di grup harus membalas template laporan dengan reply', async () => {
    let sentText = '';
    let sentOptions = null;
    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        sentText = text;
        sentOptions = options;
      }
    };

    const helpMessage = {
      message_id: 666,
      chat: { id: -1009999999, type: 'supergroup' },
      from: { id: 111, first_name: 'Budi' },
      text: '/format'
    };

    await handleIncomingMessage(mockBot, helpMessage);
    assert.equal(sentText.includes('Bot Pelaporan'), true);
    assert.equal(sentText.includes('TICKET ID:'), true);
    assert.deepEqual(sentOptions, { reply_to_message_id: 666 });
  });

  await t.test('5. Pesan laporan cacat dari pelapor approved di grup harus diberi peringatan spesifik', async () => {
    let sentText = '';
    let sentOptions = null;
    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        sentText = text;
        sentOptions = options;
      }
    };

    const origFindByTicketId = reportModel.findByTicketId;
    const origFindReporter = telegramReporterModel.findByTelegramUserId;
    reportModel.findByTicketId = async () => null;
    telegramReporterModel.findByTelegramUserId = async () => ({
      id: 1,
      full_name: 'Budi',
      agency: 'TELKOM',
      status: 'approved'
    });

    try {
      const brokenReportMessage = {
        message_id: 777,
        chat: { id: -1009999999, type: 'group' },
        from: { id: 111, first_name: 'Budi' },
        text: 'FALLOUT TYPE: DAMAN\nTICKET ID: INF12345678\nSUMMARY: internet mati'
      };

      await handleIncomingMessage(mockBot, brokenReportMessage);
      assert.equal(sentText.includes('Format laporan tidak valid.'), true);
      assert.deepEqual(sentOptions, { reply_to_message_id: 777 });
    } finally {
      reportModel.findByTicketId = origFindByTicketId;
      telegramReporterModel.findByTelegramUserId = origFindReporter;
    }
  });

  await t.test('6. Laporan valid di grup dari pelapor approved harus diproses dan dibalas konfirmasi', async () => {
    let sentText = '';
    let sentOptions = null;
    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        sentText = text;
        sentOptions = options;
      }
    };

    const origFindByTicketId = reportModel.findByTicketId;
    const origCreateTelegramReport = reportModel.createTelegramReport;
    const origFindReporter = telegramReporterModel.findByTelegramUserId;

    let createdPayload = null;
    let createdMeta = null;

    reportModel.findByTicketId = async () => null;
    telegramReporterModel.findByTelegramUserId = async () => ({
      id: 1,
      full_name: 'Farhan Muhammad',
      agency: 'TELKOM',
      status: 'approved'
    });
    reportModel.createTelegramReport = async (data, meta) => {
      createdPayload = data;
      createdMeta = meta;
      return {
        ticketId: data.ticket_id,
        orderId: data.order_id
      };
    };

    try {
      const validGroupMessage = {
        message_id: 888,
        chat: { id: -100555666777, type: 'supergroup' },
        from: {
          id: 4321,
          username: 'farhan_dev',
          first_name: 'Farhan',
          last_name: 'Muhammad'
        },
        text: [
          'FALLOUT TYPE: DAMAN',
          'TANGGAL TIKET: 2026-08-18 21:26',
          'TICKET ID: INF77019674',
          'ORDER ID: AOI426034900040000',
          'WO NUMBER: -',
          'SERVICE TYPE: WFM: DSC',
          'SEGMENT: RETAIL',
          'PROVIDER: TELKOMSEL',
          'TELKOM AREA: INNER SUMBAR JAMBI',
          'BRANCH: PADANG',
          'CLUSTER: KOTA PADANG',
          'STO: PDC',
          'SUMMARY: test pelaporan grup',
          'SERVICE ID: 12345678_111401000000_INTERNET',
          'STATUS WFM: OPEN',
          'STATUS ANDALAS:',
          'REGION: PDG'
        ].join('\n')
      };

      await handleIncomingMessage(mockBot, validGroupMessage);

      assert.equal(createdPayload.ticket_id, 'INF77019674');
      assert.equal(createdMeta.chat_id, -100555666777);
      assert.equal(createdMeta.reporter_name, 'Farhan Muhammad');
      assert.equal(createdMeta.sender_username, 'farhan_dev');
      assert.equal(sentText.includes('Tiket INF77019674 | Order ID: AOI426034900040000 telah diterima dari pelapor Farhan Muhammad (TELKOM)'), true);
      assert.deepEqual(sentOptions, { reply_to_message_id: 888 });
    } finally {
      reportModel.findByTicketId = origFindByTicketId;
      reportModel.createTelegramReport = origCreateTelegramReport;
      telegramReporterModel.findByTelegramUserId = origFindReporter;
    }
  });

  await t.test('7. Laporan di grup dari user belum terdaftar / belum diapprove harus diblokir', async () => {
    let sentText = '';
    let sentOptions = null;
    let reportCreated = false;
    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        sentText = text;
        sentOptions = options;
      }
    };

    const origFindReporter = telegramReporterModel.findByTelegramUserId;
    const origCreateTelegramReport = reportModel.createTelegramReport;
    const origFindByTicketId = reportModel.findByTicketId;

    telegramReporterModel.findByTelegramUserId = async () => null; // Belum terdaftar
    reportModel.findByTicketId = async () => null;
    reportModel.createTelegramReport = async () => {
      reportCreated = true;
    };

    try {
      const unapprovedMessage = {
        message_id: 999,
        chat: { id: -100555666777, type: 'supergroup' },
        from: {
          id: 9999,
          username: 'user_asing',
          first_name: 'User',
          last_name: 'Asing'
        },
        text: [
          'TICKET ID: INF88888888',
          'ORDER ID: AOI999999999999999',
          'SUMMARY: Gangguan internet',
          'REGION: PDG'
        ].join('\n')
      };

      await handleIncomingMessage(mockBot, unapprovedMessage);

      assert.equal(reportCreated, false, 'Laporan tidak boleh dibuat jika belum diapprove');
      assert.equal(sentText.includes('Laporan Tidak Dapat Diproses'), true);
      assert.equal(sentText.includes('/daftar'), true);
      assert.deepEqual(sentOptions, { reply_to_message_id: 999 });
    } finally {
      telegramReporterModel.findByTelegramUserId = origFindReporter;
      reportModel.createTelegramReport = origCreateTelegramReport;
      reportModel.findByTicketId = origFindByTicketId;
    }
  });

  await t.test('8. Pendaftaran di grup diarahkan ke private chat demi privasi NIK', async () => {
    let sentText = '';
    const mockBot = {
      sendMessage: async (chatId, text) => {
        sentText = text;
      }
    };

    const groupRegMessage = {
      message_id: 1010,
      chat: { id: -100555666777, type: 'group' },
      from: { id: 1234, username: 'rizki' },
      text: '/daftar'
    };

    await handleIncomingMessage(mockBot, groupRegMessage);
    assert.equal(sentText.includes('Private Chat langsung'), true);
  });

  await t.test('9. Pendaftaran valid di private chat tersimpan dengan status pending', async () => {
    let sentText = '';
    let savedData = null;
    const mockBot = {
      sendMessage: async (chatId, text) => {
        sentText = text;
      }
    };

    const origCreate = telegramReporterModel.createOrUpdateRegistration;
    telegramReporterModel.createOrUpdateRegistration = async (data) => {
      savedData = data;
      return 1;
    };

    try {
      const privateRegMessage = {
        message_id: 1111,
        chat: { id: 77778888, type: 'private' },
        from: { id: 77778888, username: 'rizki_muharram' },
        text: 'DAFTAR\nNAMA: Rizki Muharram\nNIK: 654321\nASAL: HD'
      };

      await handleIncomingMessage(mockBot, privateRegMessage);

      assert.notEqual(savedData, null);
      assert.equal(savedData.full_name, 'Rizki Muharram');
      assert.equal(savedData.nik, '654321');
      assert.equal(savedData.agency, 'HD');
      assert.equal(savedData.telegram_user_id, 77778888);
      assert.equal(sentText.includes('Pendaftaran Berhasil Dikirim'), true);
      assert.equal(sentText.includes('PENDING'), true);
    } finally {
      telegramReporterModel.createOrUpdateRegistration = origCreate;
    }
  });

  await t.test('10. Pendaftaran dengan NIK tidak 6 digit di private chat ditolak dengan pesan kesalahan', async () => {
    let sentText = '';
    let savedData = null;
    const mockBot = {
      sendMessage: async (chatId, text) => {
        sentText = text;
      }
    };

    const origCreate = telegramReporterModel.createOrUpdateRegistration;
    telegramReporterModel.createOrUpdateRegistration = async (data) => {
      savedData = data;
    };

    try {
      const invalidRegMessage = {
        message_id: 1212,
        chat: { id: 77778888, type: 'private' },
        from: { id: 77778888, username: 'rizki_muharram' },
        text: 'DAFTAR\nNAMA: Rizki Muharram\nNIK: 12345\nASAL: TELKOM'
      };

      await handleIncomingMessage(mockBot, invalidRegMessage);

      assert.equal(savedData, null);
      assert.equal(sentText.includes('Format pendaftaran belum sesuai'), true);
      assert.equal(sentText.includes('6 digit'), true);
    } finally {
      telegramReporterModel.createOrUpdateRegistration = origCreate;
    }
  });
});
