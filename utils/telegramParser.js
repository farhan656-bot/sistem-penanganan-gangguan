const REQUIRED_FIELDS = ['ticket_id', 'order_id', 'summary', 'region'];
const ENRICHMENT_FIELDS = new Set([
  'branch_name',
  'cluster_name',
  'sto',
  'provider',
  'service_type',
  'segment',
  'telkom_area',
  'service_id',
  'status_wfm',
  'status_andalas',
  'wo_number',
  'fallout_type'
]);

const KEY_ALIASES = {
  TICKETID: 'ticket_id',
  ORDERID: 'order_id',
  WONUMBER: 'wo_number',
  SERVICETYPE: 'service_type',
  SEGMENT: 'segment',
  PROVIDER: 'provider',
  TELKOMAREA: 'telkom_area',
  BRANCH: 'branch_name',
  BRANCHNAME: 'branch_name',
  CLUSTER: 'cluster_name',
  CLUSTERNAME: 'cluster_name',
  STO: 'sto',
  SUMMARY: 'summary',
  SERVICEID: 'service_id',
  STATUSWFM: 'status_wfm',
  STATUSANDALAS: 'status_andalas',
  REGION: 'region',
  FALLOUTTYPE: 'fallout_type'
};

function normalizeLabel(label) {
  return String(label || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function buildFormatExample() {
  return [
    'TICKET ID: INF000123',
    'ORDER ID: ORD000123',
    'WO NUMBER: WO000123',
    'SERVICE TYPE: INTERNET',
    'SEGMENT: ENTERPRISE',
    'PROVIDER: TELKOM',
    'TELKOM AREA: SUMBAR',
    'BRANCH: PADANG',
    'CLUSTER: KOTA PADANG',
    'STO: BDT',
    'SUMMARY: Gangguan koneksi internet pelanggan area Padang',
    'SERVICE ID: SRV000123',
    'STATUS WFM: OPEN',
    'STATUS ANDALAS: -',
    'REGION: PDG'
  ].join('\n');
}

function parseTelegramCoreMessage(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      isValid: false,
      errors: ['Pesan laporan kosong.'],
      data: null
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const data = {};

  for (const line of lines) {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    const rawLabel = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    const normalizedLabel = normalizeLabel(rawLabel);
    const mappedKey = KEY_ALIASES[normalizedLabel];

    if (!mappedKey) {
      continue;
    }

    data[mappedKey] = rawValue;
  }

  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    const value = typeof data[field] === 'string' ? data[field].trim() : '';

    if (!value) {
      errors.push(`Field ${field.toUpperCase()} wajib diisi.`);
    }
  }

  if (data.region && !['PDG', 'BKT'].includes(data.region.trim().toUpperCase())) {
    errors.push('Field REGION tidak valid. Gunakan PDG atau BKT.');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      data: null
    };
  }

  const normalizedData = {
    fallout_type: data.fallout_type || '',
    ticket_id: data.ticket_id.trim(),
    order_id: data.order_id.trim(),
    wo_number: data.wo_number || '',
    service_type: data.service_type || '',
    segment: data.segment || '',
    provider: data.provider || '',
    telkom_area: data.telkom_area || '',
    branch_name: data.branch_name || '',
    cluster_name: data.cluster_name || '',
    sto: data.sto || '',
    summary: data.summary.trim(),
    service_id: data.service_id || '',
    status_wfm: data.status_wfm || '',
    status_andalas: data.status_andalas || '',
    region: data.region.trim().toUpperCase()
  };

  return {
    isValid: true,
    errors: [],
    data: normalizedData
  };
}

function extractTicketIdFromText(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return null;
  }

  const directMatch = text.match(/TICKET\s*ID\s*:\s*([^\n\r]+)/i);
  if (directMatch && directMatch[1]) {
    return directMatch[1].trim().toUpperCase();
  }

  const looseMatch = text.match(/\b([A-Z]{2,}\d{3,}|[A-Z]+[-_]?\d{3,})\b/i);
  if (looseMatch && looseMatch[1]) {
    return looseMatch[1].trim().toUpperCase();
  }

  return null;
}

function parseAdditionalDataMessage(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      isValid: false,
      errors: ['Pesan tambahan kosong.'],
      ticketId: null,
      rawText: ''
    };
  }

  const ticketId = extractTicketIdFromText(text);
  if (!ticketId) {
    return {
      isValid: false,
      errors: ['Ticket ID tidak ditemukan pada data tambahan.'],
      ticketId: null,
      rawText: text.trim()
    };
  }

  return {
    isValid: true,
    errors: [],
    ticketId,
    rawText: text.trim()
  };
}

function parseTelegramEnrichmentMessage(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      isValid: false,
      hasTicketId: false,
      errors: ['Pesan tambahan kosong.'],
      ticketId: null,
      fields: {},
      rawText: ''
    };
  }

  const rawText = text.trim();
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const data = {};

  for (const line of lines) {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    const rawLabel = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    const normalizedLabel = normalizeLabel(rawLabel);
    const mappedKey = KEY_ALIASES[normalizedLabel];

    if (!mappedKey) {
      continue;
    }

    data[mappedKey] = rawValue;
  }

  const ticketValue = typeof data.ticket_id === 'string' ? data.ticket_id.trim() : '';
  const ticketId = ticketValue ? ticketValue.split(/\s+/)[0].toUpperCase() : null;

  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (!ENRICHMENT_FIELDS.has(key)) {
      continue;
    }

    const trimmedValue = typeof value === 'string' ? value.trim() : '';
    if (!trimmedValue) {
      continue;
    }

    fields[key] = trimmedValue;
  }

  const hasTicketId = Boolean(ticketId);
  const hasFields = Object.keys(fields).length > 0;
  const errors = [];

  if (!hasTicketId) {
    errors.push('Ticket ID tidak ditemukan pada data tambahan.');
  }

  if (hasTicketId && !hasFields) {
    errors.push('Tidak ada field tambahan yang valid.');
  }

  return {
    isValid: hasTicketId && hasFields,
    hasTicketId,
    errors,
    ticketId,
    fields,
    rawText
  };
}

module.exports = {
  parseTelegramCoreMessage,
  buildFormatExample,
  extractTicketIdFromText,
  parseAdditionalDataMessage,
  parseTelegramEnrichmentMessage
};
