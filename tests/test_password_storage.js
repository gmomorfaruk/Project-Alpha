const fs = require('fs');
const path = require('path');

// Mock Browser Environment
const window = {};
global.window = window;
const document = {
    addEventListener: () => {},
    createElement: () => ({ innerHTML: '' })
};
global.document = document;
const navigator = { userAgent: 'test', language: 'en' };
global.navigator = navigator;
const screen = { width: 1024, height: 768 };
global.screen = screen;

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        getStore: () => store
    };
})();
global.localStorage = localStorageMock;

// Load Security.js
const securityPath = path.join(__dirname, '../js/security.js');
const securityCode = fs.readFileSync(securityPath, 'utf8');
eval(securityCode);

// Verify Security object is loaded
if (!window.Security) {
    console.error('Failed to load Security object');
    process.exit(1);
}

const Security = window.Security;

console.log('Security module loaded.');

// Test Hashing
const password = 'password123';
const hash = Security.hashPassword(password);
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);

if (password === hash) {
    console.error('FAIL: Password is not hashed!');
    process.exit(1);
}

if (!hash.startsWith('h_')) {
    console.error('FAIL: Hash format incorrect');
    process.exit(1);
}

// Test Migration Logic (Simulation)
console.log('\nTesting Migration Logic...');

// Setup: User with plaintext password
const user = {
    id: 'user1',
    email: 'test@example.com',
    password: 'password123' // Plaintext
};

// 1. Try to login with correct password (should migrate)
const inputPassword = 'password123';
let migrated = false;

// Logic to be implemented in login.html
// Note: Security.verifyPassword checks if hash(input) === stored
// So for plaintext stored password, it will return false.
if (Security.verifyPassword(inputPassword, user.password)) {
    console.log('Login success (already hashed)');
} else if (user.password === inputPassword) {
    console.log('Login success (legacy plaintext)');
    // Migrate
    user.password = Security.hashPassword(inputPassword);
    migrated = true;
    console.log('User password migrated to hash.');
} else {
    console.log('Login failed');
}

if (!migrated) {
    console.error('FAIL: Did not migrate plaintext password');
    process.exit(1);
}

if (user.password === 'password123') {
    console.error('FAIL: User password is still plaintext after migration');
    process.exit(1);
}

if (!Security.verifyPassword(inputPassword, user.password)) {
    console.error('FAIL: Migrated password does not verify');
    process.exit(1);
}

console.log('PASS: Migration logic verified.');

// Test Login with Hashed Password
console.log('\nTesting Login with Hashed Password...');
if (Security.verifyPassword(inputPassword, user.password)) {
    console.log('PASS: Login with hashed password successful.');
} else {
    console.error('FAIL: Login with hashed password failed.');
    process.exit(1);
}
