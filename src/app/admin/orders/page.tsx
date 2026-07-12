'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';

interface Order {
    id: string;
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
    createdAt: string;
}

export default function AdminOrdersPage() {
    const { showToast } = useToast();

    // Data states
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Stats
    const [totalCount, setTotalCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [deliveredCount, setDeliveredCount] = useState(0);

    // Modal state
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        loadOrdersData();
    }, []);

    const loadOrdersData = () => {
        const allOrders: Order[] = Storage.get('orders') || [];
        setOrders(allOrders);
        setTotalCount(allOrders.length);
        setPendingCount(allOrders.filter(o => o.status === 'pending').length);
        setDeliveredCount(allOrders.filter(o => o.status === 'delivered').length);
    };

    const handleUpdateStatus = (orderId: string, newStatus: 'shipped' | 'delivered' | 'cancelled') => {
        try {
            const allOrders: Order[] = Storage.get('orders') || [];
            const idx = allOrders.findIndex(o => o.id === orderId);
            if (idx !== -1) {
                allOrders[idx].status = newStatus;
                Storage.set('orders', allOrders);
                showToast(`Order status updated to ${newStatus} successfully`, 'success');
                loadOrdersData();
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status: newStatus });
                }
            }
        } catch (err) {
            showToast('Failed to update order status', 'error');
        }
    };

    const handleDeleteOrder = (orderId: string) => {
        if (!window.confirm('Are you sure you want to permanently delete this order?')) return;
        try {
            const allOrders: Order[] = Storage.get('orders') || [];
            const updated = allOrders.filter(o => o.id !== orderId);
            Storage.set('orders', updated);
            showToast('Order record deleted successfully', 'success');
            setDetailsOpen(false);
            loadOrdersData();
        } catch (err) {
            showToast('Failed to delete order record', 'error');
        }
    };

    const filteredOrders = orders.filter((o) => {
        const matchesQuery = 
            o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            o.customerPhone.includes(searchQuery) ||
            o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.transactionId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
        return matchesQuery && matchesStatus;
    });

    return (
        <div>
            <div className="page-header">
                <h1>Customer Retail Orders</h1>
                <p>Verify payments and manage shipping status for guest purchases</p>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-shopping-basket"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{totalCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Total Orders</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-clock"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{pendingCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Pending Orders</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-check-circle"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{deliveredCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Completed Deliveries</p>
                </div>
            </div>

            {/* Main Orders List */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '25px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <div className="search-box" style={{ maxWidth: '300px', width: '100%', position: 'relative', flexShrink: 0 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search orders (name, phone, txn)..." 
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
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '12px 8px' }}>Customer</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Total</th>
                                <th>Payment (TxID)</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                        <i className="fas fa-shopping-basket" style={{ fontSize: '40px', color: 'var(--text-secondary)', marginBottom: '10px' }}></i>
                                        <p style={{ color: 'var(--text-secondary)' }}>No retail orders found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 8px' }}>
                                            <div style={{ fontWeight: 600, color: 'white' }}>{order.customerName}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{order.customerPhone}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{order.productName}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Color: {order.color}</div>
                                        </td>
                                        <td>{order.quantity}</td>
                                        <td><strong>৳{order.totalAmount.toLocaleString()}</strong></td>
                                        <td>
                                            <span style={{ textTransform: 'uppercase', fontSize: '10px', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', border: '1px solid var(--border-color)' }}>{order.paymentMethod}</span>
                                            <code style={{ fontSize: '12px', color: '#10b981' }}>{order.transactionId}</code>
                                        </td>
                                        <td>
                                            <span className={`badge ${
                                                order.status === 'pending' ? 'badge-warning' :
                                                order.status === 'shipped' ? 'badge-info' :
                                                order.status === 'delivered' ? 'badge-success' : 'badge-danger'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    onClick={() => { setSelectedOrder(order); setDetailsOpen(true); }}
                                                    style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                                                >
                                                    <i className="fas fa-eye"></i> Details
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Order Details */}
            {detailsOpen && selectedOrder && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '550px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Order Invoice Details</h3>
                            <button className="modal-close" onClick={() => setDetailsOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Customer Details</label>
                                    <div style={{ fontWeight: 600, color: 'white', fontSize: '15px' }}>{selectedOrder.customerName}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedOrder.customerPhone}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Order ID</label>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><code>{selectedOrder.id}</code></div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '15px 0', marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Product Summary</label>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                    <strong>{selectedOrder.productName} ({selectedOrder.color})</strong>
                                    <span>৳{selectedOrder.price.toLocaleString()} x {selectedOrder.quantity}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '16px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                                    <strong>Total Amount Paid</strong>
                                    <strong style={{ color: '#10b981' }}>৳{selectedOrder.totalAmount.toLocaleString()}</strong>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Shipping Address</label>
                                <p style={{ margin: '4px 0 0 0', color: 'white', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                                    {selectedOrder.deliveryAddress}
                                </p>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Payment Method & Txn ID</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                    <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 600, background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>{selectedOrder.paymentMethod}</span>
                                    <span style={{ fontSize: '14px', color: '#10b981', fontFamily: 'monospace', fontWeight: 600 }}>{selectedOrder.transactionId}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                                {selectedOrder.status === 'pending' && (
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                                        style={{ flex: 1 }}
                                    >
                                        <i className="fas fa-truck" style={{ marginRight: '6px' }}></i> Mark as Shipped
                                    </button>
                                )}
                                {selectedOrder.status === 'shipped' && (
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                                        style={{ flex: 1, background: '#10b981', borderColor: '#10b981' }}
                                    >
                                        <i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i> Mark as Delivered
                                    </button>
                                )}
                                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                                    <button 
                                        className="btn btn-outline" 
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                                        style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                    >
                                        Cancel Order
                                    </button>
                                )}
                                <button 
                                    className="btn btn-outline" 
                                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                                    style={{ color: '#999', borderColor: '#444' }}
                                >
                                    Delete Record
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
