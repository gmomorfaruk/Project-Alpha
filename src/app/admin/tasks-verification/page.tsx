'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

export default function AdminTasksVerificationPage() {
    const { showToast } = useToast();

    const [completions, setCompletions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [pendingCount, setPendingCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);

    const [selectedProof, setSelectedProof] = useState<any | null>(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const allCompletions = Storage.get('taskCompletions') || [];
        
        // Filter out auto-approved completions that didn't require proof
        // We consider it a "proof submission" if it has proofText, proofImage, or started as pending.
        const proofSubmissions = allCompletions.filter((c: any) => c.status === 'pending' || c.proofText || c.proofImage);
        
        setCompletions(proofSubmissions);

        setPendingCount(proofSubmissions.filter((p: any) => p.status === 'pending').length);
        setApprovedCount(proofSubmissions.filter((p: any) => p.status === 'approved').length);
        setRejectedCount(proofSubmissions.filter((p: any) => p.status === 'rejected').length);
    };

    const handleApprove = (proofId: string) => {
        try {
            const allCompletions = Storage.get('taskCompletions') || [];
            const idx = allCompletions.findIndex((p: any) => p.id === proofId);
            if (idx === -1) return;

            const proof = allCompletions[idx];
            proof.status = 'approved';
            
            // Critical Step: Delete image data to save local storage!
            proof.proofImage = null; 

            // Credit user
            const users = Storage.get('users') || [];
            const uIdx = users.findIndex((u: any) => u.email === proof.userId);
            
            if (uIdx !== -1 && proof.pointsAwarded > 0) {
                users[uIdx].balance = (users[uIdx].balance || 0) + proof.pointsAwarded;
                Storage.set('users', users);

                const txns = Storage.get('transactions') || [];
                txns.unshift({
                    id: db.generateId(),
                    userId: users[uIdx].id,
                    type: 'task_earning',
                    amount: proof.pointsAwarded,
                    status: 'completed',
                    description: `Task proof approved: ${proof.taskTitle}`,
                    createdAt: new Date().toISOString()
                });
                Storage.set('transactions', txns);
            }

            Storage.set('taskCompletions', allCompletions);
            showToast('Task proof approved and user credited. Image data deleted to save space.', 'success');
            setViewOpen(false);
            loadData();
        } catch (err) {
            showToast('Failed to approve proof', 'error');
        }
    };

    const handleReject = (proofId: string) => {
        try {
            const allCompletions = Storage.get('taskCompletions') || [];
            const idx = allCompletions.findIndex((p: any) => p.id === proofId);
            if (idx === -1) return;

            const proof = allCompletions[idx];
            proof.status = 'rejected';
            
            // Critical Step: Delete image data to save local storage!
            proof.proofImage = null;

            Storage.set('taskCompletions', allCompletions);
            showToast('Task proof rejected. Image data deleted to save space.', 'success');
            setViewOpen(false);
            loadData();
        } catch (err) {
            showToast('Failed to reject proof', 'error');
        }
    };

    const filteredProofs = completions.filter((p: any) => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
            (p.taskTitle || '').toLowerCase().includes(query) ||
            (p.userId || '').toLowerCase().includes(query) ||
            (p.proofText || '').toLowerCase().includes(query);

        let matchesStatus = true;
        if (filterStatus !== 'all') {
            matchesStatus = p.status === filterStatus;
        }
        return matchesQuery && matchesStatus;
    });

    return (
        <div>
            <div className="page-header">
                <h1>Task Proofs Verification</h1>
                <p>Verify user task submissions and release rewards. Images are auto-deleted upon approval/rejection to save server space.</p>
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
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Approved Tasks</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-times-circle"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{rejectedCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Rejected Tasks</p>
                </div>
            </div>

            {/* List Table */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '25px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <div className="search-box" style={{ maxWidth: '300px', width: '100%', position: 'relative', flexShrink: 0 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search title, user, or details..." 
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
                                <th>Task Title</th>
                                <th>User ID</th>
                                <th>Reward</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProofs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                        <i className="fas fa-tasks" style={{ fontSize: '40px', color: 'var(--text-secondary)', marginBottom: '10px' }}></i>
                                        <p style={{ color: 'var(--text-secondary)' }}>No task proofs found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProofs.map((p: any) => {
                                    const isApproved = p.status === 'approved';
                                    const isRejected = p.status === 'rejected';
                                    const statusBadge = isApproved ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning';

                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px 8px' }}>
                                                {p.proofImage ? (
                                                    <img 
                                                        src={p.proofImage} 
                                                        alt="Proof mini" 
                                                        onClick={() => setImagePreviewUrl(p.proofImage)}
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.status === 'pending' ? 'Text Only' : 'Deleted'}</span>
                                                )}
                                            </td>
                                            <td><strong>{p.taskTitle || 'Unknown Task'}</strong></td>
                                            <td>{p.userId}</td>
                                            <td><strong style={{ color: '#10b981' }}>৳{p.pointsAwarded || 0}</strong></td>
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
                            <h3 style={{ margin: 0 }}>Task Proof Details</h3>
                            <button className="modal-close" onClick={() => setViewOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
                            {selectedProof.proofImage && (
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <img 
                                        src={selectedProof.proofImage} 
                                        alt="Proof zoom" 
                                        onClick={() => setImagePreviewUrl(selectedProof.proofImage)}
                                        style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                                    />
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '5px' }}>Click image to zoom full screen</p>
                                </div>
                            )}

                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-primary)' }}>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TASK TITLE</span><br /><strong>{selectedProof.taskTitle}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>USER EMAIL</span><br /><strong>{selectedProof.userId}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>REWARD AMOUNT</span><br /><strong style={{ color: '#10b981' }}>৳{selectedProof.pointsAwarded}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SUBMISSION DATE</span><br /><strong>{new Date(selectedProof.timestamp).toLocaleString()}</strong></div>
                                
                                {selectedProof.proofText && (
                                    <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', marginTop: '5px', border: '1px solid var(--border-color)' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>USER TEXT/USERNAME</span>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{selectedProof.proofText}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedProof.status === 'pending' && (
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button className="btn btn-outline" onClick={() => setViewOpen(false)}>Close</button>
                                <button className="btn btn-danger" onClick={() => handleReject(selectedProof.id)}>Reject Task</button>
                                <button className="btn btn-success" onClick={() => handleApprove(selectedProof.id)}>Approve Task</button>
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
