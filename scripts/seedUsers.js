require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seedUsers() {
  try {
    const password = '12345678';
    const passwordHash = await bcrypt.hash(password, 10);

    // Ambil role
    const [roles] = await pool.query('SELECT * FROM roles');
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role.id;
    });

    // Ambil region
    const [regions] = await pool.query('SELECT * FROM regions');
    const regionMap = {};
    regions.forEach(region => {
      regionMap[region.code] = region.id;
    });

    const users = [
      {
        full_name: 'Eksekutor PDG 1',
        username: 'eksekutor_pdg_1',
        password_hash: passwordHash,
        role_id: roleMap['eksekutor'],
        region_id: regionMap['PDG']
      },
      {
        full_name: 'Eksekutor PDG 2',
        username: 'eksekutor_pdg_2',
        password_hash: passwordHash,
        role_id: roleMap['eksekutor'],
        region_id: regionMap['PDG']
      },
      {
        full_name: 'Eksekutor BKT 1',
        username: 'eksekutor_bkt_1',
        password_hash: passwordHash,
        role_id: roleMap['eksekutor'],
        region_id: regionMap['BKT']
      },
      {
        full_name: 'Eksekutor BKT 2',
        username: 'eksekutor_bkt_2',
        password_hash: passwordHash,
        role_id: roleMap['eksekutor'],
        region_id: regionMap['BKT']
      },
      {
        full_name: 'Koordinator Utama',
        username: 'koordinator',
        password_hash: passwordHash,
        role_id: roleMap['koordinator'],
        region_id: null
      },
      {
        full_name: 'Supervisor Utama',
        username: 'supervisor',
        password_hash: passwordHash,
        role_id: roleMap['supervisor'],
        region_id: null
      }
    ];

    for (const user of users) {
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE username = ?',
        [user.username]
      );

      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO users (full_name, username, password_hash, role_id, region_id)
           VALUES (?, ?, ?, ?, ?)`,
          [
            user.full_name,
            user.username,
            user.password_hash,
            user.role_id,
            user.region_id
          ]
        );
        console.log(`User ${user.username} berhasil ditambahkan`);
      } else {
        console.log(`User ${user.username} sudah ada, dilewati`);
      }
    }

    console.log('\nSeed user selesai.');
    console.log('Password semua user: 12345678');
    process.exit();
  } catch (error) {
    console.error('Gagal seed user:', error);
    process.exit(1);
  }
}

seedUsers();