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

function hasCoreIntakeStructure(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return false;
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const matchedKeys = new Set();

  for (const line of lines) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const rawLabel = line.slice(0, separatorIndex).trim();
    const normalizedLabel = normalizeLabel(rawLabel);
    const mappedKey = KEY_ALIASES[normalizedLabel];

    if (mappedKey) {
      matchedKeys.add(mappedKey);
    }
  }

  return (
    matchedKeys.has('order_id') ||
    matchedKeys.has('summary') ||
    matchedKeys.has('region')
  );
}

function extractTicketIdFromText(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return null;
  }

  const directMatch = text.match(/TICKET[ \t]*ID[ \t]*:[ \t]*([^\r\n]+)/i);
  if (directMatch && directMatch[1] && directMatch[1].trim()) {
    return directMatch[1].trim().toUpperCase();
  }

  const looseMatch = text.match(/\b([A-Z]{2,}\d{3,}|[A-Z]+[-_]?\d{3,})\b/i);
  if (looseMatch && looseMatch[1] && looseMatch[1].trim()) {
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

function parseTelegramAllFields(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
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
  const ticketId = ticketValue ? ticketValue.split(/\s+/)[0].toUpperCase() : extractTicketIdFromText(text);

  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'ticket_id') {
      continue;
    }

    const trimmedValue = typeof value === 'string' ? value.trim() : '';
    if (trimmedValue) {
      fields[key] = trimmedValue;
    }
  }

  return {
    ticketId,
    fields,
    rawText
  };
}

function buildRegistrationFormatExample() {
  return [
    'DAFTAR',
    'NAMA: Farhan Muhammad',
    'NIK: 123456',
    'PERUSAHAAN: TELKOM AKSES',
    'UNIT: DAMAN',
    'ASAL: PDG'
  ].join('\n');
}

function parseReporterRegistration(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      isRegistrationAttempt: false,
      isValid: false,
      data: null,
      errors: ['Format pendaftaran kosong.']
    };
  }

  const rawText = text.trim();
  const lowerText = rawText.toLowerCase();
  const startsWithCommand = lowerText.startsWith('/daftar');
  const startsWithDaftar = rawText.toUpperCase().startsWith('DAFTAR');
  const hasKeywords = /NAMA\s*:/i.test(rawText) && /NIK\s*:/i.test(rawText);

  if (!startsWithCommand && !startsWithDaftar && !hasKeywords) {
    return {
      isRegistrationAttempt: false,
      isValid: false,
      data: null,
      errors: []
    };
  }

  // Jika berupa command /daftar (dengan atau tanpa @bot_username) tanpa isian data
  const commandMatch = rawText.match(/^\/daftar(?:@\w+)?(?:\s+(.*))?$/is);
  if (commandMatch) {
    const trailingContent = (commandMatch[1] || '').trim();
    if (!trailingContent) {
      return {
        isRegistrationAttempt: true,
        isValid: false,
        isCommandOnly: true,
        data: null,
        errors: ['Silakan lengkapi format data pendaftaran.']
      };
    }
  }

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const parsed = {};
  const errors = [];

  for (const line of lines) {
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const label = line.slice(0, sep).trim().toUpperCase();
    const val = line.slice(sep + 1).trim();

    if (label === 'NAMA' || label === 'NAMA LENGKAP') {
      parsed.full_name = val;
    } else if (label === 'NIK') {
      parsed.nik = val;
    } else if (label === 'PERUSAHAAN' || label === 'COMPANY' || label === 'PT' || label === 'ANAK PERUSAHAAN') {
      parsed.company = val;
    } else if (label === 'UNIT' || label === 'DIVISI' || label === 'BIDANG' || label === 'BAGIAN') {
      parsed.unit = val;
    } else if (label === 'ASAL' || label === 'REGION' || label === 'WILAYAH') {
      parsed.region = val.toUpperCase();
    } else if (label === 'AGENCY' || label === 'INSTANSI') {
      parsed.company = val;
    }
  }

  // Backward compatibility: jika user mengisi format lama (ASAL: TELKOM)
  const validAgenciesOld = ['TELKOM', 'HD', 'TELKOMSEL'];
  if (parsed.region && validAgenciesOld.includes(parsed.region) && !parsed.company) {
    parsed.company = parsed.region;
    parsed.region = null;
  }

  if (!parsed.full_name) {
    errors.push('NAMA wajib diisi.');
  }

  if (!parsed.nik) {
    errors.push('NIK wajib diisi.');
  } else if (!/^\d{6}$/.test(parsed.nik)) {
    errors.push('NIK harus terdiri dari tepat 6 digit angka.');
  }

  if (!parsed.company) {
    errors.push('PERUSAHAAN wajib diisi (Contoh: TELKOM, TELKOMSEL, TELKOM AKSES, INFOMEDIA, dll).');
  }

  if (!parsed.unit) {
    errors.push('UNIT / DIVISI wajib diisi (Contoh: DAMAN, HD, BGES, WFM, ROC, dll).');
  }

  let normalizedRegion = null;
  if (parsed.region) {
    const regUpper = parsed.region.toUpperCase().trim();
    if (regUpper === 'PDG' || regUpper === 'PADANG') {
      normalizedRegion = 'PDG';
    } else if (regUpper === 'BKT' || regUpper === 'BUKITTINGGI') {
      normalizedRegion = 'BKT';
    }
  }

  if (!normalizedRegion) {
    errors.push('ASAL wilayah wajib diisi dengan kode PDG atau BKT.');
  }

  return {
    isRegistrationAttempt: true,
    isValid: errors.length === 0,
    isCommandOnly: false,
    data: errors.length === 0 ? {
      full_name: parsed.full_name,
      nik: parsed.nik,
      company: parsed.company,
      unit: parsed.unit,
      region_code: normalizedRegion,
      region_id: normalizedRegion === 'BKT' ? 2 : 1,
      agency: parsed.company
    } : null,
    errors
  };
}

