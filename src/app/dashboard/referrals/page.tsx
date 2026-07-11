'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';

interface DownlineReferral {
    id: string;
    name: string;
    email: string;
    joinedAt: string;
    hasInvested: boolean;
    earnings: number;
}

export default function ClientReferralsPage() {
    const { user } = useAuth();
    const { tText } = useTranslation();
    const { showToast } = useToast();

    // Data states
    const [referrals, setReferrals] = useState<DownlineReferral[]>([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [activeReferrals, setActiveReferrals] = useState(0);

    useEffect(() => {
        if (!user) return;
        loadReferralsData();
    }, [user]);

    const loadReferralsData = () => {
        if (!user) return;
        const users = Storage.get('users') || [];
        const fullUser = users.find((u: any) => u.id === user.id);
        
        const refsList = fullUser?.referrals || [];
        setReferrals(refsList);

        // Update statistics
        setTotalEarnings(fullUser?.referralEarnings || 0);
        setActiveReferrals(refsList.filter((r: any) => r.hasInvested).length);
    };

    const copyReferralCode = () => {
        if (!user) return;
        navigator.clipboard.writeText(user.referralCode || '');
        showToast(tText('Referral code copied!', 'রেফারেল কোড কপি করা হয়েছে!'), 'success');
    };

    const shareReferralLink = () => {
        if (!user) return;
        const link = `${window.location.origin}/signup?ref=${user.referralCode}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Join SmartEarnBD',
                text: `Join me on SmartEarnBD and start earning! Use my referral code: ${user.referralCode}`,
                url: link
            }).catch(() => {
                navigator.clipboard.writeText(link);
                showToast(tText('Referral link copied!', 'রেফারেল লিংক কপি করা হয়েছে!'), 'success');
            });
        } else {
            navigator.clipboard.writeText(link);
            showToast(tText('Referral link copied to clipboard!', 'রেফারেল লিংক ক্লিপবোর্ডে কপি করা হয়েছে!'), 'success');
        }
    };

    return (
        <div className="content">
            <div className="page-header">
                <h1>{tText("Referral Program", "রেফারেল প্রোগ্রাম")}</h1>
                <p>{tText("Invite friends and earn rewards", "বন্ধুদের আমন্ত্রণ জানান এবং পুরস্কার উপার্জন করুন")}</p>
            </div>

            {/* Referral Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-icon referral">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">{tText("Total Referrals", "মোট রেফারেল")}</span>
                        <span className="stat-value">{referrals.length}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">{tText("Active Referrals", "সক্রিয় রেফারেল")}</span>
                        <span className="stat-value">{activeReferrals}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon profit">
                        <i className="fas fa-coins"></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">{tText("Total Earnings", "মোট আয়")}</span>
                        <span className="stat-value">৳{totalEarnings.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Referral Code Card */}
            <div className="referral-card" style={{ marginBottom: '30px' }}>
                <div className="referral-info">
                    <h3>{tText("Your Referral Code", "আপনার রেফারেল কোড")}</h3>
                    <p>{tText("Share this code with friends. When they invest, you earn 5% of their first investment!", "বন্ধুদের সাথে এই কোডটি শেয়ার করুন। তারা যখন বিনিয়োগ করবে, আপনি তাদের প্রথম বিনিয়োগের ৫% উপার্জন করবেন!")}</p>
                </div>
                <div className="referral-code-box">
                    <span className="code">{user?.referralCode || 'XXXXXXXX'}</span>
                    <button className="copy-btn" onClick={copyReferralCode}>
                        <i className="fas fa-copy"></i>
                    </button>
                </div>
                <button className="btn btn-light" onClick={shareReferralLink}>
                    <i className="fas fa-share" style={{ marginRight: '6px' }}></i>
                    <span>{tText("Share Link", "লিংক শেয়ার করুন")}</span>
                </button>
            </div>

            {/* How It Works */}
            <div className="section" style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '30px', border: '1px solid var(--border-color)', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '20px', marginTop: 0 }}>{tText("How It Works", "এটি যেভাবে কাজ করে")}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                            <i className="fas fa-share-alt" style={{ fontSize: '24px', color: 'var(--primary-color)' }}></i>
                        </div>
                        <h4 style={{ marginBottom: '8px', marginTop: 0 }}>1. {tText("Share Your Code", "কোড শেয়ার করুন")}</h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{tText("Share your unique referral code or link with friends", "বন্ধুদের সাথে আপনার ইউনিক রেফারেল কোড বা লিংক শেয়ার করুন")}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                            <i className="fas fa-user-plus" style={{ fontSize: '24px', color: 'var(--primary-color)' }}></i>
                        </div>
                        <h4 style={{ marginBottom: '8px', marginTop: 0 }}>2. {tText("Friends Join", "বন্ধুরা যোগ দেবে")}</h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{tText("Friends sign up using your referral code", "বন্ধুরা আপনার রেফারেল কোড ব্যবহার করে সাইন আপ করবে")}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                            <i className="fas fa-coins" style={{ fontSize: '24px', color: 'var(--primary-color)' }}></i>
                        </div>
                        <h4 style={{ marginBottom: '8px', marginTop: 0 }}>3. {tText("Earn Rewards", "পুরস্কার অর্জন")}</h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{tText("Earn 5% of their first investment as reward", "পুরস্কার হিসেবে তাদের প্রথম বিনিয়োগের ৫% অর্জন করুন")}</p>
                    </div>
                </div>
            </div>

            {/* My Referrals List */}
            <div className="section">
                <h2 className="section-title">{tText("My Referrals", "আমার রেফারেলস")}</h2>
                <div className="investments-list">
                    {referrals.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-user-friends"></i>
                            <h3>{tText("No referrals yet", "এখনও কোন রেফারেল নেই")}</h3>
                            <p>{tText("Share your code to start earning!", "উপার্জন শুরু করতে আপনার কোড শেয়ার করুন!")}</p>
                        </div>
                    ) : (
                        referrals.map((ref) => (
                            <div key={ref.id} className="investment-item">
                                <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                    <div 
                                        className="investment-icon" 
                                        style={{ 
                                            background: ref.hasInvested ? 'rgba(16, 185, 129, 0.1)' : 'var(--primary-light)', 
                                            color: ref.hasInvested ? '#10b981' : 'var(--primary-color)',
                                            marginRight: '15px'
                                        }}
                                    >
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div className="investment-details">
                                        <div className="investment-name">{ref.name}</div>
                                        <div className="investment-meta">
                                            <span>Joined {new Date(ref.joinedAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className={`badge badge-${ref.hasInvested ? 'success' : 'warning'}`}>
                                                {ref.hasInvested ? tText('Invested', 'বিনিয়োগ করেছেন') : tText('Pending', 'মুলতুবি')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="investment-stats">
                                    {ref.hasInvested ? (
                                        <>
                                            <div className="investment-amount" style={{ color: 'var(--success-color)' }}>
                                                +৳{(ref.earnings || 0).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tText("Earned", "উপার্জিত")}</div>
                                        </>
                                    ) : (
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{tText("Waiting for investment", "বিনিয়োগের জন্য অপেক্ষা")}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
