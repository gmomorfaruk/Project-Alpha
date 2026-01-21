// backup.js
// Node.js script to export all PostgreSQL tables to JSON files

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const crypto = require('crypto');

// === CONFIGURATION ===
const dbConfig = {
  user: process.env.PGUSER || 'your_db_user',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'your_db_name',
  password: process.env.PGPASSWORD || 'your_db_password',
  port: process.env.PGPORT || 5432,
};

// Use a hidden directory for backups to reduce visibility
const BACKUP_DIR = path.join(__dirname, '.backups');

// Ensure backup directory exists with secure permissions (0700)
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { mode: 0o700 });
}

async function getTableNames(client) {
  const res = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
  return res.rows.map(row => row.tablename);
}

async function backupTable(client, tableName, timestamp) {
  const res = await client.query(`SELECT * FROM "${tableName}"`);
  // Add a random suffix to prevent filename enumeration/guessing
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const filePath = path.join(BACKUP_DIR, `${tableName}_${timestamp}_${randomSuffix}.json`);

  // Write file with restricted permissions (0600 - read/write only by owner)
  fs.writeFileSync(filePath, JSON.stringify(res.rows, null, 2), { mode: 0o600 });
  console.log(`Backed up ${tableName} to ${filePath}`);
}

async function backupAllTables() {
  const client = new Client(dbConfig);
  await client.connect();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  try {
    const tables = await getTableNames(client);
    for (const table of tables) {
      await backupTable(client, table, timestamp);
    }
    console.log('Backup completed successfully.');
  } catch (err) {
    console.error('Backup failed:', err);
  } finally {
    await client.end();
  }
}

// Only run schedule if executed directly
if (require.main === module) {
  // Schedule backup: every day at 2:00 AM
  cron.schedule('0 2 * * *', () => {
    console.log('Starting scheduled backup...');
    backupAllTables();
  });

  console.log('Backup service started. Running initial backup...');
  backupAllTables();
}

// Export functions for testing
module.exports = {
  backupTable,
  BACKUP_DIR
};
