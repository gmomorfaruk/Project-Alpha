## 2026-02-04 - Insecure Default File Permissions
**Vulnerability:** `fs.mkdirSync` and `fs.writeFileSync` in `backup.js` were used without explicit `mode` options, causing database backups (containing sensitive data) to be readable by other users on the system (defaulting to 0o755/0o644).
**Learning:** Node.js file system methods default to standard umask permissions if not specified. Developers often overlook that backup files require stricter permissions (0o700/0o600) than standard application files.
**Prevention:** Always specify `{ mode: 0o600 }` (read/write for owner only) when writing files containing sensitive information, and `{ mode: 0o700 }` for directories containing them. Use a linter rule or wrapper function to enforce explicit permissions for sensitive file operations.
