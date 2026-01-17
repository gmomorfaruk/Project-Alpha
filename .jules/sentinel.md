## 2025-02-18 - Plaintext Passwords in LocalStorage
**Vulnerability:** User passwords were stored and verified in plaintext in `localStorage`.
**Learning:** The application relies on `localStorage` as a database. Developers likely assumed that since it's client-side, hashing wasn't strictly necessary or was overlooked during prototyping (evidenced by the unused `hashPassword` function in `security.js`). This exposed all users to total account compromise via XSS or physical access.
**Prevention:** Always implement password hashing (even simple client-side hashing if server-side isn't available) before storage. Ensure security modules are consistently loaded across all entry points (`signup.html`, `login.html`, `admin/`).
