## 2026-02-02 - Insecure File Permissions in Backups
**Vulnerability:** `backup.js` created directories and files with default permissions (often 755/644), making sensitive database dumps readable by other system users.
**Learning:** Node.js `fs` methods use default umask unless `mode` is explicitly provided.
**Prevention:** Always specify `{ mode: 0o700 }` (dirs) or `{ mode: 0o600 }` (files) when creating artifacts containing sensitive data.
