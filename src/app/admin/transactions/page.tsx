'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

interface Transaction {
    id: string;
    userId: string;
    userEmail: string;
    userName?: string;
    type: 'deposit' | 'withdrawal' | 'investment' | 'task_earning' | 'admin_adjustment';
    method?: string;
    amount: number;
    accountNumber?: string;
    transactionId?: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    description?: string;
    createdAt: string;
    processedAt?: string;
}

export default function AdminTransactionsPage() {
    const { showToast } = useToast();

    // Data states
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Stats states
    const [pendingCount, setPendingCount] = useState(0);
    const [totalDeposits, setTotalDeposits] = useState(0);
    const [totalWithdrawals, setTotalWithdrawals] = useState(0);

    // Modal details state
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [viewOpen, setViewOpen] = useState(false);

    useEffect(() => {
        loadTransactionsData();
    }, []);

    const loadTransactionsData = () => {
        const allTx: Transaction[] = Storage.get('transactions') || [];
        setTransactions(allTx);

        // Calculate statistics
        const pending = allTx.filter((t) => t.status === 'pending');
        setPendingCount(pending.length);

        const approvedDeposits = allTx.filter((t) => t.type === 'deposit' && (t.status === 'approved' || t.status === 'completed'));
        const depSum = approvedDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);
        setTotalDeposits(depSum);

        const approvedWithdrawals = allTx.filter((t) => t.type === 'withdrawal' && (t.status === 'approved' || t.status === 'completed'));
        const wdSum = approvedWithdrawals.reduce((sum, t) => sum + (t.amount || 0), 0);
        setTotalWithdrawals(wdSum);
    };

    const handleApprove = (txId: string) => {
        try {
            const allTx: Transaction[] = Storage.get('transactions') || [];
            const idx = allTx.findIndex((t) => t.id === txId);
            if (idx === -1) return;

            const t = allTx[idx];
            t.status = 'approved';
            t.processedAt = new Date().toISOString();

            const userEmail = t.userEmail || t.userId;

            // Handle user balance update for manual deposit
            if (t.type === 'deposit') {
                const users = Storage.get('users') || [];
                const uIdx = users.findIndex((u: any) => u.email === userEmail || u.id === t.userId);
                if (uIdx !== -1) {
                    users[uIdx].balance = (users[uIdx].balance || 0) + t.amount;
                    Storage.set('users', users);

                    // Update session credentials if currently matching active session
                    const curr = Storage.get('currentUser');
                    if (curr && (curr.email === userEmail || curr.id === t.userId)) {
                        curr.balance = users[uIdx].balance;
                        Storage.set('currentUser', curr);
                    }
                }
            }

            Storage.set('transactions', allTx);
            showToast('Transaction approved successfully', 'success');
            setViewOpen(false);
            loadTransactionsData();
        } catch (err) {
            showToast('Failed to approve transaction', 'error');
        }
    };

    const handleReject = (txId: string) => {
        try {
            const allTx: Transaction[] = Storage.get('transactions') || [];
            const idx = allTx.findIndex((t) => t.id === txId);
            if (idx === -1) return;

            const t = allTx[idx];
            t.status = 'rejected';
            t.processedAt = new Date().toISOString();

            const userEmail = t.userEmail || t.userId;

            // Refund balance on withdrawal rejection (since it was deducted at request creation)
            if (t.type === 'withdrawal') {
                const users = Storage.get('users') || [];
                const uIdx = users.findIndex((u: any) => u.email === userEmail || u.id === t.userId);
                if (uIdx !== -1) {
                    users[uIdx].balance = (users[uIdx].balance || 0) + t.amount;
                    Storage.set('users', users);

                    const curr = Storage.get('currentUser');
                    if (curr && (curr.email === userEmail || curr.id === t.userId)) {
                        curr.balance = users[uIdx].balance;
                        Storage.set('currentUser', curr);
                    }
                }
            }

            Storage.set('transactions', allTx);
            showToast('Transaction rejected - Wallet balance refunded if withdrawal', 'success');
            setViewOpen(false);
            loadTransactionsData();
        } catch (err) {
            showToast('Failed to reject transaction', 'error');
        }
    };

    // Filter transactions
    const filteredTxns = transactions.filter((t) => {
        const matchesQuery = 
            t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.transactionId && t.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));

        let matchesType = true;
        if (filterType !== 'all') {
            matchesType = t.type === filterType;
        }

        let matchesStatus = true;
        if (filterStatus !== 'all') {
            matchesStatus = t.status === filterStatus;
        }

        return matchesQuery && matchesType && matchesStatus;
    });

    return (
        <div>
            <div className="page-header">
                <h1>Transaction Management</h1>
                <p>Verify deposit transactions and release withdrawal cashouts</p>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-clock"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{pendingCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Pending Approvals</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-arrow-down"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>৳{totalDeposits.toLocaleString()}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Total Approved Deposits</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-arrow-up"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>৳{totalWithdrawals.toLocaleString()}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Total Approved Withdrawals</p>
                </div>
            </div>

            {/* List Table */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '25px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <div className="search-box" style={{ maxWidth: '300px', width: '100%', position: 'relative', flexShrink: 0 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search by TrxID or Email..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ padding: '10px 12px 10px 45px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">All Types</option>
                            <option value="deposit">Deposits</option>
                            <option value="withdrawal">Withdrawals</option>
                        </select>
                        <select 
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '12px 8px' }}>TxID</th>
                                <th>User Email</th>
                                <th>Type</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Sender/Wallet Account</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTxns.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                                        <i className="fas fa-exchange-alt" style={{ fontSize: '40px', color: 'var(--text-secondary)', marginBottom: '10px' }}></i>
                                        <p style={{ color: 'var(--text-secondary)' }}>No ledger records found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTxns.map((t) => {
                                    const isDeposit = t.type === 'deposit';
                                    const isApproved = t.status === 'approved' || t.status === 'completed';
                                    const isRejected = t.status === 'rejected';
                                    const statusBadge = isApproved ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning';

                                    return (
                                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px 8px' }}><code style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.id.slice(0, 8)}...</code></td>
                                            <td>{t.userEmail}</td>
                                            <td>
                                                <span className={`badge ${isDeposit ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'uppercase', fontSize: '9px' }}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td>
                                                <strong style={{ color: t.method === 'bkash' ? '#e2136e' : '#f5821f' }}>
                                                    {t.method?.toUpperCase() || 'MANUAL'}
                                                </strong>
                                            </td>
                                            <td><strong>৳{(t.amount || 0).toLocaleString()}</strong></td>
                                            <td>{t.accountNumber || t.transactionId || '-'}</td>
                                            <td><span className={`badge ${statusBadge}`}>{t.status}</span></td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button 
                                                        className="btn btn-sm btn-outline" 
                                                        onClick={() => { setSelectedTx(t); setViewOpen(true); }}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    {t.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                className="btn btn-sm btn-outline" 
                                                                onClick={() => handleApprove(t.id)}
                                                                style={{ color: '#10b981', borderColor: '#10b981' }}
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline" 
                                                                onClick={() => handleReject(t.id)}
                                                                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: View Details */}
            {viewOpen && selectedTx && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Transaction Details</h3>
                            <button className="modal-close" onClick={() => setViewOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-primary)' }}>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TRANSACTION ID</span><br /><strong>{selectedTx.id}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>USER</span><br /><strong>{selectedTx.userEmail}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TRANSACTION TYPE</span><br /><span className={`badge ${selectedTx.type === 'deposit' ? 'badge-success' : 'badge-danger'}`}>{selectedTx.type.toUpperCase()}</span></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>METHOD</span><br /><strong style={{ color: selectedTx.method === 'bkash' ? '#e2136e' : '#f5821f' }}>{selectedTx.method?.toUpperCase()}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>AMOUNT</span><br /><strong style={{ fontSize: '1.2rem', color: '#10b981' }}>৳{selectedTx.amount.toLocaleString()} BDT</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SENDER ACCOUNT / PAYEE ACCOUNT</span><br /><strong>{selectedTx.accountNumber || '-'}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PAYMENT TRANSACTION ID (TrxID)</span><br /><strong style={{ background: 'var(--bg-primary)', padding: '3px 8px', borderRadius: '4px' }}>{selectedTx.transactionId || '-'}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>STATUS</span><br /><span className="badge badge-warning">{selectedTx.status}</span></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SUBMISSION DATE</span><br /><strong>{new Date(selectedTx.createdAt).toLocaleString()}</strong></div>
                            </div>
                        </div>
                        {selectedTx.status === 'pending' && (
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button className="btn btn-outline" onClick={() => setViewOpen(false)}>Close</button>
                                <button className="btn btn-danger" onClick={() => handleReject(selectedTx.id)}>Reject</button>
                                <button className="btn btn-success" onClick={() => handleApprove(selectedTx.id)}>Approve</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
