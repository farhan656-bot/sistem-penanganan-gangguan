const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const reportModel = require('../models/reportModel');
const attachmentModel = require('../models/attachmentModel');
const pendingMediaModel = require('../models/pendingMediaModel');
const {
  parseTelegramCoreMessage,
  extractTicketIdFromText,
  buildFormatExample,
  parseTelegramEnrichmentMessage,
  hasCoreIntakeStructure
} = require('../utils/telegramParser');

let botInstance = null;
const TELEGRAM_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'telegram');

function normalizeTelegramMetaField(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function getReporterName(message) {
  const firstName = normalizeTelegramMetaField(message?.from?.first_name) || '';
  const lastName = normalizeTelegramMetaField(message?.from?.last_name) || '';
  return `${firstName} ${lastName}`.trim() || 'Pelapor';
}

function isPrivateChat(message) {
  return message && message.chat && message.chat.type === 'private';
}

function buildInvalidFormatReply(errors) {
  return [
    'Format laporan tidak valid.',
    ...errors.map((error) => `- ${error}`),
    '',
    'Gunakan format berikut:',
    buildFormatExample()
  ].join('\n');
}

function buildUnknownTicketReply(ticketId) {
  return `Ticket ID ${ticketId} tidak ditemukan. Pastikan Ticket ID benar.`;
}

function buildNoPendingMediaReply() {
  return 'Tidak ada media pending yang bisa dihubungkan. Kirim foto/dokumen terlebih dahulu.';
}

function buildEnrichmentNoValidFieldsReply() {
  return 'Tidak ada field tambahan yang valid. Pastikan format FIELD: VALUE dan TICKET ID benar.';
}

function buildEnrichmentSuccessReply(ticketId, updatedFields) {
  const fieldInfo = updatedFields.length > 0 ? `\nField diperbarui: ${updatedFields.join(', ')}` : '';
  return `Data tambahan berhasil diperbarui untuk tiket ${ticketId}.${fieldInfo}`;
}

function buildEnrichmentNoChangeReply(ticketId) {
  return `Data tambahan diterima, tetapi tidak ada field baru yang berubah pada tiket ${ticketId}.`;
}

function buildEnrichmentConflictReply(ticketId, conflicts) {
  const conflictFields = conflicts.length > 0 ? `\nField konflik: ${conflicts.map((item) => item.field).join(', ')}` : '';
  return `Data tambahan diterima, tetapi beberapa field tidak diperbarui karena data tiket sudah terisi. Tiket: ${ticketId}.${conflictFields}`;
}

function getTelegramMetaFromMessage(message) {
  const sender = message?.from || {};
  const senderUsername = normalizeTelegramMetaField(sender.username);

  return {
    chat_id: message?.chat?.id ?? null,
    message_id: message?.message_id ?? null,
    username: senderUsername,
    reporter_username: senderUsername,
    reporter_name: getReporterName(message),
    sender_id: normalizeTelegramMetaField(sender.id),
    sender_username: senderUsername,
    sender_first_name: normalizeTelegramMetaField(sender.first_name),
    sender_last_name: normalizeTelegramMetaField(sender.last_name)
  };
}

async function handleTextEnrichment(bot, message, text, enrichmentParsed) {
  if (!enrichmentParsed || !enrichmentParsed.hasTicketId) {
    return false;
  }

  const chatId = message.chat.id;
  const ticketId = enrichmentParsed.ticketId;
  const telegramMeta = getTelegramMetaFromMessage(message);
  const report = await reportModel.findByTicketId(ticketId);

  if (!report) {
    await reportModel.logTelegramTextEnrichmentFailure(null, {
      raw_text: enrichmentParsed.rawText || text,
      telegram_meta: telegramMeta
    });
    await bot.sendMessage(chatId, buildUnknownTicketReply(ticketId));
    return true;
  }

  if (!enrichmentParsed.isValid) {
    await reportModel.logTelegramTextEnrichmentFailure(report.ticket_id, {
      raw_text: enrichmentParsed.rawText || text,
      telegram_meta: telegramMeta
    });
    await bot.sendMessage(chatId, buildEnrichmentNoValidFieldsReply());
    return true;
  }

  const result = await reportModel.applyTelegramTextEnrichment(report.ticket_id, {
    fields: enrichmentParsed.fields,
    raw_text: enrichmentParsed.rawText || text,
    telegram_meta: telegramMeta
  });

  if (result.status === 'applied') {
    await bot.sendMessage(chatId, buildEnrichmentSuccessReply(result.ticketId, result.updatedFields));
    return true;
  }

  if (result.status === 'conflict') {
    await bot.sendMessage(chatId, buildEnrichmentConflictReply(result.ticketId, result.conflicts));
    return true;
  }

  await bot.sendMessage(chatId, buildEnrichmentNoChangeReply(result.ticketId));
  return true;
}

function extractTextOrCaption(message) {
  if (typeof message.text === 'string' && message.text.trim()) {
    return message.text;
  }

  if (typeof message.caption === 'string' && message.caption.trim()) {
    return message.caption;
  }

  return '';
}

function detectMessageType(message) {
  if (Array.isArray(message.photo) && message.photo.length > 0) {
    return 'photo';
  }

  if (message.document) {
    return 'document';
  }

  if (message.video) {
    return 'video';
  }

  if (message.audio) {
    return 'audio';
  }

  return 'text';
}

function getFileExtensionByMime(mimeType, fallback = 'bin') {
  const mime = String(mimeType || '').toLowerCase();
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'application/pdf') return 'pdf';
  return fallback;
}

