// ===== MAIN APPLICATION SCRIPTS =====

// Page Loader
window.addEventListener('load', function() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 300);
    }
});

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            const icon = mobileMenu.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenu.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                const icon = mobileMenu.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
                navbar.style.boxShadow = 'var(--shadow-md)';
            } else {
                navbar.classList.remove('scrolled');
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // Scroll to top button
    createScrollTopButton();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Initialize animations on scroll
    initScrollAnimations();
});

// Scroll to Top Button
function createScrollTopButton() {
    const btn = document.createElement('button');
    btn.className = 'scroll-top';
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    btn.setAttribute('title', 'Back to top');
    document.body.appendChild(btn);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Animate elements on scroll
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.product-card, .stat-card, .feature-card, .section-header').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

// ===== UTILITY FUNCTIONS =====

// Format currency (BDT)
function formatCurrency(amount) {
    return '৳' + parseFloat(amount).toLocaleString('en-BD');
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format date with time
function formatDateTime(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate referral code
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create container if not exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Sanitize message to prevent XSS
    const safeMessage = typeof Security !== 'undefined' ? Security.sanitizeHTML(message) : message;
    
    const icons = {
        success: 'fa-check',
        error: 'fa-times',
        warning: 'fa-exclamation',
        info: 'fa-info'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <span class="toast-message">${safeMessage}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
        return true;
    } catch (err) {
        showToast('Failed to copy', 'error');
        return false;
    }
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone (Bangladesh)
function validatePhone(phone) {
    const re = /^(\+880|880|0)?1[3-9]\d{8}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Validate password (minimum 6 characters)
function validatePassword(password) {
    return password.length >= 6;
}

// ===== LOCAL STORAGE HELPERS =====
// Enhanced to auto-sync with connected cloud database

const APP_PREFIX = 'projectAlpha_';

// Tables that should sync to cloud database - ALL app data
const SYNC_TABLES = [
    // Core user data
    'users', 'currentUser', 'session',
    // Tasks and completions
    'tasks', 'task_completions', 
    // Financial data
    'transactions', 'investments', 'deposits', 'withdrawals',
    'adminInvestments', 'membershipRecords', 'productSaleRecords',
    'depositRecords', 'userEarningRecords', 'withdrawalRecords',
    'dailySummaries',
    // Products and memberships
    'products', 'memberships', 'membershipRequests',
    // User engagement
    'announcements', 'proofs', 'referrals',
    // Communication
    'allChatUsers', 'chatMessages',
    // Logs
    'activity_logs', 'securityLogs', 'logs',
    // Config
    'config', 'settings'
];

const Storage = {
    // Check if cloud database is connected
    isCloudConnected() {
        return window.DatabaseManager && 
               window.DatabaseManager.connected && 
               window.DatabaseManager.type !== 'localStorage';
    },

    // Get data - from cloud if connected, otherwise localStorage
    get(key) {
        try {
            const item = localStorage.getItem(APP_PREFIX + key);
            if (!item) return null;
            return JSON.parse(item);
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },

    // Async get from cloud database
    async getAsync(key) {
        try {
            // If cloud connected and this is a syncable table
            if (this.isCloudConnected() && SYNC_TABLES.includes(key)) {
                const cloudData = await window.DatabaseManager.read(key);
                if (cloudData && cloudData.length > 0) {
                    // Update local cache
                    localStorage.setItem(APP_PREFIX + key, JSON.stringify(cloudData));
                    return cloudData;
                }
            }
            // Fallback to localStorage
            return this.get(key);
        } catch (e) {
            console.error('Error reading from cloud:', e);
            return this.get(key);
        }
    },

    // Set data - to both localStorage AND cloud if connected
    set(key, value) {
        try {
            // Always save to localStorage first (for offline backup)
            localStorage.setItem(APP_PREFIX + key, JSON.stringify(value));
            
            // If cloud connected and this is a syncable table, sync to cloud
            if (this.isCloudConnected() && SYNC_TABLES.includes(key)) {
                this.syncToCloud(key, value);
            }
            
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },

    // Async set with cloud sync
    async setAsync(key, value) {
        try {
            // Save to localStorage
            localStorage.setItem(APP_PREFIX + key, JSON.stringify(value));
            
            // If cloud connected, sync to cloud
            if (this.isCloudConnected() && SYNC_TABLES.includes(key)) {
                await this.syncToCloudAsync(key, value);
            }
            
            return true;
        } catch (e) {
            console.error('Error in setAsync:', e);
            return false;
        }
    },

    // Background sync to cloud (non-blocking)
    syncToCloud(key, value) {
        if (!this.isCloudConnected()) return;
        
        // Use setTimeout to make it non-blocking
        setTimeout(async () => {
            try {
                if (Array.isArray(value)) {
                    // For arrays (like users list), sync each item
                    for (const item of value) {
                        if (item.id) {
                            const existing = await window.DatabaseManager.readOne(key, item.id);
                            if (existing) {
                                await window.DatabaseManager.update(key, item.id, item);
                            } else {
                                await window.DatabaseManager.create(key, item);
                            }
                        }
                    }
                } else if (value && typeof value === 'object' && value.id) {
                    // For single objects with ID
                    const existing = await window.DatabaseManager.readOne(key, value.id);
                    if (existing) {
                        await window.DatabaseManager.update(key, value.id, value);
                    } else {
                        await window.DatabaseManager.create(key, value);
                    }
                }
                console.log(`✅ Synced ${key} to cloud`);
            } catch (e) {
                console.error(`❌ Failed to sync ${key} to cloud:`, e);
            }
        }, 100);
    },

    // Async sync to cloud (blocking, returns promise)
    async syncToCloudAsync(key, value) {
        if (!this.isCloudConnected()) return;
        
        try {
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (item.id) {
                        const existing = await window.DatabaseManager.readOne(key, item.id);
                        if (existing) {
                            await window.DatabaseManager.update(key, item.id, item);
                        } else {
                            await window.DatabaseManager.create(key, item);
                        }
                    }
                }
            } else if (value && typeof value === 'object' && value.id) {
                const existing = await window.DatabaseManager.readOne(key, value.id);
                if (existing) {
                    await window.DatabaseManager.update(key, value.id, value);
                } else {
                    await window.DatabaseManager.create(key, value);
                }
            }
            console.log(`✅ Synced ${key} to cloud`);
        } catch (e) {
            console.error(`❌ Failed to sync ${key} to cloud:`, e);
            throw e;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(APP_PREFIX + key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },

    clear() {
        try {
            // Only clear app-specific keys
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(APP_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    },

    // Sync all local data to cloud
    async syncAllToCloud() {
        if (!this.isCloudConnected()) {
            console.log('No cloud database connected');
            return { success: false, error: 'No cloud database connected' };
        }

        const results = { success: true, synced: {} };
        
        for (const table of SYNC_TABLES) {
            const data = this.get(table);
            if (data && Array.isArray(data) && data.length > 0) {
                try {
                    await this.syncToCloudAsync(table, data);
                    results.synced[table] = data.length;
                } catch (e) {
                    results.success = false;
                    results.synced[table] = `Error: ${e.message}`;
                }
            }
        }
        
        return results;
    },

    // Sync all cloud data to local
    async syncAllFromCloud() {
        if (!this.isCloudConnected()) {
            return { success: false, error: 'No cloud database connected' };
        }

        const results = { success: true, synced: {} };
        
        for (const table of SYNC_TABLES) {
            try {
                const cloudData = await window.DatabaseManager.read(table);
                if (cloudData && cloudData.length > 0) {
                    localStorage.setItem(APP_PREFIX + table, JSON.stringify(cloudData));
                    results.synced[table] = cloudData.length;
                }
            } catch (e) {
                results.success = false;
                results.synced[table] = `Error: ${e.message}`;
            }
        }
        
        return results;
    }
};

// Make Storage globally available
window.Storage = Storage;

// ===== INITIALIZE APP DATA =====
// This ensures demo users and essential data exist in localStorage

function initializeAppData() {
    console.log('initializeAppData() called');
    
    let users = Storage.get('users');
    console.log('Current users in storage:', users);
    
    // If users is null or not an array, initialize it
    if (!users || !Array.isArray(users)) {
        users = [];
        console.log('Users was null/invalid, set to empty array');
    }
    
    // Define default demo users that should always exist
    const defaultUsers = [
        {
            id: 'admin1',
            email: 'admin@demo.com',
            name: 'Admin User',
            phone: '01700000001',
            role: 'admin',
            password: (typeof Security !== 'undefined' && Security.hashPassword) ? Security.hashPassword('admin123') : 'admin123',
            balance: 0,
            points: 0,
            isLoggedIn: false,
            createdAt: '2025-01-01T00:00:00.000Z'
        },
        {
            id: 'user1',
            email: 'user@demo.com',
            name: 'Demo User',
            phone: '01700000000',
            role: 'user',
            password: (typeof Security !== 'undefined' && Security.hashPassword) ? Security.hashPassword('demo123') : 'demo123',
            balance: 5000,
            points: 100,
            membership: 'free',
            referralCode: 'DEMO1234',
            referrals: [],
            bkashNumber: '',
            nagadNumber: '',
            status: 'active',
            isLoggedIn: false,
            createdAt: '2025-01-01T00:00:00.000Z'
        }
    ];
    
    // Add default users if they don't exist
    let dataUpdated = false;
    defaultUsers.forEach(defaultUser => {
        const existsById = users.some(u => u.id === defaultUser.id);
        const existsByEmail = users.some(u => u.email === defaultUser.email);
        console.log(`Checking ${defaultUser.email}: existsById=${existsById}, existsByEmail=${existsByEmail}`);
        
        if (!existsById && !existsByEmail) {
            users.push(defaultUser);
            dataUpdated = true;
            console.log(`Added default user: ${defaultUser.email}`);
        }
    });
    
    // Save if we added any default users
    if (dataUpdated) {
        const success = Storage.set('users', users);
        console.log('Saved users to storage, success:', success);
        console.log('Users now:', Storage.get('users'));
    } else {
        console.log('No new default users needed, users count:', users.length);
    }
    
    return users;
}

// Initialize app data when script loads - run immediately since Storage is defined above
initializeAppData();

// ===== MODAL MANAGEMENT =====

const Modal = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    closeAll() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
};

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        Modal.closeAll();
    }
});

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        Modal.closeAll();
    }
});

// ===== FORM VALIDATION =====

const FormValidator = {
    validate(form) {
        let isValid = true;
        const errors = {};

        form.querySelectorAll('[required]').forEach(input => {
            const name = input.name;
            const value = input.value.trim();

            // Remove previous error
            input.classList.remove('error');
            const errorEl = input.parentElement.querySelector('.form-error');
            if (errorEl) errorEl.remove();

            // Check if empty
            if (!value) {
                isValid = false;
                errors[name] = 'This field is required';
                this.showError(input, errors[name]);
                return;
            }

            // Type-specific validation
            if (input.type === 'email' && !validateEmail(value)) {
                isValid = false;
                errors[name] = 'Please enter a valid email';
                this.showError(input, errors[name]);
            }

            if (input.dataset.validate === 'phone' && !validatePhone(value)) {
                isValid = false;
                errors[name] = 'Please enter a valid phone number';
                this.showError(input, errors[name]);
            }

            if (input.type === 'password' && !validatePassword(value)) {
                isValid = false;
                errors[name] = 'Password must be at least 6 characters';
                this.showError(input, errors[name]);
            }
        });

        // Check password confirmation
        const password = form.querySelector('[name="password"]');
        const confirmPassword = form.querySelector('[name="confirmPassword"]');
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            isValid = false;
            errors.confirmPassword = 'Passwords do not match';
            this.showError(confirmPassword, errors.confirmPassword);
        }

        return { isValid, errors };
    },

    showError(input, message) {
        input.classList.add('error');
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = message;
        input.parentElement.appendChild(errorEl);
    }
};

// ===== LOADING STATE =====

function showLoading(element) {
    element.dataset.originalContent = element.innerHTML;
    element.innerHTML = '<span class="spinner"></span>';
    element.disabled = true;
}

function hideLoading(element) {
    element.innerHTML = element.dataset.originalContent;
    element.disabled = false;
}

// ===== EXPORT UTILITIES =====
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.generateId = generateId;
window.generateReferralCode = generateReferralCode;
window.showToast = showToast;
window.copyToClipboard = copyToClipboard;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validatePassword = validatePassword;
window.Storage = Storage;
window.Modal = Modal;
window.FormValidator = FormValidator;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
