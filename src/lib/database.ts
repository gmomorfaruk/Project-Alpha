/**
 * UNIVERSAL DATABASE MANAGER - Project Alpha v2.1.0 (Next.js Port)
 * 
 * Supports: localStorage, Supabase, Firebase, MongoDB Atlas, REST API
 */

const DB_PREFIX = 'projectAlpha_';
const DB_VERSION = '2.1.0';

// Helper to check if running in browser
const isBrowser = typeof window !== 'undefined';

// ===== DATABASE ADAPTER BASE CLASS =====
export class DatabaseAdapter {
    name: string;
    connected: boolean;
    config: any;

    constructor(name: string) {
        this.name = name;
        this.connected = false;
        this.config = null;
    }

    async connect(config: any): Promise<any> { throw new Error('Not implemented'); }
    async disconnect(): Promise<any> { throw new Error('Not implemented'); }
    async create(table: string, record: any): Promise<any> { throw new Error('Not implemented'); }
    async read(table: string, filter?: any): Promise<any> { throw new Error('Not implemented'); }
    async readOne(table: string, id: string): Promise<any> { throw new Error('Not implemented'); }
    async update(table: string, id: string, data: any): Promise<any> { throw new Error('Not implemented'); }
    async delete(table: string, id: string): Promise<any> { throw new Error('Not implemented'); }
    async query(table: string, options?: any): Promise<any> { throw new Error('Not implemented'); }
    async testConnection(): Promise<any> { throw new Error('Not implemented'); }
}

// ===== LOCALSTORAGE ADAPTER =====
export class LocalStorageAdapter extends DatabaseAdapter {
    constructor() {
        super('localStorage');
        this.connected = true;
    }

    async connect(config: any) {
        this.connected = true;
        this.config = config || {};
        return { success: true, message: 'localStorage is always available' };
    }

    async disconnect() {
        return { success: true };
    }

