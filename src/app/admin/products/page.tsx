'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

interface Product {
    id: string;
    name: string;
    category: 'electronics' | 'fashion' | 'home' | 'health';
    price: number;
    returnRate: number;
    duration: number; // in days
    stock: number;
    minUnits: number;
    description: string;
    image?: string;
    active: boolean;
    createdAt: string;
}

const defaultProductsList: Product[] = [
    {
        id: '1',
        name: 'Smart Watch Pro',
        category: 'electronics',
        price: 5000,
        returnRate: 15,
        duration: 30,
        stock: 50,
        minUnits: 1,
        description: 'Premium smart watch with health monitoring features.',
        image: '',
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Wireless Earbuds Elite',
        category: 'electronics',
        price: 3000,
        returnRate: 12,
        duration: 21,
        stock: 100,
        minUnits: 1,
        description: 'High-quality wireless earbuds with noise cancellation.',
        image: '',
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Solar Power Bank 20000mAh',
        category: 'electronics',
        price: 2500,
        returnRate: 10,
        duration: 14,
        stock: 75,
        minUnits: 2,
        description: 'Eco-friendly solar powered portable charger.',
        image: '',
        active: true,
        createdAt: new Date().toISOString()
    }
];

export default function AdminProductsPage() {
    const { showToast } = useToast();

    // Data states
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    // Stats
    const [totalCount, setTotalCount] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [totalStock, setTotalStock] = useState(0);

    // Modal state
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Form inputs state
    const [prodName, setProdName] = useState('');
    const [prodCategory, setProdCategory] = useState<'electronics' | 'fashion' | 'home' | 'health'>('electronics');
    const [prodPrice, setProdPrice] = useState('');
    const [prodReturn, setProdReturn] = useState('');
    const [prodDuration, setProdDuration] = useState('');
    const [prodStock, setProdStock] = useState('');
    const [prodMinUnits, setProdMinUnits] = useState('1');
    const [prodDescription, setProdDescription] = useState('');
    const [prodImage, setProdImage] = useState('');
    const [prodActive, setProdActive] = useState(true);

    useEffect(() => {
        loadProductsData();
    }, []);

    const loadProductsData = () => {
        let allProducts: Product[] = Storage.get('products') || [];
        if (!allProducts || !Array.isArray(allProducts) || allProducts.length === 0) {
            allProducts = defaultProductsList;
            Storage.set('products', allProducts);
        }

        setProducts(allProducts);
        setTotalCount(allProducts.length);
        setActiveCount(allProducts.filter(p => p.active !== false).length);
        setTotalStock(allProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0));
    };

    const handleOpenAddModal = () => {
        setSelectedProduct(null);
        setProdName('');
        setProdCategory('electronics');
        setProdPrice('');
        setProdReturn('');
        setProdDuration('');
        setProdStock('');
        setProdMinUnits('1');
        setProdDescription('');
        setProdImage('');
        setProdActive(true);
        setModalOpen(true);
    };

    const handleOpenEditModal = (p: Product) => {
        setSelectedProduct(p);
        setProdName(p.name);
        setProdCategory(p.category);
        setProdPrice(p.price.toString());
        setProdReturn(p.returnRate.toString());
        setProdDuration(p.duration.toString());
        setProdStock(p.stock.toString());
        setProdMinUnits(p.minUnits.toString());
        setProdDescription(p.description || '');
        setProdImage(p.image || '');
        setProdActive(p.active !== false);
        setModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!prodName.trim() || !prodPrice.trim() || !prodReturn.trim() || !prodDuration.trim() || !prodStock.trim()) {
            showToast('Please fill all required inputs', 'error');
            return;
        }

        try {
            const allProducts: Product[] = Storage.get('products') || [];

            if (selectedProduct) {
                // Update product details
                const idx = allProducts.findIndex(p => p.id === selectedProduct.id);
                if (idx !== -1) {
                    allProducts[idx] = {
                        ...allProducts[idx],
                        name: prodName.trim(),
                        category: prodCategory,
                        price: Number(prodPrice),
                        returnRate: Number(prodReturn),
                        duration: Number(prodDuration),
                        stock: Number(prodStock),
                        minUnits: Number(prodMinUnits),
                        description: prodDescription.trim(),
                        image: prodImage.trim(),
                        active: prodActive
                    };
                    showToast('Product upgraded successfully!', 'success');
                }
            } else {
                // Insert new product
                const newProduct: Product = {
                    id: db.generateId(),
                    name: prodName.trim(),
                    category: prodCategory,
                    price: Number(prodPrice),
                    returnRate: Number(prodReturn),
                    duration: Number(prodDuration),
                    stock: Number(prodStock),
                    minUnits: Number(prodMinUnits),
                    description: prodDescription.trim(),
                    image: prodImage.trim(),
                    active: prodActive,
                    createdAt: new Date().toISOString()
                };
                allProducts.push(newProduct);
                showToast('New product added to catalog successfully!', 'success');
            }

            Storage.set('products', allProducts);
            setModalOpen(false);
            loadProductsData();
        } catch (err) {
            showToast('Failed to save product details', 'error');
        }
    };

    const handleDelete = () => {
        if (!selectedProduct) return;

        try {
            const allProducts: Product[] = Storage.get('products') || [];
            const updated = allProducts.filter(p => p.id !== selectedProduct.id);
            Storage.set('products', updated);

            showToast('Product removed from catalog permanently!', 'success');
            setDeleteOpen(false);
            loadProductsData();
        } catch (err) {
            showToast('Failed to remove product item', 'error');
        }
    };

    const handleToggleActive = (product: Product) => {
        try {
            const allProducts: Product[] = Storage.get('products') || [];
            const idx = allProducts.findIndex(p => p.id === product.id);
            if (idx !== -1) {
                allProducts[idx].active = !product.active;
                Storage.set('products', allProducts);
                showToast(`Product visibility ${allProducts[idx].active ? 'enabled' : 'disabled'}`, 'success');
                loadProductsData();
            }
        } catch (err) {
            showToast('Failed to toggle product visibility status', 'error');
        }
    };

    // Filters logic
    const filteredProducts = products.filter((p) => {
        const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = filterCategory === 'all' || p.category === filterCategory;
        return matchesQuery && matchesCat;
    });

    return (
        <div>
            <div className="page-header">
                <h1>Product Management</h1>
                <p>Add new products catalog and set custom return rate details</p>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-box"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{totalCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Total Products</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-check-circle"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{activeCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Active Products</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-cubes"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{totalStock}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Total Stock Units</p>
                </div>
            </div>

            {/* List Box */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '25px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <div className="search-box" style={{ maxWidth: '300px', width: '100%', position: 'relative', flexShrink: 0 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ padding: '10px 12px 10px 45px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">All Categories</option>
                            <option value="electronics">Electronics</option>
                            <option value="fashion">Fashion</option>
                            <option value="home">Home & Living</option>
                            <option value="health">Health & Beauty</option>
                        </select>
                        <button className="btn btn-primary" onClick={handleOpenAddModal}>
                            <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Add Product
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '12px 8px' }}>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Return rate (%)</th>
                                <th>Duration</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                                        <i className="fas fa-box" style={{ fontSize: '40px', color: 'var(--text-secondary)', marginBottom: '10px' }}></i>
                                        <p style={{ color: 'var(--text-secondary)' }}>No package investments products found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((p) => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 8px', color: 'white', fontWeight: 600 }}>{p.name}</td>
                                        <td><span className="badge badge-outline" style={{ textTransform: 'uppercase', fontSize: '9px' }}>{p.category}</span></td>
                                        <td><strong>৳{p.price.toLocaleString()}</strong></td>
                                        <td><span style={{ color: '#10b981', fontWeight: 600 }}>{p.returnRate}%</span></td>
                                        <td>{p.duration} days</td>
                                        <td>{p.stock} units</td>
                                        <td>
                                            <span 
                                                onClick={() => handleToggleActive(p)}
                                                className={`badge ${p.active !== false ? 'badge-success' : 'badge-danger'}`}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to toggle visibility"
                                            >
                                                {p.active !== false ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    onClick={() => handleOpenEditModal(p)}
                                                    style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline" 
                                                    onClick={() => { setSelectedProduct(p); setDeleteOpen(true); }}
                                                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
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

            {/* Modal: Add/Edit Product */}
            {modalOpen && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{selectedProduct ? 'Edit Product Details' : 'Add New Product'}</h3>
                            <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="modal-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="prodNameInput">Product Name *</label>
                                    <input type="text" id="prodNameInput" required value={prodName} onChange={e => setProdName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label htmlFor="prodCategorySelect">Category *</label>
                                        <select id="prodCategorySelect" value={prodCategory} onChange={e => setProdCategory(e.target.value as any)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}>
                                            <option value="electronics">Electronics</option>
                                            <option value="fashion">Fashion</option>
                                            <option value="home">Home & Living</option>
                                            <option value="health">Health & Beauty</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="prodPriceInput">Price (৳) *</label>
                                        <input type="number" id="prodPriceInput" required min="100" value={prodPrice} onChange={e => setProdPrice(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label htmlFor="prodReturnInput">Return Rate (%) *</label>
                                        <input type="number" id="prodReturnInput" required min="1" max="100" value={prodReturn} onChange={e => setProdReturn(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="prodDurationInput">Duration (days) *</label>
                                        <input type="number" id="prodDurationInput" required min="1" value={prodDuration} onChange={e => setProdDuration(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label htmlFor="prodStockInput">Stock Units *</label>
                                        <input type="number" id="prodStockInput" required min="0" value={prodStock} onChange={e => setProdStock(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="prodMinUnitsInput">Min Purchase Units *</label>
                                        <input type="number" id="prodMinUnitsInput" required min="1" value={prodMinUnits} onChange={e => setProdMinUnits(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="prodDescriptionTextarea">Product Description</label>
                                    <textarea id="prodDescriptionTextarea" rows={3} value={prodDescription} onChange={e => setProdDescription(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="prodImageUrlInput">Image URL (Optional)</label>
                                    <input type="text" id="prodImageUrlInput" placeholder="https://example.com/image.jpg" value={prodImage} onChange={e => setProdImage(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" id="prodActiveCheckbox" checked={prodActive} onChange={e => setProdActive(e.target.checked)} style={{ cursor: 'pointer' }} />
                                    <label htmlFor="prodActiveCheckbox" style={{ cursor: 'pointer' }}>Active (Show in catalog)</label>
                                </div>
                            </div>
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {deleteOpen && selectedProduct && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: '#ef4444', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'white' }}><i className="fas fa-trash-alt"></i> Delete Product</h3>
                            <button className="modal-close" onClick={() => setDeleteOpen(false)} style={{ color: 'white' }}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '30px', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>Are you sure you want to delete this product?</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                You are about to permanently delete <strong>{selectedProduct.name}</strong> from catalog database.
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                                <button className="btn btn-outline" onClick={() => setDeleteOpen(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleDelete} style={{ background: '#ef4444', borderColor: '#ef4444' }}>Delete Permanently</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
