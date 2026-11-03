/**
 * Helper pagination terstandarisasi untuk antarmuka web.
 * Mengikuti pola pagination enterprise Telkom Sumbar.
 */

function buildPagination({
  baseUrl,
  queryParams = {},
  currentPage = 1,
  perPage = 10,
  totalItems = 0,
  currentItemCount = 0
}) {
  const page = Math.max(1, parseInt(currentPage, 10) || 1);
  const limit = Math.max(1, parseInt(perPage, 10) || 10);
  const total = Math.max(0, parseInt(totalItems, 10) || 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;

  const buildUrl = (targetPage) => {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(queryParams)) {
      if (val !== undefined && val !== null && String(val).trim() !== '' && key !== 'page') {
        params.set(key, String(val).trim());
      }
    }
    params.set('page', String(targetPage));
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  };

  const visiblePageNumbers = new Set([1, totalPages]);
  for (let p = safePage - 2; p <= safePage + 2; p += 1) {
    if (p >= 1 && p <= totalPages) {
      visiblePageNumbers.add(p);
    }
  }

  const sortedPages = Array.from(visiblePageNumbers).sort((a, b) => a - b);
  const items = [];
  let prevPage = 0;

  for (const p of sortedPages) {
    if (prevPage && p - prevPage > 1) {
      items.push({ type: 'ellipsis' });
    }
    items.push({
      type: 'page',
      number: p,
      active: p === safePage,
      href: buildUrl(p)
    });
    prevPage = p;
  }

  const actualCount = currentItemCount !== undefined && currentItemCount !== null
    ? currentItemCount
    : (total > 0 ? Math.min(limit, Math.max(0, total - offset)) : 0);

  return {
    page: safePage,
    perPage: limit,
    totalItems: total,
    totalPages,
    offset,
    from: total > 0 ? offset + 1 : 0,
    to: total > 0 ? offset + actualCount : 0,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages,
    previousUrl: safePage > 1 ? buildUrl(safePage - 1) : null,
    nextUrl: safePage < totalPages ? buildUrl(safePage + 1) : null,
    items
  };
}

module.exports = {
  buildPagination
};
