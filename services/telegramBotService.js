const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');

const telegramHttpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 20
});
const reportModel = require('../models/reportModel');
const attachmentModel = require('../models/attachmentModel');
const pendingMediaModel = require('../models/pendingMediaModel');
const telegramReporterModel = require('../models/telegramReporterModel');
const {
  parseTelegramCoreMessage,
  parseTelegramConciseReport,
  extractTicketIdFromText,
  buildFormatExample,
  buildRegistrationFormatExample,
  parseReporterRegistration,
  parseTelegramEnrichmentMessage,
  parseTelegramAllFields,
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

function isGroupChat(message) {
  return message && message.chat && (message.chat.type === 'group' || message.chat.type === 'supergroup');
}

function isSupportedChat(message) {
  return isPrivateChat(message) || isGroupChat(message);
}

async function sendBotMessage(bot, chatId, text, message = null) {
  const options = (message && message.message_id && isGroupChat(message))
    ? { reply_to_message_id: message.message_id }
    : {};

  try {
    return await bot.sendMessage(chatId, text, options);
  } catch (error) {
    if (options.reply_to_message_id) {
      return await bot.sendMessage(chatId, text);
    }
    throw error;
  }
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

function isReportOwner(report, message) {
  if (!report || !message) {
    return false;
  }

  const senderId = message.from && message.from.id !== undefined && message.from.id !== null
    ? String(message.from.id).trim()
    : '';

  const reportSenderId = report.telegram_sender_id !== undefined && report.telegram_sender_id !== null
    ? String(report.telegram_sender_id).trim()
    : '';

  if (!senderId || !reportSenderId) {
    return false;
  }

  return senderId === reportSenderId;
}

function buildNotReportOwnerReply(ticketId, actionName = 'menambah data atau gambar') {
  return `⛔ Aksi Ditolak\n\nAnda bukan pelapor yang mengirim tiket ${ticketId}.\n\nUntuk menghindari kesalahan atau tertukarnya data laporan di grup, ${actionName} hanya dapat dilakukan oleh pelapor pemilik tiket tersebut.`;
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
    await sendBotMessage(bot, chatId, buildUnknownTicketReply(ticketId), message);
    return true;
  }

  if (!isReportOwner(report, message)) {
    await sendBotMessage(bot, chatId, buildNotReportOwnerReply(report.ticket_id, 'penambahan data'), message);
    return true;
  }

  if (!enrichmentParsed.isValid) {
    await reportModel.logTelegramTextEnrichmentFailure(report.ticket_id, {
      raw_text: enrichmentParsed.rawText || text,
      telegram_meta: telegramMeta
    });
    await sendBotMessage(bot, chatId, buildEnrichmentNoValidFieldsReply(), message);
    return true;
  }

  const result = await reportModel.applyTelegramTextEnrichment(report.ticket_id, {
    fields: enrichmentParsed.fields,
    raw_text: enrichmentParsed.rawText || text,
    telegram_meta: telegramMeta
  });

  if (result.status === 'applied') {
    await sendBotMessage(bot, chatId, buildEnrichmentSuccessReply(result.ticketId, result.updatedFields), message);
    return true;
  }

  if (result.status === 'conflict') {
    await sendBotMessage(bot, chatId, buildEnrichmentConflictReply(result.ticketId, result.conflicts), message);
    return true;
  }

  await sendBotMessage(bot, chatId, buildEnrichmentNoChangeReply(result.ticketId), message);
  return true;
}

async function handleFollowUpResubmission(bot, message, text, report, incomingFields = {}, telegramMeta = null, attachedFiles = []) {
  const chatId = message.chat.id;
  const meta = telegramMeta || getTelegramMetaFromMessage(message);

  const result = await reportModel.resubmitFollowUpReport(report.ticket_id, {
    fields: incomingFields,
    raw_text: text,
    telegram_meta: meta
  });

  const fieldList = result.updatedFields && result.updatedFields.length > 0
    ? result.updatedFields.join(', ')
    : 'Data dikonfirmasi ulang';

  const replyLines = [
    'PERBAIKAN LAPORAN DITERIMA (RESUBMIT)',
    `Tiket: ${report.ticket_id}`,
    `Order ID: ${result.orderId || report.order_id || '-'}`,
    '',
    'Status tiket telah dikembalikan ke antrean kerja (TERSEDIA) untuk ditangani kembali oleh tim HD Data Management.',
    `Field diperbarui: ${fieldList}`
  ];

  if (attachedFiles.length > 0) {
    replyLines.push(`Lampiran bukti: ${attachedFiles.join(', ')}`);
  }

  await sendBotMessage(bot, chatId, replyLines.join('\n'), message);
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

function selectOptimalPhoto(photos) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return null;
  }
  if (photos.length <= 2) {
    return photos[photos.length - 1];
  }

  // Telegram mengurutkan photos dari dimensi terkecil hingga terbesar.
  // photos[photos.length - 1] adalah file resolusi terbesar (seringkali 3-5MB dari kamera ponsel).
  // photos[photos.length - 2] adalah resolusi HD yang dioptimasi Telegram (~800-1280px, ~100-300KB),
  // sangat tajam untuk bukti laporan web/mobile, namun 10x lebih cepat diunduh dibanding file mentah kamera.
  const largest = photos[photos.length - 1];
  const secondLargest = photos[photos.length - 2];

  if (largest && largest.file_size && largest.file_size > 1000000 && secondLargest && secondLargest.width >= 600) {
    return secondLargest;
  }
  if (largest && largest.width && largest.width > 1600 && secondLargest && secondLargest.width >= 800) {
    return secondLargest;
  }

  return largest;
}

