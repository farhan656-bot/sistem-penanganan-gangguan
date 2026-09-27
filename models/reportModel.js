const path = require('path');
const pool = require('../config/db');
const regionSwitchModel = require('./regionSwitchModel');
const attachmentModel = require('./attachmentModel');

const ALLOWED_FINAL_STATUSES = ['selesai', 'perlu_tindak_lanjut', 'eskalasi'];
const OPPOSITE_REGION_MAP = {
  PDG: 'BKT',
  BKT: 'PDG'
};
const TELEGRAM_TEXT_ENRICHMENT_FIELDS = [
  'branch_name',
  'cluster_name',
  'sto',
  'provider',
  'service_type',
  'segment',
  'telkom_area',
  'service_id',
  'status_wfm',
  'status_andalas',
  'wo_number',
  'fallout_type'
];
const COORDINATOR_ALLOWED_REGION_CODES = ['PDG', 'BKT'];
const PUBLIC_DIR = path.join(__dirname, '../public');
const WORK_STATUS_STATUS_MAP = Object.freeze({
  all: null,
  available: ['baru', 'tersedia'],
  in_progress: ['diambil', 'didelegasikan'],
  completed: ['selesai'],
  follow_up: ['perlu_tindak_lanjut'],
  escalated: ['eskalasi']
});

function getCurrentUserRole(currentUser = {}) {
  return String(currentUser.role || currentUser.role_name || '').trim().toLowerCase();
}

function normalizeRegionCode(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function buildPlaceholders(values) {
  return values.map(() => '?').join(', ');
}

async function getCoordinatorAllowedRegions(db = pool) {
  const placeholders = buildPlaceholders(COORDINATOR_ALLOWED_REGION_CODES);
  const [rows] = await db.query(
    `
    SELECT id, code
    FROM regions
    WHERE code IN (${placeholders})
    `,
    COORDINATOR_ALLOWED_REGION_CODES
  );

  return rows
    .map((row) => ({
      id: Number(row.id),
      code: normalizeRegionCode(row.code)
    }))
    .filter((row) => row.id && row.code);
}

async function getCoordinatorAllowedRegionIds(db = pool) {
  const allowedRegions = await getCoordinatorAllowedRegions(db);
  return allowedRegions.map((region) => region.id);
}

async function getExecutorAllowedRegionIds(currentUser = {}) {
  const extraRegionIds = await regionSwitchModel.getActiveExtraRegionsByUserId(currentUser.id);

  return [...new Set([currentUser.region_id, ...extraRegionIds]
    .map((regionId) => Number(regionId))
    .filter((regionId) => Number.isFinite(regionId) && regionId > 0))];
}

async function buildReportListAccessContext(currentUser = {}) {
  const role = getCurrentUserRole(currentUser);

  if (role !== 'eksekutor') {
    return {
      role,
      regionIds: []
    };
  }

  return {
    role,
    regionIds: await getExecutorAllowedRegionIds(currentUser)
  };
}

function appendRegionIdAccessCondition(sql, regionIds) {
  if (regionIds.length === 0) {
    return `${sql} AND 1=0 `;
  }

  const placeholders = buildPlaceholders(regionIds);
  return `${sql} AND reports.reported_region_id IN (${placeholders}) `;
}

async function ensureCoordinatorCanAccessReportRegion(regionId, db = pool) {
  const allowedRegionIds = await getCoordinatorAllowedRegionIds(db);
  const hasAccess = allowedRegionIds.some(
    (allowedRegionId) => Number(allowedRegionId) === Number(regionId)
  );

  if (!hasAccess) {
    throw new Error('Laporan berada di luar akses Koordinator PDG/BKT.');
  }
}

function normalizeFinalStatus(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeOptionalField(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeOptionalTelegramMetaField(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function normalizeUploadedFiles(fileData) {
  if (Array.isArray(fileData)) {
    return fileData.filter(Boolean);
  }

  return fileData ? [fileData] : [];
}

function sanitizeAttachmentFileName(file) {
  const rawName = file && (file.safeOriginalName || file.originalname)
    ? file.safeOriginalName || file.originalname
    : 'bukti-penyelesaian';
  const baseName = path.basename(String(rawName));
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 120);

  return sanitized || 'bukti-penyelesaian';
}

function buildPublicUploadPath(file) {
  if (file && file.path) {
    const relativePath = path.relative(PUBLIC_DIR, file.path);

    if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
      return `/${relativePath.split(path.sep).join('/')}`;
    }
  }

  return `/uploads/completion/${file.filename}`;
}

function normalizeComparableValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim().replace(/\s+/g, ' ').toUpperCase();
}

function isEmptyValue(value) {
  if (value === null || value === undefined) {
    return true;
  }

  return String(value).trim() === '';
}

function buildTelegramTextEnrichmentDescription({
  rawText,
  updates,
  conflicts,
  unchanged,
  telegramMeta
}) {
  const safeRawText = typeof rawText === 'string' ? rawText.replace(/\r?\n/g, '\\n') : '-';
  const meta = telegramMeta || {};

  return [
    `Raw Text: ${safeRawText || '-'}`,
    `Updates: ${JSON.stringify(updates || {})}`,
    `Conflicts: ${JSON.stringify(conflicts || [])}`,
    `Unchanged: ${JSON.stringify(unchanged || [])}`,
    `Chat ID: ${meta.chat_id || '-'}`,
    `Message ID: ${meta.message_id || '-'}`,
    `Reporter: ${meta.reporter_name || '-'}`,
    `Username: ${meta.username || '-'}`
  ].join(' | ');
}

function pickTelegramTextEnrichmentFields(fields) {
  const picked = {};
  const source = fields || {};

  for (const field of TELEGRAM_TEXT_ENRICHMENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      picked[field] = source[field];
    }
  }

  return picked;
}

function getCompletionLogMeta(finalStatus) {
  if (finalStatus === 'perlu_tindak_lanjut') {
    return {
      action: 'follow_up_report',
      label: 'perlu tindak lanjut'
    };
  }

  if (finalStatus === 'eskalasi') {
    return {
      action: 'escalate_report',
      label: 'eskalasi'
    };
  }

  return {
    action: 'complete_report',
    label: 'selesai'
  };
}

