/**
 * UNIVERSAL DATABASE MANAGER - Project Alpha v2.1.0
 * 
 * Supports: localStorage, Supabase, Firebase, MongoDB Atlas, REST API
 * 
 * Features:
 * - Seamless database switching at runtime
 * - Automatic reconnection on connection loss
 * - Offline-first with automatic sync when back online
 * - Data migration between databases
 * - Connection health monitoring
 * - Multi-adapter architecture
 * 
 * Recommended: Supabase (Free tier: 500MB, 50,000 rows)
 */

const DB_PREFIX = 'projectAlpha_';
const DB_VERSION = '2.1.0';

// ===== DATABASE ADAPTER BASE CLASS =====
class DatabaseAdapter {
    constructor(name) {
        this.name = name;
        this.connected = false;
        this.config = null;
    }

    async connect(config) { throw new Error('Not implemented'); }
    async disconnect() { throw new Error('Not implemented'); }
    async create(table, record) { throw new Error('Not implemented'); }
    async read(table, filter) { throw new Error('Not implemented'); }
    async readOne(table, id) { throw new Error('Not implemented'); }
    async update(table, id, data) { throw new Error('Not implemented'); }
    async delete(table, id) { throw new Error('Not implemented'); }
    async query(table, options) { throw new Error('Not implemented'); }
    async testConnection() { throw new Error('Not implemented'); }
}

// ===== LOCALSTORAGE ADAPTER =====
class LocalStorageAdapter extends DatabaseAdapter {
    constructor() {
        super('localStorage');
        this.connected = true;
    }

    async connect(config) {
        this.connected = true;
        this.config = config || {};
        return { success: true, message: 'localStorage is always available' };
    }

    async disconnect() {
        return { success: true };
    }

