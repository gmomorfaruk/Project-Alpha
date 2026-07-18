'use client';

import React, { useState, useEffect } from 'react';
import Storage from '@/lib/storage';
import { useToast } from '@/context/ToastContext';

interface Investment {
    id: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    productId: string;
    productName: string;
    productIcon?: string;
    amount: number;
    units: number;
    sellMode: 'auto' | 'self';
    profitRate: number;
    duration: number;
    expectedProfit: number;
    totalReturn: number;
    status: 'active' | 'completed' | 'pending_proof';
    createdAt: string;
}

interface UserRecord {
    id: string;
    name: string;
    email: string;
    balance: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    profitRate?: number;
    returnRate?: number;
    duration?: number;
    icon?: string;
}

export default function AdminInvestmentsPage() {
    const { showToast } = useToast();

    const [investments, setInvestments] = useState<Investment[]>([]);
    const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterMode, setFilterMode] = useState('all');

    // Stats
    const [totalInvested, setTotalInvested] = useState(0);
    const [totalExpectedProfit, setTotalExpectedProfit] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);

    // View Detail Modal
    const [selectedInv, setSelectedInv] = useState<Investment | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Add Investment Modal
    const [addOpen, setAddOpen] = useState(false);
    const [addUserId, setAddUserId] = useState('');
    const [addProductId, setAddProductId] = useState('');
    const [addUnits, setAddUnits] = useState('1');
    const [addSellMode, setAddSellMode] = useState<'auto' | 'self'>('auto');
    const [addLoading, setAddLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const allInv: Investment[] = Storage.get('investments') || [];
        const users: UserRecord[] = Storage.get('users') || [];
        const products: Product[] = Storage.get('products') || [];

        setAllUsers(users.filter((u: any) => u.role !== 'admin'));
        setAllProducts(products);

        // Enrich investments with user info
        const enriched = allInv.map((inv) => {
            const user = users.find((u) => u.id === inv.userId || u.email === inv.userId);
            return {
                ...inv,
                userEmail: inv.userEmail || user?.email || inv.userId,
                userName: inv.userName || user?.name || 'Unknown',
            };
        });

        setInvestments(enriched);

        const active = enriched.filter((i) => i.status === 'active');
        const completed = enriched.filter((i) => i.status === 'completed');
        setTotalInvested(enriched.reduce((s, i) => s + (i.amount || 0), 0));
        setTotalExpectedProfit(enriched.reduce((s, i) => s + (i.expectedProfit || 0), 0));
        setActiveCount(active.length);
        setCompletedCount(completed.length);
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
            endDateStr: new Date(end).toLocaleDateString(),
            startDateStr: new Date(start).toLocaleDateString(),
        };
    };

    // Admin manually adds investment for a user
    const handleAddInvestment = (e: React.FormEvent) => {
        e.preventDefault();
        setAddLoading(true);

        try {
            const user = allUsers.find((u) => u.id === addUserId);
            const product = allProducts.find((p) => p.id === addProductId);
            if (!user || !product) {
                showToast('Please select a valid user and product', 'error');
                setAddLoading(false);
                return;
            }

            const units = parseInt(addUnits) || 1;
            const amount = product.price * units;
            const profitRate = product.profitRate || product.returnRate || 10;
            const duration = product.duration || 30;
            const expectedProfit = Math.round(amount * (profitRate / 100));
            const totalReturn = amount + expectedProfit;

            const newInvestment: Investment = {
                id: 'INV' + Date.now(),
                userId: user.id,
                userEmail: user.email,
                userName: user.name,
                productId: product.id,
                productName: product.name,
                productIcon: product.icon || 'fa-box',
                amount,
                units,
                sellMode: addSellMode,
                profitRate,
                duration,
                expectedProfit,
                totalReturn,
                status: 'active',
                createdAt: new Date().toISOString(),
            };

            // Deduct balance from user
            const users = Storage.get('users') || [];
            const uIdx = users.findIndex((u: any) => u.id === user.id);
            if (uIdx !== -1) {
                if ((users[uIdx].balance || 0) < amount) {
                    showToast(`User balance (৳${users[uIdx].balance || 0}) is less than investment amount (৳${amount})`, 'error');
                    setAddLoading(false);
                    return;
                }
                users[uIdx].balance = (users[uIdx].balance || 0) - amount;
                users[uIdx].totalInvested = (users[uIdx].totalInvested || 0) + amount;
                Storage.set('users', users);

                // Update currentUser session if it's the same person
                const curr = Storage.get('currentUser');
                if (curr && curr.id === user.id) {
                    curr.balance = users[uIdx].balance;
                    Storage.set('currentUser', curr);
                }
            }

            // Save investment
            const allInv = Storage.get('investments') || [];
            allInv.push(newInvestment);
            Storage.set('investments', allInv);

            // Log transaction
            const txns = Storage.get('transactions') || [];
            txns.push({
                id: 'TX' + Date.now(),
                userId: user.id,
                userEmail: user.email,
                userName: user.name,
                type: 'investment',
                amount,
                status: 'completed',
                description: `Admin-recorded investment in ${product.name} (${units} units)`,
                createdAt: new Date().toISOString(),
            });
            Storage.set('transactions', txns);

            // Notify user
            const notifications = Storage.get('notifications') || [];
            notifications.unshift({
                id: 'N' + Date.now(),
                userId: user.id,
                title: 'New Investment Added',
                message: `Admin has recorded an investment of ৳${amount.toLocaleString()} in ${product.name} on your behalf.`,
                read: false,
                createdAt: new Date().toISOString(),
            });
            Storage.set('notifications', notifications);

            showToast(`Investment of ৳${amount.toLocaleString()} added for ${user.name}`, 'success');
            setAddOpen(false);
            setAddUserId('');
            setAddProductId('');
            setAddUnits('1');
            setAddSellMode('auto');
            loadData();
        } catch (err) {
            showToast('Failed to add investment', 'error');
        } finally {
            setAddLoading(false);
        }
    };

    // Admin marks an investment as completed and credits profit to user
    const handleMarkCompleted = (invId: string) => {
        try {
            const allInv: Investment[] = Storage.get('investments') || [];
            const idx = allInv.findIndex((i) => i.id === invId);
            if (idx === -1) return;

            const inv = allInv[idx];
            if (inv.status === 'completed') {
                showToast('This investment is already completed', 'error');
                return;
            }

            inv.status = 'completed';
            Storage.set('investments', allInv);

            // Credit profit to user balance
            const users = Storage.get('users') || [];
            const uIdx = users.findIndex((u: any) => u.id === inv.userId || u.email === inv.userId);
            if (uIdx !== -1) {
                users[uIdx].balance = (users[uIdx].balance || 0) + inv.totalReturn;
                Storage.set('users', users);

                const curr = Storage.get('currentUser');
                if (curr && (curr.id === inv.userId || curr.email === inv.userId)) {
                    curr.balance = users[uIdx].balance;
                    Storage.set('currentUser', curr);
                }
            }

            // Log profit transaction
            const txns = Storage.get('transactions') || [];
            txns.push({
                id: 'TX' + Date.now(),
                userId: inv.userId,
                userEmail: inv.userEmail,
                userName: inv.userName,
                type: 'investment',
                amount: inv.totalReturn,
                status: 'completed',
                description: `Investment matured: ${inv.productName} — ৳${inv.amount} + ৳${inv.expectedProfit} profit`,
                createdAt: new Date().toISOString(),
            });
            Storage.set('transactions', txns);

            // Notify user
            const notifications = Storage.get('notifications') || [];
            notifications.unshift({
                id: 'N' + Date.now(),
                userId: inv.userId,
                title: '🎉 Investment Completed!',
                message: `Your investment in ${inv.productName} has matured! ৳${inv.totalReturn.toLocaleString()} (principal + profit) has been credited to your wallet.`,
                read: false,
                createdAt: new Date().toISOString(),
            });
            Storage.set('notifications', notifications);

            showToast(`Investment completed! ৳${inv.totalReturn.toLocaleString()} credited to user`, 'success');
            setDetailOpen(false);
            loadData();
        } catch (err) {
            showToast('Failed to mark investment as completed', 'error');
        }
    };

    const filteredInvestments = investments.filter((inv) => {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
            (inv.userEmail || '').toLowerCase().includes(q) ||
            (inv.userName || '').toLowerCase().includes(q) ||
            (inv.productName || '').toLowerCase().includes(q);
        const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
        const matchesMode = filterMode === 'all' || inv.sellMode === filterMode;
        return matchesQuery && matchesStatus && matchesMode;
    });

    const statusBadge: Record<string, string> = {
        active: 'badge-success',
        completed: 'badge-info',
        pending_proof: 'badge-warning',
    };

    // Compute preview for Add Investment form
    const selectedProduct = allProducts.find((p) => p.id === addProductId);
    const selectedUser = allUsers.find((u) => u.id === addUserId);
    const previewUnits = parseInt(addUnits) || 1;
    const previewAmount = selectedProduct ? selectedProduct.price * previewUnits : 0;
    const previewRate = selectedProduct ? (selectedProduct.profitRate || selectedProduct.returnRate || 10) : 0;
    const previewProfit = Math.round(previewAmount * (previewRate / 100));
    const previewTotal = previewAmount + previewProfit;

    return (
        <div>
            <style jsx global>{`
                .adm-stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 28px; }
                .adm-stat-card { background: var(--bg-primary, #0f1c30); border: 1px solid var(--border-color, #1e2d4a); border-radius: 14px; padding: 20px 22px; display: flex; flex-direction: column; gap: 10px; }
                .adm-stat-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
                .adm-stat-value { font-size: 22px; font-weight: 700; color: white; margin: 0; }
                .adm-stat-label { font-size: 12px; color: var(--text-secondary, #8fa0b5); margin: 0; }
                .adm-table-card { background: var(--bg-primary, #0f1c30); border: 1px solid var(--border-color, #1e2d4a); border-radius: 16px; padding: 24px; }
                .adm-filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
                .adm-search { position: relative; max-width: 280px; width: 100%; }
                .adm-search i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none; }
                .adm-search input { width: 100%; padding: 10px 12px 10px 40px; background: var(--bg-secondary, #0c1524); border: 1px solid var(--border-color, #1e2d4a); border-radius: 8px; color: var(--text-primary, white); font-size: 13px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
                .adm-search input:focus { border-color: var(--primary-color, #178582); }
                .adm-select { padding: 10px 14px; background: var(--bg-secondary, #0c1524); border: 1px solid var(--border-color, #1e2d4a); border-radius: 8px; color: var(--text-primary, white); font-size: 13px; outline: none; cursor: pointer; }
                .adm-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
                .adm-table thead tr { border-bottom: 2px solid var(--border-color, #1e2d4a); }
                .adm-table th { padding: 11px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary, #8fa0b5); font-weight: 600; white-space: nowrap; }
                .adm-table tbody tr { border-bottom: 1px solid var(--border-color, #1e2d4a); transition: background 0.15s; }
                .adm-table tbody tr:last-child { border-bottom: none; }
                .adm-table tbody tr:hover { background: rgba(255,255,255,0.02); }
                .adm-table td { padding: 13px 10px; color: var(--text-primary, white); vertical-align: middle; }
                .adm-progress-wrap { width: 100px; }
                .adm-progress-bar { height: 6px; background: var(--bg-secondary, #0c1524); border-radius: 99px; overflow: hidden; margin-top: 4px; }
                .adm-progress-fill { height: 100%; background: linear-gradient(90deg, #178582, #0d9488); border-radius: 99px; transition: width 0.3s; }
                .adm-empty { text-align: center; padding: 50px 20px; color: var(--text-secondary); }
                .adm-empty i { font-size: 48px; margin-bottom: 12px; display: block; opacity: 0.4; }
                /* Modals */
                .adm-modal-overlay { display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.65); align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
                .adm-modal { background: var(--bg-primary, #0f1c30); border-radius: 18px; border: 1px solid var(--border-color, #1e2d4a); width: 100%; max-width: 520px; overflow: hidden; max-height: 92vh; display: flex; flex-direction: column; }
                .adm-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-color, #1e2d4a); flex-shrink: 0; }
                .adm-modal-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: white; }
                .adm-modal-close { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 18px; padding: 4px 8px; border-radius: 6px; transition: background 0.2s; }
                .adm-modal-close:hover { background: rgba(255,255,255,0.05); }
                .adm-modal-body { padding: 20px 24px; overflow-y: auto; }
                .adm-modal-footer { padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; gap: 10px; justify-content: flex-end; flex-shrink: 0; }
                .adm-form-group { margin-bottom: 18px; }
                .adm-form-label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
                .adm-form-input, .adm-form-select { width: 100%; padding: 11px 14px; background: var(--bg-secondary, #0c1524); border: 1px solid var(--border-color, #1e2d4a); border-radius: 10px; color: var(--text-primary, white); font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
                .adm-form-input:focus, .adm-form-select:focus { border-color: var(--primary-color, #178582); }
                .adm-preview-box { background: var(--bg-secondary, #0c1524); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px; margin-top: 4px; }
                .adm-preview-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .adm-preview-row:last-child { border-bottom: none; }
                .adm-detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
                .adm-detail-row:last-child { border-bottom: none; }
                .adm-detail-label { color: var(--text-secondary, #8fa0b5); }
                .adm-detail-value { font-weight: 600; color: white; }
                .sell-mode-btns { display: flex; gap: 10px; }
                .sell-mode-btn { flex: 1; padding: 10px; border: 2px solid var(--border-color); border-radius: 10px; background: none; color: var(--text-secondary); cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; text-align: center; }
                .sell-mode-btn.active { border-color: var(--primary-color, #178582); background: rgba(23,133,130,0.1); color: var(--primary-color, #178582); }
            `}</style>

            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>
                        <i className="fas fa-chart-line" style={{ color: 'var(--primary-color)', marginRight: '10px' }}></i>
                        Investment Management
                    </h1>
                    <p>Track all user investments, portfolio progress and expected returns</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setAddOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', whiteSpace: 'nowrap' }}
                >
                    <i className="fas fa-plus-circle"></i>
                    Add Investment
                </button>
            </div>

            {/* Stats Row */}
            <div className="adm-stat-row">
                <div className="adm-stat-card">
                    <div className="adm-stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><i className="fas fa-wallet"></i></div>
                    <p className="adm-stat-value">৳{totalInvested.toLocaleString()}</p>
                    <p className="adm-stat-label">Total Capital Invested</p>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><i className="fas fa-coins"></i></div>
                    <p className="adm-stat-value">৳{totalExpectedProfit.toLocaleString()}</p>
                    <p className="adm-stat-label">Total Expected Profit</p>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><i className="fas fa-spinner"></i></div>
                    <p className="adm-stat-value">{activeCount}</p>
                    <p className="adm-stat-label">Active Investments</p>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><i className="fas fa-check-circle"></i></div>
                    <p className="adm-stat-value">{completedCount}</p>
                    <p className="adm-stat-label">Completed</p>
                </div>
            </div>

            {/* Table Card */}
            <div className="adm-table-card">
                <div className="adm-filter-bar">
                    <div className="adm-search">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search by email, name or product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <select className="adm-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="pending_proof">Pending Proof</option>
                        </select>
                        <select className="adm-select" value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
                            <option value="all">All Modes</option>
                            <option value="auto">Auto-Sell</option>
                            <option value="self">Self-Sell</option>
                        </select>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Investor</th>
                                <th>Product</th>
                                <th>Amount</th>
                                <th>Units</th>
                                <th>Profit %</th>
                                <th>Exp. Profit</th>
                                <th>Progress</th>
                                <th>Mode</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvestments.length === 0 ? (
                                <tr>
                                    <td colSpan={11}>
                                        <div className="adm-empty">
                                            <i className="fas fa-chart-pie"></i>
                                            <p>No investments found</p>
                                            <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)} style={{ marginTop: '12px' }}>
                                                <i className="fas fa-plus" style={{ marginRight: '6px' }}></i>Add First Investment
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvestments.map((inv) => {
                                    const prog = getProgressInfo(inv);
                                    return (
                                        <tr key={inv.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{inv.userName || 'N/A'}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{inv.userEmail}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(23,133,130,0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                                                        <i className={`fas ${inv.productIcon || 'fa-box'}`}></i>
                                                    </div>
                                                    <span style={{ fontWeight: 500 }}>{inv.productName}</span>
                                                </div>
                                            </td>
                                            <td><strong style={{ color: '#10b981' }}>৳{(inv.amount || 0).toLocaleString()}</strong></td>
                                            <td>{inv.units}</td>
                                            <td><span style={{ color: '#10b981', fontWeight: 600 }}>+{inv.profitRate}%</span></td>
                                            <td><span style={{ color: '#8b5cf6', fontWeight: 600 }}>৳{(inv.expectedProfit || 0).toLocaleString()}</span></td>
                                            <td>
                                                <div className="adm-progress-wrap">
                                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                        {Math.round(prog.progress)}% · {prog.daysRemaining}d left
                                                    </span>
                                                    <div className="adm-progress-bar">
                                                        <div className="adm-progress-fill" style={{ width: `${prog.progress}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: inv.sellMode === 'self' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)', color: inv.sellMode === 'self' ? '#8b5cf6' : '#3b82f6', fontWeight: 600 }}>
                                                    {inv.sellMode === 'self' ? 'Self-Sell' : 'Auto-Sell'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${statusBadge[inv.status] || 'badge-warning'}`}>
                                                    {inv.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                {new Date(inv.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => { setSelectedInv(inv); setDetailOpen(true); }}
                                                    style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── ADD INVESTMENT MODAL ─── */}
            {addOpen && (
                <div className="adm-modal-overlay" onClick={() => setAddOpen(false)}>
                    <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="adm-modal-header">
                            <h3><i className="fas fa-plus-circle" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>Add Investment for User</h3>
                            <button className="adm-modal-close" onClick={() => setAddOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleAddInvestment}>
                            <div className="adm-modal-body">
                                {/* User Select */}
                                <div className="adm-form-group">
                                    <label className="adm-form-label">Select User *</label>
                                    <select
                                        className="adm-form-select"
                                        value={addUserId}
                                        onChange={(e) => setAddUserId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose a user --</option>
                                        {allUsers.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} ({u.email}) — Balance: ৳{(u.balance || 0).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Product Select */}
                                <div className="adm-form-group">
                                    <label className="adm-form-label">Select Product *</label>
                                    <select
                                        className="adm-form-select"
                                        value={addProductId}
                                        onChange={(e) => setAddProductId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose a product --</option>
                                        {allProducts.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} — ৳{(p.price || 0).toLocaleString()} / unit
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Units */}
                                <div className="adm-form-group">
                                    <label className="adm-form-label">Number of Units *</label>
                                    <input
                                        type="number"
                                        className="adm-form-input"
                                        value={addUnits}
                                        onChange={(e) => setAddUnits(e.target.value)}
                                        min="1"
                                        required
                                    />
                                </div>

                                {/* Sell Mode */}
                                <div className="adm-form-group">
                                    <label className="adm-form-label">Sell Mode *</label>
                                    <div className="sell-mode-btns">
                                        <button
                                            type="button"
                                            className={`sell-mode-btn ${addSellMode === 'auto' ? 'active' : ''}`}
                                            onClick={() => setAddSellMode('auto')}
                                        >
                                            <i className="fas fa-robot" style={{ marginRight: '6px' }}></i>Auto-Sell
                                        </button>
                                        <button
                                            type="button"
                                            className={`sell-mode-btn ${addSellMode === 'self' ? 'active' : ''}`}
                                            onClick={() => setAddSellMode('self')}
                                        >
                                            <i className="fas fa-hand-holding-usd" style={{ marginRight: '6px' }}></i>Self-Sell
                                        </button>
                                    </div>
                                </div>

                                {/* Preview */}
                                {selectedProduct && (
                                    <div>
                                        <label className="adm-form-label">Investment Preview</label>
                                        <div className="adm-preview-box">
                                            <div className="adm-preview-row">
                                                <span style={{ color: 'var(--text-secondary)' }}>Product</span>
                                                <strong>{selectedProduct.name}</strong>
                                            </div>
                                            <div className="adm-preview-row">
                                                <span style={{ color: 'var(--text-secondary)' }}>Units × Price</span>
                                                <span>{previewUnits} × ৳{(selectedProduct.price || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="adm-preview-row">
                                                <span style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
                                                <strong style={{ color: '#10b981' }}>৳{previewAmount.toLocaleString()}</strong>
                                            </div>
                                            <div className="adm-preview-row">
                                                <span style={{ color: 'var(--text-secondary)' }}>Profit Rate</span>
                                                <span style={{ color: '#10b981' }}>+{previewRate}%</span>
                                            </div>
                                            <div className="adm-preview-row">
                                                <span style={{ color: 'var(--text-secondary)' }}>Expected Profit</span>
                                                <span style={{ color: '#8b5cf6' }}>৳{previewProfit.toLocaleString()}</span>
                                            </div>
                                            <div className="adm-preview-row">
                                                <span style={{ color: 'var(--text-secondary)' }}>Duration</span>
                                                <span>{selectedProduct.duration || 30} days</span>
                                            </div>
                                            <div className="adm-preview-row">
                                                <span style={{ color: 'var(--text-secondary)' }}>Total Return</span>
                                                <strong style={{ color: '#f59e0b', fontSize: '15px' }}>৳{previewTotal.toLocaleString()}</strong>
                                            </div>
                                            {selectedUser && previewAmount > (selectedUser.balance || 0) && (
                                                <div style={{ marginTop: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#ef4444' }}>
                                                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
                                                    User balance (৳{(selectedUser.balance || 0).toLocaleString()}) is insufficient for this investment
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="adm-modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setAddOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                                    {addLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>Processing...</> : <><i className="fas fa-check" style={{ marginRight: '6px' }}></i>Confirm Investment</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── DETAIL MODAL ─── */}
            {detailOpen && selectedInv && (() => {
                const prog = getProgressInfo(selectedInv);
                return (
                    <div className="adm-modal-overlay" onClick={() => setDetailOpen(false)}>
                        <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="adm-modal-header">
                                <h3><i className="fas fa-chart-line" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>Investment Details</h3>
                                <button className="adm-modal-close" onClick={() => setDetailOpen(false)}><i className="fas fa-times"></i></button>
                            </div>
                            <div className="adm-modal-body">
                                {/* Investor info */}
                                <div style={{ background: 'var(--bg-secondary, #0c1524)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Investor</div>
                                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'white' }}>{selectedInv.userName || 'N/A'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedInv.userEmail}</div>
                                </div>

                                {/* Progress bar */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                                        <strong>{Math.round(prog.progress)}% · {prog.daysRemaining} days left</strong>
                                    </div>
                                    <div className="adm-progress-bar" style={{ height: '8px' }}>
                                        <div className="adm-progress-fill" style={{ width: `${prog.progress}%` }}></div>
                                    </div>
                                </div>

                                {/* Details list */}
                                <div style={{ background: 'var(--bg-secondary, #0c1524)', borderRadius: '12px', padding: '8px 16px', border: '1px solid var(--border-color)' }}>
                                    <div className="adm-detail-row"><span className="adm-detail-label">Product</span><span className="adm-detail-value">{selectedInv.productName}</span></div>
                                    <div className="adm-detail-row"><span className="adm-detail-label">Invested Amount</span><span className="adm-detail-value" style={{ color: '#10b981' }}>৳{(selectedInv.amount || 0).toLocaleString()}</span></div>
                                    <div className="adm-detail-row"><span className="adm-detail-label">Units Purchased</span><span className="adm-detail-value">{selectedInv.units}</span></div>
                                    <div className="adm-detail-row"><span className="adm-detail-label">Profit Rate</span><span className="adm-detail-value" style={{ color: '#10b981' }}>+{selectedInv.profitRate}%</span></div>
                                    <div className="adm-detail-row"><span className="adm-detail-label">Expected Profit</span><span className="adm-detail-value" style={{ color: '#8b5cf6' }}>৳{(selectedInv.expectedProfit || 0).toLocaleString()}</span></div>
                                    <div className="adm-detail-row"><span className="adm-detail-label">Total Return</span><span className="adm-detail-value" style={{ color: '#f59e0b' }}>৳{(selectedInv.totalReturn || 0).toLocaleString()}</span></div>
                                    <div className="adm-detail-row"><span className="adm-detail-label">Duration</span><span className="adm-detail-value">{selectedInv.duration} days</span></div>
                                    <div className="adm-detail-row"><span className="adm-detail-label">Sell Mode</span><span className="adm-detail-value">{selectedInv.sellMode === 'self' ? 'Self-Sell' : 'Auto-Sell'}</span></div>
                                    <div className="adm-detail-row"><span className="adm-detail-label">Start Date</span><span className="adm-detail-value">{prog.startDateStr}</span></div>
                                    <div className="adm-detail-row"><span className="adm-detail-label">End Date</span><span className="adm-detail-value">{prog.endDateStr}</span></div>
                                    <div className="adm-detail-row">
                                        <span className="adm-detail-label">Status</span>
                                        <span className={`badge ${statusBadge[selectedInv.status] || 'badge-warning'}`}>{selectedInv.status.replace('_', ' ').toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="adm-modal-footer">
                                <button className="btn btn-outline" onClick={() => setDetailOpen(false)}>Close</button>
                                {selectedInv.status !== 'completed' && (
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleMarkCompleted(selectedInv.id)}
                                        style={{ background: '#10b981', borderColor: '#10b981' }}
                                    >
                                        <i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i>
                                        Mark Completed & Credit Profit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