async function applyReportListScope(
  sql,
  params,
  { search = '', region = '' },
  currentUser,
  accessContext = null
) {
  const context = accessContext || await buildReportListAccessContext(currentUser);
  const currentUserRole = context.role || getCurrentUserRole(currentUser);
  const selectedRegionCode = normalizeRegionCode(region);

  if (currentUserRole === 'koordinator') {
    const allowedRegionCodes = selectedRegionCode
      ? COORDINATOR_ALLOWED_REGION_CODES.filter((code) => code === selectedRegionCode)
      : COORDINATOR_ALLOWED_REGION_CODES;

    if (allowedRegionCodes.length === 0) {
      sql += ' AND 1=0 ';
    } else {
      sql += ` AND regions.code IN (${buildPlaceholders(allowedRegionCodes)}) `;
      params.push(...allowedRegionCodes);
    }
  }

  if (currentUserRole === 'eksekutor') {
    const regionIds = Array.isArray(context.regionIds) ? context.regionIds : [];

    if (regionIds.length > 0) {
      const placeholders = buildPlaceholders(regionIds);
      sql += ` AND (
        reports.reported_region_id IN (${placeholders})
        OR ra.assigned_to_user_id = ?
      ) `;
      params.push(...regionIds, currentUser.id);
    } else {
      sql += ` AND ra.assigned_to_user_id = ? `;
      params.push(currentUser.id);
    }
  }

  if (search) {
    sql += ` AND (
      reports.ticket_id LIKE ?
      OR reports.order_id LIKE ?
      OR reports.summary LIKE ?
      OR reports.sto LIKE ?
      OR reports.branch_name LIKE ?
    ) `;
    const keyword = `%${search}%`;
    params.push(keyword, keyword, keyword, keyword, keyword);
  }

  if (currentUserRole !== 'koordinator' && selectedRegionCode) {
    sql += ` AND regions.code = ? `;
    params.push(selectedRegionCode);
  }

  return { sql, params };
}

function applyWorkStatusFilter(sql, params, workStatus) {
  const statuses = WORK_STATUS_STATUS_MAP[workStatus];

  if (!Array.isArray(statuses) || statuses.length === 0) {
    return { sql, params };
  }

  sql += ` AND reports.status_internal IN (${buildPlaceholders(statuses)}) `;
  params.push(...statuses);

  return { sql, params };
}

async function getReports(
  { search = '', region = '', workStatus = 'all', limit = 10, offset = 0 },
  currentUser,
  accessContext = null
) {
  let sql = `
    SELECT
      reports.ticket_id,
      reports.received_at,
      reports.order_id,
      reports.service_type,
      reports.provider,
      reports.branch_name,
      reports.cluster_name,
      reports.sto,
      reports.summary,
      reports.status_internal,
      ra.assigned_to_user_id,
      regions.code AS region_code,
      users.full_name AS assigned_user_name
    FROM reports
    LEFT JOIN regions ON reports.reported_region_id = regions.id
    LEFT JOIN report_assignments ra ON ra.ticket_id = reports.ticket_id AND ra.is_active = 1
    LEFT JOIN users ON ra.assigned_to_user_id = users.id
    WHERE 1=1
  `;
  const params = [];
  const scopedQuery = await applyReportListScope(
    sql,
    params,
    { search, region },
    currentUser,
    accessContext
  );
  const filteredQuery = applyWorkStatusFilter(
    scopedQuery.sql,
    scopedQuery.params,
    Object.prototype.hasOwnProperty.call(WORK_STATUS_STATUS_MAP, workStatus) ? workStatus : 'all'
  );
  const normalizedLimit = Number.isSafeInteger(Number(limit)) && Number(limit) > 0
    ? Number(limit)
    : 10;
  const normalizedOffset = Number.isSafeInteger(Number(offset)) && Number(offset) >= 0
    ? Number(offset)
    : 0;

  sql = `${filteredQuery.sql} ORDER BY reports.received_at DESC, reports.ticket_id DESC LIMIT ? OFFSET ? `;
  filteredQuery.params.push(normalizedLimit, normalizedOffset);

  const [rows] = await pool.query(sql, filteredQuery.params);
  for (const row of rows) {
    row.current_assigned_user_id = row.assigned_to_user_id;
  }
  return rows;
}

async function getReportCount(
  { search = '', region = '', workStatus = 'all' },
  currentUser,
  accessContext = null
) {
  let sql = `
    SELECT COUNT(*) AS total
    FROM reports
    LEFT JOIN regions ON reports.reported_region_id = regions.id
    LEFT JOIN report_assignments ra ON ra.ticket_id = reports.ticket_id AND ra.is_active = 1
    WHERE 1=1
  `;
  const params = [];
  const scopedQuery = await applyReportListScope(
    sql,
    params,
    { search, region },
    currentUser,
    accessContext
  );
  const filteredQuery = applyWorkStatusFilter(
    scopedQuery.sql,
    scopedQuery.params,
    Object.prototype.hasOwnProperty.call(WORK_STATUS_STATUS_MAP, workStatus) ? workStatus : 'all'
  );
  const [rows] = await pool.query(filteredQuery.sql, filteredQuery.params);

  return Number(rows[0] && rows[0].total) || 0;
}

