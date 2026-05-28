const pool = require('../config/db');
const regionSwitchModel = require('./regionSwitchModel');

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

async function getReports({ search = '', status = '', region = '' }, currentUser) {
  let sql = `
    SELECT
      reports.id,
      reports.fallout_type,
      reports.ticket_id,
      reports.order_id,
      reports.service_type,
      reports.provider,
      reports.branch_name,
      reports.cluster_name,
      reports.sto,
      reports.summary,
      reports.status_wfm,
      reports.status_andalas,
      reports.status_internal,
      reports.received_at,
      reports.taken_at,
      reports.resolved_at,
      regions.code AS region_code,
      regions.name AS region_name,
      users.full_name AS assigned_user_name
    FROM reports
    LEFT JOIN regions ON reports.current_region_id = regions.id
    LEFT JOIN users ON reports.current_assigned_user_id = users.id
    WHERE 1=1
  `;

  const params = [];

  if (currentUser.role === 'eksekutor') {
    const extraRegionIds = await regionSwitchModel.getActiveExtraRegionsByUserId(currentUser.id);
    const regionIds = [currentUser.region_id, ...extraRegionIds].filter(Boolean);

    if (regionIds.length > 0) {
      const placeholders = regionIds.map(() => '?').join(', ');
      sql += ` AND (
        reports.current_region_id IN (${placeholders})
        OR reports.current_assigned_user_id = ?
      ) `;
      params.push(...regionIds, currentUser.id);
    } else {
      sql += ` AND reports.current_assigned_user_id = ? `;
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

  if (status) {
    sql += ` AND reports.status_internal = ? `;
    params.push(status);
  }

  if (region) {
    sql += ` AND regions.code = ? `;
    params.push(region);
  }

  sql += ` ORDER BY reports.received_at DESC `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getRegions() {
  const [rows] = await pool.query(
    `
    SELECT id, code, name
    FROM regions
    ORDER BY code ASC
    `
  );

  return rows;
}

async function createManualReport(data, currentUser) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const ticketId = typeof data.ticket_id === 'string' ? data.ticket_id.trim() : '';
    const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
    const reportedRegionId = Number(data.reported_region_id);

    if (!ticketId) {
      throw new Error('Ticket ID wajib diisi.');
    }

    if (!summary) {
      throw new Error('Ringkasan gangguan wajib diisi.');
    }

    if (!reportedRegionId) {
      throw new Error('Wilayah awal wajib dipilih.');
    }

    const [duplicateRows] = await connection.query(
      `
      SELECT id
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
      SELECT id, code, name
      FROM regions
      WHERE id = ?
      LIMIT 1
      `,
      [reportedRegionId]
    );

    if (regionRows.length === 0) {
      throw new Error('Wilayah yang dipilih tidak valid.');
    }

    const selectedRegion = regionRows[0];

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
        current_region_id,
        current_assigned_user_id,
        received_at,
        created_at,
        updated_at
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'tersedia', ?, ?, ?, NOW(), NOW(), NOW())
      `,
      [
        'manual',
        normalizeOptionalField(data.fallout_type),
        ticketId,
        normalizeOptionalField(data.order_id),
        normalizeOptionalField(data.wo_number),
        normalizeOptionalField(data.service_type),
        normalizeOptionalField(data.segment),
        normalizeOptionalField(data.provider),
        normalizeOptionalField(data.telkom_area),
        normalizeOptionalField(data.branch_name),
        normalizeOptionalField(data.cluster_name),
        normalizeOptionalField(data.sto),
        summary,
        normalizeOptionalField(data.service_id),
        normalizeOptionalField(data.status_wfm),
        normalizeOptionalField(data.status_andalas),
        reportedRegionId,
        reportedRegionId,
        null
      ]
    );

    const reportId = insertResult.insertId;

    await connection.query(
      `
      INSERT INTO report_logs (report_id, user_id, action, description, created_at)
      VALUES (?, ?, 'create_manual_report', ?, NOW())
      `,
      [
        reportId,
        currentUser.id,
        `Laporan manual dibuat oleh ${currentUser.full_name} dengan ticket_id ${ticketId} untuk wilayah ${selectedRegion.code}.`
      ]
    );

    await connection.commit();

    return {
      success: true,
      reportId,
      ticketId,
      message: `Laporan manual ${ticketId} berhasil dibuat dan masuk antrean tersedia.`
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createTelegramReport(parsedData, telegramMeta) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const ticketId = typeof parsedData.ticket_id === 'string' ? parsedData.ticket_id.trim() : '';
    const orderId = typeof parsedData.order_id === 'string' ? parsedData.order_id.trim() : '';
    const summary = typeof parsedData.summary === 'string' ? parsedData.summary.trim() : '';
    const regionCode = typeof parsedData.region === 'string' ? parsedData.region.trim().toUpperCase() : '';

    if (!ticketId || !orderId || !summary || !regionCode) {
      throw new Error('Data wajib intake Telegram tidak lengkap.');
    }

    const [duplicateRows] = await connection.query(
      `
      SELECT id
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
        current_region_id,
        current_assigned_user_id,
        telegram_chat_id,
        telegram_message_id,
        received_at,
        created_at,
        updated_at
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'tersedia', ?, ?, NULL, ?, ?, NOW(), NOW(), NOW())
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
        selectedRegion.id,
        String(telegramMeta.chat_id),
        String(telegramMeta.message_id)
      ]
    );

    await connection.query(
      `
      INSERT INTO report_logs (report_id, user_id, action, description, created_at)
      VALUES (?, ?, 'create_telegram_report', ?, NOW())
      `,
      [
        insertResult.insertId,
        null,
        `Laporan dari Telegram diterima dengan ticket_id ${ticketId}, order_id ${orderId}, source telegram, chat_id ${telegramMeta.chat_id}.`
      ]
    );

    await connection.commit();

    return {
      success: true,
      reportId: insertResult.insertId,
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
      id,
      ticket_id,
      order_id,
      telegram_chat_id,
      telegram_message_id,
      status_internal,
      current_assigned_user_id
    FROM reports
    WHERE UPPER(TRIM(ticket_id)) = UPPER(TRIM(?))
    LIMIT 1
    `,
    [normalizedTicketId]
  );

  return rows[0] || null;
}

async function getReportByTicketId(ticketId) {
  return findByTicketId(ticketId);
}

async function getTelegramFeedbackPayloadByReportId(reportId) {
  const [rows] = await pool.query(
    `
    SELECT
      reports.id,
      reports.ticket_id,
      reports.order_id,
      reports.diit_code,
      reports.telegram_chat_id,
      reports.telegram_message_id
    FROM reports
    WHERE reports.id = ?
    LIMIT 1
    `,
    [reportId]
  );

  return rows[0] || null;
}

async function logTelegramFeedback(reportId, action, description, userId = null) {
  await pool.query(
    `
    INSERT INTO report_logs (report_id, user_id, action, description, created_at)
    VALUES (?, ?, ?, ?, NOW())
    `,
    [reportId, userId, action, description]
  );
}

async function storeTelegramAdditionalData(reportId, payload) {
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

  await pool.query(
    `
    INSERT INTO report_logs (report_id, user_id, action, description, created_at)
    VALUES (?, NULL, 'telegram_additional_data_received', ?, NOW())
    `,
    [reportId, description]
  );

  return {
    success: true,
    reportId
  };
}

async function logTelegramTextEnrichmentFailure(reportId, payload) {
  const description = buildTelegramTextEnrichmentDescription({
    rawText: payload.raw_text,
    updates: {},
    conflicts: payload.conflicts || [],
    unchanged: payload.unchanged || [],
    telegramMeta: payload.telegram_meta
  });

  if (!reportId) {
    console.warn(
      'Skip report_logs insert: telegram enrichment gagal untuk ticket yang belum terdaftar (report_id null).',
      description
    );
    return;
  }

  try {
    await pool.query(
      `
      INSERT INTO report_logs (report_id, user_id, action, description, created_at)
      VALUES (?, NULL, 'telegram_text_enrichment_failed', ?, NOW())
      `,
      [reportId, description]
    );
  } catch (error) {
    console.error('Gagal mencatat log enrichment gagal:', error.message || error);
  }
}

async function applyTelegramTextEnrichment(reportId, payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT
        id,
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
      WHERE id = ?
      FOR UPDATE
      `,
      [reportId]
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
        WHERE id = ?
        `,
        [...values, reportId]
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

    await connection.query(
      `
      INSERT INTO report_logs (report_id, user_id, action, description, created_at)
      VALUES (?, NULL, ?, ?, NOW())
      `,
      [reportId, actionMap[status], description]
    );

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

async function getReportById(reportId, currentUser) {
  let sql = `
    SELECT
      reports.*,
      rr.code AS reported_region_code,
      rr.name AS reported_region_name,
      cr.code AS current_region_code,
      cr.name AS current_region_name,
      u.full_name AS assigned_user_name
    FROM reports
    LEFT JOIN regions rr ON reports.reported_region_id = rr.id
    LEFT JOIN regions cr ON reports.current_region_id = cr.id
    LEFT JOIN users u ON reports.current_assigned_user_id = u.id
    WHERE reports.id = ?
  `;

  const params = [reportId];

  if (currentUser.role === 'eksekutor') {
    if (currentUser.region_id) {
      sql += ` AND (
        reports.current_region_id = ?
        OR reports.current_assigned_user_id = ?
      ) `;
      params.push(currentUser.region_id, currentUser.id);
    } else {
      sql += ` AND reports.current_assigned_user_id = ? `;
      params.push(currentUser.id);
    }
  }

  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
}

async function takeReport(reportId, currentUser) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT id, ticket_id, status_internal, current_region_id, current_assigned_user_id
      FROM reports
      WHERE id = ?
      FOR UPDATE
      `,
      [reportId]
    );

    if (rows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = rows[0];

    if (report.status_internal !== 'tersedia') {
      throw new Error('Laporan sudah tidak tersedia untuk diambil.');
    }

    if (report.current_assigned_user_id) {
      throw new Error('Laporan sudah memiliki penanggung jawab.');
    }

    if (
      currentUser.role === 'eksekutor' &&
      currentUser.region_id &&
      Number(report.current_region_id) !== Number(currentUser.region_id)
    ) {
      throw new Error('Anda tidak dapat mengambil laporan di luar wilayah Anda.');
    }

    await connection.query(
      `
      UPDATE reports
      SET
        status_internal = 'diambil',
        current_assigned_user_id = ?,
        taken_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
      `,
      [currentUser.id, reportId]
    );

    await connection.query(
      `
      INSERT INTO report_assignments
      (
        report_id,
        assigned_to_user_id,
        assigned_by_user_id,
        from_region_id,
        to_region_id,
        assignment_type,
        notes,
        is_active,
        assigned_at
      )
      VALUES (?, ?, ?, ?, ?, 'self_take', ?, 1, NOW())
      `,
      [
        reportId,
        currentUser.id,
        currentUser.id,
        currentUser.region_id,
        currentUser.region_id,
        'Laporan diambil sendiri oleh eksekutor.'
      ]
    );

    await connection.query(
      `
      INSERT INTO report_logs (report_id, user_id, action, description, created_at)
      VALUES (?, ?, 'take_report', ?, NOW())
      `,
      [
        reportId,
        currentUser.id,
        `Laporan diambil oleh ${currentUser.full_name}.`
      ]
    );

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

async function completeReport(reportId, currentUser, formData, fileData) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT id, ticket_id, status_internal, current_assigned_user_id
      FROM reports
      WHERE id = ?
      FOR UPDATE
      `,
      [reportId]
    );

    if (rows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = rows[0];

    if (!['diambil', 'didelegasikan'].includes(report.status_internal)) {
      throw new Error('Laporan belum berada pada status yang dapat diselesaikan.');
    }

    if (Number(report.current_assigned_user_id) !== Number(currentUser.id)) {
      throw new Error('Anda bukan penanggung jawab laporan ini.');
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

    if (!finalStatus || (finalStatus !== 'selesai' && !completionNotes)) {
      throw new Error('Catatan penyelesaian dan status akhir wajib diisi.');
    }

    if (!ALLOWED_FINAL_STATUSES.includes(finalStatus)) {
      throw new Error('Status akhir tidak valid.');
    }

    if (finalStatus === 'eskalasi' && !diitCode) {
      throw new Error('Kode DIIT wajib diisi untuk status eskalasi.');
    }

    if (finalStatus === 'eskalasi' && diitCode.length > 100) {
      throw new Error('Kode DIIT maksimal 100 karakter.');
    }

    if (!fileData) {
      throw new Error('Bukti penyelesaian wajib diunggah.');
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
      WHERE id = ?
      `,
      [
        finalStatus,
        completionNotes,
        finalStatus,
        storedDiitCode,
        reportId
      ]
    );

    await connection.query(
      `
      INSERT INTO report_attachments
      (
        report_id,
        uploaded_by_user_id,
        file_name,
        file_path,
        mime_type,
        file_size,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        reportId,
        currentUser.id,
        fileData.originalname,
        '/uploads/' + fileData.filename,
        fileData.mimetype,
        fileData.size
      ]
    );

    await connection.query(
      `
      INSERT INTO report_logs (report_id, user_id, action, description, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [
        reportId,
        currentUser.id,
        logMeta.action,
        logDescription
      ]
    );

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

async function markReportInProgress(reportId, currentUser) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT id, ticket_id, status_internal, current_assigned_user_id
      FROM reports
      WHERE id = ?
      FOR UPDATE
      `,
      [reportId]
    );

    if (rows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = rows[0];

    if (!['diambil', 'didelegasikan'].includes(report.status_internal)) {
      throw new Error('Laporan belum pada status penanganan aktif.');
    }

    if (Number(report.current_assigned_user_id) !== Number(currentUser.id)) {
      throw new Error('Anda bukan penanggung jawab aktif laporan ini.');
    }

    await connection.query(
      `
      UPDATE reports
      SET
        status_wfm = 'In Progress',
        updated_at = NOW()
      WHERE id = ?
      `,
      [reportId]
    );

    await connection.query(
      `
      INSERT INTO report_logs (report_id, user_id, action, description, created_at)
      VALUES (?, ?, 'in_progress_report', ?, NOW())
      `,
      [
        reportId,
        currentUser.id,
        `Laporan sedang dikerjakan oleh ${currentUser.full_name}.`
      ]
    );

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

async function delegateReport(reportId, currentUser, targetUserId, notes) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [reportRows] = await connection.query(
      `
      SELECT
        reports.id,
        reports.ticket_id,
        reports.status_internal,
        reports.current_region_id,
        reports.current_assigned_user_id
      FROM reports
      WHERE reports.id = ?
      FOR UPDATE
      `,
      [reportId]
    );

    if (reportRows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = reportRows[0];

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
      [report.current_region_id]
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

    if (
      report.current_assigned_user_id &&
      Number(report.current_assigned_user_id) === Number(targetUserId)
    ) {
      throw new Error('Pegawai tujuan delegasi tidak boleh sama dengan penanggung jawab saat ini.');
    }

    await connection.query(
      `
      UPDATE report_assignments
      SET is_active = 0
      WHERE report_id = ?
        AND is_active = 1
      `,
      [reportId]
    );

    if (report.status_internal === 'tersedia') {
      await connection.query(
        `
        UPDATE reports
        SET
          status_internal = 'didelegasikan',
          current_assigned_user_id = ?,
          taken_at = NOW(),
          updated_at = NOW()
        WHERE id = ?
        `,
        [targetUser.id, reportId]
      );
    } else {
      await connection.query(
        `
        UPDATE reports
        SET
          status_internal = 'didelegasikan',
          current_assigned_user_id = ?,
          updated_at = NOW()
        WHERE id = ?
        `,
        [targetUser.id, reportId]
      );
    }

    await connection.query(
      `
      INSERT INTO report_assignments
      (
        report_id,
        assigned_to_user_id,
        assigned_by_user_id,
        from_region_id,
        to_region_id,
        assignment_type,
        notes,
        is_active,
        assigned_at
      )
      VALUES (?, ?, ?, ?, ?, 'delegation', ?, 1, NOW())
      `,
      [
        reportId,
        targetUser.id,
        currentUser.id,
        report.current_region_id,
        targetUser.region_id,
        notes || 'Delegasi oleh koordinator.'
      ]
    );

    await connection.query(
      `
      INSERT INTO report_logs
      (report_id, user_id, action, description, created_at)
      VALUES (?, ?, 'delegate_report', ?, NOW())
      `,
      [
        reportId,
        currentUser.id,
        `Laporan didelegasikan oleh ${currentUser.full_name} ke ${targetUser.full_name}. Alasan: ${notes || '-'}`
      ]
    );

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

async function cancelAssignment(reportId, currentUser, notes) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [reportRows] = await connection.query(
      `
      SELECT
        reports.id,
        reports.ticket_id,
        reports.status_internal,
        reports.current_assigned_user_id
      FROM reports
      WHERE reports.id = ?
      FOR UPDATE
      `,
      [reportId]
    );

    if (reportRows.length === 0) {
      throw new Error('Laporan tidak ditemukan.');
    }

    const report = reportRows[0];

    if (!['diambil', 'didelegasikan'].includes(report.status_internal)) {
      throw new Error('Laporan tidak berada pada status yang bisa dibatalkan.');
    }

    if (!report.current_assigned_user_id) {
      throw new Error('Laporan tidak memiliki penanggung jawab aktif.');
    }

    await connection.query(
      `
      UPDATE report_assignments
      SET is_active = 0
      WHERE report_id = ?
        AND is_active = 1
      `,
      [reportId]
    );

    await connection.query(
      `
      UPDATE reports
      SET
        status_internal = 'tersedia',
        current_assigned_user_id = NULL,
        taken_at = NULL,
        updated_at = NOW()
      WHERE id = ?
      `,
      [reportId]
    );

    await connection.query(
      `
      INSERT INTO report_logs
      (report_id, user_id, action, description, created_at)
      VALUES (?, ?, 'cancel_assignment', ?, NOW())
      `,
      [
        reportId,
        currentUser.id,
        `Penugasan dibatalkan oleh ${currentUser.full_name}. Alasan: ${notes || '-'}`
      ]
    );

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

async function getAttachmentsByReportId(reportId) {
  const [rows] = await pool.query(
    `
    SELECT
      report_attachments.*,
      users.full_name AS uploaded_by_name
    FROM report_attachments
    LEFT JOIN users ON report_attachments.uploaded_by_user_id = users.id
    WHERE report_attachments.report_id = ?
    ORDER BY report_attachments.created_at DESC
    `,
    [reportId]
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

async function getTelegramAdditionalMediaByReportId(reportId) {
  const [rows] = await pool.query(
    `
    SELECT id, description, created_at
    FROM report_logs
    WHERE report_id = ?
      AND action = 'telegram_additional_data_received'
    ORDER BY created_at DESC
    `,
    [reportId]
  );

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
  getRegions,
  createManualReport,
  createTelegramReport,
  findByTicketId,
  getReportByTicketId,
  getTelegramFeedbackPayloadByReportId,
  logTelegramFeedback,
  storeTelegramAdditionalData,
  logTelegramTextEnrichmentFailure,
  applyTelegramTextEnrichment,
  getReports,
  getReportById,
  takeReport,
  markReportInProgress,
  completeReport,
  delegateReport,
  cancelAssignment,
  getAttachmentsByReportId,
  getTelegramAdditionalMediaByReportId
};
