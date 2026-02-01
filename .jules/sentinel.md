## 2026-02-01 - Plaintext Password Storage
**Vulnerability:** User passwords were stored in plaintext in `localStorage`.
**Learning:** `js/security.js` contained hashing utilities (`hashPassword`) but they were not utilized in the authentication flow (`signup.html`, `login.html`, `js/auth.js`).
**Prevention:** Enforce usage of security utilities in authentication flows. Always audit authentication implementations against available security libraries.
