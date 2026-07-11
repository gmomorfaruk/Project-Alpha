'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    profitPercentage: number;
    selfSellProfit: number;
    duration: number;
    stock: number;
    image: string;
    isActive: boolean;
    hasOffer: boolean;
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
    },
    {
        id: 7,
        name: 'Home Appliances Set',
        category: 'home',
        price: 12000,
        profitPercentage: 16,
        selfSellProfit: 20,
        duration: 40,
        stock: 0,
        image: 'fa-blender',
        isActive: true,
        hasOffer: false
    },
    {
        id: 8,
        name: 'Audio Equipment',
        category: 'electronics',
        price: 6000,
        profitPercentage: 12,
        selfSellProfit: 15,
        duration: 25,
        stock: 45,
        image: 'fa-headphones',
        isActive: true,
        hasOffer: false
    }
];

export default function ProductsPage() {
    const { lang, t, tText, toggleLang } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    // Filtering States
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('default');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        let result = sampleProducts.filter(p => p.isActive);

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(query));
        }

        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter(p => p.category === categoryFilter);
        }

        // Sorting
        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'profit-high':
                result.sort((a, b) => b.profitPercentage - a.profitPercentage);
                break;
            case 'newest':
                result.sort((a, b) => b.id - a.id);
                break;
            default:
                break;
        }

        setFilteredProducts(result);
    }, [searchQuery, categoryFilter, sortBy]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Embedded styles for Products page */}
            <style jsx global>{`
                .products-page {
                    padding: 120px 0 60px;
                    min-height: 100vh;
                    background: var(--bg-secondary);
                }
                .products-header {
                    margin-bottom: 40px;
                }
                .products-header h1 {
                    font-size: 32px;
                    margin-bottom: 10px;
                }
                .products-controls {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                }
                .search-box {
                    flex: 1;
                    min-width: 250px;
                    position: relative;
                }
                .search-box input {
                    width: 100%;
                    padding: 12px 16px 12px 45px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-size: 14px;
                }
                .search-box i {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                }
                .filter-dropdown {
                    position: relative;
                }
                .filter-dropdown select {
                    padding: 12px 40px 12px 16px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-size: 14px;
                    cursor: pointer;
                    appearance: none;
                }
                .filter-dropdown i {
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none;
                    color: var(--text-secondary);
                }
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 24px;
                }
                .product-card {
                    background: var(--bg-primary);
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    transition: all 0.3s ease;
                }
                .product-card:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-lg);
                }
                .product-card.out-of-stock {
                    opacity: 0.7;
                }
                .product-image-container {
                    height: 180px;
                    background: var(--primary-light);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .product-image-container i {
                    font-size: 60px;
                    color: var(--primary-color);
                }
                .product-badges {
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    right: 15px;
                    display: flex;
                    justify-content: space-between;
                }
                .product-badge {
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .badge-offer {
                    background: var(--danger-color);
                    color: white;
                }
                .badge-category {
                    background: var(--bg-primary);
                    color: var(--text-secondary);
                }
                .product-content {
                    padding: 20px;
                }
                .product-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 15px;
                }
                .product-info {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin-bottom: 15px;
                }
                .info-item {
                    display: flex;
                    flex-direction: column;
                }
                .info-label {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin-bottom: 4px;
                }
                .info-value {
                    font-size: 16px;
                    font-weight: 600;
                }
                .info-value.profit {
                    color: var(--success-color);
                }
                .info-value.price {
                    color: var(--primary-color);
                }
                .product-footer {
                    display: flex;
                    gap: 10px;
                }
                .stock-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 0;
                    border-top: 1px solid var(--border-color);
                    margin-top: 15px;
                }
                .stock-info i {
                    color: var(--success-color);
                }
                .stock-info.low i {
                    color: var(--warning-color);
                }
                .stock-info.out i {
                    color: var(--danger-color);
                }
                .no-products {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                }
                .no-products i {
                    font-size: 60px;
                    color: var(--text-muted);
                    margin-bottom: 20px;
                }
                @media (max-width: 768px) {
                    .products-controls {
                        flex-direction: column;
                    }
                    .search-box {
                        width: 100%;
                    }
                }
            `}</style>

            {/* Navigation */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} style={{ boxShadow: scrolled ? 'var(--shadow-md)' : 'none' }}>
                <div className="container">
                    <Link href="/" className="logo">
                        <i className="fas fa-rocket"></i>
                        <span>Project Alpha</span>
                    </Link>
                    
                    <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`} id="navLinks">
                        <Link href="/">
                            {t('nav.home')}
                        </Link>
                        <Link href="/products" className="active">
                            {t('nav.products')}
                        </Link>
                        <Link href="/about">
                            {t('nav.about')}
                        </Link>
                        <Link href="/login">
                            {t('nav.login')}
                        </Link>
                        <Link href="/signup" className="btn btn-primary">
                            {t('nav.signup')}
                        </Link>
                    </div>

                    <div className="nav-controls">
                        <button className="theme-toggle" id="themeToggle" onClick={toggleTheme} title="Toggle Theme">
                            <i className={`fas ${theme === 'dark' ? 'fa-sun' : theme === 'system' ? 'fa-desktop' : 'fa-moon'}`}></i>
                        </button>
                        
                        <button className="lang-toggle" id="langToggle" onClick={toggleLang} title="Toggle Language">
                            <span>{lang.toUpperCase()}</span>
                        </button>
                        
                        <button className="mobile-menu" id="mobileMenu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Products Page */}
            <section className="products-page">
                <div className="container">
                    <div className="products-header">
                        <h1>{tText("All Products", "সব পণ্য")}</h1>
                        <p>{tText("Choose from our wide range of investment products", "আমাদের বিস্তৃত বিনিয়োগ পণ্য থেকে বেছে নিন")}</p>
                    </div>

                    <div className="products-controls">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text" 
                                placeholder={tText("Search products...", "পণ্য খুঁজুন...")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="filter-dropdown">
                            <select 
                                value={categoryFilter} 
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">{tText("All Categories", "সব বিভাগ")}</option>
                                <option value="electronics">Electronics</option>
                                <option value="mobile">Mobile</option>
                                <option value="computer">Computer</option>
                                <option value="accessories">Accessories</option>
                                <option value="home">Home Appliances</option>
                            </select>
                            <i className="fas fa-chevron-down"></i>
                        </div>
                        <div className="filter-dropdown">
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="default">{tText("Sort By", "সাজান")}</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="profit-high">Profit: High to Low</option>
                                <option value="newest">Newest First</option>
                            </select>
                            <i className="fas fa-chevron-down"></i>
                        </div>
                    </div>

                    <div className="products-grid">
                        {filteredProducts.length === 0 ? (
                            <div className="no-products">
                                <i className="fas fa-box-open"></i>
                                <h3>{tText("No products found", "কোন পণ্য পাওয়া যায়নি")}</h3>
                                <p>{tText("Try adjusting your search or filter", "আপনার সার্চ বা ফিল্টার পরিবর্তন করুন")}</p>
                            </div>
                        ) : (
                            filteredProducts.map((product) => {
                                const stockClass = product.stock === 0 ? 'out' : product.stock < 10 ? 'low' : '';
                                const stockText = product.stock === 0 
                                    ? tText('Out of Stock', 'স্টক শেষ') 
                                    : tText(`${product.stock} in stock`, `${product.stock}টি স্টকে আছে`);
                                const stockIcon = product.stock === 0 ? 'fa-times-circle' : product.stock < 10 ? 'fa-exclamation-circle' : 'fa-check-circle';

                                return (
                                    <div key={product.id} className={`product-card ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                                        <div className="product-image-container">
                                            <i className={`fas ${product.image}`}></i>
                                            <div className="product-badges">
                                                {product.hasOffer ? (
                                                    <span className="product-badge badge-offer">{product.offerText}</span>
                                                ) : (
                                                    <span></span>
                                                )}
                                                <span className="product-badge badge-category">{product.category}</span>
                                            </div>
                                        </div>
                                        <div className="product-content">
                                            <h3 className="product-title">{product.name}</h3>
                                            <div className="product-info">
                                                <div className="info-item">
                                                    <span className="info-label">{tText("Price", "মূল্য")}</span>
                                                    <span className="info-value price">৳{product.price.toLocaleString()}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">{tText("Auto-Sell Profit", "অটো-সেল লাভ")}</span>
                                                    <span className="info-value profit">+{product.profitPercentage}%</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">{tText("Self-Sell Profit", "সেলফ-সেল লাভ")}</span>
                                                    <span className="info-value profit">+{product.selfSellProfit}%</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">{tText("Duration", "সময়কাল")}</span>
                                                    <span className="info-value">{product.duration} {tText("days", "দিন")}</span>
                                                </div>
                                            </div>
                                            <div className={`stock-info ${stockClass}`}>
                                                <i className={`fas ${stockIcon}`}></i>
                                                <span>{stockText}</span>
                                            </div>
                                            <div className="product-footer">
                                                {product.stock === 0 ? (
                                                    <button className="btn btn-primary btn-block" disabled>
                                                        {tText("Out of Stock", "স্টক শেষ")}
                                                    </button>
                                                ) : (
                                                    <Link href="/login" className="btn btn-primary btn-block">
                                                        {tText("Invest Now", "এখনই বিনিয়োগ করুন")}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-bottom" style={{ borderTop: 'none', paddingTop: 0 }}>
                        <p>&copy; 2026 Project Alpha. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
