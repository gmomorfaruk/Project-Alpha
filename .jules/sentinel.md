## 2024-05-22 - Secure File Permissions
**Vulnerability:** Backup script created world-readable files in a visible directory.
**Learning:** Node.js `fs.mkdirSync` and `fs.writeFileSync` default to standard permissions (often 0o777/0o666 - umask) if `mode` is not specified, potentially exposing sensitive data.
**Prevention:** Always explicitly set `mode: 0o700` for directories and `0o600` for sensitive files in server-side scripts.
