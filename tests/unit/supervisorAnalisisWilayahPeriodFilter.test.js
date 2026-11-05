const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Helper fungsi periode yang sama dengan controllers/dashboardController.js
function normalizePeriod(value) {
  const allowed = ['all', 'today', 'last_7_days', 'this_week', 'this_month', 'custom'];
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : 'all';
  return allowed.includes(normalized) ? normalized : 'all';
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseDateOnly(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildReportDateRange(period, startDate, endDate) {
  const now = new Date();

  if (period === 'today') {
    return {
      start: startOfDay(now),
      end: now
    };
  }

  if (period === 'last_7_days' || period === 'this_week') {
    const start = startOfDay(new Date(now));
    start.setDate(start.getDate() - 6);
    return {
      start,
      end: now
    };
  }

  if (period === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: startOfDay(start),
      end: now
    };
  }

  if (period === 'custom') {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);

    if (!start || !end) {
      return { start: null, end: null };
    }

    const startDateTime = startOfDay(start);
    const endDateTime = endOfDay(end);

    if (startDateTime.getTime() > endDateTime.getTime()) {
      return { start: null, end: null };
    }

    return { start: startDateTime, end: endDateTime };
  }

  return { start: null, end: null };
}

test('Unit Test: Supervisor Analisis Wilayah Period Filter (Hari Ini, Minggu Ini, Bulan Ini, Custom)', async (t) => {
  await t.test('1. Validasi normalisasi period untuk hari ini, minggu ini, bulan ini, dan custom', () => {
    assert.equal(normalizePeriod('today'), 'today');
    assert.equal(normalizePeriod('this_week'), 'this_week');
    assert.equal(normalizePeriod('last_7_days'), 'last_7_days');
    assert.equal(normalizePeriod('this_month'), 'this_month');
    assert.equal(normalizePeriod('custom'), 'custom');
    assert.equal(normalizePeriod('all'), 'all');
    assert.equal(normalizePeriod('unknown_period'), 'all');
    assert.equal(normalizePeriod(''), 'all');
    assert.equal(normalizePeriod(null), 'all');
  });

  await t.test('2. Perhitungan rentang tanggal buildReportDateRange', () => {
    // Hari Ini
    const todayRange = buildReportDateRange('today');
    assert.notEqual(todayRange.start, null);
    assert.notEqual(todayRange.end, null);
    assert.equal(todayRange.start.getHours(), 0);
    assert.equal(todayRange.start.getMinutes(), 0);

    // Minggu Ini
    const weekRange = buildReportDateRange('this_week');
    assert.notEqual(weekRange.start, null);
    assert.notEqual(weekRange.end, null);
    const dayDiff = Math.round((weekRange.end - weekRange.start) / (1000 * 60 * 60 * 24));
    assert.ok(dayDiff >= 6 && dayDiff <= 7);

    // Bulan Ini
    const monthRange = buildReportDateRange('this_month');
    assert.notEqual(monthRange.start, null);
    assert.equal(monthRange.start.getDate(), 1);

    // Custom Valid
    const customRange = buildReportDateRange('custom', '2026-11-01', '2026-11-05');
    assert.notEqual(customRange.start, null);
    assert.notEqual(customRange.end, null);

    // Custom Invalid (Mulai > Sampai)
    const invalidCustomRange = buildReportDateRange('custom', '2026-11-10', '2026-11-05');
    assert.equal(invalidCustomRange.start, null);
    assert.equal(invalidCustomRange.end, null);
  });

  await t.test('3. Template dashboard.ejs memuat tombol dan collapse panel di Section Analisis Wilayah', () => {
    const dashboardViewPath = path.join(process.cwd(), 'views', 'supervisor', 'dashboard.ejs');
    const viewContent = fs.readFileSync(dashboardViewPath, 'utf8');

    // Section 2 Analisis Wilayah harus memuat kontrol filter periode
    assert.ok(viewContent.includes('id="analisis-wilayah"'), 'Section #analisis-wilayah harus ada');
    assert.ok(viewContent.includes('period=today#analisis-wilayah'), 'Tombol Hari Ini harus ada dan mengarah ke #analisis-wilayah');
    assert.ok(viewContent.includes('period=this_week#analisis-wilayah'), 'Tombol Minggu Ini harus ada dan mengarah ke #analisis-wilayah');
    assert.ok(viewContent.includes('period=this_month#analisis-wilayah'), 'Tombol Bulan Ini harus ada dan mengarah ke #analisis-wilayah');
    assert.ok(viewContent.includes('data-bs-target="#customDateFilterCollapseWilayah"'), 'Tombol Custom harus memiliki target collapse');
    assert.ok(viewContent.includes('id="customDateFilterCollapseWilayah"'), 'Collapse panel custom date harus ada');
    assert.ok(viewContent.includes('id="startDateInputWilayah"'), 'Input tanggal mulai custom harus ada');
    assert.ok(viewContent.includes('id="endDateInputWilayah"'), 'Input tanggal sampai custom harus ada');
  });

  await t.test('4. JavaScript frontend menangani submit form custom dengan hash #analisis-wilayah', () => {
    const jsPath = path.join(process.cwd(), 'public', 'js', 'supervisor-dashboard.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    assert.ok(jsContent.includes('customPeriodFormWilayah'), 'Script harus menginisialisasi customPeriodFormWilayah');
    assert.ok(jsContent.includes('#analisis-wilayah'), 'Script harus mempertahankan hash #analisis-wilayah saat submit');
  });
});
