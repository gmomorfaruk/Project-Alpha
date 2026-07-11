'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

interface SelfSellInvestment {
    id: string;
    productName: string;
    units: number;
    amount: number;
    price?: number;
    status: string;
    sellMode: string;
}

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
}

function SellProofsContent() {
    const { user } = useAuth();
    const { tText, tNum } = useTranslation();
    const { showToast } = useToast();
    const searchParams = useSearchParams();

    // Data lists
    const [investments, setInvestments] = useState<SelfSellInvestment[]>([]);
    const [proofs, setProofs] = useState<SellProof[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // Bonus settings
    const [bonusEnabled, setBonusEnabled] = useState(true);
    const [baseBonusPoints, setBaseBonusPoints] = useState(500);
    const [bonusPercent, setBonusPercent] = useState(5);
    const [maxBonusPoints, setMaxBonusPoints] = useState(5000);

    // Form inputs state
    const [selectedInvId, setSelectedInvId] = useState('');
    const [unitsSold, setUnitsSold] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [notes, setNotes] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Load self-sell active investments
        const allInv = Storage.get('investments') || [];
        const selfSell = allInv.filter(
            (inv: any) => inv.userId === user.id && inv.sellMode === 'self' && inv.status === 'active'
        );
        setInvestments(selfSell);

        // Load existing proofs
        const allProofs = Storage.get('sellProofs') || [];
        const userProofs = allProofs.filter((p: any) => {
            return selfSell.some((inv: any) => inv.id === p.investmentId) || p.userId === user.id;
        });
        setProofs(userProofs);

        // Load bonus configuration
        const settings = Storage.get('workSettings') || {};
        if (settings.sellBonusEnabled === false) {
            setBonusEnabled(false);
        } else {
            setBonusEnabled(true);
            setBaseBonusPoints(settings.sellBonusPoints || 500);
            setBonusPercent(settings.sellBonusPercent || 5);
            setMaxBonusPoints(settings.sellBonusMax || 5000);
        }

        // Pre-select investment if present in search params query
        const queryInvId = searchParams.get('investment');
        if (queryInvId && selfSell.some((inv: any) => inv.id === queryInvId)) {
            setSelectedInvId(queryInvId);
        }
    }, [user, searchParams]);

    const calculateSellBonus = (productValue: number, qty: number) => {
        if (!bonusEnabled) return 0;
        let bonus = baseBonusPoints;
        if (bonusPercent > 0) {
            bonus += Math.floor((productValue * bonusPercent) / 100);
        }
        if (maxBonusPoints > 0 && bonus > maxBonusPoints) {
            bonus = maxBonusPoints;
        }
        return bonus;
    };

    // File Preview
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size exceeds 5MB limit', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!selectedInvId) {
            showToast('Please select an active investment', 'error');
            return;
        }

        const inv = investments.find(item => item.id === selectedInvId);
        if (!inv) {
            showToast('Selected investment could not be loaded', 'error');
            return;
        }

        const qty = parseInt(unitsSold);
        if (isNaN(qty) || qty <= 0) {
            showToast('Please enter a valid unit quantity', 'error');
            return;
        }

        if (qty > inv.units) {
            showToast(`Quantity sold cannot exceed investment units (${inv.units})`, 'error');
            return;
        }

        if (!buyerName.trim()) {
            showToast('Please enter buyer name', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const unitPrice = inv.price || (inv.amount / inv.units) || 0;
            const productValue = unitPrice * qty;
            const potentialBonus = calculateSellBonus(productValue, qty);

            const newProof: SellProof = {
                id: db.generateId(),
                investmentId: selectedInvId,
                productName: inv.productName,
                productValue: productValue,
                unitsSold: qty,
                buyerName: buyerName.trim(),
                notes: notes.trim(),
                imageUrl: imagePreview,
                status: 'pending',
                bonusPoints: potentialBonus,
                submittedAt: new Date().toISOString()
            };

            const allProofs = Storage.get('sellProofs') || [];
            allProofs.unshift(newProof);
            Storage.set('sellProofs', allProofs);

            showToast(`Sell proof submitted! Potential bonus: ${potentialBonus} points`, 'success');
            
            // Clear Form
            setSelectedInvId('');
            setUnitsSold('');
            setBuyerName('');
            setNotes('');
            setImagePreview(null);

            // Reload proofs
            setProofs(allProofs.filter((p: any) => {
                return investments.some((invItem: any) => invItem.id === p.investmentId) || p.userId === user.id;
            }));
        } catch (err) {
            showToast('Failed to submit sell proof', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredProofs = proofs.filter((p) => {
        if (activeFilter === 'all') return true;
        return p.status === activeFilter;
    });

    const formatMoney = (val: number) => {
        return `৳${tNum((val || 0).toLocaleString())}`;
    };

    return (
        <div className="fintech-sellproofs-view">
            <style jsx global>{`
                .fintech-sellproofs-view {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                /* Pinterest Masonry layout styling */
                .masonry-proofs-grid {
                    column-count: 3;
                    column-gap: 20px;
                    width: 100%;
                }

                @media (max-width: 992px) {
                    .masonry-proofs-grid {
                        column-count: 2;
                    }
                }

                @media (max-width: 600px) {
                    .masonry-proofs-grid {
                        column-count: 1;
                    }
                }

                .masonry-item {
                    display: inline-block;
                    width: 100%;
                    margin-bottom: 20px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .masonry-item:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-card-hover);
                }

                .masonry-img-wrapper {
                    width: 100%;
                    background: var(--bg-hover);
                    position: relative;
                    border-bottom: 1px solid var(--border-light);
                }

                .masonry-img-placeholder {
                    height: 140px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    font-size: 32px;
                }

                .masonry-img {
                    width: 100%;
                    height: auto;
                    display: block;
                }

                .masonry-body {
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .masonry-title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .masonry-title-row h4 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .masonry-details {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .masonry-notes {
                    background: var(--bg-hover);
                    padding: 8px 12px;
                    border-radius: var(--radius-sm);
                    font-size: 11px;
                    color: var(--text-muted);
                    border-left: 3px solid var(--primary-color);
                }

                .masonry-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 12px;
                    border-top: 1px solid var(--border-light);
                }
            `}</style>

            <div className="page-header">
                <h1>{tText("Sell Proofs Log", "বিক্রয় প্রমাণ লগ")}</h1>
                <p>{tText("Upload and inspect validation receipts for your self-sell portfolio transactions", "আপনার সেলফ-সেল পোর্টফোলিও লেনদেনের যাচাইকরণ রসিদ আপলোড এবং পরিদর্শন করুন")}</p>
            </div>

            {/* Sales Bonus Reward Header */}
            {bonusEnabled && (
                <div className="premium-banner" style={{ background: '#0F172A', marginBottom: 0 }}>
                    <div className="banner-visual-circles">
                        <div className="circle-1"></div>
                        <div className="circle-2"></div>
                    </div>
                    <div className="banner-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                        <i className="fas fa-gift"></i>
                    </div>
                    <div className="banner-info-box">
                        <h4>{tText("Earn Bonus Points for Every Verified Sale!", "প্রতিটি যাচাইকৃত বিক্রয়ের জন্য বোনাস পয়েন্ট অর্জন করুন!")}</h4>
                        <p>
                            {tText(
                                `Get a flat reward of ${tNum(baseBonusPoints)} points + ${tNum(bonusPercent)}% of total product value (Max: ${tNum(maxBonusPoints)} pts) when proofs are approved.`,
                                `প্রমাণ অনুমোদিত হলে ফ্ল্যাট ${tNum(baseBonusPoints)} পয়েন্ট + মোট মূল্যের ${tNum(bonusPercent)}% (সর্বোচ্চ: ${tNum(maxBonusPoints)} পয়েন্ট) রিওয়ার্ড পান।`
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Redesigned Submission Card */}
            <div className="tab-content-card">
                <h3><i className="fas fa-upload" style={{ marginRight: '10px', color: 'var(--primary-color)' }}></i>{tText("Submit New Sell Proof", "বিক্রয় প্রমাণ দাখিল")}</h3>
                <p className="subtitle">{tText("Provide buyer details, unit volumes, and uploading invoice screenshot", "ক্রেতার তথ্য, বিক্রিত পরিমাণ এবং চালানের স্ক্রিনশট প্রদান করুন")}</p>
                
                <form onSubmit={handleFormSubmit} className="fintech-form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div className="form-group">
                            <label htmlFor="investmentSelect">{tText("Select Portfolio Investment", "বিনিয়োগ নির্বাচন করুন")}</label>
                            <select 
                                id="investmentSelect" 
                                required
                                value={selectedInvId}
                                onChange={e => setSelectedInvId(e.target.value)}
                                style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                            >
                                <option value="">-- Choose Self-Sell Package --</option>
                                {investments.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.productName} ({tNum(inv.units)} units)</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="unitsSold">{tText("Units Quantity Sold", "বিক্রীত ইউনিট")}</label>
                            <input 
                                type="number" 
                                id="unitsSold" 
                                min="1" 
                                required 
                                placeholder="e.g. 5"
                                value={unitsSold}
                                onChange={e => setUnitsSold(e.target.value)}
                                style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label htmlFor="buyerName">{tText("Buyer Name", "ক্রেতার নাম")}</label>
                        <input 
                            type="text" 
                            id="buyerName" 
                            required 
                            placeholder="Enter buyer's full name"
                            value={buyerName}
                            onChange={e => setBuyerName(e.target.value)}
                            style={{ width: '100%', height: '48px', padding: '0 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    {/* Screenshot file upload drag zone */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label>{tText("Upload Receipt/Invoice Image", "প্রমাণ ছবি")}</label>
                        <label className="screenshot-dropzone">
                            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                            <i className="fas fa-cloud-upload-alt"></i>
                            <p>{tText("Click to select image file", "ছবি ফাইল নির্বাচন করতে ক্লিক করুন")}</p>
                            <span>{tText("PNG, JPG up to 5MB", "PNG, JPG সর্বোচ্চ ৫ মেগাবাইট")}</span>
                            
                            {imagePreview && (
                                <div className="preview-image-box" onClick={(e) => e.stopPropagation()}>
                                    <img src={imagePreview} alt="Receipt preview" />
                                    <button 
                                        type="button" 
                                        className="preview-remove-btn"
                                        onClick={handleRemoveImage}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            )}
                        </label>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label htmlFor="proofNotes">{tText("Additional Transaction Details", "অতিরিক্ত নোট (ঐচ্ছিক)")}</label>
                        <textarea 
                            id="proofNotes" 
                            rows={3} 
                            placeholder="Provide any tracking numbers or checkout references..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '14px', background: 'var(--bg-hover)', color: 'var(--text-primary)', outline: 'none' }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={submitting}
                        style={{ height: '48px', borderRadius: '14px', width: '100%', fontSize: '14px', fontWeight: 600 }}
                    >
                        {submitting ? 'Submitting...' : tText("Submit Proof Receipt", "প্রমাণ জমা দিন")}
                    </button>
                </form>
            </div>

            {/* List Submitted Proofs with Pinterest Masonry */}
            <div className="proofs-ledger-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ margin: 0 }}>{tText("Submitted Verification Proofs", "জমা দেওয়া প্রমাণসমূহ")}</h3>
                    
                    <div className="wallet-tabs-bar" style={{ padding: '4px' }}>
                        <button className={`wallet-tab-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>{tText("All", "সব")}</button>
                        <button className={`wallet-tab-btn ${activeFilter === 'pending' ? 'active' : ''}`} onClick={() => setActiveFilter('pending')}>{tText("Pending", "মুলতুবি")}</button>
                        <button className={`wallet-tab-btn ${activeFilter === 'approved' ? 'active' : ''}`} onClick={() => setActiveFilter('approved')}>{tText("Approved", "অনুমোদিত")}</button>
                        <button className={`wallet-tab-btn ${activeFilter === 'rejected' ? 'active' : ''}`} onClick={() => setActiveFilter('rejected')}>{tText("Rejected", "প্রত্যাখ্যাত")}</button>
                    </div>
                </div>

                {filteredProofs.length === 0 ? (
                    <div className="tab-content-card" style={{ textAlign: 'center', padding: '48px' }}>
                        <i className="fas fa-receipt" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}></i>
                        <h3>{tText("No proofs found", "কোন প্রমাণ পাওয়া যায়নি")}</h3>
                        <p>{tText("Verify your sales by submitting a proof form above", "উপরের ফর্মটি ব্যবহার করে আপনার বিক্রয়ের প্রমান আপলোড করুন")}</p>
                    </div>
                ) : (
                    <div className="masonry-proofs-grid">
                        {filteredProofs.map((p) => {
                            const isApproved = p.status === 'approved';
                            const isRejected = p.status === 'rejected';
                            const statusClass = isApproved ? 'approved' : isRejected ? 'rejected' : 'pending';

                            return (
                                <div key={p.id} className="masonry-item">
                                    <div className="masonry-img-wrapper">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} className="masonry-img" alt={p.productName} />
                                        ) : (
                                            <div className="masonry-img-placeholder">
                                                <i className="fas fa-file-invoice-dollar"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="masonry-body">
                                        <div className="masonry-title-row">
                                            <h4>{p.productName}</h4>
                                        </div>

                                        <div className="masonry-details">
                                            <span><strong>Quantity:</strong> {tNum(p.unitsSold)} units</span>
                                            <span><strong>Buyer:</strong> {p.buyerName}</span>
                                            <span><strong>Value:</strong> {formatMoney(p.productValue)}</span>
                                            <span><strong>Date:</strong> {new Date(p.submittedAt).toLocaleDateString()}</span>
                                        </div>

                                        {p.notes && (
                                            <div className="masonry-notes">
                                                {p.notes}
                                            </div>
                                        )}

                                        {p.bonusPoints > 0 && (
                                            <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="fas fa-gift"></i> 
                                                <span>{isApproved ? 'Verified Bonus:' : 'Potential Bonus:'} {tNum(p.bonusPoints)} pts</span>
                                            </div>
                                        )}

                                        <div className="masonry-footer">
                                            <span className={`status-badge ${statusClass}`}>
                                                {p.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ClientSellProofsPage() {
    return (
        <Suspense fallback={<div>Loading sell proofs...</div>}>
            <SellProofsContent />
        </Suspense>
    );
}
