// tests/test_backup_security.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock fs
const mockFs = {
  existsSync: () => false,
  mkdirSync: (path, options) => {
    console.log(`mkdirSync called for ${path} with options:`, options);
    mockFs.mkdirCall = { path, options };
  },
  writeFileSync: (path, content, options) => {
    console.log(`writeFileSync called for ${path} with options:`, options);
    mockFs.writeFileCall = { path, options };
  },
  // Pass through other methods if needed
};

// Mock pg
const mockPg = {
  Client: class {
    constructor() { }
    connect() { return Promise.resolve(); }
    query() {
        // Mock query results
        return Promise.resolve({ rows: [{ tablename: 'test_table' }] });
    }
    end() { return Promise.resolve(); }
  }
};

// Mock node-cron
const mockCron = {
  schedule: () => {}
};

// Custom require
function mockRequire(moduleName) {
  if (moduleName === 'fs') return mockFs;
  if (moduleName === 'pg') return mockPg;
  if (moduleName === 'node-cron') return mockCron;
  if (moduleName === 'path') return path;
  try {
    return require(moduleName);
  } catch (e) {
    // If it's a relative path, resolve it relative to the original file
    // But for this test we only expect the modules above.
    return {};
  }
}

// Read and execute backup.js
const backupJsPath = path.join(__dirname, '../backup.js');
const backupJsContent = fs.readFileSync(backupJsPath, 'utf8');

// Wrap code to return the function we want to test
// We append a return statement to the end of the script logic to expose backupAllTables
// Note: backup.js defines backupAllTables in the top scope.
// However, since we are inside a function, we need to make sure we access it.
// The easiest way is to modify the content slightly to export it,
// OR simply invoke it inside the wrapper and wait for it.

const wrappedCode = `
(async function(require, module, process, console) {
  // Shadowing console to prevent noise if desired, but we want to see logs

  // We need to strip the "require.main === module" check or mock require.main
  // to avoid auto-execution if we want to control it.
  // Actually, we WANT to control it.

  // Mocking require.main to NOT be module
  require.main = {};

  ${backupJsContent}

  // Explicitly return the function
  return backupAllTables;
})`;

async function runTest() {
  try {
    const factory = eval(wrappedCode);
    const backupAllTables = await factory(mockRequire, { exports: {} }, process, console);

    console.log('Running backupAllTables...');
    await backupAllTables();

    console.log('Verifying permissions...');
    let passed = true;

    // Check directory permissions
    if (!mockFs.mkdirCall) {
         console.error('❌ mkdirSync was not called');
         passed = false;
    } else {
        const mode = mockFs.mkdirCall.options ? mockFs.mkdirCall.options.mode : undefined;
        // 0o700 is 448
        if (mode !== 0o700) {
             console.error(`❌ Insecure directory permissions. Expected 0o700 (448), got ${JSON.stringify(mode)}`);
             passed = false;
        } else {
             console.log('✅ Directory permissions OK');
        }
    }

    // Check file permissions
     if (!mockFs.writeFileCall) {
         console.error('❌ writeFileSync was not called');
         passed = false;
    } else {
        const mode = mockFs.writeFileCall.options ? mockFs.writeFileCall.options.mode : undefined;
        // 0o600 is 384
        if (mode !== 0o600) {
             console.error(`❌ Insecure file permissions. Expected 0o600 (384), got ${JSON.stringify(mode)}`);
             passed = false;
        } else {
             console.log('✅ File permissions OK');
        }
    }

    if (passed) {
        console.log('✅ ALL TESTS PASSED');
        process.exit(0);
    } else {
        console.error('❌ TESTS FAILED');
        process.exit(1);
    }

  } catch (e) {
    console.error('Error running test wrapper:', e);
    process.exit(1);
  }
}

runTest();
