const pool = require('../config/db');

async function expireOldRequests() {
  await pool.query(
    `
    UPDATE region_switch_requests
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'approved'
      AND end_at IS NOT NULL
      AND end_at < NOW()
    `
  );
}

async function hasDuplicateActiveOrPendingRequest(requesterUserId, targetRegionId) {
  await expireOldRequests();

  const [rows] = await pool.query(
    `
    SELECT id
    FROM region_switch_requests
    WHERE requester_user_id = ?
      AND target_region_id = ?
      AND (
        status = 'pending'
        OR (status = 'approved' AND end_at >= NOW())
      )
    LIMIT 1
    `,
    [requesterUserId, targetRegionId]
  );

  return rows.length > 0;
}

async function createRequest(data) {
  const [result] = await pool.query(
    `
    INSERT INTO region_switch_requests
    (
      requester_user_id,
      home_region_id,
      target_region_id,
      reason,
      status,
      requested_at,
      created_at,
      updated_at
    )
    VALUES
    (?, ?, ?, ?, 'pending', NOW(), NOW(), NOW())
    `,
    [
      data.requester_user_id,
      data.home_region_id,
      data.target_region_id,
      data.reason
    ]
  );

  return result.insertId;
}

async function getRequestsByRequester(userId) {
  await expireOldRequests();

  const [rows] = await pool.query(
    `
    SELECT
      requests.id,
      requests.requester_user_id,
      requests.home_region_id,
      requests.target_region_id,
      requests.reason,
      requests.status,
      requests.requested_at,
      requests.approved_by_user_id,
      requests.approved_at,
      requests.start_at,
      requests.end_at,
      requests.rejection_reason,
      home.code AS home_region_code,
      home.name AS home_region_name,
      target.code AS target_region_code,
      target.name AS target_region_name,
      approver.full_name AS approved_by_name
    FROM region_switch_requests requests
    LEFT JOIN regions home ON requests.home_region_id = home.id
    LEFT JOIN regions target ON requests.target_region_id = target.id
    LEFT JOIN users approver ON requests.approved_by_user_id = approver.id
    WHERE requests.requester_user_id = ?
    ORDER BY requests.requested_at DESC
    `,
    [userId]
  );

  return rows;
}

async function getPendingRequests() {
  await expireOldRequests();

  const [rows] = await pool.query(
    `
    SELECT
      requests.id,
      requests.requester_user_id,
      requests.home_region_id,
      requests.target_region_id,
      requests.reason,
      requests.status,
      requests.requested_at,
      requester.full_name AS requester_name,
      home.code AS home_region_code,
      home.name AS home_region_name,
      target.code AS target_region_code,
      target.name AS target_region_name
    FROM region_switch_requests requests
    JOIN users requester ON requests.requester_user_id = requester.id
    LEFT JOIN regions home ON requests.home_region_id = home.id
    LEFT JOIN regions target ON requests.target_region_id = target.id
    WHERE requests.status = 'pending'
    ORDER BY requests.requested_at ASC
    `
  );

  return rows;
}

async function getRequestById(id) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM region_switch_requests
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

async function approveRequest(requestId, coordinatorId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT id, status
      FROM region_switch_requests
      WHERE id = ?
      FOR UPDATE
      `,
      [requestId]
    );

    if (rows.length === 0) {
      throw new Error('Pengajuan tidak ditemukan.');
    }

    if (rows[0].status !== 'pending') {
      throw new Error('Pengajuan sudah diproses dan tidak bisa di-approve ulang.');
    }

    await connection.query(
      `
      UPDATE region_switch_requests
      SET
        status = 'approved',
        approved_by_user_id = ?,
        approved_at = NOW(),
        start_at = NOW(),
        end_at = TIMESTAMP(CURDATE(), '23:59:59'),
        updated_at = NOW()
      WHERE id = ?
      `,
      [coordinatorId, requestId]
    );

    await connection.commit();

    return {
      success: true
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function rejectRequest(requestId, coordinatorId, rejectionReason) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT id, status
      FROM region_switch_requests
      WHERE id = ?
      FOR UPDATE
      `,
      [requestId]
    );

    if (rows.length === 0) {
      throw new Error('Pengajuan tidak ditemukan.');
    }

    if (rows[0].status !== 'pending') {
      throw new Error('Pengajuan sudah diproses dan tidak bisa di-reject ulang.');
    }

    await connection.query(
      `
      UPDATE region_switch_requests
      SET
        status = 'rejected',
        rejection_reason = ?,
        approved_by_user_id = ?,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
      `,
      [rejectionReason, coordinatorId, requestId]
    );

    await connection.commit();

    return {
      success: true
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getActiveExtraRegionsByUserId(userId) {
  await expireOldRequests();

  const [rows] = await pool.query(
    `
    SELECT DISTINCT target_region_id
    FROM region_switch_requests
    WHERE requester_user_id = ?
      AND status = 'approved'
      AND start_at <= NOW()
      AND end_at >= NOW()
    `,
    [userId]
  );

  return rows.map((row) => row.target_region_id).filter(Boolean);
}

module.exports = {
  createRequest,
  getRequestsByRequester,
  getPendingRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  getActiveExtraRegionsByUserId,
  expireOldRequests,
  hasDuplicateActiveOrPendingRequest
};
