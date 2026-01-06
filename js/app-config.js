// ===== PROJECT ALPHA - CORE APPLICATION CONFIGURATION =====
// This file manages all app settings that admin can control

const AppConfig = {
    // Application Settings
    app: {
        name: 'Project Alpha',
        version: '2.0.0',
        currency: '৳',
        currencyCode: 'BDT',
        timezone: 'Asia/Dhaka'
    },

    // Database Configuration
    database: {
        type: 'localStorage', // Options: 'localStorage', 'postgresql', 'mysql', 'mongodb', 'firebase'
        connectionString: '',
        host: '',
        port: '',
        name: '',
        user: '',
        password: '',
        connected: false
    },

    // Page Visibility Settings (Admin Controlled)
    pageVisibility: {
        home: true,
        about: true,
        products: true,
        login: true,
        signup: true,
        // Dashboard Pages
        'dashboard/index': true,
        'dashboard/wallet': true,
        'dashboard/investments': true,
        'dashboard/products': true,
        'dashboard/tasks': true,
        'dashboard/youtube-tasks': true,
        'dashboard/social-tasks': true,
        'dashboard/membership': true,
        'dashboard/profile': true,
        'dashboard/referrals': true,
        'dashboard/sell-proofs': true,
        // Feature Toggles
        withdrawalEnabled: true,
        depositEnabled: true,
        tasksEnabled: true,
        referralEnabled: true,
        membershipEnabled: true
    },

    // Membership Levels Configuration
    membershipLevels: {
        free: {
            id: 'free',
            name: 'Free Member',
            price: 0,
            taskLimit: 5,
            dailyEarningLimit: 50,
            earningsMultiplier: 1.0,
            withdrawalMin: 500,
            withdrawalMax: 1000,
            features: ['Basic Tasks', 'Profile Access'],
            color: '#6b7280',
            icon: 'fa-user'
        },
        junior: {
            id: 'junior',
            name: 'Junior',
            price: 500,
            taskLimit: 15,
            dailyEarningLimit: 200,
            earningsMultiplier: 1.2,
            withdrawalMin: 300,
            withdrawalMax: 3000,
            features: ['All Free Features', 'YouTube Tasks', '20% Bonus Earnings'],
            color: '#10b981',
            icon: 'fa-seedling'
        },
        assistant: {
            id: 'assistant',
            name: 'Assistant',
            price: 1500,
            taskLimit: 30,
            dailyEarningLimit: 500,
            earningsMultiplier: 1.5,
            withdrawalMin: 200,
            withdrawalMax: 5000,
            features: ['All Junior Features', 'Social Tasks', '50% Bonus Earnings', 'Priority Support'],
            color: '#3b82f6',
            icon: 'fa-user-tie'
        },
        senior: {
            id: 'senior',
            name: 'Senior',
            price: 3000,
            taskLimit: 50,
            dailyEarningLimit: 1000,
            earningsMultiplier: 2.0,
            withdrawalMin: 100,
            withdrawalMax: 10000,
            features: ['All Assistant Features', 'Exclusive Tasks', '100% Bonus Earnings', 'VIP Support'],
            color: '#8b5cf6',
            icon: 'fa-crown'
        },
        vip: {
            id: 'vip',
            name: 'VIP Member',
            price: 5000,
            taskLimit: -1, // Unlimited
            dailyEarningLimit: -1, // Unlimited
            earningsMultiplier: 3.0,
            withdrawalMin: 50,
            withdrawalMax: 50000,
            features: ['Unlimited Tasks', 'Unlimited Earnings', '200% Bonus', 'Personal Manager', 'Instant Withdrawal'],
            color: '#f59e0b',
            icon: 'fa-gem'
        }
    },

    // Withdrawal Settings (Admin Controlled)
    withdrawal: {
        enabled: true,
        minimumAmount: 300,
        maximumAmount: 50000,
        dailyLimit: 100000,
        processingFee: 2, // Percentage
        // Time restrictions
        startTime: '10:00', // 10 AM
        endTime: '16:00', // 4 PM
        // Days allowed (0 = Sunday, 1 = Monday, etc.)
        allowedDays: [0, 1, 3, 5], // Sunday, Monday, Wednesday, Friday
        dayNames: ['Sunday', 'Monday', 'Wednesday', 'Friday'],
        // Payment methods
        paymentMethods: {
            bkash: {
                enabled: true,
                name: 'bKash',
                icon: 'fa-mobile-alt',
                color: '#E2136E',
                minAmount: 50,
                maxAmount: 25000
            },
            nagad: {
                enabled: true,
                name: 'Nagad',
                icon: 'fa-mobile-alt',
                color: '#F6921E',
                minAmount: 50,
                maxAmount: 25000
            },
            rocket: {
                enabled: true,
                name: 'Rocket',
                icon: 'fa-mobile-alt',
                color: '#8C3494',
                minAmount: 100,
                maxAmount: 20000
            },
            bank: {
                enabled: true,
                name: 'Bank Transfer',
                icon: 'fa-university',
                color: '#1a365d',
                minAmount: 500,
                maxAmount: 100000
            }
        }
    },

    // Task Settings
    tasks: {
        enabled: true,
        categories: {
            youtube: {
                enabled: true,
                name: 'YouTube Tasks',
                icon: 'fab fa-youtube',
                color: '#FF0000',
                baseReward: 10
            },
            social: {
                enabled: true,
                name: 'Social Media Tasks',
                icon: 'fas fa-share-alt',
                color: '#1DA1F2',
                baseReward: 5
            },
            survey: {
                enabled: true,
                name: 'Survey Tasks',
                icon: 'fas fa-poll',
                color: '#10b981',
                baseReward: 20
            },
            app: {
                enabled: true,
                name: 'App Downloads',
                icon: 'fas fa-mobile-alt',
                color: '#8b5cf6',
                baseReward: 50
            },
            referral: {
                enabled: true,
                name: 'Referral Tasks',
                icon: 'fas fa-user-friends',
                color: '#f59e0b',
                baseReward: 100
            }
        }
    },

    // Referral Settings
    referral: {
        enabled: true,
        bonusAmount: 50, // BDT for referrer
        newUserBonus: 25, // BDT for new user
        levels: {
            level1: { percentage: 10, label: 'Direct Referral' },
            level2: { percentage: 5, label: 'Second Level' },
            level3: { percentage: 2, label: 'Third Level' }
        }
    },

    // Admin Payment Accounts (for receiving payments)
    paymentAccounts: {
        bkash: {
            enabled: true,
            name: 'bKash',
            number: '01700000000', // Admin's bKash number
            type: 'Personal', // Personal or Merchant
            icon: 'fa-mobile-alt',
            color: '#E2136E',
            instructions: 'Send money to this bKash number and copy the Transaction ID (TrxID)'
        },
        nagad: {
            enabled: true,
            name: 'Nagad',
            number: '01800000000', // Admin's Nagad number
            type: 'Personal',
            icon: 'fa-mobile-alt',
            color: '#F6921E',
            instructions: 'Send money to this Nagad number and copy the Transaction ID'
        },
        rocket: {
            enabled: false,
            name: 'Rocket',
            number: '01900000000',
            type: 'Personal',
            icon: 'fa-mobile-alt',
            color: '#8C3494',
            instructions: 'Send money to this Rocket number and copy the Transaction ID'
        }
    },

    // System Messages
    messages: {
        withdrawalClosed: 'Withdrawal is currently closed. Withdrawal hours: 10:00 AM - 4:00 PM',
        withdrawalDayClosed: 'Withdrawal is not available today. Available days: Sunday, Monday, Wednesday, Friday',
        insufficientBalance: 'Insufficient balance for this withdrawal',
        withdrawalSuccess: 'Withdrawal request submitted successfully',
        taskCompleted: 'Task completed successfully! Earnings added to your wallet',
        membershipPurchased: 'Membership purchased successfully!',
        loginRequired: 'Please login to continue',
        maintenanceMode: 'System is under maintenance. Please try again later.'
    },

    // Admin Quick Actions
    adminActions: {
        maintenance: false,
        registrationOpen: true,
        emailVerificationRequired: false,
        phoneVerificationRequired: true,
        autoApproveWithdrawals: false,
        maxWithdrawalAutoApprove: 1000
    }
};

