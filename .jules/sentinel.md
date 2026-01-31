## 2026-01-31 - Insecure Backup File Permissions
**Vulnerability:** Database backup files and directory were created with default system permissions (typically 755/644), making sensitive data world-readable if the filesystem is shared.
**Learning:** Node.js `fs.mkdirSync` and `fs.writeFileSync` default to standard umask. For sensitive operations like backups, explicit `mode` options (`0o700`, `0o600`) are mandatory.
**Prevention:** Always specify `mode` in file system operations handling sensitive data. Enforce this via code review or linting rules for file creation methods.
