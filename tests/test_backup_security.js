const assert = require('assert');
const path = require('path');

// Mock fs, pg, and node-cron
const fsMock = {
  existsSync: () => false,
  mkdirSync: (path, options) => {
    console.log(`mkdirSync called with path: ${path}, options:`, options);
    fsMock.lastMkdirOptions = options;
  },
  writeFileSync: (path, data, options) => {
    console.log(`writeFileSync called with path: ${path}, options:`, options);
    fsMock.lastWriteOptions = options;
  },
  lastMkdirOptions: null,
  lastWriteOptions: null
};

const pgMock = {
  Client: class {
    constructor(config) {}
    connect() { return Promise.resolve(); }
    query(sql) {
      if (sql.includes('pg_tables')) {
        return Promise.resolve({ rows: [{ tablename: 'test_table' }] });
      }
      return Promise.resolve({ rows: [{ id: 1, data: 'secret' }] });
    }
    end() { return Promise.resolve(); }
  }
};

const cronMock = {
  schedule: (cronTime, func) => {
    console.log(`cron.schedule called with: ${cronTime}`);
    // Do nothing, don't start a timer
  }
};

// Override require to return mocks
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'fs') return fsMock;
  if (id === 'pg') return pgMock;
  if (id === 'node-cron') return cronMock;
  return originalRequire.apply(this, arguments);
};

// Load the script
const backupScript = require('../backup.js');

async function runTest() {
  console.log('Running Security Test for Backup Script...');

  if (!backupScript.backupAllTables) {
    console.error('❌ backupAllTables is not exported. Please refactor backup.js to export it.');
    process.exit(1);
  }

  await backupScript.backupAllTables();

  // Check Directory Permissions
  const expectedDirMode = 0o700;
  // Node.js might convert octal to decimal in some contexts, but options object preserves it.
  // Note: 0o700 is 448 in decimal.

  if (fsMock.lastMkdirOptions && fsMock.lastMkdirOptions.mode === expectedDirMode) {
    console.log('✅ Directory creation has correct permissions (700)');
  } else {
    console.error(`❌ Directory creation missing secure permissions. Expected ${expectedDirMode}, got:`, fsMock.lastMkdirOptions);
    process.exit(1);
  }

  // Check File Permissions
  const expectedFileMode = 0o600;
  if (fsMock.lastWriteOptions && fsMock.lastWriteOptions.mode === expectedFileMode) {
    console.log('✅ File creation has correct permissions (600)');
  } else {
    console.error(`❌ File creation missing secure permissions. Expected ${expectedFileMode}, got:`, fsMock.lastWriteOptions);
    process.exit(1);
  }

  console.log('🎉 All Security Tests Passed!');
}

runTest().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
