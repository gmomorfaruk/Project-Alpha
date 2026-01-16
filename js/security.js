/**
 * Security Utilities for Project Alpha
 * File: js/security.js
 * 
 * This file provides security functions to protect against:
 * - XSS (Cross-Site Scripting)
 * - Injection attacks
 * - Data tampering
 * - Session hijacking
 * - Brute force attacks
 */

const SECURITY_PREFIX = 'projectAlpha_';

const Security = {
    
    // ==================== XSS PROTECTION ====================
    
    /**
     * Sanitize string to prevent XSS attacks
     * Use this before inserting ANY user input into HTML
     */
    sanitizeHTML(str) {
        if (str === null || str === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    },
    
    /**
     * Sanitize object - recursively sanitize all string values
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return typeof obj === 'string' ? this.sanitizeHTML(obj) : obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = this.sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    },
    
    /**
     * Escape HTML entities
     */
    escapeHTML(str) {
        if (!str) return '';
        const map = {
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
    
    // ==================== INPUT VALIDATION ====================
    
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return re.test(String(email).toLowerCase());
    },
    
    /**
     * Validate phone number (Bangladesh format)
     */
    isValidPhone(phone) {
        const cleaned = phone.replace(/[\s\-\+]/g, '');
        return /^(880|0)?1[3-9]\d{8}$/.test(cleaned);
    },
    
    /**
     * Validate password strength
     */
    validatePassword(password) {
        const result = {
            isValid: true,
            errors: [],
            strength: 0
        };
        
        if (!password || password.length < 6) {
            result.isValid = false;
            result.errors.push('Password must be at least 6 characters');
        }
        
        if (password.length >= 8) result.strength++;
        if (/[A-Z]/.test(password)) result.strength++;
        if (/[a-z]/.test(password)) result.strength++;
        if (/\d/.test(password)) result.strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) result.strength++;
        
        return result;
    },
    
    /**
     * Sanitize and validate amount
     */
    validateAmount(amount) {
        const num = parseFloat(amount);
        if (isNaN(num) || num < 0 || !isFinite(num)) {
            return { isValid: false, value: 0 };
        }
        // Limit to 2 decimal places and max safe integer
        const sanitized = Math.min(Math.round(num * 100) / 100, Number.MAX_SAFE_INTEGER);
        return { isValid: true, value: sanitized };
    },
    
    /**
     * Validate URL
     */
    isValidURL(url) {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    },
    
    /**
     * Remove potential script injection from strings
     */
    stripScripts(str) {
        if (!str) return '';
        return String(str)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:/gi, '');
    },
    
    // ==================== AUTHENTICATION SECURITY ====================
    
    /**
     * Hash password securely using SHA-256 (Client-Side)
     * Note: In a real production app, hashing should also happen on the server.
     * Since this is a static site/demo, we use Web Crypto API for better security than plain text.
     */
    async hashPassword(password) {
        if (!password) return '';
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },
    
    /**
     * Verify password against hash
     */
    async verifyPassword(password, hash) {
        const computedHash = await this.hashPassword(password);
        return computedHash === hash;
    },
    
    /**
     * Generate secure random token
     */
    generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomValues = new Uint32Array(length);
        crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += chars[randomValues[i] % chars.length];
        }
        return result;
    },
    
    /**
     * Generate session ID
     */
    generateSessionId() {
        return this.generateToken(16) + '_' + Date.now();
    },
    
    // ==================== RATE LIMITING ====================
    
    rateLimits: {},
    
    /**
     * Check if action is rate limited
     */
    isRateLimited(action, maxAttempts = 5, windowMs = 60000) {
        const now = Date.now();
        const key = action;
        
        if (!this.rateLimits[key]) {
            this.rateLimits[key] = { attempts: [], blocked: false, blockedUntil: 0 };
        }
        
        const limit = this.rateLimits[key];
        
        // Check if currently blocked
        if (limit.blocked && now < limit.blockedUntil) {
            return { limited: true, remainingTime: Math.ceil((limit.blockedUntil - now) / 1000) };
        }
        
        // Clear old attempts
        limit.attempts = limit.attempts.filter(time => now - time < windowMs);
        
        // Check if over limit
        if (limit.attempts.length >= maxAttempts) {
            limit.blocked = true;
            limit.blockedUntil = now + windowMs;
            return { limited: true, remainingTime: Math.ceil(windowMs / 1000) };
        }
        
        // Record this attempt
        limit.attempts.push(now);
        limit.blocked = false;
        
        return { limited: false, remainingAttempts: maxAttempts - limit.attempts.length };
    },
    
    /**
     * Reset rate limit for action
     */
    resetRateLimit(action) {
        delete this.rateLimits[action];
    },
    
    // ==================== SESSION SECURITY ====================
    
    /**
     * Create secure session
     */
    createSession(user) {
        const session = {
            userId: user.id,
            email: user.email,
            role: user.role,
            token: this.generateToken(),
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            fingerprint: this.getDeviceFingerprint()
        };
        
        localStorage.setItem(SECURITY_PREFIX + 'session', JSON.stringify(session));
        return session;
    },
    
    /**
     * Validate current session
     */
    validateSession() {
        try {
            const session = JSON.parse(localStorage.getItem(SECURITY_PREFIX + 'session') || 'null');
            if (!session) return { valid: false, reason: 'No session' };
            
            if (Date.now() > session.expiresAt) {
                this.destroySession();
                return { valid: false, reason: 'Session expired' };
            }
            
            // Check device fingerprint
            if (session.fingerprint !== this.getDeviceFingerprint()) {
                this.destroySession();
                return { valid: false, reason: 'Session invalid' };
            }
            
            return { valid: true, session };
        } catch {
            return { valid: false, reason: 'Invalid session data' };
        }
    },
    
    /**
     * Destroy session
     */
    destroySession() {
        localStorage.removeItem(SECURITY_PREFIX + 'session');
        localStorage.removeItem(SECURITY_PREFIX + 'currentUser');
    },
    
    /**
     * Get simple device fingerprint
     */
    getDeviceFingerprint() {
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
    
    // ==================== CSRF PROTECTION ====================
    
    /**
     * Generate CSRF token
     */
    generateCSRFToken() {
        const token = this.generateToken(24);
        sessionStorage.setItem('csrfToken', token);
        return token;
    },
    
    /**
     * Validate CSRF token
     */
    validateCSRFToken(token) {
        const stored = sessionStorage.getItem('csrfToken');
        return stored && stored === token;
    },
    
    // ==================== DATA INTEGRITY ====================
    
    /**
     * Create data checksum
     */
    createChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },
    
    /**
     * Verify data integrity
     */
    verifyChecksum(data, checksum) {
        return this.createChecksum(data) === checksum;
    },
    
    /**
     * Secure localStorage set (with checksum)
     */
    secureSet(key, data) {
        const payload = {
            data: data,
            checksum: this.createChecksum(data),
            timestamp: Date.now()
        };
        localStorage.setItem(SECURITY_PREFIX + key, JSON.stringify(payload));
    },
    
    /**
     * Secure localStorage get (with verification)
     */
    secureGet(key) {
        try {
            const payload = JSON.parse(localStorage.getItem(SECURITY_PREFIX + key));
            if (!payload || !payload.data) return null;
            
            // Verify checksum
            if (!this.verifyChecksum(payload.data, payload.checksum)) {
                console.warn('Data integrity check failed for:', key);
                return null;
            }
            
            return payload.data;
        } catch {
            return null;
        }
    },
    
    // ==================== ACTIVITY LOGGING ====================
    
    /**
     * Log security event
     */
    logSecurityEvent(type, details = {}) {
        const logs = JSON.parse(localStorage.getItem(SECURITY_PREFIX + 'securityLogs') || '[]');
        logs.unshift({
            type: type,
            details: this.sanitizeObject(details),
            timestamp: new Date().toISOString(),
            ip: 'client', // In production, get from server
            userAgent: navigator.userAgent.substring(0, 100)
        });
        
        // Keep only last 1000 logs
        if (logs.length > 1000) logs.length = 1000;
        
        localStorage.setItem(SECURITY_PREFIX + 'securityLogs', JSON.stringify(logs));
    },
    
    /**
     * Detect suspicious activity
     */
    detectSuspiciousActivity() {
        const logs = JSON.parse(localStorage.getItem(SECURITY_PREFIX + 'securityLogs') || '[]');
        const last10Minutes = logs.filter(l => 
            Date.now() - new Date(l.timestamp).getTime() < 600000
        );
        
        const failedLogins = last10Minutes.filter(l => l.type === 'login_failed').length;
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

// Make available globally
window.Security = Security;

// Auto-initialize CSRF token
document.addEventListener('DOMContentLoaded', function() {
    Security.generateCSRFToken();
});
