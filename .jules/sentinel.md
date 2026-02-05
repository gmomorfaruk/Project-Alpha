## 2025-05-30 - Plaintext Password Storage
**Vulnerability:** User passwords were stored in plaintext in localStorage and initialized with plaintext defaults.
**Learning:** Checking for legacy data (plaintext) during login is a viable migration strategy when immediate database migration is not possible (e.g. client-side storage).
**Prevention:** Always use hashing functions (even simple ones for client-side) before storing sensitive data. Use `Security.hashPassword()` in all entry points (signup, reset, default init).
