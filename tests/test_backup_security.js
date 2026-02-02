// tests/test_backup_security.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// --- Mocks ---

// Mock pg
// We need to mock 'pg' before it's required by backup.js.
// Since we can't easily intercept require('pg') without tools,
// we rely on the fact that require returns the same object.
let pg;
try {
    pg = require('pg');
} catch (e) {
    // If pg is not installed in the environment where we run tests, create a dummy one.
    // However, require('../backup.js') will fail if pg is missing.
    // We assume pg is present as it is a dependency.
    console.log("pg module not found via require, creating dummy for test context if needed.");
}

if (pg) {
    // backup.js does: const { Client } = require('pg');
    // So we need to overwrite pg.Client
    pg.Client = class MockClient {
        constructor(config) {
            this.config = config;
        }
        async connect() { console.log('Mock DB connected'); }
        async end() { console.log('Mock DB disconnected'); }
        async query(sql) {
            // console.log(`Mock DB Query: ${sql}`);
            if (sql.includes('pg_tables')) {
                return { rows: [{ tablename: 'users' }, { tablename: 'orders' }] };
            }
            if (sql.includes('SELECT * FROM')) {
                return { rows: [{ id: 1, data: 'test data' }] };
            }
            return { rows: [] };
        }
    };
}

// Mock fs
const originalMkdirSync = fs.mkdirSync;
const originalWriteFileSync = fs.writeFileSync;
const originalExistsSync = fs.existsSync;

let mkdirCalls = [];
let writeFileCalls = [];

fs.mkdirSync = function(path, options) {
    console.log(`fs.mkdirSync called with path: ${path}, options:`, options);
    mkdirCalls.push({ path, options });
    return undefined;
};

fs.writeFileSync = function(path, content, options) {
    console.log(`fs.writeFileSync called with path: ${path}, options:`, options);
    writeFileCalls.push({ path, content, options });
};

fs.existsSync = function(path) {
    // Force mkdirSync to be called for the backup dir
    if (path.toString().endsWith('backups')) return false;
    return true;
};

// --- Run SUT ---

console.log('--- Starting Test ---');

// We need to handle the fact that backup.js might try to run cron or other things.
// But mostly we care about the exports.
let backup;
try {
    backup = require('../backup.js');
} catch (e) {
    console.error("Failed to require backup.js:", e);
    process.exit(1);
}

async function runTest() {
    try {
        // Run the main backup function
        await backup.backupAllTables();

        console.log('--- Verifying Results ---');

        // 1. Verify Directory Permissions
        // The mkdirSync should have been called at module load time because we mocked existsSync to return false.
        const backupDirCall = mkdirCalls.find(c => c.path.toString().endsWith('backups'));

        if (!backupDirCall) {
             throw new Error("fs.mkdirSync was not called for 'backups' directory.");
        }

        const mkdirMode = backupDirCall.options ? backupDirCall.options.mode : undefined;
        console.log(`mkdirSync mode observed: ${mkdirMode}`);

        if (mkdirMode !== 0o700) {
            throw new Error(`Security Vulnerability: Backup directory created with insecure permissions: ${mkdirMode}. Expected: 448 (0o700)`);
        }

        // 2. Verify File Permissions
        if (writeFileCalls.length === 0) {
             throw new Error("fs.writeFileSync was not called.");
        }

        const fileCall = writeFileCalls[0];
        const fileMode = fileCall.options ? fileCall.options.mode : undefined;
        console.log(`writeFileSync mode observed: ${fileMode}`);

        if (fileMode !== 0o600) {
            throw new Error(`Security Vulnerability: Backup file created with insecure permissions: ${fileMode}. Expected: 384 (0o600)`);
        }

        console.log('✅ Test Passed: Permissions are secure.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test Failed:', err.message);
        process.exit(1);
    }
}

runTest();