function sanitizeFileName(name) {
  return String(name || '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
}

function buildStoredName(extension) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `tg_${Date.now()}_${randomPart}.${extension}`;
}

function buildPublicFilePath(storedName) {
  return `/uploads/telegram/${storedName}`;
}

function isImageAttachment(file) {
  const mime = String(file.mime_type || '').toLowerCase();
  return mime.startsWith('image/');
}

function extractMediaMetadata(message) {
  const messageType = detectMessageType(message);

  if (messageType === 'photo') {
    const largestPhoto = message.photo[message.photo.length - 1] || null;
    if (!largestPhoto) {
      return null;
    }

    return {
      type: 'photo',
      file_id: largestPhoto.file_id,
      file_unique_id: largestPhoto.file_unique_id,
      width: largestPhoto.width,
      height: largestPhoto.height,
      file_size: largestPhoto.file_size || null,
      caption: message.caption || ''
    };
  }

  if (messageType === 'document') {
    return {
      type: 'document',
      file_id: message.document.file_id,
      file_unique_id: message.document.file_unique_id,
      file_name: message.document.file_name || null,
      mime_type: message.document.mime_type || null,
      file_size: message.document.file_size || null,
      caption: message.caption || ''
    };
  }

  if (messageType === 'video') {
    return {
      type: 'video',
      file_id: message.video.file_id,
      file_unique_id: message.video.file_unique_id,
      duration: message.video.duration || null,
      width: message.video.width || null,
      height: message.video.height || null,
      mime_type: message.video.mime_type || null,
      file_size: message.video.file_size || null,
      caption: message.caption || ''
    };
  }

  if (messageType === 'audio') {
    return {
      type: 'audio',
      file_id: message.audio.file_id,
      file_unique_id: message.audio.file_unique_id,
      duration: message.audio.duration || null,
      mime_type: message.audio.mime_type || null,
      file_size: message.audio.file_size || null,
      caption: message.caption || ''
    };
  }

  return null;
}

async function ensureTelegramUploadDir() {
  await fs.promises.mkdir(TELEGRAM_UPLOAD_DIR, { recursive: true });
}

async function downloadTelegramFile(bot, fileId, storedName) {
  await ensureTelegramUploadDir();

  const fileUrl = await bot.getFileLink(fileId);
  const response = await axios.get(fileUrl, {
    responseType: 'arraybuffer',
    timeout: 30000
  });

  const absolutePath = path.join(TELEGRAM_UPLOAD_DIR, storedName);
  await fs.promises.writeFile(absolutePath, response.data);

  return {
    absolutePath,
    fileSize: Buffer.byteLength(response.data)
  };
}

function getMediaCoreInfo(message, mediaMetadata) {
  const messageType = detectMessageType(message);

  if (messageType === 'photo') {
    return {
      fileId: mediaMetadata.file_id,
      fileUniqueId: mediaMetadata.file_unique_id,
      mimeType: 'image/jpeg',
      originalName: `photo_${message.message_id}.jpg`,
      fileType: 'photo'
    };
  }

  if (messageType === 'document') {
    return {
      fileId: mediaMetadata.file_id,
      fileUniqueId: mediaMetadata.file_unique_id,
      mimeType: mediaMetadata.mime_type || 'application/octet-stream',
      originalName: mediaMetadata.file_name || `document_${message.message_id}`,
      fileType: 'document'
    };
  }

  return null;
}

