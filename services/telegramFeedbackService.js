const { getTelegramBotInstance } = require('./telegramBotService');

function buildAssignedMessage(ticketId, orderId, executorName) {
  return [
    'UPDATE ANDALAS',
    `Tiket ${ticketId}`,
    `Order ID: ${orderId}`,
    `telah diambil (ASSIGNED) oleh ${executorName}.`
  ].join('\n');
}

function buildInProgressMessage(ticketId, orderId, executorName) {
  return [
    'UPDATE ANDALAS',
    `Tiket ${ticketId}`,
    `Order ID: ${orderId}`,
    `sedang dikerjakan (In Progress) oleh ${executorName}.`
  ].join('\n');
}

function buildCompletedMessage(ticketId, orderId) {
  return `Pengerjaan Tiket ${ticketId} Order ID: ${orderId} telah SELESAI dikerjakan, Silahkan cek kembali.`;
}

function buildReturnEvidenceMessage(ticketId, orderId, notes) {
  const returnNotes = typeof notes === 'string' ? notes.trim() : '';
  const messageLines = [
    `Tiket ${ticketId} dikembalikan / perlu tindak lanjut.`,
    `Order ID: ${orderId}`,
    '',
    `Catatan: ${returnNotes || '-'}`,
    '',
    `Silakan perbaiki data laporan Anda dan kirimkan kembali via pesan Telegram ini dengan menyertakan TICKET ID: ${ticketId}.`
  ];

  return messageLines.join('\n');
}

function buildEscalationMessage(ticketId, orderId, diitCode, isReescalation = false) {
  const code = typeof diitCode === 'string' ? diitCode.trim() : '';
  const header = isReescalation
    ? `Tiket ${ticketId} dieskalasikan kembali (Re-eskalasi) ke DIIT.`
    : `Tiket ${ticketId} sedang dieskalasikan ke DIIT.`;
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

function buildReopenedMessage(ticketId, orderId, executorName) {
  return [
    'UPDATE ANDALAS',
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

async function sendMessageToChat(chatId, messageText) {
  const bot = getTelegramBotInstance();

  if (!bot) {
    throw new Error('Telegram bot belum aktif.');
  }

  const targetChatId = resolveFeedbackChatId(chatId);

  if (!targetChatId) {
    throw new Error('telegram_chat_id kosong.');
  }

  await bot.sendMessage(targetChatId, messageText);
}

async function sendAssignedFeedback({ chatId, ticketId, orderId, executorName }) {
  const message = buildAssignedMessage(ticketId, orderId, executorName || 'Eksekutor');
  await sendMessageToChat(chatId, message);
  return message;
}

async function sendInProgressFeedback({ chatId, ticketId, orderId, executorName }) {
  const message = buildInProgressMessage(ticketId, orderId, executorName || 'Eksekutor');
  await sendMessageToChat(chatId, message);
  return message;
}

async function sendCompletedFeedback({ chatId, ticketId, orderId }) {
  const message = buildCompletedMessage(ticketId, orderId);
  await sendMessageToChat(chatId, message);
  return message;
}

async function sendReturnEvidenceFeedback({ chatId, ticketId, orderId, notes }) {
  const message = buildReturnEvidenceMessage(ticketId, orderId, notes);
  await sendMessageToChat(chatId, message);
  return message;
}

async function sendEscalationFeedback({ chatId, ticketId, orderId, diitCode, isReescalation = false }) {
  const message = buildEscalationMessage(ticketId, orderId, diitCode, isReescalation);
  await sendMessageToChat(chatId, message);
  return message;
}

async function sendReopenedFeedback({ chatId, ticketId, orderId, executorName }) {
  const message = buildReopenedMessage(ticketId, orderId, executorName || 'Eksekutor');
  await sendMessageToChat(chatId, message);
  return message;
}

module.exports = {
  resolveFeedbackChatId,
  sendAssignedFeedback,
  sendInProgressFeedback,
  sendCompletedFeedback,
  sendReturnEvidenceFeedback,
  sendEscalationFeedback,
  sendReopenedFeedback
};