async function getReportWorkStatusCounts(
  { search = '', region = '' },
  currentUser,
  accessContext = null
) {
  let sql = `
    SELECT
      COUNT(*) AS total_all,
      COALESCE(SUM(CASE WHEN reports.status_internal IN ('baru', 'tersedia') THEN 1 ELSE 0 END), 0) AS available,
      COALESCE(SUM(CASE WHEN reports.status_internal IN ('diambil', 'didelegasikan') THEN 1 ELSE 0 END), 0) AS in_progress,
      COALESCE(SUM(CASE WHEN reports.status_internal = 'selesai' THEN 1 ELSE 0 END), 0) AS completed,
      COALESCE(SUM(CASE WHEN reports.status_internal = 'perlu_tindak_lanjut' THEN 1 ELSE 0 END), 0) AS follow_up,
      COALESCE(SUM(CASE WHEN reports.status_internal = 'eskalasi' THEN 1 ELSE 0 END), 0) AS escalated
    FROM reports
    LEFT JOIN regions ON reports.reported_region_id = regions.id
    LEFT JOIN report_assignments ra ON ra.ticket_id = reports.ticket_id AND ra.is_active = 1
    WHERE 1=1
  `;
  const params = [];
  const scopedQuery = await applyReportListScope(
    sql,
    params,
    { search, region },
    currentUser,
    accessContext
  );
  const [rows] = await pool.query(scopedQuery.sql, scopedQuery.params);
  const counts = rows[0] || {};

  return {
    all: Number(counts.total_all) || 0,
    available: Number(counts.available) || 0,
    in_progress: Number(counts.in_progress) || 0,
    completed: Number(counts.completed) || 0,
    follow_up: Number(counts.follow_up) || 0,
    escalated: Number(counts.escalated) || 0
  };
}

