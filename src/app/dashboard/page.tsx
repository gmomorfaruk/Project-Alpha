'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';

export default function DashboardPage() {
    const { user } = useAuth();
    const { tText, tNum } = useTranslation();
    const { showToast } = useToast();

    const getTodayIncome = () => {
        if (user?.totalProfit && user.totalProfit > 0) {
            return user.totalProfit / 30;
        }
        
        const isSignedUpToday = user?.createdAt && 
            new Date(user.createdAt).toDateString() === new Date().toDateString();
            
        if (isSignedUpToday) {
            const settings = Storage.get('settings') || {};
            return Number(settings.signupBonus) || 0;
        }
        
        return 0;
    };

    // Data states
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [activeInvestments, setActiveInvestments] = useState<any[]>([]);
    const [sellBonus, setSellBonus] = useState<any>(null);
    const [announcement, setAnnouncement] = useState<any>(null);
    const [showAnnounceModal, setShowAnnounceModal] = useState(false);
    const [showCongratsModal, setShowCongratsModal] = useState(false);
    const [congratsLevel, setCongratsLevel] = useState<any>(null);

    // Mock trend percentages for dynamic fintech styling
    const [trends, setTrends] = useState({
        todayIncome: '12% from yesterday',
        investments: '+18% average return',
        referrals: '+4 signups this week',
        pending: 'All requests verified'
    });

    useEffect(() => {
        if (!user) return;

        // 1. Load active investments
        const investments = Storage.get('investments') || [];
        const userInvestments = investments.filter((inv: any) => 
            inv.userId === user.id && inv.status === 'active'
        );
        setActiveInvestments(userInvestments);

        // 2. Load recent activity (mix of deposits/withdrawals/investments)
        const deposits = Storage.get('deposits') || [];
        const withdrawals = Storage.get('withdrawals') || [];
        const userDeposits = deposits.filter((d: any) => d.userId === user.id);
        const userWithdrawals = withdrawals.filter((w: any) => w.userId === user.id);
        
        const activity = [
            ...userDeposits.map((d: any) => ({
                id: d.id,
                type: 'deposit',
                amount: d.amount,
                status: d.status,
                date: d.createdAt || d.date,
                label: tText('Deposit', 'জমা')
            })),
            ...userWithdrawals.map((w: any) => ({
                id: w.id,
                type: 'withdrawal',
                amount: w.amount,
                status: w.status,
                date: w.createdAt || w.date,
                label: tText('Withdrawal', 'উত্তোলন')
            })),
            ...userInvestments.map((inv: any) => ({
                id: inv.id,
                type: 'investment',
                amount: inv.amount,
                status: 'approved',
                date: inv.createdAt || inv.date,
                label: tText('Investment', 'বিনিয়োগ')
            }))
        ];

        // Sort by date (newest first)
        activity.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentActivity(activity.slice(0, 5)); // Keep only latest 5

        // 3. Load configuration for sell bonus
        const config = Storage.get('config') || {};
        if (config.sellBonusEnabled) {
            setSellBonus({
                points: config.sellBonusPoints || 500,
                percent: config.sellBonusPercent || 5
            });
        }

        // 4. Load latest announcement
        const announcements = Storage.get('announcements') || [];
        const activeAnnounces = announcements.filter((a: any) => a.isActive);
        if (activeAnnounces.length > 0) {
            activeAnnounces.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAnnouncement(activeAnnounces[0]);
            
            const seenKey = `seen_announce_${activeAnnounces[0].id}`;
            if (!sessionStorage.getItem(seenKey)) {
                setShowAnnounceModal(true);
                sessionStorage.setItem(seenKey, 'true');
            }
        }

        // 5. Check congrats modal for level upgrade
        const congratsNotifications = Storage.get('membershipNotifications') || [];
        const pendingCongrats = congratsNotifications.find((n: any) => 
            n.userId === user.email && !n.shown
        );
        if (pendingCongrats) {
            setCongratsLevel({
                name: pendingCongrats.membershipName,
                taskLimit: pendingCongrats.taskLimit || 5
            });
            setShowCongratsModal(true);

            pendingCongrats.shown = true;
            Storage.set('membershipNotifications', congratsNotifications);
        }
    }, [user]);

    const formatMoney = (val: number) => {
        return `৳${tNum((val || 0).toLocaleString())}`;
    };

    const copyReferralCode = () => {
        if (!user) return;
        navigator.clipboard.writeText(user.referralCode || '');
        showToast(tText('Referral code copied!', 'রেফারেল কোড কপি করা হয়েছে!'), 'success');
    };

    const shareReferralLink = () => {
        if (!user) return;
        const link = `${window.location.origin}/signup?ref=${user.referralCode}`;
        navigator.clipboard.writeText(link);
        showToast(tText('Referral link copied to clipboard!', 'রেফারেল লিংক ক্লিপবোর্ডে কপি করা হয়েছে!'), 'success');
    };

    const handleTransferClick = () => {
        showToast(tText('Transfer system coming soon!', 'ট্রান্সফার সিস্টেম শীঘ্রই আসছে!'), 'info');
    };

    return (
        <div className="fintech-dashboard">
            <style jsx global>{`
                /* Modal Styles */
                .form-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(4px);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .form-modal.active {
                    display: flex;
                }
                .form-modal-content {
                    background: var(--bg-card);
                    border-radius: 20px;
                    max-width: 500px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-xl);
                }
                .form-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border-color);
                }
                .form-modal-header h3 {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                    color: var(--text-primary);
                }
                .form-modal-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: none;
                    background: var(--bg-hover);
                    color: var(--text-primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .form-modal-close:hover {
                    background: var(--danger-color);
                    color: white;
                }
                .form-modal-body {
                    padding: 24px;
                }
                .form-modal-footer {
                    padding: 16px 24px;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    justify-content: flex-end;
                }
            `}</style>

            {/* Announcements Banner */}
            {announcement && (
                <div className="announcement-banner">
                    <div className="announcement-banner-info">
                        <i className="fas fa-bullhorn"></i>
                        <span>{announcement.title}</span>
                    </div>
                    <button className="announcement-read-btn" onClick={() => setShowAnnounceModal(true)}>
                        {tText("Read", "পড়ুন")}
                    </button>
                </div>
            )}

            {/* Grid for Balance Card and Portfolio Graph */}
            <div className="dashboard-hero-grid">
                {/* Balance Card */}
                <div className="balance-card-wrapper">
                    {/* Card Brand & Chip detail */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', opacity: 0.8 }}>
                        <div style={{ width: '38px', height: '28px', background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', borderRadius: '6px', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }}>
                            <div style={{ position: 'absolute', top: '15%', left: '15%', width: '70%', height: '70%', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '3px' }}></div>
                        </div>
                        <i className="fas fa-wifi" style={{ transform: 'rotate(90deg)', opacity: 0.5, fontSize: '14px', color: 'white' }}></i>
                    </div>
                    <div className="balance-card-content">
                        <span className="balance-label">{tText("Current Balance", "বর্তমান ব্যালেন্স")}</span>
                        <h2 className="balance-amount">{formatMoney(user?.balance || 0)}</h2>
                        
                        <div className="profit-trend-row">
                            <span className="profit-trend-badge">
                                <i className="fas fa-arrow-up"></i>
                                {formatMoney(user?.totalProfit || 0)}
                            </span>
                            <span className="profit-trend-label">{tText("Today's Profit", "আজকের লাভ")}</span>
                        </div>
                    </div>
                    
                    <div className="balance-card-actions">
                        <Link href="/dashboard/wallet" className="balance-action-btn primary-btn">
                            <i className="fas fa-plus"></i>
                            <span>{tText("Deposit", "জমা")}</span>
                        </Link>
                        <Link href="/dashboard/wallet" className="balance-action-btn secondary-btn">
                            <i className="fas fa-minus"></i>
                            <span>{tText("Withdraw", "উত্তোলন")}</span>
                        </Link>
                        <button className="balance-action-btn secondary-btn" onClick={handleTransferClick}>
                            <i className="fas fa-paper-plane"></i>
                            <span>{tText("Transfer", "ট্রান্সফার")}</span>
                        </button>
                    </div>
                </div>

                {/* Portfolio Graph Visual Illustration */}
                <div className="portfolio-graph-card">
                    <div className="graph-header">
                        <div>
                            <h3>{tText("Earnings Chart", "উপার্জন চার্ট")}</h3>
                            <p>{tText("Performance history", "কর্মক্ষমতা ইতিহাস")}</p>
                        </div>
                        <div className="graph-legend">
                            <span className="legend-dot income"></span>
                            <span>{tText("Income", "আয়")}</span>
                        </div>
                    </div>
                    <div className="graph-visual-wrapper">
                        {/* Custom SVG line chart for premium finish */}
                        <svg className="graph-svg" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradient-chart" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            <path 
                                d="M0,28 Q15,22 30,25 T60,15 T90,8 T100,5" 
                                fill="none" 
                                stroke="#2563EB" 
                                strokeWidth="1.2" 
                                strokeLinecap="round"
                            />
                            <path 
                                d="M0,28 Q15,22 30,25 T60,15 T90,8 T100,5 L100,30 L0,30 Z" 
                                fill="url(#gradient-chart)"
                            />
                            {/* Gridlines */}
                            <line x1="0" y1="10" x2="100" y2="10" stroke="var(--border-color)" strokeWidth="0.1" strokeDasharray="2" />
                            <line x1="0" y1="20" x2="100" y2="20" stroke="var(--border-color)" strokeWidth="0.1" strokeDasharray="2" />
                        </svg>
                        <div className="graph-labels">
                            <span>Mon</span>
                            <span>Wed</span>
                            <span>Fri</span>
                            <span>Sun</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4 Statistics Cards */}
            <div className="fintech-stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper income">
                            <i className="fas fa-coins"></i>
                        </div>
                        <span className="stat-card-title">{tText("Today's Income", "আজকের আয়")}</span>
                    </div>
                    <h3 className="stat-card-value">{formatMoney(getTodayIncome())}</h3>
                    <div className="stat-card-footer positive">
                        <i className="fas fa-arrow-trend-up"></i>
                        <span>{trends.todayIncome}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper investments">
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <span className="stat-card-title">{tText("Total Invested", "মোট বিনিয়োগ")}</span>
                    </div>
                    <h3 className="stat-card-value">{formatMoney(user?.totalInvested || 0)}</h3>
                    <div className="stat-card-footer positive">
                        <i className="fas fa-arrow-trend-up"></i>
                        <span>{trends.investments}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper referrals">
                            <i className="fas fa-users"></i>
                        </div>
                        <span className="stat-card-title">{tText("Referral Earnings", "রেফারেল আয়")}</span>
                    </div>
                    <h3 className="stat-card-value">{formatMoney(user?.referralEarnings || 0)}</h3>
                    <div className="stat-card-footer positive">
                        <i className="fas fa-arrow-trend-up"></i>
                        <span>{trends.referrals}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper pending">
                            <i className="fas fa-clock"></i>
                        </div>
                        <span className="stat-card-title">{tText("Pending Status", "মুলতুবি অবস্থা")}</span>
                    </div>
                    <h3 className="stat-card-value">{tNum(0)}</h3>
                    <div className="stat-card-footer info">
                        <i className="fas fa-check-circle"></i>
                        <span>{trends.pending}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions List */}
            <div className="dashboard-section">
                <h3 className="section-title">{tText("Quick Actions", "দ্রুত পদক্ষেপ")}</h3>
                <div className="quick-actions-row">
                    <Link href="/dashboard/wallet" className="quick-action-item">
                        <div className="action-circle bg-emerald">
                            <i className="fas fa-plus"></i>
                        </div>
                        <span className="action-text">{tText("Deposit", "জমা")}</span>
                    </Link>
                    
                    <Link href="/dashboard/wallet" className="quick-action-item">
                        <div className="action-circle bg-rose">
                            <i className="fas fa-minus"></i>
                        </div>
                        <span className="action-text">{tText("Withdraw", "উত্তোলন")}</span>
                    </Link>
                    
                    <Link href="/dashboard/products" className="quick-action-item">
                        <div className="action-circle bg-blue">
                            <i className="fas fa-shopping-cart"></i>
                        </div>
                        <span className="action-text">{tText("Invest", "বিনিয়োগ")}</span>
                    </Link>
                    
                    <Link href="/dashboard/referrals" className="quick-action-item">
                        <div className="action-circle bg-indigo">
                            <i className="fas fa-share-alt"></i>
                        </div>
                        <span className="action-text">{tText("Share Link", "লিংক শেয়ার")}</span>
                    </Link>
                </div>
            </div>

            {/* Sell Bonus Offer Banner */}
            {sellBonus && (
                <div className="dashboard-section">
                    <div className="premium-banner">
                        <div className="banner-visual-circles">
                            <div className="circle-1"></div>
                            <div className="circle-2"></div>
                        </div>
                        <div className="banner-icon-box">
                            <i className="fas fa-hand-holding-usd"></i>
                        </div>
                        <div className="banner-info-box">
                            <h4>🎁 {tText("Sell & Earn Bonus Points!", "বিক্রি করুন এবং বোনাস পয়েন্ট আয় করুন!")}</h4>
                            <p>{tText("Sell products and earn bonus points! Submit your sell proof and get rewarded.", "পণ্য বিক্রি করুন এবং বোনাস পয়েন্ট অর্জন করুন! আপনার বিক্রয় প্রমাণ জমা দিন এবং পুরস্বৃত হন।")}</p>
                            <div className="banner-tags-wrapper">
                                <span className="banner-tag-item">
                                    <i className="fas fa-coins"></i>
                                    <span>{tNum(sellBonus.points)} {tText("Base Points", "মূল পয়েন্ট")}</span>
                                </span>
                                <span className="banner-tag-item">
                                    <i className="fas fa-percentage"></i>
                                    <span>+{tNum(sellBonus.percent)}% {tText("of Product Value", "পণ্য মূল্যের")}</span>
                                </span>
                            </div>
                        </div>
                        <Link href="/dashboard/sell-proofs" className="banner-cta-button">
                            <span>Submit Proof</span>
                            <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            )}

            {/* Double Column for Activity and Active Investments */}
            <div className="dashboard-double-column">
                {/* Recent Activity */}
                <div className="column-card">
                    <div className="column-header">
                        <h3>{tText("Recent Activity", "সাম্প্রতিক কার্যকলাপ")}</h3>
                        <Link href="/dashboard/wallet" className="view-all-link">
                            {tText("View All", "সব দেখুন")}
                        </Link>
                    </div>
                    <div className="activity-list-container">
                        {recentActivity.length === 0 ? (
                            <div className="column-empty-state">
                                <i className="fas fa-history"></i>
                                <p>{tText("No recent activity", "কোন সাম্প্রতিক কার্যকলাপ নেই")}</p>
                            </div>
                        ) : (
                            recentActivity.map((act) => {
                                const isPending = act.status === 'pending';
                                const isApproved = act.status === 'approved' || act.status === 'completed';
                                const statusBadgeClass = isApproved ? 'approved' : isPending ? 'pending' : 'rejected';
                                const isIncome = act.type === 'deposit';

                                return (
                                    <div key={act.id} className="activity-row-item">
                                        <div className="activity-icon-column">
                                            <div className={`activity-icon-container ${act.type}`}>
                                                <i className={`fas ${act.type === 'deposit' ? 'fa-plus' : act.type === 'withdrawal' ? 'fa-minus' : 'fa-chart-line'}`}></i>
                                            </div>
                                            <div className="activity-info-text">
                                                <h4>{act.label}</h4>
                                                <span>{new Date(act.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="activity-value-column">
                                            <h4 className={`amount-text ${isIncome ? 'income' : 'expense'}`}>
                                                {isIncome ? '+' : '-'}{formatMoney(act.amount)}
                                            </h4>
                                            <span className={`status-badge ${statusBadgeClass}`}>
                                                {act.status === 'pending' ? tText('PENDING', 'মুলতুবি') : act.status === 'approved' || act.status === 'completed' ? tText('APPROVED', 'অনুমোদিত') : tText('REJECTED', 'প্রত্যাখ্যাত')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Active Investments */}
                <div className="column-card">
                    <div className="column-header">
                        <h3>{tText("Active Investments", "সক্রিয় বিনিয়োগ")}</h3>
                        <Link href="/dashboard/investments" className="view-all-link">
                            {tText("View All", "সব দেখুন")}
                        </Link>
                    </div>
                    <div className="activity-list-container">
                        {activeInvestments.length === 0 ? (
                            <div className="column-empty-state">
                                <i className="fas fa-chart-pie"></i>
                                <p>{tText("No active investments", "কোন সক্রিয় বিনিয়োগ নেই")}</p>
                                <Link href="/dashboard/products" className="btn btn-outline btn-sm">
                                    {tText("Start Investing", "বিনিয়োগ শুরু করুন")}
                                </Link>
                            </div>
                        ) : (
                            activeInvestments.map((inv) => (
                                <div key={inv.id} className="activity-row-item">
                                    <div className="activity-icon-column">
                                        <div className="activity-icon-container investment">
                                            <i className="fas fa-box"></i>
                                        </div>
                                        <div className="activity-info-text">
                                            <h4>{inv.productName}</h4>
                                            <span>
                                                {tText("Remaining: ", "অবशिष्ट: ")}{tNum(inv.remainingDays)} {tText("days", "দিন")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="activity-value-column">
                                        <h4 className="amount-text value">{formatMoney(inv.amount)}</h4>
                                        <span className="status-badge approved">
                                            {tText("ACTIVE", "সক্রিয়")}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Announcement Modal Popup */}
            {announcement && (
                <div className={`form-modal ${showAnnounceModal ? 'active' : ''}`} id="announcementPopup">
                    <div className="form-modal-content">
                        <div className="form-modal-header">
                            <h3><i className="fas fa-bullhorn" style={{ marginRight: '10px', color: 'var(--primary-color)' }}></i>{announcement.title}</h3>
                            <button className="form-modal-close" onClick={() => setShowAnnounceModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="form-modal-body" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{announcement.message}</p>
                            {announcement.createdAt && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '15px' }}>
                                    {new Date(announcement.createdAt).toLocaleString()}
                                </span>
                            )}
                        </div>
                        <div className="form-modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowAnnounceModal(false)}>{tText("Got it!", "বুঝেছি!")}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Congrats Level Upgrade Modal */}
            {congratsLevel && (
                <div className={`form-modal ${showCongratsModal ? 'active' : ''}`} id="welcomeCongratsModal">
                    <div className="form-modal-content" style={{ textAlign: 'center' }}>
                        <div className="form-modal-body" style={{ padding: '40px 30px' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '2.5rem', color: 'white', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)' }}>
                                <i className="fas fa-medal"></i>
                            </div>
                            <h2 style={{ margin: '20px 0 10px', color: 'var(--primary-color)' }}>🎉 {tText("Congratulations!", "অভিনন্দন!")}</h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                {tText("You are now a valuable worker of our company!", "আপনি এখন আমাদের কোম্পানির একজন গুরুত্বপূর্ণ কর্মী!")}
                            </p>
                            <div style={{ background: 'var(--primary-gradient)', color: 'white', padding: '15px 25px', borderRadius: '12px', display: 'inline-block' }}>
                                <span style={{ opacity: 0.9, fontSize: '0.9rem', display: 'block' }}>{tText("Your Level", "আপনার লেভেল")}</span>
                                <h3 style={{ margin: '5px 0 0', fontSize: '1.3rem', color: 'white' }}>{congratsLevel.name}</h3>
                                <span style={{ opacity: 0.9, fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>{tNum(congratsLevel.taskLimit)} {tText("Tasks Available", "কাজ উপলব্ধ")}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', margin: '20px 0 0 0' }}>
                                {tText("Start completing tasks and earn money!", "কাজ সম্পন্ন করা শুরু করুন এবং অর্থ উপার্জন করুন!")}
                            </p>
                        </div>
                        <div className="form-modal-footer" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setShowCongratsModal(false)}>{tText("Let's Start!", "চলুন শুরু করি!")}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
