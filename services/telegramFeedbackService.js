const telegramBotService = require('./telegramBotService');

function formatReporterMention(params = {}) {
  const safeParams = params || {};
  const cleanUsername = typeof safeParams.reporterUsername === 'string' ? safeParams.reporterUsername.trim().replace(/^@/, '') : '';
  if (cleanUsername) {
    return `@${cleanUsername}`;
  }

  const cleanName = typeof safeParams.reporterName === 'string' && safeParams.reporterName.trim()
    ? safeParams.reporterName.trim()
    : (typeof safeParams.reporterFirstName === 'string' && safeParams.reporterFirstName.trim() ? safeParams.reporterFirstName.trim() : '');

  if (cleanName) {
    return cleanName;
  }

  return '';
}

function buildAssignedMessage(ticketId, orderId, executorName, reporterMention = '') {
  const prefix = reporterMention ? `Halo ${reporterMention},\n` : '';
  return [
    `${prefix}UPDATE ANDALAS`,
    `Tiket ${ticketId}`,
    `Order ID: ${orderId}`,
    `telah diambil (ASSIGNED) oleh ${executorName}.`
  ].join('\n');
}

function buildInProgressMessage(ticketId, orderId, executorName, reporterMention = '') {
  const prefix = reporterMention ? `Halo ${reporterMention},\n` : '';
  return [
    `${prefix}UPDATE ANDALAS`,
    `Tiket ${ticketId}`,
    `Order ID: ${orderId}`,
    `sedang dikerjakan (In Progress) oleh ${executorName}.`
  ].join('\n');
}

function buildCompletedMessage(ticketId, orderId, reporterMention = '') {
  const prefix = reporterMention ? `Halo ${reporterMention}, ` : '';
  return `${prefix}Pengerjaan Tiket ${ticketId} Order ID: ${orderId} telah SELESAI dikerjakan, Silahkan cek kembali.`;
}

function buildReturnEvidenceMessage(ticketId, orderId, notes, reporterMention = '') {
  const prefix = reporterMention ? `Halo ${reporterMention},\n` : '';
  const returnNotes = typeof notes === 'string' ? notes.trim() : '';
  const messageLines = [
    `${prefix}Tiket ${ticketId} dikembalikan / perlu tindak lanjut.`,
    `Order ID: ${orderId}`,
    '',
    `Catatan: ${returnNotes || '-'}`,
    '',
    `Silakan perbaiki data laporan Anda dan kirimkan kembali via pesan Telegram ini dengan menyertakan TICKET ID: ${ticketId}.`
  ];

  return messageLines.join('\n');
}

function buildEscalationMessage(ticketId, orderId, diitCode, isReescalation = false, reporterMention = '') {
  const prefix = reporterMention ? `Halo ${reporterMention},\n` : '';
  const code = typeof diitCode === 'string' ? diitCode.trim() : '';
  const header = isReescalation
    ? `${prefix}Tiket ${ticketId} dieskalasikan kembali (Re-eskalasi) ke DIIT.`
    : `${prefix}Tiket ${ticketId} sedang dieskalasikan ke DIIT.`;
  const messageLines = [
    header,
    `Order ID: ${orderId}`,
    '',
    'Kode DIIT:',
    code || '-',
    '',
    'Mohon menunggu proses tindak lanjut berikutnya.'
  ];

  return messageLines.join('\n');
}

function buildReopenedMessage(ticketId, orderId, executorName, reporterMention = '') {
  const prefix = reporterMention ? `Halo ${reporterMention},\n` : '';
  return [
    `${prefix}UPDATE ANDALAS`,
    `Tiket ${ticketId}`,
    `Order ID: ${orderId}`,
    `telah dibuka kembali (Re-open) dan sedang dikerjakan oleh ${executorName}.`
  ].join('\n');
}

function resolveFeedbackChatId(chatId) {
  if (!chatId) {
    return null;
  }
  const cleanId = String(chatId).trim();
  // Chat grup/supergroup/channel pada Telegram selalu bernilai negatif (diawali '-')
  if (cleanId.startsWith('-')) {
    return cleanId;
  }

  // Jika TELEGRAM_GROUP_CHAT_ID terkonfigurasi, prioritaskan pengiriman feedback tiket ke grup
  const configuredGroup = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (configuredGroup && String(configuredGroup).trim().startsWith('-')) {
    return String(configuredGroup).trim();
  }

  return cleanId;
}

