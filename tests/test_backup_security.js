const path = require('path');
const assert = require('assert');
const Module = require('module');
const originalRequire = Module.prototype.require;

// Spies
const spies = {
  mkdirSync: [],
  writeFileSync: []
};

// Mock implementations
const fsMock = {
  existsSync: () => false,
  mkdirSync: (path, options) => {
    spies.mkdirSync.push({ path, options });
  },
  writeFileSync: (path, data, options) => {
    spies.writeFileSync.push({ path, data, options });
  },
  // Keep other necessary fs methods if used by other modules (though we mock pg/cron so maybe fine)
  // path is used by backup.js so we shouldn't mock 'path' module, but fs.join is not a thing.
};

const pgMock = {
  Client: class {
    constructor(config) { this.config = config; }
    connect() { return Promise.resolve(); }
    query(sql) {
      if (sql.includes('pg_tables')) {
        return Promise.resolve({ rows: [{ tablename: 'sensitive_data' }] });
      }
      return Promise.resolve({ rows: [{ id: 1, secret: 'abc' }] });
    }
    end() { return Promise.resolve(); }
  }
};

const cronMock = {
  schedule: () => {}
};

// Override require
Module.prototype.require = function(id) {
  if (id === 'fs') return fsMock;
  if (id === 'pg') return pgMock;
  if (id === 'node-cron') return cronMock;
  return originalRequire.call(this, id);
};

// Run test
async function runTest() {
  console.log('🛡️  Running Security Test: Backup File Permissions...');

  try {
    const backup = require('../backup.js');
    await backup.backupAllTables();

    let failure = false;

    // Verify mkdirSync permissions
    const mkdirCall = spies.mkdirSync[0];
    if (!mkdirCall) {
        console.error('❌ Error: mkdirSync was not called');
        failure = true;
    } else {
        // Check if mode is set to 0o700 (448 in decimal)
        const expectedDirMode = 0o700;
        const actualDirMode = mkdirCall.options && mkdirCall.options.mode;

        console.log(`mkdirSync called with options: ${JSON.stringify(mkdirCall.options)}`);

        if (actualDirMode !== expectedDirMode) {
            console.error(`❌ VULNERABILITY: Backup directory created with insecure permissions: ${actualDirMode || 'default'}`);
            failure = true;
        } else {
            console.log('✅ SECURE: Backup directory created with 0o700 permissions');
        }
    }

    // Verify writeFileSync permissions
    const writeCall = spies.writeFileSync[0];
    if (!writeCall) {
        console.error('❌ Error: writeFileSync was not called');
        failure = true;
    } else {
        // Check if mode is set to 0o600 (384 in decimal)
        const expectedFileMode = 0o600;
        const actualFileMode = writeCall.options && writeCall.options.mode;

        console.log(`writeFileSync called with options: ${JSON.stringify(writeCall.options)}`);

        if (actualFileMode !== expectedFileMode) {
            console.error(`❌ VULNERABILITY: Backup file created with insecure permissions: ${actualFileMode || 'default'}`);
            failure = true;
        } else {
            console.log('✅ SECURE: Backup file created with 0o600 permissions');
        }
    }

    if (failure) {
        console.log('⚠️  Security test FAILED. Vulnerabilities detected.');
        process.exit(1);
    } else {
        console.log('🎉  Security test PASSED. No vulnerabilities detected.');
        process.exit(0);
    }

  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

runTest();
