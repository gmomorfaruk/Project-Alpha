'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Navbar from '@/components/Navbar';
import Storage from '@/lib/storage';

interface Order {
    id: string;
    checkoutGroupId?: string;
    productName: string;
    productId: string;
    price: number;
    quantity: number;
    color: string;
    totalAmount: number;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    paymentMethod: 'bkash' | 'nagad';
    transactionId: string;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    userId: string;
    createdAt: string;
}

export default function BuyerDashboard() {
    const { tText, tNum } = useTranslation();
    const { user, isAuthenticated, logout } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    
    // Order states
    const [orders, setOrders] = useState<Order[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled'>('all');

    useEffect(() => {
        setMounted(true);
    }, []);

    // Route guard
    useEffect(() => {
        if (mounted) {
            if (!isAuthenticated || !user) {
                router.push('/login');
            } else if (user.role !== 'buyer') {
                router.push('/dashboard');
            } else {
                // Load user's orders
                const allOrders: Order[] = Storage.get('orders') || [];
                const userOrders = allOrders.filter(o => o.userId === user.id);
                // Sort by date descending
                userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setOrders(userOrders);
            }
        }
    }, [mounted, isAuthenticated, user, router]);

    if (!mounted || !user || user.role !== 'buyer') return null;

    const filteredOrders = orders.filter(o => {
        if (filterStatus === 'all') return true;
        return o.status === filterStatus;
    });

    const getStatusStyle = (status: Order['status']) => {
        switch (status) {
            case 'pending':
                return { background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.2)' };
            case 'shipped':
                return { background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.2)' };
            case 'delivered':
                return { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' };
            case 'cancelled':
                return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
        }
    };

    const getStatusText = (status: Order['status']) => {
        switch (status) {
            case 'pending': return tText('Pending', 'পেন্ডিং');
            case 'shipped': return tText('Shipped', 'শিপড হয়েছে');
            case 'delivered': return tText('Delivered', 'ডেলিভারড');
            case 'cancelled': return tText('Cancelled', 'বাতিল');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #090e17)', color: 'var(--text-primary)' }}>
            <Navbar />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px 60px 20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>
                    
                    {/* Buyer Info Card */}
                    <div style={{ 
                        flex: '1', 
                        minWidth: '280px', 
                        maxWidth: '350px',
                        background: 'var(--bg-secondary, #121a24)', 
                        border: '1px solid var(--border-color, #1e293b)', 
                        borderRadius: '16px', 
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                            <div style={{ 
                                width: '70px', 
                                height: '70px', 
                                borderRadius: '50%', 
                                background: 'var(--primary-light, rgba(16, 185, 129, 0.15))', 
                                color: 'var(--primary-color)',
                                fontSize: '28px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '12px'
                            }}>
                                <i className="fas fa-user"></i>
                            </div>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>{user.name}</h2>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(16, 185, 129, 0.08)', padding: '3px 10px', borderRadius: '20px' }}>
                                {tText("Buyer Account", "ক্রেতা অ্যাকাউন্ট")}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                            <div>
                                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>{tText("Email Address", "ইমেইল")}</span>
                                <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>{tText("Phone Number", "মোবাইল নম্বর")}</span>
                                <strong style={{ color: 'var(--text-primary)' }}>{user.phone}</strong>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>{tText("Registered On", "নিবন্ধন তারিখ")}</span>
                                <strong style={{ color: 'var(--text-primary)' }}>
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                </strong>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                logout();
                                showToast(tText("Logged out successfully", "সফলভাবে লগআউট করা হয়েছে"), 'info');
                            }}
                            className="btn btn-outline"
                            style={{ borderColor: '#ef4444', color: '#ef4444', background: 'none', padding: '10px', width: '100%', fontSize: '13px', fontWeight: 600 }}
                        >
                            <i className="fas fa-sign-out-alt" style={{ marginRight: '6px' }}></i>
                            {tText("Logout", "লগআউট")}
                        </button>
                    </div>

                    {/* Orders tracking list */}
                    <div style={{ flex: '3', minWidth: '320px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                                {tText("My Retail Orders", "আমার খুচরা অর্ডারসমূহ")}
                            </h2>
                            
                            {/* Filter Status */}
                            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                {(['all', 'pending', 'shipped', 'delivered', 'cancelled'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: filterStatus === status ? 'var(--primary-color)' : 'none',
                                            color: filterStatus === status ? 'white' : 'var(--text-secondary)',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            fontWeight: filterStatus === status ? 600 : 400,
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {status === 'all' ? tText('All', 'সব') : status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div style={{ 
                                background: 'var(--bg-secondary, #121a24)', 
                                border: '1px solid var(--border-color, #1e293b)', 
                                borderRadius: '16px', 
                                padding: '60px 20px', 
                                textAlign: 'center',
                                color: 'var(--text-secondary)'
                            }}>
                                <i className="fas fa-box-open" style={{ fontSize: '40px', marginBottom: '15px', color: 'var(--border-color)' }}></i>
                                <p style={{ fontSize: '15px', margin: 0 }}>
                                    {tText("No orders found matching the filter", "এই ক্যাটাগরিতে কোনো অর্ডার পাওয়া যায়নি")}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {filteredOrders.map(order => (
                                    <div 
                                        key={order.id}
                                        style={{ 
                                            background: 'var(--bg-secondary, #121a24)', 
                                            border: '1px solid var(--border-color, #1e293b)', 
                                            borderRadius: '16px', 
                                            padding: '20px',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr',
                                            gap: '15px'
                                        }}
                                        className="order-card-grid"
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    {tText("Order ID", "অর্ডার আইডি")}: <strong style={{ color: 'var(--text-primary)' }}>#{order.id.substring(0, 8).toUpperCase()}</strong>
                                                </span>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                    {tText("Placed on", "অর্ডার করার তারিখ")}: {new Date(order.createdAt).toLocaleString()}
                                                </div>
                                            </div>

                                            <span style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '6px', 
                                                fontSize: '11px', 
                                                fontWeight: 600,
                                                ...getStatusStyle(order.status)
                                            }}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0' }}>
                                            <div style={{ 
                                                width: '50px', 
                                                height: '50px', 
                                                borderRadius: '8px', 
                                                background: 'var(--primary-light, rgba(16, 185, 129, 0.1))', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                fontSize: '20px', 
                                                color: 'var(--primary-color)' 
                                            }}>
                                                <i className="fas fa-box"></i>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600 }}>{order.productName}</h4>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    {order.color ? `${tText("Color", "রং")}: ${order.color} • ` : ''}Qty: {order.quantity}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-color)' }}>
                                                ৳{order.totalAmount.toLocaleString()}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '12px', color: 'var(--text-secondary)' }} className="md:grid-cols-2">
                                            <div>
                                                <i className="fas fa-map-marker-alt text-emerald-500" style={{ marginRight: '6px' }}></i>
                                                <span>{tText("Delivery Address", "ডেলিভারি ঠিকানা")}:</span>
                                                <p style={{ margin: '4px 0 0 15px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{order.deliveryAddress}</p>
                                            </div>
                                            <div>
                                                <i className="fas fa-receipt text-emerald-500" style={{ marginRight: '6px' }}></i>
                                                <span>{tText("Payment Info", "পেমেন্ট বিবরণ")}:</span>
                                                <p style={{ margin: '4px 0 0 15px', color: 'var(--text-primary)' }}>
                                                    <span style={{ textTransform: 'uppercase' }}>{order.paymentMethod}</span> • Txn ID: <strong style={{ color: 'var(--primary-color)' }}>{order.transactionId}</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media (min-width: 768px) {
                    .md\\:grid-cols-2 {
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    }
                }
            `}</style>
        </div>
    );
}
