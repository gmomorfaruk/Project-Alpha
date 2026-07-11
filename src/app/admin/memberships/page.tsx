'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';

interface MembershipRequest {
    id: string;
    userId: string;
    userName: string;
    membershipId: string;
    membershipName: string;
    amount: number;
    paymentMethod: string;
    paymentMethodName: string;
    transactionId: string;
    senderNumber: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    note?: string;
    taskLimit?: number;
}

interface PlanDetails {
    id: string;
    name: string;
    price: number;
    taskLimit: number;
    dailyEarningLimit: number;
    earningsMultiplier: number;
    withdrawalMin: number;
    withdrawalMax: number;
    color: string;
    icon: string;
}

const plans: Record<string, PlanDetails> = {
    free: { id: 'free', name: 'Free Member', price: 0, taskLimit: 5, dailyEarningLimit: 50, earningsMultiplier: 1.0, withdrawalMin: 500, withdrawalMax: 1000, color: '#6b7280', icon: 'fa-user' },
    junior: { id: 'junior', name: 'Junior', price: 500, taskLimit: 15, dailyEarningLimit: 200, earningsMultiplier: 1.2, withdrawalMin: 300, withdrawalMax: 3000, color: '#10b981', icon: 'fa-seedling' },
    assistant: { id: 'assistant', name: 'Assistant', price: 1500, taskLimit: 30, dailyEarningLimit: 500, earningsMultiplier: 1.5, withdrawalMin: 200, withdrawalMax: 5000, color: '#3b82f6', icon: 'fa-user-tie' },
    senior: { id: 'senior', name: 'Senior', price: 3000, taskLimit: 50, dailyEarningLimit: 1000, earningsMultiplier: 2.0, withdrawalMin: 100, withdrawalMax: 10000, color: '#8b5cf6', icon: 'fa-crown' },
    vip: { id: 'vip', name: 'VIP Member', price: 5000, taskLimit: -1, dailyEarningLimit: -1, earningsMultiplier: 3.0, withdrawalMin: 50, withdrawalMax: 50000, color: '#f59e0b', icon: 'fa-gem' }
};

