## 2026-10-18 - Client-Side Password Hashing
**Vulnerability:** Plaintext passwords stored in LocalStorage for a static site.
**Learning:** Static sites without a backend often resort to LocalStorage for data persistence. Storing credentials in plaintext is a high risk as XSS can easily exfiltrate them.
**Prevention:** Even without a backend, implement client-side hashing (preferably robust like WebCrypto, or at least a salt-based obfuscation) to prevent plaintext exposure. Ensure the hashing utility is loaded before any data initialization logic.
