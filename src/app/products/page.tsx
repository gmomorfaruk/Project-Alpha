'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';

import Storage from '@/lib/storage';
import { Product, defaultProducts as defaultProductsList } from '@/lib/products';

export default function ProductsPage() {
    const { t, tText } = useTranslation();
    const [mounted, setMounted] = useState(false);
    
    // Data states
    const [products, setProducts] = useState<Product[]>([]);
    
    // Filtering States
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('default');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    useEffect(() => {
        setMounted(true);
        let list = Storage.get('products');
        if (!list || !Array.isArray(list) || list.length === 0) {
            list = defaultProductsList;
            Storage.set('products', list);
        }
        setProducts(list);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        let result = products.filter(p => p.active !== false);

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
                result.sort((a, b) => b.returnRate - a.returnRate);
                break;
            case 'newest':
                result.sort((a, b) => b.id.localeCompare(a.id));
                break;
            default:
                break;
        }

        setFilteredProducts(result);
    }, [searchQuery, categoryFilter, sortBy, products, mounted]);

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
            <Navbar />

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
                                <option value="fashion">Fashion</option>
                                <option value="home">Home & Living</option>
                                <option value="health">Health & Beauty</option>
                                <option value="mobile">Mobile</option>
                                <option value="computer">Computer</option>
                                <option value="accessories">Accessories</option>
                                <option value="other">Other</option>
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
                                
                                const hasDiscount = !!(product.previousPrice && product.previousPrice > product.price);
                                const discountPercentage = hasDiscount 
                                    ? Math.round(((product.previousPrice! - product.price) / product.previousPrice!) * 100)
                                    : 0;
                                const discountSavings = hasDiscount 
                                    ? product.previousPrice! - product.price 
                                    : 0;
                                
                                const selfSellProfit = Math.round(product.returnRate * 1.25);

                                return (
                                    <div key={product.id} className={`product-card ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                                        <div className="product-image-container">
                                            <i className={`fas ${product.image || 'fa-box'}`}></i>
                                            <div className="product-badges">
                                                {hasDiscount ? (
                                                    <span className="product-badge badge-offer" style={{ background: '#ef4444', color: 'white' }}>
                                                        {discountPercentage}% OFF
                                                    </span>
                                                ) : (
                                                    <span></span>
                                                )}
                                                <span className="product-badge badge-category">{product.category}</span>
                                            </div>
                                        </div>
                                        <div className="product-content">
                                            <h3 className="product-title">{product.name}</h3>
                                            
                                            {/* Description */}
                                            <p className="product-card-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 15px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px', lineBreak: 'anywhere' }}>
                                                {product.description}
                                            </p>

                                            {/* Colors Display */}
                                            {product.colors && product.colors.length > 0 && (
                                                <div className="color-options-container" style={{ display: 'flex', gap: '6px', margin: '0 0 15px 0' }}>
                                                    {product.colors.map((color, idx) => (
                                                        <span 
                                                            key={idx} 
                                                            className="color-dot" 
                                                            style={{ 
                                                                display: 'inline-block',
                                                                width: '16px', 
                                                                height: '16px', 
                                                                borderRadius: '50%', 
                                                                border: '1px solid var(--border-color)',
                                                                background: color.toLowerCase() === 'black' || color.toLowerCase() === 'midnight black' ? '#0f172a' :
                                                                            color.toLowerCase() === 'white' ? '#ffffff' :
                                                                            color.toLowerCase() === 'blue' || color.toLowerCase() === 'ocean blue' ? '#2563eb' :
                                                                            color.toLowerCase() === 'red' || color.toLowerCase() === 'crimson red' ? '#dc2626' :
                                                                            color.toLowerCase() === 'green' ? '#16a34a' :
                                                                            color.toLowerCase() === 'gold' || color.toLowerCase() === 'rose gold' ? '#d97706' :
                                                                            color.toLowerCase() === 'silver' || color.toLowerCase() === 'silver metallic' ? '#cbd5e1' :
                                                                            color.toLowerCase() === 'purple' || color.toLowerCase() === 'deep purple' ? '#7c3aed' :
                                                                            color.toLowerCase() === 'space gray' ? '#4b5563' :
                                                                            color.toLowerCase() === 'titanium gray' ? '#6b7280' : '#888888'
                                                            }}
                                                            title={color}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            <div className="product-info">
                                                <div className="info-item" style={{ gridColumn: 'span 2' }}>
                                                    <span className="info-label">{tText("Price", "মূল্য")}</span>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span className="info-value price" style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                                                            ৳{product.price.toLocaleString()}
                                                        </span>
                                                        {hasDiscount && (
                                                            <>
                                                                <span style={{ fontSize: '14px', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                                                                    ৳{product.previousPrice!.toLocaleString()}
                                                                </span>
                                                                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                                                                    Save ৳{discountSavings.toLocaleString()}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">{tText("Auto-Sell Profit", "অটো-সেল লাভ")}</span>
                                                    <span className="info-value profit">+{product.returnRate}%</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">{tText("Self-Sell Profit", "সেলফ-সেল লাভ")}</span>
                                                    <span className="info-value profit">+{selfSellProfit}%</span>
                                                </div>
                                                <div className="info-item" style={{ gridColumn: 'span 2' }}>
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
                        <p>&copy; 2026 SmartEarnBD. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