async function sendMessageToChat(chatId, messageText, options = {}) {
  const bot = telegramBotService.getTelegramBotInstance();

  if (!bot) {
    throw new Error('Telegram bot belum aktif.');
  }

  const targetChatId = resolveFeedbackChatId(chatId);

  if (!targetChatId) {
    throw new Error('telegram_chat_id kosong.');
  }

  const sendOptions = {};
  if (options && options.reply_to_message_id) {
    sendOptions.reply_to_message_id = options.reply_to_message_id;
  }

  try {
    if (Object.keys(sendOptions).length > 0) {
      await bot.sendMessage(targetChatId, messageText, sendOptions);
    } else {
      await bot.sendMessage(targetChatId, messageText);
    }
  } catch (error) {
    // Jika quote reply gagal (misal pesan asli sudah terhapus di Telegram), coba kirim ulang tanpa reply_to_message_id
    if (sendOptions.reply_to_message_id) {
      await bot.sendMessage(targetChatId, messageText);
      return;
    }
    throw error;
  }
}

async function sendAssignedFeedback({ chatId, ticketId, orderId, executorName, reporterUsername, reporterFirstName, reporterName, messageId }) {
  const mention = formatReporterMention({ reporterUsername, reporterFirstName, reporterName });
  const message = buildAssignedMessage(ticketId, orderId, executorName || 'Eksekutor', mention);
  await sendMessageToChat(chatId, message, { reply_to_message_id: messageId });
  return message;
}

async function sendInProgressFeedback({ chatId, ticketId, orderId, executorName, reporterUsername, reporterFirstName, reporterName, messageId }) {
  const mention = formatReporterMention({ reporterUsername, reporterFirstName, reporterName });
  const message = buildInProgressMessage(ticketId, orderId, executorName || 'Eksekutor', mention);
  await sendMessageToChat(chatId, message, { reply_to_message_id: messageId });
  return message;
}

async function sendCompletedFeedback({ chatId, ticketId, orderId, reporterUsername, reporterFirstName, reporterName, messageId }) {
  const mention = formatReporterMention({ reporterUsername, reporterFirstName, reporterName });
  const message = buildCompletedMessage(ticketId, orderId, mention);
  await sendMessageToChat(chatId, message, { reply_to_message_id: messageId });
  return message;
}

async function sendReturnEvidenceFeedback({ chatId, ticketId, orderId, notes, reporterUsername, reporterFirstName, reporterName, messageId }) {
  const mention = formatReporterMention({ reporterUsername, reporterFirstName, reporterName });
  const message = buildReturnEvidenceMessage(ticketId, orderId, notes, mention);
  await sendMessageToChat(chatId, message, { reply_to_message_id: messageId });
  return message;
}

async function sendEscalationFeedback({ chatId, ticketId, orderId, diitCode, isReescalation = false, reporterUsername, reporterFirstName, reporterName, messageId }) {
  const mention = formatReporterMention({ reporterUsername, reporterFirstName, reporterName });
  const message = buildEscalationMessage(ticketId, orderId, diitCode, isReescalation, mention);
  await sendMessageToChat(chatId, message, { reply_to_message_id: messageId });
  return message;
}

async function sendReopenedFeedback({ chatId, ticketId, orderId, executorName, reporterUsername, reporterFirstName, reporterName, messageId }) {
  const mention = formatReporterMention({ reporterUsername, reporterFirstName, reporterName });
  const message = buildReopenedMessage(ticketId, orderId, executorName || 'Eksekutor', mention);
  await sendMessageToChat(chatId, message, { reply_to_message_id: messageId });
  return message;
}

module.exports = {
  formatReporterMention,
  buildAssignedMessage,
  buildInProgressMessage,
  buildCompletedMessage,
  buildReturnEvidenceMessage,
  buildEscalationMessage,
  buildReopenedMessage,
  resolveFeedbackChatId,
  sendMessageToChat,
  sendAssignedFeedback,
  sendInProgressFeedback,
  sendCompletedFeedback,
  sendReturnEvidenceFeedback,
  sendEscalationFeedback,
  sendReopenedFeedback
};
