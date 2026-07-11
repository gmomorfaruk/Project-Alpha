'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

interface WithdrawalRecord {
    id: string;
    type: 'withdrawal';
    method: string;
    amount: number;
    toNumber: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export default function ClientProfilePage() {
    const { user, updateUserBalance } = useAuth();
    const { tText } = useTranslation();
    const { showToast } = useToast();

    // Profile state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [bkashNumber, setBkashNumber] = useState('');
    const [nagadNumber, setNagadNumber] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);

    // Dynamic lists
    const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);

    // Modals
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [editPaymentOpen, setEditPaymentOpen] = useState(false);

    // Submission loaders
    const [submittingProfile, setSubmittingProfile] = useState(false);
    const [submittingPayment, setSubmittingPayment] = useState(false);

    useEffect(() => {
        if (!user) return;
        
        // Sync states from currentUser
        setFullName(user.name || user.fullName || '');
        setPhone(user.phone || '');
        setBkashNumber(user.bkashNumber || '');
        setNagadNumber(user.nagadNumber || '');
        setAvatar(user.avatar || null);

        // Load withdrawals list
        loadWithdrawalsData();
    }, [user]);

    const loadWithdrawalsData = () => {
        if (!user) return;
        const allTx = Storage.get('transactions') || [];
        const userWithdrawals = allTx.filter((t: any) => 
            t.userId === user.id && t.type === 'withdrawal'
        );
        setWithdrawals(userWithdrawals);
    };

    // Handle Profile edit submit
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!fullName.trim()) {
            showToast('Please enter your full name', 'error');
            return;
        }

        if (!phone.trim()) {
            showToast('Please enter your phone number', 'error');
            return;
        }

        setSubmittingProfile(true);
        try {
            const users = Storage.get('users') || [];
            const idx = users.findIndex((u: any) => u.id === user.id);
            if (idx !== -1) {
                users[idx].name = fullName.trim();
                users[idx].fullName = fullName.trim();
                users[idx].phone = phone.trim();
                
                Storage.set('users', users);
                Storage.set('currentUser', users[idx]);
                showToast('Profile updated successfully!', 'success');
                setEditProfileOpen(false);
            } else {
                showToast('Error syncing user data', 'error');
            }
        } catch (err) {
            showToast('An error occurred during submission', 'error');
        } finally {
            setSubmittingProfile(false);
        }
    };

    // Handle billing setup submit
    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmittingPayment(true);
        try {
            const users = Storage.get('users') || [];
            const idx = users.findIndex((u: any) => u.id === user.id);
            if (idx !== -1) {
                users[idx].bkashNumber = bkashNumber.trim();
                users[idx].nagadNumber = nagadNumber.trim();

                Storage.set('users', users);
                Storage.set('currentUser', users[idx]);
                showToast('Payment methods saved successfully!', 'success');
                setEditPaymentOpen(false);
            } else {
                showToast('Error syncing user data', 'error');
            }
        } catch (err) {
            showToast('An error occurred during submission', 'error');
        } finally {
            setSubmittingPayment(false);
        }
    };

    // Handle Base64 avatar upload
    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image size should be less than 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const resultStr = reader.result as string;
            setAvatar(resultStr);

            const users = Storage.get('users') || [];
            const idx = users.findIndex((u: any) => u.id === user.id);
            if (idx !== -1) {
                users[idx].avatar = resultStr;
                Storage.set('users', users);
                Storage.set('currentUser', users[idx]);
                showToast('Profile picture updated!', 'success');
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="content">
            <style jsx global>{`
                .profile-header-card {
                    background: var(--bg-primary);
                    border-radius: 24px;
                    padding: 30px;
                    margin-bottom: 30px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 30px;
                    flex-wrap: wrap;
                }
                .avatar-container {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: var(--primary-light);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    color: var(--primary-color);
                    overflow: hidden;
                    border: 3px solid var(--primary-color);
                }
                .avatar-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .upload-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    text-align: center;
                    padding: 4px 0;
                    font-size: 11px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                }
                .profile-section {
                    background: var(--bg-primary);
                    border-radius: 24px;
                    padding: 30px;
                    margin-bottom: 30px;
                    border: 1px solid var(--border-color);
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid var(--border-color);
                }
                .section-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 0;
                }
                .section-title i {
                    color: var(--primary-color);
                }
                .account-info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 20px;
                }
                .info-item {
                    background: var(--bg-secondary);
                    padding: 20px;
                    border-radius: 16px;
                    transition: all 0.3s ease;
                }
                .info-item:hover {
                    transform: translateX(5px);
                }
                .info-label {
                    display: block;
                    font-size: 11px;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .info-value {
                    font-weight: 700;
                    font-size: 16px;
                    color: var(--text-primary);
                }
            `}</style>

            {/* Profile Summary Card */}
            <div className="profile-header-card">
                <div className="avatar-container">
                    {avatar ? (
                        <img src={avatar} alt="User Avatar" />
                    ) : (
                        <i className="fas fa-user"></i>
                    )}
                    <label className="upload-overlay">
                        <i className="fas fa-camera"></i>
                        <span>Edit</span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleAvatarUpload} 
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 8px 0' }}>{fullName || 'User'}</h2>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)' }}>{user?.email}</p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 10px', background: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                            {user?.membership ? user.membership.toUpperCase() : 'FREE'} WORKER
                        </span>
                        <span style={{ padding: '4px 10px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                            Referral ID: {user?.referralCode}
                        </span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setEditProfileOpen(true)}>
                    <i className="fas fa-edit" style={{ marginRight: '6px' }}></i> {tText("Edit Profile", "প্রোফাইল সম্পাদন")}
                </button>
            </div>

            {/* Account Information Section */}
            <section className="profile-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-info-circle"></i>
                        <span>{tText("Account Overview", "অ্যাকাউন্ট ওভারভিউ")}</span>
                    </h2>
                </div>
                <div className="account-info-grid">
                    <div className="info-item">
                        <span className="info-label">{tText("Full Name", "পুরো নাম")}</span>
                        <span className="info-value">{fullName}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">{tText("Phone Number", "ফোন নম্বর")}</span>
                        <span className="info-value">{phone || 'Not Configured'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">{tText("Email Address", "ইমেইল")}</span>
                        <span className="info-value">{user?.email}</span>
                    </div>
                </div>
            </section>

            {/* Payment / Billing Setup Section */}
            <section className="profile-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-credit-card"></i>
                        <span>{tText("Withdrawal Accounts", "উত্তোলন পদ্ধতিসমূহ")}</span>
                    </h2>
                    <button className="btn btn-sm btn-outline" onClick={() => setEditPaymentOpen(true)}>
                        <i className="fas fa-cog"></i> {tText("Configure", "কনফিগার করুন")}
                    </button>
                </div>
                <div className="account-info-grid">
                    <div className="info-item">
                        <span className="info-label">bKash Number</span>
                        <span className="info-value">{bkashNumber || 'Not Saved'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Nagad Number</span>
                        <span className="info-value">{nagadNumber || 'Not Saved'}</span>
                    </div>
                </div>
            </section>

            {/* Withdrawal History Card */}
            <section className="profile-section">
                <div className="section-header">
                    <h2 className="section-title">
                        <i className="fas fa-history"></i>
                        <span>{tText("Withdrawal History", "উত্তোলনের বিবরণী")}</span>
                    </h2>
                </div>
                <div className="withdrawal-list">
                    {withdrawals.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                            <i className="fas fa-exchange-alt" style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}></i>
                            <span>{tText("No withdrawals yet", "কোন উত্তোলনের রেকর্ড নেই")}</span>
                        </div>
                    ) : (
                        withdrawals.map((w) => {
                            const isPending = w.status === 'pending';
                            const isApproved = w.status === 'approved';
                            const statusColor = isApproved ? 'var(--success-color)' : isPending ? 'var(--warning-color)' : 'var(--danger-color)';

                            return (
                                <div key={w.id} className={`withdrawal-item ${w.status}`} style={{ borderLeftWidth: '4px', borderLeftStyle: 'solid', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div className="withdrawal-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                            <i className="fas fa-arrow-up"></i>
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '15px' }}>{tText('Withdrawal', 'উত্তোলন')} via {w.method?.toUpperCase()}</h4>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>To: {w.toNumber} • {new Date(w.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h4 style={{ margin: 0, fontSize: '16px', color: '#ef4444' }}>
                                            -৳{w.amount.toLocaleString()}
                                        </h4>
                                        <span style={{ fontSize: '12px', color: statusColor, fontWeight: 600 }}>
                                            {w.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Modal: Edit Profile */}
            {editProfileOpen && (
                <div className="modal-overlay active">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{tText("Edit Profile Details", "প্রোফাইল সংশোধন")}</h3>
                            <button className="modal-close" onClick={() => setEditProfileOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleProfileSubmit}>
                            <div className="modal-body">
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label htmlFor="editName">{tText("Full Name", "পুরো নাম")}</label>
                                    <input 
                                        type="text" 
                                        id="editName" 
                                        required 
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="editPhone">{tText("Phone Number", "ফোন নম্বর")}</label>
                                    <input 
                                        type="tel" 
                                        id="editPhone" 
                                        required 
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)' }}>
                                <button type="submit" className="btn btn-primary" disabled={submittingProfile}>
                                    {submittingProfile ? 'Saving...' : tText("Save Changes", "সংরক্ষণ করুন")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Payment Settings */}
            {editPaymentOpen && (
                <div className="modal-overlay active">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{tText("Configure Accounts", "অ্যাকাউন্ট কনফিগারেশন")}</h3>
                            <button className="modal-close" onClick={() => setEditPaymentOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handlePaymentSubmit}>
                            <div className="modal-body">
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label htmlFor="editBkash">bKash Mobile Account</label>
                                    <input 
                                        type="text" 
                                        id="editBkash" 
                                        placeholder="01XXXXXXXXX"
                                        value={bkashNumber}
                                        onChange={e => setBkashNumber(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="editNagad">Nagad Mobile Account</label>
                                    <input 
                                        type="text" 
                                        id="editNagad" 
                                        placeholder="01XXXXXXXXX"
                                        value={nagadNumber}
                                        onChange={e => setNagadNumber(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)' }}>
                                <button type="submit" className="btn btn-primary" disabled={submittingPayment}>
                                    {submittingPayment ? 'Saving...' : tText("Save Accounts", "অ্যাকাউন্ট সংরক্ষণ")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
