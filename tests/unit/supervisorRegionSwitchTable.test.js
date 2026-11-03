const test = require('node:test');
const assert = require('node:assert/strict');

function filterRegionSwitchRows(rows, { query = '', region = 'all' } = {}) {
  const q = String(query || '').trim().toLowerCase();
  const reg = String(region || 'all').trim().toUpperCase();

  return rows.filter((row) => {
    const name = String(row.requester_name || '').toLowerCase();
    const target = String(row.target_region_code || '').toUpperCase();
    const home = String(row.home_region_code || '').toUpperCase();

    const matchesRegion = reg === 'ALL' || target === reg;
    const matchesQuery = !q || name.includes(q) || home.toLowerCase().includes(q) || target.toLowerCase().includes(q);

    return matchesRegion && matchesQuery;
  });
}

function paginateRows(filteredRows, { page = 1, pageSize = 10 } = {}) {
  const totalFiltered = filteredRows.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const items = filteredRows.slice(startIndex, endIndex);

  return {
    currentPage: safePage,
    pageSize,
    totalItems: totalFiltered,
    totalPages,
    startIndex,
    endIndex,
    from: totalFiltered > 0 ? startIndex + 1 : 0,
    to: endIndex,
    items
  };
}

test('Unit Test: Supervisor Riwayat Temporary Region Switch Filter & Pagination', async (t) => {
  const mockHistory = [
    { id: 1, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 2, requester_name: 'Eksekutor PDG 2', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 3, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 4, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 5, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 6, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 7, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 8, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 9, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 10, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 11, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 12, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 13, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 14, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 15, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 16, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 17, requester_name: 'Farhan Muhammad', home_region_code: 'PDG', target_region_code: 'BKT' },
    { id: 18, requester_name: 'Teknisi BKT 1', home_region_code: 'BKT', target_region_code: 'PDG' }
  ];

  await t.test('1. Batasi 10 baris per halaman pada total 18 data riwayat', () => {
    const page1 = paginateRows(mockHistory, { page: 1, pageSize: 10 });
    assert.equal(page1.totalPages, 2);
    assert.equal(page1.items.length, 10);
    assert.equal(page1.from, 1);
    assert.equal(page1.to, 10);
    assert.equal(page1.items[0].id, 1);
    assert.equal(page1.items[9].id, 10);

    const page2 = paginateRows(mockHistory, { page: 2, pageSize: 10 });
    assert.equal(page2.totalPages, 2);
    assert.equal(page2.items.length, 8);
    assert.equal(page2.from, 11);
    assert.equal(page2.to, 18);
    assert.equal(page2.items[0].id, 11);
    assert.equal(page2.items[7].id, 18);
  });

  await t.test('2. Searching mencari nama pegawai eksekutor', () => {
    const searchFarhan = filterRegionSwitchRows(mockHistory, { query: 'farhan' });
    assert.equal(searchFarhan.length, 16);

    const searchEksekutor2 = filterRegionSwitchRows(mockHistory, { query: 'pdg 2' });
    assert.equal(searchEksekutor2.length, 1);
    assert.equal(searchEksekutor2[0].requester_name, 'Eksekutor PDG 2');

    const searchUnknown = filterRegionSwitchRows(mockHistory, { query: 'tidak_ada' });
    assert.equal(searchUnknown.length, 0);
  });

  await t.test('3. Button filter region (PDG & BKT) memfilter riwayat sesuai wilayah tujuan', () => {
    const all = filterRegionSwitchRows(mockHistory, { region: 'all' });
    assert.equal(all.length, 18);

    const bktTarget = filterRegionSwitchRows(mockHistory, { region: 'BKT' });
    assert.equal(bktTarget.length, 17);
    assert.equal(bktTarget.every((r) => r.target_region_code === 'BKT'), true);

    const pdgTarget = filterRegionSwitchRows(mockHistory, { region: 'PDG' });
    assert.equal(pdgTarget.length, 1);
    assert.equal(pdgTarget[0].requester_name, 'Teknisi BKT 1');
    assert.equal(pdgTarget[0].target_region_code, 'PDG');
  });

  await t.test('4. Kombinasi searching nama pegawai dan filter button region', () => {
    const bktFarhan = filterRegionSwitchRows(mockHistory, { query: 'farhan', region: 'BKT' });
    assert.equal(bktFarhan.length, 16);

    const pdgFarhan = filterRegionSwitchRows(mockHistory, { query: 'farhan', region: 'PDG' });
    assert.equal(pdgFarhan.length, 0);
  });
});
