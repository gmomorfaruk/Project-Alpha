'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

interface MembershipPlan {
    id: string;
    name: string;
    price: number;
    taskLimit: number;
    dailyEarningLimit: number;
    earningsMultiplier: number;
    withdrawalMin: number;
    withdrawalMax: number;
    features: string[];
    color: string;
    icon: string;
}

const plans: Record<string, MembershipPlan> = {
    free: {
        id: 'free',
        name: 'Free Member',
        price: 0,
        taskLimit: 5,
        dailyEarningLimit: 50,
        earningsMultiplier: 1.0,
        withdrawalMin: 500,
        withdrawalMax: 1000,
        features: ['Basic Tasks', 'Profile Access', 'Standard support'],
        color: '#64748B',
        icon: 'fa-user'
    },
    junior: {
        id: 'junior',
        name: 'Junior',
        price: 500,
        taskLimit: 15,
        dailyEarningLimit: 200,
        earningsMultiplier: 1.2,
        withdrawalMin: 300,
        withdrawalMax: 3000,
        features: ['All Free Features', 'YouTube Tasks Available', '20% Bonus Earnings'],
        color: '#10B981',
        icon: 'fa-seedling'
    },
    assistant: {
        id: 'assistant',
        name: 'Assistant',
        price: 1500,
        taskLimit: 30,
        dailyEarningLimit: 500,
        earningsMultiplier: 1.5,
        withdrawalMin: 200,
        withdrawalMax: 5000,
        features: ['All Junior Features', 'Social Tasks Available', '50% Bonus Earnings', 'Priority Support'],
        color: '#2563EB',
        icon: 'fa-user-tie'
    },
    senior: {
        id: 'senior',
        name: 'Senior',
        price: 3000,
        taskLimit: 50,
        dailyEarningLimit: 1000,
        earningsMultiplier: 2.0,
        withdrawalMin: 100,
        withdrawalMax: 10000,
        features: ['All Assistant Features', 'Exclusive Tasks Access', '100% Bonus Earnings', '24/7 VIP Support'],
        color: '#8B5CF6',
        icon: 'fa-crown'
    },
    vip: {
        id: 'vip',
        name: 'VIP Member',
        price: 5000,
        taskLimit: -1, // Unlimited
        dailyEarningLimit: -1, // Unlimited
        earningsMultiplier: 3.0,
        withdrawalMin: 50,
        withdrawalMax: 50000,
        features: ['Unlimited Tasks & Earnings', '200% Bonus Earnings', 'Personal Account Manager', 'Instant Withdrawal Access'],
        color: '#F59E0B',
        icon: 'fa-gem'
    }
};

const adminPaymentAccounts = {
    bkash: {
        name: 'bKash',
        number: '01700000000',
        type: 'Personal',
        color: '#E2136E',
        instructions: 'Send money to this bKash number and copy the Transaction ID'
    },
    nagad: {
        name: 'Nagad',
        number: '01800000000',
        type: 'Personal',
        color: '#F6921E',
        instructions: 'Send money to this Nagad number and copy the Transaction ID'
    }
};

