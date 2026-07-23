'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Storage from '@/lib/storage';
import Security from '@/lib/security';
import db from '@/lib/database';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    user: any;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: string }>;
    signup: (formData: any) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    updateUserBalance: (amount: number, type: 'add' | 'deduct') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Supabase helpers ──────────────────────────────────────────────────────────

import { serverSupabaseInsertUser } from '@/app/actions/auth';

/** Insert a new user row into Supabase `users` table. Returns true on success. */
async function supabaseInsertUser(userData: any): Promise<boolean> {
    try {
        const result = await serverSupabaseInsertUser(userData);
        if (!result.success) {
            console.warn('Supabase insert user error:', result.message);
            return false;
        }
        console.log('✅ User saved to Supabase via server action:', userData.email);
        return true;
    } catch (e) {
        console.warn('Supabase insert user exception:', e);
        return false;
    }
}

/** Fetch a user by email from Supabase. Returns the user object or null. */
async function supabaseFetchUser(email: string): Promise<any | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        if (error) {
            console.warn('Supabase fetch user error:', error.message);
            return null;
        }
        if (!data) return null;
        return {
            ...data,
            name: data.name || data.fullName || '',
            fullName: data.fullName || data.name || '',
            referralCode: data.referralCode || '',
            referredBy: data.referredBy || null,
            totalInvested: data.totalInvested || 0,
            totalProfit: data.totalProfit || 0,
            referralEarnings: data.referralEarnings || 0,
            createdAt: data.createdAt || '',
        };
    } catch (e) {
        console.warn('Supabase fetch user exception:', e);
        return null;
    }
}

