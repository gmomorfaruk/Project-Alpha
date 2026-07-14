'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCart } from '@/context/CartContext';
import Storage from '@/lib/storage';
import { defaultProducts as defaultProductsList } from '@/lib/products';

// Define the Product interface matching the system
interface Product {
    id: any;
    name: string;
    category: string;
    price: number;
    profitPercentage: number;
    selfSellProfit?: number;
    duration: number;
    stock: number;
    image?: string;
    isActive?: boolean;
    hasOffer?: boolean;
    offerText?: string;
}

const sampleProducts: Product[] = [
    {
        id: 1,
        name: 'Smartphone Package',
        category: 'mobile',
        price: 5000,
        profitPercentage: 12,
        selfSellProfit: 15,
        duration: 30,
        stock: 50,
        image: 'fa-mobile-alt',
        isActive: true,
        hasOffer: true,
        offerText: '20% OFF'
    },
    {
        id: 2,
        name: 'Laptop Package',
        category: 'computer',
        price: 15000,
        profitPercentage: 18,
        selfSellProfit: 22,
        duration: 45,
        stock: 25,
        image: 'fa-laptop',
        isActive: true,
        hasOffer: true,
        offerText: 'Special'
    },
    {
        id: 3,
        name: 'Electronics Package',
        category: 'electronics',
        price: 10000,
        profitPercentage: 15,
        selfSellProfit: 18,
        duration: 30,
        stock: 40,
        image: 'fa-tv',
        isActive: true,
        hasOffer: false
    },
    {
        id: 4,
        name: 'Smart Watch Bundle',
        category: 'accessories',
        price: 3000,
        profitPercentage: 10,
        selfSellProfit: 13,
        duration: 20,
        stock: 100,
        image: 'fa-clock',
        isActive: true,
        hasOffer: false
    },
    {
        id: 5,
        name: 'Gaming Console Pack',
        category: 'electronics',
        price: 20000,
        profitPercentage: 20,
        selfSellProfit: 25,
        duration: 60,
        stock: 15,
        image: 'fa-gamepad',
        isActive: true,
        hasOffer: true,
        offerText: 'Hot Deal'
    },
    {
        id: 6,
        name: 'Tablet Package',
        category: 'mobile',
        price: 8000,
        profitPercentage: 14,
        selfSellProfit: 17,
        duration: 35,
        stock: 30,
        image: 'fa-tablet-alt',
        isActive: true,
        hasOffer: false
    }
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { lang, t, tText, tNum, toggleLang } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const { showToast } = useToast();
    const ecommerceCart = useCart();
    const isBuyerStyleCart = !user || user.role === 'buyer';

    // Scroll state
    const [scrolled, setScrolled] = useState(false);

    // Dynamic state
    const [wishlistCount, setWishlistCount] = useState(0);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
    const [cartItems, setCartItems] = useState<Product[]>([]);

    // UI interactive states
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [wishlistOpen, setWishlistOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [drawerCategoriesOpen, setDrawerCategoriesOpen] = useState(false);
    const [drawerSupportOpen, setDrawerSupportOpen] = useState(false);
    const [drawerWishlistOpen, setDrawerWishlistOpen] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);

    // Search query state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);

    // Ref pointers to close dropdowns when clicking outside
    const categoriesRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const wishlistRef = useRef<HTMLDivElement>(null);
    const cartRef = useRef<HTMLDivElement>(null);
    const contactRef = useRef<HTMLDivElement>(null);

    // Update scrolled state on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 30) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getSystemProducts = (): Product[] => {
        if (typeof window === 'undefined') return [];
        const list = Storage.get('products') || defaultProductsList;
        return list.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            profitPercentage: p.returnRate,
            selfSellProfit: Math.round(p.returnRate * 1.25),
            duration: p.duration,
            stock: p.stock,
            image: p.image || 'fa-box',
            isActive: p.active,
            hasOffer: p.hasOffer || !!(p.previousPrice && p.previousPrice > p.price),
            offerText: p.offerText || (p.previousPrice && p.previousPrice > p.price ? `${Math.round(((p.previousPrice - p.price) / p.previousPrice) * 100)}% OFF` : '')
        }));
    };

    // Load wishlist & cart from localStorage
    const loadWishlistAndCart = () => {
        try {
            const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const sysProducts = getSystemProducts();
            
            // Map IDs back to full products
            const fullWishlist = sysProducts.filter(p => wishlist.map(String).includes(String(p.id)));
            const fullCart = sysProducts.filter(p => cart.map((item: any) => {
                if (typeof item === 'object' && item !== null && item.product) {
                    return String(item.product.id);
                }
                return String(item);
            }).includes(String(p.id)));

            setWishlistItems(fullWishlist);
            setWishlistCount(fullWishlist.length);
            
            setCartItems(fullCart);
            setCartCount(fullCart.length);
        } catch (e) {
            console.error('Error loading local storage values:', e);
        }
    };

    useEffect(() => {
        loadWishlistAndCart();

        // Listen for custom events
        const updateListener = () => {
            loadWishlistAndCart();
        };

        window.addEventListener('wishlist-updated', updateListener);
        window.addEventListener('cart-updated', updateListener);
        window.addEventListener('storage', updateListener);

        return () => {
            window.removeEventListener('wishlist-updated', updateListener);
            window.removeEventListener('cart-updated', updateListener);
            window.removeEventListener('storage', updateListener);
        };
    }, []);

    // Handle outside clicks to close interactive overlays
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (categoriesRef.current && !categoriesRef.current.contains(target)) {
                setCategoriesOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(target)) {
                setProfileOpen(false);
            }
            if (wishlistRef.current && !wishlistRef.current.contains(target)) {
                setWishlistOpen(false);
            }
            if (cartRef.current && !cartRef.current.contains(target)) {
                setCartOpen(false);
            }
            if (contactRef.current && !contactRef.current.contains(target)) {
                setContactOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Perform live search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            return;
        }
        const sysProducts = getSystemProducts();
        const filtered = sysProducts.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
    }, [searchQuery]);

    // Handle item add/remove actions
    const toggleWishlistItem = (id: any, name: string) => {
        try {
            const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            const stringId = String(id);
            let nextWishlist = [];
            if (wishlist.map(String).includes(stringId)) {
                nextWishlist = wishlist.filter((item: any) => String(item) !== stringId);
                showToast(lang === 'bn' ? `${name} পছন্দের তালিকা থেকে সরানো হয়েছে` : `${name} removed from wishlist`, 'info');
            } else {
                nextWishlist = [...wishlist, stringId];
                showToast(lang === 'bn' ? `${name} পছন্দের তালিকায় যোগ করা হয়েছে` : `${name} added to wishlist`, 'success');
            }
            localStorage.setItem('wishlist', JSON.stringify(nextWishlist));
            window.dispatchEvent(new Event('wishlist-updated'));
        } catch (e) {
            console.error(e);
        }
    };

    const handleRemoveFromCart = (id: any, name: string) => {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const stringId = String(id);
            const nextCart = cart.filter((item: any) => {
                if (typeof item === 'object' && item !== null && item.product) {
                    return String(item.product.id) !== stringId;
                }
                return String(item) !== stringId;
            });
            localStorage.setItem('cart', JSON.stringify(nextCart));
            showToast(lang === 'bn' ? `${name} কার্ট থেকে সরানো হয়েছে` : `${name} removed from cart`, 'info');
            window.dispatchEvent(new Event('cart-updated'));
        } catch (e) {
            console.error(e);
        }
    };

    // Quick investment checkout simulation from cart
    const handleInvestFromNavbar = (product: Product) => {
        if (!isAuthenticated) {
            showToast(lang === 'bn' ? 'দয়া করে বিনিয়োগ করতে প্রথমে লগইন করুন।' : 'Please login first to invest.', 'error');
            router.push('/login');
            setCartOpen(false);
            return;
        }

        // Check user balance
        if (user.balance < product.price) {
            showToast(
                lang === 'bn' 
                    ? `অপর্যাপ্ত ব্যালেন্স! আপনার ৳${product.price} প্রয়োজন কিন্তু আছে ৳${user.balance}` 
                    : `Insufficient balance! You need ৳${product.price} but have ৳${user.balance}`, 
                'error'
            );
            router.push('/dashboard/wallet');
            setCartOpen(false);
            return;
        }

        // Mock purchase process
        try {
            // Update local storage balance
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const updatedUsers = users.map((u: any) => {
                if (u.id === user.id) {
                    u.balance = u.balance - product.price;
                    // Add investment record
                    const activeInvestments = u.activeInvestments || [];
                    activeInvestments.push({
                        id: 'inv_' + Math.random().toString(36).substr(2, 9),
                        productId: product.id,
                        productName: product.name,
                        amount: product.price,
                        profitPercentage: product.profitPercentage,
                        duration: product.duration,
                        daysLeft: product.duration,
                        status: 'active',
                        startDate: new Date().toISOString()
                    });
                    u.activeInvestments = activeInvestments;
                    return u;
                }
                return u;
            });
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            // Update current session user balance
            const updatedUser = { ...user, balance: user.balance - product.price };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            // Remove from cart
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const nextCart = cart.filter((itemId: number) => itemId !== product.id);
            localStorage.setItem('cart', JSON.stringify(nextCart));
            
            // Dispatch update events to reload state
            window.dispatchEvent(new Event('cart-updated'));
            // Dispatch custom user session update so dashboard or layout picks it up
            window.dispatchEvent(new Event('user-session-updated'));

            showToast(
                lang === 'bn' 
                    ? `${product.name} এ সফলভাবে বিনিয়োগ সম্পন্ন হয়েছে!` 
                    : `Successfully invested in ${product.name}!`, 
                'success'
            );

            // Close cart overlay
            setCartOpen(false);

            // Redirect user to investments tab
            router.push('/dashboard/investments');
        } catch (e) {
            console.error(e);
            showToast('Something went wrong. Please try again.', 'error');
        }
    };

    const handleCategoryClick = (categoryName: string) => {
        setCategoriesOpen(false);
        router.push(`/products?category=${categoryName}`);
    };

    return (
        <>
            <div className="navbar-floating-wrapper">
                <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                    <div className="navbar-logo-wrapper">
                        <Link href="/" className="flex items-center gap-2 group cursor-pointer" style={{ textDecoration: 'none' }}>
                            <div className="relative transform group-hover:scale-105 transition-transform duration-300 flex items-center gap-2">
                                <img src="/name_transparent.png" alt="SmartEarnBD" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} className="select-none navbar-logo-light" />
                                <img src="/name_white.png" alt="SmartEarnBD" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} className="select-none navbar-logo-dark" />
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Center Navigation Links */}
                    <div className="nav-links-pill">
                        {/* Home Link */}
                        <Link 
                            href="/" 
                            className={pathname === '/' ? 'nav-link-pill-active' : 'nav-link-pill-inactive'}
                        >
                            <i className="fas fa-home"></i>
                            <span>{tText('Home', 'হোম')}</span>
                        </Link>

                        {/* Categories Link with Dropdown */}
                        <div className="relative" ref={categoriesRef}>
                            <button 
                                onClick={() => setCategoriesOpen(!categoriesOpen)}
                                className={pathname?.startsWith('/products') ? 'nav-link-pill-active' : 'nav-link-pill-inactive'}
                            >
                                <i className="fas fa-th-large"></i>
                                <span>{tText('Categories', 'ক্যাটাগরি')}</span>
                                <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} style={{ marginLeft: '2px' }}></i>
                            </button>

                            {categoriesOpen && (
                                <div className="navbar-dropdown categories-dropdown">
                                    <div className="navbar-dropdown-header">{tText('Select Category', 'ক্যাটাগরি নির্বাচন করুন')}</div>
                                    <div className="navbar-dropdown-item" onClick={() => handleCategoryClick('mobile')}>
                                        <i className="fas fa-mobile-alt text-emerald-500"></i>
                                        <span>{tText('Mobile Packages', 'মোবাইল প্যাকেজ')}</span>
                                    </div>
                                    <div className="navbar-dropdown-item" onClick={() => handleCategoryClick('computer')}>
                                        <i className="fas fa-laptop text-emerald-500"></i>
                                        <span>{tText('Laptop Packages', 'ল্যাপটপ প্যাকেজ')}</span>
                                    </div>
                                    <div className="navbar-dropdown-item" onClick={() => handleCategoryClick('electronics')}>
                                        <i className="fas fa-tv text-emerald-500"></i>
                                        <span>{tText('Electronics Packages', 'ইলেকট্রনিক্স প্যাকেজ')}</span>
                                    </div>
                                    <div className="navbar-dropdown-item" onClick={() => handleCategoryClick('accessories')}>
                                        <i className="fas fa-clock text-emerald-500"></i>
                                        <span>{tText('Accessories', 'এক্সেসরিজ')}</span>
                                    </div>
                                </div>
                            )}
                        </div>



                        {/* About Us Link */}
                        <Link 
                            href="/about" 
                            className={pathname === '/about' ? 'nav-link-pill-active' : 'nav-link-pill-inactive'}
                        >
                            <i className="fas fa-shield-alt"></i>
                            <span>{tText('About Us', 'আমাদের সম্পর্কে')}</span>
                        </Link>

                        {/* Contact Link with Dropdown details */}
                        <div className="relative" ref={contactRef}>
                            <button 
                                onClick={() => setContactOpen(!contactOpen)}
                                className={contactOpen ? 'nav-link-pill-active' : 'nav-link-pill-inactive'}
                            >
                                <i className="fas fa-phone"></i>
                                <span>{tText('Contact', 'যোগাযোগ')}</span>
                            </button>

                            {contactOpen && (
                                <div className="navbar-dropdown w-64">
                                    <div className="navbar-dropdown-header">{tText('24/7 Support Desk', '২৪/৭ সাপোর্ট ডেস্ক')}</div>
                                    <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="navbar-dropdown-item no-underline">
                                        <i className="fab fa-whatsapp text-green-500 text-lg"></i>
                                        <div>
                                            <div className="font-semibold text-slate-800 dark:text-white">WhatsApp</div>
                                            <div className="text-xs text-slate-400">Message Support Team</div>
                                        </div>
                                    </a>
                                    <a href="https://t.me/smartearnbd" target="_blank" rel="noopener noreferrer" className="navbar-dropdown-item no-underline">
                                        <i className="fab fa-telegram text-blue-500 text-lg"></i>
                                        <div>
                                            <div className="font-semibold text-slate-800 dark:text-white">Telegram Channel</div>
                                            <div className="text-xs text-slate-400">Daily Updates & News</div>
                                        </div>
                                    </a>
                                    <a href="mailto:support@smartearnbd.com" className="navbar-dropdown-item no-underline">
                                        <i className="fas fa-envelope text-red-400"></i>
                                        <div>
                                            <div className="font-semibold text-slate-800 dark:text-white">Email Support</div>
                                            <div className="text-xs text-slate-400">support@smartearnbd.com</div>
                                        </div>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Action Icons Panel */}
                    <div className="navbar-actions-wrapper">
                        {/* Search Icon */}
                        <button 
                            onClick={() => setSearchOpen(true)}
                            className="navbar-action-btn"
                            title={tText('Search', 'অনুসন্ধান')}
                        >
                            <i className="fas fa-search"></i>
                        </button>

                        {/* Wishlist Icon */}
                        <div className="relative" ref={wishlistRef}>
                            <button 
                                onClick={() => setWishlistOpen(!wishlistOpen)}
                                className="navbar-action-btn"
                                title={tText('Wishlist', 'পছন্দের তালিকা')}
                            >
                                <i className="fas fa-heart"></i>
                                {wishlistCount > 0 && (
                                    <span className="navbar-badge badge-red">{tNum(wishlistCount)}</span>
                                )}
                            </button>

                            {wishlistOpen && (
                                <div className="navbar-dropdown w-72">
                                    <div className="navbar-dropdown-header">{tText('My Wishlist', 'আমার পছন্দের তালিকা')}</div>
                                    {wishlistItems.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-400">
                                            {tText('No items saved yet', 'এখনও কোনো পণ্য যুক্ত করা হয়নি')}
                                        </div>
                                    ) : (
                                        <div className="max-h-64 overflow-y-auto">
                                            {wishlistItems.map(item => (
                                                <div key={item.id} className="flex items-center justify-between p-2 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
                                                            <i className={`fas ${item.image}`}></i>
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-semibold text-xs text-slate-800 dark:text-white truncate w-32">{item.name}</div>
                                                            <div className="text-[10px] text-emerald-500 font-bold">৳{tNum(item.price)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button 
                                                            onClick={() => {
                                                                // Add to cart
                                                                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                                                                if (!cart.includes(item.id)) {
                                                                    localStorage.setItem('cart', JSON.stringify([...cart, item.id]));
                                                                    window.dispatchEvent(new Event('cart-updated'));
                                                                    showToast(lang === 'bn' ? `${item.name} কার্টে যোগ করা হয়েছে` : `${item.name} added to cart`, 'success');
                                                                }
                                                            }}
                                                            className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-semibold hover:bg-emerald-600 transition-colors"
                                                        >
                                                            {tText('Invest', 'বিনিয়োগ')}
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleWishlistItem(item.id, item.name)}
                                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                                                        >
                                                            <i className="fas fa-trash-alt text-xs"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Cart Icon */}
                        <div className="relative">
                            <Link 
                                href="/cart"
                                className="navbar-action-btn"
                                title={tText('Active Cart', 'সক্রিয় কার্ট')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', textDecoration: 'none' }}
                            >
                                <i className="fas fa-shopping-cart"></i>
                                {isBuyerStyleCart ? (
                                    ecommerceCart.cartCount > 0 && (
                                        <span className="navbar-badge badge-green">{tNum(ecommerceCart.cartCount)}</span>
                                    )
                                ) : (
                                    cartCount > 0 && (
                                        <span className="navbar-badge badge-green">{tNum(cartCount)}</span>
                                    )
                                )}
                            </Link>
                        </div>

                        {/* Divider */}
                        <div className="navbar-divider"></div>

                        {/* Profile/Menu Icon */}
                        <div className="relative" ref={profileRef}>
                            <button 
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="navbar-action-btn border border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                                title={tText('Profile Menu', 'প্রোফাইল মেনু')}
                            >
                                <i className="fas fa-user"></i>
                            </button>

                            {profileOpen && (
                                <div className="navbar-dropdown w-64">
                                    {isAuthenticated && user ? (
                                        <>
                                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                                <div className="font-bold text-slate-800 dark:text-white truncate">{user.name}</div>
                                                <div className="text-xs text-slate-400 truncate">{user.email}</div>
                                                <div className="mt-2 py-1 px-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex justify-between items-center text-xs">
                                                    <span className="text-slate-500 dark:text-slate-300">{tText('Wallet Balance', 'ওয়ালেট ব্যালেন্স')}</span>
                                                    <span className="font-bold text-emerald-500">৳{tNum(user.balance)}</span>
                                                </div>
                                            </div>

                                            {user.role === 'buyer' ? (
                                                <>
                                                    <Link href="/buyer/dashboard" className="navbar-dropdown-item no-underline" onClick={() => setProfileOpen(false)}>
                                                        <i className="fas fa-shopping-bag text-emerald-500"></i>
                                                        <span>{tText('My Orders', 'আমার অর্ডারসমূহ')}</span>
                                                    </Link>
                                                    <Link href="/cart" className="navbar-dropdown-item no-underline" onClick={() => setProfileOpen(false)}>
                                                        <i className="fas fa-shopping-cart text-emerald-500"></i>
                                                        <span>{tText('My Cart', 'আমার কার্ট')}</span>
                                                    </Link>
                                                </>
                                            ) : (
                                                <>
                                                    <Link href="/dashboard" className="navbar-dropdown-item no-underline" onClick={() => setProfileOpen(false)}>
                                                        <i className="fas fa-tachometer-alt text-emerald-500"></i>
                                                        <span>{tText('Dashboard', 'ড্যাশবোর্ড')}</span>
                                                    </Link>
                                                    
                                                    {user.role === 'admin' && (
                                                        <Link href="/admin" className="navbar-dropdown-item no-underline" onClick={() => setProfileOpen(false)}>
                                                            <i className="fas fa-user-shield text-emerald-500"></i>
                                                            <span>{tText('Admin Panel', 'অ্যাডমিন প্যানেল')}</span>
                                                        </Link>
                                                    )}

                                                    <Link href="/dashboard/investments" className="navbar-dropdown-item no-underline" onClick={() => setProfileOpen(false)}>
                                                        <i className="fas fa-chart-line text-emerald-500"></i>
                                                        <span>{tText('My Investments', 'আমার বিনিয়োগ')}</span>
                                                    </Link>

                                                    <Link href="/dashboard/wallet" className="navbar-dropdown-item no-underline" onClick={() => setProfileOpen(false)}>
                                                        <i className="fas fa-wallet text-emerald-500"></i>
                                                        <span>{tText('Deposit / Withdraw', 'জমা / উত্তোলন')}</span>
                                                    </Link>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="navbar-dropdown-header">{tText('Welcome Guest', 'স্বাগতম গেস্ট')}</div>
                                            <Link href="/login" className="navbar-dropdown-item no-underline" onClick={() => setProfileOpen(false)}>
                                                <i className="fas fa-sign-in-alt text-emerald-500"></i>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">{tText('Login', 'লগইন')}</span>
                                            </Link>
                                            <Link href="/signup" className="navbar-dropdown-item no-underline" onClick={() => setProfileOpen(false)}>
                                                <i className="fas fa-user-plus text-emerald-500"></i>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">{tText('Sign Up', 'সাইন আপ')}</span>
                                            </Link>
                                        </>
                                    )}

                                    <div className="navbar-dropdown-header border-t border-slate-100 dark:border-slate-800 mt-1 pt-2">
                                        {tText('Preferences', 'পছন্দসমূহ')}
                                    </div>
                                    
                                    {/* Language Switcher */}
                                    <div className="navbar-dropdown-item" onClick={toggleLang}>
                                        <i className="fas fa-globe text-emerald-500"></i>
                                        <div className="flex justify-between w-full items-center">
                                            <span>{tText('Language', 'ভাষা')}</span>
                                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">{lang.toUpperCase()}</span>
                                        </div>
                                    </div>

                                    {/* Theme Switcher */}
                                    <div className="navbar-dropdown-item" onClick={toggleTheme}>
                                        <i className={`fas ${theme === 'dark' ? 'fa-sun text-yellow-500' : 'fa-moon text-indigo-500'}`}></i>
                                        <div className="flex justify-between w-full items-center">
                                            <span>{tText('Theme', 'থিম')}</span>
                                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold capitalize">{theme}</span>
                                        </div>
                                    </div>

                                    {isAuthenticated && (
                                        <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                                            <div 
                                                onClick={() => {
                                                    logout();
                                                    setProfileOpen(false);
                                                    showToast(lang === 'bn' ? 'সফলভাবে লগআউট করা হয়েছে' : 'Logged out successfully', 'info');
                                                }}
                                                className="navbar-dropdown-item text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            >
                                                <i className="fas fa-sign-out-alt"></i>
                                                <span>{tText('Logout', 'লগআউট')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hamburger menu for responsive viewport */}
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="navbar-action-btn mobile-menu-btn flex"
                            title={tText('Menu', 'মেনু')}
                        >
                            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Slide Down Search Overlay Modal */}
            {searchOpen && (
                <div className="navbar-search-overlay" onClick={() => setSearchOpen(false)}>
                    <div className="navbar-search-container" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-white text-base m-0">
                                {tText('Search Investment Packages', 'ইনভেস্টমেন্ট প্যাকেজ অনুসন্ধান করুন')}
                            </h3>
                            <button 
                                onClick={() => setSearchOpen(false)}
                                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="relative">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={tText('Type package name or category...', 'প্যাকেজের নাম বা ক্যাটাগরি লিখুন...')}
                                className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-transparent text-slate-800 dark:text-white"
                                autoFocus
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="mt-4 max-h-80 overflow-y-auto flex flex-col gap-2">
                                {searchResults.map(product => (
                                    <div 
                                        key={product.id} 
                                        onClick={() => {
                                            router.push(`/products#product-${product.id}`);
                                            setSearchOpen(false);
                                        }}
                                        className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/35 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-lg">
                                                <i className={`fas ${product.image}`}></i>
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-slate-800 dark:text-white text-sm">{product.name}</div>
                                                <div className="text-xs text-slate-400 capitalize">{product.category} • {product.duration} {tText('Days', 'দিন')}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-emerald-500 text-sm">৳{tNum(product.price)}</div>
                                            <div className="text-[10px] text-slate-400">Profit: +{tNum(product.profitPercentage)}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchQuery && searchResults.length === 0 && (
                            <div className="mt-6 text-center text-slate-400 text-sm py-4">
                                <i className="fas fa-box-open text-3xl mb-2 block"></i>
                                {tText('No package found matching that keyword', 'এই কিওয়ার্ড দিয়ে কোনো প্যাকেজ পাওয়া যায়নি')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Responsive Sidebar Drawer */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-1050 bg-slate-900/40 backdrop-blur-sm animation: fadeIn 0.2s" 
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <div 
                        className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-950 p-6 flex flex-col justify-between shadow-2xl border-l border-slate-100 dark:border-slate-900 animation: slideLeft 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4 mb-4">
                                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
                                    <img src={theme === 'dark' ? "/name_white.png" : "/name_transparent.png"} alt="SmartEarnBD" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
                                </Link>
                                <button 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            {/* Links Menu */}
                            <div className="flex flex-col gap-2 text-left">
                                <Link 
                                    href="/" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 p-3 rounded-xl no-underline font-semibold text-sm ${pathname === '/' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                                >
                                    <i className="fas fa-home w-5"></i>
                                    <span>{tText('Home', 'হোম')}</span>
                                </Link>

                                <div className="border-t border-slate-100 dark:border-slate-900 my-1"></div>
                                
                                {/* Collapsible Categories Accordion */}
                                <div>
                                    <button 
                                        onClick={() => setDrawerCategoriesOpen(!drawerCategoriesOpen)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold text-sm border-none bg-transparent"
                                    >
                                        <div className="flex items-center gap-3">
                                            <i className="fas fa-th-large text-emerald-500"></i>
                                            <span>{tText('Categories', 'ক্যাটাগরি')}</span>
                                        </div>
                                        <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${drawerCategoriesOpen ? 'rotate-180' : ''}`}></i>
                                    </button>
                                    {drawerCategoriesOpen && (
                                        <div className="pl-8 flex flex-col gap-2 mt-1">
                                            <Link href="/products?category=mobile" onClick={() => setMobileMenuOpen(false)} className="py-2 text-xs no-underline text-slate-500 hover:text-emerald-500 flex items-center gap-2">
                                                <i className="fas fa-mobile-alt w-4"></i> Mobile Packages
                                            </Link>
                                            <Link href="/products?category=computer" onClick={() => setMobileMenuOpen(false)} className="py-2 text-xs no-underline text-slate-500 hover:text-emerald-500 flex items-center gap-2">
                                                <i className="fas fa-laptop w-4"></i> Laptop Packages
                                            </Link>
                                            <Link href="/products?category=electronics" onClick={() => setMobileMenuOpen(false)} className="py-2 text-xs no-underline text-slate-500 hover:text-emerald-500 flex items-center gap-2">
                                                <i className="fas fa-tv w-4"></i> Electronics Packages
                                            </Link>
                                            <Link href="/products?category=accessories" onClick={() => setMobileMenuOpen(false)} className="py-2 text-xs no-underline text-slate-500 hover:text-emerald-500 flex items-center gap-2">
                                                <i className="fas fa-clock w-4"></i> Accessories
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-900 my-1"></div>

                                <Link 
                                    href="/about" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 p-3 rounded-xl no-underline font-semibold text-sm ${pathname === '/about' ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                                >
                                    <i className="fas fa-shield-alt w-5"></i>
                                    <span>{tText('About Us', 'আমাদের সম্পর্কে')}</span>
                                </Link>

                                <div className="border-t border-slate-100 dark:border-slate-900 my-1"></div>
                                
                                {/* Collapsible Support Accordion */}
                                <div>
                                    <button 
                                        onClick={() => setDrawerSupportOpen(!drawerSupportOpen)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold text-sm border-none bg-transparent"
                                    >
                                        <div className="flex items-center gap-3">
                                            <i className="fas fa-headset text-emerald-500"></i>
                                            <span>{tText('Contact', 'যোগাযোগ')}</span>
                                        </div>
                                        <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${drawerSupportOpen ? 'rotate-180' : ''}`}></i>
                                    </button>
                                    {drawerSupportOpen && (
                                        <div className="pl-8 flex flex-col gap-2 mt-1">
                                            <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="py-2 text-xs no-underline text-slate-500 hover:text-emerald-500 flex items-center gap-2">
                                                <i className="fab fa-whatsapp w-4 text-green-500"></i> WhatsApp Support
                                            </a>
                                            <a href="https://t.me/smartearnbd" target="_blank" rel="noopener noreferrer" className="py-2 text-xs no-underline text-slate-500 hover:text-emerald-500 flex items-center gap-2">
                                                <i className="fab fa-telegram w-4 text-blue-500"></i> Telegram Channel
                                            </a>
                                            <a href="mailto:support@smartearnbd.com" className="py-2 text-xs no-underline text-slate-500 hover:text-emerald-500 flex items-center gap-2">
                                                <i className="fas fa-envelope w-4 text-red-400"></i> Email Support
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Preferences & Auth */}
                        <div className="flex flex-col gap-3">


                            {isAuthenticated ? (
                                <div className="flex flex-col gap-2">
                                    <Link 
                                        href={user?.role === 'buyer' ? '/buyer/dashboard' : '/dashboard'} 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-center text-sm no-underline shadow-md hover:bg-emerald-600"
                                    >
                                        {user?.role === 'buyer' ? tText('My Orders', 'আমার অর্ডারসমূহ') : tText('Go to Dashboard', 'ড্যাশবোর্ডে যান')}
                                    </Link>
                                    <button 
                                        onClick={() => {
                                            logout();
                                            setMobileMenuOpen(false);
                                            showToast(lang === 'bn' ? 'সফলভাবে লগআউট করা হয়েছে' : 'Logged out successfully', 'info');
                                        }}
                                        className="w-full py-3 border border-red-500/20 text-red-500 rounded-xl font-bold text-center text-sm hover:bg-red-50 dark:hover:bg-red-950/20"
                                    >
                                        {tText('Logout', 'লগআউট')}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Link 
                                        href="/login" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-center text-sm no-underline text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                                    >
                                        {tText('Login', 'লগইন')}
                                    </Link>
                                    <Link 
                                        href="/signup" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-center text-sm no-underline hover:bg-emerald-600 shadow-md shadow-emerald-500/10"
                                    >
                                        {tText('Sign Up', 'সাইন আপ')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom sidebar animation CSS injection */}
            <style jsx global>{`
                @keyframes slideLeft {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .lg\\:hidden {
                    display: none;
                }
                @media (max-width: 991px) {
                    .lg\\:hidden {
                        display: flex;
                    }
                }
                .z-1050 {
                    z-index: 1050;
                }
            `}</style>
        </>
    );
}
