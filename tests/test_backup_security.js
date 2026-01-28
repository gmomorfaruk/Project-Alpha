const assert = require('assert');
const path = require('path');

// Mock dependencies
const mockFs = {
  existsSync: () => false,
  mkdirSync: (path, options) => {
    mockFs.mkdirCall = { path, options };
  },
  writeFileSync: (path, content, options) => {
    if (!mockFs.writes) mockFs.writes = [];
    mockFs.writes.push({ path, content, options });
  },
  mkdirCall: null,
  writes: []
};

const mockPg = {
  Client: class {
    constructor(config) { this.config = config; }
    connect() { return Promise.resolve(); }
    query(sql) {
      if (sql.includes('pg_tables')) {
        return Promise.resolve({ rows: [{ tablename: 'users' }] });
      }
      return Promise.resolve({ rows: [{ id: 1, name: 'Test' }] });
    }
    end() { return Promise.resolve(); }
  }
};

const mockCron = {
  schedule: () => {}
};

// Override require to inject mocks
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === 'fs') return mockFs;
  if (request === 'pg') return mockPg;
  if (request === 'node-cron') return mockCron;
  return originalRequire.apply(this, arguments);
};

// Load the module under test
const backup = require('../backup.js');

async function runTest() {
  console.log('Running Backup Security Test...');

  try {
    // Run the backup function
    await backup.backupAllTables();

    // Check mkdir permissions
    const mkdirCall = mockFs.mkdirCall;
    if (!mkdirCall) {
        throw new Error('mkdirSync was not called');
    }

    // Check if mode is 0o700 (448 in decimal)
    const expectedDirMode = 0o700;

    // Check file permissions
    const fileWrite = mockFs.writes[0];
    if (!fileWrite) {
        throw new Error('writeFileSync was not called');
    }

    const expectedFileMode = 0o600;

    let failures = [];

    // Check mkdirSync mode
    // It can be passed as 2nd arg (int) or { mode: ... }
    const dirMode = (typeof mkdirCall.options === 'number') ? mkdirCall.options : (mkdirCall.options ? mkdirCall.options.mode : undefined);

    if (dirMode !== expectedDirMode) {
        failures.push(`❌ Vulnerability: Backup directory created with insecure permissions. Expected 0o700 (448), got ${dirMode}`);
    }

    // Check writeFileSync mode
    // It is usually passed in options object { mode: ... } as 3rd arg
    const fileMode = (typeof fileWrite.options === 'object') ? fileWrite.options.mode : undefined;

    if (fileMode !== expectedFileMode) {
        failures.push(`❌ Vulnerability: Backup file created with insecure permissions. Expected 0o600 (384), got ${fileMode}`);
    }

    if (failures.length > 0) {
        console.error(failures.join('\n'));
        console.log('Test Failed (Expected behavior before fix)');
        process.exit(1);
    } else {
        console.log('✅ Success: Backup directory and files are created with secure permissions.');
    }

  } catch (err) {
    console.error('Test Error:', err);
    process.exit(1);
  }
}

runTest();
