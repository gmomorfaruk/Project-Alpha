const SECURITY_PREFIX = 'projectAlpha_';
const isBrowser = typeof window !== 'undefined';

export const Security = {
    sanitizeHTML(str: any): string {
        if (str === null || str === undefined) return '';
        if (!isBrowser) return String(str);
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    },

    sanitizeObject(obj: any): any {
        if (typeof obj !== 'object' || obj === null) {
            return typeof obj === 'string' ? this.sanitizeHTML(obj) : obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        
        const sanitized: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                sanitized[key] = this.sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    },

    escapeHTML(str: string): string {
        if (!str) return '';
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        return String(str).replace(/[&<>"'`=\/]/g, s => map[s]);
    },

    isValidEmail(email: string): boolean {
        const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return re.test(String(email).toLowerCase());
    },

    isValidPhone(phone: string): boolean {
        const cleaned = phone.replace(/[\s\-\+]/g, '');
        return /^(880|0)?1[3-9]\d{8}$/.test(cleaned);
    },

    validatePassword(password: string) {
        const result = {
            isValid: true,
            errors: [] as string[],
            strength: 0
        };
        
        if (!password || password.length < 6) {
            result.isValid = false;
            result.errors.push('Password must be at least 6 characters');
        }
        
        if (password && password.length >= 8) result.strength++;
        if (/[A-Z]/.test(password)) result.strength++;
        if (/[a-z]/.test(password)) result.strength++;
        if (/\d/.test(password)) result.strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) result.strength++;
        
        return result;
    },

    validateAmount(amount: any) {
        const num = parseFloat(amount);
        if (isNaN(num) || num < 0 || !isFinite(num)) {
            return { isValid: false, value: 0 };
        }
        const sanitized = Math.min(Math.round(num * 100) / 100, Number.MAX_SAFE_INTEGER);
        return { isValid: true, value: sanitized };
    },

    isValidURL(url: string): boolean {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    },

    stripScripts(str: string): string {
        if (!str) return '';
        return String(str)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:/gi, '');
    },

    hashPassword(password: string): string {
        let hash = 0;
        const salt = 'PA_2026_SECURE';
        const salted = salt + password + salt;
        for (let i = 0; i < salted.length; i++) {
            const char = salted.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
    },

    verifyPassword(password: string, hash: string): boolean {
        return this.hashPassword(password) === hash;
    },

    generateToken(length = 32): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        if (isBrowser && window.crypto && typeof window.crypto.getRandomValues === 'function') {
            const randomValues = new Uint32Array(length);
            crypto.getRandomValues(randomValues);
            for (let i = 0; i < length; i++) {
                result += chars[randomValues[i] % chars.length];
            }
        } else {
            // Server fallback
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        return result;
    },

    generateSessionId(): string {
        return this.generateToken(16) + '_' + Date.now();
    },

    rateLimits: {} as Record<string, { attempts: number[]; blocked: boolean; blockedUntil: number }>,

    isRateLimited(action: string, maxAttempts = 5, windowMs = 60000) {
        const now = Date.now();
        const key = action;
        
        if (!this.rateLimits[key]) {
            this.rateLimits[key] = { attempts: [], blocked: false, blockedUntil: 0 };
        }
        
        const limit = this.rateLimits[key];
        
        if (limit.blocked && now < limit.blockedUntil) {
            return { limited: true, remainingTime: Math.ceil((limit.blockedUntil - now) / 1000) };
        }
        
        limit.attempts = limit.attempts.filter(time => now - time < windowMs);
        
        if (limit.attempts.length >= maxAttempts) {
            limit.blocked = true;
            limit.blockedUntil = now + windowMs;
            return { limited: true, remainingTime: Math.ceil(windowMs / 1000) };
        }
        
        limit.attempts.push(now);
        limit.blocked = false;
        
        return { limited: false, remainingAttempts: maxAttempts - limit.attempts.length };
    },

    resetRateLimit(action: string) {
        delete this.rateLimits[action];
    },

    createSession(user: any) {
        if (!isBrowser) return null;
        const session = {
            userId: user.id,
            email: user.email,
            role: user.role,
            token: this.generateToken(),
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000),
            fingerprint: this.getDeviceFingerprint()
        };
        
        localStorage.setItem(SECURITY_PREFIX + 'session', JSON.stringify(session));
        return session;
    },

    validateSession() {
        if (!isBrowser) return { valid: false, reason: 'SSR Environment' };
        try {
            const session = JSON.parse(localStorage.getItem(SECURITY_PREFIX + 'session') || 'null');
            if (!session) return { valid: false, reason: 'No session' };
            
            if (Date.now() > session.expiresAt) {
                this.destroySession();
                return { valid: false, reason: 'Session expired' };
            }
            
            if (session.fingerprint !== this.getDeviceFingerprint()) {
                this.destroySession();
                return { valid: false, reason: 'Session invalid' };
            }
            
            return { valid: true, session };
        } catch {
            return { valid: false, reason: 'Invalid session data' };
        }
    },

    destroySession() {
        if (!isBrowser) return;
        localStorage.removeItem(SECURITY_PREFIX + 'session');
        localStorage.removeItem(SECURITY_PREFIX + 'currentUser');
    },

    getDeviceFingerprint(): string {
        if (!isBrowser) return 'server';
        const data = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset()
        ].join('|');
        
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash) + data.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },

    generateCSRFToken(): string {
        if (!isBrowser) return '';
        const token = this.generateToken(24);
        sessionStorage.setItem('csrfToken', token);
        return token;
    },

    validateCSRFToken(token: string): boolean {
        if (!isBrowser) return false;
        const stored = sessionStorage.getItem('csrfToken');
        return !!(stored && stored === token);
    },

    createChecksum(data: any): string {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },

    verifyChecksum(data: any, checksum: string): boolean {
        return this.createChecksum(data) === checksum;
    },

    secureSet(key: string, data: any) {
        if (!isBrowser) return;
        const payload = {
            data: data,
            checksum: this.createChecksum(data),
            timestamp: Date.now()
        };
        localStorage.setItem(SECURITY_PREFIX + key, JSON.stringify(payload));
    },

    secureGet(key: string): any {
        if (!isBrowser) return null;
        try {
            const payload = JSON.parse(localStorage.getItem(SECURITY_PREFIX + key) || 'null');
            if (!payload || !payload.data) return null;
            
            if (!this.verifyChecksum(payload.data, payload.checksum)) {
                console.warn('Data integrity check failed for:', key);
                return null;
            }
            
            return payload.data;
        } catch {
            return null;
        }
    },

    logSecurityEvent(type: string, details: any = {}) {
        if (!isBrowser) return;
        const logs = JSON.parse(localStorage.getItem(SECURITY_PREFIX + 'securityLogs') || '[]');
        logs.unshift({
            type: type,
            details: this.sanitizeObject(details),
            timestamp: new Date().toISOString(),
            ip: 'client',
            userAgent: navigator.userAgent.substring(0, 100)
        });
        
        if (logs.length > 1000) logs.length = 1000;
        localStorage.setItem(SECURITY_PREFIX + 'securityLogs', JSON.stringify(logs));
    },

    detectSuspiciousActivity() {
        if (!isBrowser) return { suspicious: false };
        const logs = JSON.parse(localStorage.getItem(SECURITY_PREFIX + 'securityLogs') || '[]');
        const last10Minutes = logs.filter((l: any) => 
            Date.now() - new Date(l.timestamp).getTime() < 600000
        );
        
        const failedLogins = last10Minutes.filter((l: any) => l.type === 'login_failed').length;
        const rapidRequests = last10Minutes.length > 100;
        
        if (failedLogins > 5) {
            return { suspicious: true, reason: 'Multiple failed login attempts' };
        }
        
        if (rapidRequests) {
            return { suspicious: true, reason: 'Unusual activity detected' };
        }
        
        return { suspicious: false };
    }
};

export default Security;
