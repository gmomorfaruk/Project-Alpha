'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const { lang, tText, tNum, toggleLang } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { showToast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('PWA Service Worker registered:', reg.scope))
                .catch(err => console.warn('PWA Service Worker registration failed:', err));
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the PWA install prompt');
                } else {
                    console.log('User dismissed the PWA install prompt');
                }
                setDeferredPrompt(null);
            });
        } else {
            showToast(
                tText(
                    "To install: Open in Chrome/Edge, click the browser menu (⋮) -> 'Add to Home screen' or 'Install app'. On iPhone, use Safari -> Share button -> 'Add to Home Screen'.",
                    "ইনস্টল করতে: Chrome/Edge ব্রাউজারে খুলুন, ব্রাউজার মেনু (⋮) -> 'Add to Home screen' বা 'Install app' এ চাপুন। আইফোনে Safari ব্রাউজার -> Share বাটন -> 'Add to Home Screen' এ চাপুন।"
                ),
                "info"
            );
        }
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Handle close menus on click outside
    useEffect(() => {
        const handleOutsideClick = (e: Event) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchExpanded(false);
            }
            setNotificationOpen(false);
            setDesktopMenuOpen(false);
        };
        window.addEventListener('click', handleOutsideClick);
        
        // Load settings for social links
        setSettings(Storage.get('settings') || {});
        
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    // Focus search input when expanded
    useEffect(() => {
        if (searchExpanded && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchExpanded]);

    if (loading || !user) {
        return (
            <div className="page-loader" style={{ display: 'flex' }}>
                <div className="loader-content">
                    <div className="logo-loader-wrapper">
                        <div className="logo-loader-pulse"></div>
                        <div className="logo-loader-ring"></div>
                        <img src={theme === 'dark' ? "/name_white.png" : "/name_transparent.png"} alt="SmartEarnBD" className="logo-loader-img" />
                    </div>
                    <div className="logo-loader-progress-track">
                        <div className="logo-loader-progress-bar"></div>
                    </div>
                    <span className="logo-loader-text">{tText("SmartEarnBD", "স্মার্টআর্নবিডি")}</span>
                </div>
            </div>
        );
    }

    const toggleNotifications = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNotificationOpen(!notificationOpen);
    };

    const toggleDesktopMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDesktopMenuOpen(!desktopMenuOpen);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return tText("Good Morning", "শুভ সকাল");
        if (hour < 17) return tText("Good Afternoon", "শুভ অপরাহ্ন");
        return tText("Good Evening", "শুভ সন্ধ্যা");
    };

    const coreNavItems = [
        { href: '/dashboard', label: tText('Dashboard', 'ড্যাশবোর্ড'), icon: 'fa-home' },
        { href: '/dashboard/wallet', label: tText('Wallet', 'ওয়ালেট'), icon: 'fa-wallet' },
        { href: '/dashboard/products', label: tText('Products', 'পণ্য'), icon: 'fa-box' },
        { href: '/dashboard/investments', label: tText('Investments', 'বিনিয়োগ'), icon: 'fa-chart-line' },
        { href: '/dashboard/tasks', label: tText('Tasks', 'কাজ'), icon: 'fa-tasks' }
    ];

    const drawerItems: any[] = [
        { href: '/dashboard/referrals', label: tText('Referrals', 'রেফারেলস'), icon: 'fa-users' },
        { href: '/dashboard/membership', label: tText('Membership', 'মেম্বারশিপ'), icon: 'fa-crown' },
        { href: '/dashboard/sell-proofs', label: tText('Sell Proofs', 'বিক্রয় প্রমাণ'), icon: 'fa-receipt' },
        { href: '/dashboard/profile', label: tText('Settings', 'সেটিংস'), icon: 'fa-cog' }
    ];

    if (settings?.telegramLink) {
        drawerItems.push({ href: settings.telegramLink, label: tText('Telegram Group', 'টেলিগ্রাম গ্রুপ'), icon: 'fab fa-telegram', external: true });
    }
    
    if (settings?.whatsappLink) {
        drawerItems.push({ href: settings.whatsappLink, label: tText('WhatsApp Group', 'হোয়াটসঅ্যাপ গ্রুপ'), icon: 'fab fa-whatsapp', external: true });
    }

    // For mobile menu drawer
    const navItems = [
        ...coreNavItems,
        ...drawerItems
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
            {/* Desktop Slide-out Drawer */}
            <div className={`desktop-menu-drawer ${desktopMenuOpen ? 'active' : ''}`} onClick={() => setDesktopMenuOpen(false)}>
                <div className="drawer-content-right" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{tText("Menu", "মেনু")}</h4>
                        <button className="drawer-close-btn" onClick={() => setDesktopMenuOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <hr className="sidebar-divider" />
                    
                    <nav className="drawer-menu">
                        {drawerItems.map((item: any) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                target={item.external ? "_blank" : undefined}
                                className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                                onClick={() => setDesktopMenuOpen(false)}
                            >
                                <i className={item.icon.includes('fab') ? item.icon : `fas ${item.icon}`}></i>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <hr className="sidebar-divider" />
                    
                    <div className="drawer-footer">
                        <a 
                            href="#" 
                            onClick={handleInstallClick}
                            className="sidebar-item" 
                            style={{ 
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                color: '#10b981',
                                fontWeight: 'bold'
                            }}
                        >
                            <i className="fab fa-android"></i>
                            <span>{tText('Download App', 'অ্যাপ ডাউনলোড')}</span>
                        </a>
                        <button className="sidebar-item logout-btn" onClick={() => { logout(); setDesktopMenuOpen(false); }}>
                            <i className="fas fa-sign-out-alt"></i>
                            <span>{tText("Logout", "লগআউট")}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer Navigation Sidebar */}
            <div className={`mobile-sidebar-drawer ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                        <Link href="/dashboard" className="drawer-logo" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={theme === 'dark' ? "/name_white.png" : "/name_transparent.png"} alt="SmartEarnBD" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                        </Link>
                        <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <hr className="sidebar-divider" />
                    
                    <nav className="drawer-menu">
                        {navItems.map((item: any) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                target={item.external ? "_blank" : undefined}
                                className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <i className={item.icon.includes('fab') ? item.icon : `fas ${item.icon}`}></i>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <hr className="sidebar-divider" />
                    
                    <div className="drawer-footer">
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="sidebar-item" onClick={toggleTheme} style={{ flex: 1, justifyContent: 'center' }}>
                                <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                            </button>
                            <button className="sidebar-item" onClick={toggleLang} style={{ flex: 1, justifyContent: 'center' }}>
                                <i className="fas fa-language"></i>
                                <span>{lang.toUpperCase()}</span>
                            </button>
                        </div>
                        <Link
                            href="/dashboard/profile"
                            className={`sidebar-item ${pathname === '/dashboard/profile' ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <i className="fas fa-cog"></i>
                            <span>{tText("Settings", "সেটিংস")}</span>
                        </Link>
                        <a 
                            href="#" 
                            onClick={handleInstallClick}
                            className="sidebar-item" 
                            style={{ 
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                color: '#10b981',
                                fontWeight: 'bold'
                            }}
                        >
                            <i className="fab fa-android"></i>
                            <span>{tText('Download App', 'অ্যাপ ডাউনলোড')}</span>
                        </a>
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
                    {/* Row 1: Logo + Core links, Search Bar (desktop), Utilities (desktop), Utilities (mobile) */}
                    <div className="header-row-main">
                        <div className="header-left">
                            {/* Mobile hamburger menu toggle */}
                            <button className="mobile-hamburger" onClick={() => setMobileMenuOpen(true)}>
                                <i className="fas fa-bars"></i>
                            </button>

                            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img src={theme === 'dark' ? "/name_white.png" : "/name_transparent.png"} alt="SmartEarnBD" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                            </Link>

                            {/* Core navigation links - desktop only */}
                            <nav className="header-menu">
                                {coreNavItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`header-menu-item ${pathname === item.href ? 'active' : ''}`}
                                    >
                                        <i className={`fas ${item.icon}`}></i>
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Desktop utilities (Theme, Lang, Notifications, Menu) */}
                        <div className="header-utilities desktop-only-utilities">
                            {/* Search Bar - desktop only */}
                            <div 
                                ref={searchRef}
                                className={`header-search ${searchExpanded ? 'expanded' : ''}`}
                            >
                                <button 
                                    className="search-toggle-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchExpanded(!searchExpanded);
                                    }}
                                    title={tText("Search", "অনুসন্ধান")}
                                >
                                    <i className="fas fa-search"></i>
                                </button>
                                <input 
                                    ref={searchInputRef}
                                    type="text" 
                                    placeholder={tText("Search...", "অনুসন্ধান...")} 
                                    className="search-input" 
                                />
                            </div>

                            <button className="header-icon-btn" onClick={toggleTheme} title="Toggle Theme">
                                <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                            </button>

                            <button className="header-icon-btn" onClick={toggleLang} title="Toggle Language">
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{lang.toUpperCase()}</span>
                            </button>

                            <div style={{ position: 'relative' }}>
                                <button className="header-icon-btn" onClick={toggleNotifications} title="Notifications">
                                    <i className="fas fa-bell"></i>
                                    {notifications.length > 0 && (
                                        <span className="notification-badge-dot"></span>
                                    )}
                                </button>
                                
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

                            <Link href="/dashboard/profile" className="header-user-avatar desktop-avatar-btn" style={{ marginLeft: '12px', marginRight: '8px' }} title={tText("Profile", "প্রোফাইল")}>
                                {user.avatar ? (
                                    <img src={user.avatar} alt="avatar" />
                                ) : (
                                    <i className="fas fa-user"></i>
                                )}
                            </Link>

                            <button className="header-icon-btn hamburger-menu-btn" onClick={toggleDesktopMenu} title="Menu">
                                <i className="fas fa-bars"></i>
                            </button>
                        </div>

                        {/* Mobile-only utilities (Theme, Lang, Notifications, Avatar) */}
                        <div className="header-right mobile-only-utilities">
                            <button className="header-icon-btn mobile-search-btn" title="Search">
                                <i className="fas fa-search"></i>
                            </button>

                            <div style={{ position: 'relative' }}>
                                <button className="header-icon-btn" onClick={toggleNotifications} title="Notifications">
                                    <i className="fas fa-bell"></i>
                                    {notifications.length > 0 && (
                                        <span className="notification-badge-dot"></span>
                                    )}
                                </button>
                                
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

                            <Link href="/dashboard/profile" className="header-user-avatar">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="avatar" />
                                ) : (
                                    <i className="fas fa-user"></i>
                                )}
                            </Link>
                        </div>
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