/** Check if an email already exists in Supabase. */
async function supabaseEmailExists(email: string): Promise<boolean> {
    try {
        const { count, error } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('email', email);
        if (error) return false;
        return (count ?? 0) > 0;
    } catch {
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const syncAllDataFromCloud = async (currentUserId: string) => {
        try {
            console.log('🔄 Background syncing all data from Supabase...');
            const tablesToSync = [
                'users',
                'deposits',
                'withdrawals',
                'investments',
                'products',
                'transactions',
                'announcements',
                'settings',
                'chatMessages',
                'membershipRequests',
                'sellProofs',
                'tasks'
            ];

            // Run all queries concurrently for massive speed boost
            await Promise.allSettled(tablesToSync.map(async (table) => {
                try {
                    const dbTable = db.getTableName(table);
                    const { data, error } = await supabase.from(dbTable).select('*');
                    
                    if (!error && data && Array.isArray(data)) {
                        const mappedData = data.map((row: any) => {
                            const mapped: any = {};
                            for (const col in row) {
                                if (col === 'fullName') mapped.fullName = row[col];
                                else if (col === 'totalInvested') mapped.totalInvested = row[col];
                                else if (col === 'totalProfit') mapped.totalProfit = row[col];
                                else if (col === 'referralEarnings') mapped.referralEarnings = row[col];
                                else if (col === 'referralCode') mapped.referralCode = row[col];
                                else if (col === 'referredBy') mapped.referredBy = row[col];
                                else if (col === 'bkashNumber') mapped.bkashNumber = row[col];
                                else if (col === 'nagadNumber') mapped.nagadNumber = row[col];
                                else if (col === 'createdAt') mapped.createdAt = row[col];
                                else if (col === 'updatedAt') mapped.updatedAt = row[col];
                                else mapped[col] = row[col];
                            }
                            return mapped;
                        });
                        
                        // Merge with existing local data so offline-created items aren't lost
                        const rawLocal = localStorage.getItem('projectAlpha_' + table);
                        let localData: any[] = [];
                        try {
                            const parsed = JSON.parse(rawLocal || '[]');
                            localData = Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                            localData = [];
                        }
                        
                        const localMap = new Map(localData.map((item: any) => [item?.id || '', item]));
                        mappedData.forEach(item => {
                            if (item && item.id) {
                                localMap.set(item.id, item);
                            }
                        });
                        
                    } else if (error) {
                        if (!error.message.includes('Could not find the table') && !error.message.includes('schema cache')) {
                            console.warn(`⚠️ Background sync notice for ${table}:`, error.message);
                        }
                    }
                } catch (err) {
                    console.warn(`⚠️ Error processing table ${table}:`, err);
                }
            }));

            // Sync current user context
            if (currentUserId) {
                const localUsers = JSON.parse(localStorage.getItem('projectAlpha_users') || '[]');
                const freshUser = localUsers.find((u: any) => u.id === currentUserId);
                if (freshUser) {
                    setUser(freshUser);
                    localStorage.setItem('projectAlpha_currentUser', JSON.stringify(freshUser));
                }
            }
            console.log('✅ Background sync complete!');
        } catch (e) {
            console.warn('⚠️ Background sync failed:', e);
        }
    };

    useEffect(() => {
        initializeDefaultUsers();
        const sessionCheck = Security.validateSession();
        if (sessionCheck.valid && sessionCheck.session) {
            const currentUser = Storage.get('currentUser');
            if (currentUser && currentUser.email === sessionCheck.session.email) {
                setUser(currentUser);
                syncAllDataFromCloud(currentUser.id);
            } else {
                Security.destroySession();
            }
        } else {
            syncAllDataFromCloud('');
        }
        setLoading(false);
    }, []);

    const initializeDefaultUsers = () => {
        let users = Storage.get('users');
        if (!users || !Array.isArray(users)) users = [];

        const defaultUsers = [
            {
                id: 'admin1',
                email: 'admin@demo.com',
                name: 'Admin User',
                phone: '01700000001',
                role: 'admin',
                password: 'admin123',
                balance: 0,
                points: 0,
                isLoggedIn: false,
                createdAt: '2025-01-01T00:00:00.000Z',
            },
            {
                id: 'user1',
                email: 'user@demo.com',
                name: 'Demo User',
                phone: '01700000000',
                role: 'user',
                password: 'demo123',
                balance: 5000,
                points: 100,
                membership: 'free',
                referralCode: 'DEMO1234',
                referrals: [],
                bkashNumber: '',
                nagadNumber: '',
                status: 'active',
                isLoggedIn: false,
                createdAt: '2025-01-01T00:00:00.000Z',
            },
        ];

        let updated = false;
        for (const defUser of defaultUsers) {
            if (!users.find((u: any) => u.id === defUser.id)) {
                users.push(defUser);
                updated = true;
            }
        }
        if (updated) Storage.set('users', users);
    };

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    const login = async (email: string, password: string) => {
        try {
            // Hardcoded admin shortcut (no Supabase hit needed)
            if (email === 'admin@demo.com' && password === 'admin123') {
                const adminData = {
                    id: 'admin1', email, name: 'Admin User', role: 'admin',
                    isLoggedIn: true, createdAt: new Date().toISOString(),
                };
                setUser(adminData);
                Storage.set('currentUser', adminData);
                Security.createSession(adminData);
                return { success: true, message: 'Login successful', role: 'admin' };
            }

            // 1️⃣  Try Supabase first
            let matchedUser: any = await supabaseFetchUser(email);

            // 2️⃣  Fallback to localStorage
            if (!matchedUser) {
                const localUsers: any[] = Storage.get('users') || [];
                matchedUser = localUsers.find((u: any) => u.email === email) || null;
            }

            if (!matchedUser) {
                Security.logSecurityEvent('login_failed', { email, reason: 'user_not_found' });
                return { success: false, message: 'No account found with this email' };
            }

            if (matchedUser.password !== password) {
                Security.logSecurityEvent('login_failed', { email, reason: 'wrong_password' });
                return { success: false, message: 'Incorrect password' };
            }

            // Make sure local cache is updated
            const localUsers: any[] = Storage.get('users') || [];
            const localIdx = localUsers.findIndex((u: any) => u.email === email);
            const userData = { ...matchedUser, isLoggedIn: true };
            if (localIdx !== -1) {
                localUsers[localIdx] = { ...localUsers[localIdx], ...userData };
            } else {
                localUsers.push(userData);
            }
            Storage.set('users', localUsers);

            setUser(userData);
            Storage.set('currentUser', userData);
            Security.createSession(userData);
            Security.logSecurityEvent('login_success', { email, role: userData.role || 'user' });

            // Sync immediately after login
            syncAllDataFromCloud(userData.id);

            return { success: true, message: 'Login successful', role: userData.role || 'user' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred during login' };
        }
    };

    // ── SIGNUP ────────────────────────────────────────────────────────────────
    const signup = async (formData: any) => {
        try {
            const { email, fullName, phone, password, referralCode, role } = formData;

            // Check duplicate in Supabase
            const existsInCloud = await supabaseEmailExists(email);
            if (existsInCloud) {
                return { success: false, message: 'An account with this email already exists' };
            }

            // Check duplicate in localStorage (fallback)
            const localUsers: any[] = Storage.get('users') || [];
            if (localUsers.find((u: any) => u.email === email)) {
                return { success: false, message: 'An account with this email already exists' };
            }

            const settings = Storage.get('settings') || {};
            const signupBonus = Number(settings.signupBonus) || 0;

            const newUser: any = {
                id: db.generateId(),
                fullName,
                name: fullName,
                phone,
                email,
                password,
                role: role || 'user',
                isLoggedIn: true,
                balance: signupBonus,
                points: 0,
                totalInvested: 0,
                totalProfit: 0,
                referralEarnings: 0,
                referralCode: db.generateId().substring(0, 8).toUpperCase(),
                referredBy: referralCode || null,
                referrals: [],
                bkashNumber: '',
                nagadNumber: '',
                membership: 'free',
                status: 'active',
                avatar: null,
                createdAt: new Date().toISOString(),
            };

            // Handle referral bonus in local cache
            if (newUser.referredBy) {
                const referrerIndex = localUsers.findIndex(
                    (u: any) => u.referralCode === newUser.referredBy,
                );
                if (referrerIndex !== -1) {
                    if (!localUsers[referrerIndex].referrals) localUsers[referrerIndex].referrals = [];
                    localUsers[referrerIndex].referrals.push({
                        id: newUser.id, name: newUser.name, email: newUser.email,
                        joinedAt: newUser.createdAt, earnings: 0,
                    });
                    localUsers[referrerIndex].points = (localUsers[referrerIndex].points || 0) + 50;
                    newUser.points = 25;

                    // Update referrer in Supabase too
                    supabaseInsertUser(localUsers[referrerIndex]);
                }
            }

            // 1️⃣  Save to Supabase (primary)
            const savedToCloud = await supabaseInsertUser(newUser);
            if (!savedToCloud) {
                console.warn('⚠️ Supabase save failed — saving to localStorage only');
            }

            // 2️⃣  Always save to localStorage too (works offline / as cache)
            localUsers.push(newUser);
            Storage.set('users', localUsers);

            setUser(newUser);
            Storage.set('currentUser', newUser);
            Security.createSession(newUser);
            Security.logSecurityEvent('signup_success', { email: newUser.email, userId: newUser.id });

            // Sync immediately after signup
            syncAllDataFromCloud(newUser.id);

            return {
                success: true,
                message: savedToCloud
                    ? 'Account created successfully!'
                    : 'Account created (offline mode — will sync when reconnected)',
            };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'An error occurred during registration' };
        }
    };

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    const logout = () => {
        Security.destroySession();
        setUser(null);
        router.push('/login');
    };

    // ── UPDATE BALANCE ────────────────────────────────────────────────────────
    const updateUserBalance = async (amount: number, type: 'add' | 'deduct') => {
        if (!user) return false;
        try {
            const users = Storage.get('users') || [];
            const index = users.findIndex((u: any) => u.id === user.id);
            if (index === -1) return false;

            let newBalance = user.balance || 0;
            newBalance = type === 'add'
                ? newBalance + amount
                : Math.max(0, newBalance - amount);

            const updatedUser = { ...user, balance: newBalance };
            users[index] = updatedUser;

            Storage.set('users', users);
            setUser(updatedUser);
            Storage.set('currentUser', updatedUser);

            // Sync balance change to Supabase in background
            supabase.from('users').update({ balance: newBalance }).eq('id', user.id)
                .then(({ error }) => {
                    if (error) console.warn('Balance sync to Supabase failed:', error.message);
                });

            return true;
        } catch (error) {
            console.error('Error updating balance:', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signup, logout, updateUserBalance }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
