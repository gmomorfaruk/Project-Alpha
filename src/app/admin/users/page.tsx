'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';
import { supabase } from '@/lib/supabase';

interface UserRecord {
    id: string;
    name: string;
    fullName?: string;
    email: string;
    phone?: string;
    role: string;
    balance: number;
    bkashNumber?: string;
    nagadNumber?: string;
    referralsCount?: number;
    referrals?: any[];
    status?: string;
    createdAt: string;
}

export default function AdminUsersPage() {
    const { showToast } = useToast();

    // Data states
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Stats states
    const [totalCount, setTotalCount] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [todaySignups, setTodaySignups] = useState(0);
    const [totalPlatformBalance, setTotalPlatformBalance] = useState(0);

    // Selected user for modal actions
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

    // Modal visibilities
    const [viewOpen, setViewOpen] = useState(false);
    const [balanceOpen, setBalanceOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [notifyOpen, setNotifyOpen] = useState(false);

    // Form inputs state: Edit Balance
    const [newBalance, setNewBalance] = useState('');
    const [balanceReason, setBalanceReason] = useState('');

    // Form inputs state: Add User
    const [addName, setAddName] = useState('');
    const [addEmail, setAddEmail] = useState('');
    const [addPhone, setAddPhone] = useState('');
    const [addPassword, setAddPassword] = useState('');
    const [addRole, setAddRole] = useState('user');
    const [addBalance, setAddBalance] = useState('0');
    const [addReferrer, setAddReferrer] = useState('');

    // Form inputs state: Edit User
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editRole, setEditRole] = useState('user');
    const [editStatus, setEditStatus] = useState('active');
    const [editBkash, setEditBkash] = useState('');
    const [editNagad, setEditNagad] = useState('');
    const [editPassword, setEditPassword] = useState('');

    // Form inputs state: Send Notification
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');

    useEffect(() => {
        loadUsersData();
    }, []);

    const loadUsersData = async () => {
        // 1. Try Supabase first
        let allUsers: UserRecord[] = [];
        try {
            const { data, error } = await supabase.from('users').select('*');
            if (!error && data && data.length > 0) {
                // Map snake_case → camelCase
                const fetchedUsers = data.map((u: any) => ({
                    ...u,
                    name: u.name || u.fullName || '',
                    referralCode: u.referral_code || u.referralCode || '',
                    totalInvested: u.total_invested ?? u.totalInvested ?? 0,
                    totalProfit: u.total_profit ?? u.totalProfit ?? 0,
                    createdAt: u.created_at || u.createdAt || '',
                }));

                // Merge with localStorage so offline users aren't lost
                const localUsers = Storage.get('users') || [];
                const localMap = new Map(localUsers.map((u: any) => [u.id, u]));
                fetchedUsers.forEach((u: any) => localMap.set(u.id, u));
                allUsers = Array.from(localMap.values()) as UserRecord[];

                // Merge into localStorage so other pages can read it without network
                Storage.set('users', allUsers);
            } else {
                // Supabase empty or error — fall back to localStorage
                allUsers = Storage.get('users') || [];
            }
        } catch {
            allUsers = Storage.get('users') || [];
        }

        const regularUsers = allUsers.filter((u) => u.role !== 'admin');
        setUsers(allUsers);
        setTotalCount(regularUsers.length);
        setActiveCount(regularUsers.filter((u) => u.status !== 'blocked').length);
        const todayStr = new Date().toDateString();
        setTodaySignups(regularUsers.filter((u) => new Date(u.createdAt).toDateString() === todayStr).length);
        const bal = regularUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
        setTotalPlatformBalance(bal);
    };

    // Actions: Update Balance
    const handleUpdateBalanceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        const val = Number(newBalance);
        if (isNaN(val) || val < 0) {
            showToast('Please enter a valid balance value', 'error');
            return;
        }

        try {
            const allUsers = Storage.get('users') || [];
            const idx = allUsers.findIndex((u: any) => u.id === selectedUser.id);
            if (idx !== -1) {
                allUsers[idx].balance = val;
                Storage.set('users', allUsers);

                // Add transactional log
                const txs = Storage.get('transactions') || [];
                txs.unshift({
                    id: db.generateId(),
                    userId: selectedUser.id,
                    type: 'admin_adjustment',
                    amount: val - selectedUser.balance,
                    status: 'completed',
                    description: `Admin balance adjustment: ${balanceReason}`,
                    createdAt: new Date().toISOString()
                });
                Storage.set('transactions', txs);

                showToast('User balance adjusted successfully!', 'success');
                setBalanceOpen(false);
                loadUsersData();
            }
        } catch (err) {
            showToast('Failed to adjust user balance', 'error');
        }
    };

    // Actions: Add New User
    const handleAddUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
            showToast('Please fill all required inputs', 'error');
            return;
        }

        try {
            const allUsers = Storage.get('users') || [];
            if (allUsers.some((u: any) => u.email.toLowerCase() === addEmail.trim().toLowerCase())) {
                showToast('Email address already registered', 'error');
                return;
            }

            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const newUser: UserRecord = {
                id: db.generateId(),
                name: addName.trim(),
                fullName: addName.trim(),
                email: addEmail.trim().toLowerCase(),
                phone: addPhone.trim(),
                role: addRole,
                balance: Number(addBalance) || 0,
                status: 'active',
                createdAt: new Date().toISOString()
            };

            // Referral check
            if (addReferrer.trim()) {
                const referrer = allUsers.find((u: any) => u.referralCode === addReferrer.trim().toUpperCase());
                if (referrer) {
                    referrer.referrals = referrer.referrals || [];
                    referrer.referrals.push({
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email,
                        joinedAt: newUser.createdAt,
                        hasInvested: false,
                        earnings: 0
                    });
                }
            }

            allUsers.push({
                ...newUser,
                referralCode,
                password: addPassword
            });
            Storage.set('users', allUsers);

            showToast('New user account added successfully!', 'success');
            
            // Clear inputs
            setAddName('');
            setAddEmail('');
            setAddPhone('');
            setAddPassword('');
            setAddRole('user');
            setAddBalance('0');
            setAddReferrer('');

            setAddOpen(false);
            loadUsersData();
        } catch (err) {
            showToast('Failed to create new account', 'error');
        }
    };

    // Actions: Edit User
    const handleEditUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        if (!editName.trim()) {
            showToast('Name is required', 'error');
            return;
        }

        try {
            const allUsers = Storage.get('users') || [];
            const idx = allUsers.findIndex((u: any) => u.id === selectedUser.id);
            if (idx !== -1) {
                allUsers[idx].name = editName.trim();
                allUsers[idx].fullName = editName.trim();
                allUsers[idx].phone = editPhone.trim();
                allUsers[idx].role = editRole;
                allUsers[idx].status = editStatus;
                allUsers[idx].bkashNumber = editBkash.trim();
                allUsers[idx].nagadNumber = editNagad.trim();
                
                if (editPassword.trim()) {
                    allUsers[idx].password = editPassword.trim();
                }

                Storage.set('users', allUsers);
                showToast('User profiles saved successfully!', 'success');
                setEditOpen(false);
                loadUsersData();
            }
        } catch (err) {
            showToast('Failed to save edit details', 'error');
        }
    };

    // Actions: Delete User
    const handleDeleteUserSubmit = () => {
        if (!selectedUser) return;

        try {
            const allUsers = Storage.get('users') || [];
            const updated = allUsers.filter((u: any) => u.id !== selectedUser.id);
            Storage.set('users', updated);

            showToast('User account deleted permanently!', 'success');
            setDeleteOpen(false);
            loadUsersData();
        } catch (err) {
            showToast('Failed to delete user account', 'error');
        }
    };

    // Actions: Send Notification
    const handleSendNotificationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !notifyTitle.trim() || !notifyMessage.trim()) return;

        try {
            const notifications = Storage.get('notifications') || [];
            notifications.unshift({
                id: db.generateId(),
                userId: selectedUser.id,
                title: notifyTitle.trim(),
                message: notifyMessage.trim(),
                read: false,
                createdAt: new Date().toISOString()
            });
            Storage.set('notifications', notifications);

            showToast('Alert notification dispatched!', 'success');
            setNotifyTitle('');
            setNotifyMessage('');
            setNotifyOpen(false);
        } catch (err) {
            showToast('Failed to dispatch notification', 'error');
        }
    };

    // Search and filters
    const searchedUsers = users.filter((u) => {
        const matchesQuery = 
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.phone?.includes(searchQuery);

        if (filterStatus === 'all') return matchesQuery;
        if (filterStatus === 'active') return matchesQuery && u.status !== 'blocked';
        if (filterStatus === 'blocked') return matchesQuery && u.status === 'blocked';
        if (filterStatus === 'moderator') return matchesQuery && u.role === 'moderator';
        return matchesQuery;
    });

    return (
        <div>
            <div className="page-header">
                <h1>
                    <i className="fas fa-users" style={{ color: 'var(--primary-color)', marginRight: '10px' }}></i>
                    <span>User Management</span>
                </h1>
                <p>Monitor and update active company workers profiles</p>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-users"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{totalCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Total Workers</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-user-check"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{activeCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Active Workers</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-user-plus"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{todaySignups}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Signups Today</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-wallet"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>৳{totalPlatformBalance.toLocaleString()}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Platform Wallet Balance</p>
                </div>
            </div>

            {/* Users grid list section */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '25px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <div className="search-box" style={{ maxWidth: '300px', width: '100%', position: 'relative', flexShrink: 0 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search email, name or phone..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ padding: '10px 12px 10px 45px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                            <option value="moderator">Moderators</option>
                        </select>
                        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
                            <i className="fas fa-user-plus" style={{ marginRight: '6px' }}></i> Add User
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '12px 8px' }}>User</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Balance</th>
                                <th>Referrals</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                                        <i className="fas fa-users" style={{ fontSize: '40px', color: 'var(--text-secondary)', marginBottom: '10px' }}></i>
                                        <p style={{ color: 'var(--text-secondary)' }}>No matching user profiles found</p>
                                    </td>
                                </tr>
                            ) : (
                                searchedUsers.map((u) => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 8px', color: 'white', fontWeight: 600 }}>{u.name || 'User'}</td>
                                        <td>{u.email}</td>
                                        <td>{u.phone || '-'}</td>
                                        <td><span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '10px' }}>{u.role}</span></td>
                                        <td><strong>৳{(u.balance || 0).toLocaleString()}</strong></td>
                                        <td>{u.referrals?.length || 0}</td>
                                        <td>
                                            <span className={`badge ${u.status === 'blocked' ? 'badge-danger' : 'badge-success'}`}>
                                                {u.status === 'blocked' ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    title="View Details"
                                                    onClick={() => { setSelectedUser(u); setViewOpen(true); }}
                                                    style={{ padding: '4px 8px' }}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    title="Adjust Balance"
                                                    onClick={() => { setSelectedUser(u); setNewBalance((u.balance || 0).toString()); setBalanceReason(''); setBalanceOpen(true); }}
                                                    style={{ padding: '4px 8px', color: '#fbbf24', borderColor: '#fbbf24' }}
                                                >
                                                    <i className="fas fa-wallet"></i>
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    title="Edit User"
                                                    onClick={() => { 
                                                        setSelectedUser(u); 
                                                        setEditName(u.name || ''); 
                                                        setEditPhone(u.phone || ''); 
                                                        setEditRole(u.role || 'user'); 
                                                        setEditStatus(u.status || 'active'); 
                                                        setEditBkash(u.bkashNumber || ''); 
                                                        setEditNagad(u.nagadNumber || '');
                                                        setEditPassword('');
                                                        setEditOpen(true); 
                                                    }}
                                                    style={{ padding: '4px 8px', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    title="Notify"
                                                    onClick={() => { setSelectedUser(u); setNotifyTitle(''); setNotifyMessage(''); setNotifyOpen(true); }}
                                                    style={{ padding: '4px 8px', color: '#10b981', borderColor: '#10b981' }}
                                                >
                                                    <i className="fas fa-bell"></i>
                                                </button>
                                                {u.role !== 'admin' && (
                                                    <button 
                                                        className="btn btn-sm btn-outline" 
                                                        title="Delete User"
                                                        onClick={() => { setSelectedUser(u); setDeleteOpen(true); }}
                                                        style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#ef4444' }}
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: View Details */}
            {viewOpen && selectedUser && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>User Details</h3>
                            <button className="modal-close" onClick={() => setViewOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-primary)' }}>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>FULL NAME</span><br /><strong>{selectedUser.name}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>EMAIL ADDRESS</span><br /><strong>{selectedUser.email}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PHONE NUMBER</span><br /><strong>{selectedUser.phone || 'Not configure'}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>WALLET BALANCE</span><br /><strong style={{ color: '#10b981' }}>৳{(selectedUser.balance || 0).toLocaleString()}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>BKASH / NAGAD NUMBER</span><br /><strong>bKash: {selectedUser.bkashNumber || 'N/A'} • Nagad: {selectedUser.nagadNumber || 'N/A'}</strong></div>
                                <div><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>STATUS</span><br /><span className={`badge ${selectedUser.status === 'blocked' ? 'badge-danger' : 'badge-success'}`}>{selectedUser.status}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Adjust Balance */}
            {balanceOpen && selectedUser && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Adjust Balance</h3>
                            <button className="modal-close" onClick={() => setBalanceOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleUpdateBalanceSubmit}>
                            <div className="modal-body" style={{ padding: '20px' }}>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Current Wallet Balance</label>
                                    <input type="text" value={`৳${(selectedUser.balance || 0).toLocaleString()}`} readOnly style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label htmlFor="newBalanceInput">New Balance *</label>
                                    <input 
                                        type="number" 
                                        id="newBalanceInput"
                                        required 
                                        value={newBalance}
                                        onChange={e => setNewBalance(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="balanceReasonInput">Reason *</label>
                                    <textarea 
                                        id="balanceReasonInput"
                                        rows={2} 
                                        required 
                                        placeholder="Reason log for change"
                                        value={balanceReason}
                                        onChange={e => setBalanceReason(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }}
                                    />
                                </div>
                            </div>
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setBalanceOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Update Balance</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add User */}
            {addOpen && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Add New User</h3>
                            <button className="modal-close" onClick={() => setAddOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleAddUserSubmit}>
                            <div className="modal-body" style={{ padding: '20px' }}>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="addNameInput">Full Name *</label>
                                    <input type="text" id="addNameInput" required value={addName} onChange={e => setAddName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="addEmailInput">Email Address *</label>
                                    <input type="email" id="addEmailInput" required value={addEmail} onChange={e => setAddEmail(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="addPhoneInput">Phone Number</label>
                                    <input type="tel" id="addPhoneInput" value={addPhone} onChange={e => setAddPhone(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="addPasswordInput">Password *</label>
                                    <input type="password" id="addPasswordInput" required value={addPassword} onChange={e => setAddPassword(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label htmlFor="addRoleSelect">Role *</label>
                                        <select id="addRoleSelect" value={addRole} onChange={e => setAddRole(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}>
                                            <option value="user">User</option>
                                            <option value="moderator">Moderator</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="addBalanceInput">Initial Balance</label>
                                        <input type="number" id="addBalanceInput" value={addBalance} onChange={e => setAddBalance(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="addReferrerInput">Referral Code (Optional)</label>
                                    <input type="text" id="addReferrerInput" placeholder="Referrer code ID" value={addReferrer} onChange={e => setAddReferrer(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                            </div>
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setAddOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit User Details */}
            {editOpen && selectedUser && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Edit User Details</h3>
                            <button className="modal-close" onClick={() => setEditOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleEditUserSubmit}>
                            <div className="modal-body" style={{ padding: '20px' }}>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="editNameInput">Full Name *</label>
                                    <input type="text" id="editNameInput" required value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="editPhoneInput">Phone Number</label>
                                    <input type="tel" id="editPhoneInput" value={editPhone} onChange={e => setEditPhone(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label htmlFor="editRoleSelect">Role *</label>
                                        <select id="editRoleSelect" value={editRole} onChange={e => setEditRole(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}>
                                            <option value="user">User</option>
                                            <option value="moderator">Moderator</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="editStatusSelect">Status</label>
                                        <select id="editStatusSelect" value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}>
                                            <option value="active">Active</option>
                                            <option value="blocked">Blocked</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="editBkashInput">bKash Number</label>
                                    <input type="text" id="editBkashInput" value={editBkash} onChange={e => setEditBkash(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="editNagadInput">Nagad Number</label>
                                    <input type="text" id="editNagadInput" value={editNagad} onChange={e => setEditNagad(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="editPasswordInput">New Password (leave blank to keep current)</label>
                                    <input type="password" id="editPasswordInput" placeholder="New password" value={editPassword} onChange={e => setEditPassword(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                            </div>
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setEditOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Notify */}
            {notifyOpen && selectedUser && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '450px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Send System Notification</h3>
                            <button className="modal-close" onClick={() => setNotifyOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleSendNotificationSubmit}>
                            <div className="modal-body" style={{ padding: '20px' }}>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label htmlFor="notifyTitleInput">Title *</label>
                                    <input type="text" id="notifyTitleInput" required placeholder="Notification header" value={notifyTitle} onChange={e => setNotifyTitle(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="notifyMessageInput">Message *</label>
                                    <textarea id="notifyMessageInput" rows={3} required placeholder="Notification description message..." value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                            </div>
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setNotifyOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Send Alert</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete User Confirmation */}
            {deleteOpen && selectedUser && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: '#ef4444', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'white' }}><i className="fas fa-exclamation-triangle"></i> Delete Account</h3>
                            <button className="modal-close" onClick={() => setDeleteOpen(false)} style={{ color: 'white' }}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '30px', textAlign: 'center' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 15px' }}><i className="fas fa-trash-alt"></i></div>
                            <h4 style={{ margin: '0 0 10px 0' }}>Are you absolutely sure?</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                                You are about to permanently delete <strong>{selectedUser.name}</strong> ({selectedUser.email}). This cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button className="btn btn-outline" onClick={() => setDeleteOpen(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleDeleteUserSubmit} style={{ background: '#ef4444', borderColor: '#ef4444' }}>Delete Permanently</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
