const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPagination } = require('../../utils/paginationHelper');

test('Unit Test: utils/paginationHelper.js', async (t) => {
  await t.test('1. Menghitung totalPages dan offset dengan benar untuk 11 item dan limit 10', () => {
    // Halaman 1
    const p1 = buildPagination({
      baseUrl: '/users',
      queryParams: { search: 'budi' },
      currentPage: 1,
      perPage: 10,
      totalItems: 11,
      currentItemCount: 10
    });

    assert.equal(p1.page, 1);
    assert.equal(p1.perPage, 10);
    assert.equal(p1.totalItems, 11);
    assert.equal(p1.totalPages, 2);
    assert.equal(p1.offset, 0);
    assert.equal(p1.from, 1);
    assert.equal(p1.to, 10);
    assert.equal(p1.hasPrevious, false);
    assert.equal(p1.hasNext, true);
    assert.equal(p1.previousUrl, null);
    assert.equal(p1.nextUrl, '/users?search=budi&page=2');
    assert.equal(p1.items.length, 2);
    assert.equal(p1.items[0].number, 1);
    assert.equal(p1.items[0].active, true);
    assert.equal(p1.items[1].number, 2);
    assert.equal(p1.items[1].active, false);

    // Halaman 2
    const p2 = buildPagination({
      baseUrl: '/users',
      queryParams: { search: 'budi' },
      currentPage: 2,
      perPage: 10,
      totalItems: 11,
      currentItemCount: 1
    });

    assert.equal(p2.page, 2);
    assert.equal(p2.offset, 10);
    assert.equal(p2.from, 11);
    assert.equal(p2.to, 11);
    assert.equal(p2.hasPrevious, true);
    assert.equal(p2.hasNext, false);
    assert.equal(p2.previousUrl, '/users?search=budi&page=1');
    assert.equal(p2.nextUrl, null);
    assert.equal(p2.items[1].active, true);
  });

  await t.test('2. Menangani totalItems 0 secara aman', () => {
    const p0 = buildPagination({
      baseUrl: '/super-admin/reporters',
      currentPage: 1,
      perPage: 10,
      totalItems: 0,
      currentItemCount: 0
    });

    assert.equal(p0.totalItems, 0);
    assert.equal(p0.totalPages, 1);
    assert.equal(p0.from, 0);
    assert.equal(p0.to, 0);
    assert.equal(p0.hasPrevious, false);
    assert.equal(p0.hasNext, false);
    assert.equal(p0.previousUrl, null);
    assert.equal(p0.nextUrl, null);
  });

  await t.test('3. Menangani input halaman invalid (negatif atau non-angka)', () => {
    const pInvalid = buildPagination({
      baseUrl: '/users',
      currentPage: -5,
      perPage: 10,
      totalItems: 25
    });

    assert.equal(pInvalid.page, 1);
    assert.equal(pInvalid.offset, 0);
  });

  await t.test('4. Menjaga query parameters lain saat buildUrl', () => {
    const p = buildPagination({
      baseUrl: '/super-admin/reporters',
      queryParams: { status: 'pending', agency: 'TELKOM', search: 'Farhan' },
      currentPage: 1,
      perPage: 10,
      totalItems: 30,
      currentItemCount: 10
    });

    assert.equal(p.nextUrl, '/super-admin/reporters?status=pending&agency=TELKOM&search=Farhan&page=2');
    assert.equal(p.items[1].href, '/super-admin/reporters?status=pending&agency=TELKOM&search=Farhan&page=2');
  });
});
