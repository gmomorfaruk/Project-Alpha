# Sentinel's Journal

## 2025-02-18 - Insecure Backup Permissions
**Vulnerability:** `backup.js` creates directories and files with default permissions (potentially world-readable), exposing database dumps containing sensitive data to all system users.
**Learning:** Node.js `fs` methods use default umask (often 022) resulting in 755/644 permissions unless specified otherwise. This is unsafe for sensitive artifacts.
**Prevention:** Explicitly pass `{ mode: 0o700 }` to `mkdirSync` and `{ mode: 0o600 }` to `writeFileSync` (or `openSync`) for sensitive files.