export default function AdminMembershipsPage() {
    const { showToast } = useToast();

    // States
    const [requests, setRequests] = useState<MembershipRequest[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modal details state
    const [selectedReq, setSelectedReq] = useState<MembershipRequest | null>(null);
    const [viewOpen, setViewOpen] = useState(false);

    useEffect(() => {
        loadRequestsData();
    }, []);

    const loadRequestsData = () => {
        const allReqs = Storage.get('membershipRequests') || [];
        setRequests(allReqs);
    };

    const handleApprove = (reqId: string) => {
        try {
            const allReqs: MembershipRequest[] = Storage.get('membershipRequests') || [];
            const idx = allReqs.findIndex((r) => r.id === reqId);
            if (idx === -1) return;

            const r = allReqs[idx];
            r.status = 'approved';

            // Get plan task limits
            const planKey = r.membershipId.toLowerCase();
            const plan = plans[planKey] || plans.free;
            const taskLimit = plan.taskLimit;

            // Update user record details
            const users = Storage.get('users') || [];
            const uIdx = users.findIndex((u: any) => u.email === r.userId);
            if (uIdx !== -1) {
                users[uIdx].membership = planKey;
                users[uIdx].membershipLevel = planKey;
                users[uIdx].membershipName = plan.name;
                users[uIdx].membershipTaskLimit = taskLimit;
                users[uIdx].membershipDate = new Date().toISOString();
                users[uIdx].membershipRequestId = r.id;
                Storage.set('users', users);

                // Update session credentials if currently active session
                const curr = Storage.get('currentUser');
                if (curr && curr.email === r.userId) {
                    curr.membership = planKey;
                    curr.membershipLevel = planKey;
                    curr.membershipName = plan.name;
                    curr.membershipTaskLimit = taskLimit;
                    curr.membershipDate = users[uIdx].membershipDate;
                    Storage.set('currentUser', curr);
                }

                // Add alert notification for user
                const userNotifications = Storage.get('notifications') || [];
                userNotifications.unshift({
                    id: 'N' + Date.now(),
                    userId: users[uIdx].id,
                    title: 'Membership Upgrade Approved!',
                    message: `Congratulations! Your payment of ৳${r.amount} was verified. You are now upgraded to ${plan.name}.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
                Storage.set('notifications', userNotifications);
            }

            Storage.set('membershipRequests', allReqs);
            showToast(`Upgrade request approved! User is now upgraded to ${plan.name}`, 'success');
            setViewOpen(false);
            loadRequestsData();
        } catch (err) {
            showToast('Failed to approve membership request', 'error');
        }
    };

    const handleReject = (reqId: string) => {
        try {
            const allReqs: MembershipRequest[] = Storage.get('membershipRequests') || [];
            const idx = allReqs.findIndex((r) => r.id === reqId);
            if (idx === -1) return;

            const r = allReqs[idx];
            r.status = 'rejected';

            // Send notification of reject
            const users = Storage.get('users') || [];
            const user = users.find((u: any) => u.email === r.userId);
            if (user) {
                const userNotifications = Storage.get('notifications') || [];
                userNotifications.unshift({
                    id: 'N' + Date.now(),
                    userId: user.id,
                    title: 'Membership Upgrade Rejected',
                    message: `We were unable to verify your bKash/Nagad TrxID: ${r.transactionId}. Please contact system support.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
                Storage.set('notifications', userNotifications);
            }

            Storage.set('membershipRequests', allReqs);
            showToast('Upgrade request rejected successfully', 'success');
            setViewOpen(false);
            loadRequestsData();
        } catch (err) {
            showToast('Failed to reject membership upgrade', 'error');
        }
    };

    // Filter requests
    const filteredRequests = requests.filter((r) => {
        const matchesQuery =
            r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.transactionId.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (filterStatus !== 'all') {
            matchesStatus = r.status === filterStatus;
        }

        return matchesQuery && matchesStatus;
    });

    return (
        <div>
            <div className="page-header">
                <h1>Membership Upgrade Requests</h1>
                <p>Verify manual mobile payments and unlock client earnings multipliers</p>
            </div>

            {/* List Box */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '25px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <div className="search-box" style={{ maxWidth: '300px', width: '100%', position: 'relative', flexShrink: 0 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search user or TrxID..." 
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
                                <th style={{ padding: '12px 8px' }}>User</th>
                                <th>Target Plan</th>
                                <th>Upgrade Price</th>
                                <th>Method</th>
                                <th>Transaction ID</th>
                                <th>Sender Phone</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                                        <i className="fas fa-crown" style={{ fontSize: '40px', color: 'var(--text-secondary)', marginBottom: '10px' }}></i>
                                        <p style={{ color: 'var(--text-secondary)' }}>No upgrade requests logged</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((r) => {
                                    const planKey = r.membershipId.toLowerCase();
                                    const plan = plans[planKey] || plans.free;
                                    const isApproved = r.status === 'approved';
                                    const isRejected = r.status === 'rejected';
                                    const statusBadge = isApproved ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning';

                                    return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px 8px' }}>
                                                <div>
                                                    <strong style={{ color: 'white' }}>{r.userName}</strong>
                                                    <br /><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.userId}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span 
                                                    style={{ 
                                                        background: `${plan.color}20`, 
                                                        color: plan.color, 
                                                        padding: '4px 10px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '11px', 
                                                        fontWeight: 600,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <i className={`fas ${plan.icon}`}></i> {r.membershipName}
                                                </span>
                                            </td>
                                            <td><strong>৳{(r.amount || 0).toLocaleString()}</strong></td>
                                            <td><span style={{ color: r.paymentMethod === 'bkash' ? '#e2136e' : '#f5821f', fontWeight: 'bold' }}>{r.paymentMethodName}</span></td>
                                            <td><code style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>{r.transactionId}</code></td>
                                            <td>{r.senderNumber}</td>
                                            <td><span className={`badge ${statusBadge}`}>{r.status}</span></td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button 
                                                        className="btn btn-sm btn-outline" 
                                                        onClick={() => { setSelectedReq(r); setViewOpen(true); }}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    {r.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                className="btn btn-sm btn-outline" 
                                                                onClick={() => handleApprove(r.id)}
                                                                style={{ color: '#10b981', borderColor: '#10b981' }}
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline" 
                                                                onClick={() => handleReject(r.id)}
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
            {viewOpen && selectedReq && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Upgrade Request Details</h3>
                            <button className="modal-close" onClick={() => setViewOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-primary)' }}>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>USER NAME</span><br /><strong>{selectedReq.userName}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>USER EMAIL</span><br /><strong>{selectedReq.userId}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TARGET MEMBERSHIP</span><br /><strong>{selectedReq.membershipName}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>FEE CHARGED</span><br /><strong style={{ fontSize: '1.2rem', color: '#10b981' }}>৳{selectedReq.amount.toLocaleString()} BDT</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PAYMENT METHOD</span><br /><strong style={{ color: selectedReq.paymentMethod === 'bkash' ? '#e2136e' : '#f5821f' }}>{selectedReq.paymentMethodName}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>MOBILE SENDER NUMBER</span><br /><strong>{selectedReq.senderNumber}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TrxID (BKASH / NAGAD REFERENCE)</span><br /><strong style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px' }}>{selectedReq.transactionId}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>STATUS</span><br /><span className="badge badge-warning">{selectedReq.status}</span></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SUBMITTED ON</span><br /><strong>{new Date(selectedReq.createdAt).toLocaleString()}</strong></div>
                                {selectedReq.note && (
                                    <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>USER NOTE</span>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>{selectedReq.note}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedReq.status === 'pending' && (
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button className="btn btn-outline" onClick={() => setViewOpen(false)}>Close</button>
                                <button className="btn btn-danger" onClick={() => handleReject(selectedReq.id)}>Reject</button>
                                <button className="btn btn-success" onClick={() => handleApprove(selectedReq.id)}>Approve</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