function parseTelegramConciseReport(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      isConciseReport: false,
      isValid: false,
      data: null,
      errors: ['Pesan laporan kosong.']
    };
  }

  const rawText = text.trim();

  // 1. Ekstraksi Ticket ID (INF diikuti digit)
  const ticketMatch = rawText.match(/\b(INF\d{6,14})\b/i);
  if (!ticketMatch) {
    return {
      isConciseReport: false,
      isValid: false,
      data: null,
      errors: ['Ticket ID tidak ditemukan.']
    };
  }
  const ticketId = ticketMatch[1].toUpperCase();

  // 2. Ekstraksi Order ID
  // Token alfanumerik 15-40 karakter yang bukan Ticket ID dan bukan URL
  let orderId = null;
  const orderRegex = /\b([A-Za-z0-9_-]{15,40})\b/g;
  let match;
  while ((match = orderRegex.exec(rawText)) !== null) {
    const token = match[1];
    if (token.toUpperCase().startsWith('INF') && /^\d+$/.test(token.slice(3))) {
      continue;
    }
    if (/^https?:\/\//i.test(token)) {
      continue;
    }
    // Prioritaskan token yang diawali huruf dan angka (misal MOph..., PDAk..., AOi...)
    if (!orderId || /^[A-Za-z]{2,5}\d/i.test(token)) {
      orderId = token;
      if (/^[A-Za-z]{2,5}\d/i.test(token)) break;
    }
  }

  // 3. Ekstraksi Service ID (nomor internet 12 digit dimulai angka 1 atau pola _INTERNET)
  let serviceId = null;
  const servicePatternMatch = rawText.match(/(?:^|[_\s:])(\d{10,12}_(?:INTERNET|IPTV|VOICE|TELP))\b/i);
  if (servicePatternMatch) {
    serviceId = servicePatternMatch[1];
  } else {
    const serviceNumMatch = rawText.match(/\b(1\d{11})\b/);
    if (serviceNumMatch) {
      serviceId = serviceNumMatch[1];
    }
  }

  // 4. Ekstraksi Summary
  let summary = '';
  const pipeIndex = rawText.indexOf('|');
  if (pipeIndex !== -1) {
    const afterPipe = rawText.slice(pipeIndex + 1);
    const lines = afterPipe.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const cleanLines = lines.filter((l) => {
      if (/^(?:mohon\s+bantuannya|moban|terima\s*kasih|makasih|thanks|thx)/i.test(l)) return false;
      if (/^\d{10,14}\s+[A-Za-z]/.test(l)) return false; // baris nama pelanggan
      return true;
    });
    summary = cleanLines.join(' ').trim();
  } else {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const filtered = lines.filter((l) => {
      if (l.includes(ticketId)) return false;
      if (orderId && l.includes(orderId)) return false;
      if (/^(?:mohon\s+bantuannya|moban|terima\s*kasih|makasih|thanks|thx)/i.test(l)) return false;
      if (/^\d{10,14}\s+[A-Za-z]/.test(l)) return false;
      return true;
    });
    summary = filtered.join(' ').trim();
  }

  // Jika summary masih kosong, beri deskripsi default kendala
  if (!summary) {
    summary = 'Kendala provisioning / aktivasi sistem';
  }

  return {
    isConciseReport: true,
    isValid: Boolean(ticketId),
    data: {
      ticket_id: ticketId,
      order_id: orderId || '-',
      summary: summary,
      service_id: serviceId || null,
      is_concise: true
    },
    errors: []
  };
}

module.exports = {
  parseTelegramCoreMessage,
  buildFormatExample,
  buildRegistrationFormatExample,
  parseReporterRegistration,
  parseTelegramConciseReport,
  extractTicketIdFromText,
  parseAdditionalDataMessage,
  parseTelegramEnrichmentMessage,
  parseTelegramAllFields,
  hasCoreIntakeStructure
};
