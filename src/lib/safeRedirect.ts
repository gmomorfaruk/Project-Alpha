/**
 * Safe Redirect Utility
 * Opens external URLs (social media links) without exposing the referrer.
 * Prevents platforms from detecting that the visit originated from this site.
 */

const isBrowser = typeof window !== 'undefined';

export const SafeRedirect = {
    /**
     * Opens a URL safely by stripping the HTTP Referer header.
     * Uses multiple strategies for maximum browser compatibility.
     */
    open(url: string): boolean {
        if (!isBrowser || !url) return false;

        try {
            // Strategy 1: Blob URL with meta refresh
            // Creates an intermediate HTML page as a blob that redirects.
            // The browser treats the blob as a unique origin, breaking the referrer chain.
            const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${this.escapeHtml(url)}"><meta name="referrer" content="no-referrer"><style>body{background:#0b1524;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;margin:0}p{font-size:16px;opacity:.7}</style></head><body><p>Redirecting...</p><script>window.location.replace("${this.escapeJs(url)}")</script></body></html>`;
            
            const blob = new Blob([html], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            const newWindow = window.open(blobUrl, '_blank');
            
            // Revoke blob URL after a short delay to free memory
            setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
            
            if (newWindow) return true;
            
            // Fallback: Strategy 2 — noreferrer window.open
            return this.openNoReferrer(url);
        } catch {
            // Final fallback
            return this.openNoReferrer(url);
        }
    },

    /**
     * Fallback: Opens URL with noreferrer features
     */
    openNoReferrer(url: string): boolean {
        if (!isBrowser) return false;
        try {
            const w = window.open('about:blank', '_blank', 'noopener,noreferrer');
            if (w) {
                w.document.write(`<!DOCTYPE html><html><head><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0;url=${this.escapeHtml(url)}"></head><body></body></html>`);
                w.document.close();
                return true;
            }
            // Absolute fallback — just open, better than nothing
            window.open(url, '_blank', 'noopener,noreferrer');
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Creates an invisible anchor tag click with noreferrer.
     * Useful for programmatic navigation without user gesture issues.
     */
    navigate(url: string): void {
        if (!isBrowser) return;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
    },

    /**
     * HTML-escape a string to prevent injection in blob HTML
     */
    escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * JS-escape a string for inline script usage
     */
    escapeJs(str: string): string {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }
};

export default SafeRedirect;
