'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/context/ToastContext';
import db from '@/lib/database';

export default function DatabaseSettingsPage() {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Database Status States
    const [dbType, setDbType] = useState<string>('localStorage');
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [dbConfig, setDbConfig] = useState<any>({});
    
    // UI state
    const [selectedTab, setSelectedTab] = useState<'supabase' | 'firebase' | 'mongodb' | 'localStorage'>('supabase');
    const [testLog, setTestLog] = useState<string>('');
    const [isTesting, setIsTesting] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [showSql, setShowSql] = useState<boolean>(false);
    
    // Form Inputs
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
    
    const [firebaseApiKey, setFirebaseApiKey] = useState('');
    const [firebaseAuthDomain, setFirebaseAuthDomain] = useState('');
    const [firebaseProjectId, setFirebaseProjectId] = useState('');
    const [firebaseStorageBucket, setFirebaseStorageBucket] = useState('');
    const [firebaseMessagingSenderId, setFirebaseMessagingSenderId] = useState('');
    const [firebaseAppId, setFirebaseAppId] = useState('');

    const [mongoApiUrl, setMongoApiUrl] = useState('');
    const [mongoApiKey, setMongoApiKey] = useState('');
    const [mongoDataSource, setMongoDataSource] = useState('');
    const [mongoDatabase, setMongoDatabase] = useState('');

    useEffect(() => {
        // Load initial status from database instance
        updateDatabaseStatus();
        
        // Populate fields if config already exists
        const populateFields = () => {
            if (db.config) {
                if (db.type === 'supabase') {
                    setSupabaseUrl(db.config.url || '');
                    setSupabaseAnonKey(db.config.anonKey || '');
                    setSelectedTab('supabase');
                } else if (db.type === 'firebase') {
                    setFirebaseApiKey(db.config.apiKey || '');
                    setFirebaseAuthDomain(db.config.authDomain || '');
                    setFirebaseProjectId(db.config.projectId || '');
                    setFirebaseStorageBucket(db.config.storageBucket || '');
                    setFirebaseMessagingSenderId(db.config.messagingSenderId || '');
                    setFirebaseAppId(db.config.appId || '');
                    setSelectedTab('firebase');
                } else if (db.type === 'mongodb') {
                    setMongoApiUrl(db.config.apiUrl || '');
                    setMongoApiKey(db.config.apiKey || '');
                    setMongoDataSource(db.config.dataSource || '');
                    setMongoDatabase(db.config.database || '');
                    setSelectedTab('mongodb');
                }
            } else {
                setSelectedTab('supabase'); // default tab
            }
        };

        populateFields();

        // Listen for database changes to update UI automatically
        const handleConnected = () => {
            updateDatabaseStatus();
            populateFields();
        };

        const handleDisconnected = () => {
            updateDatabaseStatus();
        };

        db.on('connected', handleConnected);
        db.on('disconnected', handleDisconnected);
        db.on('error', handleDisconnected);

        return () => {
            db.off('connected', handleConnected);
            db.off('disconnected', handleDisconnected);
            db.off('error', handleDisconnected);
        };
    }, []);

    const updateDatabaseStatus = () => {
        setDbType(db.type);
        setIsConnected(db.connected);
        setIsOnline(db.isOnline);
        setDbConfig(db.config || {});
    };

    const getActiveConfig = (type: string) => {
        if (type === 'supabase') {
            return { url: supabaseUrl.trim(), anonKey: supabaseAnonKey.trim() };
        }
        if (type === 'firebase') {
            return {
                apiKey: firebaseApiKey.trim(),
                authDomain: firebaseAuthDomain.trim(),
                projectId: firebaseProjectId.trim(),
                storageBucket: firebaseStorageBucket.trim(),
                messagingSenderId: firebaseMessagingSenderId.trim(),
                appId: firebaseAppId.trim()
            };
        }
        if (type === 'mongodb') {
            return {
                apiUrl: mongoApiUrl.trim(),
                apiKey: mongoApiKey.trim(),
                dataSource: mongoDataSource.trim(),
                database: mongoDatabase.trim()
            };
        }
        return {};
    };

    const handleTestConnection = async (type: string) => {
        setTestLog('⏳ Testing connection...');
        setIsTesting(true);
        try {
            const config = getActiveConfig(type);
            const result = await db.testConnection(type, config);
            if (result.success) {
                setTestLog(`✅ Connection Successful!\nDetails: ${result.message}`);
                showToast(`Connected to ${type} successfully!`, 'success');
            } else {
                setTestLog(`❌ Connection Failed.\nReason: ${result.message}`);
                showToast(`Failed to connect: ${result.message}`, 'error');
            }
        } catch (err: any) {
            setTestLog(`❌ Test Exception: ${err.message}`);
            showToast('An error occurred while testing connection.', 'error');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSaveConnection = async (type: string) => {
        setIsSaving(true);
        setTestLog('⏳ Saving configurations and connecting...');
        try {
            const config = getActiveConfig(type);
            const result = await db.connect(type, config);
            if (result.success) {
                setTestLog(`✅ Connected Successfully and Configuration Saved!\nDetails: ${result.message}`);
                showToast(`Switched active database to: ${type}`, 'success');
                updateDatabaseStatus();
            } else {
                setTestLog(`❌ Failed to Save and Connect.\nReason: ${result.message}`);
                showToast(`Failed to connect: ${result.message}`, 'error');
            }
        } catch (err: any) {
            setTestLog(`❌ Connection Exception: ${err.message}`);
            showToast('Failed to switch database provider.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect from the cloud database and fallback to LocalStorage?')) return;
        setIsSaving(true);
        try {
            await db.disconnect();
            showToast('Disconnected from cloud database. Fallback to LocalStorage is active.', 'success');
            setTestLog('Disconnected. Using local browser database.');
            updateDatabaseStatus();
            setSelectedTab('localStorage');
        } catch (err: any) {
            showToast('Failed to disconnect database.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSyncToCloud = async () => {
        if (dbType === 'localStorage') {
            showToast('Please connect to a cloud database first.', 'error');
            return;
        }
        if (!confirm('This will upload all local browser records to the connected cloud database. Existing cloud records with matching IDs might be updated. Proceed?')) return;
        
        setIsSyncing(true);
        try {
            const result = await db.syncToCloud();
            if (result.success) {
                const countDetails = Object.entries(result.synced)
                    .map(([tbl, num]) => `${tbl}: ${num}`)
                    .join(', ');
                showToast(`Data successfully uploaded! (${countDetails || '0 records synced'})`, 'success');
            } else {
                showToast(`Sync finished with some issues. ${result.errors.length} table errors.`, 'warning');
            }
        } catch (err: any) {
            showToast(`Sync failed: ${err.message}`, 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncFromCloud = async () => {
        if (dbType === 'localStorage') {
            showToast('Please connect to a cloud database first.', 'error');
            return;
        }
        if (!confirm('Warning: This will overwrite your browser\'s local storage data for all matching tables with records downloaded from the cloud database. Continue?')) return;
        
        setIsSyncing(true);
        try {
            const result = await db.syncFromCloud();
            if (result.success) {
                showToast('Cloud database records successfully downloaded to local browser!', 'success');
            } else {
                showToast('Failed to download some tables from cloud.', 'error');
            }
        } catch (err: any) {
            showToast(`Sync failed: ${err.message}`, 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExportJSON = async () => {
        try {
            const data = await db.exportAllData();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `project_alpha_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast('Data exported successfully!', 'success');
        } catch (err: any) {
            showToast(`Failed to export data: ${err.message}`, 'error');
        }
    };

    const handleImportJSONClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!confirm('This will wipe your current database tables and replace them with the records from the backup file. Proceed?')) return;
                
                setIsSyncing(true);
                const result = await db.importAllData(json);
                if (result.success) {
                    showToast('Backup data successfully imported into the active database!', 'success');
                } else {
                    showToast('Import completed with errors. Some tables may not have imported fully.', 'warning');
                }
            } catch (err: any) {
                showToast(`Failed to parse or import backup file: ${err.message}`, 'error');
            } finally {
                setIsSyncing(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const sqlScript = `-- Drop existing tables if they exist to force clean recreate
DROP TABLE IF EXISTS users, tasks, transactions, investments, products, announcements, activity_logs, task_completions, referrals, memberships, proofs, deposits, withdrawals, settings, "chatMessages" CASCADE;

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
    status TEXT DEFAULT 'active',
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
    "baseReward" DECIMAL(10,2) DEFAULT 0,
    url TEXT,
    duration INTEGER DEFAULT 0,
    instructions TEXT,
    "proofInstructions" TEXT,
    active BOOLEAN DEFAULT true,
    "dailyLimit" INTEGER DEFAULT 1,
    "totalLimit" INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'everyone',
    verification TEXT DEFAULT 'auto',
    featured BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
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
    "userEmail" TEXT,
    "userName" TEXT,
    type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    method TEXT,
    status TEXT DEFAULT 'pending',
    reference TEXT,
    phone TEXT,
    "accountNumber" TEXT,
    "transactionId" TEXT,
    "txnId" TEXT,
    "toNumber" TEXT,
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
    "productIcon" TEXT,
    amount DECIMAL(15,2) NOT NULL,
    units INTEGER DEFAULT 1,
    "sellMode" TEXT DEFAULT 'auto',
    "profitRate" DECIMAL(5,2) DEFAULT 0,
    "dailyProfit" DECIMAL(10,2) DEFAULT 0,
    "totalProfit" DECIMAL(15,2) DEFAULT 0,
    duration INTEGER DEFAULT 0,
    "remainingDays" INTEGER DEFAULT 0,
    "expectedProfit" DECIMAL(15,2) DEFAULT 0,
    "totalReturn" DECIMAL(15,2) DEFAULT 0,
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
    icon TEXT,
    price DECIMAL(15,2) NOT NULL,
    "dailyProfit" DECIMAL(10,2) DEFAULT 0,
    "returnRate" DECIMAL(10,2) DEFAULT 0,
    duration INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    "minUnits" INTEGER DEFAULT 1,
    category TEXT,
    active BOOLEAN DEFAULT true,
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
    "pointsAwarded" DECIMAL(10,2) DEFAULT 0,
    proof TEXT,
    "completedAt" TIMESTAMPTZ,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
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
    "userEmail" TEXT,
    "userName" TEXT,
    "membershipId" TEXT,
    "membershipName" TEXT,
    amount DECIMAL(15,2) DEFAULT 0,
    "paymentMethod" TEXT,
    "paymentMethodName" TEXT,
    "transactionId" TEXT,
    "txnId" TEXT,
    "senderNumber" TEXT,
    status TEXT DEFAULT 'pending',
    note TEXT,
    "taskLimit" INTEGER,
    level TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    "startDate" TIMESTAMPTZ,
    "endDate" TIMESTAMPTZ,
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
    "investmentId" TEXT,
    "productName" TEXT,
    "productValue" DECIMAL(15,2) DEFAULT 0,
    "unitsSold" INTEGER DEFAULT 1,
    "buyerName" TEXT,
    notes TEXT,
    "bonusPoints" INTEGER DEFAULT 0,
    "submittedAt" TIMESTAMPTZ,
    "processedAt" TIMESTAMPTZ,
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
-- MIGRATION: Add missing columns to existing tables
-- (Safe to run even if columns already exist)
-- ========================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS \"returnRate\" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS \"minUnits\" INTEGER DEFAULT 1;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "userEmail" TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "userName" TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "transactionId" TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "txnId" TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "toNumber" TEXT;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS "userEmail" TEXT;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS "txnId" TEXT;
`;

    const handleCopySQL = () => {
        navigator.clipboard.writeText(sqlScript);
        showToast('SQL script copied to clipboard!', 'success');
    };

    return (
        <div style={{ color: 'white' }}>
            <div className="page-header" style={{ marginBottom: '25px' }}>
                <h1>
                    <i className="fas fa-database" style={{ color: 'var(--primary-color)', marginRight: '10px' }}></i>
                    <span>Database Configuration</span>
                </h1>
                <p>Manage and synchronize database configurations and cloud platforms</p>
            </div>

            {/* Active connection status bar */}
            <div style={{ 
                background: 'var(--bg-primary)', 
                borderRadius: '12px', 
                padding: '20px', 
                border: '1px solid var(--border-color)',
                marginBottom: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: 'var(--text-secondary)' }}>ACTIVE DATABASE SYSTEM</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                            fontSize: '22px', 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase',
                            color: dbType === 'localStorage' ? '#e0a96d' : '#10b981'
                        }}>
                            {dbType === 'localStorage' ? '📁 Browser LocalStorage' : `⚡ Cloud ${dbType}`}
                        </span>
                        <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isConnected ? '#10b981' : '#ef4444',
                            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                            {isConnected ? 'ONLINE / CONNECTED' : 'DISCONNECTED'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {dbType !== 'localStorage' && (
                        <button 
                            className="btn btn-outline" 
                            style={{ borderColor: '#ef4444', color: '#ef4444' }} 
                            onClick={handleDisconnect}
                            disabled={isSaving}
                        >
                            <i className="fas fa-power-off"></i> Fallback to LocalStorage
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={updateDatabaseStatus}>
                        <i className="fas fa-sync"></i> Refresh Status
                    </button>
                </div>
            </div>

            {/* Main Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginBottom: '35px' }}>
                
                {/* Selector and Forms */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Database Type Tab Selector */}
                    <div style={{ 
                        background: 'var(--bg-primary)', 
                        borderRadius: '12px', 
                        padding: '15px', 
                        border: '1px solid var(--border-color)' 
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '15px' }}>Select Database Provider</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button 
                                onClick={() => setSelectedTab('supabase')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 15px',
                                    borderRadius: '8px',
                                    border: `1px solid ${selectedTab === 'supabase' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    background: selectedTab === 'supabase' ? 'rgba(23, 133, 130, 0.15)' : 'var(--bg-secondary)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-bolt" style={{ color: '#10b981' }}></i>
                                    <span>Supabase (PostgreSQL)</span>
                                </span>
                                {dbType === 'supabase' && <span style={{ color: '#10b981', fontSize: '12px' }}>● Active</span>}
                            </button>

                            <button 
                                onClick={() => setSelectedTab('firebase')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 15px',
                                    borderRadius: '8px',
                                    border: `1px solid ${selectedTab === 'firebase' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    background: selectedTab === 'firebase' ? 'rgba(23, 133, 130, 0.15)' : 'var(--bg-secondary)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-fire" style={{ color: '#f59e0b' }}></i>
                                    <span>Firebase (Firestore)</span>
                                </span>
                                {dbType === 'firebase' && <span style={{ color: '#10b981', fontSize: '12px' }}>● Active</span>}
                            </button>

                            <button 
                                onClick={() => setSelectedTab('mongodb')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 15px',
                                    borderRadius: '8px',
                                    border: `1px solid ${selectedTab === 'mongodb' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    background: selectedTab === 'mongodb' ? 'rgba(23, 133, 130, 0.15)' : 'var(--bg-secondary)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-leaf" style={{ color: '#10b981' }}></i>
                                    <span>MongoDB Atlas (Data API)</span>
                                </span>
                                {dbType === 'mongodb' && <span style={{ color: '#10b981', fontSize: '12px' }}>● Active</span>}
                            </button>

                            <button 
                                onClick={() => setSelectedTab('localStorage')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 15px',
                                    borderRadius: '8px',
                                    border: `1px solid ${selectedTab === 'localStorage' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    background: selectedTab === 'localStorage' ? 'rgba(23, 133, 130, 0.15)' : 'var(--bg-secondary)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-folder" style={{ color: '#e0a96d' }}></i>
                                    <span>LocalStorage (Offline Only)</span>
                                </span>
                                {dbType === 'localStorage' && <span style={{ color: '#10b981', fontSize: '12px' }}>● Active</span>}
                            </button>
                        </div>
                    </div>

                    {/* Data sync & migration options */}
                    <div style={{ 
                        background: 'var(--bg-primary)', 
                        borderRadius: '12px', 
                        padding: '20px', 
                        border: '1px solid var(--border-color)' 
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '15px' }}>
                            <i className="fas fa-exchange-alt" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>
                            <span>Data Migration & Backups</span>
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                            Upload local browser databases to a cloud instance, download cloud tables locally, or manage JSON file backups.
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button 
                                className="btn btn-secondary" 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                onClick={handleSyncToCloud}
                                disabled={dbType === 'localStorage' || isSyncing}
                            >
                                <i className="fas fa-cloud-upload-alt"></i> Sync Local Data to Cloud
                            </button>
                            
                            <button 
                                className="btn btn-secondary" 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                onClick={handleSyncFromCloud}
                                disabled={dbType === 'localStorage' || isSyncing}
                            >
                                <i className="fas fa-cloud-download-alt"></i> Sync Cloud Data to Local
                            </button>

                            <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }}></div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button 
                                    className="btn btn-outline" 
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    onClick={handleExportJSON}
                                >
                                    <i className="fas fa-download"></i> Export JSON
                                </button>
                                
                                <button 
                                    className="btn btn-outline" 
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    onClick={handleImportJSONClick}
                                    disabled={isSyncing}
                                >
                                    <i className="fas fa-upload"></i> Import JSON
                                </button>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={handleImportFileChange}
                                accept=".json"
                            />
                        </div>
                    </div>
                </div>

                {/* Configuration form card */}
                <div style={{ 
                    background: 'var(--bg-primary)', 
                    borderRadius: '12px', 
                    padding: '24px', 
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    
                    {/* Supabase Tab */}
                    {selectedTab === 'supabase' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                                <i className="fas fa-bolt" style={{ color: '#10b981', fontSize: '24px' }}></i>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>Supabase Configuration</h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Host data on Supabase PostgreSQL cloud database</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="form-group">
                                    <label htmlFor="sbUrlInput" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Supabase Project URL</label>
                                    <input 
                                        type="text" 
                                        id="sbUrlInput" 
                                        placeholder="https://xxxxx.supabase.co" 
                                        value={supabaseUrl} 
                                        onChange={e => setSupabaseUrl(e.target.value)} 
                                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Obtain from settings: Settings → API → Project URL</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="sbKeyInput" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Anon Public Key</label>
                                    <input 
                                        type="password" 
                                        id="sbKeyInput" 
                                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                                        value={supabaseAnonKey} 
                                        onChange={e => setSupabaseAnonKey(e.target.value)} 
                                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Obtain from settings: Settings → API → anon public</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Firebase Tab */}
                    {selectedTab === 'firebase' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                                <i className="fas fa-fire" style={{ color: '#f59e0b', fontSize: '24px' }}></i>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>Firebase Firestore Configuration</h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Host data on Google Firebase NoSQL database</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>API Key</label>
                                    <input 
                                        type="text" 
                                        placeholder="AIzaSy..." 
                                        value={firebaseApiKey} 
                                        onChange={e => setFirebaseApiKey(e.target.value)} 
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Auth Domain</label>
                                    <input 
                                        type="text" 
                                        placeholder="project.firebaseapp.com" 
                                        value={firebaseAuthDomain} 
                                        onChange={e => setFirebaseAuthDomain(e.target.value)} 
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Project ID</label>
                                    <input 
                                        type="text" 
                                        placeholder="project-id" 
                                        value={firebaseProjectId} 
                                        onChange={e => setFirebaseProjectId(e.target.value)} 
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Storage Bucket</label>
                                    <input 
                                        type="text" 
                                        placeholder="project.appspot.com" 
                                        value={firebaseStorageBucket} 
                                        onChange={e => setFirebaseStorageBucket(e.target.value)} 
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>App ID</label>
                                    <input 
                                        type="text" 
                                        placeholder="1:12345:web:123" 
                                        value={firebaseAppId} 
                                        onChange={e => setFirebaseAppId(e.target.value)} 
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MongoDB Tab */}
                    {selectedTab === 'mongodb' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                                <i className="fas fa-leaf" style={{ color: '#10b981', fontSize: '24px' }}></i>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>MongoDB Atlas Configuration</h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Connect via MongoDB Atlas Data API Endpoint</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Data API URL</label>
                                    <input 
                                        type="text" 
                                        placeholder="https://data.mongodb-api.com/app/data-xxxx/endpoint/data/v1" 
                                        value={mongoApiUrl} 
                                        onChange={e => setMongoApiUrl(e.target.value)} 
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>API Key</label>
                                    <input 
                                        type="password" 
                                        placeholder="MongoDB API Key" 
                                        value={mongoApiKey} 
                                        onChange={e => setMongoApiKey(e.target.value)} 
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Cluster (Data Source)</label>
                                        <input 
                                            type="text" 
                                            placeholder="Cluster0" 
                                            value={mongoDataSource} 
                                            onChange={e => setMongoDataSource(e.target.value)} 
                                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Database Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="project_alpha" 
                                            value={mongoDatabase} 
                                            onChange={e => setMongoDatabase(e.target.value)} 
                                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LocalStorage Tab */}
                    {selectedTab === 'localStorage' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                                <i className="fas fa-folder" style={{ color: '#e0a96d', fontSize: '24px' }}></i>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>LocalStorage System</h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Run the platform locally in the browser cache</p>
                                </div>
                            </div>
                            
                            <div style={{ 
                                background: 'rgba(224, 169, 109, 0.1)', 
                                border: '1px solid rgba(224, 169, 109, 0.3)', 
                                padding: '15px', 
                                borderRadius: '8px',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                color: '#e0a96d'
                            }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                                LocalStorage requires absolutely no backend configuration, server accounts, or online API keys. All data is saved inside your web browser. 
                                <br /><br />
                                <strong>Note:</strong> Clearing browser data/cookies or accessing the app from a different browser will reset the database!
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ marginTop: '30px' }}>
                        {selectedTab !== 'localStorage' ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button 
                                    className="btn btn-outline" 
                                    onClick={() => handleTestConnection(selectedTab)}
                                    disabled={isTesting || isSaving}
                                >
                                    {isTesting ? (
                                        <>
                                            <i className="fas fa-circle-notch fa-spin"></i> Testing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-vial"></i> Test Connection
                                        </>
                                    )}
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => handleSaveConnection(selectedTab)}
                                    disabled={isTesting || isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save"></i> Save & Connect
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                {dbType !== 'localStorage' && (
                                    <button className="btn btn-primary" onClick={handleDisconnect} disabled={isSaving}>
                                        <i className="fas fa-arrow-left"></i> Revert to LocalStorage
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Test Results Logger */}
            {testLog && (
                <div style={{ 
                    background: 'var(--bg-primary)', 
                    borderRadius: '12px', 
                    padding: '20px', 
                    border: '1px solid var(--border-color)',
                    marginBottom: '35px'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>CONNECTION DIAGNOSTICS LOG</h3>
                    <pre style={{
                        margin: 0,
                        padding: '15px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: testLog.includes('❌') ? '#ef4444' : testLog.includes('✅') ? '#10b981' : '#fff',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {testLog}
                    </pre>
                </div>
            )}

            {/* Supabase Schema SQL Setup Section */}
            <div style={{ 
                background: 'var(--bg-primary)', 
                borderRadius: '12px', 
                padding: '24px', 
                border: '1px solid var(--border-color)' 
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-file-code" style={{ color: 'var(--primary-color)', fontSize: '20px' }}></i>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>Supabase SQL Schema Setup</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Run this in your Supabase SQL Editor to create tables</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary" onClick={() => setShowSql(!showSql)}>
                            <i className={showSql ? 'fas fa-eye-slash' : 'fas fa-eye'}></i> {showSql ? 'Hide SQL Code' : 'Show SQL Code'}
                        </button>
                        {showSql && (
                            <button className="btn btn-outline" onClick={handleCopySQL}>
                                <i className="fas fa-copy"></i> Copy Script
                            </button>
                        )}
                    </div>
                </div>

                {showSql ? (
                    <div>
                        <div style={{ 
                            background: 'rgba(23, 133, 130, 0.1)', 
                            border: '1px solid rgba(23, 133, 130, 0.3)', 
                            padding: '15px', 
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            marginBottom: '15px',
                            lineHeight: '1.5'
                        }}>
                            <i className="fas fa-lightbulb" style={{ color: 'var(--primary-color)', marginRight: '8px' }}></i>
                            <strong>Quick Instructions:</strong> Open your new Supabase Project dashboard, go to <strong>SQL Editor</strong>, click <strong>New Query</strong>, paste the script below, and hit <strong>Run</strong>. Make sure RLS is configured as written below (policies allow simple CRUD operations for testing).
                        </div>
                        <pre style={{
                            margin: 0,
                            padding: '20px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            color: '#cbd5e1',
                            overflow: 'auto',
                            maxHeight: '400px',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {sqlScript}
                        </pre>
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                        SQL code contains 15 table declarations (users, tasks, transactions, etc.) with default Row-Level Security (RLS) policies. Click "Show SQL Code" to view or copy.
                    </p>
                )}
            </div>
        </div>
    );
}
