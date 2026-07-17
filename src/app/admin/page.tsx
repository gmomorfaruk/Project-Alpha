'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Storage from '@/lib/storage';

interface Txn {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    type: 'deposit' | 'withdrawal' | 'investment' | 'task_earning';
    method?: string;
    amount: number;
    status: string;
    createdAt: string;
}

interface UserRecord {
    id: string;
    name: string;
    email: string;
    role: string;
    balance: number;
    createdAt: string;
}

export default function AdminDashboardPage() {
    // Stats state
    const [totalUsers, setTotalUsers] = useState(0);
    const [activeProducts, setActiveProducts] = useState(0);
    const [totalInvestments, setTotalInvestments] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);

    // Pending counts
    const [pendingTxns, setPendingTxns] = useState(0);
    const [pendingMemberships, setPendingMemberships] = useState(0);
    const [pendingProofs, setPendingProofs] = useState(0);
    const [newUsersToday, setNewUsersToday] = useState(0);

    // Lists
    const [recentTxns, setRecentTxns] = useState<Txn[]>([]);
    const [recentUsers, setRecentUsers] = useState<UserRecord[]>([]);
    const [adminPrefix, setAdminPrefix] = useState('/admin');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const prefix = sessionStorage.getItem('adminPathPrefix') || '/admin';
            setAdminPrefix(prefix);
        }
        loadDashboardStats();
    }, []);

    const loadDashboardStats = () => {
        // Users
        const allUsers: UserRecord[] = Storage.get('users') || [];
        const regularUsers = allUsers.filter((u) => u.role !== 'admin');
        setTotalUsers(regularUsers.length);

        // Products
        const products = Storage.get('products') || [];
        setActiveProducts(products.filter((p: any) => p.active !== false).length);

        // Investments
        const investments = Storage.get('investments') || [];
        setTotalInvestments(investments.length);

        // Revenue
        const revenue = investments.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
        setTotalRevenue(revenue);

        // Transactions pending count
        const txns: Txn[] = Storage.get('transactions') || [];
        const pendingT = txns.filter((t) => t.status === 'pending');
        setPendingTxns(pendingT.length);

        // Membership pending count
        const membershipRequests = Storage.get('membershipRequests') || [];
        const pendingM = membershipRequests.filter((r: any) => r.status === 'pending');
        setPendingMemberships(pendingM.length);

        // Pending sell proofs
        const proofs = Storage.get('sellProofs') || [];
        const pendingP = proofs.filter((p: any) => p.status === 'pending');
        setPendingProofs(pendingP.length);

        // New users today
        const todayStr = new Date().toDateString();
        const newU = regularUsers.filter((u) => new Date(u.createdAt).toDateString() === todayStr);
        setNewUsersToday(newU.length);

        // Lists
        setRecentTxns(txns.slice(0, 5));
        setRecentUsers(regularUsers.slice(-5).reverse());
    };

    return (
        <div>
            <style jsx global>{`
                .admin-pending-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                }
                .pending-item-card {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 20px;
                    background: var(--bg-secondary, #0c1524);
                    border-radius: 12px;
                    border: 1px solid var(--border-color, #1e2d4a);
                    border-left: 4px solid var(--primary-color, #178582);
                    text-decoration: none;
                    transition: all 0.3s ease;
                }
                .pending-item-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                .pending-icon-wrap {
                    width: 45px;
                    height: 45px;
                    border-radius: 10px;
                    background: rgba(23, 133, 130, 0.1);
                    color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    flex-shrink: 0;
                }
                .pending-item-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0;
                    color: white;
                }
                .pending-item-lbl {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin: 0;
                }
                .admin-split-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-top: 30px;
                }
                .admin-recent-card {
                    background: var(--bg-primary, #0f1c30);
                    border-radius: 16px;
                    padding: 24px;
                    border: 1px solid var(--border-color, #1e2d4a);
                }
                .admin-recent-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .admin-recent-card-header h3 {
                    margin: 0;
                    font-size: 16px;
                    color: white;
                }
                .recent-list-row {
                    display: flex;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid var(--border-color);
                }
                .recent-list-row:last-child {
                    border-bottom: none;
                }
                .recent-list-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 12px;
                    flex-shrink: 0;
                }
                @media (max-width: 992px) {
                    .admin-split-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="page-header">
                <h1>
                    <i className="fas fa-tachometer-alt" style={{ color: 'var(--primary-color)', marginRight: '10px' }}></i>
                    <span>Admin Dashboard</span>
                </h1>
                <p>Platform system health and conversion performance overview</p>
            </div>

            {/* Core Stats Cards */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-info">
                        <h3 style={{ margin: '0 0 5px 0' }}>{totalUsers}</h3>
                        <p style={{ margin: 0 }}>Total Workers</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <i className="fas fa-box"></i>
                    </div>
                    <div className="stat-info">
                        <h3 style={{ margin: '0 0 5px 0' }}>{activeProducts}</h3>
                        <p style={{ margin: 0 }}>Active Products</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="stat-info">
                        <h3 style={{ margin: '0 0 5px 0' }}>{totalInvestments}</h3>
                        <p style={{ margin: 0 }}>Total Investments</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <i className="fas fa-wallet"></i>
                    </div>
                    <div className="stat-info">
                        <h3 style={{ margin: '0 0 5px 0' }}>৳{totalRevenue.toLocaleString()}</h3>
                        <p style={{ margin: 0 }}>Invested Funds</p>
                    </div>
                </div>
            </div>

            {/* Pending actions section */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: 'white' }}><i className="fas fa-bell" style={{ color: '#f59e0b', marginRight: '10px' }}></i>Pending Actions Awaiting Approval</h3>
                <div className="admin-pending-grid">
                    <Link href={`${adminPrefix}/transactions`} className="pending-item-card" style={{ borderLeftColor: '#f59e0b' }}>
                        <div className="pending-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><i className="fas fa-exchange-alt"></i></div>
                        <div>
                            <h4 className="pending-item-title">{pendingTxns}</h4>
                            <p className="pending-item-lbl">Transactions (Deposits/Withdrawals)</p>
                        </div>
                    </Link>
                    <Link href={`${adminPrefix}/memberships`} className="pending-item-card" style={{ borderLeftColor: '#8b5cf6' }}>
                        <div className="pending-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><i className="fas fa-crown"></i></div>
                        <div>
                            <h4 className="pending-item-title">{pendingMemberships}</h4>
                            <p className="pending-item-lbl">Membership Upgrades</p>
                        </div>
                    </Link>
                    <Link href={`${adminPrefix}/proofs`} className="pending-item-card" style={{ borderLeftColor: '#3b82f6' }}>
                        <div className="pending-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><i className="fas fa-receipt"></i></div>
                        <div>
                            <h4 className="pending-item-title">{pendingProofs}</h4>
                            <p className="pending-item-lbl">Self-Sell Sales Proofs</p>
                        </div>
                    </Link>
                    <Link href={`${adminPrefix}/users`} className="pending-item-card" style={{ borderLeftColor: '#10b981' }}>
                        <div className="pending-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><i className="fas fa-user-plus"></i></div>
                        <div>
                            <h4 className="pending-item-title">{newUsersToday}</h4>
                            <p className="pending-item-lbl">New Signups Today</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Split row: Recent Transactions vs Recent Users */}
            <div className="admin-split-grid">
                <div className="admin-recent-card">
                    <div className="admin-recent-card-header">
                        <h3>Recent Financial Ledger Logs</h3>
                        <Link href={`${adminPrefix}/transactions`} className="btn btn-sm btn-outline">View All</Link>
                    </div>
                    <div>
                        {recentTxns.length === 0 ? (
                            <div className="empty-state" style={{ padding: '30px' }}>
                                <i className="fas fa-exchange-alt"></i>
                                <p>No transactions logged yet</p>
                            </div>
                        ) : (
                            recentTxns.map((t) => {
                                const isDeposit = t.type === 'deposit';
                                const badgeColor = t.status === 'approved' || t.status === 'completed' ? 'badge-success' : t.status === 'rejected' ? 'badge-danger' : 'badge-warning';

                                return (
                                    <div key={t.id} className="recent-list-row">
                                        <div className="recent-list-icon" style={{ background: isDeposit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isDeposit ? '#10b981' : '#ef4444' }}>
                                            <i className={`fas fa-${isDeposit ? 'arrow-down' : 'arrow-up'}`}></i>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, color: 'white', fontSize: '14px' }}>{t.type.toUpperCase()} via {t.method?.toUpperCase()}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.userEmail}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, color: isDeposit ? '#10b981' : '#ef4444', fontSize: '14px' }}>৳{t.amount.toLocaleString()}</div>
                                            <span className={`badge ${badgeColor}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{t.status}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="admin-recent-card">
                    <div className="admin-recent-card-header">
                        <h3>Recent User Signups</h3>
                        <Link href={`${adminPrefix}/users`} className="btn btn-sm btn-outline">View All</Link>
                    </div>
                    <div>
                        {recentUsers.length === 0 ? (
                            <div className="empty-state" style={{ padding: '30px' }}>
                                <i className="fas fa-users"></i>
                                <p>No users signed up yet</p>
                            </div>
                        ) : (
                            recentUsers.map((u) => (
                                <div key={u.id} className="recent-list-row">
                                    <div className="recent-list-icon" style={{ background: 'var(--primary-gradient)', color: 'white', borderRadius: '50%' }}>
                                        {u.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, color: 'white', fontSize: '14px' }}>{u.name || 'User'}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{u.email}</div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="admin-recent-card" style={{ marginTop: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: 'white' }}><i className="fas fa-bolt" style={{ color: 'var(--primary-color)', marginRight: '10px' }}></i>System Quick Actions</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <Link href={`${adminPrefix}/products`} className="btn btn-primary"><i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Add Product</Link>
                    <Link href={`${adminPrefix}/users`} className="btn btn-outline"><i className="fas fa-users" style={{ marginRight: '6px' }}></i> Manage Users</Link>
                    <Link href={`${adminPrefix}/settings`} className="btn btn-outline"><i className="fas fa-cog" style={{ marginRight: '6px' }}></i> Settings</Link>
                </div>
            </div>
        </div>
    );
}
