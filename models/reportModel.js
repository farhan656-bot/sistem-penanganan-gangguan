const pool = require('../config/db');

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

  if (currentUser.role === 'eksekutor' && currentUser.region_id) {
    sql += ` AND (
      reports.current_region_id = ?
      OR reports.current_assigned_user_id = ?
    ) `;
    params.push(currentUser.region_id, currentUser.id);
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

  if (currentUser.role === 'eksekutor' && currentUser.region_id) {
    sql += ` AND (
      reports.current_region_id = ?
      OR reports.current_assigned_user_id = ?
    ) `;
    params.push(currentUser.region_id, currentUser.id);
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

    if (!formData.completion_notes || !formData.completion_status) {
      throw new Error('Catatan penyelesaian dan status akhir wajib diisi.');
    }

    if (!fileData) {
      throw new Error('Bukti penyelesaian wajib diunggah.');
    }

    await connection.query(
      `
      UPDATE reports
      SET
        status_internal = 'selesai',
        completion_notes = ?,
        completion_status = ?,
        resolved_at = NOW(),
        closed_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        formData.completion_notes,
        formData.completion_status,
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
      VALUES (?, ?, 'complete_report', ?, NOW())
      `,
      [
        reportId,
        currentUser.id,
        `Laporan diselesaikan oleh ${currentUser.full_name} dengan status akhir: ${formData.completion_status}.`
      ]
    );

    await connection.commit();

    return {
      success: true,
      message: `Laporan ${report.ticket_id} berhasil diselesaikan.`
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
    const expectedTargetRegion = reportRegionCode === 'PDG' ? 'BKT' : 'PDG';

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
    JOIN users ON report_attachments.uploaded_by_user_id = users.id
    WHERE report_attachments.report_id = ?
    ORDER BY report_attachments.created_at DESC
    `,
    [reportId]
  );

  return rows;
}

module.exports = {
  getReports,
  getReportById,
  takeReport,
  completeReport,
  delegateReport,
  cancelAssignment,
  getAttachmentsByReportId
};