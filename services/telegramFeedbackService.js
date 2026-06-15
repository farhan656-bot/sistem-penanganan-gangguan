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
    `Catatan: ${returnNotes || '-'}`
  ];

  return messageLines.join('\n');
}

function buildEscalationMessage(ticketId, orderId, diitCode) {
  const code = typeof diitCode === 'string' ? diitCode.trim() : '';
  const messageLines = [
    `Tiket ${ticketId} sedang dieskalasikan ke DIIT.`,
    `Order ID: ${orderId}`,
    '',
    'Kode DIIT:',
    code || '-',
    '',
    'Mohon menunggu proses tindak lanjut berikutnya.'
  ];

  return messageLines.join('\n');
}

async function sendMessageToChat(chatId, messageText) {
  const bot = getTelegramBotInstance();

  if (!bot) {
    throw new Error('Telegram bot belum aktif.');
  }

  if (!chatId) {
    throw new Error('telegram_chat_id kosong.');
  }

  await bot.sendMessage(chatId, messageText);
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

async function sendEscalationFeedback({ chatId, ticketId, orderId, diitCode }) {
  const message = buildEscalationMessage(ticketId, orderId, diitCode);
  await sendMessageToChat(chatId, message);
  return message;
}

module.exports = {
  sendAssignedFeedback,
  sendInProgressFeedback,
  sendCompletedFeedback,
  sendReturnEvidenceFeedback,
  sendEscalationFeedback
};
