## 2026-06-25 - Hardcoded Credentials in Client-Side Code
**Vulnerability:** Hardcoded plaintext passwords found in `js/main.js` (default users initialization) and `login.html` (demo login logic).
**Learning:** Default/Demo data initialization often introduces security risks if not treated with the same rigor as production data. Client-side logic for "convenience" (like demo logins) can bypass standard authentication flows and leak secrets.
**Prevention:** Always hash passwords before storing them, even for default/demo accounts. Avoid hardcoded credential checks; rely on the standard user lookup and authentication mechanism.
