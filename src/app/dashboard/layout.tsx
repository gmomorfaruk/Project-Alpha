'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const { lang, tText, tNum, toggleLang } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Handle close menus on click outside
    useEffect(() => {
        const handleOutsideClick = () => {
            setNotificationOpen(false);
        };
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    if (loading || !user) {
        return (
            <div className="page-loader" style={{ display: 'flex' }}>
                <div className="loader-content">
                    <div className="loader-spinner"></div>
                    <span>{tText("Loading...", "লোড হচ্ছে...")}</span>
                </div>
            </div>
        );
    }

    const toggleNotifications = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNotificationOpen(!notificationOpen);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return tText("Good Morning", "শুভ সকাল");
        if (hour < 17) return tText("Good Afternoon", "শুভ অপরাহ্ন");
        return tText("Good Evening", "শুভ সন্ধ্যা");
    };

    const navItems = [
        { href: '/dashboard', label: tText('Dashboard', 'ড্যাশবোর্ড'), icon: 'fa-home' },
        { href: '/dashboard/wallet', label: tText('Wallet', 'ওয়ালেট'), icon: 'fa-wallet' },
        { href: '/dashboard/products', label: tText('Packages', 'প্যাকেজ'), icon: 'fa-box' },
        { href: '/dashboard/investments', label: tText('Investments', 'বিনিয়োগ'), icon: 'fa-chart-line' },
        { href: '/dashboard/tasks', label: tText('Tasks', 'কাজ'), icon: 'fa-tasks' },
        { href: '/dashboard/referrals', label: tText('Referrals', 'রেফারেলস'), icon: 'fa-users' },
        { href: '/dashboard/membership', label: tText('Membership', 'মেম্বারশিপ'), icon: 'fa-crown' },
        { href: '/dashboard/sell-proofs', label: tText('Sell Proofs', 'বিক্রয় প্রমাণ'), icon: 'fa-receipt' }
    ];

    const mobileBottomItems = [
        { href: '/dashboard', label: tText('Dashboard', 'ড্যাশবোর্ড'), icon: 'fa-home' },
        { href: '/dashboard/wallet', label: tText('Wallet', 'ওয়ালেট'), icon: 'fa-wallet' },
        { href: '/dashboard/investments', label: tText('Investments', 'বিনিয়োগ'), icon: 'fa-chart-line' },
        { href: '/dashboard/tasks', label: tText('Tasks', 'কাজ'), icon: 'fa-tasks' },
        { href: '/dashboard/profile', label: tText('Profile', 'প্রোফাইল'), icon: 'fa-user' }
    ];

    return (
        <div className="dashboard-container">
            {/* Desktop Left Sidebar */}
            <aside className="sidebar-nav">
                <div className="sidebar-logo">
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={theme === 'dark' ? "/name_white.png" : "/name_transparent.png"} alt="SmartEarnBD" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
                    </Link>
                </div>
                
                <hr className="sidebar-divider" />
                
                <nav className="sidebar-menu">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                        >
                            <i className={`fas ${item.icon}`}></i>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <hr className="sidebar-divider" />
                
                <div className="sidebar-footer">
                    <Link
                        href="/dashboard/profile"
                        className={`sidebar-item ${pathname === '/dashboard/profile' ? 'active' : ''}`}
                    >
                        <i className="fas fa-cog"></i>
                        <span>{tText("Settings", "সেটিংস")}</span>
                    </Link>
                    
                    <button className="sidebar-item theme-switch-btn" onClick={toggleTheme}>
                        <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                        <span>{tText("Toggle Theme", "থিম পরিবর্তন")}</span>
                    </button>
                    
                    <button className="sidebar-item logout-btn" onClick={logout}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>{tText("Logout", "লগআউট")}</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Drawer Navigation Sidebar */}
            <div className={`mobile-sidebar-drawer ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                        <Link href="/dashboard" className="drawer-logo" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={theme === 'dark' ? "/name_white.png" : "/name_transparent.png"} alt="SmartEarnBD" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
                        </Link>
                        <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <hr className="sidebar-divider" />
                    
                    <nav className="drawer-menu">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <i className={`fas ${item.icon}`}></i>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <hr className="sidebar-divider" />
                    
                    <div className="drawer-footer">
                        <Link
                            href="/dashboard/profile"
                            className={`sidebar-item ${pathname === '/dashboard/profile' ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <i className="fas fa-cog"></i>
                            <span>{tText("Settings", "সেটিংস")}</span>
                        </Link>
                        <button className="sidebar-item logout-btn" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                            <i className="fas fa-sign-out-alt"></i>
                            <span>{tText("Logout", "লগআউট")}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Layout Area */}
            <div className="dashboard-main">
                {/* Top Navbar */}
                <header className="header-top">
                    <div className="header-left">
                        {/* Mobile hamburger menu toggle */}
                        <button className="mobile-hamburger" onClick={() => setMobileMenuOpen(true)}>
                            <i className="fas fa-bars"></i>
                        </button>

                        <div className="header-greeting-wrapper">
                            <span className="greeting-subtitle">{getGreeting()},</span>
                            <span className="greeting-title"> {user.name || user.fullName || 'User'}</span>
                            <span className="greeting-welcome"> 👋</span>
                        </div>
                    </div>

                    <div className="header-search">
                        <i className="fas fa-search search-icon"></i>
                        <input type="text" placeholder={tText("Search...", "অনুসন্ধান...")} className="search-input" />
                    </div>

                    <div className="header-right">
                        {/* Search icon triggers placeholder search in mobile view */}
                        <button className="header-icon-btn mobile-search-btn" title="Search">
                            <i className="fas fa-search"></i>
                        </button>

                        <button className="header-icon-btn" onClick={toggleTheme} title="Toggle Theme">
                            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                        </button>

                        <button className="header-icon-btn" onClick={toggleLang} title="Toggle Language">
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{lang.toUpperCase()}</span>
                        </button>

                        {/* Notifications Toggle */}
                        <div style={{ position: 'relative' }}>
                            <button className="header-icon-btn" onClick={toggleNotifications} title="Notifications">
                                <i className="fas fa-bell"></i>
                                {notifications.length > 0 && (
                                    <span className="notification-badge-dot"></span>
                                )}
                            </button>
                            
                            {/* Notifications Panel */}
                            <div className={`navbar-dropdown notification-panel ${notificationOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
                                <div className="notification-panel-header">
                                    <h4>{tText("Notifications", "বিজ্ঞপ্তি সমূহ")}</h4>
                                </div>
                                {notifications.length === 0 ? (
                                    <p className="no-notifications">{tText("No new notifications", "কোন নতুন বিজ্ঞপ্তি নেই")}</p>
                                ) : (
                                    <div className="notifications-list">
                                        {notifications.map((n, i) => (
                                            <div key={i} className="notification-list-item">
                                                <p>{n.message}</p>
                                                <span>{new Date(n.timestamp).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Avatar */}
                        <Link href="/dashboard/profile" className="header-user-avatar">
                            {user.avatar ? (
                                <img src={user.avatar} alt="avatar" />
                            ) : (
                                <i className="fas fa-user"></i>
                            )}
                        </Link>
                    </div>
                </header>

                {/* Dashboard Viewport Content */}
                <main className="dashboard-content">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="mobile-bottom-tabs">
                {mobileBottomItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`bottom-tab-item ${pathname === item.href ? 'active' : ''}`}
                    >
                        <i className={`fas ${item.icon}`}></i>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
