import db from './database';

const APP_PREFIX = 'projectAlpha_';
const isBrowser = typeof window !== 'undefined';

const SYNC_TABLES = [
    'users', 'currentUser', 'session',
    'tasks', 'task_completions', 
    'transactions', 'investments', 'deposits', 'withdrawals',
    'adminInvestments', 'membershipRecords', 'productSaleRecords',
    'depositRecords', 'userEarningRecords', 'withdrawalRecords',
    'dailySummaries',
    'products', 'memberships', 'membershipRequests',
    'announcements', 'proofs', 'referrals',
    'allChatUsers', 'chatMessages',
    'activity_logs', 'securityLogs', 'logs',
    'config', 'settings'
];

export const Storage = {
    isCloudConnected() {
        return db && db.connected && db.type !== 'localStorage';
    },

    get(key: string) {
        if (!isBrowser) return null;
        try {
            const item = localStorage.getItem(APP_PREFIX + key);
            if (!item) return null;
            return JSON.parse(item);
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },

    async getAsync(key: string) {
        if (!isBrowser) return null;
        try {
            if (this.isCloudConnected() && SYNC_TABLES.includes(key)) {
                const cloudData = await db.read(key);
                if (cloudData && cloudData.length > 0) {
                    localStorage.setItem(APP_PREFIX + key, JSON.stringify(cloudData));
                    return cloudData;
                }
            }
            return this.get(key);
        } catch (e) {
            console.error('Error reading from cloud:', e);
            return this.get(key);
        }
    },

    set(key: string, value: any) {
        if (!isBrowser) return false;
        try {
            localStorage.setItem(APP_PREFIX + key, JSON.stringify(value));
            
            if (this.isCloudConnected() && SYNC_TABLES.includes(key)) {
                this.syncToCloud(key, value);
            }
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },

    syncToCloud(key: string, value: any) {
        if (!this.isCloudConnected()) return;
        
        setTimeout(async () => {
            try {
                if (Array.isArray(value)) {
                    for (const item of value) {
                        if (item.id) {
                            const existing = await db.readOne(key, item.id);
                            if (existing) {
                                await db.update(key, item.id, item);
                            } else {
                                await db.create(key, item);
                            }
                        }
                    }
                } else if (value && typeof value === 'object' && value.id) {
                    const existing = await db.readOne(key, value.id);
                    if (existing) {
                        await db.update(key, value.id, value);
                    } else {
                        await db.create(key, value);
                    }
                }
                console.log(`✅ Synced ${key} to cloud`);
            } catch (e) {
                console.error(`❌ Failed to sync ${key} to cloud:`, e);
            }
        }, 100);
    },

    async syncToCloudAsync(key: string, value: any) {
        if (!this.isCloudConnected()) return;
        
        try {
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (item.id) {
                        const existing = await db.readOne(key, item.id);
                        if (existing) {
                            await db.update(key, item.id, item);
                        } else {
                            await db.create(key, item);
                        }
                    }
                }
            } else if (value && typeof value === 'object' && value.id) {
                const existing = await db.readOne(key, value.id);
                if (existing) {
                    await db.update(key, value.id, value);
                } else {
                    await db.create(key, value);
                }
            }
            console.log(`✅ Synced ${key} to cloud`);
        } catch (e) {
            console.error(`❌ Failed to sync ${key} to cloud:`, e);
            throw e;
        }
    },

    remove(key: string) {
        if (!isBrowser) return false;
        try {
            localStorage.removeItem(APP_PREFIX + key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    }
};

export default Storage;
