function normalizeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeKey(value) {
  return normalizeString(value).toLowerCase();
}

function titleCase(value) {
  const text = normalizeString(value);
  if (!text) return '-';

  return text
    .split(/\s+|_/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return normalizeString(value) || '-';

  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(value) {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return normalizeString(value) || '-';

  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function ticketStatusMeta(status) {
  const key = normalizeKey(status);

  const map = {
    tersedia: { cls: 'text-bg-primary', label: 'Tersedia' },
    diambil: { cls: 'text-bg-warning', label: 'Diambil' },
    didelegasikan: { cls: 'text-bg-info', label: 'Didelegasikan' },
    selesai: { cls: 'text-bg-success', label: 'Selesai' },
    perlu_tindak_lanjut: { cls: 'text-bg-warning', label: 'Perlu Tindak Lanjut' },
    eskalasi: { cls: 'text-bg-danger', label: 'Eskalasi' }
  };

  if (key === 'baru') return { cls: 'text-bg-secondary', label: '-' };
  if (map[key]) return map[key];

  const fallbackLabel = key ? titleCase(key) : '-';
  return { cls: 'text-bg-secondary', label: fallbackLabel };
}

function regionSwitchStatusMeta(status) {
  const key = normalizeKey(status);

  const map = {
    pending: { cls: 'text-bg-warning', label: 'Pending' },
    approved: { cls: 'text-bg-success', label: 'Approved' },
    rejected: { cls: 'text-bg-danger', label: 'Rejected' },
    expired: { cls: 'text-bg-secondary', label: 'Expired' }
  };

  if (map[key]) return map[key];

  const fallbackLabel = key ? titleCase(key) : '-';
  return { cls: 'text-bg-secondary', label: fallbackLabel };
}

function userStatusMeta(value) {
  if (value === 1 || value === '1') return { cls: 'text-bg-success', label: 'Aktif' };
  if (value === 0 || value === '0') return { cls: 'text-bg-secondary', label: 'Nonaktif' };

  const key = normalizeKey(value);
  if (key === 'aktif') return { cls: 'text-bg-success', label: 'Aktif' };
  if (key === 'nonaktif') return { cls: 'text-bg-secondary', label: 'Nonaktif' };

  return { cls: 'text-bg-secondary', label: key ? titleCase(key) : '-' };
}

function roleMeta(role) {
  const key = normalizeKey(role);

  if (key === 'super_admin') return { cls: 'text-bg-danger', label: 'Super Admin' };
  if (key === 'supervisor') return { cls: 'text-bg-secondary', label: 'Supervisor' };
  if (key === 'koordinator') return { cls: 'text-bg-primary', label: 'Koordinator' };
  if (key === 'eksekutor') return { cls: 'text-bg-info', label: 'Eksekutor' };

  return { cls: 'text-bg-secondary', label: role ? normalizeString(role) : '-' };
}

module.exports = {
  formatDateTime,
  formatDate,
  ticketStatusMeta,
  regionSwitchStatusMeta,
  userStatusMeta,
  roleMeta
};
