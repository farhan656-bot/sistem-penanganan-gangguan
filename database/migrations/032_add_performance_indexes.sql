-- F032: Query Indexing and Performance Optimization
-- Menambahkan hanya index komposit/ordering yang belum tersedia.
-- Script memeriksa susunan kolom index, bukan hanya nama index, agar tidak
-- membuat duplicate index jika index ekuivalen sudah dibuat dengan nama lain.

SET @f032_index_exists = (
  SELECT COUNT(*)
  FROM (
    SELECT
      index_name,
      GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS indexed_columns
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'reports'
    GROUP BY index_name
  ) existing_indexes
  WHERE indexed_columns = 'current_region_id,status_internal,id'
     OR indexed_columns LIKE 'current_region_id,status_internal,id,%'
);
SET @f032_sql = IF(
  @f032_index_exists = 0,
  'CREATE INDEX idx_reports_region_status_id ON reports (current_region_id, status_internal, id)',
  'SELECT ''Skip idx_reports_region_status_id: equivalent index already exists'' AS message'
);
PREPARE f032_statement FROM @f032_sql;
EXECUTE f032_statement;
DEALLOCATE PREPARE f032_statement;

SET @f032_index_exists = (
  SELECT COUNT(*)
  FROM (
    SELECT
      index_name,
      GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS indexed_columns
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'reports'
    GROUP BY index_name
  ) existing_indexes
  WHERE indexed_columns = 'current_assigned_user_id,status_internal,id'
     OR indexed_columns LIKE 'current_assigned_user_id,status_internal,id,%'
);
SET @f032_sql = IF(
  @f032_index_exists = 0,
  'CREATE INDEX idx_reports_assignee_status_id ON reports (current_assigned_user_id, status_internal, id)',
  'SELECT ''Skip idx_reports_assignee_status_id: equivalent index already exists'' AS message'
);
PREPARE f032_statement FROM @f032_sql;
EXECUTE f032_statement;
DEALLOCATE PREPARE f032_statement;

SET @f032_index_exists = (
  SELECT COUNT(*)
  FROM (
    SELECT
      index_name,
      GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS indexed_columns
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'reports'
    GROUP BY index_name
  ) existing_indexes
  WHERE indexed_columns = 'received_at'
     OR indexed_columns LIKE 'received_at,%'
);
SET @f032_sql = IF(
  @f032_index_exists = 0,
  'CREATE INDEX idx_reports_received_at ON reports (received_at)',
  'SELECT ''Skip idx_reports_received_at: equivalent index already exists'' AS message'
);
PREPARE f032_statement FROM @f032_sql;
EXECUTE f032_statement;
DEALLOCATE PREPARE f032_statement;

SET @f032_index_exists = (
  SELECT COUNT(*)
  FROM (
    SELECT
      index_name,
      GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS indexed_columns
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'report_logs'
    GROUP BY index_name
  ) existing_indexes
  WHERE indexed_columns = 'report_id,created_at'
     OR indexed_columns LIKE 'report_id,created_at,%'
);
SET @f032_sql = IF(
  @f032_index_exists = 0,
  'CREATE INDEX idx_report_logs_report_created_at ON report_logs (report_id, created_at)',
  'SELECT ''Skip idx_report_logs_report_created_at: equivalent index already exists'' AS message'
);
PREPARE f032_statement FROM @f032_sql;
EXECUTE f032_statement;
DEALLOCATE PREPARE f032_statement;

SET @f032_index_exists = NULL;
SET @f032_sql = NULL;
