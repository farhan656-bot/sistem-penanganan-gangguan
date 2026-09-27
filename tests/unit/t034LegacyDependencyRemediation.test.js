const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../../config/db');
const reportModel = require('../../models/reportModel');

describe('T034 — Legacy Dependency Remediation Validation', () => {
  after(async () => {
    try {
      await pool.end();
    } catch (_) {}
  });

  const rootDir = path.resolve(__dirname, '../..');

  function scanDir(dir) {
    let results = [];
    const fullDir = path.join(rootDir, dir);
    if (!fs.existsSync(fullDir)) return results;
    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(fullDir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(scanDir(path.join(dir, entry.name)));
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ejs'))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const appFiles = [
    ...scanDir('models'),
    ...scanDir('controllers'),
    ...scanDir('views'),
    ...scanDir('routes'),
    ...scanDir('services'),
    ...scanDir('middleware'),
    ...scanDir('utils')
  ];

  describe('1. Static Code Audit — Zero Legacy Operational Query References', () => {
    it('current_region_id must have 0 occurrences across all application files', () => {
      const occurrences = [];
      for (const file of appFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('current_region_id')) {
            occurrences.push({ file: path.relative(rootDir, file), line: idx + 1, text: line.trim() });
          }
        });
      }
      assert.deepEqual(occurrences, [], `Found unexpected current_region_id occurrences: ${JSON.stringify(occurrences, null, 2)}`);
    });

    it('from_region_id and to_region_id must have 0 occurrences across all application files', () => {
      const occurrences = [];
      for (const file of appFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('from_region_id') || line.includes('to_region_id')) {
            occurrences.push({ file: path.relative(rootDir, file), line: idx + 1, text: line.trim() });
          }
        });
      }
      assert.deepEqual(occurrences, [], `Found unexpected legacy assignment region occurrences: ${JSON.stringify(occurrences, null, 2)}`);
    });

    it('current_assigned_user_id must have 0 operational query references (only compatibility property adapters permitted in reportModel)', () => {
      const occurrences = [];
      for (const file of appFiles) {
        const relPath = path.relative(rootDir, file);
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('current_assigned_user_id')) {
            // Check if this is a legitimate compatibility adapter assignment in reportModel.js
            const isCompatAdapter = relPath.replace(/\\/g, '/') === 'models/reportModel.js' &&
              line.includes('row.current_assigned_user_id = row.assigned_to_user_id;');
            if (!isCompatAdapter) {
              occurrences.push({ file: relPath, line: idx + 1, text: line.trim() });
            }
          }
        });
      }
      assert.deepEqual(occurrences, [], `Found unexpected current_assigned_user_id occurrences: ${JSON.stringify(occurrences, null, 2)}`);
    });

    it('views templates must have 0 references to current_assigned_user_id and current_region_id', () => {
      const viewFiles = scanDir('views');
      const occurrences = [];
      for (const file of viewFiles) {
        const relPath = path.relative(rootDir, file);
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('current_assigned_user_id') || line.includes('current_region_id')) {
            occurrences.push({ file: relPath, line: idx + 1, text: line.trim() });
          }
        });
      }
      assert.deepEqual(occurrences, [], `Views still reference legacy fields: ${JSON.stringify(occurrences, null, 2)}`);
    });
  });

  describe('2. Model Query Logic & Relational Joins Verification', () => {
    it('reportModel queries must use reported_region_id for region joins and filtering', () => {
      const reportModelPath = path.join(rootDir, 'models/reportModel.js');
      const content = fs.readFileSync(reportModelPath, 'utf8');

      // Verify reported_region_id is used for JOIN regions
      assert.ok(
        content.includes('reports.reported_region_id = regions.id'),
        'Harus melakukan JOIN regions melalui reports.reported_region_id'
      );

      // Verify access condition uses reported_region_id
      assert.ok(
        content.includes('reports.reported_region_id IN'),
        'Access condition harus memeriksa reports.reported_region_id'
      );
    });

    it('reportModel queries must use report_assignments with is_active = 1 for active assignments', () => {
      const reportModelPath = path.join(rootDir, 'models/reportModel.js');
      const content = fs.readFileSync(reportModelPath, 'utf8');

      assert.ok(
        content.includes('ra.ticket_id = reports.ticket_id') && content.includes('ra.is_active = 1'),
        'Query harus JOIN report_assignments dengan is_active = 1'
      );

      assert.ok(
        content.includes('ra.assigned_to_user_id'),
        'Query harus memilih ra.assigned_to_user_id'
      );
    });

    it('Status mutation methods must check active assignment via report_assignments', () => {
      const reportModelPath = path.join(rootDir, 'models/reportModel.js');
      const content = fs.readFileSync(reportModelPath, 'utf8');

      // In completeReport, markReportInProgress, delegateReport, cancelAssignment:
      // must query FROM report_assignments WHERE ticket_id = ? AND is_active = 1
      const countAssignmentQueries = (content.match(/FROM\s+report_assignments\s+WHERE\s+ticket_id\s*=\s*\?\s+AND\s+is_active\s*=\s*1/gi) || []).length;
      assert.ok(
        countAssignmentQueries >= 4,
        `Diharapkan minimal 4 pengecekan active assignment dari report_assignments, ditemukan: ${countAssignmentQueries}`
      );
    });
  });

  describe('3. Functional Execution Verification', () => {
    it('getReports mengembalikan data dengan assigned_to_user_id dan reported_region_id', async () => {
      const rows = await reportModel.getReports({ limit: 5 });
      assert.ok(Array.isArray(rows), 'getReports harus mengembalikan Array');

      if (rows.length > 0) {
        const sample = rows[0];
        assert.ok('reported_region_id' in sample || 'region_code' in sample, 'Record harus memiliki informasi region');
        assert.ok('assigned_to_user_id' in sample, 'Record harus memiliki assigned_to_user_id');
        assert.ok(!('current_region_id' in sample), 'Record tidak boleh memiliki current_region_id');
      }
    });

    it('getReportByTicketId mengembalikan detail laporan dengan assigned_to_user_id dan reported_region_id', async () => {
      // Ambil salah satu tiket dari database
      const [rows] = await pool.query('SELECT ticket_id FROM reports LIMIT 1');
      if (rows.length > 0) {
        const { ticket_id } = rows[0];
        const report = await reportModel.getReportByTicketId(ticket_id);
        assert.ok(report, 'Laporan harus ditemukan');
        assert.equal(report.ticket_id, ticket_id);
        assert.ok('reported_region_id' in report, 'Detail harus memiliki reported_region_id');
        assert.ok('assigned_to_user_id' in report, 'Detail harus memiliki assigned_to_user_id');
      }
    });
  });
});
