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

module.exports = {
  sendAssignedFeedback,
  sendInProgressFeedback,
  sendCompletedFeedback
};
