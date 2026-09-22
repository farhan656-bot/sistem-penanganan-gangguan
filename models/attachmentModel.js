const pool = require('../config/db');

async function getTypeIdByCode(code, trxConnection = null) {
  const conn = trxConnection || pool;
  const [rows] = await conn.query(
    'SELECT id FROM type_attachment WHERE code = ?',
    [code]
  );

  if (rows.length === 0) {
    throw new Error(`Tipe lampiran tidak ditemukan untuk kode: ${code}`);
  }

  return rows[0].id;
}

async function resolveAttachmentReportIdentity(data, trxConnection = null) {
  const conn = trxConnection || pool;
  const hasReportId = data.report_id !== undefined && data.report_id !== null;
  const hasTicketId = data.ticket_id !== undefined && data.ticket_id !== null;

  if (!hasReportId && !hasTicketId) {
    throw new Error('Identitas laporan (report_id atau ticket_id) wajib diisi untuk lampiran.');
  }

  // If only one identifier is provided, resolve the counterpart from database
  if (!hasReportId || !hasTicketId) {
    const queryCol = hasReportId ? 'id = ?' : 'ticket_id = ?';
    const queryVal = hasReportId ? data.report_id : data.ticket_id;
    const [rows] = await conn.query(
      `SELECT id, ticket_id FROM reports WHERE ${queryCol} LIMIT 1`,
      [queryVal]
    );
    const report = rows[0];
    if (!report || !report.id || !report.ticket_id) {
      throw new Error('Identitas laporan untuk lampiran tidak ditemukan di database.');
    }
    return { id: report.id, ticket_id: report.ticket_id };
  }

  // If both are provided, return as is
  return { id: data.report_id, ticket_id: data.ticket_id };
}

function resolveAttachmentTypeCode(data) {
  if (data.type_attachment_code && typeof data.type_attachment_code === 'string' && data.type_attachment_code.trim()) {
    return data.type_attachment_code.trim();
  }

  const source = String(data.source || '').trim().toLowerCase();
  if (source === 'telegram' || source === 'bot_telegram' || data.telegram_file_id) {
    return 'bukti_pelapor';
  }

  return 'bukti_penanganan';
}

async function createAttachment(data, trxConnection = null) {
  const conn = trxConnection || pool;
  const reportIdentity = await resolveAttachmentReportIdentity(data, conn);
  const typeCode = resolveAttachmentTypeCode(data);
  const typeAttachmentId = await getTypeIdByCode(
    typeCode,
    conn
  );
  const [result] = await conn.query(
    `
    INSERT INTO report_attachments
    (
      report_id,
      ticket_id,
      type_attachment_id,
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      reportIdentity.id,
      reportIdentity.ticket_id,
      typeAttachmentId,
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


async function getAttachmentsByTicketId(ticketId, trxConnection = null) {
  const conn = trxConnection || pool;
  const [rows] = await conn.query(
    `
    SELECT
      ra.id,
      ra.report_id,
      ra.ticket_id,
      ra.type_attachment_id,
      ta.code AS type_attachment_code,
      ta.name AS type_attachment_name,
      ra.source,
      ra.telegram_file_id,
      ra.telegram_file_unique_id,
      ra.file_type,
      ra.mime_type,
      ra.original_name,
      ra.file_name,
      ra.stored_name,
      ra.file_path,
      ra.file_size,
      ra.caption,
      ra.uploaded_by_user_id,
      ra.created_at,
      u.full_name AS uploaded_by_name
    FROM report_attachments ra
    LEFT JOIN type_attachment ta ON ra.type_attachment_id = ta.id
    LEFT JOIN users u ON ra.uploaded_by_user_id = u.id
    WHERE ra.ticket_id = ?
    ORDER BY ra.created_at DESC
    `,
    [ticketId]
  );

  return rows;
}

async function getAttachmentsByReportId(reportId, trxConnection = null) {
  const conn = trxConnection || pool;
  const [rows] = await conn.query(
    `
    SELECT
      ra.id,
      ra.report_id,
      ra.ticket_id,
      ra.type_attachment_id,
      ta.code AS type_attachment_code,
      ta.name AS type_attachment_name,
      ra.source,
      ra.telegram_file_id,
      ra.telegram_file_unique_id,
      ra.file_type,
      ra.mime_type,
      ra.original_name,
      ra.file_name,
      ra.stored_name,
      ra.file_path,
      ra.file_size,
      ra.caption,
      ra.uploaded_by_user_id,
      ra.created_at,
      u.full_name AS uploaded_by_name
    FROM report_attachments ra
    LEFT JOIN type_attachment ta ON ra.type_attachment_id = ta.id
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
  getTypeIdByCode,
  resolveAttachmentReportIdentity,
  resolveAttachmentTypeCode,
  getAttachmentsByTicketId,
  getAttachmentsByReportId
};
