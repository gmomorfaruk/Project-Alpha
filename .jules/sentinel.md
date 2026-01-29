## 2026-01-29 - Insecure Backup File Permissions
**Vulnerability:** The backup script `backup.js` was creating directories and files using default `fs.mkdirSync` and `fs.writeFileSync` permissions. This meant that backup files containing sensitive database dumps were potentially readable by other users on the system (depending on the umask, typically world-readable).
**Learning:** Node.js file system methods default to permissive modes if not explicitly restricted. When handling sensitive data like backups, relying on default umask is insufficient for security.
**Prevention:** Always explicitly set `mode` to `0o700` (user-only read/write/execute) for directories and `0o600` (user-only read/write) for files containing sensitive information.
