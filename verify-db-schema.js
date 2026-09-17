/**
 * Script untuk verifikasi struktur database aktual
 * Jalankan: node verify-db-schema.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyDatabaseSchema() {
  let connection;
  try {
    console.log('Menghubungkan ke database:', process.env.DB_NAME);
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    });

    console.log('✓ Koneksi berhasil!\n');

    // 1. List semua tabel
    console.log('=== DAFTAR TABEL ===');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME ASC
    `, [process.env.DB_NAME]);

    console.log(`Total tabel: ${tables.length}\n`);
    tables.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.TABLE_NAME}`);
    });

    // 2. Detail struktur setiap tabel
    console.log('\n=== STRUKTUR TABEL DETAIL ===\n');
    for (const tableRow of tables) {
      const tableName = tableRow.TABLE_NAME;
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
        [process.env.DB_NAME, tableName]
      );

      const [indexes] = await connection.query(
        `SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        [process.env.DB_NAME, tableName]
      );

      console.log(`\n--- Tabel: ${tableName} ---`);
      console.log('Kolom:');
      columns.forEach(col => {
        const key = col.COLUMN_KEY ? ` [${col.COLUMN_KEY}]` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? ' NULL' : ' NOT NULL';
        console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}${nullable}${key}`);
      });

      if (indexes.length > 0) {
        console.log('Index:');
        const indexGroups = {};
        indexes.forEach(idx => {
          if (!indexGroups[idx.INDEX_NAME]) indexGroups[idx.INDEX_NAME] = [];
          indexGroups[idx.INDEX_NAME].push(idx.COLUMN_NAME);
        });
        Object.entries(indexGroups).forEach(([indexName, cols]) => {
          console.log(`  - ${indexName} (${cols.join(', ')})`);
        });
      }
    }

    // 3. Foreign keys
    console.log('\n=== FOREIGN KEYS ===\n');
    const [fks] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `, [process.env.DB_NAME]);

    if (fks.length === 0) {
      console.log('Tidak ada foreign key yang didefinisikan secara eksplisit di database.');
    } else {
      fks.forEach(fk => {
        console.log(`${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    }

    console.log('\n✓ Verifikasi selesai.\n');

  } catch (error) {
    console.error('❌ Koneksi gagal:');
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('   MySQL server tidak berjalan atau tidak dapat dijangkau.');
      console.error('   Pastikan XAMPP/MySQL server sudah diaktifkan.');
    } else if (error.code === 'ER_ACCESS_DENIED_FOR_USER') {
      console.error('   Autentikasi gagal. Cek DB_USER dan DB_PASSWORD di .env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   Database tidak ditemukan:', process.env.DB_NAME);
    } else {
      console.error('   ' + error.message);
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

verifyDatabaseSchema();