function extractMediaMetadata(message) {
  const messageType = detectMessageType(message);

  if (messageType === 'photo') {
    const selectedPhoto = selectOptimalPhoto(message.photo);
    if (!selectedPhoto) {
      return null;
    }

    return {
      type: 'photo',
      file_id: selectedPhoto.file_id,
      file_unique_id: selectedPhoto.file_unique_id,
      width: selectedPhoto.width,
      height: selectedPhoto.height,
      file_size: selectedPhoto.file_size || null,
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

let dirEnsured = false;
async function ensureTelegramUploadDir() {
  if (dirEnsured) return;
  await fs.promises.mkdir(TELEGRAM_UPLOAD_DIR, { recursive: true });
  dirEnsured = true;
}

async function downloadTelegramFile(bot, fileId, storedName) {
  await ensureTelegramUploadDir();

  let fileUrl = null;
  const token = bot?.token || process.env.TELEGRAM_BOT_TOKEN;

  // Jalur cepat: gunakan axios + telegramHttpsAgent untuk getFile guna memanfaatkan persistent socket
  if (token && typeof bot?.getFileLink === 'function') {
    try {
      const getFileRes = await axios.get(`https://api.telegram.org/bot${token}/getFile`, {
        params: { file_id: fileId },
        httpsAgent: telegramHttpsAgent,
        timeout: 10000
      });
      if (getFileRes?.data?.ok && getFileRes?.data?.result?.file_path) {
        fileUrl = `https://api.telegram.org/file/bot${token}/${getFileRes.data.result.file_path}`;
      } else {
        fileUrl = await bot.getFileLink(fileId);
      }
    } catch {
      fileUrl = await bot.getFileLink(fileId);
    }
  } else if (typeof bot?.getFileLink === 'function') {
    fileUrl = await bot.getFileLink(fileId);
  }

  const response = await axios.get(fileUrl, {
    responseType: 'arraybuffer',
    httpsAgent: telegramHttpsAgent,
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
    report_id: null,
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
  if (typeof bot?.sendChatAction === 'function') {
    bot.sendChatAction(chatId, 'upload_photo').catch(() => {});
  }

  const ticketIdFromText = extractTicketIdFromText(text);
  let report = null;

  if (ticketIdFromText) {
    report = await reportModel.findByTicketId(ticketIdFromText);

    if (!report) {
      // Cek apakah pesan media dengan caption ini adalah Laporan Baru Format Ringkas
      const conciseParsed = parseTelegramConciseReport(text);
      if (conciseParsed && conciseParsed.isValid) {
        const reporter = await telegramReporterModel.findByTelegramUserId(message?.from?.id);
        const isGroup = isGroupChat(message);
        if (!reporter || reporter.status !== 'approved') {
          const senderName = getReporterName(message);
          const usernamePart = message?.from?.username ? `@${message.from.username}` : senderName;
          if (isGroup) {
            await sendBotMessage(
              bot,
              chatId,
              `⛔ Laporan Tidak Dapat Diproses\n\nHalo ${usernamePart}, Anda belum terdaftar atau belum disetujui sebagai pelapor resmi di sistem.\n\nUntuk dapat melaporkan gangguan:\n1. Buka Private Chat dengan bot ini\n2. Ketik /daftar dan kirimkan data pendaftaran Anda\n3. Tunggu persetujuan dari Super Admin\n\nLaporan ini tidak disimpan ke antrean kerja.`,
              message
            );
          } else {
            await sendBotMessage(
              bot,
              chatId,
              '⛔ Laporan Tidak Dapat Diproses\n\nAkun Anda belum terdaftar atau belum disetujui sebagai pelapor resmi di sistem.\n\nSilakan ketik /daftar untuk melakukan pendaftaran akun pelapor terlebih dahulu.',
              message
            );
          }
          return;
        }

        const regionCode = reporter.region_code || (reporter.region_id === 2 ? 'BKT' : 'PDG');
        const telegramMeta = getTelegramMetaFromMessage(message);
        const reportPayload = {
          ticket_id: conciseParsed.data.ticket_id,
          order_id: conciseParsed.data.order_id,
          summary: conciseParsed.data.summary,
          service_id: conciseParsed.data.service_id || null,
          region: regionCode
        };

        const created = await reportModel.createTelegramReport(reportPayload, telegramMeta);
        const reporterCompany = reporter.company || reporter.agency || 'TELKOM';
        const reporterUnit = reporter.unit || 'DAMAN';
        const reporterLabel = ` dari pelapor ${reporter.full_name} (${reporterCompany} - ${reporterUnit} ${regionCode})`;

        const replyPromise = sendBotMessage(
          bot,
          chatId,
          `Tiket ${created.ticketId} | Order ID: ${created.orderId} telah diterima${reporterLabel}, diteruskan ke tim HD Data Management untuk Handling.`,
          message
        );

        const persistAndAttachPromise = (async () => {
          const persistedMedia = await persistMediaFile(bot, message, mediaMetadata);
          await attachmentModel.createAttachment({
            ticket_id: created.ticketId,
            report_id: null,
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
        })();

        await Promise.all([replyPromise, persistAndAttachPromise]);
        return;
      }

      await sendBotMessage(bot, chatId, buildUnknownTicketReply(ticketIdFromText), message);
      return;
    }

    if (!isReportOwner(report, message)) {
      await sendBotMessage(bot, chatId, buildNotReportOwnerReply(report.ticket_id, 'penyatuan gambar atau bukti'), message);
      return;
    }

    if (report.status_internal === 'perlu_tindak_lanjut') {
      const allParsed = parseTelegramAllFields(text);
      const telegramMeta = getTelegramMetaFromMessage(message);
      const mediaInfo = getMediaCoreInfo(message, mediaMetadata);
      const originalName = mediaInfo ? mediaInfo.originalName : 'media';

      // Kirim feedback resubmit segera secara paralel dengan download latar belakang
      const resubmitReplyPromise = handleFollowUpResubmission(
        bot,
        message,
        text,
        report,
        allParsed.fields,
        telegramMeta,
        [originalName]
      );

      const persistAndAttachPromise = (async () => {
        const persistedMedia = await persistMediaFile(bot, message, mediaMetadata);
        await attachmentModel.createAttachment({
          ticket_id: report.ticket_id,
          report_id: null,
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
      })();

      await Promise.all([resubmitReplyPromise, persistAndAttachPromise]);
      return;
    }

    // Direct ticket: Kirim balasan konfirmasi ke grup SEGERA tanpa menunggu unduh file selesai
    const replyPromise = sendBotMessage(bot, chatId, `Media Telegram berhasil disatukan ke tiket: ${report.ticket_id}`, message);

    const persistAndAttachPromise = (async () => {
      const persistedMedia = await persistMediaFile(bot, message, mediaMetadata);
      await attachmentModel.createAttachment({
        ticket_id: report.ticket_id,
        report_id: null,
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
    })();

    await Promise.all([replyPromise, persistAndAttachPromise]);
    return;
  }

  // Pending media (tanpa Ticket ID di caption): Kirim konfirmasi penerimaan SEGERA
  const replyPromise = sendBotMessage(bot, chatId, 'Media diterima. Silakan kirim TICKET ID: <id> untuk menghubungkan media ke tiket.', message);

  const persistPendingPromise = (async () => {
    const persistedMedia = await persistMediaFile(bot, message, mediaMetadata);
    await pendingMediaModel.createPendingMedia({
      chat_id: chatId,
      telegram_message_id: message.message_id,
      telegram_sender_id: message?.from?.id ? String(message.from.id) : null,
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
  })();

  await Promise.all([replyPromise, persistPendingPromise]);
}

async function tryLinkPendingMediaFromTicketText(bot, chatId, text, message = null) {
  const ticketId = extractTicketIdFromText(text);
  if (!ticketId) {
    return false;
  }

  const report = await reportModel.findByTicketId(ticketId);
  if (!report) {
    await sendBotMessage(bot, chatId, buildUnknownTicketReply(ticketId), message);
    return true;
  }

  if (!isReportOwner(report, message)) {
    await sendBotMessage(bot, chatId, buildNotReportOwnerReply(report.ticket_id, 'penyatuan gambar pending ke tiket'), message);
    return true;
  }

  const senderId = message?.from?.id ? String(message.from.id) : null;
  const pendingMedia = await pendingMediaModel.getLatestPendingMediaByChatId(chatId, senderId);
  if (!pendingMedia) {
    await sendBotMessage(bot, chatId, buildNoPendingMediaReply(), message);
    return true;
  }

  await linkPendingMediaToReport(report, pendingMedia);

  if (report.status_internal === 'perlu_tindak_lanjut') {
    const allParsed = parseTelegramAllFields(text);
    const telegramMeta = message ? getTelegramMetaFromMessage(message) : getTelegramMetaFromMessage({
      chat: { id: chatId },
      from: {}
    });
    await handleFollowUpResubmission(
      bot,
      message || { chat: { id: chatId } },
      text,
      report,
      allParsed.fields,
      telegramMeta,
      [pendingMedia.original_name]
    );
    return true;
  }

  await sendBotMessage(bot, chatId, `Media pending berhasil disatukan ke tiket: ${report.ticket_id}`, message);
  return true;
}

async function handleIncomingMessage(bot, message) {
  if (!isSupportedChat(message)) {
    return;
  }

  const chatId = message.chat.id;
  const text = extractTextOrCaption(message);
  const messageType = detectMessageType(message);
  const mediaMetadata = extractMediaMetadata(message);
  const isGroup = isGroupChat(message);

  const trimmedText = text.trim();
  const trimmedLower = trimmedText.toLowerCase();

  // Dukungan command /start, /bantuan, /help
  if (trimmedLower === '/start' || trimmedLower.startsWith('/start ') || trimmedLower === '/help' || trimmedLower === '/bantuan') {
    const helpLines = [
      '🤖 Sistem Monitoring & Penanganan Gangguan - Bot Pelaporan',
      'Divisi Data Management PT Telkom Sumbar Witel Padang',
      '',
      'Daftar Perintah:',
      '• /daftar - Registrasi akun pelapor resmi (Private Chat)',
      '• /status - Cek status persetujuan akun pelapor',
      '• /format - Contoh format penulisan laporan gangguan',
      '• /bantuan - Panduan bantuan dan menu bot',
      '',
      'Catatan:',
      'Laporan gangguan yang dikirim di grup hanya akan diproses jika akun pelapor telah disetujui (Approved) oleh Super Admin.'
    ];
    await sendBotMessage(bot, chatId, helpLines.join('\n'), message);
    return;
  }

  // Dukungan command /format
  if (trimmedLower === '/format') {
    await sendBotMessage(
      bot,
      chatId,
      'Sistem Monitoring & Penanganan Gangguan - Bot Pelaporan\n\nKirim laporan incident dengan format berikut:\n\n' + buildFormatExample(),
      message
    );
    return;
  }

  // Pendaftaran Pelapor: perintah /daftar atau pesan dengan format DAFTAR
  const regCheck = parseReporterRegistration(trimmedText);

  if (regCheck.isRegistrationAttempt) {
    if (isGroup) {
      await sendBotMessage(
        bot,
        chatId,
        'Demi kerahasiaan data pribadi (NIK), pendaftaran pelapor hanya dapat dilakukan via Private Chat langsung dengan bot. Silakan chat bot secara pribadi lalu kirim perintah /daftar.',
        message
      );
      return;
    }

    if (regCheck.isCommandOnly) {
      const existingReporter = await telegramReporterModel.findByTelegramUserId(message?.from?.id);
      if (existingReporter) {
        const regionLabel = existingReporter.region_code || (existingReporter.region_id === 2 ? 'BKT' : 'PDG');
        if (existingReporter.status === 'approved') {
          await sendBotMessage(
            bot,
            chatId,
            `✅ Anda sudah terdaftar dan DISETUJUI sebagai pelapor resmi.\n\n• Nama: ${existingReporter.full_name}\n• NIK: ${existingReporter.nik}\n• Perusahaan: ${existingReporter.company || existingReporter.agency || '-'}\n• Unit / Divisi: ${existingReporter.unit || '-'}\n• Asal Wilayah: ${regionLabel}\n\nAnda sudah dapat mengirimkan laporan gangguan di grup.`,
            message
          );
          return;
        } else if (existingReporter.status === 'pending') {
          await sendBotMessage(
            bot,
            chatId,
            `⏳ Pendaftaran Anda (${existingReporter.full_name} / NIK ${existingReporter.nik} / ${existingReporter.company || existingReporter.agency || '-'}) sedang MENUNGGU PERSETUJUAN dari Super Admin.\nBot akan mengirim notifikasi setelah akun diverifikasi.`,
            message
          );
          return;
        } else if (existingReporter.status === 'rejected') {
          await sendBotMessage(
            bot,
            chatId,
            `❌ Pendaftaran Anda sebelumnya DITOLAK.\nAlasan: ${existingReporter.rejection_reason || '-'}\n\nSilakan kirimkan kembali data pendaftaran yang valid dengan format berikut:\n\n${buildRegistrationFormatExample()}`,
            message
          );
          return;
        }
      }

      await sendBotMessage(
        bot,
        chatId,
        `📋 Formulir Pendaftaran Pelapor\n\nSilakan salin dan kirimkan data pendaftaran Anda dengan format persis di bawah ini:\n\n${buildRegistrationFormatExample()}\n\nKetentuan:\n- NIK wajib terdiri dari tepat 6 digit angka\n- PERUSAHAAN diisi nama perusahaan / anak perusahaan Telkom (TELKOM, TELKOMSEL, TELKOM AKSES, dll.)\n- UNIT diisi divisi / unit pelapor (DAMAN, HD, BGES, WFM, ROC, dll.)\n- ASAL wilayah wajib diisi: PDG atau BKT`,
        message
      );
      return;
    }

    if (!regCheck.isValid) {
      await sendBotMessage(
        bot,
        chatId,
        `Format pendaftaran belum sesuai:\n${regCheck.errors.map((e) => `- ${e}`).join('\n')}\n\nGunakan format berikut:\n${buildRegistrationFormatExample()}`,
        message
      );
      return;
    }

    await telegramReporterModel.createOrUpdateRegistration({
      telegram_user_id: message.from.id,
      telegram_username: message.from.username || null,
      telegram_chat_id: message.chat.id,
      full_name: regCheck.data.full_name,
      nik: regCheck.data.nik,
      company: regCheck.data.company,
      unit: regCheck.data.unit,
      region_id: regCheck.data.region_id,
      regionCode: regCheck.data.region_code,
      agency: regCheck.data.agency || regCheck.data.company
    });

    await sendBotMessage(
      bot,
      chatId,
      `✅ Pendaftaran Berhasil Dikirim!\n\nData Pelapor:\n• Nama: ${regCheck.data.full_name}\n• NIK: ${regCheck.data.nik}\n• Perusahaan: ${regCheck.data.company}\n• Unit / Divisi: ${regCheck.data.unit}\n• Asal Wilayah: ${regCheck.data.region_code}\n\n⏳ Status saat ini: MENUNGGU PERSETUJUAN (PENDING) dari Super Admin.\nBot akan mengirim notifikasi ke chat ini setelah akun diverifikasi.`,
      message
    );
    return;
  }

  // Dukungan command /status
  if (trimmedLower === '/status') {
    if (isGroup) {
      await sendBotMessage(
        bot,
        chatId,
        'Pengecekan status pendaftaran dapat dilakukan melalui Private Chat dengan bot.',
        message
      );
      return;
    }

    const reporter = await telegramReporterModel.findByTelegramUserId(message?.from?.id);
    if (!reporter) {
      await sendBotMessage(
        bot,
        chatId,
        'Anda belum melakukan pendaftaran akun pelapor. Silakan kirim /daftar untuk mendaftar.',
        message
      );
      return;
    }

    const regLabel = reporter.region_code || (reporter.region_id === 2 ? 'BKT' : 'PDG');
    if (reporter.status === 'pending') {
      await sendBotMessage(
        bot,
        chatId,
        `⏳ Status: MENUNGGU PERSETUJUAN (PENDING)\n\n• Nama: ${reporter.full_name}\n• NIK: ${reporter.nik}\n• Perusahaan: ${reporter.company || reporter.agency || '-'}\n• Unit / Divisi: ${reporter.unit || '-'}\n• Asal Wilayah: ${regLabel}\n• Waktu Daftar: ${new Date(reporter.created_at).toLocaleString('id-ID')}\n\nPendaftaran Anda sedang ditinjau oleh Super Admin.`,
        message
      );
      return;
    }

    if (reporter.status === 'approved') {
      await sendBotMessage(
        bot,
        chatId,
        `✅ Status: DISETUJUI (APPROVED)\n\n• Nama: ${reporter.full_name}\n• NIK: ${reporter.nik}\n• Perusahaan: ${reporter.company || reporter.agency || '-'}\n• Unit / Divisi: ${reporter.unit || '-'}\n• Asal Wilayah: ${regLabel}\n• Disetujui: ${reporter.approved_at ? new Date(reporter.approved_at).toLocaleString('id-ID') : '-'}\n\nAnda sudah memiliki hak akses untuk melaporkan gangguan ke grup.`,
        message
      );
      return;
    }

    if (reporter.status === 'rejected') {
      await sendBotMessage(
        bot,
        chatId,
        `❌ Status: DITOLAK (REJECTED)\n\n• Nama: ${reporter.full_name}\n• NIK: ${reporter.nik}\n• Perusahaan: ${reporter.company || reporter.agency || '-'}\n• Unit / Divisi: ${reporter.unit || '-'}\n• Asal Wilayah: ${regLabel}\n• Alasan: ${reporter.rejection_reason || 'Tidak memenuhi kriteria'}\n\nAnda dapat mendaftar ulang dengan data yang benar via perintah /daftar.`,
        message
      );
      return;
    }
  }

  if (!trimmedText && messageType === 'text') {
    if (!isGroup) {
      await sendBotMessage(
        bot,
        chatId,
        'Pesan tidak terbaca. Kirim laporan dalam format teks terstruktur.\n\n' + buildFormatExample(),
        message
      );
    }
    return;
  }

  if (messageType === 'photo' || messageType === 'document') {
    await handleMediaMessage(bot, message, chatId, text, mediaMetadata);
    return;
  }

  const allParsed = parseTelegramAllFields(text);
  if (allParsed.ticketId) {
    const existingTicket = await reportModel.findByTicketId(allParsed.ticketId);
    if (existingTicket && existingTicket.status_internal === 'perlu_tindak_lanjut') {
      const reporter = await telegramReporterModel.findByTelegramUserId(message?.from?.id);
      if (!reporter || reporter.status !== 'approved') {
        await sendBotMessage(
          bot,
          chatId,
          '⛔ Anda belum terdaftar atau belum disetujui sebagai pelapor resmi untuk memperbarui tiket.',
          message
        );
        return;
      }
      if (!isReportOwner(existingTicket, message)) {
        await sendBotMessage(
          bot,
          chatId,
          buildNotReportOwnerReply(existingTicket.ticket_id, 'perbaikan atau resubmit data tiket'),
          message
        );
        return;
      }
      const telegramMeta = getTelegramMetaFromMessage(message);
      await handleFollowUpResubmission(bot, message, text, existingTicket, allParsed.fields, telegramMeta);
      return;
    }
  }

  const parsed = parseTelegramCoreMessage(text);
  const isIncidentSubmission = parsed.isValid || hasCoreIntakeStructure(text);

  if (isIncidentSubmission) {
    // Gatekeeper: Pelapor wajib terdaftar dan disetujui
    const reporter = await telegramReporterModel.findByTelegramUserId(message?.from?.id);
    if (!reporter || reporter.status !== 'approved') {
      const senderName = getReporterName(message);
      const usernamePart = message?.from?.username ? `@${message.from.username}` : senderName;

      if (isGroup) {
        await sendBotMessage(
          bot,
          chatId,
          `⛔ Laporan Tidak Dapat Diproses\n\nHalo ${usernamePart}, Anda belum terdaftar atau belum disetujui sebagai pelapor resmi di sistem.\n\nUntuk dapat melaporkan gangguan:\n1. Buka Private Chat dengan bot ini\n2. Ketik /daftar dan kirimkan data (Nama, NIK 6 digit, Asal: TELKOM / HD / TELKOMSEL)\n3. Tunggu persetujuan dari Super Admin\n\nLaporan ini tidak disimpan ke antrean kerja.`,
          message
        );
      } else {
        await sendBotMessage(
          bot,
          chatId,
          '⛔ Laporan Tidak Dapat Diproses\n\nAkun Anda belum terdaftar atau belum disetujui sebagai pelapor resmi di sistem.\n\nSilakan ketik /daftar untuk melakukan pendaftaran akun pelapor terlebih dahulu.',
          message
        );
      }
      return;
    }
  }

  if (!parsed.isValid) {
    if (hasCoreIntakeStructure(text)) {
      await sendBotMessage(bot, chatId, buildInvalidFormatReply(parsed.errors), message);
      return;
    }

    const conciseParsed = parseTelegramConciseReport(text);
    if (conciseParsed && conciseParsed.isValid) {
      const existingByTicket = await reportModel.findByTicketId(conciseParsed.data.ticket_id);
      if (existingByTicket) {
        if (!isReportOwner(existingByTicket, message)) {
          await sendBotMessage(
            bot,
            chatId,
            buildNotReportOwnerReply(existingByTicket.ticket_id, 'memperbarui data tiket'),
            message
          );
          return;
        }

        if (existingByTicket.status_internal === 'perlu_tindak_lanjut') {
          const telegramMeta = getTelegramMetaFromMessage(message);
          await handleFollowUpResubmission(bot, message, text, existingByTicket, conciseParsed.data, telegramMeta);
          return;
        }

        const enrichmentParsed = parseTelegramEnrichmentMessage(text);
        await handleTextEnrichment(bot, message, text, enrichmentParsed);
        return;
      }

      // Gatekeeper untuk laporan ringkas baru
      const reporter = await telegramReporterModel.findByTelegramUserId(message?.from?.id);
      if (!reporter || reporter.status !== 'approved') {
        const senderName = getReporterName(message);
        const usernamePart = message?.from?.username ? `@${message.from.username}` : senderName;
        if (isGroup) {
          await sendBotMessage(
            bot,
            chatId,
            `⛔ Laporan Tidak Dapat Diproses\n\nHalo ${usernamePart}, Anda belum terdaftar atau belum disetujui sebagai pelapor resmi di sistem.\n\nUntuk dapat melaporkan gangguan:\n1. Buka Private Chat dengan bot ini\n2. Ketik /daftar dan kirimkan data pendaftaran Anda\n3. Tunggu persetujuan dari Super Admin\n\nLaporan ini tidak disimpan ke antrean kerja.`,
            message
          );
        } else {
          await sendBotMessage(
            bot,
            chatId,
            '⛔ Laporan Tidak Dapat Diproses\n\nAkun Anda belum terdaftar atau belum disetujui sebagai pelapor resmi di sistem.\n\nSilakan ketik /daftar untuk melakukan pendaftaran akun pelapor terlebih dahulu.',
            message
          );
        }
        return;
      }

      const regionCode = reporter.region_code || (reporter.region_id === 2 ? 'BKT' : 'PDG');
      const telegramMeta = getTelegramMetaFromMessage(message);
      const reportPayload = {
        ticket_id: conciseParsed.data.ticket_id,
        order_id: conciseParsed.data.order_id,
        summary: conciseParsed.data.summary,
        service_id: conciseParsed.data.service_id || null,
        region: regionCode
      };

      const created = await reportModel.createTelegramReport(reportPayload, telegramMeta);
      const reporterCompany = reporter.company || reporter.agency || 'TELKOM';
      const reporterUnit = reporter.unit || 'DAMAN';
      const reporterLabel = ` dari pelapor ${reporter.full_name} (${reporterCompany} - ${reporterUnit} ${regionCode})`;

      await sendBotMessage(
        bot,
        chatId,
        `Tiket ${created.ticketId} | Order ID: ${created.orderId} telah diterima${reporterLabel}, diteruskan ke tim HD Data Management untuk Handling.`,
        message
      );

      await tryLinkPendingMediaFromTicketText(bot, chatId, text, message);
      return;
    }

    const enrichmentParsed = parseTelegramEnrichmentMessage(text);
    const enrichmentHandled = await handleTextEnrichment(bot, message, text, enrichmentParsed);
    if (enrichmentHandled) {
      return;
    }

    const pendingLinkHandled = await tryLinkPendingMediaFromTicketText(bot, chatId, text, message);
    if (pendingLinkHandled) {
      return;
    }

    // Jika di grup dan pesan bukan bagian dari laporan/tiket, abaikan secara silent (anti-spam)
    if (!isGroup) {
      await sendBotMessage(bot, chatId, buildInvalidFormatReply(parsed.errors), message);
    }
    return;
  }

  try {
    const existingByTicket = await reportModel.findByTicketId(parsed.data.ticket_id);
    if (existingByTicket) {
      if (!isReportOwner(existingByTicket, message)) {
        await sendBotMessage(
          bot,
          chatId,
          buildNotReportOwnerReply(existingByTicket.ticket_id, 'memperbarui data tiket'),
          message
        );
        return;
      }

      if (existingByTicket.status_internal === 'perlu_tindak_lanjut') {
        const telegramMeta = getTelegramMetaFromMessage(message);
        await handleFollowUpResubmission(bot, message, text, existingByTicket, parsed.data, telegramMeta);
        return;
      }

      const enrichmentParsed = parseTelegramEnrichmentMessage(text);
      await handleTextEnrichment(bot, message, text, enrichmentParsed);
      return;
    }

    const telegramMeta = getTelegramMetaFromMessage(message);

    const created = await reportModel.createTelegramReport(parsed.data, telegramMeta);

    const reporter = await telegramReporterModel.findByTelegramUserId(message?.from?.id);
    const reporterCompany = reporter?.company || reporter?.agency || 'TELKOM';
    const reporterUnit = reporter?.unit || 'DAMAN';
    const reporterRegion = reporter?.region_code || (reporter?.region_id === 2 ? 'BKT' : 'PDG');
    const reporterLabel = reporter ? ` dari pelapor ${reporter.full_name} (${reporterCompany} - ${reporterUnit} ${reporterRegion})` : '';

    await sendBotMessage(
      bot,
      chatId,
      `Tiket ${created.ticketId} | Order ID: ${created.orderId} telah diterima${reporterLabel}, diteruskan ke tim HD Data Management untuk Handling.`,
      message
    );
  } catch (error) {
    const safeMessage = String(error.message || '');

    if (safeMessage.toLowerCase().includes('ticket id sudah terdaftar')) {
      await sendBotMessage(bot, chatId, 'Ticket ID sudah terdaftar. Laporan duplikat ditolak.', message);
      return;
    }

    if (safeMessage.toLowerCase().includes('region tidak valid')) {
      await sendBotMessage(bot, chatId, 'Region tidak valid. Gunakan REGION: PDG atau REGION: BKT.', message);
      return;
    }

    console.error('Telegram intake error:', error);
    await sendBotMessage(
      bot,
      chatId,
      'Terjadi kendala sistem saat memproses laporan. Silakan coba lagi beberapa saat.',
      message
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

  botInstance = new TelegramBot(token, {
    polling: {
      interval: 100,
      autoStart: true,
      params: {
        timeout: 10
      }
    },
    request: {
      agent: telegramHttpsAgent,
      forever: true
    }
  });

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

  botInstance.setMyCommands([
    { command: 'daftar', description: 'Registrasi akun pelapor resmi' },
    { command: 'status', description: 'Cek status persetujuan akun pelapor' },
    { command: 'format', description: 'Contoh format penulisan laporan gangguan' },
    { command: 'bantuan', description: 'Panduan bantuan dan menu bot' }
  ]).catch((err) => {
    console.warn('Gagal mengatur bot commands:', err.message || err);
  });

  console.log('Telegram bot aktif dalam mode polling.');
  return botInstance;
}

function getTelegramBotInstance() {
  return botInstance;
}

async function notifyReporterApproval(reporter) {
  if (!botInstance || !reporter || !reporter.telegram_chat_id) {
    return false;
  }

  try {
    const regionLabel = reporter.region_code || (reporter.region_id === 2 ? 'BKT' : 'PDG');
    const text = [
      '✅ *PENDAFTARAN DISETUJUI*',
      '',
      `Halo *${reporter.full_name}*,`,
      'Pendaftaran akun Anda sebagai pelapor resmi telah DISETUJUI oleh Super Admin.',
      '',
      `• NIK: ${reporter.nik}`,
      `• Perusahaan: ${reporter.company || reporter.agency || '-'}`,
      `• Unit / Divisi: ${reporter.unit || '-'}`,
      `• Asal Wilayah: ${regionLabel}`,
      '',
      'Sekarang Anda sudah dapat mengirimkan laporan incident gangguan di grup pelaporan.'
    ].join('\n');

    await botInstance.sendMessage(reporter.telegram_chat_id, text, { parse_mode: 'Markdown' });
    return true;
  } catch (error) {
    console.error('Gagal kirim notifikasi approval Telegram:', error.message || error);
    return false;
  }
}

async function notifyReporterRejection(reporter, reason) {
  if (!botInstance || !reporter || !reporter.telegram_chat_id) {
    return false;
  }

  try {
    const text = [
      '❌ *PENDAFTARAN DITOLAK*',
      '',
      `Halo *${reporter.full_name}*,`,
      'Pendaftaran akun Anda sebagai pelapor resmi DITOLAK oleh Super Admin.',
      '',
      `• Alasan: ${reason || 'Data tidak memenuhi ketentuan'}`,
      '',
      'Anda dapat melakukan pendaftaran ulang via Private Chat ke bot ini dengan perintah /daftar.'
    ].join('\n');

    await botInstance.sendMessage(reporter.telegram_chat_id, text, { parse_mode: 'Markdown' });
    return true;
  } catch (error) {
    console.error('Gagal kirim notifikasi rejection Telegram:', error.message || error);
    return false;
  }
}

module.exports = {
  initTelegramBotService,
  getTelegramBotInstance,
  handleIncomingMessage,
  isPrivateChat,
  isGroupChat,
  isSupportedChat,
  sendBotMessage,
  notifyReporterApproval,
  notifyReporterRejection,
  isReportOwner,
  buildNotReportOwnerReply,
  selectOptimalPhoto
};
