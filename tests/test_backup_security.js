const path = require('path');
const fs = require('fs');

// Define temp dir for testing
const tempBackupDir = path.join(__dirname, 'temp_backups');

// 1. Clean up BEFORE require to ensure we test creation
if (fs.existsSync(tempBackupDir)) {
  fs.rmSync(tempBackupDir, { recursive: true, force: true });
}

// Mock pg
const mockPg = {
  Client: class {
    constructor(config) {}
    connect() { return Promise.resolve(); }
    query(sql) {
      if (sql.includes('pg_tables')) {
        return Promise.resolve({ rows: [{ tablename: 'test_table' }] });
      }
      return Promise.resolve({ rows: [{ id: 1, secret: 'data' }] });
    }
    end() { return Promise.resolve(); }
  }
};

// Mock node-cron
const mockCron = {
  schedule: () => {}
};

// Mock path to redirect 'backups' to 'tests/temp_backups'
const originalPath = require('path');
const mockPath = {
  ...originalPath,
  join: function(...args) {
    // Check if we are constructing the BACKUP_DIR
    // backup.js: path.join(__dirname, 'backups')
    // args[1] should be 'backups'
    if (args.length >= 2 && args[args.length - 1] === 'backups') {
        return tempBackupDir;
    }
    return originalPath.join(...args);
  }
};

// Override require
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === 'pg') return mockPg;
  if (request === 'node-cron') return mockCron;
  if (request === 'path') return mockPath;
  return originalRequire.apply(this, arguments);
};

// Load backup.js
const backup = require('../backup.js');

async function runTest() {
  console.log('Running backup security test (Safe Mode)...');
  console.log(`Using temp dir: ${tempBackupDir}`);

  try {
    // Check directory permissions (created on load)
    if (!fs.existsSync(tempBackupDir)) {
        console.error('Backup directory was not created on load!');
        process.exit(1);
    }

    const dirStats = fs.statSync(tempBackupDir);
    const dirMode = dirStats.mode & 0o777;
    console.log(`Directory permissions: ${dirMode.toString(8)}`);

    if (typeof backup.backupAllTables !== 'function') {
        throw new Error('backupAllTables is not exported!');
    }

    await backup.backupAllTables();

    // Check file permissions
    const files = fs.readdirSync(tempBackupDir);
    if (files.length === 0) throw new Error('No backup files created');

    const fileStats = fs.statSync(path.join(tempBackupDir, files[0]));
    const fileMode = fileStats.mode & 0o777;
    console.log(`File permissions: ${fileMode.toString(8)}`);

    // Verification
    let failed = false;

    // Check 700
    if (dirMode !== 0o700) {
        console.error('FAIL: Directory is not 700');
        failed = true;
    } else {
        console.log('PASS: Directory is 700');
    }

    // Check 600
    if (fileMode !== 0o600) {
        console.error('FAIL: File is not 600');
        failed = true;
    } else {
        console.log('PASS: File is 600');
    }

    // Cleanup
    if (fs.existsSync(tempBackupDir)) {
      fs.rmSync(tempBackupDir, { recursive: true, force: true });
    }

    if (failed) {
        console.log('Test failed');
        process.exit(1);
    } else {
        console.log('All security checks passed!');
    }

  } catch (err) {
    console.error('Test failed with error:', err);
    // Cleanup even on error
    if (fs.existsSync(tempBackupDir)) {
      fs.rmSync(tempBackupDir, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

runTest();
