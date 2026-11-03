const test = require('node:test');
const assert = require('node:assert/strict');

function filterEksekutorRows(rows, { query = '', region = 'all' } = {}) {
  const q = String(query || '').trim().toLowerCase();
  const reg = String(region || 'all').trim().toUpperCase();

  return rows.filter((row) => {
    const name = String(row.full_name || '').toLowerCase();
    const rowRegion = String(row.region_code || '').toUpperCase();

    const matchesRegion = reg === 'ALL' || rowRegion === reg;
    const matchesQuery = !q || name.includes(q) || rowRegion.toLowerCase().includes(q);

    return matchesRegion && matchesQuery;
  });
}

function paginateEksekutor(filteredRows, { page = 1, pageSize = 10 } = {}) {
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

test('Unit Test: Supervisor Rekap Kinerja Pegawai Eksekutor Filter & Paginasi', async (t) => {
  const mockEksekutor = [
    { id: 1, full_name: 'Farhan Muhammad', region_code: 'PDG', total_handled: 10, total_completed: 8 },
    { id: 2, full_name: 'Eksekutor PDG 2', region_code: 'PDG', total_handled: 5, total_completed: 5 },
    { id: 3, full_name: 'Eksekutor BKT 1', region_code: 'BKT', total_handled: 7, total_completed: 6 },
    { id: 4, full_name: 'Eksekutor BKT 2', region_code: 'BKT', total_handled: 4, total_completed: 3 },
    { id: 5, full_name: 'Muhammad Farhan', region_code: 'PDG', total_handled: 9, total_completed: 8 },
    { id: 6, full_name: 'Eksekutor Uji Baru', region_code: 'PDG', total_handled: 2, total_completed: 2 },
    { id: 7, full_name: 'Akram Makruf Aidil', region_code: 'PDG', total_handled: 6, total_completed: 5 },
    { id: 8, full_name: 'Teknisi PDG Lapangan 1', region_code: 'PDG', total_handled: 8, total_completed: 7 },
    { id: 9, full_name: 'Teknisi PDG Lapangan 2', region_code: 'PDG', total_handled: 4, total_completed: 4 },
    { id: 10, full_name: 'Teknisi PDG Lapangan 3', region_code: 'PDG', total_handled: 3, total_completed: 3 },
    { id: 11, full_name: 'Teknisi BKT Lapangan 1', region_code: 'BKT', total_handled: 5, total_completed: 4 },
    { id: 12, full_name: 'Teknisi BKT Lapangan 2', region_code: 'BKT', total_handled: 2, total_completed: 2 }
  ];

  await t.test('1. Batasi 10 baris per halaman pada total 12 pegawai eksekutor', () => {
    const page1 = paginateEksekutor(mockEksekutor, { page: 1, pageSize: 10 });
    assert.equal(page1.totalPages, 2);
    assert.equal(page1.items.length, 10);
    assert.equal(page1.from, 1);
    assert.equal(page1.to, 10);
    assert.equal(page1.items[0].full_name, 'Farhan Muhammad');
    assert.equal(page1.items[9].full_name, 'Teknisi PDG Lapangan 3');

    const page2 = paginateEksekutor(mockEksekutor, { page: 2, pageSize: 10 });
    assert.equal(page2.totalPages, 2);
    assert.equal(page2.items.length, 2);
    assert.equal(page2.from, 11);
    assert.equal(page2.to, 12);
    assert.equal(page2.items[0].full_name, 'Teknisi BKT Lapangan 1');
    assert.equal(page2.items[1].full_name, 'Teknisi BKT Lapangan 2');
  });

  await t.test('2. Button filter region (PDG & BKT) memfilter pegawai sesuai wilayah', () => {
    const all = filterEksekutorRows(mockEksekutor, { region: 'all' });
    assert.equal(all.length, 12);

    const pdgOnly = filterEksekutorRows(mockEksekutor, { region: 'PDG' });
    assert.equal(pdgOnly.length, 8);
    assert.equal(pdgOnly.every((u) => u.region_code === 'PDG'), true);

    const bktOnly = filterEksekutorRows(mockEksekutor, { region: 'BKT' });
    assert.equal(bktOnly.length, 4);
    assert.equal(bktOnly.every((u) => u.region_code === 'BKT'), true);
  });

  await t.test('3. Searching mencari nama pegawai eksekutor', () => {
    const searchFarhan = filterEksekutorRows(mockEksekutor, { query: 'farhan' });
    assert.equal(searchFarhan.length, 2);

    const searchAkram = filterEksekutorRows(mockEksekutor, { query: 'akram' });
    assert.equal(searchAkram.length, 1);
    assert.equal(searchAkram[0].full_name, 'Akram Makruf Aidil');
  });

  await t.test('4. Kombinasi searching nama pegawai dan filter button region', () => {
    const pdgFarhan = filterEksekutorRows(mockEksekutor, { query: 'farhan', region: 'PDG' });
    assert.equal(pdgFarhan.length, 2);

    const bktFarhan = filterEksekutorRows(mockEksekutor, { query: 'farhan', region: 'BKT' });
    assert.equal(bktFarhan.length, 0);

    const bktTeknisi = filterEksekutorRows(mockEksekutor, { query: 'teknisi', region: 'BKT' });
    assert.equal(bktTeknisi.length, 2);
  });
});

