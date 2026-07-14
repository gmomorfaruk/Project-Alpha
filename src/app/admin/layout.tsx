'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import Storage from '@/lib/storage';
import Security from '@/lib/security';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { tText } = useTranslation();
    const { showToast } = useToast();
    const { theme } = useTheme();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    // PIN Gate states
    const [pinVerified, setPinVerified] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinAttempts, setPinAttempts] = useState(0);
    const [pinLocked, setPinLocked] = useState(false);
    const [pinLockTime, setPinLockTime] = useState(0);

    useEffect(() => {
        // Authenticate admin access
        const currentUser = Storage.get('currentUser');
        if (!currentUser || !currentUser.isLoggedIn) {
            router.replace('/login');
            showToast('Please log in first', 'error');
            return;
        }

        if (currentUser.role !== 'admin') {
            router.replace('/dashboard');
            showToast('Access denied: Administrator privileges required', 'error');
            Security.logSecurityEvent('admin_access_denied', { email: currentUser.email });
            return;
        }

        setAuthorized(true);

        // Check if PIN is already verified this session
        if (typeof window !== 'undefined') {
            const sessionPin = sessionStorage.getItem('adminPinVerified');
            const settings = Storage.get('settings');
            const requirePin = settings?.requirePinEveryVisit !== false;

            if (sessionPin === 'true' && !requirePin) {
                setPinVerified(true);
            } else if (sessionPin === 'true') {
                // Check if session is recent (within 30 minutes)
                const sessionTime = parseInt(sessionStorage.getItem('adminPinTime') || '0');
                if (Date.now() - sessionTime < 30 * 60 * 1000) {
                    setPinVerified(true);
                }
            }

            // Check lockout
            const lockUntil = parseInt(localStorage.getItem('adminPinLockUntil') || '0');
            if (Date.now() < lockUntil) {
                setPinLocked(true);
                setPinLockTime(Math.ceil((lockUntil - Date.now()) / 1000));
            }
        }
    }, [user, router]);

    // Lockout countdown timer
    useEffect(() => {
        if (pinLocked && pinLockTime > 0) {
            const timer = setTimeout(() => {
                setPinLockTime(pinLockTime - 1);
                if (pinLockTime <= 1) {
                    setPinLocked(false);
                    setPinAttempts(0);
                    localStorage.removeItem('adminPinLockUntil');
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [pinLocked, pinLockTime]);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pinLocked) return;

        const settings = Storage.get('settings');
        const correctPin = settings?.adminPin || '1234';

        if (pinInput === correctPin) {
            setPinVerified(true);
            setPinAttempts(0);
            sessionStorage.setItem('adminPinVerified', 'true');
            sessionStorage.setItem('adminPinTime', Date.now().toString());
            Security.logSecurityEvent('admin_pin_success', { timestamp: new Date().toISOString() });
            showToast('Access granted', 'success');
        } else {
            const newAttempts = pinAttempts + 1;
            setPinAttempts(newAttempts);
            setPinInput('');
            Security.logSecurityEvent('admin_pin_failed', { attempt: newAttempts });

            if (newAttempts >= 3) {
                const lockDuration = 30 * 60 * 1000; // 30 minutes
                const lockUntil = Date.now() + lockDuration;
                localStorage.setItem('adminPinLockUntil', lockUntil.toString());
                setPinLocked(true);
                setPinLockTime(30 * 60);
                showToast('Too many failed attempts! Admin panel locked for 30 minutes.', 'error');
            } else {
                showToast(`Incorrect PIN. ${3 - newAttempts} attempts remaining.`, 'error');
            }
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('adminPinVerified');
        sessionStorage.removeItem('adminPinTime');
        logout();
        router.replace('/login');
    };

    // Loading state
    if (!authorized) {
        return (
            <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0A1828', color: 'var(--text-primary, white)' }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', marginBottom: '15px', color: '#178582' }}></i>
                    <h3>Checking Authorization...</h3>
                </div>
            </div>
        );
    }

    // PIN Gate screen
    if (!pinVerified) {
        return (
            <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0A1828 0%, #0f2744 50%, #0A1828 100%)', color: 'var(--text-primary, white)' }}>
                <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '0 20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                        <i className="fas fa-shield-alt" style={{ fontSize: '32px', color: '#ef4444' }}></i>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Admin Security Gate</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '30px' }}>Enter your admin PIN to access the control panel</p>
                    
                    {pinLocked ? (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '25px' }}>
                            <i className="fas fa-lock" style={{ fontSize: '28px', color: '#ef4444', marginBottom: '15px', display: 'block' }}></i>
                            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#ef4444' }}>Panel Locked</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '15px' }}>Too many failed attempts. Try again later.</p>
                            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'monospace', color: '#ef4444' }}>
                                {Math.floor(pinLockTime / 60)}:{(pinLockTime % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handlePinSubmit}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                                <input
                                    type="password"
                                    value={pinInput}
                                    onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    placeholder="• • • •"
                                    autoFocus
                                    style={{
                                        width: '200px',
                                        padding: '16px 20px',
                                        fontSize: '24px',
                                        textAlign: 'center',
                                        letterSpacing: '8px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: pinAttempts > 0 ? '2px solid rgba(239, 68, 68, 0.5)' : '2px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'var(--text-primary, white)',
                                        outline: 'none',
                                        fontFamily: 'monospace'
                                    }}
                                />
                            </div>
                            {pinAttempts > 0 && (
                                <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '15px' }}>
                                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
                                    {3 - pinAttempts} attempts remaining before lockout
                                </p>
                            )}
                            <button type="submit" style={{
                                width: '200px',
                                padding: '14px',
                                background: 'linear-gradient(135deg, #178582, #0d5a58)',
                                color: 'var(--text-primary, white)',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}>
                                <i className="fas fa-unlock" style={{ marginRight: '8px' }}></i> Unlock
                            </button>
                        </form>
                    )}

                    <button onClick={() => router.push('/dashboard')} style={{ marginTop: '25px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px' }}>
                        <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const navItems = [
        { path: '/admin', name: 'Overview', icon: 'fa-tachometer-alt' },
        { path: '/admin/users', name: 'Users', icon: 'fa-users' },
        { path: '/admin/orders', name: 'Orders', icon: 'fa-shopping-cart' },
        { path: '/admin/transactions', name: 'Transactions', icon: 'fa-exchange-alt' },
        { path: '/admin/memberships', name: 'Memberships', icon: 'fa-crown' },
        { path: '/admin/products', name: 'Products', icon: 'fa-box' },
        { path: '/admin/tasks', name: 'Tasks', icon: 'fa-tasks' },
        { path: '/admin/proofs', name: 'Proofs', icon: 'fa-receipt' },
        { path: '/admin/database', name: 'Database', icon: 'fa-database' },
        { path: '/admin/settings', name: 'Settings', icon: 'fa-cog' }
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-secondary, #0b1524)', position: 'relative' }}>
            <style jsx global>{`
                :root {
                    --admin-sidebar-width: 260px;
                }
                .admin-sidebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    width: var(--admin-sidebar-width);
                    background: var(--bg-primary, #0f1c30);
                    border-right: 1px solid var(--border-color, #1e2d4a);
                    display: flex;
                    flex-direction: column;
                    z-index: 1001;
                    transition: transform 0.3s ease;
                }
                .admin-sidebar-header {
                    padding: 24px;
                    border-bottom: 1px solid var(--border-color, #1e2d4a);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .admin-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary, white);
                    text-decoration: none;
                }
                .admin-logo i {
                    color: var(--primary-color, #178582);
                }
                .admin-sidebar-nav {
                    flex: 1;
                    padding: 20px 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    overflow-y: auto;
                }
                .admin-nav-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 15px;
                    color: var(--text-secondary, #8fa0b5);
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: 500;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }
                .admin-nav-link:hover {
                    color: var(--text-primary, white);
                    background: rgba(255,255,255,0.03);
                }
                .admin-nav-link.active {
                    color: var(--text-primary, white);
                    background: var(--primary-gradient, linear-gradient(135deg, #178582, #0d5a58));
                }
                .admin-topbar {
                    position: fixed;
                    top: 0;
                    left: var(--admin-sidebar-width);
                    right: 0;
                    height: 70px;
                    background: var(--bg-primary, #0f1c30);
                    border-bottom: 1px solid var(--border-color, #1e2d4a);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 30px;
                    z-index: 1000;
                    transition: left 0.3s ease;
                }
                .admin-hamburger {
                    background: none;
                    border: none;
                    color: var(--text-primary, white);
                    font-size: 20px;
                    cursor: pointer;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                }
                .admin-sidebar-header .admin-hamburger {
                    color: var(--text-secondary, rgba(255, 255, 255, 0.7));
                }
                .admin-sidebar-header .admin-hamburger:hover {
                    color: var(--text-primary, white);
                }
                .admin-topbar-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .admin-user-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: var(--text-primary, white);
                }
                .admin-user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--primary-gradient);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-primary, white);
                    font-size: 14px;
                    font-weight: 700;
                }
                .admin-main-content {
                    margin-left: var(--admin-sidebar-width);
                    padding-top: 70px;
                    min-height: 100vh;
                    background: var(--bg-secondary, #0b1524);
                    transition: margin-left 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                .admin-content-inner {
                    padding: 30px;
                    flex: 1;
                }
                .admin-footer-btn {
                    padding: 12px 15px;
                    border-radius: 10px;
                    color: #ef4444;
                    background: none;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    font-size: 14px;
                    font-weight: 500;
                    text-align: left;
                }
                .admin-footer-btn:hover {
                    background: rgba(239, 68, 68, 0.05);
                }
                .admin-security-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 20px;
                    color: #10b981;
                    font-size: 11px;
                    font-weight: 600;
                }
                .admin-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 1000;
                    display: none;
                }
                .admin-overlay.active {
                    display: block;
                }
                @media (max-width: 992px) {
                    .admin-sidebar {
                        transform: translateX(-100%);
                    }
                    .admin-sidebar.active {
                        transform: translateX(0);
                    }
                    .admin-sidebar-header .admin-hamburger {
                        display: flex;
                    }
                    .admin-topbar {
                        left: 0;
                    }
                    .admin-topbar .admin-hamburger {
                        display: flex;
                    }
                    .admin-main-content {
                        margin-left: 0;
                    }
                }
            `}</style>

            {/* Mobile overlay */}
            <div className={`admin-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)} />

            {/* Sidebar Navigation */}
            <aside className={`admin-sidebar ${mobileMenuOpen ? 'active' : ''}`}>
                <div className="admin-sidebar-header">
                    <Link href="/admin" className="admin-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/new_logo.png" alt="SmartEarnBD Logo" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                        <img src={theme === 'dark' ? "/name_white.png" : "/name_transparent.png"} alt="SmartEarnBD" style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
                    </Link>
                    <button className="admin-hamburger" onClick={() => setMobileMenuOpen(false)}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <nav className="admin-sidebar-nav">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link 
                                key={item.path} 
                                href={item.path} 
                                className={`admin-nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <i className={`fas ${item.icon}`} style={{ width: '20px' }}></i>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                        <Link href="/dashboard" className="admin-nav-link" style={{ color: 'var(--primary-color)' }}>
                            <i className="fas fa-arrow-left" style={{ width: '20px' }}></i>
                            <span>Go to Website</span>
                        </Link>
                        <button className="admin-footer-btn" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt" style={{ width: '20px' }}></i>
                            <span>Log out</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Topbar */}
            <header className="admin-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="admin-hamburger" onClick={() => setMobileMenuOpen(true)}>
                        <i className="fas fa-bars"></i>
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ADMIN PANEL</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary, white)', fontWeight: 600 }}>System Control Center</span>
                    </div>
                </div>
                <div className="admin-topbar-right">
                    <div className="admin-security-badge">
                        <i className="fas fa-shield-alt"></i>
                        <span>Secured</span>
                    </div>
                    <div className="admin-user-info">
                        <span className="admin-user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'A'}
                        </span>
                        <span style={{ fontSize: '14px' }}>{user?.name || 'Administrator'}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="admin-main-content">
                <div className="admin-content-inner">
                    {children}
                </div>
            </main>
        </div>
    );
}
