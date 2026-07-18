'use client';

import React, { useState, useEffect } from 'react';
import Storage from '@/lib/storage';

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

export default function AdminInvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterMode, setFilterMode] = useState('all');

    // Stats
    const [totalInvested, setTotalInvested] = useState(0);
    const [totalExpectedProfit, setTotalExpectedProfit] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);

    // Modal
    const [selectedInv, setSelectedInv] = useState<Investment | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const allInv: Investment[] = Storage.get('investments') || [];
        const allUsers: any[] = Storage.get('users') || [];

        // Enrich with user info
        const enriched = allInv.map((inv) => {
            const user = allUsers.find((u) => u.id === inv.userId || u.email === inv.userId);
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

    const statusColor: Record<string, string> = {
        active: '#10b981',
        completed: '#3b82f6',
        pending_proof: '#f59e0b',
    };

    const statusBadge: Record<string, string> = {
        active: 'badge-success',
        completed: 'badge-info',
        pending_proof: 'badge-warning',
    };

    return (
        <div>
            <style jsx global>{`
                .adm-stat-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 28px;
                }
                .adm-stat-card {
                    background: var(--bg-primary, #0f1c30);
                    border: 1px solid var(--border-color, #1e2d4a);
                    border-radius: 14px;
                    padding: 20px 22px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .adm-stat-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                }
                .adm-stat-value {
                    font-size: 22px;
                    font-weight: 700;
                    color: white;
                    margin: 0;
                }
                .adm-stat-label {
                    font-size: 12px;
                    color: var(--text-secondary, #8fa0b5);
                    margin: 0;
                }
                .adm-table-card {
                    background: var(--bg-primary, #0f1c30);
                    border: 1px solid var(--border-color, #1e2d4a);
                    border-radius: 16px;
                    padding: 24px;
                }
                .adm-filter-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .adm-search {
                    position: relative;
                    max-width: 280px;
                    width: 100%;
                }
                .adm-search i {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                    pointer-events: none;
                }
                .adm-search input {
                    width: 100%;
                    padding: 10px 12px 10px 40px;
                    background: var(--bg-secondary, #0c1524);
                    border: 1px solid var(--border-color, #1e2d4a);
                    border-radius: 8px;
                    color: var(--text-primary, white);
                    font-size: 13px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .adm-search input:focus {
                    border-color: var(--primary-color, #178582);
                }
                .adm-select {
                    padding: 10px 14px;
                    background: var(--bg-secondary, #0c1524);
                    border: 1px solid var(--border-color, #1e2d4a);
                    border-radius: 8px;
                    color: var(--text-primary, white);
                    font-size: 13px;
                    outline: none;
                    cursor: pointer;
                }
                .adm-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 13px;
                }
                .adm-table thead tr {
                    border-bottom: 2px solid var(--border-color, #1e2d4a);
                }
                .adm-table th {
                    padding: 11px 10px;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-secondary, #8fa0b5);
                    font-weight: 600;
                    white-space: nowrap;
                }
                .adm-table tbody tr {
                    border-bottom: 1px solid var(--border-color, #1e2d4a);
                    transition: background 0.15s;
                }
                .adm-table tbody tr:last-child {
                    border-bottom: none;
                }
                .adm-table tbody tr:hover {
                    background: rgba(255,255,255,0.02);
                }
                .adm-table td {
                    padding: 13px 10px;
                    color: var(--text-primary, white);
                    vertical-align: middle;
                }
                .adm-progress-wrap {
                    width: 100px;
                }
                .adm-progress-bar {
                    height: 6px;
                    background: var(--bg-secondary, #0c1524);
                    border-radius: 99px;
                    overflow: hidden;
                    margin-top: 4px;
                }
                .adm-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #178582, #0d9488);
                    border-radius: 99px;
                    transition: width 0.3s;
                }
                .adm-empty {
                    text-align: center;
                    padding: 50px 20px;
                    color: var(--text-secondary);
                }
                .adm-empty i {
                    font-size: 48px;
                    margin-bottom: 12px;
                    display: block;
                    opacity: 0.4;
                }
                /* Detail Modal */
                .inv-modal-overlay {
                    display: flex;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 20px;
                }
                .inv-modal {
                    background: var(--bg-primary, #0f1c30);
                    border-radius: 18px;
                    border: 1px solid var(--border-color, #1e2d4a);
                    width: 100%;
                    max-width: 500px;
                    overflow: hidden;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                }
                .inv-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border-color, #1e2d4a);
                }
                .inv-modal-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: white;
                }
                .inv-modal-close {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 18px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    transition: background 0.2s;
                }
                .inv-modal-close:hover {
                    background: rgba(255,255,255,0.05);
                }
                .inv-modal-body {
                    padding: 20px 24px;
                    overflow-y: auto;
                }
                .inv-detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    font-size: 13px;
                }
                .inv-detail-row:last-child { border-bottom: none; }
                .inv-detail-label { color: var(--text-secondary, #8fa0b5); }
                .inv-detail-value { font-weight: 600; color: white; }
            `}</style>

            {/* Page Header */}
            <div className="page-header">
                <h1>
                    <i className="fas fa-chart-line" style={{ color: 'var(--primary-color)', marginRight: '10px' }}></i>
                    Investment Management
                </h1>
                <p>Track all user investments, portfolio progress and expected returns</p>
            </div>

            {/* Stats Row */}
            <div className="adm-stat-row">
                <div className="adm-stat-card">
                    <div className="adm-stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                        <i className="fas fa-wallet"></i>
                    </div>
                    <p className="adm-stat-value">৳{totalInvested.toLocaleString()}</p>
                    <p className="adm-stat-label">Total Capital Invested</p>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        <i className="fas fa-coins"></i>
                    </div>
                    <p className="adm-stat-value">৳{totalExpectedProfit.toLocaleString()}</p>
                    <p className="adm-stat-label">Total Expected Profit</p>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                        <i className="fas fa-spinner"></i>
                    </div>
                    <p className="adm-stat-value">{activeCount}</p>
                    <p className="adm-stat-label">Active Investments</p>
                </div>
                <div className="adm-stat-card">
                    <div className="adm-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <p className="adm-stat-value">{completedCount}</p>
                    <p className="adm-stat-label">Completed</p>
                </div>
            </div>

            {/* Table Card */}
            <div className="adm-table-card">
                {/* Filter Bar */}
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

                {/* Table */}
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
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(23,133,130,0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
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

            {/* Detail Modal */}
            {detailOpen && selectedInv && (() => {
                const prog = getProgressInfo(selectedInv);
                return (
                    <div className="inv-modal-overlay" onClick={() => setDetailOpen(false)}>
                        <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="inv-modal-header">
                                <h3><i className="fas fa-chart-line" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>Investment Details</h3>
                                <button className="inv-modal-close" onClick={() => setDetailOpen(false)}><i className="fas fa-times"></i></button>
                            </div>
                            <div className="inv-modal-body">
                                {/* Investor */}
                                <div style={{ background: 'var(--bg-secondary, #0c1524)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Investor</div>
                                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'white' }}>{selectedInv.userName || 'N/A'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedInv.userEmail}</div>
                                </div>

                                {/* Progress */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                                        <strong>{Math.round(prog.progress)}% · {prog.daysRemaining} days left</strong>
                                    </div>
                                    <div className="adm-progress-bar" style={{ height: '8px' }}>
                                        <div className="adm-progress-fill" style={{ width: `${prog.progress}%` }}></div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div style={{ background: 'var(--bg-secondary, #0c1524)', borderRadius: '12px', padding: '8px 16px', border: '1px solid var(--border-color)' }}>
                                    <div className="inv-detail-row"><span className="inv-detail-label">Product</span><span className="inv-detail-value">{selectedInv.productName}</span></div>
                                    <div className="inv-detail-row"><span className="inv-detail-label">Invested Amount</span><span className="inv-detail-value" style={{ color: '#10b981' }}>৳{(selectedInv.amount || 0).toLocaleString()}</span></div>
                                    <div className="inv-detail-row"><span className="inv-detail-label">Units Purchased</span><span className="inv-detail-value">{selectedInv.units}</span></div>
                                    <div className="inv-detail-row"><span className="inv-detail-label">Profit Rate</span><span className="inv-detail-value" style={{ color: '#10b981' }}>+{selectedInv.profitRate}%</span></div>
                                    <div className="inv-detail-row"><span className="inv-detail-label">Expected Profit</span><span className="inv-detail-value" style={{ color: '#8b5cf6' }}>৳{(selectedInv.expectedProfit || 0).toLocaleString()}</span></div>
                                    <div className="inv-detail-row"><span className="inv-detail-label">Total Return</span><span className="inv-detail-value">৳{(selectedInv.totalReturn || 0).toLocaleString()}</span></div>
                                    <div className="inv-detail-row"><span className="inv-detail-label">Duration</span><span className="inv-detail-value">{selectedInv.duration} days</span></div>
                                    <div className="inv-detail-row"><span className="inv-detail-label">Sell Mode</span><span className="inv-detail-value">{selectedInv.sellMode === 'self' ? 'Self-Sell' : 'Auto-Sell'}</span></div>
                                    <div className="inv-detail-row"><span className="inv-detail-label">Start Date</span><span className="inv-detail-value">{prog.startDateStr}</span></div>
                                    <div className="inv-detail-row"><span className="inv-detail-label">End Date</span><span className="inv-detail-value">{prog.endDateStr}</span></div>
                                    <div className="inv-detail-row">
                                        <span className="inv-detail-label">Status</span>
                                        <span className={`badge ${statusBadge[selectedInv.status] || 'badge-warning'}`}>{selectedInv.status.replace('_', ' ').toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
