'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

interface SellProof {
    id: string;
    investmentId: string;
    productName: string;
    productValue: number;
    unitsSold: number;
    buyerName: string;
    notes?: string;
    imageUrl: string | null;
    status: 'pending' | 'approved' | 'rejected';
    bonusPoints: number;
    submittedAt: string;
    processedAt?: string;
}

export default function AdminProofsPage() {
    const { showToast } = useToast();

    // Data states
    const [proofs, setProofs] = useState<SellProof[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Stats
    const [pendingCount, setPendingCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);

    // Selected proof for viewing details
    const [selectedProof, setSelectedProof] = useState<SellProof | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        loadProofsData();
    }, []);

    const loadProofsData = () => {
        const allProofs: SellProof[] = Storage.get('sellProofs') || [];
        setProofs(allProofs);

        setPendingCount(allProofs.filter(p => p.status === 'pending').length);
        setApprovedCount(allProofs.filter(p => p.status === 'approved').length);
        setRejectedCount(allProofs.filter(p => p.status === 'rejected').length);
    };

    const handleApprove = (proofId: string) => {
        try {
            const allProofs: SellProof[] = Storage.get('sellProofs') || [];
            const idx = allProofs.findIndex(p => p.id === proofId);
            if (idx === -1) return;

            const proof = allProofs[idx];
            proof.status = 'approved';
            proof.processedAt = new Date().toISOString();

            // Find matching investment item to compute payouts
            const investments = Storage.get('investments') || [];
            const invIndex = investments.findIndex((i: any) => i.id === proof.investmentId);

            if (invIndex !== -1) {
                const inv = investments[invIndex];
                
                // Credit the user for units sold
                // Payout formula: (totalAmount / totalUnits) * (1 + returnRate / 100) * unitsSold
                const rate = inv.returnRate || inv.dailyReturn || 5; // fallback rates
                const unitCost = inv.amount / inv.units;
                const unitReturn = unitCost * (1 + rate / 100);
                const totalPayout = Math.round(unitReturn * proof.unitsSold);

                const users = Storage.get('users') || [];
                const uIdx = users.findIndex((u: any) => u.id === inv.userId || u.email === inv.userId);
                
                if (uIdx !== -1) {
                    // Credit balance
                    users[uIdx].balance = (users[uIdx].balance || 0) + totalPayout;
                    
                    // Award points if configured
                    if (proof.bonusPoints > 0) {
                        users[uIdx].points = (users[uIdx].points || 0) + proof.bonusPoints;
                    }

                    Storage.set('users', users);

                    // Sync current session user if matching
                    const curr = Storage.get('currentUser');
                    if (curr && (curr.id === users[uIdx].id || curr.email === users[uIdx].email)) {
                        curr.balance = users[uIdx].balance;
                        curr.points = users[uIdx].points;
                        Storage.set('currentUser', curr);
                    }

                    // Record transaction log entry
                    const txns = Storage.get('transactions') || [];
                    txns.unshift({
                        id: db.generateId(),
                        userId: users[uIdx].id,
                        type: 'product_sale',
                        amount: totalPayout,
                        status: 'completed',
                        description: `Self-sell proof approved: ${proof.productName} (${proof.unitsSold} units)`,
                        createdAt: new Date().toISOString()
                    });
                    Storage.set('transactions', txns);

                    // Send alert notification to user
                    const notifications = Storage.get('notifications') || [];
                    notifications.unshift({
                        id: 'N' + Date.now(),
                        userId: users[uIdx].id,
                        title: 'Sell Proof Approved!',
                        message: `Your proof for ${proof.productName} was verified. credited ৳${totalPayout} + ${proof.bonusPoints} bonus points!`,
                        read: false,
                        createdAt: new Date().toISOString()
                    });
                    Storage.set('notifications', notifications);
                }
            }

            Storage.set('sellProofs', allProofs);
            showToast('Sell proof approved and user credited', 'success');
            setViewOpen(false);
            loadProofsData();
        } catch (err) {
            showToast('Failed to approve sell proof', 'error');
        }
    };

    const handleReject = (proofId: string) => {
        try {
            const allProofs: SellProof[] = Storage.get('sellProofs') || [];
            const idx = allProofs.findIndex(p => p.id === proofId);
            if (idx === -1) return;

            const proof = allProofs[idx];
            proof.status = 'rejected';
            proof.processedAt = new Date().toISOString();

            // Find matching investment item to log notification
            const investments = Storage.get('investments') || [];
            const inv = investments.find((i: any) => i.id === proof.investmentId);
            if (inv) {
                const users = Storage.get('users') || [];
                const user = users.find((u: any) => u.id === inv.userId || u.email === inv.userId);
                if (user) {
                    const notifications = Storage.get('notifications') || [];
                    notifications.unshift({
                        id: 'N' + Date.now(),
                        userId: user.id,
                        title: 'Sell Proof Rejected',
                        message: `Your sell proof for ${proof.productName} was rejected. Please upload valid proof details.`,
                        read: false,
                        createdAt: new Date().toISOString()
                    });
                    Storage.set('notifications', notifications);
                }
            }

            Storage.set('sellProofs', allProofs);
            showToast('Sell proof upgrade rejected', 'success');
            setViewOpen(false);
            loadProofsData();
        } catch (err) {
            showToast('Failed to reject sell proof', 'error');
        }
    };

    // Filter proofs
    const filteredProofs = proofs.filter((p) => {
        const matchesQuery = 
            p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.buyerName.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (filterStatus !== 'all') {
            matchesStatus = p.status === filterStatus;
        }

        return matchesQuery && matchesStatus;
    });

    return (
        <div>
            <div className="page-header">
                <h1>Sell Proofs Verification</h1>
                <p>Verify user uploaded delivery screenshots and release balance credits</p>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-clock"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{pendingCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Pending Verification</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-check-circle"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{approvedCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Approved Proofs</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-times-circle"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{rejectedCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Rejected Proofs</p>
                </div>
            </div>

            {/* List Table */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '25px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <div className="search-box" style={{ maxWidth: '300px', width: '100%', position: 'relative', flexShrink: 0 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search product or buyer..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ padding: '10px 12px 10px 45px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div>
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
                                <th style={{ padding: '12px 8px' }}>Image</th>
                                <th>Product Package</th>
                                <th>Units Sold</th>
                                <th>Buyer Name</th>
                                <th>Bonus Reward</th>
                                <th>Submitted Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProofs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                                        <i className="fas fa-receipt" style={{ fontSize: '40px', color: 'var(--text-secondary)', marginBottom: '10px' }}></i>
                                        <p style={{ color: 'var(--text-secondary)' }}>No sell proofs submitted</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProofs.map((p) => {
                                    const isApproved = p.status === 'approved';
                                    const isRejected = p.status === 'rejected';
                                    const statusBadge = isApproved ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning';

                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px 8px' }}>
                                                {p.imageUrl ? (
                                                    <img 
                                                        src={p.imageUrl} 
                                                        alt="Proof mini" 
                                                        onClick={() => setImagePreviewUrl(p.imageUrl)}
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>No Image</span>
                                                )}
                                            </td>
                                            <td><strong>{p.productName}</strong></td>
                                            <td>{p.unitsSold} units</td>
                                            <td>{p.buyerName}</td>
                                            <td><span style={{ color: '#BFA181', fontWeight: 600 }}>{p.bonusPoints} pts</span></td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(p.submittedAt).toLocaleDateString()}</td>
                                            <td><span className={`badge ${statusBadge}`}>{p.status}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button 
                                                        className="btn btn-sm btn-outline" 
                                                        onClick={() => { setSelectedProof(p); setViewOpen(true); }}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    {p.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                className="btn btn-sm btn-outline" 
                                                                onClick={() => handleApprove(p.id)}
                                                                style={{ color: '#10b981', borderColor: '#10b981' }}
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline" 
                                                                onClick={() => handleReject(p.id)}
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
            {viewOpen && selectedProof && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '550px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Proof Verification Details</h3>
                            <button className="modal-close" onClick={() => setViewOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
                            {selectedProof.imageUrl && (
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <img 
                                        src={selectedProof.imageUrl} 
                                        alt="Proof zoom" 
                                        onClick={() => setImagePreviewUrl(selectedProof.imageUrl)}
                                        style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                                    />
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '5px' }}>Click image to zoom full screen</p>
                                </div>
                            )}

                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-primary)' }}>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PROOF ID</span><br /><strong>{selectedProof.id}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>INVESTMENT PACKAGE</span><br /><strong>{selectedProof.productName}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>UNITS CLAIMED</span><br /><strong>{selectedProof.unitsSold} units</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>BUYER NAME</span><br /><strong>{selectedProof.buyerName}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>POTENTIAL BONUS</span><br /><strong style={{ color: '#BFA181' }}>{selectedProof.bonusPoints} points</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>STATUS</span><br /><span className="badge badge-warning">{selectedProof.status}</span></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SUBMISSION DATE</span><br /><strong>{new Date(selectedProof.submittedAt).toLocaleString()}</strong></div>
                                {selectedProof.notes && (
                                    <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>USER REMARKS</span>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>{selectedProof.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedProof.status === 'pending' && (
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button className="btn btn-outline" onClick={() => setViewOpen(false)}>Close</button>
                                <button className="btn btn-danger" onClick={() => handleReject(selectedProof.id)}>Reject</button>
                                <button className="btn btn-success" onClick={() => handleApprove(selectedProof.id)}>Approve</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Fullscreen Image Zoom */}
            {imagePreviewUrl && (
                <div 
                    className="modal-overlay active" 
                    onClick={() => setImagePreviewUrl(null)}
                    style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 1100, cursor: 'pointer' }}
                >
                    <img 
                        src={imagePreviewUrl} 
                        alt="Proof Fullscreen" 
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }}
                    />
                </div>
            )}
        </div>
    );
}
