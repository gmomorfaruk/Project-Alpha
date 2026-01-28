## 2026-01-28 - Insecure File Permissions in Node.js Scripts
**Vulnerability:** `fs.mkdirSync` and `fs.writeFileSync` were used without explicit mode options in `backup.js`, causing backup files containing sensitive data to inherit default system permissions (often readable by others).
**Learning:** Node.js file system methods default to standard umask (often 0o755/0o644) unless explicitly restricted. In security-critical scripts (like backups), rely on explicit `mode` settings rather than environment defaults.
**Prevention:** Always specify `{ mode: 0o700 }` for directories and `{ mode: 0o600 }` for files when handling sensitive data in Node.js scripts.