async function getNewReportStats(
  { sinceReceivedAt = null, sinceTicketId = '', sinceId = 0, search = '', region = '', workStatus = 'all' },
  currentUser,
  accessContext = null
) {
  const normalizedSinceId = Number.isSafeInteger(Number(sinceId)) && Number(sinceId) >= 0
    ? Number(sinceId)
    : 0;
  // Date parameters use the same mysql2 timezone conversion as report reads.
  const sinceDate = sinceReceivedAt ? new Date(sinceReceivedAt) : null;
  if (sinceDate && !Number.isFinite(sinceDate.getTime())) {
    throw new Error('Cursor received_at tidak valid.');
  }
  if (typeof sinceTicketId !== 'string' || sinceTicketId.length > 100) {
    throw new Error('Cursor ticket_id tidak valid.');
  }
  const cursorDate = sinceDate || new Date(0);
  const cursorTicketId = typeof sinceTicketId === 'string' ? sinceTicketId : '';
  const cursorPredicate = `(
    COALESCE(reports.received_at, reports.created_at) > ?
    OR (
      COALESCE(reports.received_at, reports.created_at) = ?
      AND reports.ticket_id > ?
    )
  )`;
  let sql = `
    FROM reports
    LEFT JOIN regions ON reports.reported_region_id = regions.id
    LEFT JOIN report_assignments ra ON ra.ticket_id = reports.ticket_id AND ra.is_active = 1
    WHERE ${cursorPredicate}
      AND reports.source_channel = 'telegram'
  `;
  const params = [cursorDate, cursorDate, cursorTicketId];
  const scopedQuery = await applyReportListScope(
    sql,
    params,
    { search, region },
    currentUser,
    accessContext
  );
  const filteredQuery = applyWorkStatusFilter(
    scopedQuery.sql,
    scopedQuery.params,
    Object.prototype.hasOwnProperty.call(WORK_STATUS_STATUS_MAP, workStatus) ? workStatus : 'all'
  );
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS new_count
    ${filteredQuery.sql}`,
    filteredQuery.params
  );
  const stats = rows[0] || {};
  const newCount = Number(stats.new_count) || 0;
  let latestCursor = null;

  if (newCount > 0) {
    const [cursorRows] = await pool.query(
      `SELECT
        COALESCE(reports.received_at, reports.created_at) AS latest_received_at,
        reports.ticket_id AS latest_ticket_id
      ${filteredQuery.sql}
      ORDER BY COALESCE(reports.received_at, reports.created_at) DESC, reports.ticket_id DESC
      LIMIT 1`,
      filteredQuery.params
    );
    latestCursor = cursorRows[0] || null;
  }

  return {
    newCount,
    latestReportId: 0,
    latest_received_at: latestCursor ? latestCursor.latest_received_at : sinceDate,
    latest_ticket_id: latestCursor ? latestCursor.latest_ticket_id : (sinceDate ? sinceTicketId : '')
  };
}

async function getLatestReportId(
  { search = '', region = '', workStatus = 'all' },
  currentUser,
  accessContext = null
) {
  return 0;
}

async function createTelegramReport(parsedData, telegramMeta) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const ticketId = typeof parsedData.ticket_id === 'string' ? parsedData.ticket_id.trim() : '';
    const orderId = typeof parsedData.order_id === 'string' ? parsedData.order_id.trim() : '';
    const summary = typeof parsedData.summary === 'string' ? parsedData.summary.trim() : '';
    const regionCode = typeof parsedData.region === 'string' ? parsedData.region.trim().toUpperCase() : '';
    const meta = telegramMeta || {};

    if (!ticketId || !orderId || !summary || !regionCode) {
      throw new Error('Data wajib intake Telegram tidak lengkap.');
    }

    const [duplicateRows] = await connection.query(
      `
      SELECT ticket_id
      FROM reports
      WHERE ticket_id = ?
      LIMIT 1
      `,
      [ticketId]
    );

    if (duplicateRows.length > 0) {
      throw new Error('Ticket ID sudah terdaftar. Gunakan Ticket ID yang unik.');
    }

    const [regionRows] = await connection.query(
      `
      SELECT id, code
      FROM regions
      WHERE code = ?
      LIMIT 1
      `,
      [regionCode]
    );

    if (regionRows.length === 0) {
      throw new Error('Region tidak valid. Gunakan kode region yang tersedia, misalnya PDG atau BKT.');
    }

    const selectedRegion = regionRows[0];
    const telegramSenderId = normalizeOptionalTelegramMetaField(meta.sender_id ?? meta.telegram_sender_id);
    const telegramSenderUsername = normalizeOptionalTelegramMetaField(
      meta.sender_username ?? meta.telegram_sender_username ?? meta.username ?? meta.reporter_username
    );
    const telegramSenderFirstName = normalizeOptionalTelegramMetaField(
      meta.sender_first_name ?? meta.telegram_sender_first_name
    );
    const telegramSenderLastName = normalizeOptionalTelegramMetaField(
      meta.sender_last_name ?? meta.telegram_sender_last_name
    );

    const [insertResult] = await connection.query(
      `
      INSERT INTO reports
      (
        source_channel,
        fallout_type,
        ticket_id,
        order_id,
        wo_number,
        service_type,
        segment,
        provider,
        telkom_area,
        branch_name,
        cluster_name,
        sto,
        summary,
        service_id,
        status_wfm,
        status_andalas,
        status_internal,
        reported_region_id,
        telegram_chat_id,
        telegram_message_id,
        telegram_sender_id,
        telegram_sender_username,
        telegram_sender_first_name,
        telegram_sender_last_name,
        received_at,
        created_at,
        updated_at
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'tersedia', ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
      `,
      [
        'telegram',
        normalizeOptionalField(parsedData.fallout_type),
        ticketId,
        orderId,
        normalizeOptionalField(parsedData.wo_number),
        normalizeOptionalField(parsedData.service_type),
        normalizeOptionalField(parsedData.segment),
        normalizeOptionalField(parsedData.provider),
        normalizeOptionalField(parsedData.telkom_area),
        normalizeOptionalField(parsedData.branch_name),
        normalizeOptionalField(parsedData.cluster_name),
        normalizeOptionalField(parsedData.sto),
        summary,
        normalizeOptionalField(parsedData.service_id),
        normalizeOptionalField(parsedData.status_wfm),
        normalizeOptionalField(parsedData.status_andalas),
        selectedRegion.id,
        String(meta.chat_id),
        String(meta.message_id),
        telegramSenderId,
        telegramSenderUsername,
        telegramSenderFirstName,
        telegramSenderLastName
      ]
    );

    await createReportLog({
      ticket_id: ticketId,
      user_id: null,
      action: 'create_telegram_report',
      description: `Laporan dari Telegram diterima dengan ticket_id ${ticketId}, order_id ${orderId}, source telegram, chat_id ${meta.chat_id}.`
    }, connection);

    await connection.commit();

    return {
      success: true,
      reportId: insertResult.insertId || ticketId,
      id: insertResult.insertId || null,
      ticketId,
      orderId,
      regionCode: selectedRegion.code
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findByTicketId(ticketId) {
  const normalizedTicketId = typeof ticketId === 'string' ? ticketId.trim() : '';

  if (!normalizedTicketId) {
    return null;
  }

  const [rows] = await pool.query(
    `
    SELECT
      ticket_id,
      order_id,
      telegram_chat_id,
      telegram_message_id,
      status_internal
    FROM reports
    WHERE UPPER(TRIM(ticket_id)) = UPPER(TRIM(?))
    LIMIT 1
    `,
    [normalizedTicketId]
  );

  return rows[0] || null;
}


async function getTelegramFeedbackPayload(ticketIdOrId) {
  const normalizedTicketId = typeof ticketIdOrId === 'string' ? ticketIdOrId.trim() : String(ticketIdOrId || '').trim();

  const [rows] = await pool.query(
    `
    SELECT
      reports.ticket_id,
      reports.order_id,
      reports.diit_code,
      reports.telegram_chat_id,
      reports.telegram_message_id
    FROM reports
    WHERE reports.ticket_id = ?
    LIMIT 1
    `,
    [normalizedTicketId]
  );

  return rows[0] || null;
}

async function getTelegramFeedbackPayloadByReportId(reportId) {
  return getTelegramFeedbackPayload(reportId);
}

async function logTelegramFeedback(ticketIdOrId, action, description, userId = null) {
  const logData = { ticket_id: String(ticketIdOrId).trim(), user_id: userId, action, description };
  await createReportLog(logData);
}

async function storeTelegramAdditionalData(ticketIdOrId, payload) {
  const rawText = typeof payload.raw_text === 'string' ? payload.raw_text.trim() : '';

  if (!rawText && !payload.media_metadata) {
    throw new Error('Data tambahan Telegram kosong.');
  }

  const description = [
    `Mode: ${payload.mode || 'text'}`,
    `Chat ID: ${payload.telegram_meta && payload.telegram_meta.chat_id ? payload.telegram_meta.chat_id : '-'}`,
    `Message ID: ${payload.telegram_meta && payload.telegram_meta.message_id ? payload.telegram_meta.message_id : '-'}`,
    `Reporter: ${payload.telegram_meta && payload.telegram_meta.reporter_name ? payload.telegram_meta.reporter_name : '-'}`,
    `Username: ${payload.telegram_meta && payload.telegram_meta.username ? payload.telegram_meta.username : '-'}`,
    `Pesan: ${rawText || '-'}`,
    `Media Metadata: ${payload.media_metadata ? JSON.stringify(payload.media_metadata) : '-'}`
  ].join(' | ');

  const logData = { ticket_id: String(ticketIdOrId).trim(), user_id: null, action: 'telegram_additional_data_received', description };

  await createReportLog(logData);

  return {
    success: true,
    reportId: ticketIdOrId
  };
}

async function logTelegramTextEnrichmentFailure(ticketIdOrId, payload) {
  const description = buildTelegramTextEnrichmentDescription({
    rawText: payload.raw_text,
    updates: {},
    conflicts: payload.conflicts || [],
    unchanged: payload.unchanged || [],
    telegramMeta: payload.telegram_meta
  });

  if (!ticketIdOrId) {
    console.warn(
      'Skip report_logs insert: telegram enrichment gagal untuk ticket yang belum terdaftar.',
      description
    );
    return;
  }

  try {
    const logData = { ticket_id: String(ticketIdOrId).trim(), user_id: null, action: 'telegram_text_enrichment_failed', description };

    await createReportLog(logData);
  } catch (error) {
    console.error('Gagal mencatat log enrichment gagal:', error.message || error);
  }
}

async function applyTelegramTextEnrichment(ticketIdOrId, payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT
        ticket_id,
        branch_name,
        cluster_name,
        sto,
        provider,
        service_type,
        segment,
        telkom_area,
        service_id,
        status_wfm,
        status_andalas,
        wo_number,
        fallout_type
      FROM reports
      WHERE ticket_id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [String(ticketIdOrId).trim()]
    );

    if (rows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = rows[0];
    const incoming = pickTelegramTextEnrichmentFields(payload.fields || {});
    const updates = {};
    const unchanged = [];
    const conflicts = [];

    for (const field of TELEGRAM_TEXT_ENRICHMENT_FIELDS) {
      const incomingValue = normalizeOptionalField(incoming[field]);

      if (!incomingValue) {
        continue;
      }

      const existingValue = report[field];

      if (isEmptyValue(existingValue)) {
        updates[field] = incomingValue;
        continue;
      }

      if (normalizeComparableValue(existingValue) === normalizeComparableValue(incomingValue)) {
        unchanged.push(field);
        continue;
      }

      conflicts.push({
        field,
        existing: existingValue,
        incoming: incomingValue
      });
    }

    if (Object.keys(updates).length > 0) {
      const updateFields = Object.keys(updates);
      const setClauses = updateFields.map((field) => `${field} = ?`);
      const values = updateFields.map((field) => updates[field]);

      await connection.query(
        `
        UPDATE reports
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE ticket_id = ?
        `,
        [...values, report.ticket_id]
      );
    }

    const status =
      conflicts.length > 0
        ? 'conflict'
        : Object.keys(updates).length > 0
          ? 'applied'
          : 'no_change';

    const actionMap = {
      applied: 'telegram_text_enrichment_applied',
      no_change: 'telegram_text_enrichment_no_change',
      conflict: 'telegram_text_enrichment_conflict'
    };

    const description = buildTelegramTextEnrichmentDescription({
      rawText: payload.raw_text,
      updates,
      conflicts,
      unchanged,
      telegramMeta: payload.telegram_meta
    });

    await createReportLog({
      ticket_id: report.ticket_id,
      user_id: null,
      action: actionMap[status],
      description
    }, connection);

    await connection.commit();

    return {
      status,
      ticketId: report.ticket_id,
      updatedFields: Object.keys(updates),
      unchangedFields: unchanged,
      conflicts
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getReportByTicketId(ticketId, currentUser) {
  const currentUserRole = getCurrentUserRole(currentUser);
  let sql = `
    SELECT
      reports.*,
      rr.code AS reported_region_code,
      rr.name AS reported_region_name,
      rr.code AS region_code,
      rr.name AS region_name,
      ra.assigned_to_user_id,
      u.full_name AS assigned_user_name
    FROM reports
    LEFT JOIN regions rr ON reports.reported_region_id = rr.id
    LEFT JOIN report_assignments ra ON ra.ticket_id = reports.ticket_id AND ra.is_active = 1
    LEFT JOIN users u ON ra.assigned_to_user_id = u.id
    WHERE reports.ticket_id = ?
  `;

  const params = [ticketId];

  if (currentUserRole === 'koordinator') {
    const allowedRegionIds = await getCoordinatorAllowedRegionIds();

    sql = appendRegionIdAccessCondition(sql, allowedRegionIds);
    params.push(...allowedRegionIds);
  }

  if (currentUserRole === 'eksekutor') {
    const allowedRegionIds = await getExecutorAllowedRegionIds(currentUser);

    if (allowedRegionIds.length > 0) {
      const placeholders = buildPlaceholders(allowedRegionIds);
      sql += ` AND (
        reports.reported_region_id IN (${placeholders})
        OR ra.assigned_to_user_id = ?
      ) `;
      params.push(...allowedRegionIds, currentUser.id);
    } else {
      sql += ` AND ra.assigned_to_user_id = ? `;
      params.push(currentUser.id);
    }
  }

  const [rows] = await pool.query(sql, params);
  const row = rows[0] || null;
  if (row) {
    row.current_region_code = row.reported_region_code;
    row.current_region_name = row.reported_region_name;
    row.current_assigned_user_id = row.assigned_to_user_id;
  }
  return row;
}

async function getReportById(reportIdOrTicketId, currentUser) {
  const isNumeric = /^\d+$/.test(String(reportIdOrTicketId).trim());
  if (!isNumeric) {
    return getReportByTicketId(reportIdOrTicketId, currentUser);
  }

  const [rows] = await pool.query(
    'SELECT ticket_id FROM reports WHERE id = ? LIMIT 1',
    [reportIdOrTicketId]
  );
  if (rows.length === 0) {
    return null;
  }
  return getReportByTicketId(rows[0].ticket_id, currentUser);
}

async function takeReport(ticketIdOrId, currentUser) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const currentUserRole = getCurrentUserRole(currentUser);
    const normalizedTicketId = typeof ticketIdOrId === 'string' ? ticketIdOrId.trim() : String(ticketIdOrId || '').trim();

    const [rows] = await connection.query(
      `
      SELECT
        ticket_id,
        status_internal,
        reported_region_id
      FROM reports
      WHERE ticket_id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [normalizedTicketId]
    );

    if (rows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = rows[0];

    if (report.status_internal !== 'tersedia') {
      throw new Error('Laporan sudah tidak tersedia untuk diambil.');
    }

    const [activeAssignmentRows] = await connection.query(
      `
      SELECT id, assigned_to_user_id
      FROM report_assignments
      WHERE ticket_id = ? AND is_active = 1
      LIMIT 1
      FOR UPDATE
      `,
      [report.ticket_id]
    );

    if (activeAssignmentRows.length > 0) {
      throw new Error('Laporan sudah memiliki penanggung jawab.');
    }

    if (currentUserRole === 'koordinator') {
      await ensureCoordinatorCanAccessReportRegion(report.reported_region_id, connection);
    }

    if (currentUserRole === 'eksekutor') {
      const allowedRegionIds = await getExecutorAllowedRegionIds(currentUser);
      const canAccessReportRegion = allowedRegionIds.some(
        (regionId) => Number(regionId) === Number(report.reported_region_id)
      );

      if (!canAccessReportRegion) {
        throw new Error('Anda tidak dapat mengambil laporan di luar wilayah aktif Anda.');
      }
    }

    const assignmentNotes = currentUserRole === 'koordinator'
      ? 'Laporan diambil oleh koordinator untuk membantu penanganan.'
      : 'Laporan diambil sendiri oleh eksekutor.';

    await connection.query(
      `
      UPDATE reports
      SET
        status_internal = 'diambil',
        taken_at = NOW(),
        updated_at = NOW()
      WHERE ticket_id = ?
      `,
      [report.ticket_id]
    );

    await connection.query(
      `
      INSERT INTO report_assignments
      (
        ticket_id,
        assigned_to_user_id,
        assigned_by_user_id,
        assignment_type,
        notes,
        is_active,
        assigned_at
      )
      VALUES (?, ?, ?, 'self_take', ?, 1, NOW())
      `,
      [
        report.ticket_id,
        currentUser.id,
        currentUser.id,
        assignmentNotes
      ]
    );

    await createReportLog({
      ticket_id: report.ticket_id,
      user_id: currentUser.id,
      action: 'take_report',
      description: `Laporan diambil oleh ${currentUser.full_name}.`
    }, connection);

    await connection.commit();

    return {
      success: true,
      message: `Laporan ${report.ticket_id} berhasil diambil.`
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function completeReport(ticketIdOrId, currentUser, formData, fileData) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const normalizedTicketId = typeof ticketIdOrId === 'string' ? ticketIdOrId.trim() : String(ticketIdOrId || '').trim();
    const [rows] = await connection.query(
      `
      SELECT
        ticket_id,
        status_internal,
        reported_region_id
      FROM reports
      WHERE ticket_id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [normalizedTicketId]
    );

    if (rows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = rows[0];

    if (!['diambil', 'didelegasikan'].includes(report.status_internal)) {
      throw new Error('Laporan belum berada pada status yang dapat diselesaikan.');
    }

    if (getCurrentUserRole(currentUser) === 'koordinator') {
      await ensureCoordinatorCanAccessReportRegion(report.reported_region_id, connection);
    } else {
      const [assignmentRows] = await connection.query(
        `
        SELECT assigned_to_user_id
        FROM report_assignments
        WHERE ticket_id = ?
          AND is_active = 1
        ORDER BY id DESC
        LIMIT 1
        `,
        [report.ticket_id]
      );

      const activeAssignedUserId = assignmentRows.length > 0
        ? assignmentRows[0].assigned_to_user_id
        : null;

      if (!activeAssignedUserId || Number(activeAssignedUserId) !== Number(currentUser.id)) {
        throw new Error('Anda bukan penanggung jawab laporan ini.');
      }
    }

    const completionNotes =
      typeof formData.completion_notes === 'string'
        ? formData.completion_notes.trim()
        : '';
    const finalStatus = normalizeFinalStatus(formData.completion_status);
    const diitCode =
      typeof formData.diit_code === 'string'
        ? formData.diit_code.trim()
        : '';

    if (!finalStatus) {
      throw new Error('Status akhir wajib dipilih.');
    }

    if (!ALLOWED_FINAL_STATUSES.includes(finalStatus)) {
      throw new Error('Status akhir tidak valid.');
    }

    if (finalStatus === 'perlu_tindak_lanjut' && !completionNotes) {
      throw new Error('Catatan return wajib diisi untuk status perlu tindak lanjut.');
    }

    if (finalStatus === 'eskalasi' && !diitCode) {
      throw new Error('Kode DIIT wajib diisi untuk status eskalasi.');
    }

    if (finalStatus === 'eskalasi' && diitCode.length > 100) {
      throw new Error('Kode DIIT maksimal 100 karakter.');
    }

    const logMeta = getCompletionLogMeta(finalStatus);
    const storedDiitCode = finalStatus === 'eskalasi' ? diitCode : null;
    const logDescription =
      `Laporan diproses oleh ${currentUser.full_name} dengan hasil akhir: ${logMeta.label}.` +
      (storedDiitCode ? ` Kode DIIT: ${storedDiitCode}.` : '');

    await connection.query(
      `
      UPDATE reports
      SET
        status_internal = ?,
        completion_notes = ?,
        completion_status = ?,
        diit_code = ?,
        resolved_at = NOW(),
        closed_at = NOW(),
        updated_at = NOW()
      WHERE ticket_id = ?
      `,
      [
        finalStatus,
        completionNotes,
        finalStatus,
        storedDiitCode,
        report.ticket_id
      ]
    );

    const uploadedFiles = normalizeUploadedFiles(fileData);

    for (const uploadedFile of uploadedFiles) {
      await attachmentModel.createAttachment({
        ticket_id: report.ticket_id,
        type_attachment_code: 'bukti_penanganan',
        source: 'manual',
        uploaded_by_user_id: currentUser.id,
        file_name: sanitizeAttachmentFileName(uploadedFile),
        file_path: buildPublicUploadPath(uploadedFile),
        mime_type: uploadedFile.mimetype,
        file_size: uploadedFile.size
      }, connection);
    }

    await createReportLog({
      ticket_id: report.ticket_id,
      user_id: currentUser.id,
      action: logMeta.action,
      description: logDescription
    }, connection);

    await connection.commit();

    return {
      success: true,
      message: `Laporan ${report.ticket_id} berhasil diproses dengan status ${logMeta.label}.`
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function markReportInProgress(ticketIdOrId, currentUser) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const normalizedTicketId = typeof ticketIdOrId === 'string' ? ticketIdOrId.trim() : String(ticketIdOrId || '').trim();
    const [rows] = await connection.query(
      `
      SELECT ticket_id, status_internal, reported_region_id
      FROM reports
      WHERE ticket_id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [normalizedTicketId]
    );

    if (rows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = rows[0];

    if (!['diambil', 'didelegasikan'].includes(report.status_internal)) {
      throw new Error('Laporan belum pada status penanganan aktif.');
    }

    if (getCurrentUserRole(currentUser) === 'koordinator') {
      await ensureCoordinatorCanAccessReportRegion(report.reported_region_id, connection);
    } else {
      const [assignmentRows] = await connection.query(
        `
        SELECT assigned_to_user_id
        FROM report_assignments
        WHERE ticket_id = ?
          AND is_active = 1
        ORDER BY id DESC
        LIMIT 1
        `,
        [report.ticket_id]
      );

      const activeAssignedUserId = assignmentRows.length > 0
        ? assignmentRows[0].assigned_to_user_id
        : null;

      if (!activeAssignedUserId || Number(activeAssignedUserId) !== Number(currentUser.id)) {
        throw new Error('Anda bukan penanggung jawab aktif laporan ini.');
      }
    }

    await connection.query(
      `
      UPDATE reports
      SET
        status_wfm = 'In Progress',
        updated_at = NOW()
      WHERE ticket_id = ?
      `,
      [report.ticket_id]
    );

    await createReportLog({
      ticket_id: report.ticket_id,
      user_id: currentUser.id,
      action: 'in_progress_report',
      description: `Laporan sedang dikerjakan oleh ${currentUser.full_name}.`
    }, connection);

    await connection.commit();

    return {
      success: true,
      message: `Laporan ${report.ticket_id} ditandai sedang dikerjakan.`
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function delegateReport(ticketIdOrId, currentUser, targetUserId, notes) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const normalizedTicketId = typeof ticketIdOrId === 'string' ? ticketIdOrId.trim() : String(ticketIdOrId || '').trim();
    const [reportRows] = await connection.query(
      `
      SELECT
        ticket_id,
        status_internal,
        reported_region_id
      FROM reports
      WHERE ticket_id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [normalizedTicketId]
    );

    if (reportRows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = reportRows[0];

    await ensureCoordinatorCanAccessReportRegion(report.reported_region_id, connection);

    if (!['tersedia', 'diambil', 'didelegasikan'].includes(report.status_internal)) {
      throw new Error('Delegasi hanya dapat dilakukan pada laporan yang tersedia atau sedang ditangani.');
    }

    const [targetUserRows] = await connection.query(
      `
      SELECT
        users.id,
        users.full_name,
        users.region_id,
        roles.name AS role_name,
        regions.code AS region_code
      FROM users
      JOIN roles ON users.role_id = roles.id
      LEFT JOIN regions ON users.region_id = regions.id
      WHERE users.id = ?
        AND users.is_active = 1
      `,
      [targetUserId]
    );

    if (targetUserRows.length === 0) {
      throw new Error('Pegawai tujuan tidak ditemukan.');
    }

    const targetUser = targetUserRows[0];

    if (targetUser.role_name !== 'eksekutor') {
      throw new Error('Delegasi hanya dapat diberikan kepada pegawai eksekutor.');
    }

    const [reportRegionRows] = await connection.query(
      `SELECT code FROM regions WHERE id = ?`,
      [report.reported_region_id]
    );

    if (reportRegionRows.length === 0) {
      throw new Error('Wilayah laporan tidak ditemukan.');
    }

    const reportRegionCode = reportRegionRows[0].code;
    const expectedTargetRegion = OPPOSITE_REGION_MAP[reportRegionCode];

    if (!expectedTargetRegion) {
      throw new Error('Delegasi hanya didukung untuk tiket wilayah PDG atau BKT.');
    }

    if (targetUser.region_code !== expectedTargetRegion) {
      throw new Error(`Delegasi untuk laporan ${reportRegionCode} hanya boleh ke pegawai wilayah ${expectedTargetRegion}.`);
    }

    const [activeAssignmentRows] = await connection.query(
      `
      SELECT assigned_to_user_id
      FROM report_assignments
      WHERE ticket_id = ? AND is_active = 1
      LIMIT 1
      FOR UPDATE
      `,
      [report.ticket_id]
    );

    const currentActiveUserId = activeAssignmentRows.length > 0
      ? activeAssignmentRows[0].assigned_to_user_id
      : null;

    if (
      currentActiveUserId &&
      Number(currentActiveUserId) === Number(targetUserId)
    ) {
      throw new Error('Pegawai tujuan delegasi tidak boleh sama dengan penanggung jawab saat ini.');
    }

    await connection.query(
      `
      UPDATE report_assignments
      SET is_active = 0
      WHERE ticket_id = ?
        AND is_active = 1
      `,
      [report.ticket_id]
    );

    if (report.status_internal === 'tersedia') {
      await connection.query(
        `
        UPDATE reports
        SET
          status_internal = 'didelegasikan',
          taken_at = NOW(),
          updated_at = NOW()
        WHERE ticket_id = ?
        `,
        [report.ticket_id]
      );
    } else {
      await connection.query(
        `
        UPDATE reports
        SET
          status_internal = 'didelegasikan',
          updated_at = NOW()
        WHERE ticket_id = ?
        `,
        [report.ticket_id]
      );
    }

    await connection.query(
      `
      INSERT INTO report_assignments
      (
        ticket_id,
        assigned_to_user_id,
        assigned_by_user_id,
        assignment_type,
        notes,
        is_active,
        assigned_at
      )
      VALUES (?, ?, ?, 'delegation', ?, 1, NOW())
      `,
      [
        report.ticket_id,
        targetUser.id,
        currentUser.id,
        notes || 'Delegasi oleh koordinator.'
      ]
    );

    await createReportLog({
      ticket_id: report.ticket_id,
      user_id: currentUser.id,
      action: 'delegate_report',
      description: `Laporan didelegasikan oleh ${currentUser.full_name} ke ${targetUser.full_name}. Alasan: ${notes || '-'}`
    }, connection);

    await connection.commit();

    return {
      success: true,
      message: `Laporan ${report.ticket_id} berhasil didelegasikan ke ${targetUser.full_name}.`
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function cancelAssignment(ticketIdOrId, currentUser, notes) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const normalizedTicketId = typeof ticketIdOrId === 'string' ? ticketIdOrId.trim() : String(ticketIdOrId || '').trim();
    const [reportRows] = await connection.query(
      `
      SELECT
        ticket_id,
        status_internal,
        reported_region_id
      FROM reports
      WHERE ticket_id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [normalizedTicketId]
    );

    if (reportRows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = reportRows[0];

    await ensureCoordinatorCanAccessReportRegion(report.reported_region_id, connection);

    if (!['diambil', 'didelegasikan'].includes(report.status_internal)) {
      throw new Error('Laporan tidak berada pada status yang bisa dibatalkan.');
    }

    const [activeAssignmentRows] = await connection.query(
      `
      SELECT id, assigned_to_user_id
      FROM report_assignments
      WHERE ticket_id = ? AND is_active = 1
      LIMIT 1
      FOR UPDATE
      `,
      [report.ticket_id]
    );

    if (activeAssignmentRows.length === 0) {
      throw new Error('Laporan tidak memiliki penanggung jawab aktif.');
    }

    await connection.query(
      `
      UPDATE report_assignments
      SET is_active = 0
      WHERE ticket_id = ?
        AND is_active = 1
      `,
      [report.ticket_id]
    );

    await connection.query(
      `
      UPDATE reports
      SET
        status_internal = 'tersedia',
        taken_at = NULL,
        updated_at = NOW()
      WHERE ticket_id = ?
      `,
      [report.ticket_id]
    );

    await createReportLog({
      ticket_id: report.ticket_id,
      user_id: currentUser.id,
      action: 'cancel_assignment',
      description: `Penugasan dibatalkan oleh ${currentUser.full_name}. Alasan: ${notes || '-'}`
    }, connection);

    await connection.commit();

    return {
      success: true,
      message: `Penugasan laporan ${report.ticket_id} berhasil dibatalkan.`
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getAttachmentsByReportId(reportIdOrTicketId, trxConnection = null) {
  return attachmentModel.getAttachmentsByTicketId(reportIdOrTicketId, trxConnection);
}

async function getAttachmentsByTicketId(ticketId, trxConnection = null) {
  return attachmentModel.getAttachmentsByTicketId(ticketId, trxConnection);
}


async function resolveReportLogIdentity(logData, trxConnection = null) {
  const conn = trxConnection || pool;
  const ticketId = logData.ticket_id ? String(logData.ticket_id).trim() : '';

  if (!ticketId) {
    throw new Error('Identitas laporan (ticket_id) wajib diisi untuk log.');
  }

  const [rows] = await conn.query(
    'SELECT ticket_id FROM reports WHERE ticket_id = ? LIMIT 1',
    [ticketId]
  );

  return rows[0] || null;
}

async function createReportLog(logData, trxConnection = null) {
  const conn = trxConnection || pool;
  const report = await resolveReportLogIdentity(logData, conn);

  if (!report || !report.ticket_id) {
    throw new Error('Identitas laporan untuk log tidak ditemukan atau tidak cocok.');
  }

  const [result] = await conn.query(
    `
    INSERT INTO report_logs (ticket_id, user_id, action, description, created_at)
    VALUES (?, ?, ?, ?, NOW())
    `,
    [report.ticket_id, logData.user_id ?? null, logData.action, logData.description ?? null]
  );

  return result.insertId;
}

async function getReportLogsByReportId(reportId, trxConnection = null) {
  return getReportLogsByTicketId(reportId, trxConnection);
}

async function getReportLogsByTicketId(ticketId, trxConnection = null) {
  const conn = trxConnection || pool;
  const [rows] = await conn.query(
    `
    SELECT
      report_logs.id,
      report_logs.ticket_id,
      report_logs.user_id,
      report_logs.action,
      report_logs.description,
      report_logs.created_at,
      users.full_name AS user_name,
      CASE
        WHEN users.full_name IS NOT NULL THEN users.full_name
        WHEN report_logs.action LIKE 'telegram_%'
          OR report_logs.action = 'create_telegram_report'
          OR report_logs.action = 'telegram_additional_data_received'
        THEN 'Telegram Bot'
        ELSE 'Sistem'
      END AS actor_name
    FROM report_logs
    LEFT JOIN users ON report_logs.user_id = users.id
    WHERE report_logs.ticket_id = ?
    ORDER BY report_logs.created_at ASC, report_logs.id ASC
    `,
    [ticketId]
  );

  return rows;
}

function parseTelegramAdditionalLogDescription(description) {
  const raw = typeof description === 'string' ? description : '';

  if (!raw) {
    return null;
  }

  const mediaPrefix = 'Media Metadata: ';
  const mediaStart = raw.indexOf(mediaPrefix);

  if (mediaStart === -1) {
    return null;
  }

  const afterPrefix = raw.slice(mediaStart + mediaPrefix.length).trim();
  if (!afterPrefix || afterPrefix === '-') {
    return null;
  }

  try {
    return JSON.parse(afterPrefix);
  } catch (error) {
    return null;
  }
}

async function getTelegramAdditionalMediaByTicketId(ticketId) {
  const logs = await getReportLogsByTicketId(ticketId);
  const rows = logs
    .filter((log) => log.action === 'telegram_additional_data_received')
    .reverse();

  const parsed = rows
    .map((row) => {
      const media = parseTelegramAdditionalLogDescription(row.description);
      if (!media) {
        return null;
      }

      return {
        log_id: row.id,
        created_at: row.created_at,
        media
      };
    })
    .filter(Boolean);

  return parsed;
}

async function getTelegramAdditionalMediaByReportId(reportIdOrTicketId) {
  const isNumeric = /^\d+$/.test(String(reportIdOrTicketId).trim());
  if (!isNumeric) {
    return getTelegramAdditionalMediaByTicketId(reportIdOrTicketId);
  }
  const logs = await getReportLogsByReportId(reportIdOrTicketId);
  const rows = logs
    .filter((log) => log.action === 'telegram_additional_data_received')
    .reverse();

  const parsed = rows
    .map((row) => {
      const media = parseTelegramAdditionalLogDescription(row.description);
      if (!media) {
        return null;
      }

      return {
        log_id: row.id,
        created_at: row.created_at,
        media
      };
    })
    .filter(Boolean);

  return parsed;
}

module.exports = {
  createTelegramReport,
  findByTicketId,
  getReportByTicketId,
  getTelegramFeedbackPayload,
  getTelegramFeedbackPayloadByReportId,
  logTelegramFeedback,
  storeTelegramAdditionalData,
  logTelegramTextEnrichmentFailure,
  applyTelegramTextEnrichment,
  buildReportListAccessContext,
  getReports,
  getReportCount,
  getReportWorkStatusCounts,
  getNewReportStats,
  getLatestReportId,
  getReportById,
  takeReport,
  markReportInProgress,
  completeReport,
  delegateReport,
  cancelAssignment,
  getAttachmentsByReportId,
  getAttachmentsByTicketId,
  createReportLog,
  getReportLogsByTicketId,
  getReportLogsByReportId,
  getTelegramAdditionalMediaByReportId,
  getTelegramAdditionalMediaByTicketId
};
