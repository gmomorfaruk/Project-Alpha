const Module = require('module');
const originalRequire = Module.prototype.require;
const path = require('path');

// Mock Data
const mockFs = {
  existsSync: (p) => {
    // If checking for backups dir, say it doesn't exist so we trigger creation
    if (p.endsWith('backups')) return false;
    return true;
  },
  mkdirSync: (path, options) => {
    mockFs.mkdirSyncCalls.push({ path, options });
  },
  writeFileSync: (path, data, options) => {
    mockFs.writeFileSyncCalls.push({ path, data, options });
  },
  mkdirSyncCalls: [],
  writeFileSyncCalls: []
};

const mockPg = {
  Client: class {
    connect() { return Promise.resolve(); }
    query(sql) {
        if (sql.includes('pg_tables')) {
            return Promise.resolve({ rows: [{ tablename: 'users' }] });
        }
        return Promise.resolve({ rows: [{ id: 1, name: 'Test User' }] });
    }
    end() { return Promise.resolve(); }
  }
};

const mockCron = {
  schedule: () => {}
};

// Override require
Module.prototype.require = function(request) {
  if (request === 'fs') return mockFs;
  if (request === 'pg') return mockPg;
  if (request === 'node-cron') return mockCron;
  return originalRequire.apply(this, arguments);
};

console.log('--- Starting Security Test ---');

try {
  // This will trigger top-level code, including mkdirSync
  const backup = require('../backup.js');

  // Verify mkdirSync (called at top level)
  const mkdirCall = mockFs.mkdirSyncCalls.find(c => c.path.endsWith('backups'));

  if (!mkdirCall) {
    console.error('FAIL: Backup directory was not created');
    process.exit(1);
  }

  // Check mkdirSync permissions
  // Mode 0o700 = 448
  const mkdirMode = mkdirCall.options && mkdirCall.options.mode;
  if (mkdirMode !== 0o700) {
    console.error(`FAIL: Backup directory created with insecure permissions. Expected 0o700 (448), got ${mkdirMode}`);
    // We don't exit here to check other failures
  } else {
    console.log('PASS: Backup directory created with 0o700');
  }

  // Run backup function to trigger writeFileSync
  backup.backupAllTables().then(() => {
    const writeCall = mockFs.writeFileSyncCalls[0];

    if (!writeCall) {
      console.error('FAIL: No backup files were written');
      process.exit(1);
    }

    // Check writeFileSync permissions
    // Mode 0o600 = 384
    const writeMode = writeCall.options && writeCall.options.mode;
    if (writeMode !== 0o600) {
      console.error(`FAIL: Backup file written with insecure permissions. Expected 0o600 (384), got ${writeMode}`);
      process.exit(1);
    } else {
      console.log('PASS: Backup file written with 0o600');
    }

    console.log('SUCCESS: All security checks passed!');
  }).catch(err => {
    console.error('Error running backup:', err);
    process.exit(1);
  });

} catch (err) {
  console.error('Test execution failed:', err);
  process.exit(1);
}