// ===== DATA STORE =====
// This stores all data (will sync with database when connected)
const DataStore = {
    users: [],
    tasks: [],
    memberships: [],
    withdrawals: [],
    deposits: [],
    transactions: [],
    announcements: [],
    activityLogs: [],
    events: [],
    settings: {}
};

// ===== DATABASE MANAGER =====
class DatabaseManager {
    constructor() {
        this.type = AppConfig.database.type;
        this.connected = false;
    }

    // Initialize database connection
    async connect(config = null) {
        if (config) {
            Object.assign(AppConfig.database, config);
        }

        try {
            switch (AppConfig.database.type) {
                case 'localStorage':
                    this.connected = true;
                    this.loadFromLocalStorage();
                    break;
                case 'postgresql':
                case 'mysql':
                case 'mongodb':
                    // These would require a backend API
                    console.log(`Connecting to ${AppConfig.database.type}...`);
                    // In production, this would make API calls
                    this.connected = true;
                    break;
                case 'firebase':
                    // Firebase initialization would go here
                    this.connected = true;
                    break;
            }
            AppConfig.database.connected = this.connected;
            this.log('Database connected successfully');
            return true;
        } catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }

    // Load data from localStorage
    loadFromLocalStorage() {
        // Load config only - users are managed by Storage wrapper in main.js
        const storedConfig = localStorage.getItem('projectAlphaConfig');
        if (storedConfig) {
            const parsed = JSON.parse(storedConfig);
            this.deepMerge(AppConfig, parsed);
        }
        
        // Sync users from Storage wrapper (projectAlpha_users) to DataStore for compatibility
        const usersData = localStorage.getItem('projectAlpha_users');
        if (usersData) {
            try {
                DataStore.users = JSON.parse(usersData);
            } catch(e) {
                DataStore.users = [];
            }
        }
    }

