const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Clean up environment before test
if (fs.existsSync(BACKUP_DIR)) {
  try {
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    console.log('Removed existing backups directory.');
  } catch (e) {
    console.warn('Warning: Could not remove backups directory:', e.message);
  }
}

// Import backup.js - this triggers the mkdirSync
const { backupTable } = require('../backup');

// Mock client
const mockClient = {
  query: async () => ({ rows: [{ id: 1, data: 'secret_data' }] })
};

async function runTest() {
  console.log('Running security check for backup.js...');

  const tableName = 'test_security_table';
  const timestamp = 'test';

  // Run backup function
  await backupTable(mockClient, tableName, timestamp);

  const filePath = path.join(BACKUP_DIR, `${tableName}_${timestamp}.json`);

  // Verify file existence
  if (!fs.existsSync(filePath)) {
    console.error('Test failed: Backup file not created.');
    process.exit(1);
  }

  // Check File Permissions
  const fileStat = fs.statSync(filePath);
  const fileMode = fileStat.mode & 0o777;
  console.log(`File mode: 0o${fileMode.toString(8)}`);

  let failed = false;

  if (fileMode !== 0o600) {
    console.error(`SECURITY FAIL: File permissions are 0o${fileMode.toString(8)}, expected 0o600.`);
    failed = true;
  }

  // Check Directory Permissions
  const dirStat = fs.statSync(BACKUP_DIR);
  const dirMode = dirStat.mode & 0o777;
  console.log(`Directory mode: 0o${dirMode.toString(8)}`);

  if (dirMode !== 0o700) {
     console.error(`SECURITY FAIL: Directory permissions are 0o${dirMode.toString(8)}, expected 0o700.`);
     failed = true;
  }

  // Cleanup
  try {
      fs.unlinkSync(filePath);
      fs.rmdirSync(BACKUP_DIR);
  } catch(e) {}

  if (failed) {
      console.log('Test Failed: Insecure permissions detected.');
      process.exit(1);
  } else {
      console.log('SECURITY PASS: Permissions are correct.');
      process.exit(0);
  }
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
