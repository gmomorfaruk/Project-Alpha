'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

import { Product, defaultProducts } from '@/lib/products';

export default function ClientProductsPage() {
    const { user, updateUserBalance } = useAuth();
    const { tText } = useTranslation();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const queryParam = searchParams.get('search');

    // Data states
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [investModalOpen, setInvestModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Form inputs state
    const [units, setUnits] = useState(1);
    const [sellMode, setSellMode] = useState<'auto' | 'self'>('auto');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [confirming, setConfirming] = useState(false);

    // Summary calculations
    const [totalInvestment, setTotalInvestment] = useState(0);
    const [expectedProfit, setExpectedProfit] = useState(0);
    const [totalReturn, setTotalReturn] = useState(0);

    const triggerFlyAnimation = (startEl: HTMLElement, endEl: HTMLElement, iconClass: string) => {
        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();

        const flyer = document.createElement('div');
        flyer.className = 'flyer-animation';
        flyer.innerHTML = `<i class="fas ${iconClass}"></i>`;
        
        Object.assign(flyer.style, {
            position: 'fixed',
            left: `${startRect.left + startRect.width / 2 - 20}px`,
            top: `${startRect.top + startRect.height / 2 - 20}px`,
            width: '40px',
            height: '40px',
            background: 'var(--primary-color, #10b981)',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            zIndex: '9999',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
            pointerEvents: 'none'
        });

        document.body.appendChild(flyer);

        flyer.getBoundingClientRect();

        Object.assign(flyer.style, {
            left: `${endRect.left + endRect.width / 2 - 20}px`,
            top: `${endRect.top + endRect.height / 2 - 20}px`,
            transform: 'scale(0.3)',
            opacity: '0.1'
        });

        setTimeout(() => {
            flyer.remove();
            
            const burst = document.createElement('div');
            burst.className = 'burst-animation';
            Object.assign(burst.style, {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                border: '2px solid #10b981',
                borderRadius: 'inherit',
                pointerEvents: 'none',
                animation: 'burst-expand 0.5s ease-out forwards',
                zIndex: '9999'
            });
            
            const originalPosition = endEl.style.position;
            if (!originalPosition || originalPosition === 'static') {
                endEl.style.position = 'relative';
            }
            endEl.appendChild(burst);
            
            setTimeout(() => {
                burst.remove();
                if (!originalPosition || originalPosition === 'static') {
                    endEl.style.position = originalPosition;
                }
            }, 600);
        }, 800);
    };

    // Load products on mount
    useEffect(() => {
        // Force reset products list to load updated discounts
        const hasReset = Storage.get('products_reset_v8');
        let list = Storage.get('products');
        if (!hasReset || !list || !Array.isArray(list) || list.length === 0) {
            list = defaultProducts;
            Storage.setLocalOnly('products', list);
            Storage.set('products_reset_v8', true);
        }
        setProducts(list);
    }, []);

    useEffect(() => {
        if (queryParam) {
            setSearchQuery(queryParam);
        } else {
            setSearchQuery('');
        }
    }, [queryParam]);

    // Recalculate summary details when units or sellMode changes
    useEffect(() => {
        if (!selectedProduct) return;
        
        const price = selectedProduct.price;
        const baseRate = selectedProduct.returnRate || 10;
        // Self sell profit is ~25% higher rate
        const rate = sellMode === 'auto' ? baseRate : Math.round(baseRate * 1.25);
        
        const total = price * units;
        const profit = Math.round(total * (rate / 100));
        
        setTotalInvestment(total);
        setExpectedProfit(profit);
        setTotalReturn(total + profit);
    }, [units, sellMode, selectedProduct]);

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            electronics: 'fa-tv',
            fashion: 'fa-tshirt',
            mobile: 'fa-mobile-alt',
            computer: 'fa-laptop',
            accessories: 'fa-clock',
            home: 'fa-home',
            health: 'fa-heartbeat',
            other: 'fa-box'
        };
        return icons[category] || 'fa-box';
    };

    const openInvestModal = (product: Product) => {
        setSelectedProduct(product);
        setUnits(1);
        setSellMode('auto');
        setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
        setInvestModalOpen(true);
    };

    const closeInvestModal = () => {
        setInvestModalOpen(false);
        setSelectedProduct(null);
    };

    const handleConfirmInvestment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedProduct) return;

        if (units < 1) {
            showToast('Please enter a valid number of units', 'error');
            return;
        }

        if (units > selectedProduct.stock) {
            showToast(`Only ${selectedProduct.stock} units are currently available`, 'error');
            return;
        }

        if (user.balance < totalInvestment) {
            showToast('Insufficient wallet balance. Please deposit funds.', 'error');
            return;
        }

        setConfirming(true);
        try {
            // 1. Deduct user balance
            const balanceDeducted = await updateUserBalance(totalInvestment, 'deduct');
            if (!balanceDeducted) {
                showToast('Failed to process wallet transaction', 'error');
                return;
            }

            // 2. Decrement product stock
            const updatedProducts = products.map((p) => {
                if (p.id === selectedProduct.id) {
                    return { ...p, stock: p.stock - units };
                }
                return p;
            });
            setProducts(updatedProducts);
            Storage.set('products', updatedProducts);

            // 3. Create investment record
            const investments = Storage.get('investments') || [];
            const rate = sellMode === 'auto' ? selectedProduct.returnRate : Math.round(selectedProduct.returnRate * 1.25);
            
            const newInvestment = {
                id: db.generateId(),
                userId: user.id,
                productId: selectedProduct.id,
                productName: `${selectedProduct.name}${selectedColor ? ` (${selectedColor})` : ''}`,
                amount: totalInvestment,
                units: units,
                sellMode: sellMode,
                profitRate: rate,
                duration: selectedProduct.duration,
                remainingDays: selectedProduct.duration,
                expectedProfit: expectedProfit,
                totalReturn: totalReturn,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            investments.push(newInvestment);
            Storage.set('investments', investments);

            // 4. Update user totalInvested status
            const users = Storage.get('users') || [];
            const userIndex = users.findIndex((u: any) => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex].totalInvested = (users[userIndex].totalInvested || 0) + totalInvestment;
                users[userIndex].balance = user.balance - totalInvestment; // Sync balance change
                Storage.set('users', users);
                Storage.set('currentUser', users[userIndex]);
            }

            // 5. Create transaction log
            const deposits = Storage.get('deposits') || []; // Shared list for transaction activity
            const transactions = Storage.get('transactions') || [];
            const newTx = {
                id: db.generateId(),
                userId: user.id,
                type: 'investment',
                amount: totalInvestment,
                status: 'completed',
                description: `Invested in ${selectedProduct.name} (${units} units)${selectedColor ? ` [Color: ${selectedColor}]` : ''}`,
                createdAt: new Date().toISOString()
            };
            transactions.push(newTx);
            Storage.set('transactions', transactions);

            // Trigger flying animation
            const startBtn = document.getElementById('modal-confirm-btn');
            const endWallet = document.querySelector('a[href="/dashboard/wallet"]') || document.querySelector('.dashboard-container');
            if (startBtn && endWallet) {
                triggerFlyAnimation(startBtn as HTMLElement, endWallet as HTMLElement, selectedProduct.image || 'fa-box');
            }

            showToast('Investment confirmed successfully!', 'success');
            setTimeout(() => {
                closeInvestModal();
            }, 600);
        } catch (err) {
            showToast('An error occurred during verification', 'error');
        } finally {
            setConfirming(false);
        }
    };

    // Show all categories that have at least one product
    const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
    
    // Show all products matching the selected category (removed stock/active filter so they don't disappear)
    const activeProducts = products.filter(p => {
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesSearch = !searchQuery || 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <style jsx global>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .modal-overlay.active {
                    display: flex;
                }
                .modal {
                    background: var(--bg-primary);
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    max-width: 550px;
                    width: 100%;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 25px;
                    border-bottom: 1px solid var(--border-color);
                }
                .modal-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0;
                    color: var(--text-primary);
                }
                .modal-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: none;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                .modal-close:hover {
                    background: var(--danger-color);
                    color: white;
                }
                .modal-body {
                    padding: 25px;
                    overflow-y: auto;
                    flex-grow: 1;
                }
                .product-summary {
                    padding: 15px;
                    background: var(--bg-secondary);
                    border-radius: 12px;
                    margin-bottom: 20px;
                    border: 1px solid var(--border-color);
                }
                .sell-mode-selector {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-top: 8px;
                }
                .sell-mode-option {
                    padding: 15px;
                    border: 2px solid var(--border-color);
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.3s ease;
                    position: relative;
                }
                .sell-mode-option.active {
                    border-color: var(--primary-color);
                    background: var(--primary-light);
                }
                .sell-mode-option h4 {
                    margin: 0 0 5px 0;
                    font-size: 14px;
                    color: var(--text-primary);
                }
                .sell-mode-option p {
                    margin: 0;
                    font-size: 11px;
                    color: var(--text-secondary);
                }
                .profit-badge {
                    position: absolute;
                    top: -10px;
                    right: 10px;
                    background: var(--success-color);
                    color: white;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 600;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
                    font-size: 14px;
                }
                @keyframes burst-expand {
                    0% {
                        width: 10px;
                        height: 10px;
                        opacity: 1;
                    }
                    100% {
                        width: 120px;
                        height: 120px;
                        opacity: 0;
                    }
                }
            `}</style>

            <div className="page-header">
                <h1>{tText("Invest in Products", "পণ্যে বিনিয়োগ করুন")}</h1>
                <p>{tText("Balance: ", "ব্যালেন্স: ")}<strong>৳{(user?.balance || 0).toLocaleString()}</strong></p>
            </div>

            {/* Category Filter and Search Box Row */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Category Filter - Custom Premium Dropdown */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '280px', zIndex: 10 }}>
                    <div 
                        onClick={() => {
                            const menu = document.getElementById('category-dropdown-menu');
                            if (menu) {
                                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '12px 40px 12px 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>{selectedCategory === 'all' ? tText("All Categories", "সব ক্যাটাগরি") : selectedCategory}</span>
                        <i className="fas fa-chevron-down" style={{ color: 'var(--text-secondary)' }}></i>
                    </div>
                    
                    <div 
                        id="category-dropdown-menu"
                        style={{
                            display: 'none',
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '8px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            zIndex: 100
                        }}
                    >
                        {categories.map(cat => (
                            <div 
                                key={cat}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    const menu = document.getElementById('category-dropdown-menu');
                                    if (menu) menu.style.display = 'none';
                                }}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    fontSize: '14px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    background: selectedCategory === cat ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                    color: selectedCategory === cat ? 'var(--primary-color)' : 'var(--text-primary)',
                                    fontWeight: selectedCategory === cat ? '600' : 'normal',
                                    transition: 'background 0.2s ease'
                                }}
                            >
                                {cat === 'all' ? tText("All Categories", "সব ক্যাটাগরি") : cat}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Search Box */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '280px', zIndex: 5 }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                    <input 
                        type="text" 
                        placeholder={tText("Search products...", "পণ্য খুঁজুন...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 40px',
                            borderRadius: '12px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: 'var(--shadow-sm)',
                            outline: 'none',
                        }}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Products Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
                {activeProducts.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 12px' }}>
                        <i className="fas fa-box-open" style={{ fontSize: '50px', color: 'var(--text-muted)', marginBottom: '16px', display: 'block' }}></i>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>{tText("No Products Available", "কোন পণ্য উপলব্ধ নেই")}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', wordBreak: 'break-word', lineHeight: '1.5' }}>{tText("Check back later for new investment opportunities", "নতুন বিনিয়োগের সুযোগের জন্য পরে আবার দেখুন")}</p>
                    </div>
                ) : (
                    activeProducts.map((product) => {
                        const icon = product.image || getCategoryIcon(product.category);
                        const returnRate = product.returnRate || 10;
                        const hasDiscount = !!(product.previousPrice && product.previousPrice > product.price);
                        const discountPercentage = hasDiscount 
                            ? Math.round(((product.previousPrice! - product.price) / product.previousPrice!) * 100)
                            : 0;
                        const discountSavings = hasDiscount 
                            ? product.previousPrice! - product.price 
                            : 0;
                        const hasOffer = product.hasOffer !== undefined ? product.hasOffer : hasDiscount;
                        const offerText = product.offerText || (hasDiscount ? `${discountPercentage}% OFF` : '');
                        const offerColor = product.offerColor || '#ef4444';

                        return (
                            <div key={product.id} className="product-card" style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '120px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {product.image && product.image.startsWith('http') ? (
                                        <img src={product.image} alt={product.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <i className={`fas ${product.image || icon}`} style={{ fontSize: '50px', color: 'var(--primary-color)' }}></i>
                                    )}
                                    {hasOffer && (
                                        <span style={{ 
                                            position: 'absolute', 
                                            top: '10px', 
                                            right: '10px', 
                                            background: offerColor, 
                                            color: 'white', 
                                            padding: '4px 10px', 
                                            borderRadius: '20px', 
                                            fontSize: '11px', 
                                            fontWeight: 700,
                                            letterSpacing: '0.5px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                            textTransform: 'uppercase'
                                        }}>
                                            {offerText}
                                        </span>
                                    )}
                                </div>
                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '16px', marginBottom: '8px', marginTop: 0 }}>{product.name}</h3>
                                    
                                    {/* Description */}
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', height: '36px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineBreak: 'anywhere' }}>
                                        {product.description}
                                    </p>

                                    {/* Colors Display */}
                                    {product.colors && product.colors.length > 0 && (
                                        <div className="color-options-container" style={{ display: 'flex', gap: '6px', margin: '0 0 12px 0' }}>
                                            {product.colors.map((color, idx) => (
                                                <span 
                                                    key={idx} 
                                                    className="color-dot" 
                                                    style={{ 
                                                        display: 'inline-block',
                                                        width: '14px', 
                                                        height: '14px', 
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

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tText("Price", "মূল্য")}</span>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                                                <strong style={{ color: '#10b981', fontSize: '16px' }}>৳{product.price.toLocaleString()}</strong>
                                                {hasDiscount && (
                                                    <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                                                        ৳{product.previousPrice!.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tText("Auto-Sell Profit", "অটো-সেল লাভ")}</span>
                                            <br />
                                            <strong style={{ color: 'var(--success-color)' }}>+{returnRate}%</strong>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tText("Self-Sell Profit", "সেলফ-সেল লাভ")}</span>
                                            <br />
                                            <strong style={{ color: 'var(--success-color)' }}>+{Math.round(returnRate * 1.25)}%</strong>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tText("Duration", "সময়কাল")}</span>
                                            <br />
                                            <strong>{product.duration} {tText("days", "দিন")}</strong>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tText("Stock", "স্টক")}</span>
                                            <br />
                                            <strong>{product.stock} {tText("units", "ইউনিট")}</strong>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 'auto' }}>
                                        <button className="btn btn-primary btn-block" onClick={() => openInvestModal(product)} disabled={product.stock === 0}>
                                            <i className="fas fa-shopping-cart" style={{ marginRight: '6px' }}></i> {product.stock === 0 ? tText("Out of Stock", "স্টক শেষ") : tText("Invest Now", "এখনই বিনিয়োগ করুন")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Investment Modal */}
            {selectedProduct && (
                <div className={`modal-overlay ${investModalOpen ? 'active' : ''}`} id="investModal">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{tText("Invest in Product", "পণ্যে বিনিয়োগ করুন")}</h3>
                            <button className="modal-close" onClick={closeInvestModal}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body">
                            <div className="product-summary" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '60px', height: '60px', background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {selectedProduct.image && (selectedProduct.image.startsWith('http') || selectedProduct.image.startsWith('/')) ? (
                                            <img src={selectedProduct.image} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} alt={selectedProduct.name} />
                                        ) : (
                                            <i className={`fas ${selectedProduct.image || getCategoryIcon(selectedProduct.category)}`} style={{ fontSize: '28px', color: 'var(--primary-color)' }}></i>
                                        )}
                                    </div>
                                    <div>
                                        <h4 style={{ marginBottom: '5px', marginTop: 0 }}>{selectedProduct.name}</h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                                            ৳{selectedProduct.price.toLocaleString()} {tText("per unit", "প্রতি ইউনিট")} • {selectedProduct.duration} {tText("days", "দিন")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleConfirmInvestment}>
                                <div className="form-group">
                                    <label htmlFor="investUnits">{tText("Number of Units", "ইউনিট সংখ্যা")}</label>
                                    <input 
                                        type="number" 
                                        id="investUnits" 
                                        min="1" 
                                        max={selectedProduct.stock}
                                        value={units}
                                        onChange={e => setUnits(Math.max(1, parseInt(e.target.value) || 1))}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label>{tText("Select Color", "রঙ চয়ন করুন")}</label>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                            {selectedProduct.colors.map((color, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setSelectedColor(color)}
                                                    style={{
                                                        display: 'inline-block',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        border: selectedColor === color ? '3px solid var(--primary-color)' : '1px solid var(--border-color)',
                                                        background: color.toLowerCase() === 'black' || color.toLowerCase() === 'midnight black' ? '#0f172a' :
                                                                    color.toLowerCase() === 'white' ? '#ffffff' :
                                                                    color.toLowerCase() === 'blue' || color.toLowerCase() === 'ocean blue' ? '#2563eb' :
                                                                    color.toLowerCase() === 'red' || color.toLowerCase() === 'crimson red' ? '#dc2626' :
                                                                    color.toLowerCase() === 'green' ? '#16a34a' :
                                                                    color.toLowerCase() === 'gold' || color.toLowerCase() === 'rose gold' ? '#d97706' :
                                                                    color.toLowerCase() === 'silver' || color.toLowerCase() === 'silver metallic' ? '#cbd5e1' :
                                                                    color.toLowerCase() === 'purple' || color.toLowerCase() === 'deep purple' ? '#7c3aed' :
                                                                    color.toLowerCase() === 'space gray' ? '#4b5563' :
                                                                    color.toLowerCase() === 'titanium gray' ? '#6b7280' : '#888888',
                                                        cursor: 'pointer',
                                                        boxShadow: selectedColor === color ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>{tText("Select Sell Mode", "বিক্রয় মোড চয়ন করুন")}</label>
                                    <div className="sell-mode-selector">
                                        <div 
                                            className={`sell-mode-option ${sellMode === 'auto' ? 'active' : ''}`}
                                            onClick={() => setSellMode('auto')}
                                        >
                                            <h4 style={{ marginTop: 0 }}><i className="fas fa-robot"></i> Auto-Sell</h4>
                                            <p>{tText("We sell for you automatically", "আমরা আপনার জন্য স্বয়ংক্রিয় বিক্রি করব")}</p>
                                            <span className="profit-badge">+{selectedProduct.returnRate}%</span>
                                        </div>
                                        <div 
                                            className={`sell-mode-option ${sellMode === 'self' ? 'active' : ''}`}
                                            onClick={() => setSellMode('self')}
                                        >
                                            <h4 style={{ marginTop: 0 }}><i className="fas fa-user"></i> Self-Sell</h4>
                                            <p>{tText("Sell yourself for higher profit", "উচ্চ মুনাফার জন্য নিজে বিক্রি করুন")}</p>
                                            <span className="profit-badge">+{Math.round(selectedProduct.returnRate * 1.25)}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="product-summary" style={{ background: 'var(--success-color)', color: 'white', marginTop: '20px', border: 'none' }}>
                                    <div className="summary-row" style={{ borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>
                                        <span>{tText("Total Investment", "মোট বিনিয়োগ")}</span>
                                        <strong style={{ color: 'white' }}>৳{totalInvestment.toLocaleString()}</strong>
                                    </div>
                                    <div className="summary-row" style={{ borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>
                                        <span>{tText("Expected Profit", "প্রত্যাশিত লাভ")}</span>
                                        <strong style={{ color: 'white' }}>৳{expectedProfit.toLocaleString()}</strong>
                                    </div>
                                    <div className="summary-row" style={{ border: 'none' }}>
                                        <span>{tText("Total Return", "মোট রিটার্ন")}</span>
                                        <strong style={{ color: 'white' }}>৳{totalReturn.toLocaleString()}</strong>
                                    </div>
                                </div>

                                <button type="submit" id="modal-confirm-btn" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '20px' }} disabled={confirming}>
                                    {confirming ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                                            <span>{tText("Confirm Investment", "বিনিয়োগ নিশ্চিত করুন")}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
