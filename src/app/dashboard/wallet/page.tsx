'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'investment' | 'earning' | 'task_earning' | 'admin_adjustment';
    method?: string;
    amount: number;
    txnId?: string;
    transactionId?: string;
    toNumber?: string;
    accountNumber?: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    userId: string;
    userEmail: string;
    userName: string;
    createdAt: string;
}

export default function ClientWalletPage() {
    const { user, updateUserBalance } = useAuth();
    const { tText, tNum } = useTranslation();
    const { showToast } = useToast();

    const formatMoney = (val: number) => {
        return `৳${tNum((val || 0).toLocaleString())}`;
    };

    // Tabs state: 'deposit' | 'withdraw' | 'history'
    const [activeWalletTab, setActiveWalletTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');

    // Data states
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [activeHistoryFilter, setActiveHistoryFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
    const [withdrawInfo, setWithdrawInfo] = useState<any>(null);

    // Deposit Form input
    const [depositAmount, setDepositAmount] = useState('');
    const [depositTxnId, setDepositTxnId] = useState('');
    const [depositMethod, setDepositMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
    const [depositReference, setDepositReference] = useState('');
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [submittingDeposit, setSubmittingDeposit] = useState(false);

    // Withdraw Setup Form input
    const [setupBankAccount, setSetupBankAccount] = useState('');
    const [setupPassword, setSetupPassword] = useState('');
    const [submittingSetup, setSubmittingSetup] = useState(false);

    // Withdraw Form input
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawPasswordInput, setWithdrawPasswordInput] = useState('');
    const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

    useEffect(() => {
        if (!user) return;
        loadTransactionsData();
        
        const info = Storage.get('withdrawInfo_' + user.id);
        if (info) {
            setWithdrawInfo(info);
        }
    }, [user]);

    const loadTransactionsData = () => {
        if (!user) return;
        const allTx = Storage.get('transactions') || [];
        const userTx = allTx.filter((t: any) => t.userId === user.id);
        setTransactions(userTx);
    };

    // Form: Deposit Submit
    const handleDepositSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const amount = Number(depositAmount);
        if (amount < 500) {
            showToast(tText('Minimum deposit is ৳500', 'সর্বনিম্ন জমা ৳৫০০'), 'error');
            return;
        }

        if (depositTxnId.trim().length < 5) {
            showToast(tText('Please enter a valid Transaction ID', 'দয়া করে একটি সঠিক লেনদেন আইডি প্রদান করুন'), 'error');
            return;
        }

        setSubmittingDeposit(true);
        try {
            const newTx: Transaction = {
                id: db.generateId(),
                type: 'deposit',
                method: depositMethod,
                amount: amount,
                txnId: depositTxnId.trim(),
                transactionId: depositTxnId.trim(),
                toNumber: depositReference.trim() || undefined,
                accountNumber: depositReference.trim() || undefined,
                status: 'pending',
                userId: user.id,
                userEmail: user.email,
                userName: user.name || user.fullName || 'User',
                createdAt: new Date().toISOString()
            };

            const allTx = Storage.get('transactions') || [];
            allTx.unshift(newTx);
            Storage.set('transactions', allTx);

            showToast(tText('Deposit request submitted! Waiting for admin approval.', 'জমা দেওয়ার অনুরোধ পাঠানো হয়েছে! এডমিনের অনুমোদনের জন্য অপেক্ষা করুন।'), 'success');
            setDepositAmount('');
            setDepositTxnId('');
            setDepositReference('');
            setScreenshotPreview(null);
            loadTransactionsData();
            setActiveWalletTab('history');
        } catch (err) {
            showToast(tText('An error occurred during submission', 'জমা দিতে কোনো সমস্যা হয়েছে'), 'error');
        } finally {
            setSubmittingDeposit(false);
        }
    };

    // Form: Bank Setup Submit
    const handleSetupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!setupBankAccount.trim()) {
            showToast(tText('Please enter your mobile account number.', 'দয়া করে আপনার অ্যাকাউন্ট নম্বর লিখুন।'), 'error');
            return;
        }

        if (setupPassword.length < 6) {
            showToast(tText('Password must be at least 6 characters.', 'পাসওয়ার্ড ৬ অক্ষরের হতে হবে।'), 'error');
            return;
        }

        setSubmittingSetup(true);
        try {
            const info = {
                bankAccount: setupBankAccount.trim(),
                password: setupPassword
            };
            Storage.set('withdrawInfo_' + user.id, info);
            setWithdrawInfo(info);
            showToast(tText('Withdrawal info saved!', 'উত্তোলন তথ্য সংরক্ষিত হয়েছে!'), 'success');
            setSetupBankAccount('');
            setSetupPassword('');
        } catch (err) {
            showToast(tText('Failed to save bank information', 'তথ্য সংরক্ষণে ব্যর্থ হয়েছে'), 'error');
        } finally {
            setSubmittingSetup(false);
        }
    };

    // Form: Withdraw Submit
    const handleWithdrawSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !withdrawInfo) return;

        const amount = Number(withdrawAmount);
        if (amount < 100) {
            showToast(tText('Minimum withdrawal is ৳100.', 'সর্বনিম্ন উত্তোলন ৳১০০।'), 'error');
            return;
        }

        if (withdrawPasswordInput !== withdrawInfo.password) {
            showToast(tText('Incorrect withdrawal password.', 'ভুল উত্তোলন পাসওয়ার্ড।'), 'error');
            return;
        }

        if (amount > user.balance) {
            showToast(tText('Insufficient wallet balance.', 'পর্যাপ্ত ব্যালেন্স নেই।'), 'error');
            return;
        }

        setSubmittingWithdraw(true);
        try {
            const balanceDeducted = await updateUserBalance(amount, 'deduct');
            if (!balanceDeducted) {
                showToast(tText('Failed to process wallet balance deduction', 'উত্তোলন ব্যালেন্স কর্তনে ব্যর্থ হয়েছে'), 'error');
                return;
            }

            const users = Storage.get('users') || [];
            const idx = users.findIndex((u: any) => u.id === user.id);
            if (idx !== -1) {
                users[idx].balance = user.balance - amount;
                Storage.set('users', users);
                Storage.set('currentUser', users[idx]);
            }

            const newTx: Transaction = {
                id: db.generateId(),
                type: 'withdrawal',
                method: 'bank',
                amount: amount,
                toNumber: withdrawInfo.bankAccount,
                accountNumber: withdrawInfo.bankAccount,
                status: 'pending',
                userId: user.id,
                userEmail: user.email,
                userName: user.name || user.fullName || 'User',
                createdAt: new Date().toISOString()
            };

            const allTx = Storage.get('transactions') || [];
            allTx.unshift(newTx);
            Storage.set('transactions', allTx);

            showToast(tText('Withdrawal request submitted! Waiting for admin approval.', 'উত্তোলন অনুরোধ সফল হয়েছে! অনুমোদনের জন্য অপেক্ষা করুন।'), 'success');
            setWithdrawAmount('');
            setWithdrawPasswordInput('');
            loadTransactionsData();
            setActiveWalletTab('history');
        } catch (err) {
            showToast(tText('An error occurred during submission', 'আবেদন করতে ত্রুটি হয়েছে'), 'error');
        } finally {
            setSubmittingWithdraw(false);
        }
    };

    // Filter transactions for history tab
    const filteredTx = transactions.filter((t) => {
        if (activeHistoryFilter === 'all') return true;
        return t.type === activeHistoryFilter;
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getGatewayNumber = (method: 'bkash' | 'nagad' | 'rocket') => {
        if (method === 'bkash') return '01700000000';
        if (method === 'nagad') return '01800000000';
        return '01900000000';
    };

    return (
        <div className="fintech-wallet-view">
            <style jsx global>{`
                .fintech-wallet-view {
                    max-width: 800px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }
                
                /* Large Revolut-style Balance */
                .wallet-hero-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 40px;
                    text-align: center;
                    box-shadow: var(--shadow-sm);
                    position: relative;
                    overflow: hidden;
                }

                .wallet-hero-card::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 320px;
                    height: 320px;
                    background: radial-gradient(circle, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0) 70%);
                    pointer-events: none;
                }

                .hero-balance-label {
                    font-size: 14px;
                    color: var(--text-secondary);
                    font-weight: 500;
                    margin-bottom: 8px;
                }

                .hero-balance-value {
                    font-size: 54px;
                    font-weight: 800;
                    color: var(--text-primary);
                    letter-spacing: -0.03em;
                    margin: 0;
                }

                /* Tab navigation */
                .wallet-tabs-bar {
                    display: flex;
                    background: var(--bg-hover);
                    padding: 6px;
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                }

                .wallet-tab-btn {
                    flex: 1;
                    padding: 12px;
                    border-radius: 10px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .wallet-tab-btn.active {
                    background: var(--bg-card);
                    color: var(--primary-color);
                    box-shadow: var(--shadow-sm);
                }

                /* General Cards & Forms */
                .tab-content-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 32px;
                    box-shadow: var(--shadow-sm);
                }

                .tab-content-card h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    font-weight: 700;
                }

                .tab-content-card p.subtitle {
                    margin: 0 0 24px 0;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                /* Payment Gateways visual cards */
                .gateways-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                @media (max-width: 576px) {
                    .gateways-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .gateway-card {
                    background: var(--bg-hover);
                    border: 2px solid transparent;
                    border-radius: var(--radius-md);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .gateway-card:hover {
                    transform: translateY(-2px);
                    background: var(--bg-primary);
                }

                .gateway-card.active {
                    border-color: var(--primary-color);
                    background: var(--bg-card);
                    box-shadow: var(--shadow-sm);
                }

                .gateway-logo {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 18px;
                    font-weight: 700;
                }

                .gateway-logo.bkash { background: #E2136E; }
                .gateway-logo.nagad { background: #F47321; }
                .gateway-logo.rocket { background: #8C3494; }

                .gateway-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .gateway-instruction-box {
                    background: var(--primary-light);
                    border: 1px dashed var(--primary-color);
                    border-radius: var(--radius-md);
                    padding: 16px 20px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .gateway-instruction-box i {
                    font-size: 20px;
                    color: var(--primary-color);
                }

                .gateway-instruction-box p {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary);
                    line-height: 1.5;
                }

                /* Drag drop mock zone */
                .screenshot-dropzone {
                    border: 2px dashed var(--border-color);
                    border-radius: var(--radius-md);
                    padding: 24px;
                    text-align: center;
                    cursor: pointer;
                    background: var(--bg-hover);
                    transition: all 0.2s ease;
                    position: relative;
                }

                .screenshot-dropzone:hover {
                    border-color: var(--primary-color);
                    background: var(--bg-card);
                }

                .screenshot-dropzone i {
                    font-size: 24px;
                    color: var(--text-muted);
                    margin-bottom: 8px;
                }

                .screenshot-dropzone p {
                    margin: 0 0 4px 0;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .screenshot-dropzone span {
                    font-size: 11px;
                    color: var(--text-muted);
                }

                .preview-image-box {
                    position: relative;
                    max-width: 150px;
                    margin: 12px auto 0;
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }

                .preview-image-box img {
                    width: 100%;
                    height: auto;
                    display: block;
                }

                .preview-remove-btn {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(15, 23, 42, 0.6);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    cursor: pointer;
                }

                /* Transaction History Styles */
                .history-sub-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 20px;
                }

                .history-sub-btn {
                    padding: 6px 16px;
                    border-radius: var(--radius-full);
                    border: 1px solid var(--border-color);
                    background: var(--bg-card);
                    color: var(--text-secondary);
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .history-sub-btn.active {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }
            `}</style>

            {/* Wallet Balance Hero */}
            <div className="wallet-hero-card">
                <span className="hero-balance-label">{tText("Available Balance", "উপলব্ধ ব্যালেন্স")}</span>
                <h2 className="hero-balance-value">৳{tNum((user?.balance || 0).toLocaleString())}</h2>
            </div>

            {/* Tab switch control */}
            <div className="wallet-tabs-bar">
                <button 
                    className={`wallet-tab-btn ${activeWalletTab === 'deposit' ? 'active' : ''}`}
                    onClick={() => setActiveWalletTab('deposit')}
                >
                    <i className="fas fa-arrow-down" style={{ marginRight: '8px' }}></i>
                    {tText("Deposit", "জমা")}
                </button>
                <button 
                    className={`wallet-tab-btn ${activeWalletTab === 'withdraw' ? 'active' : ''}`}
                    onClick={() => setActiveWalletTab('withdraw')}
                >
                    <i className="fas fa-arrow-up" style={{ marginRight: '8px' }}></i>
                    {tText("Withdraw", "উত্তোলন")}
                </button>
                <button 
                    className={`wallet-tab-btn ${activeWalletTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveWalletTab('history')}
                >
                    <i className="fas fa-history" style={{ marginRight: '8px' }}></i>
                    {tText("History", "ইতিহাস")}
                </button>
            </div>

            {/* Tab: DEPOSIT CONTENT */}
            {activeWalletTab === 'deposit' && (
                <div className="tab-content-card">
                    <h3>{tText("Deposit Funds", "তহবিল জমা")}</h3>
                    <p className="subtitle">{tText("Add funds to your account via mobile financial services", "মোবাইল ফিনান্সিয়াল সার্ভিসের মাধ্যমে অ্যাকাউন্টে অর্থ যোগ করুন")}</p>

                    <form onSubmit={handleDepositSubmit} className="fintech-form">
                        {/* Gateway Selector Cards */}
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '12px' }}>{tText("Select Payment Gateway", "পেমেন্ট গেটওয়ে নির্বাচন করুন")}</label>
                            <div className="gateways-grid">
                                <div 
                                    className={`gateway-card ${depositMethod === 'bkash' ? 'active' : ''}`}
                                    onClick={() => setDepositMethod('bkash')}
                                >
                                    <div className="gateway-logo bkash">b</div>
                                    <span className="gateway-name">bKash</span>
                                </div>
                                <div 
                                    className={`gateway-card ${depositMethod === 'nagad' ? 'active' : ''}`}
                                    onClick={() => setDepositMethod('nagad')}
                                >
                                    <div className="gateway-logo nagad">N</div>
                                    <span className="gateway-name">Nagad</span>
                                </div>
                                <div 
                                    className={`gateway-card ${depositMethod === 'rocket' ? 'active' : ''}`}
                                    onClick={() => setDepositMethod('rocket')}
                                >
                                    <div className="gateway-logo rocket">R</div>
                                    <span className="gateway-name">Rocket</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive instruction box */}
                        <div className="gateway-instruction-box">
                            <i className="fas fa-info-circle"></i>
                            <p>
                                {tText(
                                    `Please send money to our ${depositMethod.toUpperCase()} Personal number: `,
                                    `দয়া করে আমাদের ${depositMethod.toUpperCase()} পার্সোনাল নম্বরে সেন্ড মানি করুন: `
                                )}
                                <strong>{tNum(getGatewayNumber(depositMethod))}</strong>.
                                <br />
                                {tText("Then enter the deposit amount and transaction ID (TrxID) below.", "তারপর নিচে জমার পরিমাণ এবং ট্রানজেকশন আইডি (TrxID) দিন।")}
                            </p>
                        </div>

                        {/* Inputs */}
                        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div className="form-group">
                                <label htmlFor="depositAmount">{tText("Amount", "পরিমাণ")}</label>
                                <input 
                                    type="number" 
                                    id="depositAmount" 
                                    min="500" 
                                    required 
                                    placeholder={tText("Min ৳500", "সর্বনিম্ন ৳৫০০")}
                                    value={depositAmount}
                                    onChange={e => setDepositAmount(e.target.value)}
                                    style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="depositTxnId">{tText("Transaction ID (TrxID)", "লেনদেন আইডি")}</label>
                                <input 
                                    type="text" 
                                    id="depositTxnId" 
                                    required 
                                    placeholder={tText("Enter Transaction ID", "লেনদেন আইডি লিখুন")}
                                    value={depositTxnId}
                                    onChange={e => setDepositTxnId(e.target.value)}
                                    style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label htmlFor="depositReference">{tText("Your Mobile Account Number (Sender)", "আপনার মোবাইল অ্যাকাউন্ট নম্বর (প্রেরক)")}</label>
                            <input 
                                type="text" 
                                id="depositReference" 
                                placeholder={tText("e.g. 017xxxxxxxx", "যেমন: ০১৭xxxxxxxx")}
                                value={depositReference}
                                onChange={e => setDepositReference(e.target.value)}
                                style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        {/* Drag and drop screenshot upload visual */}
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label>{tText("Upload Payment Screenshot", "পেমেন্ট স্ক্রিনশট আপলোড করুন")}</label>
                            <label className="screenshot-dropzone">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                    style={{ display: 'none' }} 
                                />
                                <i className="fas fa-cloud-upload-alt"></i>
                                <p>{tText("Click to select screenshot image", "স্ক্রিনশট ইমেজ নির্বাচন করতে ক্লিক করুন")}</p>
                                <span>{tText("Supports PNG, JPG (Max 5MB)", "PNG, JPG সমর্থন করে (সর্বোচ্চ ৫ মেগাবাইট)")}</span>
                                
                                {screenshotPreview && (
                                    <div className="preview-image-box" onClick={(e) => e.stopPropagation()}>
                                        <img src={screenshotPreview} alt="Screenshot Preview" />
                                        <button 
                                            type="button" 
                                            className="preview-remove-btn"
                                            onClick={() => setScreenshotPreview(null)}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                )}
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ height: '48px', borderRadius: '14px', width: '100%', fontSize: '14px', fontWeight: 600 }}
                            disabled={submittingDeposit}
                        >
                            {submittingDeposit ? tText('Submitting...', 'পাঠানো হচ্ছে...') : tText("Submit Deposit", "জমা অনুরোধ জমা দিন")}
                        </button>
                    </form>
                </div>
            )}

            {/* Tab: WITHDRAW CONTENT */}
            {activeWalletTab === 'withdraw' && (
                <div className="tab-content-card">
                    <h3>{tText("Withdraw Funds", "তহবিল উত্তোলন")}</h3>
                    
                    {/* Setup Bank account details first if not setup */}
                    {!withdrawInfo ? (
                        <>
                            <p className="subtitle">{tText("Please configure your mobile financial account details to request a withdrawal", "উত্তোলন করার জন্য প্রথমে মোবাইল ফিনান্সিয়াল অ্যাকাউন্ট কনফিগার করুন")}</p>
                            <form onSubmit={handleSetupSubmit} className="fintech-form">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label htmlFor="bankAccount">{tText("Account Number (bKash/Nagad Number)", "অ্যাকাউন্ট নম্বর (বিকাশ/নগদ নম্বর)")}</label>
                                    <input 
                                        type="text" 
                                        id="bankAccount" 
                                        required 
                                        placeholder={tText("Enter account number", "অ্যাকাউন্ট নম্বর দিন")}
                                        value={setupBankAccount}
                                        onChange={e => setSetupBankAccount(e.target.value)}
                                        style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label htmlFor="withdrawPassword">{tText("Set Withdrawal Password", "উত্তোলন পাসওয়ার্ড সেট করুন")}</label>
                                    <input 
                                        type="password" 
                                        id="withdrawPassword" 
                                        required 
                                        placeholder={tText("Set password (min 6 chars)", "পাসওয়ার্ড সেট করুন (সর্বনিম্ন ৬ অক্ষর)")}
                                        value={setupPassword}
                                        onChange={e => setSetupPassword(e.target.value)}
                                        style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    style={{ height: '48px', borderRadius: '14px', width: '100%' }}
                                    disabled={submittingSetup}
                                >
                                    {submittingSetup ? tText('Saving...', 'সংরক্ষণ হচ্ছে...') : tText("Save Info", "তথ্য সংরক্ষণ করুন")}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <p className="subtitle" style={{ margin: 0 }}>{tText("Withdraw balance directly to your saved mobile account", "আপনার সংরক্ষিত মোবাইল অ্যাকাউন্টে সরাসরি অর্থ উত্তোলন করুন")}</p>
                                <button 
                                    className="btn btn-sm btn-outline" 
                                    onClick={() => setWithdrawInfo(null)}
                                    style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', minHeight: 'auto' }}
                                >
                                    {tText("Change Info", "তথ্য পরিবর্তন করুন")}
                                </button>
                            </div>

                            <form onSubmit={handleWithdrawSubmit} className="fintech-form">
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label>{tText("Saved Mobile Account Number", "সংরক্ষিত মোবাইল অ্যাকাউন্ট নম্বর")}</label>
                                    <input 
                                        type="text" 
                                        value={withdrawInfo.bankAccount} 
                                        readOnly 
                                        style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                    <div className="form-group">
                                        <label htmlFor="withdrawAmount">{tText("Amount", "পরিমাণ")}</label>
                                        <input 
                                            type="number" 
                                            id="withdrawAmount" 
                                            min="100" 
                                            required 
                                            placeholder={tText("Min ৳100", "সর্বনিম্ন ৳১০০")}
                                            value={withdrawAmount}
                                            onChange={e => setWithdrawAmount(e.target.value)}
                                            style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="withdrawPasswordInput">{tText("Withdrawal Password", "উত্তোলন পাসওয়ার্ড")}</label>
                                        <input 
                                            type="password" 
                                            id="withdrawPasswordInput" 
                                            required 
                                            placeholder={tText("Enter password", "পাসওয়ার্ড লিখুন")}
                                            value={withdrawPasswordInput}
                                            onChange={e => setWithdrawPasswordInput(e.target.value)}
                                            style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    style={{ height: '48px', borderRadius: '14px', width: '100%' }}
                                    disabled={submittingWithdraw}
                                >
                                    {submittingWithdraw ? tText('Processing...', 'প্রক্রিয়াকরণ হচ্ছে...') : tText("Submit Withdrawal", "উত্তোলন অনুরোধ পাঠান")}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}

            {/* Tab: TRANSACTION HISTORY */}
            {activeWalletTab === 'history' && (
                <div className="tab-content-card" style={{ padding: '24px' }}>
                    <div className="column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 style={{ margin: 0 }}>{tText("Transaction Ledger", "লেনদেনের ইতিহাস")}</h3>
                        
                        <div className="history-sub-tabs">
                            <button 
                                className={`history-sub-btn ${activeHistoryFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryFilter('all')}
                            >
                                {tText("All", "সব")}
                            </button>
                            <button 
                                className={`history-sub-btn ${activeHistoryFilter === 'deposit' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryFilter('deposit')}
                            >
                                {tText("Deposits", "জমা")}
                            </button>
                            <button 
                                className={`history-sub-btn ${activeHistoryFilter === 'withdrawal' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryFilter('withdrawal')}
                            >
                                {tText("Withdrawals", "উত্তোলন")}
                            </button>
                        </div>
                    </div>

                    <div className="activity-list-container">
                        {filteredTx.length === 0 ? (
                            <div className="column-empty-state">
                                <i className="fas fa-exchange-alt"></i>
                                <p>{tText("No transactions found", "কোন লেনদেন পাওয়া যায়নি")}</p>
                            </div>
                        ) : (
                            filteredTx.map((t) => {
                                const isPending = t.status === 'pending';
                                const isApproved = t.status === 'approved' || t.status === 'completed';
                                const statusBadgeClass = isApproved ? 'approved' : isPending ? 'pending' : 'rejected';
                                const isDeposit = t.type === 'deposit';

                                return (
                                    <div key={t.id} className="activity-row-item">
                                        <div className="activity-icon-column">
                                            <div className={`activity-icon-container ${t.type}`}>
                                                <i className={`fas ${isDeposit ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                            </div>
                                            <div className="activity-info-text">
                                                <h4>
                                                    {isDeposit 
                                                        ? tText('Deposit via ' + t.method?.toUpperCase(), (t.method === 'bkash' ? 'বিকাশ' : t.method === 'nagad' ? 'নগদ' : t.method?.toUpperCase()) + ' এর মাধ্যমে জমা') 
                                                        : tText('Withdrawal via ' + t.method?.toUpperCase(), (t.method === 'bank' ? 'ব্যাংক' : t.method?.toUpperCase()) + ' এর মাধ্যমে উত্তোলন')}
                                                </h4>
                                                <span>
                                                    {isDeposit 
                                                        ? tText('TxnID: ', 'লেনদেন আইডি: ') + t.txnId 
                                                        : tText('To: ', 'প্রাপক: ') + t.toNumber}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="activity-value-column">
                                            <h4 className={`amount-text ${isDeposit ? 'income' : 'expense'}`}>
                                                {isDeposit ? '+' : '-'}{formatMoney(t.amount)}
                                            </h4>
                                            <span className={`status-badge ${statusBadgeClass}`}>
                                                {t.status === 'pending' ? tText('Pending', 'মুলতুবি') : t.status === 'approved' || t.status === 'completed' ? tText('Approved', 'অনুমোদিত') : tText('Rejected', 'প্রত্যাখ্যাত')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