    // Save data to localStorage
    saveToLocalStorage() {
        // DISABLED - This was overwriting user data from Storage wrapper
        // The app now uses Storage.set/get from main.js instead
        // localStorage.setItem('projectAlphaData', JSON.stringify(DataStore));
        localStorage.setItem('projectAlphaConfig', JSON.stringify(AppConfig));
    }

    // Deep merge helper
    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    // CRUD Operations
    async create(collection, data) {
        const id = this.generateId();
        const record = {
            id,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!DataStore[collection]) {
            DataStore[collection] = [];
        }
        DataStore[collection].push(record);
        this.save();
        this.log(`Created record in ${collection}`, record);
        return record;
    }

    async read(collection, filter = null) {
        const data = DataStore[collection] || [];
        if (!filter) return data;

        return data.filter(item => {
            for (const key in filter) {
                if (item[key] !== filter[key]) return false;
            }
            return true;
        });
    }

    async readOne(collection, id) {
        const data = DataStore[collection] || [];
        return data.find(item => item.id === id);
    }

    async update(collection, id, updates) {
        const data = DataStore[collection] || [];
        const index = data.findIndex(item => item.id === id);
        
        if (index === -1) return null;

        data[index] = {
            ...data[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.save();
        this.log(`Updated record in ${collection}`, data[index]);
        return data[index];
    }

    async delete(collection, id) {
        const data = DataStore[collection] || [];
        const index = data.findIndex(item => item.id === id);
        
        if (index === -1) return false;

        const deleted = data.splice(index, 1)[0];
        this.save();
        this.log(`Deleted record from ${collection}`, deleted);
        return true;
    }

    // Save data
    save() {
        if (AppConfig.database.type === 'localStorage') {
            this.saveToLocalStorage();
        }
        // For other database types, this would sync to the server
    }

    // Generate ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Activity logging
    log(action, data = null) {
        const log = {
            id: this.generateId(),
            action,
            data,
            timestamp: new Date().toISOString(),
            user: this.getCurrentUser()
        };
        DataStore.activityLogs.push(log);
        
        // Keep only last 1000 logs
        if (DataStore.activityLogs.length > 1000) {
            DataStore.activityLogs = DataStore.activityLogs.slice(-1000);
        }
    }

    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }
}

// ===== CONFIG MANAGER (Admin Controls) =====
class ConfigManager {
    constructor() {
        this.db = new DatabaseManager();
    }

