## 2025-02-19 - Client-Side Auth Architecture
**Vulnerability:** Authentication and sensitive data (balances, passwords) are stored in client-side `localStorage` with only client-side validation.
**Learning:** The application mimics a backend using `Storage` wrapper but exposes all data to manipulation by the user. "Hashing" passwords provides only obfuscation, not true security.
**Prevention:** For a real-world deployment, this entire architecture must be replaced with a secure backend API (Node/Express/Python) and a real database (PostgreSQL) where authentication and business logic reside server-side.
