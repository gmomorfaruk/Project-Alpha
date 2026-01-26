## 2025-10-26 - Plaintext Password Storage in LocalStorage
**Vulnerability:** User passwords were stored in plaintext in LocalStorage (and potentially synced to cloud in plaintext).
**Learning:** Client-side apps often neglect password hashing because "it's all on the client anyway", but this exposes users to XSS attacks (which can steal LocalStorage) and physical access attacks. It also trains developers to treat passwords as non-sensitive data.
**Prevention:** Always hash passwords before storage, even on the client. Use `crypto.subtle` for standard, secure hashing (e.g., SHA-256) instead of custom bit-shifting functions. Implement migration strategies (check hash -> check plain -> migrate) to fix existing data without locking users out.