async function persistMediaFile(bot, message, mediaMetadata) {
  const mediaInfo = getMediaCoreInfo(message, mediaMetadata);
  if (!mediaInfo) {
    throw new Error('Tipe media belum didukung.');
  }

  const extensionFromName = path.extname(mediaInfo.originalName || '').replace('.', '');
  const extension = extensionFromName || getFileExtensionByMime(mediaInfo.mimeType, mediaInfo.fileType === 'photo' ? 'jpg' : 'bin');
  const storedName = buildStoredName(extension);
  const publicPath = buildPublicFilePath(storedName);

  const downloadResult = await downloadTelegramFile(bot, mediaInfo.fileId, storedName);

  return {
    telegram_file_id: mediaInfo.fileId,
    telegram_file_unique_id: mediaInfo.fileUniqueId,
    file_type: mediaInfo.fileType,
    mime_type: mediaInfo.mimeType,
    original_name: sanitizeFileName(mediaInfo.originalName),
    stored_name: storedName,
    file_path: publicPath,
    file_size: downloadResult.fileSize,
    caption: message.caption || ''
  };
}

async function linkPendingMediaToReport(report, pendingMedia) {
  await attachmentModel.createAttachment({
    ticket_id: report.ticket_id,
    report_id: report.id || null,
    type_attachment_code: 'bukti_pelapor',
    source: 'telegram',
    telegram_file_id: pendingMedia.telegram_file_id,
    telegram_file_unique_id: pendingMedia.telegram_file_unique_id,
    file_type: pendingMedia.file_type,
    mime_type: pendingMedia.mime_type,
    original_name: pendingMedia.original_name,
    stored_name: pendingMedia.stored_name,
    file_path: pendingMedia.file_path,
    file_size: pendingMedia.file_size,
    caption: pendingMedia.caption,
    uploaded_by_user_id: null
  });

  await pendingMediaModel.markPendingMediaLinked(pendingMedia.id, report.ticket_id);
}

async function handleMediaMessage(bot, message, chatId, text, mediaMetadata) {
  const ticketIdFromText = extractTicketIdFromText(text);
  const persistedMedia = await persistMediaFile(bot, message, mediaMetadata);

  if (ticketIdFromText) {
    const report = await reportModel.findByTicketId(ticketIdFromText);

    if (!report) {
      await bot.sendMessage(chatId, buildUnknownTicketReply(ticketIdFromText));
      return;
    }

    await attachmentModel.createAttachment({
      ticket_id: report.ticket_id,
      report_id: report.id || null,
      type_attachment_code: 'bukti_pelapor',
      source: 'telegram',
      telegram_file_id: persistedMedia.telegram_file_id,
      telegram_file_unique_id: persistedMedia.telegram_file_unique_id,
      file_type: persistedMedia.file_type,
      mime_type: persistedMedia.mime_type,
      original_name: persistedMedia.original_name,
      stored_name: persistedMedia.stored_name,
      file_path: persistedMedia.file_path,
      file_size: persistedMedia.file_size,
      caption: persistedMedia.caption,
      uploaded_by_user_id: null
    });

    await bot.sendMessage(chatId, `Media Telegram berhasil disatukan ke tiket: ${report.ticket_id}`);
    return;
  }


  await pendingMediaModel.createPendingMedia({
    chat_id: chatId,
    telegram_message_id: message.message_id,
    telegram_file_id: persistedMedia.telegram_file_id,
    telegram_file_unique_id: persistedMedia.telegram_file_unique_id,
    file_type: persistedMedia.file_type,
    mime_type: persistedMedia.mime_type,
    original_name: persistedMedia.original_name,
    stored_name: persistedMedia.stored_name,
    file_path: persistedMedia.file_path,
    file_size: persistedMedia.file_size,
    caption: persistedMedia.caption
  });

  await bot.sendMessage(chatId, 'Media diterima. Silakan kirim TICKET ID: <id> untuk menghubungkan media ke tiket.');
}