    async create(table: string, record: any) {
        try {
            const data = this.getTableData(table);
            data.push(record);
            this.setTableData(table, data);
            return { success: true, data: record };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async read(table: string, filter: any = null) {
        try {
            let data = this.getTableData(table);
            
            if (filter && typeof filter === 'object') {
                data = data.filter((item: any) => {
                    for (const key in filter) {
                        if (filter[key] !== undefined && item[key] !== filter[key]) {
                            return false;
                        }
                    }
                    return true;
                });
            }
            
            return data;
        } catch (error) {
            console.error('localStorage read error:', error);
            return [];
        }
    }

    async readOne(table: string, id: string) {
        const data = this.getTableData(table);
        return data.find((item: any) => item.id === id) || null;
    }

    async update(table: string, id: string, updates: any) {
        try {
            const data = this.getTableData(table);
            const index = data.findIndex((item: any) => item.id === id);
            
            if (index === -1) {
                return { success: false, error: 'Record not found' };
            }

            data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
            this.setTableData(table, data);
            return { success: true, data: data[index] };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async delete(table: string, id: string) {
        try {
            const data = this.getTableData(table);
            const index = data.findIndex((item: any) => item.id === id);
            
            if (index === -1) {
                return { success: false, error: 'Record not found' };
            }

            data.splice(index, 1);
            this.setTableData(table, data);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async query(table: string, options: any = {}) {
        let data = await this.read(table, options.filter);
        
        if (options.orderBy) {
            const [field, direction] = options.orderBy.split(':');
            data.sort((a: any, b: any) => {
                if (direction === 'desc') {
                    return a[field] < b[field] ? 1 : -1;
                }
                return a[field] > b[field] ? 1 : -1;
            });
        }
        
        if (options.limit) {
            data = data.slice(0, options.limit);
        }
        
        if (options.offset) {
            data = data.slice(options.offset);
        }
        
        return data;
    }

    async testConnection() {
        if (!isBrowser) return { success: false, message: 'localStorage is not available on server' };
        try {
            localStorage.setItem(DB_PREFIX + '_test', 'test');
            localStorage.removeItem(DB_PREFIX + '_test');
            return { success: true, message: 'localStorage is working' };
        } catch (error) {
            return { success: false, message: 'localStorage is not available' };
        }
    }

    getTableData(table: string) {
        if (!isBrowser) return [];
        const data = localStorage.getItem(DB_PREFIX + table);
        return data ? JSON.parse(data) : [];
    }

    setTableData(table: string, data: any) {
        if (!isBrowser) return;
        localStorage.setItem(DB_PREFIX + table, JSON.stringify(data));
    }
}

// ===== SUPABASE ADAPTER =====
export class SupabaseAdapter extends DatabaseAdapter {
    client: any;
    reconnectAttempts: number;
    maxReconnectAttempts: number;

    constructor() {
        super('supabase');
        this.client = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
    }

    async connect(config: any) {
        if (!config.url || !config.anonKey) {
            return { success: false, message: 'Supabase URL and Anon Key are required' };
        }

        const cleanUrl = config.url.trim().replace(/\/$/, '');

        try {
            const urlObj = new URL(cleanUrl);
            if (!urlObj.protocol.startsWith('http')) {
                return { success: false, message: 'Invalid Supabase URL. Must start with http:// or https://' };
            }
        } catch (e) {
            return { success: false, message: 'Invalid Supabase URL format. It should be like: https://xxxxx.supabase.co' };
        }

        if (!isBrowser) {
            return { success: false, message: 'Supabase library can only be connected on client' };
        }

        try {
            const win = window as any;
            if (!win.supabase) {
                console.log('📦 Loading Supabase client library...');
                await this.loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (!win.supabase || !win.supabase.createClient) {
                return { success: false, message: 'Failed to load Supabase library. Check your internet connection.' };
            }

            const { createClient } = win.supabase;
            
            this.client = createClient(cleanUrl, config.anonKey, {
                auth: { persistSession: true, autoRefreshToken: true },
                realtime: { params: { eventsPerSecond: 10 } }
            });

            console.log('🔌 Testing Supabase connection...');
            
            try {
                const testUrl = `${cleanUrl}/rest/v1/`;
                const testResponse = await fetch(testUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`
                    }
                });
                
                if (!testResponse.ok) {
                    const errorText = await testResponse.text();
                    const isKeyTypeWarning = errorText.includes('service_role') || testResponse.headers.get('sb-error-code') === 'UNAUTHORIZED_INVALID_API_KEY_TYPE';
                    
                    if (!isKeyTypeWarning) {
                        if (testResponse.status === 401 || testResponse.status === 403) {
                            return { success: false, message: 'Invalid API Key. Make sure you copied the full anon key.' };
                        }
                        return { success: false, message: `API Error (${testResponse.status}): ${errorText}` };
                    }
                    console.log('ℹ️ REST API gateway accepted key (root endpoint restricted to service_role).');
                }
            } catch (fetchError: any) {
                console.error('REST API test failed:', fetchError);
                if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
                    return { success: false, message: 'Network error. Check your internet connection and Supabase URL.' };
                }
            }
            
            // Try query with corrected 'id' column select
            const { data, error } = await this.client.from('users').select('id').limit(1);
            
            if (error) {
                if (error.message.includes('does not exist') || 
                    error.message.includes('relation') ||
                    error.message.includes('permission denied') ||
                    error.message.includes('schema cache') ||
                    error.code === '42P01' ||
                    error.code === '42501' ||
                    error.code === 'PGRST205') {
                    console.log('✅ Connected to Supabase (tables need to be created or RLS configured)');
                    this.connected = true;
                    this.config = { ...config, url: cleanUrl };
                    this.reconnectAttempts = 0;
                    return { success: true, message: 'Connected to Supabase! Now create tables using the SQL button.' };
                }
                
                if (error.message.includes('JWT') || 
                    error.message.includes('Invalid API') ||
                    error.message.includes('invalid_credentials') ||
                    error.message.includes('Unauthorized') ||
                    error.code === 'PGRST301') {
                    return { success: false, message: 'Invalid API Key. Make sure you copied the full key.' };
                }
                
                console.error('Supabase error:', error);
                return { success: false, message: `Connection error: ${error.message}` };
            }

            this.connected = true;
            this.config = { ...config, url: cleanUrl };
            this.reconnectAttempts = 0;
            
            console.log('✅ Connected to Supabase');
            return { success: true, message: 'Connected to Supabase successfully!' };

        } catch (error: any) {
            console.error('Supabase connection error:', error);
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                return { success: false, message: 'Network error. Check your internet connection and Supabase URL.' };
            }
            if (error.message.includes('CORS')) {
                return { success: false, message: 'CORS error. Make sure you\'re using the correct Supabase URL.' };
            }
            return { success: false, message: error.message };
        }
    }

    async disconnect() {
        this.client = null;
        this.connected = false;
        return { success: true };
    }

    async create(table: string, record: any) {
        if (!this.connected) await this.reconnect();
        try {
            let safeRecord = { ...record };
            let retries = 0;
            while (retries < 10) {
                const { data, error } = await this.client.from(table).insert([safeRecord]).select();
                if (!error) return { success: true, data: data[0] };

                // PGRST204: column not found in schema cache. Strip the bad field and retry.
                if (error.code === 'PGRST204') {
                    const match = error.message.match(/column "([^"]+)"/) || error.message.match(/'([^']+)'/);
                    const badField = match ? match[1] : null;
                    if (badField && safeRecord.hasOwnProperty(badField)) {
                        console.warn(`Supabase: stripping unknown column '${badField}' from '${table}' and retrying.`);
                        delete safeRecord[badField];
                        retries++;
                        continue;
                    }
                }
                // Any other error
                console.error('Supabase create error:', error.message || error, 'Code:', error.code, 'Details:', error.details);
                return { success: false, error: error.message };
            }
            console.error(`Supabase create: too many schema retries for table '${table}'`);
            return { success: false, error: 'Schema mismatch: too many unknown columns' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async read(table: string, filter: any = null) {
        if (!this.connected) await this.reconnect();
        try {
            let query = this.client.from(table).select('*');
            if (filter && typeof filter === 'object') {
                for (const key in filter) {
                    if (filter[key] !== undefined) {
                        query = query.eq(key, filter[key]);
                    }
                }
            }
            const { data, error } = await query;
            if (error) {
                console.error('Supabase read error:', error.message || error, 'Code:', error.code, 'Details:', error.details);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Supabase read exception:', error);
            return [];
        }
    }

    async readOne(table: string, id: string) {
        if (!this.connected) await this.reconnect();
        try {
            const { data, error } = await this.client.from(table).select('*').eq('id', id).single();
            if (error) return null;
            return data;
        } catch (error) {
            return null;
        }
    }

    async update(table: string, id: string, updates: any) {
        if (!this.connected) await this.reconnect();
        try {
            let safeUpdates = { ...updates, updatedAt: new Date().toISOString() };
            let retries = 0;
            while (retries < 10) {
                const { data, error } = await this.client
                    .from(table)
                    .update(safeUpdates)
                    .eq('id', id)
                    .select();
                if (!error) return { success: true, data: data[0] };

                // PGRST204: column not found in schema cache. Strip the bad field and retry.
                if (error.code === 'PGRST204') {
                    const match = error.message.match(/column "([^"]+)"/) || error.message.match(/'([^']+)'/);
                    const badField = match ? match[1] : null;
                    if (badField && safeUpdates.hasOwnProperty(badField)) {
                        console.warn(`Supabase: stripping unknown column '${badField}' from '${table}' update and retrying.`);
                        delete safeUpdates[badField];
                        retries++;
                        continue;
                    }
                }
                console.error('Supabase update error:', error.message || error, 'Code:', error.code, 'Details:', error.details);
                return { success: false, error: error.message };
            }
            console.error(`Supabase update: too many schema retries for table '${table}'`);
            return { success: false, error: 'Schema mismatch: too many unknown columns' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async delete(table: string, id: string) {
        if (!this.connected) await this.reconnect();
        try {
            const { error } = await this.client.from(table).delete().eq('id', id);
            if (error) {
                console.error('Supabase delete error:', error.message || error, 'Code:', error.code, 'Details:', error.details);
                return { success: false, error: error.message };
            }
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async query(table: string, options: any = {}) {
        if (!this.connected) await this.reconnect();
        try {
            let query = this.client.from(table).select('*');
            if (options.filter) {
                for (const key in options.filter) {
                    if (options.filter[key] !== undefined) {
                        query = query.eq(key, options.filter[key]);
                    }
                }
            }
            if (options.orderBy) {
                const [field, direction] = options.orderBy.split(':');
                query = query.order(field, { ascending: direction !== 'desc' });
            }
            if (options.limit) {
                query = query.limit(options.limit);
            }
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
            }
            const { data, error } = await query;
            if (error) {
                console.error('Supabase query error:', error.message, 'Code:', error.code, 'Details:', error.details);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Supabase query error:', error);
            return [];
        }
    }

    async testConnection() {
        if (!this.client) {
            return { success: false, message: 'Not connected to Supabase' };
        }
        try {
            const testUrl = `${this.config.url}/rest/v1/`;
            const testResponse = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'apikey': this.config.anonKey,
                    'Authorization': `Bearer ${this.config.anonKey}`
                }
            });
            // 200, 400, 401, 403 all mean the server is reachable and responding.
            // Supabase root /rest/v1/ legitimately returns 401 for anon keys.
            // Only treat network-level failures as unhealthy.
            if (testResponse.status < 500) {
                return { success: true, message: `Supabase reachable (HTTP ${testResponse.status})` };
            }
            return { success: false, message: `Server error HTTP ${testResponse.status}` };
        } catch (error: any) {
            // Only a true network failure (fetch throws) means we're unreachable
            return { success: false, message: error.message };
        }
    }

    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return false;
        }
        this.reconnectAttempts++;
        if (this.config) {
            const result = await this.connect(this.config);
            return result.success;
        }
        return false;
    }

    loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!isBrowser) {
                resolve();
                return;
            }
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// ===== FIREBASE ADAPTER =====
export class FirebaseAdapter extends DatabaseAdapter {
    db: any;

    constructor() {
        super('firebase');
        this.db = null;
    }

    async connect(config: any) {
        if (!config.apiKey || !config.projectId) {
            return { success: false, message: 'Firebase API Key and Project ID are required' };
        }
        if (!isBrowser) return { success: false, message: 'Firebase runs only in browser' };

        try {
            const win = window as any;
            if (!win.firebase) {
                await this.loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
                await this.loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js');
            }

            if (!win.firebase.apps.length) {
                win.firebase.initializeApp(config);
            }

            this.db = win.firebase.firestore();
            this.connected = true;
            this.config = config;
            
            console.log('✅ Connected to Firebase');
            return { success: true, message: 'Connected to Firebase' };
        } catch (error: any) {
            console.error('Firebase connection error:', error);
            return { success: false, message: error.message };
        }
    }

    async disconnect() {
        this.db = null;
        this.connected = false;
        return { success: true };
    }

    async create(table: string, record: any) {
        try {
            await this.db.collection(table).doc(record.id).set(record);
            return { success: true, data: record };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async read(table: string, filter: any = null) {
        try {
            let query = this.db.collection(table);
            if (filter && typeof filter === 'object') {
                for (const key in filter) {
                    if (filter[key] !== undefined) {
                        query = query.where(key, '==', filter[key]);
                    }
                }
            }
            const snapshot = await query.get();
            return snapshot.docs.map((doc: any) => doc.data());
        } catch (error) {
            console.error('Firebase read error:', error);
            return [];
        }
    }

    async readOne(table: string, id: string) {
        try {
            const doc = await this.db.collection(table).doc(id).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            return null;
        }
    }

    async update(table: string, id: string, updates: any) {
        try {
            await this.db.collection(table).doc(id).update({
                ...updates,
                updatedAt: new Date().toISOString()
            });
            const doc = await this.db.collection(table).doc(id).get();
            return { success: true, data: doc.data() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async delete(table: string, id: string) {
        try {
            await this.db.collection(table).doc(id).delete();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async query(table: string, options: any = {}) {
        try {
            let query = this.db.collection(table);
            if (options.filter) {
                for (const key in options.filter) {
                    if (options.filter[key] !== undefined) {
                        query = query.where(key, '==', options.filter[key]);
                    }
                }
            }
            if (options.orderBy) {
                const [field, direction] = options.orderBy.split(':');
                query = query.orderBy(field, direction === 'desc' ? 'desc' : 'asc');
            }
            if (options.limit) {
                query = query.limit(options.limit);
            }
            const snapshot = await query.get();
            return snapshot.docs.map((doc: any) => doc.data());
        } catch (error) {
            console.error('Firebase query error:', error);
            return [];
        }
    }

    async testConnection() {
        try {
            await this.db.collection('_health_check').doc('test').get();
            return { success: true, message: 'Firebase connection is healthy' };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!isBrowser) {
                resolve();
                return;
            }
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// ===== MONGODB ATLAS ADAPTER =====
export class MongoDBAdapter extends DatabaseAdapter {
    apiUrl: any;
    apiKey: any;
    dataSource: any;
    database: any;

    constructor() {
        super('mongodb');
    }

    async connect(config: any) {
        if (!config.apiUrl || !config.apiKey || !config.dataSource || !config.database) {
            return { success: false, message: 'MongoDB Data API URL, API Key, Data Source, and Database name are required' };
        }
        this.apiUrl = config.apiUrl;
        this.apiKey = config.apiKey;
        this.dataSource = config.dataSource;
        this.database = config.database;
        this.config = config;

        const test = await this.testConnection();
        if (test.success) {
            this.connected = true;
            console.log('✅ Connected to MongoDB Atlas');
            return { success: true, message: 'Connected to MongoDB Atlas' };
        }
        return test;
    }

    async disconnect() {
        this.connected = false;
        return { success: true };
    }

    async makeRequest(action: string, collection: string, body: any = {}) {
        const response = await fetch(`${this.apiUrl}/action/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.apiKey
            },
            body: JSON.stringify({
                dataSource: this.dataSource,
                database: this.database,
                collection: collection,
                ...body
            })
        });
        if (!response.ok) {
            throw new Error(`MongoDB API error: ${response.status}`);
        }
        return response.json();
    }

    async create(table: string, record: any) {
        try {
            await this.makeRequest('insertOne', table, { document: record });
            return { success: true, data: record };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async read(table: string, filter: any = null) {
        try {
            const result = await this.makeRequest('find', table, { filter: filter || {} });
            return result.documents || [];
        } catch (error) {
            console.error('MongoDB read error:', error);
            return [];
        }
    }

    async readOne(table: string, id: string) {
        try {
            const result = await this.makeRequest('findOne', table, { filter: { id: id } });
            return result.document || null;
        } catch (error) {
            return null;
        }
    }

    async update(table: string, id: string, updates: any) {
        try {
            await this.makeRequest('updateOne', table, {
                filter: { id: id },
                update: { $set: { ...updates, updatedAt: new Date().toISOString() } }
            });
            return { success: true, data: { id, ...updates } };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async delete(table: string, id: string) {
        try {
            await this.makeRequest('deleteOne', table, { filter: { id: id } });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async query(table: string, options: any = {}) {
        try {
            const body: any = { filter: options.filter || {} };
            if (options.orderBy) {
                const [field, direction] = options.orderBy.split(':');
                body.sort = { [field]: direction === 'desc' ? -1 : 1 };
            }
            if (options.limit) body.limit = options.limit;
            if (options.offset) body.skip = options.offset;
            const result = await this.makeRequest('find', table, body);
            return result.documents || [];
        } catch (error) {
            console.error('MongoDB query error:', error);
            return [];
        }
    }

    async testConnection() {
        try {
            await this.makeRequest('find', 'users', { limit: 1 });
            return { success: true, message: 'MongoDB connection is healthy' };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }
}

// ===== REST API ADAPTER =====
export class RestAPIAdapter extends DatabaseAdapter {
    baseUrl: any;
    headers: any;

    constructor() {
        super('restapi');
        this.baseUrl = null;
        this.headers = {};
    }

    async connect(config: any) {
        if (!config.baseUrl) {
            return { success: false, message: 'Base URL is required' };
        }
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.headers = config.headers || {};
        this.config = config;
        
        const test = await this.testConnection();
        if (test.success) {
            this.connected = true;
            return { success: true, message: 'Connected to API successfully' };
        }
        return test;
    }

    async disconnect() {
        this.connected = false;
        return { success: true };
    }

    async request(url: string, method: string = 'GET', body: any = null) {
        const options: any = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...this.headers
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${this.baseUrl}${url}`, options);
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    async create(table: string, record: any) {
        try {
            const data = await this.request(`/${table}`, 'POST', record);
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async read(table: string, filter: any = null) {
        try {
            let url = `/${table}`;
            if (filter) {
                const params = new URLSearchParams(filter);
                url += `?${params.toString()}`;
            }
            return await this.request(url);
        } catch (error) {
            console.error('REST API read error:', error);
            return [];
        }
    }

    async readOne(table: string, id: string) {
        try {
            return await this.request(`/${table}/${id}`);
        } catch (error) {
            return null;
        }
    }

    async update(table: string, id: string, updates: any) {
        try {
            const data = await this.request(`/${table}/${id}`, 'PUT', updates);
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async delete(table: string, id: string) {
        try {
            await this.request(`/${table}/${id}`, 'DELETE');
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async query(table: string, options: any = {}) {
        try {
            let url = `/${table}/query`;
            const data = await this.request(url, 'POST', options);
            return data || [];
        } catch (error) {
            console.error('REST API query error:', error);
            return [];
        }
    }

    async testConnection() {
        try {
            await fetch(`${this.baseUrl}/health`);
            return { success: true, message: 'REST API connection is healthy' };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }
}

// ===== UNIFIED DATABASE MANAGER =====
export class UnifiedDatabase {
    adapters: any;
    currentAdapter: any;
    type: string;
    connected: boolean;
    config: any;
    offlineQueue: any[];
    isOnline: boolean;
    healthCheckInterval: any;
    eventListeners: any;
    tables: any;

    constructor() {
        this.adapters = {
            localStorage: new LocalStorageAdapter(),
            supabase: new SupabaseAdapter(),
            firebase: new FirebaseAdapter(),
            mongodb: new MongoDBAdapter(),
            restapi: new RestAPIAdapter()
        };

        this.currentAdapter = this.adapters.localStorage;
        this.type = 'localStorage';
        this.connected = true;
        this.config = null;
        
        this.offlineQueue = [];
        this.isOnline = isBrowser ? navigator.onLine : true;
        this.healthCheckInterval = null;
        
        this.eventListeners = {
            connected: [],
            disconnected: [],
            synced: [],
            error: []
        };

        this.tables = {
            users: { name: 'users', primaryKey: 'id' },
            workTasks: { name: 'tasks', primaryKey: 'id' },
            transactions: { name: 'transactions', primaryKey: 'id' },
            investments: { name: 'investments', primaryKey: 'id' },
            products: { name: 'products', primaryKey: 'id' },
            announcements: { name: 'announcements', primaryKey: 'id' },
            activity_logs: { name: 'activity_logs', primaryKey: 'id' },
            taskCompletions: { name: 'task_completions', primaryKey: 'id' },
            referrals: { name: 'referrals', primaryKey: 'id' },
            membershipRequests: { name: 'memberships', primaryKey: 'id' },
            sellProofs: { name: 'proofs', primaryKey: 'id' },
            deposits: { name: 'deposits', primaryKey: 'id' },
            withdrawals: { name: 'withdrawals', primaryKey: 'id' },
            settings: { name: 'settings', primaryKey: 'id' },
            chatMessages: { name: 'chatMessages', primaryKey: 'id' }
        };

        this.setupNetworkHandlers();
    }

    async connect(type: string, config: any = {}) {
        const adapter = this.adapters[type];
        
        if (!adapter) {
            return { 
                success: false, 
                message: `Database type "${type}" is not supported.`
            };
        }

        try {
            const result = await adapter.connect(config);
            
            if (result.success) {
                this.currentAdapter = adapter;
                this.type = type;
                this.connected = true;
                this.config = config;
                
                this.saveConnectionConfig();
                
                if (type !== 'localStorage') {
                    this.startHealthMonitoring();
                }
                
                if (this.offlineQueue.length > 0) {
                    this.processOfflineQueue();
                }
                
                this.emit('connected', { type, config });
                console.log(`✅ Database connected: ${type}`);
            }
            
            return result;
        } catch (error: any) {
            console.error('Database connection error:', error);
            this.emit('error', error);
            return { success: false, message: error.message };
        }
    }

    async disconnect() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        await this.currentAdapter.disconnect();
        
        this.currentAdapter = this.adapters.localStorage;
        this.type = 'localStorage';
        this.connected = true;
        this.config = null;
        
        if (isBrowser) {
            localStorage.removeItem(DB_PREFIX + 'dbConfig');
        }
        this.emit('disconnected', {});
        
        return { success: true, message: 'Disconnected from database' };
    }

    async switchDatabase(type: string, config: any = {}) {
        let exportedData = null;
        if (this.type !== 'localStorage' && type !== 'localStorage') {
            exportedData = await this.exportAllData();
        }
        
        await this.disconnect();
        const result = await this.connect(type, config);
        
        if (result.success && exportedData && type !== 'localStorage') {
            await this.importAllData(exportedData);
        }
        
        return result;
    }

    async testConnection(type: string, config: any) {
        const adapter = this.adapters[type];
        
        if (!adapter) {
            return { success: false, message: `Unknown database type: ${type}` };
        }

        try {
            const connectResult = await adapter.connect(config);
            if (!connectResult.success) return connectResult;

            if (type === 'supabase') {
                await adapter.disconnect();
                return connectResult;
            }

            const testResult = await adapter.testConnection();
            await adapter.disconnect();
            return testResult;
        } catch (error: any) {
            console.error('❌ Test connection error:', error);
            return { success: false, message: error.message };
        }
    }

    async loadSavedConnection() {
        if (!isBrowser) return { success: true };
        const saved = localStorage.getItem(DB_PREFIX + 'dbConfig');
        
        if (saved) {
            try {
                const { type, config } = JSON.parse(saved);
                if (type && type !== 'localStorage') {
                    console.log(`🔄 Auto-connecting to saved database: ${type}`);
                    const result = await this.connect(type, config);
                    if (!result.success) {
                        // ⚠️ IMPORTANT: Do NOT wipe the saved config or fall back to localStorage
                        // just because a reconnect failed (e.g. transient network error on load).
                        // Keep the saved config so the next reload can try again.
                        // Only clear the adapter state, but keep this.config intact so UI
                        // still shows the user is configured for Supabase.
                        console.warn(`⚠️ Could not auto-connect to ${type} on startup: ${result.message}. Will retry on next action.`);
                        // Try to set state to reflect the saved type without forcing localStorage
                        this.currentAdapter = this.adapters[type] || this.adapters.localStorage;
                        this.type = type;
                        this.connected = false;
                        this.config = config;
                    }
                    return result;
                }
            } catch (e) {
                console.error('Error loading saved connection:', e);
            }
        }
        
        this.connected = true;
        return { success: true, message: 'Using localStorage' };
    }

    saveConnectionConfig() {
        if (!isBrowser) return;
        if (this.type !== 'localStorage') {
            const config = {
                type: this.type,
                config: this.config,
                connectedAt: new Date().toISOString(),
                version: DB_VERSION
            };
            localStorage.setItem(DB_PREFIX + 'dbConfig', JSON.stringify(config));
        }
    }

    getTableName(table: string): string {
        if (this.type === 'localStorage') return table;
        return this.tables[table]?.name || table;
    }

    // Ensures we have an active connection. If the adapter was set up but
    // the initial connection failed (e.g. slow network on load), this will
    // transparently reconnect before the operation proceeds.
    async ensureConnected() {
        if (!this.connected && this.type !== 'localStorage' && this.config) {
            console.log(`🔄 Reconnecting to ${this.type}...`);
            await this.connect(this.type, this.config);
        }
    }

    async create(table: string, data: any) {
        const record = {
            id: data.id || this.generateId(),
            ...data,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!this.isOnline && this.type !== 'localStorage') {
            this.queueOfflineOperation('create', table, record);
            return await this.adapters.localStorage.create(table, record);
        }

        await this.ensureConnected();
        return await this.currentAdapter.create(this.getTableName(table), record);
    }

    async read(table: string, filter: any = null) {
        if (!this.isOnline && this.type !== 'localStorage') {
            return await this.adapters.localStorage.read(table, filter);
        }
        await this.ensureConnected();
        return await this.currentAdapter.read(this.getTableName(table), filter);
    }

    async readOne(table: string, id: string) {
        if (!this.isOnline && this.type !== 'localStorage') {
            return await this.adapters.localStorage.readOne(table, id);
        }
        await this.ensureConnected();
        return await this.currentAdapter.readOne(this.getTableName(table), id);
    }

    async update(table: string, id: string, data: any) {
        const updates = { ...data, updatedAt: new Date().toISOString() };

        if (!this.isOnline && this.type !== 'localStorage') {
            this.queueOfflineOperation('update', table, { id, data: updates });
            return await this.adapters.localStorage.update(table, id, updates);
        }

        await this.ensureConnected();
        return await this.currentAdapter.update(this.getTableName(table), id, updates);
    }

    async delete(table: string, id: string) {
        if (!this.isOnline && this.type !== 'localStorage') {
            this.queueOfflineOperation('delete', table, { id });
            return await this.adapters.localStorage.delete(table, id);
        }
        await this.ensureConnected();
        return await this.currentAdapter.delete(this.getTableName(table), id);
    }

    async query(table: string, options: any = {}) {
        if (!this.isOnline && this.type !== 'localStorage') {
            return await this.adapters.localStorage.query(table, options);
        }
        await this.ensureConnected();
        return await this.currentAdapter.query(this.getTableName(table), options);
    }

    async bulkCreate(table: string, records: any[]) {
        const results = [];
        for (const record of records) {
            const result = await this.create(table, record);
            results.push(result);
        }
        return { success: true, created: results.length };
    }

    async bulkUpdate(table: string, records: any[]) {
        const results = [];
        for (const record of records) {
            if (record.id) {
                const result = await this.update(table, record.id, record);
                results.push(result);
            }
        }
        return { success: true, updated: results.length };
    }

    async syncToCloud() {
        if (this.type === 'localStorage') {
            return { success: false, error: 'No cloud database connected' };
        }

        const results: any = { success: true, synced: {}, errors: [] };
        
        for (const tableName in this.tables) {
            try {
                const localData = this.adapters.localStorage.getTableData(tableName);
                
                if (localData && localData.length > 0) {
                    let synced = 0;
                    for (const record of localData) {
                        try {
                            const existing = await this.readOne(tableName, record.id);
                            if (!existing) {
                                await this.create(tableName, record);
                                synced++;
                            } else if (new Date(record.updatedAt) > new Date(existing.updatedAt)) {
                                await this.update(tableName, record.id, record);
                                synced++;
                            }
                        } catch (e) {
                            console.warn(`Error syncing record ${record.id}:`, e);
                        }
                    }
                    results.synced[tableName] = synced;
                }
            } catch (error: any) {
                results.errors.push({ table: tableName, error: error.message });
            }
        }

        if (results.errors.length > 0) results.success = false;
        this.emit('synced', { direction: 'toCloud', results });
        return results;
    }

    async syncFromCloud() {
        if (this.type === 'localStorage') {
            return { success: false, error: 'No cloud database connected' };
        }

        const results: any = { success: true, synced: {}, errors: [] };

        for (const tableName in this.tables) {
            try {
                const cloudData = await this.read(tableName);
                if (cloudData && cloudData.length > 0) {
                    this.adapters.localStorage.setTableData(tableName, cloudData);
                    results.synced[tableName] = cloudData.length;
                }
            } catch (error: any) {
                results.errors.push({ table: tableName, error: error.message });
            }
        }

        if (results.errors.length > 0) results.success = false;
        this.emit('synced', { direction: 'fromCloud', results });
        return results;
    }

    async syncBidirectional() {
        if (this.type === 'localStorage') {
            return { success: false, error: 'No cloud database connected' };
        }

        const results: any = { success: true, toCloud: {}, fromCloud: {}, conflicts: [] };

        for (const tableName in this.tables) {
            try {
                const localData = this.adapters.localStorage.getTableData(tableName);
                const cloudData = await this.read(tableName);

                const localMap = new Map<string, any>(localData.map((r: any) => [r.id, r]));
                const cloudMap = new Map<string, any>(cloudData.map((r: any) => [r.id, r]));

                for (const [id, record] of localMap) {
                    if (!cloudMap.has(id)) {
                        await this.create(tableName, record);
                        results.toCloud[tableName] = (results.toCloud[tableName] || 0) + 1;
                    } else {
                        const cloudRecord: any = cloudMap.get(id);
                        const localTime = new Date(record.updatedAt || record.createdAt);
                        const cloudTime = new Date(cloudRecord.updatedAt || cloudRecord.createdAt);

                        if (localTime > cloudTime) {
                            await this.update(tableName, id, record);
                            results.toCloud[tableName] = (results.toCloud[tableName] || 0) + 1;
                        } else if (cloudTime > localTime) {
                            localMap.set(id, cloudRecord);
                            results.fromCloud[tableName] = (results.fromCloud[tableName] || 0) + 1;
                        }
                    }
                }

                for (const [id, record] of cloudMap) {
                    if (!localMap.has(id)) {
                        localMap.set(id, record);
                        results.fromCloud[tableName] = (results.fromCloud[tableName] || 0) + 1;
                    }
                }

                this.adapters.localStorage.setTableData(tableName, Array.from(localMap.values()));
            } catch (error) {
                console.error(`Error syncing ${tableName}:`, error);
            }
        }

        return results;
    }

    async exportAllData() {
        const data: any = {
            exportDate: new Date().toISOString(),
            version: DB_VERSION,
            databaseType: this.type,
            tables: {}
        };

        for (const tableName in this.tables) {
            try {
                data.tables[tableName] = await this.read(tableName);
            } catch (e) {
                data.tables[tableName] = this.adapters.localStorage.getTableData(tableName);
            }
        }

        return data;
    }

    async importAllData(data: any) {
        if (!data || !data.tables) {
            return { success: false, error: 'Invalid data format' };
        }

        const results: any = { success: true, imported: {}, errors: [] };

        for (const tableName in data.tables) {
            const records = data.tables[tableName];
            if (records && Array.isArray(records)) {
                try {
                    const existing = await this.read(tableName);
                    for (const record of existing) {
                        await this.delete(tableName, record.id);
                    }
                    for (const record of records) {
                        await this.create(tableName, record);
                    }
                    results.imported[tableName] = records.length;
                } catch (error: any) {
                    results.errors.push({ table: tableName, error: error.message });
                }
            }
        }

        if (results.errors.length > 0) results.success = false;
        return results;
    }

    setupNetworkHandlers() {
        if (!isBrowser) return;
        window.addEventListener('online', () => {
            console.log('📶 Back online');
            this.isOnline = true;
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Gone offline');
            this.isOnline = false;
        });
    }

    queueOfflineOperation(operation: string, table: string, data: any) {
        if (!isBrowser) return;
        this.offlineQueue.push({
            operation,
            table,
            data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(DB_PREFIX + 'offlineQueue', JSON.stringify(this.offlineQueue));
    }

    async processOfflineQueue() {
        if (!isBrowser || this.offlineQueue.length === 0) return;
        console.log(`📤 Processing ${this.offlineQueue.length} offline operations...`);
        
        const queue = [...this.offlineQueue];
        this.offlineQueue = [];
        
        for (const item of queue) {
            try {
                switch (item.operation) {
                    case 'create':
                        await this.currentAdapter.create(item.table, item.data);
                        break;
                    case 'update':
                        await this.currentAdapter.update(item.table, item.data.id, item.data.data);
                        break;
                    case 'delete':
                        await this.currentAdapter.delete(item.table, item.data.id);
                        break;
                }
            } catch (e) {
                console.error('Error processing offline operation:', e);
                this.offlineQueue.push(item);
            }
        }
        
        if (this.offlineQueue.length > 0) {
            localStorage.setItem(DB_PREFIX + 'offlineQueue', JSON.stringify(this.offlineQueue));
        } else {
            localStorage.removeItem(DB_PREFIX + 'offlineQueue');
        }
        console.log('✅ Offline queue processed');
    }

    startHealthMonitoring() {
        if (!isBrowser) return;
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.healthCheckInterval = setInterval(async () => {
            if (this.type !== 'localStorage' && this.isOnline) {
                const result = await this.currentAdapter.testConnection();
                if (!result.success) {
                    // Only log a warning — NEVER auto-disconnect or fall back to localStorage.
                    // The user explicitly chose a cloud database; honour that choice.
                    // A transient network blip or server hiccup should not lose the connection.
                    console.warn(`⚠️ Database health check failed (${this.type}): ${result.message}. Will retry next interval.`);
                    this.emit('error', { message: result.message || 'Connection unhealthy' });
                    // Do NOT call this.disconnect() here — ever.
                } else {
                    // Restore connected flag if it was previously false
                    if (!this.connected) {
                        this.connected = true;
                        console.log(`✅ Database reconnected: ${this.type}`);
                        this.emit('connected', { type: this.type, config: this.config });
                    }
                }
            }
        }, 30000);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    getStats() {
        const stats: any = {
            type: this.type,
            connected: this.connected,
            isOnline: this.isOnline,
            offlineQueueSize: this.offlineQueue.length,
            tables: {}
        };

        for (const tableName in this.tables) {
            const data = this.adapters.localStorage.getTableData(tableName);
            stats.tables[tableName] = data.length;
        }

        if (isBrowser) {
            let totalSize = 0;
            for (const key in localStorage) {
                if (key.startsWith(DB_PREFIX)) {
                    totalSize += (localStorage[key] || '').length;
                }
            }
            stats.sizeKB = (totalSize / 1024).toFixed(2);
        } else {
            stats.sizeKB = '0.00';
        }

        return stats;
    }

    on(event: string, callback: any) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }

    off(event: string, callback: any) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter((cb: any) => cb !== callback);
        }
    }

    emit(event: string, data: any) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach((callback: any) => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Event listener error:', e);
                }
            });
        }
    }
}

// Global instance creation
const db = new UnifiedDatabase();

if (isBrowser) {
    const win = window as any;
    win.DatabaseManager = db;
    win.UnifiedDatabase = UnifiedDatabase;
    
    // Auto-load saved database configuration
    const savedQueue = localStorage.getItem(DB_PREFIX + 'offlineQueue');
    if (savedQueue) {
        try {
            db.offlineQueue = JSON.parse(savedQueue);
        } catch (e) {
            console.error('Error loading offline queue:', e);
        }
    }
    db.loadSavedConnection();
}

export default db;
