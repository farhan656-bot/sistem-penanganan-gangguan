const test = require('node:test');
const assert = require('node:assert/strict');

function filterAttentionTickets(tickets, { region = 'all' } = {}) {
  const reg = String(region || 'all').trim().toUpperCase();

  return tickets.filter((ticket) => {
    const ticketRegion = String(ticket.region_code || '').trim().toUpperCase();
    return reg === 'ALL' || ticketRegion === reg;
  });
}

function paginateTickets(filteredTickets, { page = 1, pageSize = 10 } = {}) {
  const totalFiltered = filteredTickets.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const items = filteredTickets.slice(startIndex, endIndex);

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

test('Unit Test: Supervisor Tiket Perlu Perhatian Filter Region & Paginasi', async (t) => {
  const mockTickets = [
    { ticket_id: 'INF001', region_code: 'PDG', status_internal: 'perlu_tindak_lanjut' },
    { ticket_id: 'INF002', region_code: 'PDG', status_internal: 'eskalasi' },
    { ticket_id: 'INF003', region_code: 'PDG', status_internal: 'perlu_tindak_lanjut' },
    { ticket_id: 'INF004', region_code: 'PDG', status_internal: 'eskalasi' },
    { ticket_id: 'INF005', region_code: 'PDG', status_internal: 'perlu_tindak_lanjut' },
    { ticket_id: 'INF006', region_code: 'PDG', status_internal: 'eskalasi' },
    { ticket_id: 'INF007', region_code: 'PDG', status_internal: 'perlu_tindak_lanjut' },
    { ticket_id: 'INF008', region_code: 'PDG', status_internal: 'eskalasi' },
    { ticket_id: 'INF009', region_code: 'PDG', status_internal: 'perlu_tindak_lanjut' },
    { ticket_id: 'INF010', region_code: 'PDG', status_internal: 'eskalasi' },
    { ticket_id: 'INF011', region_code: 'PDG', status_internal: 'perlu_tindak_lanjut' },
    { ticket_id: 'INF012', region_code: 'PDG', status_internal: 'eskalasi' },
    { ticket_id: 'INF013', region_code: 'PDG', status_internal: 'perlu_tindak_lanjut' },
    { ticket_id: 'INF014', region_code: 'PDG', status_internal: 'eskalasi' },
    { ticket_id: 'INF015', region_code: 'BKT', status_internal: 'perlu_tindak_lanjut' },
    { ticket_id: 'INF016', region_code: 'BKT', status_internal: 'eskalasi' },
    { ticket_id: 'INF017', region_code: 'BKT', status_internal: 'perlu_tindak_lanjut' },
    { ticket_id: 'INF018', region_code: 'BKT', status_internal: 'eskalasi' }
  ];

  await t.test('1. Batasi 10 baris per halaman pada total 18 tiket perlu perhatian', () => {
    const page1 = paginateTickets(mockTickets, { page: 1, pageSize: 10 });
    assert.equal(page1.totalPages, 2);
    assert.equal(page1.items.length, 10);
    assert.equal(page1.from, 1);
    assert.equal(page1.to, 10);
    assert.equal(page1.items[0].ticket_id, 'INF001');
    assert.equal(page1.items[9].ticket_id, 'INF010');

    const page2 = paginateTickets(mockTickets, { page: 2, pageSize: 10 });
    assert.equal(page2.totalPages, 2);
    assert.equal(page2.items.length, 8);
    assert.equal(page2.from, 11);
    assert.equal(page2.to, 18);
    assert.equal(page2.items[0].ticket_id, 'INF011');
    assert.equal(page2.items[7].ticket_id, 'INF018');
  });

  await t.test('2. Button filter region BKT & PDG memfilter tiket sesuai wilayah', () => {
    const all = filterAttentionTickets(mockTickets, { region: 'all' });
    assert.equal(all.length, 18);

    const pdgOnly = filterAttentionTickets(mockTickets, { region: 'PDG' });
    assert.equal(pdgOnly.length, 14);
    assert.equal(pdgOnly.every((t) => t.region_code === 'PDG'), true);

    const bktOnly = filterAttentionTickets(mockTickets, { region: 'BKT' });
    assert.equal(bktOnly.length, 4);
    assert.equal(bktOnly.every((t) => t.region_code === 'BKT'), true);
  });

  await t.test('3. Paginasi pada hasil filter region (14 tiket PDG menghasilkan 2 halaman)', () => {
    const pdgTickets = filterAttentionTickets(mockTickets, { region: 'PDG' });
    const pdgPage1 = paginateTickets(pdgTickets, { page: 1, pageSize: 10 });
    assert.equal(pdgPage1.totalPages, 2);
    assert.equal(pdgPage1.items.length, 10);
    assert.equal(pdgPage1.from, 1);
    assert.equal(pdgPage1.to, 10);

    const pdgPage2 = paginateTickets(pdgTickets, { page: 2, pageSize: 10 });
    assert.equal(pdgPage2.totalPages, 2);
    assert.equal(pdgPage2.items.length, 4);
    assert.equal(pdgPage2.from, 11);
    assert.equal(pdgPage2.to, 14);
  });

  await t.test('4. Paginasi pada hasil filter region (4 tiket BKT berada dalam 1 halaman)', () => {
    const bktTickets = filterAttentionTickets(mockTickets, { region: 'BKT' });
    const bktPage1 = paginateTickets(bktTickets, { page: 1, pageSize: 10 });
    assert.equal(bktPage1.totalPages, 1);
    assert.equal(bktPage1.items.length, 4);
    assert.equal(bktPage1.from, 1);
    assert.equal(bktPage1.to, 4);
  });
});
