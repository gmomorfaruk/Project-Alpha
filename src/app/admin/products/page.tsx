'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

import { Product, defaultProducts as defaultProductsList } from '@/lib/products';

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
    const [prodCategory, setProdCategory] = useState<string>('electronics');
    const [prodPrice, setProdPrice] = useState('');
    const [prodPreviousPrice, setProdPreviousPrice] = useState('');
    const [prodReturn, setProdReturn] = useState('');
    const [prodDuration, setProdDuration] = useState('');
    const [prodStock, setProdStock] = useState('');
    const [prodMinUnits, setProdMinUnits] = useState('1');
    const [prodDescription, setProdDescription] = useState('');
    const [prodColors, setProdColors] = useState('');
    const [prodImage, setProdImage] = useState('');
    const [prodActive, setProdActive] = useState(true);
    const [prodHasOffer, setProdHasOffer] = useState(false);
    const [prodOfferText, setProdOfferText] = useState('');
    const [prodOfferColor, setProdOfferColor] = useState('#ef4444');
    const [imageType, setImageType] = useState<'upload' | 'url' | 'icon'>('icon');

    useEffect(() => {
        loadProductsData();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                showToast('Image size should be less than 1MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProdImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const loadProductsData = () => {
        // Force reset products list to load updated discounts
        const hasReset = Storage.get('products_reset_v8');
        let allProducts: Product[] = Storage.get('products') || [];
        if (!hasReset || !allProducts || !Array.isArray(allProducts) || allProducts.length === 0) {
            allProducts = defaultProductsList;
            Storage.setLocalOnly('products', allProducts);
            Storage.set('products_reset_v8', true);
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
        setProdPreviousPrice('');
        setProdReturn('');
        setProdDuration('');
        setProdStock('');
        setProdMinUnits('1');
        setProdDescription('');
        setProdColors('');
        setProdImage('fa-box');
        setImageType('icon');
        setProdActive(true);
        setProdHasOffer(false);
        setProdOfferText('');
        setProdOfferColor('#ef4444');
        setModalOpen(true);
    };

    const handleOpenEditModal = (p: Product) => {
        setSelectedProduct(p);
        setProdName(p.name);
        setProdCategory(p.category);
        setProdPrice(p.price.toString());
        setProdPreviousPrice(p.previousPrice ? p.previousPrice.toString() : '');
        setProdReturn(p.returnRate.toString());
        setProdDuration(p.duration.toString());
        setProdStock(p.stock.toString());
        setProdMinUnits(p.minUnits ? p.minUnits.toString() : '1');
        setProdDescription(p.description || '');
        setProdColors(p.colors ? p.colors.join(', ') : '');
        setProdImage(p.image || '');

        // Resolve existing image type
        if (p.image?.startsWith('data:image/')) {
            setImageType('upload');
        } else if (p.image?.startsWith('http://') || p.image?.startsWith('https://') || p.image?.startsWith('/')) {
            setImageType('url');
        } else {
            setImageType('icon');
        }

        setProdActive(p.active !== false);
        setProdHasOffer(p.hasOffer !== undefined ? p.hasOffer : !!(p.previousPrice && p.previousPrice > p.price));
        setProdOfferText(p.offerText || '');
        setProdOfferColor(p.offerColor || '#ef4444');
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
            const parsedColors = prodColors ? prodColors.split(',').map(c => c.trim()).filter(Boolean) : [];

            if (selectedProduct) {
                // Update product details
                const idx = allProducts.findIndex(p => p.id === selectedProduct.id);
                if (idx !== -1) {
                    allProducts[idx] = {
                        ...allProducts[idx],
                        name: prodName.trim(),
                        category: prodCategory as any,
                        price: Number(prodPrice),
                        previousPrice: prodPreviousPrice ? Number(prodPreviousPrice) : undefined,
                        returnRate: Number(prodReturn),
                        duration: Number(prodDuration),
                        stock: Number(prodStock),
                        minUnits: Number(prodMinUnits),
                        description: prodDescription.trim(),
                        colors: parsedColors,
                        image: prodImage.trim(),
                        active: prodActive,
                        hasOffer: prodHasOffer,
                        offerText: prodOfferText.trim(),
                        offerColor: prodOfferColor.trim()
                    };
                    showToast('Product upgraded successfully!', 'success');
                }
            } else {
                // Insert new product
                const newProduct: Product = {
                    id: db.generateId(),
                    name: prodName.trim(),
                    category: prodCategory as any,
                    price: Number(prodPrice),
                    previousPrice: prodPreviousPrice ? Number(prodPreviousPrice) : undefined,
                    returnRate: Number(prodReturn),
                    duration: Number(prodDuration),
                    stock: Number(prodStock),
                    minUnits: Number(prodMinUnits),
                    description: prodDescription.trim(),
                    colors: parsedColors,
                    image: prodImage.trim(),
                    active: prodActive,
                    hasOffer: prodHasOffer,
                    offerText: prodOfferText.trim(),
                    offerColor: prodOfferColor.trim(),
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
        const isOfferProduct = p.hasOffer !== undefined ? p.hasOffer : !!(p.previousPrice && p.previousPrice > p.price);
        const matchesCat = filterCategory === 'all' || 
            (filterCategory === 'offers' ? isOfferProduct : p.category === filterCategory);
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
                            <option value="mobile">Mobile</option>
                            <option value="computer">Computer</option>
                            <option value="accessories">Accessories</option>
                            <option value="offers">Offers</option>
                            <option value="other">Other</option>
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
                                        <td style={{ padding: '12px 8px', color: 'white', fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--primary-color)', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                                                    {p.image && (p.image.startsWith('http') || p.image.startsWith('data:image/') || p.image.startsWith('/')) ? (
                                                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <i className={`fas ${p.image || 'fa-box'}`}></i>
                                                    )}
                                                </div>
                                                <span>{p.name}</span>
                                            </div>
                                        </td>
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label htmlFor="prodCategorySelect">Category *</label>
                                        <select id="prodCategorySelect" value={prodCategory} onChange={e => setProdCategory(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}>
                                            <option value="electronics">Electronics</option>
                                            <option value="fashion">Fashion</option>
                                            <option value="home">Home & Living</option>
                                            <option value="health">Health & Beauty</option>
                                            <option value="mobile">Mobile</option>
                                            <option value="computer">Computer</option>
                                            <option value="accessories">Accessories</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="prodPriceInput">Offered Price (৳) *</label>
                                        <input type="number" id="prodPriceInput" required min="10" value={prodPrice} onChange={e => setProdPrice(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="prodPreviousPriceInput">Previous Price (৳)</label>
                                        <input type="number" id="prodPreviousPriceInput" min="10" value={prodPreviousPrice} onChange={e => setProdPreviousPrice(e.target.value)} placeholder="e.g. 60000" style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
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
                                    <label htmlFor="prodColorsInput">Color Options (Comma separated)</label>
                                    <input type="text" id="prodColorsInput" placeholder="e.g. Midnight Black, Deep Purple, Silver" value={prodColors} onChange={e => setProdColors(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div style={{ border: '1px dashed var(--border-color)', padding: '15px', borderRadius: '12px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--primary-color)' }}>Offer Details</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                        <input type="checkbox" id="prodHasOfferCheckbox" checked={prodHasOffer} onChange={e => setProdHasOffer(e.target.checked)} style={{ cursor: 'pointer' }} />
                                        <label htmlFor="prodHasOfferCheckbox" style={{ cursor: 'pointer', fontWeight: 600 }}>Active Offer Badge</label>
                                    </div>
                                    {prodHasOffer && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="form-group">
                                                <label htmlFor="prodOfferTextInput">Offer Badge Text *</label>
                                                <input type="text" id="prodOfferTextInput" placeholder="e.g. 20% OFF or Hot Deal" required={prodHasOffer} value={prodOfferText} onChange={e => setProdOfferText(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="prodOfferColorInput">Badge Color</label>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <input type="color" id="prodOfferColorInput" value={prodOfferColor} onChange={e => setProdOfferColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '2px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer' }} />
                                                    <input type="text" value={prodOfferColor} onChange={e => setProdOfferColor(e.target.value)} placeholder="#ef4444" style={{ flex: 1, padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="prodDescriptionTextarea">Product Description</label>
                                    <textarea id="prodDescriptionTextarea" rows={3} value={prodDescription} onChange={e => setProdDescription(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div style={{ border: '1px dashed var(--border-color)', padding: '15px', borderRadius: '12px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '10px', fontSize: '13px', color: 'white' }}>Product Image / Icon *</label>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        <button type="button" className={`btn btn-sm ${imageType === 'upload' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setImageType('upload'); setProdImage(''); }} style={{ flex: 1, padding: '6px', fontSize: '12px' }}>
                                            <i className="fas fa-upload" style={{ marginRight: '6px' }}></i> Upload
                                        </button>
                                        <button type="button" className={`btn btn-sm ${imageType === 'url' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setImageType('url'); setProdImage(''); }} style={{ flex: 1, padding: '6px', fontSize: '12px' }}>
                                            <i className="fas fa-link" style={{ marginRight: '6px' }}></i> URL
                                        </button>
                                        <button type="button" className={`btn btn-sm ${imageType === 'icon' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setImageType('icon'); setProdImage('fa-box'); }} style={{ flex: 1, padding: '6px', fontSize: '12px' }}>
                                            <i className="fas fa-icons" style={{ marginRight: '6px' }}></i> Icon
                                        </button>
                                    </div>

                                    {imageType === 'upload' && (
                                        <div className="form-group">
                                            <label htmlFor="prodImageUploadInput" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Upload Image File (max 1MB)</label>
                                            <input type="file" id="prodImageUploadInput" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white', fontSize: '12px' }} />
                                            {prodImage && prodImage.startsWith('data:image/') && (
                                                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                                    <img src={prodImage} alt="Preview" style={{ maxHeight: '80px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain', border: '1px solid var(--border-color)' }} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {imageType === 'url' && (
                                        <div className="form-group">
                                            <label htmlFor="prodImageUrlInput" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Online Image URL</label>
                                            <input type="text" id="prodImageUrlInput" placeholder="https://example.com/image.png" value={prodImage} onChange={e => setProdImage(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white', fontSize: '13px' }} />
                                            {prodImage && (prodImage.startsWith('http') || prodImage.startsWith('/')) && (
                                                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                                    <img src={prodImage} alt="Preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ maxHeight: '80px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain', border: '1px solid var(--border-color)' }} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {imageType === 'icon' && (
                                        <div className="form-group">
                                            <label htmlFor="prodImageIconInput" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>FontAwesome Icon Class</label>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <input type="text" id="prodImageIconInput" placeholder="e.g. fa-mobile-alt, fa-laptop, fa-box" value={prodImage} onChange={e => setProdImage(e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white', fontSize: '13px' }} />
                                                <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'var(--primary-color)' }}>
                                                    <i className={`fas ${prodImage || 'fa-box'}`}></i>
                                                </div>
                                            </div>
                                        </div>
                                    )}
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
