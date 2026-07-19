'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import Storage from '@/lib/storage';

interface Investment {
    id: string;
    userId: string;
    productId: string;
    productName: string;
    productIcon?: string;
    amount: number;
    units: number;
    sellMode: 'auto' | 'self';
    profitRate: number;
    duration: number;
    remainingDays: number;
    expectedProfit: number;
    totalReturn: number;
    status: 'active' | 'completed' | 'pending_proof';
    createdAt: string;
}

export default function ClientInvestmentsPage() {
    const { user } = useAuth();
    const { tText, tNum } = useTranslation();

    // Data states
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'self-sell' | 'auto-sell' | 'completed'>('all');
    const [selectedInv, setSelectedInv] = useState<Investment | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Dynamic stats
    const [totalInvested, setTotalInvested] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [activeCount, setActiveCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        loadInvestmentsData();
    }, [user]);

    const loadInvestmentsData = () => {
        if (!user) return;
        const allInv = Storage.get('investments') || [];
        const userInv = allInv.filter((inv: any) => inv.userId === user.id);
        
        setInvestments(userInv);

        const invested = userInv.reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const profit = userInv.reduce((sum: number, inv: any) => sum + (inv.expectedProfit || 0), 0);
        const active = userInv.filter((inv: any) => inv.status === 'active').length;

        setTotalInvested(invested);
        setTotalProfit(profit);
        setActiveCount(active);
    };

    const filteredInvestments = investments.filter((inv) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'active') return inv.status === 'active';
        if (activeFilter === 'self-sell') return inv.sellMode === 'self';
        if (activeFilter === 'auto-sell') return inv.sellMode === 'auto';
        if (activeFilter === 'completed') return inv.status === 'completed';
        return true;
    });

    const openDetailsModal = (inv: Investment) => {
        setSelectedInv(inv);
        setModalOpen(true);
    };

    const closeDetailsModal = () => {
        setModalOpen(false);
        setSelectedInv(null);
    };

    const getProgressInfo = (inv: Investment) => {
        const start = new Date(inv.createdAt).getTime();
        const durationMs = inv.duration * 24 * 60 * 60 * 1000;
        const end = start + durationMs;
        const now = Date.now();
        
        const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
        const progress = Math.min(100, ((inv.duration - daysRemaining) / inv.duration) * 100);

        return {
            daysRemaining,
            progress,
            startDateStr: new Date(start).toLocaleDateString(),
            endDateStr: new Date(end).toLocaleDateString()
        };
    };

    const formatMoney = (val: number) => {
        return `৳${tNum((val || 0).toLocaleString())}`;
    };

    return (
        <div className="fintech-investments-view">
            <style jsx global>{`
                .fintech-investments-view {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                /* Visual cards grid */
                .investments-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                }

                @media (max-width: 768px) {
                    .investments-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .investment-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-shadow: var(--shadow-sm);
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .investment-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-card-hover);
                }

                .card-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }

                .card-product-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .product-icon-container {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: var(--primary-light);
                    color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }

                .product-title-meta h4 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .product-title-meta span {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .card-amount-info {
                    text-align: right;
                }

                .card-amount-info h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .card-amount-info span {
                    font-size: 11px;
                    color: var(--success-color);
                    font-weight: 600;
                }

                /* Linear progress indicator */
                .investment-progress-section {
                    margin-bottom: 20px;
                }

                .progress-meta-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin-bottom: 6px;
                }

                .progress-bar-container {
                    height: 8px;
                    background: var(--bg-hover);
                    border-radius: var(--radius-full);
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }

                .progress-bar-fill {
                    height: 100%;
                    background: var(--primary-gradient);
                    border-radius: var(--radius-full);
                    transition: width 0.3s ease;
                }

                .card-footer-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-light);
                    font-size: 12px;
                    color: var(--text-muted);
                }

                .mode-tag {
                    font-weight: 600;
                    color: var(--text-secondary);
                }
            `}</style>

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h1>{tText("My Investments", "আমার বিনিয়োগ")}</h1>
                    <p>{tText("Track and manage your active portfolio packages", "আপনার সক্রিয় পোর্টফোলিও প্যাকেজ ট্র্যাক এবং পরিচালনা করুন")}</p>
                </div>
                <Link href="/dashboard/products" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px' }}>
                    <i className="fas fa-shopping-cart"></i>
                    {tText("Invest Again", "পুনরায় বিনিয়োগ করুন")}
                </Link>
            </div>

            {/* How It Works Section */}
            <div className="instructions-card" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '30px 20px', marginBottom: '24px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--primary-color)', margin: '0 0 30px 0' }}>
                    {tText("How It Works", "কীভাবে কাজ করে")}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'row', gap: '15px', alignItems: 'stretch', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    
                    {/* Step 1 */}
                    <div style={{ flex: '1', minWidth: '240px', background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '2px solid var(--border-light)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.3s' }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>💰</div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--text-primary)' }}>
                            {tText("Step 1: Start with a Small Investment", "ধাপ ১: অল্প টাকা দিয়ে শুরু করুন")}
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {tText("Invest any amount you can afford.", "আপনার সামর্থ্য অনুযায়ী বিনিয়োগ করুন।")}
                        </p>
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary-color)', fontSize: '24px', flexShrink: 0 }}>→</div>

                    {/* Step 2 */}
                    <div style={{ flex: '1', minWidth: '240px', background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '2px solid var(--border-light)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.3s' }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>📦</div>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-primary)' }}>
                            {tText("Step 2: Choose How to Earn", "ধাপ ২: যেভাবে আয় করতে চান, বেছে নিন")}
                        </h4>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'left', display: 'inline-block', lineHeight: '1.5' }}>
                            <div>• {tText("Sell yourself & earn profit", "নিজে বিক্রি করে লাভ করুন")}</div>
                            <div style={{ margin: '8px 0', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary-color)' }}>{tText("OR", "অথবা")}</div>
                            <div>• {tText("Let us sell & receive a share of the profit", "আমরা বিক্রি করব, আপনি লাভের অংশ পাবেন")}</div>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary-color)', fontSize: '24px', flexShrink: 0 }}>→</div>

                    {/* Step 3 */}
                    <div style={{ flex: '1', minWidth: '240px', background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '2px solid var(--border-light)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.3s' }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>📈</div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--text-primary)' }}>
                            {tText("Step 3: Receive Your Profit", "ধাপ ৩: লাভ গ্রহণ করুন")}
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {tText("Your profit is added to your investment and returned at the end of the investment period.", "নির্ধারিত সময় শেষে মূল টাকা ও লাভ একসাথে ফেরত পাবেন।")}
                        </p>
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary-color)', fontSize: '24px', flexShrink: 0 }}>→</div>

                    {/* Step 4 */}
                    <div style={{ flex: '1', minWidth: '240px', background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '2px solid var(--primary-light)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.3s' }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>🚀</div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--text-primary)' }}>
                            {tText("Step 4: Grow Your Investment", "ধাপ ৪: ধীরে ধীরে এগিয়ে যান")}
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {tText("Start small today and increase your earnings over time.", "আজ অল্প দিয়ে শুরু করুন, ভবিষ্যতে আরও বড় করুন।")}
                        </p>
                    </div>

                </div>
            </div>


            {/* Redesigned 3 Stats Columns */}
            <div className="fintech-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper investments">
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <span className="stat-card-title">{tText("Total Invested", "মোট বিনিয়োগ")}</span>
                    </div>
                    <h3 className="stat-card-value">{formatMoney(totalInvested)}</h3>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper income">
                            <i className="fas fa-coins"></i>
                        </div>
                        <span className="stat-card-title">{tText("Total Profit", "মোট লাভ")}</span>
                    </div>
                    <h3 className="stat-card-value">{formatMoney(totalProfit)}</h3>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper pending">
                            <i className="fas fa-box"></i>
                        </div>
                        <span className="stat-card-title">{tText("Active Investments", "সক্রিয় বিনিয়োগ")}</span>
                    </div>
                    <h3 className="stat-card-value">{tNum(activeCount)}</h3>
                </div>
            </div>

            {/* Filter Selector Tabs */}
            <div className="wallet-tabs-bar">
                <button className={`wallet-tab-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>{tText("All", "সব")}</button>
                <button className={`wallet-tab-btn ${activeFilter === 'active' ? 'active' : ''}`} onClick={() => setActiveFilter('active')}>{tText("Active", "সক্রিয়")}</button>
                <button className={`wallet-tab-btn ${activeFilter === 'self-sell' ? 'active' : ''}`} onClick={() => setActiveFilter('self-sell')}>{tText("Self-Sell", "নিজে বিক্রি")}</button>
                <button className={`wallet-tab-btn ${activeFilter === 'auto-sell' ? 'active' : ''}`} onClick={() => setActiveFilter('auto-sell')}>{tText("Auto-Sell", "অটো-সেল")}</button>
                <button className={`wallet-tab-btn ${activeFilter === 'completed' ? 'active' : ''}`} onClick={() => setActiveFilter('completed')}>{tText("Completed", "সম্পন্ন")}</button>
            </div>

            {/* Active Investments Grid */}
            {filteredInvestments.length === 0 ? (
                <div className="tab-content-card" style={{ textAlign: 'center', padding: '48px' }}>
                    <div className="column-empty-state">
                        <i className="fas fa-chart-pie" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                        <h3>{tText("No investments found", "কোন বিনিয়োগ পাওয়া যায়নি")}</h3>
                        <p style={{ marginBottom: '24px' }}>{tText("Start investing to see your portfolio here", "আপনার পোর্টফোলিও এখানে দেখতে বিনিয়োগ শুরু করুন")}</p>
                        <Link href="/dashboard/products" className="btn btn-primary">
                            {tText("Browse Products", "পণ্য ব্রাউজ করুন")}
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="investments-grid">
                    {filteredInvestments.map((inv) => {
                        const details = getProgressInfo(inv);
                        return (
                            <div key={inv.id} className="investment-card" onClick={() => openDetailsModal(inv)}>
                                <div className="card-header-row">
                                    <div className="card-product-info">
                                        <div className="product-icon-container">
                                            <i className={`fas ${inv.productIcon || 'fa-box'}`}></i>
                                        </div>
                                        <div className="product-title-meta">
                                            <h4>{inv.productName}</h4>
                                            <span>{inv.units} {tText("units", "ইউনিট")}</span>
                                        </div>
                                    </div>
                                    <div className="card-amount-info">
                                        <h3>{formatMoney(inv.amount)}</h3>
                                        <span>+{inv.profitRate}% {tText("return", "রিটার্ন")}</span>
                                    </div>
                                </div>

                                <div className="investment-progress-section">
                                    <div className="progress-meta-row">
                                        <span>{tText("Remaining: ", "অবশিষ্ট: ")}{tNum(details.daysRemaining)} {tText("days", "দিন")}</span>
                                        <strong>{Math.round(details.progress)}%</strong>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-fill" style={{ width: `${details.progress}%` }}></div>
                                    </div>
                                </div>

                                <div className="card-footer-meta">
                                    <span className="mode-tag">
                                        {inv.sellMode === 'self' ? tText('Self-Sell', 'নিজে বিক্রি') : tText('Auto-Sell', 'অটো-সেল')}
                                    </span>
                                    <span className={`status-badge ${inv.status === 'active' ? 'approved' : inv.status === 'completed' ? 'approved' : 'pending'}`}>
                                        {inv.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Details Modal */}
            {selectedInv && modalOpen && (
                <div className="form-modal active" id="detailsModal">
                    <div className="form-modal-content">
                        <div className="form-modal-header">
                            <h3><i className="fas fa-chart-line" style={{ marginRight: '10px', color: 'var(--primary-color)' }}></i>{tText("Investment details", "বিনিয়োগ বিবরণ")}</h3>
                            <button className="form-modal-close" onClick={closeDetailsModal}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="form-modal-body">
                            {(() => {
                                const details = getProgressInfo(selectedInv);
                                return (
                                    <>
                                        <div className="product-summary" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                                <div className="product-icon-container" style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                                                    <i className={`fas ${selectedInv.productIcon || 'fa-box'}`}></i>
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 700 }}>{selectedInv.productName}</h4>
                                                    <span className={`status-badge ${selectedInv.status === 'active' ? 'approved' : 'pending'}`}>
                                                        {selectedInv.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                                                <span>{tText("Invested Amount", "বিনিয়োগের পরিমাণ")}</span>
                                                <strong>{formatMoney(selectedInv.amount)}</strong>
                                            </div>
                                            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                                                <span>{tText("Units", "ইউনিট")}</span>
                                                <strong>{tNum(selectedInv.units)}</strong>
                                            </div>
                                            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                                                <span>{tText("Sell Mode", "বিক্রয় মোড")}</span>
                                                <strong>{selectedInv.sellMode === 'self' ? tText('Self-Sell', 'নিজে বিক্রি') : tText('Auto-Sell', 'অটো-সেল')}</strong>
                                            </div>
                                            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                                                <span>{tText("Profit Rate", "লাভের হার")}</span>
                                                <strong style={{ color: '#10B981' }}>+{selectedInv.profitRate}%</strong>
                                            </div>
                                            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                                                <span>{tText("Expected Profit", "প্রত্যাশিত লাভ")}</span>
                                                <strong style={{ color: '#10B981' }}>{formatMoney(selectedInv.expectedProfit)}</strong>
                                            </div>
                                            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                                                <span>{tText("Duration", "সময়কাল")}</span>
                                                <strong>{tNum(selectedInv.duration)} {tText("days", "দিন")}</strong>
                                            </div>
                                            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                                                <span>{tText("Days Remaining", "অবশিষ্ট দিন")}</span>
                                                <strong>{tNum(details.daysRemaining)} {tText("days", "দিন")}</strong>
                                            </div>
                                            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                                                <span>{tText("Start Date", "শুরু তারিখ")}</span>
                                                <strong>{details.startDateStr}</strong>
                                            </div>
                                            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderBottom: 'none' }}>
                                                <span>{tText("End Date", "শেষ তারিখ")}</span>
                                                <strong>{details.endDateStr}</strong>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{tText("Progress", "অগ্রগতি")}</span>
                                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{Math.round(details.progress)}%</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div className="progress-bar-fill" style={{ width: `${details.progress}%` }}></div>
                                            </div>
                                        </div>

                                        {selectedInv.sellMode === 'self' && selectedInv.status === 'active' && (
                                            <Link 
                                                href={`/dashboard/sell-proofs?investment=${selectedInv.id}`} 
                                                className="btn btn-primary"
                                                style={{ width: '100%', display: 'flex', height: '48px', borderRadius: '14px', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}
                                            >
                                                <i className="fas fa-upload" style={{ marginRight: '8px' }}></i>
                                                {tText("Submit Sell Proof", "বিক্রয় প্রমাণ জমা দিন")}
                                            </Link>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
