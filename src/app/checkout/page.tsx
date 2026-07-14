'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Navbar from '@/components/Navbar';
import db from '@/lib/database';
import Storage from '@/lib/storage';
import { Product } from '@/lib/products';

export default function CheckoutPage() {
    const { tText, tNum } = useTranslation();
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Form inputs state
    const [custName, setCustName] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [custAddress, setCustAddress] = useState('');
    const [payMethod, setPayMethod] = useState<'bkash' | 'nagad'>('bkash');
    const [transactionId, setTransactionId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user) {
            setCustName(user.name || user.fullName || '');
            setCustPhone(user.phone || '');
        }
    }, [user]);

    // Redirect if cart is empty and page is mounted
    useEffect(() => {
        if (mounted && cartItems.length === 0) {
            router.push('/products');
        }
    }, [cartItems, mounted, router]);

    if (!mounted || cartItems.length === 0) return null;

    const shippingFee = cartTotal > 15000 ? 0 : 100;
    const finalTotal = cartTotal + shippingFee;

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!custName.trim() || !custPhone.trim() || !custAddress.trim() || !transactionId.trim()) {
            showToast(tText("Please fill in all required fields", "অনুগ্রহ করে সব প্রয়োজনীয় ক্ষেত্র পূরণ করুন"), 'error');
            return;
        }

        setSubmitting(false);
        setSubmitting(true);

        try {
            const allOrders = Storage.get('orders') || [];
            const allProducts: Product[] = Storage.get('products') || [];
            
            // Generate checkout group ID so we can group these orders in buyer dashboard
            const checkoutGroupId = db.generateId().substring(0, 10);

            // Create individual order records for each cart item (compatible with admin panel schema)
            const newOrdersList: any[] = [];
            
            for (const item of cartItems) {
                const orderRecord = {
                    id: db.generateId(),
                    checkoutGroupId,
                    productName: item.product.name,
                    productId: item.product.id,
                    price: item.product.price,
                    quantity: item.quantity,
                    color: item.color || '',
                    totalAmount: item.product.price * item.quantity,
                    customerName: custName.trim(),
                    customerPhone: custPhone.trim(),
                    deliveryAddress: custAddress.trim(),
                    paymentMethod: payMethod,
                    transactionId: transactionId.trim(),
                    status: 'pending',
                    userId: user ? user.id : 'guest',
                    createdAt: new Date().toISOString()
                };

                newOrdersList.push(orderRecord);
                
                // Decrement stock
                const pIdx = allProducts.findIndex(p => p.id === item.product.id);
                if (pIdx !== -1) {
                    allProducts[pIdx].stock = Math.max(0, allProducts[pIdx].stock - item.quantity);
                }
            }

            // Save back to storage
            const updatedOrders = [...allOrders, ...newOrdersList];
            Storage.set('orders', updatedOrders);
            Storage.set('products', allProducts);

            showToast(tText("Order placed successfully!", "অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!"), 'success');
            clearCart();
            
            // Redirect to appropriate page
            setTimeout(() => {
                if (user && user.role === 'buyer') {
                    router.push('/buyer/dashboard');
                } else {
                    router.push('/products'); // Redirect guests to products page
                }
            }, 1500);

        } catch (error) {
            console.error('Checkout error:', error);
            showToast(tText("Failed to place order. Please try again.", "অর্ডার সম্পন্ন করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।"), 'error');
            setSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #090e17)', color: 'var(--text-primary)' }}>
            <Navbar />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px 60px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                    <Link href="/cart" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-arrow-left"></i>
                        <span>{tText("Back to Cart", "কার্টে ফিরুন")}</span>
                    </Link>
                </div>

                <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '25px' }}>
                    {tText("Checkout", "চেকআউট")}
                </h1>

                <form onSubmit={handleSubmitOrder} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }} className="lg:grid-cols-3">
                    
                    {/* Shipping & Payment Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="lg:col-span-2">
                        
                        {/* Shipping details */}
                        <div style={{ background: 'var(--bg-secondary, #121a24)', border: '1px solid var(--border-color, #1e293b)', borderRadius: '16px', padding: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                <i className="fas fa-truck text-emerald-500" style={{ marginRight: '10px' }}></i>
                                {tText("Shipping Address", "ডেলিভারি ঠিকানা")}
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{tText("Full Name *", "পূর্ণ নাম *")}</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={custName}
                                        onChange={e => setCustName(e.target.value)}
                                        placeholder={tText("Enter your full name", "আপনার পূর্ণ নাম লিখুন")}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{tText("Phone Number *", "মোবাইল নম্বর *")}</label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={custPhone}
                                        onChange={e => setCustPhone(e.target.value)}
                                        placeholder={tText("Enter your mobile number", "আপনার মোবাইল নম্বর লিখুন")}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{tText("Delivery Address *", "ডেলিভারি ঠিকানা *")}</label>
                                    <textarea 
                                        required
                                        rows={3}
                                        value={custAddress}
                                        onChange={e => setCustAddress(e.target.value)}
                                        placeholder={tText("Enter complete address (District, Area, Road/Village)", "সম্পূর্ণ ঠিকানা লিখুন (জেলা, এলাকা, রোড/গ্রাম)")}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'none', lineHeight: '1.4' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment details */}
                        <div style={{ background: 'var(--bg-secondary, #121a24)', border: '1px solid var(--border-color, #1e293b)', borderRadius: '16px', padding: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                <i className="fas fa-wallet text-emerald-500" style={{ marginRight: '10px' }}></i>
                                {tText("Payment Details", "পেমেন্ট বিবরণী")}
                            </h3>

                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '15px' }}>
                                {tText(
                                    `Please send the total price of ৳${finalTotal.toLocaleString()} to the bKash/Nagad number below, then enter your Transaction ID:`,
                                    `নীচের বিকাশ/নগদ নম্বরে সর্বমোট ৳${finalTotal.toLocaleString()} সেন্ডমানি বা পেমেন্ট করুন, তারপর আপনার ট্রানজেকশন আইডিটি লিখুন:`
                                )}
                            </p>

                            <div style={{ background: 'var(--bg-primary)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>bKash / Nagad Number:</div>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-color)', margin: '6px 0' }}>01783840582</div>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(16, 185, 129, 0.08)', padding: '4px 10px', borderRadius: '20px' }}>
                                    Type: Personal (Send Money)
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setPayMethod('bkash')}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: payMethod === 'bkash' ? '#e2125a' : 'var(--border-color)',
                                        background: payMethod === 'bkash' ? 'rgba(226, 18, 90, 0.08)' : 'none',
                                        color: payMethod === 'bkash' ? '#e2125a' : 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <i className="fas fa-mobile-alt"></i>
                                    <span>bKash</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPayMethod('nagad')}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: payMethod === 'nagad' ? '#f37021' : 'var(--border-color)',
                                        background: payMethod === 'nagad' ? 'rgba(243, 112, 33, 0.08)' : 'none',
                                        color: payMethod === 'nagad' ? '#f37021' : 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <i className="fas fa-mobile-alt"></i>
                                    <span>Nagad</span>
                                </button>
                            </div>

                            <div className="form-group">
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{tText("Transaction ID *", "ট্রানজেকশন আইডি *")}</label>
                                <input 
                                    type="text" 
                                    required
                                    value={transactionId}
                                    onChange={e => setTransactionId(e.target.value)}
                                    placeholder="e.g. A9B8C7D6E5"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Order summary column */}
                    <div style={{ 
                        background: 'var(--bg-secondary, #121a24)', 
                        border: '1px solid var(--border-color, #1e293b)', 
                        borderRadius: '16px', 
                        padding: '24px',
                        height: 'fit-content'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            {tText("Order Summary", "অর্ডার বিবরণী")}
                        </h3>

                        {/* Items recap */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                            {cartItems.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'left', flex: '1', paddingRight: '10px' }}>
                                        <div style={{ fontWeight: 600, maxWidth: '180px' }} className="truncate">{item.product.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            {item.color ? `${item.color} • ` : ''}Qty: {item.quantity}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        ৳{(item.product.price * item.quantity).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '15px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                <span>{tText("Subtotal", "উপ-মোট")}</span>
                                <span style={{ color: 'var(--text-primary)' }}>৳{cartTotal.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                <span>{tText("Delivery Fee", "ডেলিভারি চার্জ")}</span>
                                <span style={{ color: 'var(--text-primary)' }}>
                                    {shippingFee === 0 ? (
                                        <span style={{ color: '#10b981', fontWeight: 600 }}>{tText("Free", "ফ্রি")}</span>
                                    ) : (
                                        `৳${shippingFee}`
                                    )}
                                </span>
                            </div>
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '18px', 
                            fontWeight: 700, 
                            borderTop: '1px solid var(--border-color)', 
                            paddingTop: '15px', 
                            marginBottom: '25px' 
                        }}>
                            <span>{tText("Total", "সর্বমোট")}</span>
                            <span style={{ color: 'var(--primary-color)' }}>৳{finalTotal.toLocaleString()}</span>
                        </div>

                        <button 
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary btn-block"
                            style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 700 }}
                        >
                            {submitting ? (
                                <span>{tText("Processing...", "প্রক্রিয়াধীন...")}</span>
                            ) : (
                                <span>{tText("Confirm Order", "অর্ডার নিশ্চিত করুন")}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            
            <style jsx global>{`
                @media (min-width: 1024px) {
                    .lg\\:grid-cols-3 {
                        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                    }
                    .lg\\:col-span-2 {
                        grid-column: span 2 / span 2 !important;
                    }
                }
                .truncate {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>
        </div>
    );
}
