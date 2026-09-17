const pool = require('../config/db');

async function createAttachment(data) {
  const [result] = await pool.query(
    `
    INSERT INTO report_attachments
    (
      report_id,
      source,
      telegram_file_id,
      telegram_file_unique_id,
      file_type,
      mime_type,
      original_name,
      file_name,
      stored_name,
      file_path,
      file_size,
      caption,
      uploaded_by_user_id,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      data.report_id,
      data.source || 'telegram',
      data.telegram_file_id || null,
      data.telegram_file_unique_id || null,
      data.file_type || null,
      data.mime_type || null,
      data.original_name || null,
      data.file_name || data.original_name || data.stored_name || 'telegram-media',
      data.stored_name || null,
      data.file_path || null,
      data.file_size || null,
      data.caption || null,
      data.uploaded_by_user_id || null
    ]
  );

  return result.insertId;
}

async function getAttachmentsByReportId(reportId) {
  const [rows] = await pool.query(
    `
    SELECT
      ra.id,
      ra.report_id,
      ra.source,
      ra.telegram_file_id,
      ra.telegram_file_unique_id,
      ra.file_type,
      ra.mime_type,
      ra.original_name,
      ra.stored_name,
      ra.file_path,
      ra.file_size,
      ra.caption,
      ra.uploaded_by_user_id,
      ra.created_at,
      u.full_name AS uploaded_by_name
    FROM report_attachments ra
    LEFT JOIN users u ON ra.uploaded_by_user_id = u.id
    WHERE ra.report_id = ?
    ORDER BY ra.created_at DESC
    `,
    [reportId]
  );

  return rows;
}

module.exports = {
  createAttachment,
  getAttachmentsByReportId
};
