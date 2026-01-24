## 2025-02-17 - Hardcoded Client-Side Credentials
**Vulnerability:** Default admin and user credentials ('admin123', 'demo123') were hardcoded in plaintext within `js/main.js` and `login.html`.
**Learning:** In static/SPA apps without a real backend, developers might hardcode 'demo' credentials. Even if intended for demo, these should never be plaintext as they might be reused in production or allow trivial account takeover if the 'demo' logic isn't stripped.
**Prevention:** Store hashes even for default/demo data. Use a build step to inject environment-specific configuration if possible, rather than hardcoding in source.
