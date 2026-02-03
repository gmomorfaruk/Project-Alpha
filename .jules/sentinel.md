## 2026-02-03 - Insecure Backup File Permissions
**Vulnerability:** Database backups were being written with default file permissions (often world-readable 0644/0755 depending on umask), exposing sensitive data to other users on the system.
**Learning:** Node.js `fs.mkdirSync` and `fs.writeFileSync` use default permissions if `mode` is not specified. In shared environments, this is a security risk for sensitive files.
**Prevention:** Always explicitly set `mode: 0o700` (directory) and `mode: 0o600` (file) when creating files or directories containing sensitive information.