export default function ClientMembershipPage() {
    const { user } = useAuth();
    const { tText, tNum } = useTranslation();
    const { showToast } = useToast();

    // Purchase wizard state
    const [modalOpen, setModalOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Choose level/payment, 2: Payment instructions, 3: Enter TRX, 4: Success
    
    const [selectedLevelId, setSelectedLevelId] = useState<string>('');
    const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad'>('bkash');
    
    const [senderNumber, setSenderNumber] = useState('');
    const [txnId, setTxnId] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [generatedRequestId, setGeneratedRequestId] = useState('');

    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        loadPendingRequests();
    }, [user]);

    const loadPendingRequests = () => {
        if (!user) return;
        const allRequests = Storage.get('membershipRequests') || [];
        const userPending = allRequests.filter(
            (r: any) => r.userId === user.id && r.status === 'pending'
        );
        setPendingRequests(userPending);
    };

    const handleOpenUpgrade = (levelId?: string) => {
        if (levelId) {
            setSelectedLevelId(levelId);
        } else {
            setSelectedLevelId('');
        }
        setStep(1);
        setSenderNumber('');
        setTxnId('');
        setPaymentNote('');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        loadPendingRequests();
    };

    const handleCopyNumber = (num: string) => {
        navigator.clipboard.writeText(num);
        showToast(tText('Number copied to clipboard!', 'নম্বর কপি করা হয়েছে!'), 'success');
    };

    const goToStep2 = () => {
        if (!selectedLevelId) {
            showToast('Please select a membership tier', 'error');
            return;
        }
        const plan = plans[selectedLevelId];
        if (plan.price === 0) {
            showToast('Cannot purchase the free membership', 'error');
            return;
        }
        setStep(2);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedLevelId) return;

        if (!senderNumber.trim()) {
            showToast('Please enter your sender mobile number', 'error');
            return;
        }

        if (txnId.trim().length < 5) {
            showToast('Please enter a valid Transaction ID', 'error');
            return;
        }

        setSubmittingPayment(true);
        try {
            const reqId = db.generateId();
            const newRequest = {
                id: reqId,
                userId: user.id,
                userEmail: user.email,
                userName: user.name || user.fullName || 'User',
                membershipId: selectedLevelId,
                membershipName: plans[selectedLevelId].name,
                price: plans[selectedLevelId].price,
                paymentMethod: selectedMethod,
                senderNumber: senderNumber.trim(),
                txnId: txnId.trim(),
                transactionId: txnId.trim(),
                note: paymentNote.trim(),
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            const allRequests = Storage.get('membershipRequests') || [];
            allRequests.unshift(newRequest);
            Storage.set('membershipRequests', allRequests);

            setGeneratedRequestId(reqId);
            setStep(4);
            showToast('Upgrade request submitted!', 'success');
        } catch (err) {
            showToast('Failed to submit purchase request', 'error');
        } finally {
            setSubmittingPayment(false);
        }
    };

    const currentPlan = plans[user?.membership || 'free'] || plans.free;

    return (
        <div className="fintech-membership-view">
            <style jsx global>{`
                .fintech-membership-view {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                /* Current membership hero card banner */
                .membership-hero-banner {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 24px 32px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: var(--shadow-sm);
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .membership-hero-left {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .membership-hero-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 20px;
                }

                .membership-hero-info h3 {
                    margin: 0 0 4px 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .membership-hero-info p {
                    margin: 0;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                /* Pricing Matrix layout */
                .pricing-matrix-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    align-items: stretch;
                }

                @media (max-width: 1200px) {
                    .pricing-matrix-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .pricing-matrix-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .pricing-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 32px;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .pricing-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-card-hover);
                }

                .pricing-card-badge {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 3px 10px;
                    border-radius: var(--radius-full);
                }

                .pricing-card-badge.current {
                    background: rgba(16, 185, 129, 0.08);
                    color: #10B981;
                }

                .pricing-card-badge.popular {
                    background: rgba(37, 99, 235, 0.08);
                    color: #2563EB;
                }

                .pricing-card-header {
                    margin-bottom: 24px;
                }

                .pricing-plan-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 18px;
                    margin-bottom: 16px;
                }

                .pricing-plan-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 8px 0;
                }

                .pricing-plan-price {
                    font-size: 32px;
                    font-weight: 800;
                    color: var(--text-primary);
                    letter-spacing: -0.02em;
                    margin: 0;
                }

                .pricing-plan-price span {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .pricing-plan-period {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin: 2px 0 0 0;
                }

                .pricing-features-list {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 24px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    flex: 1;
                }

                .pricing-features-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    font-size: 13px;
                    color: var(--text-secondary);
                    line-height: 1.4;
                }

                .pricing-features-list li i {
                    color: #10B981;
                    font-size: 12px;
                    margin-top: 2px;
                }

                .pricing-stats-summary {
                    background: var(--bg-hover);
                    border-radius: var(--radius-md);
                    padding: 16px;
                    margin-bottom: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .pricing-stat-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: var(--text-primary);
                }

                .pricing-stat-row span:first-child {
                    color: var(--text-secondary);
                }

                .pricing-stat-row strong {
                    font-weight: 600;
                }

                .pricing-action-button {
                    width: 100%;
                    height: 48px;
                    border-radius: var(--radius-md);
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .pricing-action-button.upgrade {
                    background: var(--primary-color);
                    color: white;
                }

                .pricing-action-button.upgrade:hover {
                    background: var(--primary-dark);
                }

                .pricing-action-button.current-btn {
                    background: var(--bg-hover);
                    color: var(--text-secondary);
                    cursor: not-allowed;
                }
            `}</style>

            <div className="page-header">
                <h1>{tText("Membership Plans", "মেম্বারশিপ প্ল্যান")}</h1>
                <p>{tText("Upgrade your membership tier to unlock higher task rates and withdrawal limits", "উচ্চতর টাস্ক রেট এবং উত্তোলনের সীমা আনলক করতে আপনার মেম্বারশিপ লেভেল আপগ্রেড করুন")}</p>
            </div>

            {/* Current Active Plan Header Card */}
            <div className="membership-hero-banner">
                <div className="membership-hero-left">
                    <div className="membership-hero-icon" style={{ background: currentPlan.color }}>
                        <i className={`fas ${currentPlan.icon}`}></i>
                    </div>
                    <div className="membership-hero-info">
                        <h3>{currentPlan.name} ({tText("Current Plan", "বর্তমান প্ল্যান")})</h3>
                        <p>
                            {currentPlan.taskLimit === -1 ? tText('Unlimited Tasks', 'সীমাহীন কাজ') : `${tNum(currentPlan.taskLimit)} ${tText('tasks/day', 'কাজ/দিন')}`} •{' '}
                            {currentPlan.dailyEarningLimit === -1 ? tText('Unlimited Earnings', 'সীমাহীন উপার্জন') : `৳${tNum(currentPlan.dailyEarningLimit)} ${tText('Limit', 'লিমিট')}`} •{' '}
                            {tNum(currentPlan.earningsMultiplier)}x {tText('Earnings Multiplier', 'উপার্জন গুণক')}
                        </p>
                    </div>
                </div>
                {user?.membership !== 'vip' && (
                    <button className="btn btn-primary" onClick={() => handleOpenUpgrade()} style={{ height: '44px', borderRadius: '12px' }}>
                        <i className="fas fa-crown" style={{ marginRight: '8px' }}></i> {tText("Upgrade Plan", "আপগ্রেড করুন")}
                    </button>
                )}
            </div>

            {/* Matrix of Membership pricing plans */}
            <div className="pricing-matrix-grid">
                {Object.values(plans).map((plan) => {
                    const isCurrent = user?.membership === plan.id || (!user?.membership && plan.id === 'free');
                    const hasPending = pendingRequests.some((r) => r.membershipId === plan.id);

                    let buttonText = tText('Upgrade Tier', 'আপগ্রেড করুন');
                    let buttonClass = 'upgrade';
                    let isDisabled = false;

                    if (isCurrent) {
                        buttonText = tText('Current Active', 'চলতি প্ল্যান');
                        buttonClass = 'current-btn';
                        isDisabled = true;
                    } else if (plan.id === 'free') {
                        buttonText = tText('Default Plan', 'ডিফল্ট প্ল্যান');
                        buttonClass = 'current-btn';
                        isDisabled = true;
                    } else if (hasPending) {
                        buttonText = tText('⏳ Verification Pending', '⏳ মুলতুবি আছে');
                        buttonClass = 'current-btn';
                        isDisabled = true;
                    }

                    return (
                        <div 
                            key={plan.id} 
                            className="pricing-card" 
                            style={{ 
                                borderTop: `6px solid ${plan.color}`
                            }}
                        >
                            {isCurrent && (
                                <span className="pricing-card-badge current">{tText("ACTIVE", "সক্রিয়")}</span>
                            )}
                            {!isCurrent && plan.id === 'assistant' && (
                                <span className="pricing-card-badge popular">{tText("POPULAR", "জনপ্রিয়")}</span>
                            )}

                            <div className="pricing-card-header">
                                <div className="pricing-plan-icon" style={{ background: plan.color }}>
                                    <i className={`fas ${plan.icon}`}></i>
                                </div>
                                <h3 className="pricing-plan-name">{plan.name}</h3>
                                <h2 className="pricing-plan-price">
                                    {plan.price === 0 ? 'Free' : `৳${tNum(plan.price.toLocaleString())}`}
                                    {plan.price > 0 && <span>/{tText("lifetime", "আজীবন")}</span>}
                                </h2>
                                <p className="pricing-plan-period">
                                    {plan.price === 0 ? tText('Free forever', 'চিরকাল ফ্রি') : tText('One-time checkout payment', 'এককালীন পেমেন্ট')}
                                </p>
                            </div>

                            <ul className="pricing-features-list">
                                {plan.features.map((feat, i) => (
                                    <li key={i}>
                                        <i className="fas fa-check-circle"></i>
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pricing-stats-summary">
                                <div className="pricing-stat-row">
                                    <span>{tText("Daily Work Limit", "দৈনিক কাজের সীমা")}</span>
                                    <strong>{plan.taskLimit === -1 ? tText('Unlimited', 'সীমাহীন') : `${tNum(plan.taskLimit)} Tasks`}</strong>
                                </div>
                                <div className="pricing-stat-row">
                                    <span>{tText("Earnings Multiplier", "উপার্জন গুণক")}</span>
                                    <strong>{tNum(plan.earningsMultiplier)}x</strong>
                                </div>
                                <div className="pricing-stat-row">
                                    <span>{tText("Min Withdrawal", "সর্বনিম্ন উত্তোলন")}</span>
                                    <strong>৳{tNum(plan.withdrawalMin)}</strong>
                                </div>
                            </div>

                            <button 
                                className={`pricing-action-button ${buttonClass}`}
                                disabled={isDisabled}
                                onClick={() => handleOpenUpgrade(plan.id)}
                            >
                                {buttonText}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Purchase Membership wizard modal popup */}
            {modalOpen && (
                <div className="form-modal active" id="upgradeWizardModal">
                    <div className="form-modal-content">
                        <div className="form-modal-header">
                            <h3>
                                <i className="fas fa-crown" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i> 
                                {tText("Purchase Membership Tier Upgrade", "মেম্বারশিপ লেভেল আপগ্রেড করুন")}
                            </h3>
                            <button className="form-modal-close" onClick={handleCloseModal}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="form-modal-body">
                            {/* Step 1: Select upgrade level and payment gateway */}
                            {step === 1 && (
                                <div className="payment-step">
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label htmlFor="tierSelect"><i className="fas fa-crown" style={{ marginRight: '6px' }}></i> {tText("Select Target Membership Level", "মেম্বারশিপ লেভেল চয়ন করুন")}</label>
                                        <select 
                                            className="tier-select" 
                                            id="tierSelect" 
                                            value={selectedLevelId}
                                            onChange={e => setSelectedLevelId(e.target.value)}
                                            style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="">-- Choose a Membership --</option>
                                            {Object.values(plans).filter(p => p.price > 0).map(p => (
                                                <option key={p.id} value={p.id}>{p.name} (৳{tNum(p.price)})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedLevelId && (
                                        <div style={{ border: '1px solid var(--primary-color)', padding: '16px', borderRadius: '14px', textAlign: 'center', marginBottom: '24px', background: 'var(--primary-light)' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Amount to Checkout Payment</span>
                                            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '-0.02em', margin: '4px 0' }}>৳{tNum(plans[selectedLevelId].price.toLocaleString())}</div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {plans[selectedLevelId].taskLimit === -1 ? 'Unlimited' : plans[selectedLevelId].taskLimit} tasks/day • {plans[selectedLevelId].earningsMultiplier}x Multiplier
                                            </span>
                                        </div>
                                    )}

                                    <label style={{ display: 'block', marginBottom: '12px' }}><i className="fas fa-wallet" style={{ marginRight: '6px' }}></i> {tText("Select Payment Gateway", "পেমেন্ট পদ্ধতি চয়ন করুন")}</label>
                                    <div className="payment-methods-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                        <div 
                                            className={`gateway-card ${selectedMethod === 'bkash' ? 'active' : ''}`}
                                            onClick={() => setSelectedMethod('bkash')}
                                            style={{ padding: '16px', flexDirection: 'row', justifyContent: 'flex-start', border: selectedMethod === 'bkash' ? '2px solid var(--primary-color)' : '2px solid transparent' }}
                                        >
                                            <div className="gateway-logo bkash" style={{ width: '36px', height: '36px', fontSize: '14px' }}>b</div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>bKash</h4>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MFS checkout</span>
                                            </div>
                                        </div>
                                        <div 
                                            className={`gateway-card ${selectedMethod === 'nagad' ? 'active' : ''}`}
                                            onClick={() => setSelectedMethod('nagad')}
                                            style={{ padding: '16px', flexDirection: 'row', justifyContent: 'flex-start', border: selectedMethod === 'nagad' ? '2px solid var(--primary-color)' : '2px solid transparent' }}
                                        >
                                            <div className="gateway-logo nagad" style={{ width: '36px', height: '36px', fontSize: '14px' }}>N</div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Nagad</h4>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MFS checkout</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        className="btn btn-primary" 
                                        onClick={goToStep2}
                                        style={{ height: '48px', borderRadius: '14px', width: '100%', fontSize: '14px', fontWeight: 600 }}
                                    >
                                        <span>Continue to Checkout</span> 
                                        <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Pay details instructions */}
                            {step === 2 && selectedLevelId && (
                                <div className="payment-step">
                                    <div className="payment-instructions-box" style={{ background: 'var(--bg-hover)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                                        <div className="payment-method-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: adminPaymentAccounts[selectedMethod].color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                                {selectedMethod[0].toUpperCase()}
                                            </div>
                                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Send money via {adminPaymentAccounts[selectedMethod].name}</h4>
                                        </div>

                                        <div className="payment-number-box" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '14px', marginBottom: '16px' }}>
                                            <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                Send exactly <strong style={{ color: 'var(--text-primary)' }}>৳{tNum(plans[selectedLevelId].price)} BDT</strong> to:
                                            </p>
                                            <div className="copy-number-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: '10px', border: '1px dashed var(--primary-color)' }}>
                                                <span className="payment-number" style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '1px', color: 'var(--primary-color)' }}>{adminPaymentAccounts[selectedMethod].number}</span>
                                                <button className="copy-btn" onClick={() => handleCopyNumber(adminPaymentAccounts[selectedMethod].number)} style={{ width: '36px', height: '36px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <i className="fas fa-copy"></i>
                                                </button>
                                            </div>
                                            <p className="account-type" style={{ margin: '10px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                ({adminPaymentAccounts[selectedMethod].type} Account type)
                                            </p>
                                        </div>

                                        <div className="instructions-text" style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '12px', textAlign: 'left', fontSize: '13px', border: '1px solid var(--primary-color)' }}>
                                            <h5 style={{ margin: '0 0 6px 0', color: 'var(--primary-color)', fontWeight: 700 }}>Steps:</h5>
                                            <ol style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-primary)' }}>
                                                <li>Open your {adminPaymentAccounts[selectedMethod].name} app.</li>
                                                <li>Select the "Send Money" transaction option.</li>
                                                <li>Enter the copied number and checkout transfer ৳{tNum(plans[selectedLevelId].price)}.</li>
                                                <li>Copy the transaction reference ID (TrxID) from receipt.</li>
                                            </ol>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                        <button className="btn btn-outline" onClick={() => setStep(1)} style={{ flex: 1, height: '48px', borderRadius: '14px' }}>
                                            <i className="fas fa-arrow-left"></i> Back
                                        </button>
                                        <button className="btn btn-primary" onClick={() => setStep(3)} style={{ flex: 2, height: '48px', borderRadius: '14px' }}>
                                            <span>I Sent Money</span> 
                                            <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Enter transaction verification ID */}
                            {step === 3 && selectedLevelId && (
                                <form onSubmit={handlePaymentSubmit}>
                                    <div className="trx-form" style={{ textAlign: 'center' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 16px' }}>
                                            <i className="fas fa-receipt"></i>
                                        </div>
                                        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700 }}>Verification Details</h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px 0' }}>
                                            Submit transfer verification details to verify your payment status
                                        </p>

                                        <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                                            <label htmlFor="trxIdInput">Transaction ID (TrxID) *</label>
                                            <input 
                                                type="text" 
                                                id="trxIdInput" 
                                                required 
                                                placeholder="e.g., TRX987654321"
                                                value={txnId}
                                                onChange={e => setTxnId(e.target.value)}
                                                style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                            />
                                        </div>

                                        <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                                            <label htmlFor="senderNumberInput">Sender Mobile Number (Your MFS Account) *</label>
                                            <input 
                                                type="text" 
                                                id="senderNumberInput" 
                                                required 
                                                placeholder="e.g., 01712345678"
                                                value={senderNumber}
                                                onChange={e => setSenderNumber(e.target.value)}
                                                style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                            />
                                        </div>

                                        <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
                                            <label htmlFor="paymentNoteInput">Checkout Notes (Optional)</label>
                                            <textarea 
                                                id="paymentNoteInput" 
                                                rows={2} 
                                                placeholder="Enter any reference notes..."
                                                value={paymentNote}
                                                onChange={e => setPaymentNote(e.target.value)}
                                                style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)', outline: 'none' }}
                                            />
                                        </div>

                                        <div className="payment-summary" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '14px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span>Tier upgrading to</span>
                                                <strong>{plans[selectedLevelId].name}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span>Total amount checked</span>
                                                <strong style={{ color: 'var(--primary-color)' }}>৳{tNum(plans[selectedLevelId].price)} BDT</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span>Payment MFS Gateway</span>
                                                <strong>{adminPaymentAccounts[selectedMethod].name}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                        <button type="button" className="btn btn-outline" onClick={() => setStep(2)} style={{ flex: 1, height: '48px', borderRadius: '14px' }}>
                                            <i className="fas fa-arrow-left"></i> Back
                                        </button>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 2, height: '48px', borderRadius: '14px' }} disabled={submittingPayment}>
                                            {submittingPayment ? 'Verifying...' : 'Submit Verification'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Step 4: Success view */}
                            {step === 4 && (
                                <div className="success-box" style={{ textAlign: 'center', padding: '16px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>
                                        <i className="fas fa-check-circle"></i>
                                    </div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Request Submitted!</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        Your membership purchase transaction details has been logged. Admin reviewers will verify payments within 1-24 hours to automatically upgrade your profile status level.
                                    </p>
                                    <div className="request-id-box" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '14px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Request ID:</span>
                                        <strong style={{ color: 'var(--primary-color)', fontSize: '14px' }}>{generatedRequestId}</strong>
                                    </div>
                                    <button className="btn btn-primary" onClick={handleCloseModal} style={{ marginTop: '24px', width: '100%', height: '48px', borderRadius: '14px' }}>
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