    // Update app config
    updateConfig(path, value) {
        const keys = path.split('.');
        let obj = AppConfig;
        
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        this.saveConfig();
        this.db.log(`Config updated: ${path}`, value);
    }

    // Get config value
    getConfig(path) {
        const keys = path.split('.');
        let obj = AppConfig;
        
        for (const key of keys) {
            obj = obj[key];
            if (obj === undefined) return null;
        }
        
        return obj;
    }

    // Save configuration
    saveConfig() {
        localStorage.setItem('projectAlphaConfig', JSON.stringify(AppConfig));
    }

    // Load configuration
    loadConfig() {
        const stored = localStorage.getItem('projectAlphaConfig');
        if (stored) {
            const parsed = JSON.parse(stored);
            this.db.deepMerge(AppConfig, parsed);
        }
    }

    // Toggle page visibility
    togglePage(page, visible) {
        this.updateConfig(`pageVisibility.${page}`, visible);
    }

    // Update membership settings
    updateMembership(level, settings) {
        Object.assign(AppConfig.membershipLevels[level], settings);
        this.saveConfig();
    }

    // Update withdrawal settings
    updateWithdrawalSettings(settings) {
        Object.assign(AppConfig.withdrawal, settings);
        this.saveConfig();
    }

    // Update task settings
    updateTaskSettings(settings) {
        Object.assign(AppConfig.tasks, settings);
        this.saveConfig();
    }

    // Check if withdrawal is available
    isWithdrawalAvailable() {
        if (!AppConfig.withdrawal.enabled) return { available: false, reason: 'Withdrawal is disabled' };
        
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.toTimeString().slice(0, 5);

        // Check day
        if (!AppConfig.withdrawal.allowedDays.includes(currentDay)) {
            return { 
                available: false, 
                reason: AppConfig.messages.withdrawalDayClosed 
            };
        }

        // Check time
        if (currentTime < AppConfig.withdrawal.startTime || currentTime > AppConfig.withdrawal.endTime) {
            return { 
                available: false, 
                reason: AppConfig.messages.withdrawalClosed 
            };
        }

        return { available: true };
    }

    // Calculate task earnings based on membership
    calculateTaskEarning(baseAmount, userMembership) {
        const membership = AppConfig.membershipLevels[userMembership] || AppConfig.membershipLevels.free;
        return baseAmount * membership.earningsMultiplier;
    }

    // Check if user can do more tasks today
    canDoMoreTasks(userId, completedToday) {
        const user = DataStore.users.find(u => u.id === userId);
        if (!user) return false;

        const membership = AppConfig.membershipLevels[user.membership] || AppConfig.membershipLevels.free;
        if (membership.taskLimit === -1) return true; // Unlimited
        
        return completedToday < membership.taskLimit;
    }

