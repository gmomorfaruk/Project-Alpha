# Sentinel's Journal

## 2025-10-26 - Plaintext Password Storage
**Vulnerability:** User passwords were stored in plaintext in `localStorage` and hardcoded in `js/main.js` and `login.html`.
**Learning:** Even in client-side-only or demo applications, storing credentials in plaintext is a critical risk. If the application is vulnerable to XSS (which is common in such apps), attackers can easily exfiltrate all user passwords. Hardcoded "demo" logic often bypasses security controls and introduces vulnerabilities.
**Prevention:** Always hash passwords before storage, even on the client side if that's where the "database" lives. Use a centralized authentication logic rather than scattered hardcoded checks.
