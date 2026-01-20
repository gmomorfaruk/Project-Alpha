## 2024-05-23 - [Plaintext Password Storage Mitigation]
**Vulnerability:** Passwords for demo users and new signups were stored in plaintext in `localStorage`.
**Learning:** Even in client-side demos or prototypes, storing credentials in plaintext is a critical risk. The `Security.hashPassword` function existed but was not utilized for storage.
**Prevention:**
1. Always hash passwords before storage, even in `localStorage` or mocks.
2. Updated `initializeAppData`, `login.html`, `signup.html`, and `js/auth.js` to consistently use `Security.hashPassword`.
3. Implemented a migration strategy in `login.html` to hash legacy plaintext passwords upon successful login.