    // Get daily earning limit for user
    getDailyEarningLimit(userId) {
        const user = DataStore.users.find(u => u.id === userId);
        if (!user) return 0;

        const membership = AppConfig.membershipLevels[user.membership] || AppConfig.membershipLevels.free;
        return membership.dailyEarningLimit;
    }
}

// ===== PAGE VISIBILITY CHECKER =====

// Check if a page is visible based on admin settings
function isPageVisible(pageId) {
    // Ensure config is loaded
    if (!AppConfig || !AppConfig.pageVisibility) return true;
    
    // Check if specifically set to false
    const visibility = AppConfig.pageVisibility[pageId];
    return visibility !== false;
}

// Check current page and redirect if hidden
function checkCurrentPageVisibility() {
    const path = window.location.pathname;
    
    // Determine page ID from path
    let pageId = '';
    
    if (path.includes('/dashboard/')) {
        // Dashboard pages
        const pageName = path.split('/dashboard/')[1]?.replace('.html', '') || 'index';
        pageId = `dashboard/${pageName}`;
    } else if (path.includes('/admin/')) {
        // Admin pages are always visible
        return true;
    } else {
        // Public pages
        const pageName = path.split('/').pop()?.replace('.html', '') || 'home';
        if (pageName === 'index') pageId = 'home';
        else pageId = pageName;
    }
    
    if (!isPageVisible(pageId)) {
        // Show page unavailable message or redirect
        showPageUnavailable(pageId);
        return false;
    }
    
    return true;
}

// Show page unavailable message
function showPageUnavailable(pageId) {
    document.body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: var(--bg-primary, #f5f5f5);
            font-family: 'Inter', sans-serif;
            padding: 20px;
            text-align: center;
        ">
            <i class="fas fa-lock" style="font-size: 64px; color: #6366f1; margin-bottom: 20px;"></i>
            <h1 style="font-size: 2rem; color: #1f2937; margin-bottom: 10px;">Page Unavailable</h1>
            <p style="color: #6b7280; margin-bottom: 30px; max-width: 400px;">
                This page is currently unavailable. Please contact the administrator or try again later.
            </p>
            <a href="/dashboard/index.html" style="
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                padding: 12px 24px;
                border-radius: 10px;
                text-decoration: none;
                font-weight: 600;
            ">
                <i class="fas fa-home" style="margin-right: 8px;"></i> Go to Dashboard
            </a>
        </div>
    `;
}

// Hide sidebar items for invisible pages
function updateSidebarVisibility() {
    const sidebarNav = document.querySelector('.sidebar-nav ul');
    if (!sidebarNav) return;
    
    const navItems = sidebarNav.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Determine pageId from href
        let pageId = '';
        if (href.includes('/') || href.startsWith('dashboard/')) {
            pageId = href.replace('.html', '').replace('../', '');
        } else {
            const pageName = href.replace('.html', '');
            pageId = `dashboard/${pageName}`;
        }
        
        // Hide if page is not visible
        if (!isPageVisible(pageId)) {
            item.style.display = 'none';
        } else {
            item.style.display = '';
        }
    });
}

// Check feature availability
function isFeatureEnabled(featureId) {
    if (!AppConfig || !AppConfig.pageVisibility) return true;
    const enabled = AppConfig.pageVisibility[featureId];
    return enabled !== false;
}

// ===== INITIALIZE =====
const db = new DatabaseManager();
const configManager = new ConfigManager();

// Auto-connect on load
document.addEventListener('DOMContentLoaded', () => {
    db.connect();
    configManager.loadConfig();
    
    // Check page visibility for non-admin pages
    const path = window.location.pathname;
    if (!path.includes('/admin/')) {
        // Small delay to ensure config is loaded
        setTimeout(() => {
            if (checkCurrentPageVisibility()) {
                updateSidebarVisibility();
            }
        }, 100);
    }
});

// Export for use in other files
window.AppConfig = AppConfig;
window.DataStore = DataStore;
window.db = db;
window.configManager = configManager;
window.isPageVisible = isPageVisible;
window.isFeatureEnabled = isFeatureEnabled;
window.checkCurrentPageVisibility = checkCurrentPageVisibility;
window.updateSidebarVisibility = updateSidebarVisibility;
