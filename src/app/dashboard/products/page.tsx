'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    returnRate: number;
    duration: number;
    stock: number;
    icon?: string;
    active?: boolean;
    image?: string;
    description?: string;
}

const defaultProducts: Product[] = [
    { id: '1', name: 'Smartphone Package', category: 'mobile', price: 5000, returnRate: 12, duration: 30, stock: 50, icon: 'fa-mobile-alt', active: true },
    { id: '2', name: 'Laptop Package', category: 'computer', price: 15000, returnRate: 18, duration: 45, stock: 25, icon: 'fa-laptop', active: true },
    { id: '3', name: 'Electronics Package', category: 'electronics', price: 10000, returnRate: 15, duration: 30, stock: 40, icon: 'fa-tv', active: true },
    { id: '4', name: 'Smart Watch Bundle', category: 'accessories', price: 3000, returnRate: 10, duration: 20, stock: 100, icon: 'fa-clock', active: true },
    { id: '5', name: 'Gaming Console Pack', category: 'electronics', price: 20000, returnRate: 20, duration: 60, stock: 15, icon: 'fa-gamepad', active: true },
    { id: '6', name: 'Tablet Package', category: 'mobile', price: 8000, returnRate: 14, duration: 35, stock: 30, icon: 'fa-tablet-alt', active: true }
];

export default function ClientProductsPage() {
    const { user, updateUserBalance } = useAuth();
    const { tText } = useTranslation();
    const { showToast } = useToast();

    // Data states
    const [products, setProducts] = useState<Product[]>([]);
    const [investModalOpen, setInvestModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Form inputs state
    const [units, setUnits] = useState(1);
    const [sellMode, setSellMode] = useState<'auto' | 'self'>('auto');
    const [confirming, setConfirming] = useState(false);

    // Summary calculations
    const [totalInvestment, setTotalInvestment] = useState(0);
    const [expectedProfit, setExpectedProfit] = useState(0);
    const [totalReturn, setTotalReturn] = useState(0);

    // Load products on mount
    useEffect(() => {
        let list = Storage.get('products');
        if (!list || !Array.isArray(list) || list.length === 0) {
            list = defaultProducts;
            Storage.set('products', list);
        }
        setProducts(list);
    }, []);

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
                productName: selectedProduct.name,
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
                description: `Invested in ${selectedProduct.name} (${units} units)`,
                createdAt: new Date().toISOString()
            };
            transactions.push(newTx);
            Storage.set('transactions', transactions);

            showToast('Investment confirmed successfully!', 'success');
            closeInvestModal();
        } catch (err) {
            showToast('An error occurred during verification', 'error');
        } finally {
            setConfirming(false);
        }
    };

    const activeProducts = products.filter(p => p.stock > 0 && p.active !== false);

    return (
        <div className="content">
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
            `}</style>

            <div className="page-header">
                <h1>{tText("Invest in Products", "পণ্যে বিনিয়োগ করুন")}</h1>
                <p>{tText("Balance: ", "ব্যালেন্স: ")}<strong>৳{(user?.balance || 0).toLocaleString()}</strong></p>
            </div>

            {/* Products Grid */}
            <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {activeProducts.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px' }}>
                        <i className="fas fa-box-open" style={{ fontSize: '60px', color: 'var(--text-muted)', marginBottom: '20px' }}></i>
                        <h3 style={{ color: 'var(--text-secondary)' }}>{tText("No Products Available", "কোন পণ্য উপলব্ধ নেই")}</h3>
                        <p style={{ color: 'var(--text-muted)' }}>{tText("Check back later for new investment opportunities", "নতুন বিনিয়োগের সুযোগের জন্য পরে আবার দেখুন")}</p>
                    </div>
                ) : (
                    activeProducts.map((product) => {
                        const icon = product.icon || getCategoryIcon(product.category);
                        const returnRate = product.returnRate || 10;
                        return (
                            <div key={product.id} className="product-card" style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                <div style={{ height: '120px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <i className={`fas ${icon}`} style={{ fontSize: '50px', color: 'var(--primary-color)' }}></i>
                                    )}
                                    {returnRate >= 15 && (
                                        <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--danger-color)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px' }}>HOT</span>
                                    )}
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>{product.name}</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                        <div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tText("Price", "মূল্য")}</span>
                                            <br />
                                            <strong style={{ color: 'var(--primary-color)' }}>৳{product.price.toLocaleString()}</strong>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tText("Return", "লাভ")}</span>
                                            <br />
                                            <strong style={{ color: 'var(--success-color)' }}>+{returnRate}%</strong>
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
                                    {product.description && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                                            {product.description.substring(0, 50)}{product.description.length > 50 ? '...' : ''}
                                        </p>
                                    )}
                                    <button className="btn btn-primary btn-block" onClick={() => openInvestModal(product)}>
                                        <i className="fas fa-shopping-cart" style={{ marginRight: '6px' }}></i> {tText("Invest Now", "এখনই বিনিয়োগ করুন")}
                                    </button>
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
                                        {selectedProduct.image ? (
                                            <img src={selectedProduct.image} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} alt={selectedProduct.name} />
                                        ) : (
                                            <i className={`fas ${selectedProduct.icon || getCategoryIcon(selectedProduct.category)}`} style={{ fontSize: '28px', color: 'var(--primary-color)' }}></i>
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

                                <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '20px' }} disabled={confirming}>
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
