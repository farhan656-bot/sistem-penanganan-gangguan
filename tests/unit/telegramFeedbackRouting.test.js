const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveFeedbackChatId } = require('../../services/telegramFeedbackService');

test('Telegram Feedback Routing: resolveFeedbackChatId', async (t) => {
  const originalEnvGroup = process.env.TELEGRAM_GROUP_CHAT_ID;

  t.after(() => {
    if (originalEnvGroup !== undefined) {
      process.env.TELEGRAM_GROUP_CHAT_ID = originalEnvGroup;
    } else {
      delete process.env.TELEGRAM_GROUP_CHAT_ID;
    }
  });

  await t.test('1. Mengembalikan null jika chatId kosong atau null', () => {
    assert.equal(resolveFeedbackChatId(null), null);
    assert.equal(resolveFeedbackChatId(''), null);
    assert.equal(resolveFeedbackChatId(undefined), null);
  });

  await t.test('2. Mempertahankan chatId grup (negatif) apa pun konfigurasi env', () => {
    process.env.TELEGRAM_GROUP_CHAT_ID = '-1009999999999';
    assert.equal(resolveFeedbackChatId('-1004297518581'), '-1004297518581');
    assert.equal(resolveFeedbackChatId('-4297518581'), '-4297518581');
  });

  await t.test('3. Mengarahkan chatId privat (positif) ke TELEGRAM_GROUP_CHAT_ID jika grup terkonfigurasi', () => {
    process.env.TELEGRAM_GROUP_CHAT_ID = '-1004297518581';
    assert.equal(resolveFeedbackChatId('8148490051'), '-1004297518581');
    assert.equal(resolveFeedbackChatId('5262567223'), '-1004297518581');
  });

  await t.test('4. Fallback ke chatId privat jika TELEGRAM_GROUP_CHAT_ID tidak dikonfigurasi', () => {
    delete process.env.TELEGRAM_GROUP_CHAT_ID;
    assert.equal(resolveFeedbackChatId('8148490051'), '8148490051');
  });
});
