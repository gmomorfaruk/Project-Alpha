'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Storage from '@/lib/storage';
import Security from '@/lib/security';
import db from '@/lib/database';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Initialize default users if not exists in local storage
        initializeDefaultUsers();

        // Validate session on load
        const sessionCheck = Security.validateSession();
        if (sessionCheck.valid && sessionCheck.session) {
            const currentUser = Storage.get('currentUser');
            if (currentUser && currentUser.email === sessionCheck.session.email) {
                setUser(currentUser);
            } else {
                Security.destroySession();
            }
        }
        setLoading(false);
    }, []);

    const initializeDefaultUsers = () => {
        let users = Storage.get('users');
        if (!users || !Array.isArray(users)) {
            users = [];
        }
        
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
                createdAt: '2025-01-01T00:00:00.000Z'
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
                createdAt: '2025-01-01T00:00:00.000Z'
            }
        ];

        let updated = false;
        for (const defUser of defaultUsers) {
            if (!users.find((u: any) => u.id === defUser.id)) {
                users.push(defUser);
                updated = true;
            }
        }

        if (updated) {
            Storage.set('users', users);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            // Check default admin
            if (email === 'admin@demo.com' && password === 'admin123') {
                const adminData = {
                    id: 'admin1',
                    email: email,
                    name: 'Admin User',
                    role: 'admin',
                    isLoggedIn: true,
                    createdAt: new Date().toISOString()
                };
                setUser(adminData);
                Storage.set('currentUser', adminData);
                Security.createSession(adminData);
                Security.logSecurityEvent('login_success', { email, role: 'admin' });
                return { success: true, message: 'Login successful', role: 'admin' };
            }

            // Check default user
            if (email === 'user@demo.com' && password === 'demo123') {
                const userData = {
                    id: 'user1',
                    email: email,
                    name: 'Demo User',
                    phone: '01700000000',
                    role: 'user',
                    isLoggedIn: true,
                    balance: 5000,
                    points: 100,
                    membership: 'free',
                    referralCode: 'DEMO1234',
                    referrals: [],
                    createdAt: new Date().toISOString()
                };
                setUser(userData);
                Storage.set('currentUser', userData);
                Security.createSession(userData);
                Security.logSecurityEvent('login_success', { email, role: 'user' });
                return { success: true, message: 'Login successful', role: 'user' };
            }

            // Search in registered users
            let usersList = [];
            if (Storage.isCloudConnected()) {
                try {
                    const cloudUsers = await db.read('users', { email });
                    if (cloudUsers && cloudUsers.length > 0) {
                        usersList = cloudUsers;
                    } else {
                        usersList = Storage.get('users') || [];
                    }
                } catch {
                    usersList = Storage.get('users') || [];
                }
            } else {
                usersList = Storage.get('users') || [];
            }

            const matchedUser = usersList.find((u: any) => u.email === email);
            if (matchedUser) {
                if (matchedUser.password === password) {
                    const userData = { ...matchedUser, isLoggedIn: true };
                    setUser(userData);
                    Storage.set('currentUser', userData);
                    Security.createSession(userData);
                    Security.logSecurityEvent('login_success', { email, role: userData.role || 'user' });
                    return { success: true, message: 'Login successful', role: userData.role || 'user' };
                } else {
                    Security.logSecurityEvent('login_failed', { email, reason: 'wrong_password' });
                    return { success: false, message: 'Incorrect password' };
                }
            } else {
                Security.logSecurityEvent('login_failed', { email, reason: 'user_not_found' });
                return { success: false, message: 'No account found with this email' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred during login' };
        }
    };

    const signup = async (formData: any) => {
        try {
            const { email, fullName, phone, password, referralCode, role } = formData;
            let users = Storage.get('users') || [];

            if (Storage.isCloudConnected()) {
                const cloudUsers = await db.read('users', { email });
                if (cloudUsers && cloudUsers.length > 0) {
                    return { success: false, message: 'An account with this email already exists' };
                }
            }

            if (users.find((u: any) => u.email === email)) {
                return { success: false, message: 'An account with this email already exists' };
            }

            const newUser: any = {
                id: db.generateId(),
                fullName,
                name: fullName,
                phone,
                email,
                password,
                role: role || 'user',
                isLoggedIn: true,
                balance: 0,
                points: 0,
                totalInvested: 0,
                totalProfit: 0,
                referralEarnings: 0,
                referralCode: db.generateId().substring(0, 8).toUpperCase(),
                referredBy: referralCode || null,
                referrals: [],
                bkashNumber: '',
                nagadNumber: '',
                avatar: null,
                createdAt: new Date().toISOString()
            };

            // If referred, give welcome points and add to referrer's referrals list
            if (newUser.referredBy) {
                const referrerIndex = users.findIndex((u: any) => u.referralCode === newUser.referredBy);
                if (referrerIndex !== -1) {
                    if (!users[referrerIndex].referrals) {
                        users[referrerIndex].referrals = [];
                    }
                    users[referrerIndex].referrals.push({
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email,
                        joinedAt: newUser.createdAt,
                        earnings: 0
                    });
                    users[referrerIndex].points = (users[referrerIndex].points || 0) + 50; // Referral bonus points
                    newUser.points = 25; // Signup welcome bonus points
                }
            }

            users.push(newUser);
            Storage.set('users', users);
            setUser(newUser);
            Storage.set('currentUser', newUser);
            Security.createSession(newUser);
            Security.logSecurityEvent('signup_success', { email: newUser.email, userId: newUser.id });

            return { success: true, message: 'Account created successfully' };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'An error occurred during registration' };
        }
    };

    const logout = () => {
        Security.destroySession();
        setUser(null);
        router.push('/login');
    };

    const updateUserBalance = async (amount: number, type: 'add' | 'deduct') => {
        if (!user) return false;
        try {
            const users = Storage.get('users') || [];
            const index = users.findIndex((u: any) => u.id === user.id);
            if (index === -1) return false;

            let newBalance = user.balance || 0;
            if (type === 'add') {
                newBalance += amount;
            } else {
                newBalance = Math.max(0, newBalance - amount);
            }

            const updatedUser = { ...user, balance: newBalance };
            users[index] = updatedUser;
            
            Storage.set('users', users);
            setUser(updatedUser);
            Storage.set('currentUser', updatedUser);
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
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
