const pool = require('../config/db');

async function createPendingMedia(data, trxConnection = null) {
  const conn = trxConnection || pool;
  const [result] = await conn.query(
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
      linked_ticket_id,
      created_at,
      linked_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NOW(), NULL)
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

async function getLatestPendingMediaByChatId(chatId, trxConnection = null) {
  const conn = trxConnection || pool;
  const [rows] = await conn.query(
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

async function resolveReportIdentity(identifierOrData, optionalTicketId, conn) {
  let reportId = null;
  let ticketId = null;

  if (identifierOrData && typeof identifierOrData === 'object' && !Array.isArray(identifierOrData)) {
    if (optionalTicketId !== null) {
      throw new Error('Gunakan field ticket_id saat memberikan object identitas laporan.');
    }
    reportId = identifierOrData.report_id ?? null;
    ticketId = identifierOrData.ticket_id ?? null;
  } else if (typeof identifierOrData === 'number'
    || (typeof identifierOrData === 'string' && /^\d+$/.test(identifierOrData.trim()))) {
    reportId = identifierOrData;
    ticketId = optionalTicketId;
  } else {
    if (optionalTicketId !== null) {
      throw new Error('Pasangan identitas laporan harus berisi report_id dan ticket_id.');
    }
    ticketId = identifierOrData;
  }

  if (reportId !== null) {
    if ((typeof reportId !== 'number' && typeof reportId !== 'string')
      || (typeof reportId === 'number' && !Number.isSafeInteger(reportId))
      || !/^0*[1-9]\d*$/.test(String(reportId).trim())) {
      throw new Error('report_id harus berupa bilangan bulat positif yang valid.');
    }
    // Keep BIGINT strings intact instead of converting them to an imprecise Number.
    reportId = String(reportId).trim();
  }

  if (ticketId !== null && (typeof ticketId !== 'string' || !ticketId.trim())) {
    throw new Error('ticket_id harus berupa string yang tidak kosong.');
  }

  if (reportId === null && ticketId === null) {
    throw new Error('Identitas laporan diperlukan untuk menautkan pending media.');
  }

  const [rows] = await conn.query(
    reportId !== null
      ? 'SELECT id, ticket_id FROM reports WHERE id = ? LIMIT 1'
      : 'SELECT id, ticket_id FROM reports WHERE UPPER(TRIM(ticket_id)) = UPPER(TRIM(?)) LIMIT 1',
    [reportId !== null ? reportId : ticketId]
  );
  const report = rows[0];

  if (!report) {
    throw new Error('Laporan tidak ditemukan untuk menautkan pending media.');
  }

  if (report.id == null || typeof report.ticket_id !== 'string' || !report.ticket_id.trim()) {
    throw new Error('Identitas laporan tidak lengkap untuk menautkan pending media.');
  }

  if (ticketId !== null && report.ticket_id.trim().toUpperCase() !== ticketId.trim().toUpperCase()) {
    throw new Error('report_id dan ticket_id tidak merujuk ke laporan yang sama.');
  }

  return { reportId: report.id, ticketId: report.ticket_id };
}

async function markPendingMediaLinked(id, identifierOrData, optionalTicketId = null, trxConnection = null) {
  const conn = trxConnection || pool;
  const { reportId, ticketId } = await resolveReportIdentity(identifierOrData, optionalTicketId, conn);

  await conn.query(
    `
    UPDATE telegram_pending_media
    SET
      status = 'linked',
      linked_report_id = ?,
      linked_ticket_id = ?,
      linked_at = NOW()
    WHERE id = ?
    `,
    [reportId, ticketId, id]
  );
}

module.exports = {
  createPendingMedia,
  getLatestPendingMediaByChatId,
  markPendingMediaLinked
};