async function tryLinkPendingMediaFromTicketText(bot, chatId, text) {
  const ticketId = extractTicketIdFromText(text);
  if (!ticketId) {
    return false;
  }

  const report = await reportModel.findByTicketId(ticketId);
  if (!report) {
    await bot.sendMessage(chatId, buildUnknownTicketReply(ticketId));
    return true;
  }

  const pendingMedia = await pendingMediaModel.getLatestPendingMediaByChatId(chatId);
  if (!pendingMedia) {
    await bot.sendMessage(chatId, buildNoPendingMediaReply());
    return true;
  }

  await linkPendingMediaToReport(report, pendingMedia);
  await bot.sendMessage(chatId, `Media pending berhasil disatukan ke tiket: ${report.ticket_id}`);
  return true;
}

async function handleIncomingMessage(bot, message) {
  if (!isPrivateChat(message)) {
    return;
  }

  const chatId = message.chat.id;
  const text = extractTextOrCaption(message);
  const messageType = detectMessageType(message);
  const mediaMetadata = extractMediaMetadata(message);

  if (!text.trim() && messageType === 'text') {
    await bot.sendMessage(chatId, 'Pesan tidak terbaca. Kirim laporan dalam format teks terstruktur.\n\n' + buildFormatExample());
    return;
  }

  if (messageType === 'photo' || messageType === 'document') {
    await handleMediaMessage(bot, message, chatId, text, mediaMetadata);
    return;
  }

  const parsed = parseTelegramCoreMessage(text);

  if (!parsed.isValid) {
    if (hasCoreIntakeStructure(text)) {
      await bot.sendMessage(chatId, buildInvalidFormatReply(parsed.errors));
      return;
    }

    const enrichmentParsed = parseTelegramEnrichmentMessage(text);
    const enrichmentHandled = await handleTextEnrichment(bot, message, text, enrichmentParsed);
    if (enrichmentHandled) {
      return;
    }

    const pendingLinkHandled = await tryLinkPendingMediaFromTicketText(bot, chatId, text);
    if (pendingLinkHandled) {
      return;
    }

    await bot.sendMessage(chatId, buildInvalidFormatReply(parsed.errors));
    return;
  }

  try {
    const existingByTicket = await reportModel.findByTicketId(parsed.data.ticket_id);
    if (existingByTicket) {
      const enrichmentParsed = parseTelegramEnrichmentMessage(text);
      await handleTextEnrichment(bot, message, text, enrichmentParsed);
      return;
    }

    const telegramMeta = getTelegramMetaFromMessage(message);

    const created = await reportModel.createTelegramReport(parsed.data, telegramMeta);

    await bot.sendMessage(
      chatId,
      `Tiket ${created.ticketId} | Order ID: ${created.orderId} telah diterima, diteruskan ke tim HD Data Management untuk Handling.`
    );
  } catch (error) {
    const safeMessage = String(error.message || '');

    if (safeMessage.toLowerCase().includes('ticket id sudah terdaftar')) {
      await bot.sendMessage(chatId, 'Ticket ID sudah terdaftar. Laporan duplikat ditolak.');
      return;
    }

    if (safeMessage.toLowerCase().includes('region tidak valid')) {
      await bot.sendMessage(chatId, 'Region tidak valid. Gunakan REGION: PDG atau REGION: BKT.');
      return;
    }

    console.error('Telegram intake error:', error);
    await bot.sendMessage(
      chatId,
      'Terjadi kendala sistem saat memproses laporan. Silakan coba lagi beberapa saat.'
    );
  }
}

function initTelegramBotService() {
  if (botInstance) {
    return botInstance;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const mode = (process.env.TELEGRAM_BOT_MODE || 'polling').trim().toLowerCase();

  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN tidak ditemukan. Telegram bot tidak dijalankan.');
    return null;
  }

  if (mode !== 'polling') {
    console.warn('TELEGRAM_BOT_MODE saat ini bukan polling. F006A hanya mendukung mode polling.');
    return null;
  }

  botInstance = new TelegramBot(token, { polling: true });

  botInstance.on('message', async (message) => {
    try {
      await handleIncomingMessage(botInstance, message);
    } catch (error) {
      console.error('Telegram message handling error:', error.message || error);

      if (isPrivateChat(message)) {
        await botInstance.sendMessage(
          message.chat.id,
          'Terjadi kendala sistem saat memproses pesan. Silakan coba lagi beberapa saat.'
        );
      }
    }
  });

  botInstance.on('polling_error', (error) => {
    console.error('Telegram polling error:', error.message || error);
  });

  console.log('Telegram bot aktif dalam mode polling.');
  return botInstance;
}

function getTelegramBotInstance() {
  return botInstance;
}

module.exports = {
  initTelegramBotService,
  getTelegramBotInstance
};
