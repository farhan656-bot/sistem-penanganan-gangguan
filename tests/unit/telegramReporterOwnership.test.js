const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const fs = require('fs');
const reportModel = require('../../models/reportModel');
const telegramReporterModel = require('../../models/telegramReporterModel');
const pendingMediaModel = require('../../models/pendingMediaModel');
const attachmentModel = require('../../models/attachmentModel');
const {
  isReportOwner,
  buildNotReportOwnerReply,
  handleIncomingMessage,
  selectOptimalPhoto
} = require('../../services/telegramBotService');

test('Unit Test: Telegram Reporter Ticket Ownership & Protection in Group Chats', async (t) => {
  await t.test('1. Helper isReportOwner memvalidasi kesesuaian sender ID secara ketat', () => {
    // Valid match
    assert.equal(isReportOwner({ telegram_sender_id: '123456' }, { from: { id: 123456 } }), true);
    assert.equal(isReportOwner({ telegram_sender_id: 123456 }, { from: { id: '123456' } }), true);

    // Mismatch (berbeda user)
    assert.equal(isReportOwner({ telegram_sender_id: '123456' }, { from: { id: 654321 } }), false);

    // Null/undefined sender
    assert.equal(isReportOwner({ telegram_sender_id: null }, { from: { id: 123456 } }), false);
    assert.equal(isReportOwner({ telegram_sender_id: '' }, { from: { id: 123456 } }), false);
    assert.equal(isReportOwner(null, { from: { id: 123456 } }), false);
    assert.equal(isReportOwner({ telegram_sender_id: '123456' }, null), false);
    assert.equal(isReportOwner({ telegram_sender_id: '123456' }, { from: {} }), false);
  });

  await t.test('2. Penyatuan gambar dengan caption tiket ditolak jika pengirim gambar bukan pemilik tiket', async () => {
    let sentText = '';
    let sentOptions = null;
    let attachmentCreated = false;

    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        sentText = text;
        sentOptions = options;
      },
      getFileLink: async () => 'https://example.com/mock.jpg'
    };

    const origFindByTicketId = reportModel.findByTicketId;
    const origCreateAttachment = attachmentModel.createAttachment;
    const origAxiosGet = axios.get;
    const origWriteFile = fs.promises.writeFile;

    reportModel.findByTicketId = async (ticketId) => {
      if (ticketId === 'INF11122233') {
        return {
          id: 10,
          ticket_id: 'INF11122233',
          telegram_sender_id: '111111', // Dibuat oleh user 111111
          status_internal: 'tersedia'
        };
      }
      return null;
    };

    attachmentModel.createAttachment = async () => {
      attachmentCreated = true;
    };

    axios.get = async () => ({
      data: Buffer.from('mock image data')
    });
    fs.promises.writeFile = async () => {};

    try {
      // User 222222 mencoba kirim foto dengan caption tiket milik 111111
      const photoMessage = {
        message_id: 501,
        chat: { id: -100888999, type: 'group' },
        from: { id: 222222, first_name: 'Orang Lain' },
        caption: 'TICKET ID: INF11122233',
        photo: [
          { file_id: 'fid_small', file_unique_id: 'uniq_1', width: 100, height: 100 },
          { file_id: 'fid_large', file_unique_id: 'uniq_2', width: 800, height: 800 }
        ]
      };

      await handleIncomingMessage(mockBot, photoMessage);

      assert.equal(attachmentCreated, false, 'Attachment tidak boleh dibuat jika bukan pemilik tiket');
      assert.equal(sentText.includes('Aksi Ditolak'), true);
      assert.equal(sentText.includes('INF11122233'), true);
      assert.deepEqual(sentOptions, { reply_to_message_id: 501 });
    } finally {
      reportModel.findByTicketId = origFindByTicketId;
      attachmentModel.createAttachment = origCreateAttachment;
      axios.get = origAxiosGet;
      fs.promises.writeFile = origWriteFile;
    }
  });

  await t.test('3. Text enrichment (penambahan data) ditolak jika pengirim bukan pemilik tiket', async () => {
    let sentText = '';
    let sentOptions = null;
    let enrichmentApplied = false;

    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        sentText = text;
        sentOptions = options;
      }
    };

    const origFindByTicketId = reportModel.findByTicketId;
    const origApplyEnrichment = reportModel.applyTelegramTextEnrichment;

    reportModel.findByTicketId = async (ticketId) => {
      if (ticketId === 'INF11122233') {
        return {
          id: 10,
          ticket_id: 'INF11122233',
          telegram_sender_id: '111111', // Pemilik tiket
          status_internal: 'tersedia'
        };
      }
      return null;
    };

    reportModel.applyTelegramTextEnrichment = async () => {
      enrichmentApplied = true;
      return { status: 'applied', ticketId: 'INF11122233', updatedFields: ['STO'] };
    };

    try {
      const enrichmentMessage = {
        message_id: 601,
        chat: { id: -100888999, type: 'group' },
        from: { id: 999999, first_name: 'Pelapor B' },
        text: 'TICKET ID: INF11122233\nSTO: PDC'
      };

      await handleIncomingMessage(mockBot, enrichmentMessage);

      assert.equal(enrichmentApplied, false, 'Enrichment tidak boleh diterapkan jika bukan pemilik tiket');
      assert.equal(sentText.includes('Aksi Ditolak'), true);
      assert.equal(sentText.includes('bukan pelapor yang mengirim tiket'), true);
      assert.deepEqual(sentOptions, { reply_to_message_id: 601 });
    } finally {
      reportModel.findByTicketId = origFindByTicketId;
      reportModel.applyTelegramTextEnrichment = origApplyEnrichment;
    }
  });

  await t.test('4. Resubmit tiket status perlu_tindak_lanjut ditolak jika pengirim bukan pemilik tiket', async () => {
    let sentText = '';
    let sentOptions = null;
    let resubmitExecuted = false;

    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        sentText = text;
        sentOptions = options;
      }
    };

    const origFindByTicketId = reportModel.findByTicketId;
    const origFindReporter = telegramReporterModel.findByTelegramUserId;
    const origResubmit = reportModel.resubmitFollowUpReport;

    reportModel.findByTicketId = async (ticketId) => {
      if (ticketId === 'INF55566677') {
        return {
          id: 20,
          ticket_id: 'INF55566677',
          telegram_sender_id: '111111', // Pemilik asli
          status_internal: 'perlu_tindak_lanjut'
        };
      }
      return null;
    };

    telegramReporterModel.findByTelegramUserId = async () => ({
      id: 5,
      full_name: 'User Lain Terdaftar',
      status: 'approved'
    });

    reportModel.resubmitFollowUpReport = async () => {
      resubmitExecuted = true;
      return { ticketId: 'INF55566677', updatedFields: [] };
    };

    try {
      const resubmitMessage = {
        message_id: 701,
        chat: { id: -100888999, type: 'group' },
        from: { id: 333333, first_name: 'Bukan Pemilik' },
        text: 'TICKET ID: INF55566677\nSUMMARY: Laporan diperbarui'
      };

      await handleIncomingMessage(mockBot, resubmitMessage);

      assert.equal(resubmitExecuted, false, 'Resubmit tidak boleh dieksekusi jika bukan pemilik tiket');
      assert.equal(sentText.includes('Aksi Ditolak'), true);
      assert.equal(sentText.includes('perbaikan atau resubmit data tiket'), true);
      assert.deepEqual(sentOptions, { reply_to_message_id: 701 });
    } finally {
      reportModel.findByTicketId = origFindByTicketId;
      telegramReporterModel.findByTelegramUserId = origFindReporter;
      reportModel.resubmitFollowUpReport = origResubmit;
    }
  });

  await t.test('5. Penyatuan tiket teks dengan pending media yang diunggah terpisah ditolak jika bukan pemilik tiket', async () => {
    let sentText = '';
    let sentOptions = null;
    let linkCalled = false;

    const mockBot = {
      sendMessage: async (chatId, text, options) => {
        sentText = text;
        sentOptions = options;
      }
    };

    const origFindByTicketId = reportModel.findByTicketId;
    const origGetPending = pendingMediaModel.getLatestPendingMediaByChatId;
    const origMarkLinked = pendingMediaModel.markPendingMediaLinked;

    reportModel.findByTicketId = async (ticketId) => {
      if (ticketId === 'INF77788899') {
        return {
          id: 30,
          ticket_id: 'INF77788899',
          telegram_sender_id: '111111', // Pemilik asli
          status_internal: 'tersedia'
        };
      }
      return null;
    };

    pendingMediaModel.getLatestPendingMediaByChatId = async () => {
      return {
        id: 1,
        telegram_file_id: 'tg_file_1',
        telegram_sender_id: '222222',
        status: 'pending'
      };
    };

    pendingMediaModel.markPendingMediaLinked = async () => {
      linkCalled = true;
    };

    try {
      const ticketOnlyMessage = {
        message_id: 801,
        chat: { id: -100888999, type: 'group' },
        from: { id: 222222, first_name: 'Pelapor Lain' },
        text: 'TICKET ID: INF77788899'
      };

      await handleIncomingMessage(mockBot, ticketOnlyMessage);

      assert.equal(linkCalled, false, 'Pending media tidak boleh di-link jika bukan pemilik tiket');
      assert.equal(sentText.includes('Aksi Ditolak'), true);
      assert.deepEqual(sentOptions, { reply_to_message_id: 801 });
    } finally {
      reportModel.findByTicketId = origFindByTicketId;
      pendingMediaModel.getLatestPendingMediaByChatId = origGetPending;
      pendingMediaModel.markPendingMediaLinked = origMarkLinked;
    }
  });

  await t.test('6. Pemilik tiket yang sah (owner) tetap berhasil melakukan text enrichment', async () => {
    let sentText = '';
    let enrichmentApplied = false;

    const mockBot = {
      sendMessage: async (chatId, text) => {
        sentText = text;
      }
    };

    const origFindByTicketId = reportModel.findByTicketId;
    const origApplyEnrichment = reportModel.applyTelegramTextEnrichment;

    reportModel.findByTicketId = async (ticketId) => {
      if (ticketId === 'INF11122233') {
        return {
          id: 10,
          ticket_id: 'INF11122233',
          telegram_sender_id: '111111', // Pemilik tiket
          status_internal: 'tersedia'
        };
      }
      return null;
    };

    reportModel.applyTelegramTextEnrichment = async () => {
      enrichmentApplied = true;
      return { status: 'applied', ticketId: 'INF11122233', updatedFields: ['STO'] };
    };

    try {
      const ownerMessage = {
        message_id: 901,
        chat: { id: -100888999, type: 'group' },
        from: { id: 111111, first_name: 'Pemilik Sah' },
        text: 'TICKET ID: INF11122233\nSTO: PDC'
      };

      await handleIncomingMessage(mockBot, ownerMessage);

      assert.equal(enrichmentApplied, true, 'Enrichment harus berhasil diterapkan jika pengirim adalah pemilik tiket');
      assert.equal(sentText.toLowerCase().includes('berhasil diperbarui'), true);
    } finally {
      reportModel.findByTicketId = origFindByTicketId;
      reportModel.applyTelegramTextEnrichment = origApplyEnrichment;
    }
  });

  await t.test('7. Pemilik tiket yang sah (owner) berhasil menyatukan media foto langsung', async () => {
    let sentText = '';
    let attachmentCreated = false;

    const mockBot = {
      sendMessage: async (chatId, text) => {
        sentText = text;
      },
      getFileLink: async () => 'https://example.com/mock.jpg'
    };

    const origFindByTicketId = reportModel.findByTicketId;
    const origCreateAttachment = attachmentModel.createAttachment;
    const origAxiosGet = axios.get;
    const origWriteFile = fs.promises.writeFile;

    reportModel.findByTicketId = async (ticketId) => {
      if (ticketId === 'INF11122233') {
        return {
          id: 10,
          ticket_id: 'INF11122233',
          telegram_sender_id: '111111', // Pemilik tiket
          status_internal: 'tersedia'
        };
      }
      return null;
    };

    attachmentModel.createAttachment = async () => {
      attachmentCreated = true;
    };

    axios.get = async () => ({
      data: Buffer.from('mock image data')
    });
    fs.promises.writeFile = async () => {};

    try {
      const ownerPhotoMessage = {
        message_id: 950,
        chat: { id: -100888999, type: 'group' },
        from: { id: 111111, first_name: 'Pemilik Sah' },
        caption: 'TICKET ID: INF11122233',
        photo: [
          { file_id: 'fid_small', file_unique_id: 'uniq_1', width: 100, height: 100 },
          { file_id: 'fid_large', file_unique_id: 'uniq_2', width: 800, height: 800 }
        ]
      };

      await handleIncomingMessage(mockBot, ownerPhotoMessage);

      assert.equal(attachmentCreated, true, 'Attachment harus berhasil dibuat jika pengirim adalah pemilik tiket');
      assert.equal(sentText.includes('berhasil disatukan ke tiket: INF11122233'), true);
    } finally {
      reportModel.findByTicketId = origFindByTicketId;
      attachmentModel.createAttachment = origCreateAttachment;
      axios.get = origAxiosGet;
      fs.promises.writeFile = origWriteFile;
    }
  });

  await t.test('8. Helper selectOptimalPhoto memilih resolusi cerdas yang cepat diunduh tanpa kompromi kualitas', () => {
    // Array kosong / bukan array
    assert.equal(selectOptimalPhoto(null), null);
    assert.equal(selectOptimalPhoto([]), null);

    // Hanya 1 atau 2 foto
    const twoPhotos = [
      { file_id: 'thumb', width: 90, height: 90, file_size: 5000 },
      { file_id: 'medium', width: 320, height: 320, file_size: 25000 }
    ];
    assert.equal(selectOptimalPhoto(twoPhotos).file_id, 'medium');

    // 4 foto kamera ponsel: thumbnail, small, medium HD, large RAW 4MB
    const multiPhotos = [
      { file_id: 'thumb', width: 90, height: 90, file_size: 5000 },
      { file_id: 'small', width: 320, height: 320, file_size: 30000 },
      { file_id: 'hd_optimal', width: 1280, height: 960, file_size: 220000 },
      { file_id: 'raw_huge', width: 4000, height: 3000, file_size: 4500000 }
    ];
    // Memilih HD yang jauh lebih cepat (220KB) daripada RAW kamera (4.5MB)
    assert.equal(selectOptimalPhoto(multiPhotos).file_id, 'hd_optimal');
  });
});
