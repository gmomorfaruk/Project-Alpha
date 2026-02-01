const fs = require('fs');
const path = require('path');

// Mock Browser Environment
const localStorageData = {};
const localStorage = {
    getItem: (key) => localStorageData[key] || null,
    setItem: (key, value) => { localStorageData[key] = value.toString(); },
    removeItem: (key) => { delete localStorageData[key]; }
};

const document = {
    createElement: (tag) => ({ textContent: '', innerHTML: '' }),
    addEventListener: (event, cb) => {} // Mock
};

const window = {
    Security: null
};

// Global mocks
global.localStorage = localStorage;
global.document = document;
global.window = window;
global.location = { search: '' };
global.sessionStorage = {
    getItem: (key) => null,
    setItem: (key, value) => {}
};
global.crypto = {
    getRandomValues: (arr) => arr // Mock
};

// Load Security.js
const securityPath = path.join(__dirname, '../js/security.js');
const securityContent = fs.readFileSync(securityPath, 'utf8');

// Execute security.js in this context
eval(securityContent);

// Test Suite
console.log("Running Security Tests...");

const password = "mySecretPassword123";

// Test 1: Hash Password
const hash = window.Security.hashPassword(password);
console.log(`Hash generated: ${hash}`);

if (!hash.startsWith('h_')) {
    console.error("FAIL: Hash should start with 'h_'");
    process.exit(1);
}

// Test 2: Verify Password
const isValid = window.Security.verifyPassword(password, hash);
console.log(`Password verification result: ${isValid}`);

if (!isValid) {
    console.error("FAIL: valid password failed verification");
    process.exit(1);
}

// Test 3: Verify Invalid Password
const isInvalid = window.Security.verifyPassword("wrongPassword", hash);
console.log(`Invalid password verification result: ${isInvalid}`);

if (isInvalid) {
    console.error("FAIL: invalid password passed verification");
    process.exit(1);
}

console.log("SUCCESS: All security tests passed!");
