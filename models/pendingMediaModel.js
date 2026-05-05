const pool = require('../config/db');

async function createPendingMedia(data) {
  const [result] = await pool.query(
    `
    INSERT INTO telegram_pending_media
    (
      chat_id,
      telegram_message_id,
      telegram_file_id,
      telegram_file_unique_id,
      file_type,
      mime_type,
      original_name,
      stored_name,
      file_path,
      file_size,
      caption,
      status,
      linked_report_id,
      created_at,
      linked_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NOW(), NULL)
    `,
    [
      String(data.chat_id),
      String(data.telegram_message_id),
      data.telegram_file_id || null,
      data.telegram_file_unique_id || null,
      data.file_type || null,
      data.mime_type || null,
      data.original_name || null,
      data.stored_name || null,
      data.file_path || null,
      data.file_size || null,
      data.caption || null
    ]
  );

  return result.insertId;
}

async function getLatestPendingMediaByChatId(chatId) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM telegram_pending_media
    WHERE chat_id = ?
      AND status = 'pending'
    ORDER BY created_at DESC, id DESC
    LIMIT 1
    `,
    [String(chatId)]
  );

  return rows[0] || null;
}

async function markPendingMediaLinked(id, reportId) {
  await pool.query(
    `
    UPDATE telegram_pending_media
    SET
      status = 'linked',
      linked_report_id = ?,
      linked_at = NOW()
    WHERE id = ?
    `,
    [reportId, id]
  );
}

module.exports = {
  createPendingMedia,
  getLatestPendingMediaByChatId,
  markPendingMediaLinked
};
