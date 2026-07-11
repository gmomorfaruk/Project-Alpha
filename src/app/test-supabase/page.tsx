'use client';

import React, { useState } from 'react';

export default function TestSupabasePage() {
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [statusClass, setStatusClass] = useState<'info' | 'success' | 'error'>('info');

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    };

    const testConnection = async () => {
        setLogs([]);
        setStatusClass('info');
        
        const cleanUrl = url.trim().replace(/\/$/, '');
        const cleanKey = key.trim();

        if (!cleanUrl || !cleanKey) {
            setStatusClass('error');
            setLogs(['❌ Please enter both URL and Key']);
            return;
        }

        addLog('⏳ Testing connection...\n');
        
        // Step 1: Validate URL format
        addLog('Step 1: Checking URL format...');
        try {
            const urlObj = new URL(cleanUrl);
            if (!urlObj.protocol.startsWith('http')) {
                setStatusClass('error');
                addLog('❌ Invalid URL format. Must start with http:// or https://');
                return;
            }
            addLog(`✅ URL format looks correct (${urlObj.hostname})`);
        } catch (e) {
            setStatusClass('error');
            addLog('❌ Invalid URL format. Should be: https://xxxxx.supabase.co');
            return;
        }
        
        // Step 2: Validate key format
        addLog('\nStep 2: Checking key format...');
        if (!cleanKey.startsWith('eyJ') && !cleanKey.startsWith('sb_')) {
            setStatusClass('error');
            addLog('❌ Invalid key format. Key should start with "eyJ..." or "sb_publishable_..."');
            return;
        }
        addLog('✅ Key format looks correct');
        
        // Step 3: Test REST API endpoint
        addLog('\nStep 3: Testing REST API connection...');
        try {
            const restUrl = `${cleanUrl}/rest/v1/`;
            addLog(`   Fetching: ${restUrl}`);
            
            const response = await fetch(restUrl, {
                method: 'GET',
                headers: {
                    'apikey': cleanKey,
                    'Authorization': `Bearer ${cleanKey}`
                }
            });
            
            addLog(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                addLog('✅ REST API connection successful!');
            } else {
                const text = await response.text();
                const isKeyTypeWarning = text.includes('service_role') || response.headers.get('sb-error-code') === 'UNAUTHORIZED_INVALID_API_KEY_TYPE';
                if (isKeyTypeWarning) {
                    addLog('✅ REST API gateway accepted key (root endpoint restricted to service_role).');
                } else {
                    addLog(`❌ REST API failed: ${text}`);
                    setStatusClass('error');
                    return;
                }
            }
        } catch (error: any) {
            addLog(`❌ Network error: ${error.message}`);
            setStatusClass('error');
            return;
        }
        
        // Step 4: Load Supabase library
        addLog('\nStep 4: Loading Supabase client library...');
        try {
            const win = window as any;
            if (!win.supabase) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                    script.onload = () => resolve();
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
                await new Promise(r => setTimeout(r, 500));
            }
            
            if (win.supabase && win.supabase.createClient) {
                addLog('✅ Supabase library loaded');
            } else {
                addLog('❌ Failed to load Supabase library');
                setStatusClass('error');
                return;
            }
        } catch (error: any) {
            addLog(`❌ Library load error: ${error.message}`);
            setStatusClass('error');
            return;
        }
        
        // Step 5: Create client and test
        addLog('\nStep 5: Creating Supabase client...');
        try {
            const win = window as any;
            const client = win.supabase.createClient(cleanUrl, cleanKey);
            addLog('✅ Client created');
            
            // Try a simple query
            addLog('\nStep 6: Testing database query...');
            const { data, error } = await client.from('users').select('id').limit(1);
            
            if (error) {
                if (error.message.includes('does not exist') || 
                    error.message.includes('relation') ||
                    error.code === '42P01') {
                    addLog('⚠️ Table "users" does not exist (this is OK - you need to create tables first)');
                    addLog('\n✅ CONNECTION SUCCESSFUL! Tables just need to be created.');
                    setStatusClass('success');
                } else if (error.message.includes('permission denied') || 
                           error.code === '42501') {
                    addLog('⚠️ Permission denied - Row Level Security (RLS) may be enabled');
                    addLog('   Go to Supabase → Authentication → Policies and add policies, or disable RLS');
                    addLog('\n✅ CONNECTION SUCCESSFUL! RLS just needs to be configured.');
                    setStatusClass('success');
                } else if (error.message.includes('JWT') || 
                           error.message.includes('Invalid API') ||
                           error.message.includes('Unauthorized')) {
                    addLog(`❌ Authentication error: ${error.message}`);
                    addLog('   Make sure you copied the full anon key from Settings → API');
                    setStatusClass('error');
                } else {
                    addLog(`❌ Query error: ${error.message}`);
                    addLog(`   Error code: ${error.code || 'N/A'}`);
                    setStatusClass('error');
                }
            } else {
                addLog('✅ Query successful!');
                addLog(`   Data returned: ${JSON.stringify(data)}`);
                addLog('\n🎉 FULLY CONNECTED! Database is ready.');
                setStatusClass('success');
            }
            
            if (statusClass === 'success' || !error) {
                addLog('\n--- NEXT STEPS ---');
                addLog('1. Save these credentials in Admin → Database Settings');
                addLog('2. Click "Show SQL" to get the table creation script');
                addLog('3. Run the SQL in your Supabase SQL Editor');
                addLog('4. Click "Sync Local Data to Cloud" to upload existing data');
            }
        } catch (error: any) {
            addLog(`❌ Client error: ${error.message}`);
            setStatusClass('error');
        }
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
            <h1 style={{ color: '#1f2937' }}>🔧 Supabase Connection Test</h1>
            <p>This page tests your Supabase connection directly.</p>
            
            <label style={{ fontWeight: 'bold', display: 'block', marginTop: '15px' }}>Supabase Project URL:</label>
            <input 
                type="text" 
                placeholder="https://xxxxx.supabase.co"
                value={url}
                onChange={e => setUrl(e.target.value)}
                style={{ padding: '10px', margin: '5px 0', width: '100%', boxSizing: 'border-box' }}
            />
            
            <label style={{ fontWeight: 'bold', display: 'block', marginTop: '15px' }}>Anon Public Key:</label>
            <input 
                type="text" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={e => setKey(e.target.value)}
                style={{ padding: '10px', margin: '5px 0', width: '100%', boxSizing: 'border-box' }}
            />
            
            <button 
                onClick={testConnection}
                style={{ 
                    background: '#10b981', 
                    color: 'white', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '10px', 
                    margin: '15px 0 5px 0', 
                    width: '100%', 
                    boxSizing: 'border-box',
                    fontWeight: 'bold'
                }}
            >
                🔌 Test Connection
            </button>
            
            <div 
                id="result" 
                style={{ 
                    padding: '20px', 
                    marginTop: '20px', 
                    borderRadius: '8px', 
                    whiteSpace: 'pre-wrap',
                    background: statusClass === 'success' ? '#d1fae5' : statusClass === 'error' ? '#fee2e2' : '#e0e7ff',
                    color: statusClass === 'success' ? '#065f46' : statusClass === 'error' ? '#991b1b' : '#3730a3',
                }}
            >
                {logs.length === 0 ? 'Enter your Supabase credentials above and click Test Connection.' : logs.join('\n')}
            </div>
        </div>
    );
}