    async create(table, record) {
        try {
            const data = this.getTableData(table);
            data.push(record);
            this.setTableData(table, data);
            return { success: true, data: record };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async read(table, filter = null) {
        try {
            let data = this.getTableData(table);
            
            if (filter && typeof filter === 'object') {
                data = data.filter(item => {
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

    async readOne(table, id) {
        const data = this.getTableData(table);
        return data.find(item => item.id === id) || null;
    }

    async update(table, id, updates) {
        try {
            const data = this.getTableData(table);
            const index = data.findIndex(item => item.id === id);
            
            if (index === -1) {
                return { success: false, error: 'Record not found' };
            }

            data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
            this.setTableData(table, data);
            return { success: true, data: data[index] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async delete(table, id) {
        try {
            const data = this.getTableData(table);
            const index = data.findIndex(item => item.id === id);
            
            if (index === -1) {
                return { success: false, error: 'Record not found' };
            }

            data.splice(index, 1);
            this.setTableData(table, data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async query(table, options = {}) {
        let data = await this.read(table, options.filter);
        
        if (options.orderBy) {
            const [field, direction] = options.orderBy.split(':');
            data.sort((a, b) => {
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
        try {
            localStorage.setItem(DB_PREFIX + '_test', 'test');
            localStorage.removeItem(DB_PREFIX + '_test');
            return { success: true, message: 'localStorage is working' };
        } catch (error) {
            return { success: false, message: 'localStorage is not available' };
        }
    }

    getTableData(table) {
        const data = localStorage.getItem(DB_PREFIX + table);
        return data ? JSON.parse(data) : [];
    }

    setTableData(table, data) {
        localStorage.setItem(DB_PREFIX + table, JSON.stringify(data));
    }
}

// ===== SUPABASE ADAPTER =====
class SupabaseAdapter extends DatabaseAdapter {
    constructor() {
        super('supabase');
        this.client = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
    }

    async connect(config) {
        if (!config.url || !config.anonKey) {
            return { success: false, message: 'Supabase URL and Anon Key are required' };
        }

        // Clean the URL (remove trailing slash and whitespace)
        const cleanUrl = config.url.trim().replace(/\/$/, '');

        // Validate URL format - accept supabase.co, supabase.in, or any valid URL
        try {
            const urlObj = new URL(cleanUrl);
            if (!urlObj.protocol.startsWith('http')) {
                return { success: false, message: 'Invalid Supabase URL. Must start with http:// or https://' };
            }
        } catch (e) {
            return { success: false, message: 'Invalid Supabase URL format. It should be like: https://xxxxx.supabase.co' };
        }

        try {
            // Load Supabase client library
            if (!window.supabase) {
                console.log('📦 Loading Supabase client library...');
                await this.loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
                // Wait a moment for the script to initialize
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (!window.supabase || !window.supabase.createClient) {
                return { success: false, message: 'Failed to load Supabase library. Check your internet connection.' };
            }

            const { createClient } = window.supabase;
            
            // Create client - works with both old (eyJ...) and new (sb_publishable_...) key formats
            this.client = createClient(cleanUrl, config.anonKey, {
                auth: { persistSession: true, autoRefreshToken: true },
                realtime: { params: { eventsPerSecond: 10 } }
            });

            // Test connection by making a simple query
            console.log('🔌 Testing Supabase connection...');
            
            // First, test the REST API directly to verify credentials
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
                    if (testResponse.status === 401 || testResponse.status === 403) {
                        return { success: false, message: 'Invalid API Key. Make sure you copied the full anon key.' };
                    }
                    const errorText = await testResponse.text();
                    return { success: false, message: `API Error (${testResponse.status}): ${errorText}` };
                }
            } catch (fetchError) {
                console.error('REST API test failed:', fetchError);
                if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
                    return { success: false, message: 'Network error. Check your internet connection and Supabase URL.' };
                }
            }
            
            // Try to query - if table doesn't exist, that's OK (means connection works)
            const { data, error } = await this.client.from('users').select('id').limit(1);
            
            if (error) {
                // These errors mean the connection is working, just table issues
                if (error.message.includes('does not exist') || 
                    error.message.includes('relation') ||
                    error.message.includes('permission denied') ||
                    error.code === '42P01' ||
                    error.code === '42501') {
                    console.log('✅ Connected to Supabase (tables need to be created or RLS configured)');
                    this.connected = true;
                    this.config = { ...config, url: cleanUrl };
                    this.reconnectAttempts = 0;
                    return { success: true, message: 'Connected to Supabase! Now create tables using the SQL button.' };
                }
                
                // Authentication errors
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

        } catch (error) {
            console.error('Supabase connection error:', error);
            
            // Provide helpful error messages
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

    async create(table, record) {
        if (!this.connected) await this.reconnect();
        
        try {
            const { data, error } = await this.client.from(table).insert([record]).select();

            if (error) {
                console.error('Supabase create error:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: data[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async read(table, filter = null) {
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
                console.error('Supabase read error:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Supabase read exception:', error);
            return [];
        }
    }

    async readOne(table, id) {
        if (!this.connected) await this.reconnect();
        
        try {
            const { data, error } = await this.client.from(table).select('*').eq('id', id).single();
            if (error) return null;
            return data;
        } catch (error) {
            return null;
        }
    }

    async update(table, id, updates) {
        if (!this.connected) await this.reconnect();
        
        try {
            const { data, error } = await this.client
                .from(table)
                .update({ ...updates, updatedAt: new Date().toISOString() })
                .eq('id', id)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: data[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async delete(table, id) {
        if (!this.connected) await this.reconnect();
        
        try {
            const { error } = await this.client.from(table).delete().eq('id', id);

            if (error) {
                console.error('Supabase delete error:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async query(table, options = {}) {
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
            if (error) return [];
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
            // Test by making a REST API call (doesn't require tables to exist)
            const testUrl = `${this.config.url}/rest/v1/`;
            const testResponse = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'apikey': this.config.anonKey,
                    'Authorization': `Bearer ${this.config.anonKey}`
                }
            });
            
            if (testResponse.ok) {
                return { success: true, message: 'Supabase connection is healthy' };
            }
            
            return { success: false, message: `HTTP ${testResponse.status}` };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return false;
        }

        this.reconnectAttempts++;
        console.log(`Attempting to reconnect to Supabase (attempt ${this.reconnectAttempts})`);
        
        if (this.config) {
            const result = await this.connect(this.config);
            return result.success;
        }
        return false;
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// ===== FIREBASE ADAPTER =====
class FirebaseAdapter extends DatabaseAdapter {
    constructor() {
        super('firebase');
        this.db = null;
    }

    async connect(config) {
        if (!config.apiKey || !config.projectId) {
            return { success: false, message: 'Firebase API Key and Project ID are required' };
        }

        try {
            if (!window.firebase) {
                await this.loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
                await this.loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js');
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(config);
            }

            this.db = firebase.firestore();
            this.connected = true;
            this.config = config;
            
            console.log('✅ Connected to Firebase');
            return { success: true, message: 'Connected to Firebase' };

        } catch (error) {
            console.error('Firebase connection error:', error);
            return { success: false, message: error.message };
        }
    }

    async disconnect() {
        this.db = null;
        this.connected = false;
        return { success: true };
    }

    async create(table, record) {
        try {
            await this.db.collection(table).doc(record.id).set(record);
            return { success: true, data: record };
        } catch (error) {
            console.error('Firebase create error:', error);
            return { success: false, error: error.message };
        }
    }

    async read(table, filter = null) {
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
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('Firebase read error:', error);
            return [];
        }
    }

    async readOne(table, id) {
        try {
            const doc = await this.db.collection(table).doc(id).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            return null;
        }
    }

    async update(table, id, updates) {
        try {
            await this.db.collection(table).doc(id).update({
                ...updates,
                updatedAt: new Date().toISOString()
            });
            const doc = await this.db.collection(table).doc(id).get();
            return { success: true, data: doc.data() };
        } catch (error) {
            console.error('Firebase update error:', error);
            return { success: false, error: error.message };
        }
    }

    async delete(table, id) {
        try {
            await this.db.collection(table).doc(id).delete();
            return { success: true };
        } catch (error) {
            console.error('Firebase delete error:', error);
            return { success: false, error: error.message };
        }
    }

    async query(table, options = {}) {
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
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('Firebase query error:', error);
            return [];
        }
    }

    async testConnection() {
        try {
            await this.db.collection('_health_check').doc('test').get();
            return { success: true, message: 'Firebase connection is healthy' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// ===== MONGODB ATLAS ADAPTER (via Data API) =====
class MongoDBAdapter extends DatabaseAdapter {
    constructor() {
        super('mongodb');
        this.apiUrl = null;
        this.apiKey = null;
        this.dataSource = null;
        this.database = null;
    }

    async connect(config) {
        if (!config.apiUrl || !config.apiKey || !config.dataSource || !config.database) {
            return { 
                success: false, 
                message: 'MongoDB Data API URL, API Key, Data Source, and Database name are required' 
            };
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

    async makeRequest(action, collection, body = {}) {
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

    async create(table, record) {
        try {
            await this.makeRequest('insertOne', table, { document: record });
            return { success: true, data: record };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async read(table, filter = null) {
        try {
            const result = await this.makeRequest('find', table, { filter: filter || {} });
            return result.documents || [];
        } catch (error) {
            console.error('MongoDB read error:', error);
            return [];
        }
    }

    async readOne(table, id) {
        try {
            const result = await this.makeRequest('findOne', table, { filter: { id: id } });
            return result.document || null;
        } catch (error) {
            return null;
        }
    }

    async update(table, id, updates) {
        try {
            await this.makeRequest('updateOne', table, {
                filter: { id: id },
                update: { $set: { ...updates, updatedAt: new Date().toISOString() } }
            });
            return { success: true, data: { id, ...updates } };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async delete(table, id) {
        try {
            await this.makeRequest('deleteOne', table, { filter: { id: id } });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async query(table, options = {}) {
        try {
            const body = { filter: options.filter || {} };

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
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// ===== REST API ADAPTER =====
class RestAPIAdapter extends DatabaseAdapter {
    constructor() {
        super('restapi');
        this.baseUrl = null;
        this.headers = {};
    }

    async connect(config) {
        if (!config.baseUrl) {
            return { success: false, message: 'API Base URL is required' };
        }

        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.headers = {
            'Content-Type': 'application/json',
            ...(config.headers || {})
        };
        
        if (config.apiKey) {
            this.headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        this.config = config;

        const test = await this.testConnection();
        if (test.success) {
            this.connected = true;
            console.log('✅ Connected to REST API');
            return { success: true, message: 'Connected to REST API' };
        }

        return test;
    }

    async disconnect() {
        this.connected = false;
        return { success: true };
    }

    async create(table, record) {
        try {
            const response = await fetch(`${this.baseUrl}/${table}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(record)
            });
            const data = await response.json();
            return { success: response.ok, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async read(table, filter = null) {
        try {
            let url = `${this.baseUrl}/${table}`;
            if (filter) {
                const params = new URLSearchParams(filter);
                url += `?${params}`;
            }
            const response = await fetch(url, { headers: this.headers });
            return await response.json();
        } catch (error) {
            console.error('REST API read error:', error);
            return [];
        }
    }

    async readOne(table, id) {
        try {
            const response = await fetch(`${this.baseUrl}/${table}/${id}`, { headers: this.headers });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    async update(table, id, updates) {
        try {
            const response = await fetch(`${this.baseUrl}/${table}/${id}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            return { success: response.ok, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async delete(table, id) {
        try {
            const response = await fetch(`${this.baseUrl}/${table}/${id}`, {
                method: 'DELETE',
                headers: this.headers
            });
            return { success: response.ok };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async query(table, options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.filter) {
                for (const key in options.filter) {
                    params.append(key, options.filter[key]);
                }
            }
            if (options.orderBy) params.append('orderBy', options.orderBy);
            if (options.limit) params.append('limit', options.limit);
            if (options.offset) params.append('offset', options.offset);

            const url = `${this.baseUrl}/${table}?${params}`;
            const response = await fetch(url, { headers: this.headers });
            return await response.json();
        } catch (error) {
            console.error('REST API query error:', error);
            return [];
        }
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, { headers: this.headers });
            return { 
                success: response.ok, 
                message: response.ok ? 'API is healthy' : 'API health check failed' 
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// ===== UNIFIED DATABASE MANAGER =====
class UnifiedDatabase {
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
        this.isOnline = navigator.onLine;
        this.healthCheckInterval = null;
        
        this.eventListeners = {
            connected: [],
            disconnected: [],
            synced: [],
            error: []
        };

        this.tables = {
            users: { name: 'users', primaryKey: 'id' },
            tasks: { name: 'tasks', primaryKey: 'id' },
            transactions: { name: 'transactions', primaryKey: 'id' },
            investments: { name: 'investments', primaryKey: 'id' },
            products: { name: 'products', primaryKey: 'id' },
            announcements: { name: 'announcements', primaryKey: 'id' },
            activity_logs: { name: 'activity_logs', primaryKey: 'id' },
            task_completions: { name: 'task_completions', primaryKey: 'id' },
            referrals: { name: 'referrals', primaryKey: 'id' },
            memberships: { name: 'memberships', primaryKey: 'id' },
            proofs: { name: 'proofs', primaryKey: 'id' },
            deposits: { name: 'deposits', primaryKey: 'id' },
            withdrawals: { name: 'withdrawals', primaryKey: 'id' },
            settings: { name: 'settings', primaryKey: 'id' },
            chatMessages: { name: 'chatMessages', primaryKey: 'id' }
        };

        this.setupNetworkHandlers();
    }

    // ==================== CONNECTION METHODS ====================

    async connect(type, config = {}) {
        const adapter = this.adapters[type];
        
        if (!adapter) {
            return { 
                success: false, 
                message: `Database type "${type}" is not supported. Supported: ${Object.keys(this.adapters).join(', ')}`
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

        } catch (error) {
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
        
        localStorage.removeItem(DB_PREFIX + 'dbConfig');
        this.emit('disconnected', {});
        
        return { success: true, message: 'Disconnected from database' };
    }

    async switchDatabase(type, config = {}) {
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

    async testConnection(type, config) {
        const adapter = this.adapters[type];
        
        if (!adapter) {
            return { success: false, message: `Unknown database type: ${type}` };
        }

        console.log(`🔍 Testing ${type} connection...`, config.url ? { url: config.url } : {});

        try {
            const connectResult = await adapter.connect(config);
            console.log('📡 Connect result:', connectResult);
            
            if (!connectResult.success) return connectResult;

            // For Supabase, connection test already validates - no need to test again
            if (type === 'supabase') {
                await adapter.disconnect();
                return connectResult;
            }

            const testResult = await adapter.testConnection();
            await adapter.disconnect();
            
            return testResult;
        } catch (error) {
            console.error('❌ Test connection error:', error);
            return { success: false, message: error.message };
        }
    }

    async loadSavedConnection() {
        const saved = localStorage.getItem(DB_PREFIX + 'dbConfig');
        
        if (saved) {
            try {
                const { type, config } = JSON.parse(saved);
                
                if (type && type !== 'localStorage') {
                    console.log(`🔄 Auto-connecting to saved database: ${type}`);
                    return await this.connect(type, config);
                }
            } catch (e) {
                console.error('Error loading saved connection:', e);
            }
        }
        
        this.connected = true;
        return { success: true, message: 'Using localStorage' };
    }

    saveConnectionConfig() {
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

    // ==================== CRUD OPERATIONS ====================

    async create(table, data) {
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

        return await this.currentAdapter.create(table, record);
    }

    async read(table, filter = null) {
        if (!this.isOnline && this.type !== 'localStorage') {
            return await this.adapters.localStorage.read(table, filter);
        }
        return await this.currentAdapter.read(table, filter);
    }

    async readOne(table, id) {
        if (!this.isOnline && this.type !== 'localStorage') {
            return await this.adapters.localStorage.readOne(table, id);
        }
        return await this.currentAdapter.readOne(table, id);
    }

    async update(table, id, data) {
        const updates = { ...data, updatedAt: new Date().toISOString() };

        if (!this.isOnline && this.type !== 'localStorage') {
            this.queueOfflineOperation('update', table, { id, data: updates });
            return await this.adapters.localStorage.update(table, id, updates);
        }

        return await this.currentAdapter.update(table, id, updates);
    }

    async delete(table, id) {
        if (!this.isOnline && this.type !== 'localStorage') {
            this.queueOfflineOperation('delete', table, { id });
            return await this.adapters.localStorage.delete(table, id);
        }
        return await this.currentAdapter.delete(table, id);
    }

    async query(table, options = {}) {
        if (!this.isOnline && this.type !== 'localStorage') {
            return await this.adapters.localStorage.query(table, options);
        }
        return await this.currentAdapter.query(table, options);
    }

    async bulkCreate(table, records) {
        const results = [];
        for (const record of records) {
            const result = await this.create(table, record);
            results.push(result);
        }
        return { success: true, created: results.length };
    }

    async bulkUpdate(table, records) {
        const results = [];
        for (const record of records) {
            if (record.id) {
                const result = await this.update(table, record.id, record);
                results.push(result);
            }
        }
        return { success: true, updated: results.length };
    }

    // ==================== SYNC OPERATIONS ====================

    async syncToCloud() {
        if (this.type === 'localStorage') {
            return { success: false, error: 'No cloud database connected' };
        }

        const results = { success: true, synced: {}, errors: [] };
        
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
            } catch (error) {
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

        const results = { success: true, synced: {}, errors: [] };

        for (const tableName in this.tables) {
            try {
                const cloudData = await this.read(tableName);
                
                if (cloudData && cloudData.length > 0) {
                    this.adapters.localStorage.setTableData(tableName, cloudData);
                    results.synced[tableName] = cloudData.length;
                }
            } catch (error) {
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

        const results = { success: true, toCloud: {}, fromCloud: {}, conflicts: [] };

        for (const tableName in this.tables) {
            try {
                const localData = this.adapters.localStorage.getTableData(tableName);
                const cloudData = await this.read(tableName);

                const localMap = new Map(localData.map(r => [r.id, r]));
                const cloudMap = new Map(cloudData.map(r => [r.id, r]));

                for (const [id, record] of localMap) {
                    if (!cloudMap.has(id)) {
                        await this.create(tableName, record);
                        results.toCloud[tableName] = (results.toCloud[tableName] || 0) + 1;
                    } else {
                        const cloudRecord = cloudMap.get(id);
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

    // ==================== DATA EXPORT/IMPORT ====================

    async exportAllData() {
        const data = {
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

    async importAllData(data) {
        if (!data || !data.tables) {
            return { success: false, error: 'Invalid data format' };
        }

        const results = { success: true, imported: {}, errors: [] };

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
                } catch (error) {
                    results.errors.push({ table: tableName, error: error.message });
                }
            }
        }

        if (results.errors.length > 0) results.success = false;
        return results;
    }

    async downloadBackup() {
        const data = await this.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project_alpha_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return { success: true };
    }

    // ==================== NETWORK & OFFLINE HANDLING ====================

    setupNetworkHandlers() {
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

    queueOfflineOperation(operation, table, data) {
        this.offlineQueue.push({
            operation,
            table,
            data,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem(DB_PREFIX + 'offlineQueue', JSON.stringify(this.offlineQueue));
    }

    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;
        
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

    // ==================== HEALTH MONITORING ====================

    startHealthMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.healthCheckInterval = setInterval(async () => {
            if (this.type !== 'localStorage' && this.isOnline) {
                const result = await this.currentAdapter.testConnection();
                if (!result.success) {
                    console.warn(`⚠️ Database connection unhealthy (${this.type}):`, result.message);
                    this.emit('error', { message: result.message || 'Connection unhealthy' });
                }
            }
        }, 30000);
    }

    // ==================== UTILITY METHODS ====================

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    getStats() {
        const stats = {
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

        let totalSize = 0;
        for (const key in localStorage) {
            if (key.startsWith(DB_PREFIX)) {
                totalSize += (localStorage[key] || '').length;
            }
        }
        stats.sizeKB = (totalSize / 1024).toFixed(2);

        return stats;
    }

    on(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Event listener error:', e);
                }
            });
        }
    }

    // ==================== SQL GENERATION FOR SUPABASE ====================

    generateCreateTableSQL() {
        return `-- Project Alpha Database Schema
-- Generated: ${new Date().toISOString()}
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    "fullName" TEXT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    role TEXT DEFAULT 'user',
    balance DECIMAL(15,2) DEFAULT 0,
    points INTEGER DEFAULT 0,
    "totalInvested" DECIMAL(15,2) DEFAULT 0,
    "totalProfit" DECIMAL(15,2) DEFAULT 0,
    "referralEarnings" DECIMAL(15,2) DEFAULT 0,
    "referralCode" TEXT UNIQUE,
    "referredBy" TEXT,
    referrals JSONB DEFAULT '[]',
    "bkashNumber" TEXT,
    "nagadNumber" TEXT,
    avatar TEXT,
    membership TEXT DEFAULT 'free',
    "isLoggedIn" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- TASKS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    category TEXT,
    reward DECIMAL(10,2) DEFAULT 0,
    url TEXT,
    duration INTEGER DEFAULT 0,
    instructions TEXT,
    status TEXT DEFAULT 'active',
    "createdBy" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    method TEXT,
    status TEXT DEFAULT 'pending',
    reference TEXT,
    phone TEXT,
    description TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- INVESTMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    "productId" TEXT,
    "productName" TEXT,
    amount DECIMAL(15,2) NOT NULL,
    "dailyProfit" DECIMAL(10,2) DEFAULT 0,
    "totalProfit" DECIMAL(15,2) DEFAULT 0,
    duration INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    "startDate" TIMESTAMPTZ,
    "endDate" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on investments" ON investments FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- PRODUCTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    price DECIMAL(15,2) NOT NULL,
    "dailyProfit" DECIMAL(10,2) DEFAULT 0,
    duration INTEGER DEFAULT 0,
    category TEXT,
    status TEXT DEFAULT 'active',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- ANNOUNCEMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'info',
    priority INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- ACTIVITY LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    action TEXT NOT NULL,
    details JSONB,
    ip TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- TASK COMPLETIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS task_completions (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    "taskId" TEXT,
    status TEXT DEFAULT 'pending',
    reward DECIMAL(10,2) DEFAULT 0,
    proof TEXT,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on task_completions" ON task_completions FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- REFERRALS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    "referrerId" TEXT,
    "referredId" TEXT,
    bonus DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on referrals" ON referrals FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- MEMBERSHIPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    level TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    "startDate" TIMESTAMPTZ,
    "endDate" TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on memberships" ON memberships FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- PROOFS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS proofs (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    type TEXT,
    "imageUrl" TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on proofs" ON proofs FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- DEPOSITS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    amount DECIMAL(15,2) NOT NULL,
    method TEXT,
    status TEXT DEFAULT 'pending',
    reference TEXT,
    phone TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on deposits" ON deposits FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- WITHDRAWALS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    amount DECIMAL(15,2) NOT NULL,
    method TEXT,
    status TEXT DEFAULT 'pending',
    phone TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on withdrawals" ON withdrawals FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- SETTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE,
    value JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- CHAT MESSAGES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "chatMessages" (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    "adminId" TEXT,
    message TEXT,
    sender TEXT,
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE "chatMessages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on chatMessages" ON "chatMessages" FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users("referralCode");
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions("userId");
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_investments_user ON investments("userId");
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions("userId");
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs("userId");

-- Success message
SELECT 'All tables created successfully!' as status;
`;
    }
}

// ===== CREATE GLOBAL INSTANCE =====
const DatabaseManagerInstance = new UnifiedDatabase();

// Make available globally
window.DatabaseManager = DatabaseManagerInstance;
window.UnifiedDatabase = UnifiedDatabase;

// Auto-load saved connection on page load
document.addEventListener('DOMContentLoaded', async () => {
    const savedQueue = localStorage.getItem(DB_PREFIX + 'offlineQueue');
    if (savedQueue) {
        try {
            DatabaseManagerInstance.offlineQueue = JSON.parse(savedQueue);
        } catch (e) {
            console.error('Error loading offline queue:', e);
        }
    }

    await DatabaseManagerInstance.loadSavedConnection();
});

console.log('📦 Universal Database Manager v' + DB_VERSION + ' loaded');
console.log('💡 Use window.DatabaseManager for database operations');
console.log('📊 Supported: localStorage, Supabase, Firebase, MongoDB Atlas, REST API');
