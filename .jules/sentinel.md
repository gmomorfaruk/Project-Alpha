# Sentinel Journal

## 2025-02-18 - Insecure File Permissions in Backups
**Vulnerability:** Backup files were being created with default system permissions (often 0644/0755), making sensitive database dumps readable by other users on the system.
**Learning:** Node.js `fs` methods use default mask unless explicit `mode` is provided. Developers often forget that sensitive files need explicit restriction.
**Prevention:** Always specify `{ mode: 0o600 }` (read/write for owner only) when writing sensitive files, and `{ mode: 0o700 }` for directories containing them.
