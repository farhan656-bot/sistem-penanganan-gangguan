require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seedSuperAdmin() {
  try {
    const username = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
    const fullName = process.env.SUPER_ADMIN_FULL_NAME || 'Super Admin Sistem';
    const plainPassword = process.env.SUPER_ADMIN_PASSWORD || '12345678';

    const [roles] = await pool.query(
      "SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1"
    );

    if (roles.length === 0) {
      console.log('Role super_admin belum tersedia. Tambahkan role super_admin terlebih dahulu.');
      process.exit(1);
    }

    const superAdminRoleId = roles[0].id;

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (existing.length > 0) {
      console.log(`User ${username} sudah ada, seed dilewati.`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await pool.query(
      `INSERT INTO users (full_name, username, password_hash, role_id, region_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, username, passwordHash, superAdminRoleId, null, 1]
    );

    console.log('Seed super admin berhasil.');
    console.log(`Username: ${username}`);
    console.log(`Password: ${plainPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Gagal seed super admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();
