require('dotenv').config();
const pool = require('../config/db');

async function seedReports() {
  try {
    const [regions] = await pool.query('SELECT * FROM regions');
    const regionMap = {};
    regions.forEach(region => {
      regionMap[region.code] = region.id;
    });

    const reports = [
      {
        fallout_type: 'DAMAN',
        ticket_id: 'INF000001',
        order_id: 'ORD000001',
        service_type: 'UIM DATA',
        segment: 'ENTERPRISE',
        provider: 'TELKOM',
        telkom_area: 'INNER SUMBAR',
        branch_name: 'PADANG',
        cluster_name: 'KOTA PADANG',
        sto: 'BDT',
        summary: 'Gangguan koneksi layanan data di area Padang',
        service_id: 'SRV000001',
        status_wfm: 'OPEN',
        status_andalas: '-',
        status_internal: 'tersedia',
        reported_region_id: regionMap['PDG'],
        current_region_id: regionMap['PDG']
      },
      {
        fallout_type: 'FBB',
        ticket_id: 'INF000002',
        order_id: 'ORD000002',
        service_type: 'INTERNET',
        segment: 'RETAIL',
        provider: 'TELKOMSEL',
        telkom_area: 'INNER SUMBAR',
        branch_name: 'BUKITTINGGI',
        cluster_name: 'KOTA BUKITTINGGI',
        sto: 'BKT',
        summary: 'Gangguan internet pelanggan area Bukittinggi',
        service_id: 'SRV000002',
        status_wfm: 'OPEN',
        status_andalas: '-',
        status_internal: 'tersedia',
        reported_region_id: regionMap['BKT'],
        current_region_id: regionMap['BKT']
      },
      {
        fallout_type: 'NASIONAL',
        ticket_id: 'INF000003',
        order_id: 'ORD000003',
        service_type: 'ACTIVATION',
        segment: 'ENTERPRISE',
        provider: 'TELKOM',
        telkom_area: 'INNER SUMBAR',
        branch_name: 'PADANG',
        cluster_name: 'SOLOK SELATAN',
        sto: 'SLK',
        summary: 'Gangguan aktivasi layanan belum selesai diproses',
        service_id: 'SRV000003',
        status_wfm: 'OPEN',
        status_andalas: '-',
        status_internal: 'tersedia',
        reported_region_id: regionMap['PDG'],
        current_region_id: regionMap['PDG']
      }
    ];

    for (const report of reports) {
      const [existing] = await pool.query(
        'SELECT id FROM reports WHERE ticket_id = ?',
        [report.ticket_id]
      );

      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO reports
          (fallout_type, ticket_id, order_id, service_type, segment, provider, telkom_area, branch_name, cluster_name, sto, summary, service_id, status_wfm, status_andalas, status_internal, reported_region_id, current_region_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            report.fallout_type,
            report.ticket_id,
            report.order_id,
            report.service_type,
            report.segment,
            report.provider,
            report.telkom_area,
            report.branch_name,
            report.cluster_name,
            report.sto,
            report.summary,
            report.service_id,
            report.status_wfm,
            report.status_andalas,
            report.status_internal,
            report.reported_region_id,
            report.current_region_id
          ]
        );
        console.log(`Report ${report.ticket_id} berhasil ditambahkan`);
      } else {
        console.log(`Report ${report.ticket_id} sudah ada, dilewati`);
      }
    }

    console.log('Seed report selesai.');
    process.exit();
  } catch (error) {
    console.error('Gagal seed report:', error);
    process.exit(1);
  }
}

seedReports();