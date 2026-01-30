const fs = require('fs');
const path = require('path');
const vm = require('vm');

const backupScriptPath = path.join(__dirname, '../backup.js');
const backupScriptContent = fs.readFileSync(backupScriptPath, 'utf8');

let mkdirCalls = 0;
let writeFileCalls = 0;
let errors = [];

// Mock objects
const mockFs = {
  existsSync: () => false,
  mkdirSync: (dirPath, options) => {
    mkdirCalls++;
    console.log(`[MOCK] mkdirSync called with path: ${dirPath}, options: ${JSON.stringify(options)}`);
    // Check permissions
    if (!options || options.mode !== 0o700) {
        errors.push(`SECURITY VIOLATION: mkdirSync called without secure permissions (0o700). Got: ${JSON.stringify(options)}`);
    }
  },
  writeFileSync: (filePath, data, options) => {
    writeFileCalls++;
    console.log(`[MOCK] writeFileSync called with path: ${filePath}, options: ${JSON.stringify(options)}`);
    // Check permissions
    if (!options || options.mode !== 0o600) {
        errors.push(`SECURITY VIOLATION: writeFileSync called without secure permissions (0o600). Got: ${JSON.stringify(options)}`);
    }
  }
};

const mockPg = {
  Client: class {
    constructor(config) {
      this.config = config;
    }
    connect() { return Promise.resolve(); }
    query(sql) {
      if (sql.includes('pg_tables')) {
        return Promise.resolve({ rows: [{ tablename: 'users' }] });
      }
      return Promise.resolve({ rows: [{ id: 1, email: 'test@example.com', password: 'plaintext' }] });
    }
    end() { return Promise.resolve(); }
  }
};

const mockCron = {
  schedule: () => {}
};

// Create a safe sandbox
const sandbox = {
  require: (moduleName) => {
    if (moduleName === 'fs') return mockFs;
    if (moduleName === 'pg') return mockPg;
    if (moduleName === 'node-cron') return mockCron;
    if (moduleName === 'path') return path;
    // Allow basic node modules if needed, or fail
    if (moduleName === 'util') return require('util');
    throw new Error(`Unexpected require: ${moduleName}`);
  },
  console: console,
  process: {
      env: {
          PGUSER: 'testuser',
          PGHOST: 'localhost',
          PGDATABASE: 'testdb',
          PGPASSWORD: 'testpass',
          PGPORT: 5432
      },
      exit: (code) => console.log(`Process exit called with code ${code}`)
  },
  __dirname: path.dirname(backupScriptPath),
  module: { exports: {} },
  setTimeout: setTimeout
};

// Mock require.main === module to trigger execution
sandbox.require.main = sandbox.module;

console.log('Running backup.js in sandbox...');

// We need to handle the async nature of backupAllTables if we want to catch writeFileSync errors
// Since backupAllTables is async but called without await at top level, we might exit before it finishes.
// However, in the VM, the promise chain will start.
// But vm.runInNewContext returns the result of the last statement.
// The script has:
// if (require.main === module) {
//   backupAllTables();
// }
// This returns a Promise. We should try to await it if possible, but we can't easily capture the return value of that if statement block.

// Helper to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    try {
        vm.runInNewContext(backupScriptContent, sandbox);

        // Give it a moment for async operations to complete (mockPg is resolved immediately but microtasks need to run)
        await sleep(100);

        if (errors.length > 0) {
            console.error('❌ Security Tests Failed:');
            errors.forEach(e => console.error('  - ' + e));
            process.exit(1);
        } else {
             if (mkdirCalls === 0 || writeFileCalls === 0) {
                 console.error('❌ Test Logic Error: backup functions were not called.');
                 process.exit(1);
             }
            console.log('✅ Security Tests Passed: permissions are secure.');
            process.exit(0);
        }
    } catch (error) {
        console.error('Runtime error during test:', error);
        process.exit(1);
    }
}

runTest();
