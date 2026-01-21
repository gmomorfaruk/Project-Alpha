## 2026-01-21 - Insecure Backup Storage
**Vulnerability:** Database backups containing sensitive information were stored in a predictable `backups/` directory within the project root, potentially exposing them via the web server if not properly configured. Filenames were predictable (timestamp-based), allowing enumeration.
**Learning:** Even internal utility scripts can expose critical vulnerabilities if they generate artifacts in public-facing directories.
**Prevention:**
1. Use hidden directories (starting with `.`) for sensitive storage.
2. Enforce strict file permissions (`0600` for files, `0700` for directories).
3. Add high-entropy random suffixes to sensitive filenames to prevent enumeration.
