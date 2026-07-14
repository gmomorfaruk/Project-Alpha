'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Navbar from '@/components/Navbar';

export default function CartPage() {
    const { tText, tNum } = useTranslation();
    const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
    const { user, isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const shippingFee = cartTotal > 15000 || cartTotal === 0 ? 0 : 100;
    const finalTotal = cartTotal + shippingFee;

    const handleCheckoutRedirect = () => {
        if (cartItems.length === 0) {
            showToast(tText("Your cart is empty", "আপনার কার্ট খালি"), 'error');
            return;
        }
        router.push('/checkout');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #090e17)', color: 'var(--text-primary)' }}>
            <Navbar />
            
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px 60px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                    <Link href="/products" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-arrow-left"></i>
                        <span>{tText("Back to Products", "পণ্য তালিকায় ফিরুন")}</span>
                    </Link>
                </div>

                <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '25px' }}>
                    {tText("Shopping Cart", "শপিং কার্ট")}
                </h1>

                {cartItems.length === 0 ? (
                    <div style={{ 
                        background: 'var(--bg-secondary, #121a24)', 
                        border: '1px solid var(--border-color, #1e293b)', 
                        borderRadius: '16px', 
                        padding: '60px 20px', 
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '15px'
                    }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'var(--primary-color)', marginBottom: '10px' }}>
                            <i className="fas fa-shopping-cart" style={{ alignSelf: 'center' }}></i>
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{tText("Your cart is empty", "আপনার কার্টটি বর্তমানে খালি")}</h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '14px', lineHeight: '1.5' }}>
                            {tText("You haven't added any products to your cart yet. Explore our store to find premium items.", "আপনি এখনও কার্টে কোনো পণ্য যোগ করেননি। আমাদের প্রিমিয়াম পণ্যগুলো দেখতে দোকানটি ভিজিট করুন।")}
                        </p>
                        <Link href="/products" className="btn btn-primary" style={{ marginTop: '10px', padding: '10px 24px', textDecoration: 'none' }}>
                            {tText("Start Shopping", "শপিং শুরু করুন")}
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }} className="lg:grid-cols-3">
                        {/* Cart items list - takes 2 cols on desktop */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }} className="lg:col-span-2">
                            {cartItems.map((item, idx) => (
                                <div 
                                    key={idx}
                                    style={{ 
                                        background: 'var(--bg-secondary, #121a24)', 
                                        border: '1px solid var(--border-color, #1e293b)', 
                                        borderRadius: '16px', 
                                        padding: '20px',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '20px'
                                    }}
                                >
                                    {/* Product details */}
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', minWidth: '250px', flex: '1' }}>
                                        <div style={{ 
                                            width: '70px', 
                                            height: '70px', 
                                            borderRadius: '12px', 
                                            background: 'var(--primary-light, rgba(16, 185, 129, 0.1))', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            fontSize: '28px', 
                                            color: 'var(--primary-color)' 
                                        }}>
                                            <i className={`fas ${item.product.image || 'fa-box'}`}></i>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{item.product.name}</h3>
                                            <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {item.color && (
                                                    <span>{tText("Color", "রং")}: <strong style={{ color: 'var(--text-primary)' }}>{item.color}</strong></span>
                                                )}
                                                <span>{tText("Unit Price", "একক মূল্য")}: <strong style={{ color: 'var(--text-primary)' }}>৳{item.product.price.toLocaleString()}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quantity controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button 
                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.color)}
                                            style={{ 
                                                width: '32px', 
                                                height: '32px', 
                                                borderRadius: '8px', 
                                                border: '1px solid var(--border-color)', 
                                                background: 'none', 
                                                color: 'var(--text-primary)', 
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <i className="fas fa-minus" style={{ fontSize: '10px' }}></i>
                                        </button>
                                        <span style={{ fontSize: '16px', fontWeight: 600, width: '25px', textAlign: 'center' }}>
                                            {tNum(item.quantity)}
                                        </span>
                                        <button 
                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.color)}
                                            style={{ 
                                                width: '32px', 
                                                height: '32px', 
                                                borderRadius: '8px', 
                                                border: '1px solid var(--border-color)', 
                                                background: 'none', 
                                                color: 'var(--text-primary)', 
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <i className="fas fa-plus" style={{ fontSize: '10px' }}></i>
                                        </button>
                                    </div>

                                    {/* Item total price and delete */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minWidth: '130px', justifyContent: 'flex-end' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-color)' }}>
                                                ৳{(item.product.price * item.quantity).toLocaleString()}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                removeFromCart(item.product.id, item.color);
                                                showToast(tText("Item removed", "পণ্যটি সরানো হয়েছে"), 'info');
                                            }}
                                            style={{ 
                                                background: 'none', 
                                                border: 'none', 
                                                color: '#ef4444', 
                                                cursor: 'pointer',
                                                padding: '8px',
                                                fontSize: '16px'
                                            }}
                                            title={tText("Remove item", "আইটেম মুছুন")}
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                <button 
                                    onClick={() => {
                                        clearCart();
                                        showToast(tText("Cart cleared", "কার্ট খালি করা হয়েছে"), 'info');
                                    }}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: 'var(--text-secondary)', 
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <i className="fas fa-trash"></i>
                                    <span>{tText("Clear Cart", "কার্ট সম্পূর্ণ খালি করুন")}</span>
                                </button>
                                <Link href="/products" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                                    {tText("Continue Shopping", "আরও পণ্য কিনুন")}
                                </Link>
                            </div>
                        </div>

                        {/* Cart Summary Card */}
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
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
                                {shippingFee > 0 && (
                                    <div style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                                        {tText("Tip: Shop for ৳15,000+ to get Free Shipping!", "পরামর্শ: ফ্রি শিপিং পেতে ৳১৫,০০০+ মূল্যের শপিং করুন!")}
                                    </div>
                                )}
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
                                onClick={handleCheckoutRedirect}
                                className="btn btn-primary btn-block"
                                style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 700 }}
                            >
                                {tText("Proceed to Checkout", "চেকআউট করতে এগিয়ে যান")}
                            </button>
                        </div>
                    </div>
                )}
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
            `}</style>
        </div>
    );
}
