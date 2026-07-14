'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import Storage from '@/lib/storage';
import { Product, defaultProducts as defaultProductsList } from '@/lib/products';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCart } from '@/context/CartContext';
import db from '@/lib/database';

export default function ProductsPage() {
    const { lang, t, tText } = useTranslation();
    const ecommerceCart = useCart();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);
    
    // Data states
    const [products, setProducts] = useState<Product[]>([]);
    
    // Checkout states
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
    const [custName, setCustName] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [custAddress, setCustAddress] = useState('');
    const [orderQty, setOrderQty] = useState(1);
    const [orderColor, setOrderColor] = useState('');
    const [payMethod, setPayMethod] = useState<'bkash' | 'nagad'>('bkash');
    const [transactionId, setTransactionId] = useState('');
    const [submittingOrder, setSubmittingOrder] = useState(false);

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkoutProduct) return;

        if (!custName.trim() || !custPhone.trim() || !custAddress.trim() || !transactionId.trim()) {
            showToast('Please fill all fields', 'error');
            return;
        }

        if (orderQty < 1) {
            showToast('Please specify a valid quantity', 'error');
            return;
        }

        if (orderQty > checkoutProduct.stock) {
            showToast(`Only ${checkoutProduct.stock} units are in stock`, 'error');
            return;
        }

        setSubmittingOrder(true);
        try {
            const allOrders = Storage.get('orders') || [];
            const newOrder = {
                id: db.generateId(),
                productName: checkoutProduct.name,
                productId: checkoutProduct.id,
                price: checkoutProduct.price,
                quantity: orderQty,
                color: orderColor,
                totalAmount: checkoutProduct.price * orderQty,
                customerName: custName.trim(),
                customerPhone: custPhone.trim(),
                deliveryAddress: custAddress.trim(),
                paymentMethod: payMethod,
                transactionId: transactionId.trim(),
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            allOrders.push(newOrder);
            Storage.set('orders', allOrders);

            // Decrement product stock
            const allProducts: Product[] = Storage.get('products') || [];
            const pIdx = allProducts.findIndex(p => p.id === checkoutProduct.id);
            if (pIdx !== -1) {
                allProducts[pIdx].stock = Math.max(0, allProducts[pIdx].stock - orderQty);
                Storage.set('products', allProducts);
                setProducts(allProducts);
            }

            showToast('Order placed successfully! Admin will verify payment and ship your item.', 'success');
            setCheckoutOpen(false);
        } catch (err) {
            showToast('Failed to place order', 'error');
        } finally {
            setSubmittingOrder(false);
        }
    };
    
    // Filtering States
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('default');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    useEffect(() => {
        setMounted(true);
        // Force reset products list to load updated discounts
        const hasReset = Storage.get('products_reset_v5');
        let list = Storage.get('products');
        if (!hasReset || !list || !Array.isArray(list) || list.length === 0) {
            list = defaultProductsList;
            Storage.set('products', list);
            Storage.set('products_reset_v5', true);
        }
        setProducts(list);

        // Parse search parameters safely on client side
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const filterParam = params.get('filter');
            if (filterParam === 'offers') {
                setCategoryFilter('offers');
            } else if (filterParam) {
                setCategoryFilter(filterParam);
            }
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        let result = products.filter(p => p.active !== false);

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(query));
        }

        // Category filter
        if (categoryFilter !== 'all') {
            if (categoryFilter === 'offers') {
                result = result.filter(p => {
                    const isOfferProduct = p.hasOffer !== undefined ? p.hasOffer : !!(p.previousPrice && p.previousPrice > p.price);
                    return isOfferProduct;
                });
            } else {
                result = result.filter(p => p.category === categoryFilter);
            }
        }

        // Sorting
        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'profit-high':
                result.sort((a, b) => b.returnRate - a.returnRate);
                break;
            case 'newest':
                result.sort((a, b) => b.id.localeCompare(a.id));
                break;
            default:
                break;
        }

        setFilteredProducts(result);
    }, [searchQuery, categoryFilter, sortBy, products, mounted]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Embedded styles for Products page */}
            <style jsx global>{`
                .products-page {
                    padding: 120px 0 60px;
                    min-height: 100vh;
                    background: var(--bg-secondary);
                }
                .products-header {
                    margin-bottom: 40px;
                }
                .products-header h1 {
                    font-size: 32px;
                    margin-bottom: 10px;
                }
                .products-controls {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                }
                .search-box {
                    flex: 1;
                    min-width: 250px;
                    position: relative;
                }
                .search-box input {
                    width: 100%;
                    padding: 12px 16px 12px 45px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-size: 14px;
                }
                .search-box i {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                }
                .filter-dropdown {
                    position: relative;
                }
                .filter-dropdown select {
                    padding: 12px 40px 12px 16px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-size: 14px;
                    cursor: pointer;
                    appearance: none;
                }
                .filter-dropdown i {
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none;
                    color: var(--text-secondary);
                }
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 24px;
                }
                .product-card {
                    background: var(--bg-primary);
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    transition: all 0.3s ease;
                }
                .product-card:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-lg);
                }
                .product-card.out-of-stock {
                    opacity: 0.7;
                }
                .product-image-container {
                    height: 180px;
                    background: var(--primary-light);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .product-image-container i {
                    font-size: 60px;
                    color: var(--primary-color);
                }
                .product-badges {
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    right: 15px;
                    display: flex;
                    justify-content: space-between;
                }
                .prod-badge {
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .badge-offer {
                    background: var(--danger-color);
                    color: white;
                }
                .badge-category {
                    background: var(--bg-primary);
                    color: var(--text-secondary);
                }
                .product-content {
                    padding: 20px;
                }
                .product-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 15px;
                }
                .product-info {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin-bottom: 15px;
                }
                .info-item {
                    display: flex;
                    flex-direction: column;
                }
                .info-label {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin-bottom: 4px;
                }
                .info-value {
                    font-size: 16px;
                    font-weight: 600;
                }
                .info-value.profit {
                    color: var(--success-color);
                }
                .info-value.price {
                    color: var(--primary-color);
                }
                .product-footer {
                    display: flex;
                    gap: 10px;
                }
                .stock-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 0;
                    border-top: 1px solid var(--border-color);
                    margin-top: 15px;
                }
                .stock-info i {
                    color: var(--success-color);
                }
                .stock-info.low i {
                    color: var(--warning-color);
                }
                .stock-info.out i {
                    color: var(--danger-color);
                }
                .no-products {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                }
                .no-products i {
                    font-size: 60px;
                    color: var(--text-muted);
                    margin-bottom: 20px;
                }
                @media (max-width: 768px) {
                    .products-controls {
                        flex-direction: column;
                    }
                    .search-box {
                        width: 100%;
                    }
                }
            `}</style>

            {/* Navigation */}
            <Navbar />

            {/* Products Page */}
            <section className="products-page">
                <div className="container">
                    <div className="products-header">
                        <h1>{tText("All Products", "সব পণ্য")}</h1>
                        <p>{tText("Choose from our wide range of investment products", "আমাদের বিস্তৃত বিনিয়োগ পণ্য থেকে বেছে নিন")}</p>
                    </div>

                    <div className="products-controls">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text" 
                                placeholder={tText("Search products...", "পণ্য খুঁজুন...")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="filter-dropdown">
                            <select 
                                value={categoryFilter} 
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">{tText("All Categories", "সব বিভাগ")}</option>
                                <option value="electronics">Electronics</option>
                                <option value="fashion">Fashion</option>
                                <option value="home">Home & Living</option>
                                <option value="health">Health & Beauty</option>
                                <option value="mobile">Mobile</option>
                                <option value="computer">Computer</option>
                                <option value="accessories">Accessories</option>
                                <option value="offers">{tText("Offers", "অফার")}</option>
                                <option value="other">Other</option>
                            </select>
                            <i className="fas fa-chevron-down"></i>
                        </div>
                        <div className="filter-dropdown">
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="default">{tText("Sort By", "সাজান")}</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="profit-high">Profit: High to Low</option>
                                <option value="newest">Newest First</option>
                            </select>
                            <i className="fas fa-chevron-down"></i>
                        </div>
                    </div>

                    <div className="products-grid">
                        {filteredProducts.length === 0 ? (
                            <div className="no-products">
                                <i className="fas fa-box-open"></i>
                                <h3>{tText("No products found", "কোন পণ্য পাওয়া যায়নি")}</h3>
                                <p>{tText("Try adjusting your search or filter", "আপনার সার্চ বা ফিল্টার পরিবর্তন করুন")}</p>
                            </div>
                        ) : (
                            filteredProducts.map((product) => {
                                const stockClass = product.stock === 0 ? 'out' : product.stock < 10 ? 'low' : '';
                                const stockText = product.stock === 0 
                                    ? tText('Out of Stock', 'স্টক শেষ') 
                                    : tText(`${product.stock} in stock`, `${product.stock}টি স্টকে আছে`);
                                const stockIcon = product.stock === 0 ? 'fa-times-circle' : product.stock < 10 ? 'fa-exclamation-circle' : 'fa-check-circle';
                                
                                const hasDiscount = !!(product.previousPrice && product.previousPrice > product.price);
                                const discountPercentage = hasDiscount 
                                    ? Math.round(((product.previousPrice! - product.price) / product.previousPrice!) * 100)
                                    : 0;
                                const discountSavings = hasDiscount 
                                    ? product.previousPrice! - product.price 
                                    : 0;
                                
                                const selfSellProfit = Math.round(product.returnRate * 1.25);
                                const hasOffer = product.hasOffer !== undefined ? product.hasOffer : hasDiscount;
                                const offerText = product.offerText || (hasDiscount ? `${discountPercentage}% OFF` : '');
                                const offerColor = product.offerColor || '#ef4444';

                                return (
                                    <div key={product.id} className={`product-card ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                                        <div className="product-image-container">
                                            <i className={`fas ${product.image || 'fa-box'}`}></i>
                                            <div className="product-badges">
                                                {hasOffer ? (
                                                    <span className="prod-badge badge-offer" style={{ 
                                                        background: offerColor, 
                                                        color: 'white',
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        letterSpacing: '0.5px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {offerText}
                                                    </span>
                                                ) : (
                                                    <span></span>
                                                )}
                                                <span className="prod-badge badge-category">{product.category}</span>
                                            </div>
                                        </div>
                                        <div className="product-content">
                                            <h3 className="product-title">{product.name}</h3>
                                            
                                            {/* Description */}
                                            <p className="product-card-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 15px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px', lineBreak: 'anywhere' }}>
                                                {product.description}
                                            </p>

                                            {/* Colors Display */}
                                            {product.colors && product.colors.length > 0 && (
                                                <div className="color-options-container" style={{ display: 'flex', gap: '6px', margin: '0 0 15px 0' }}>
                                                    {product.colors.map((color, idx) => (
                                                        <span 
                                                            key={idx} 
                                                            className="color-dot" 
                                                            style={{ 
                                                                display: 'inline-block',
                                                                width: '16px', 
                                                                height: '16px', 
                                                                borderRadius: '50%', 
                                                                border: '1px solid var(--border-color)',
                                                                background: color.toLowerCase() === 'black' || color.toLowerCase() === 'midnight black' ? '#0f172a' :
                                                                            color.toLowerCase() === 'white' ? '#ffffff' :
                                                                            color.toLowerCase() === 'blue' || color.toLowerCase() === 'ocean blue' ? '#2563eb' :
                                                                            color.toLowerCase() === 'red' || color.toLowerCase() === 'crimson red' ? '#dc2626' :
                                                                            color.toLowerCase() === 'green' ? '#16a34a' :
                                                                            color.toLowerCase() === 'gold' || color.toLowerCase() === 'rose gold' ? '#d97706' :
                                                                            color.toLowerCase() === 'silver' || color.toLowerCase() === 'silver metallic' ? '#cbd5e1' :
                                                                            color.toLowerCase() === 'purple' || color.toLowerCase() === 'deep purple' ? '#7c3aed' :
                                                                            color.toLowerCase() === 'space gray' ? '#4b5563' :
                                                                            color.toLowerCase() === 'titanium gray' ? '#6b7280' : '#888888'
                                                            }}
                                                            title={color}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            <div className="product-info">
                                                 <div className="info-item" style={{ gridColumn: 'span 2' }}>
                                                     <span className="info-label">{tText("Price", "মূল্য")}</span>
                                                     <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                                                         <span className="info-value price" style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                                                             ৳{product.price.toLocaleString()}
                                                         </span>
                                                         {hasDiscount && (
                                                             <>
                                                                 <span style={{ fontSize: '14px', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                                                                     ৳{product.previousPrice!.toLocaleString()}
                                                                 </span>
                                                                 <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                                                                     Save ৳{discountSavings.toLocaleString()}
                                                                 </span>
                                                             </>
                                                         )}
                                                     </div>
                                                 </div>
                                                 {user && (user.role === 'partner' || user.role === 'admin') && (
                                                     <>
                                                         <div className="info-item">
                                                             <span className="info-label">{tText("Auto-Sell Profit", "অটো-সেল লাভ")}</span>
                                                             <span className="info-value profit">+{product.returnRate}%</span>
                                                         </div>
                                                         <div className="info-item">
                                                             <span className="info-label">{tText("Self-Sell Profit", "সেলফ-সেল লাভ")}</span>
                                                             <span className="info-value profit">+{selfSellProfit}%</span>
                                                         </div>
                                                         <div className="info-item" style={{ gridColumn: 'span 2' }}>
                                                             <span className="info-label">{tText("Duration", "সময়কাল")}</span>
                                                             <span className="info-value">{product.duration} {tText("days", "দিন")}</span>
                                                         </div>
                                                     </>
                                                 )}
                                            </div>
                                            <div className={`stock-info ${stockClass}`}>
                                                <i className={`fas ${stockIcon}`}></i>
                                                <span>{stockText}</span>
                                            </div>
                                            <div className="product-footer">
                                                 {product.stock === 0 ? (
                                                     <button className="btn btn-primary btn-block" disabled>
                                                         {tText("Out of Stock", "স্টক শেষ")}
                                                     </button>
                                                 ) : user && (user.role === 'partner' || user.role === 'admin') ? (
                                                     <Link href="/dashboard/products" className="btn btn-primary btn-block">
                                                         {tText("Invest Now", "এখনই বিনিয়োগ করুন")}
                                                     </Link>
                                                 ) : (
                                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                         <div style={{ display: 'flex', gap: '8px' }}>
                                                             <button 
                                                                 className="btn btn-primary"
                                                                 style={{ flex: 1 }}
                                                                 onClick={() => {
                                                                     setCheckoutProduct(product);
                                                                     setOrderQty(1);
                                                                     setOrderColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
                                                                     setCheckoutOpen(true);
                                                                 }}
                                                             >
                                                                 <i className="fas fa-shopping-bag" style={{ marginRight: '6px' }}></i>
                                                                 {tText("Buy Now", "কিনুন")}
                                                             </button>
                                                             <button 
                                                                 className="btn btn-outline"
                                                                 style={{ 
                                                                     flex: 1, 
                                                                     borderColor: 'var(--primary-color)', 
                                                                     color: 'var(--primary-color)',
                                                                     background: 'none'
                                                                 }}
                                                                 onClick={() => {
                                                                     const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0] : undefined;
                                                                     ecommerceCart.addToCart(product, 1, defaultColor);
                                                                     showToast(lang === 'bn' ? `${product.name} কার্টে যোগ করা হয়েছে` : `${product.name} added to cart`, 'success');
                                                                 }}
                                                             >
                                                                 <i className="fas fa-cart-plus" style={{ marginRight: '6px' }}></i>
                                                                 {tText("Add to Cart", "কার্ট")}
                                                             </button>
                                                         </div>
                                                         <div style={{ textAlign: 'center', marginTop: '4px' }}>
                                                             <Link href="/signup" style={{ fontSize: '11px', color: 'var(--primary-color)', textDecoration: 'none' }}>
                                                                 {tText("Earn money from this product? Become a Partner", "এই পণ্য থেকে টাকা আয় করতে চান? পার্টনার হোন")}
                                                             </Link>
                                                         </div>
                                                     </div>
                                                 )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>

            {/* Guest Checkout Modal */}
            {checkoutOpen && checkoutProduct && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
                    <div className="modal" style={{ maxWidth: '500px', width: '100%', background: 'var(--bg-primary, #0f1c30)', border: '1px solid var(--border-color, #1e2d4a)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'white' }}>{tText("Checkout - Order Product", "চেকআউট - পণ্য অর্ডার করুন")}</h3>
                            <button className="modal-close" onClick={() => setCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="modal-body" style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                
                                {/* Product Summary */}
                                <div style={{ display: 'flex', gap: '15px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--primary-color)' }}>
                                        <i className={`fas ${checkoutProduct.image || 'fa-box'}`}></i>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '15px', color: 'white' }}>{checkoutProduct.name}</h4>
                                        <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>৳{checkoutProduct.price.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Color Selection */}
                                {checkoutProduct.colors && checkoutProduct.colors.length > 0 && (
                                    <div className="form-group">
                                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{tText("Select Color", "রং নির্বাচন করুন")}</label>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {checkoutProduct.colors.map((color, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setOrderColor(color)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        border: '1px solid',
                                                        borderColor: orderColor === color ? 'var(--primary-color)' : 'var(--border-color)',
                                                        background: orderColor === color ? 'var(--primary-light)' : 'none',
                                                        color: orderColor === color ? 'white' : 'var(--text-secondary)',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        fontWeight: orderColor === color ? 600 : 400
                                                    }}
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Selector */}
                                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{tText("Quantity", "পরিমাণ")}</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                                            style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'none', color: 'white', cursor: 'pointer' }}
                                        >
                                            -
                                        </button>
                                        <span style={{ fontSize: '16px', fontWeight: 600, color: 'white', minWidth: '20px', textAlign: 'center' }}>{orderQty}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setOrderQty(Math.min(checkoutProduct.stock, orderQty + 1))}
                                            style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'none', color: 'white', cursor: 'pointer' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Form Inputs */}
                                <div className="form-group">
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{tText("Full Name", "পূর্ণ নাম")}</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={custName}
                                        onChange={e => setCustName(e.target.value)}
                                        placeholder={tText("Enter your full name", "আপনার পূর্ণ নাম লিখুন")}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{tText("Phone Number", "মোবাইল নম্বর")}</label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={custPhone}
                                        onChange={e => setCustPhone(e.target.value)}
                                        placeholder={tText("Enter your mobile number", "আপনার মোবাইল নম্বর লিখুন")}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{tText("Delivery Address", "ডেলিভারি ঠিকানা")}</label>
                                    <textarea 
                                        required
                                        rows={2}
                                        value={custAddress}
                                        onChange={e => setCustAddress(e.target.value)}
                                        placeholder={tText("Enter complete address (District, Area, Road/Village)", "সম্পূর্ণ ঠিকানা লিখুন (জেলা, এলাকা, রোড/গ্রাম)")}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', resize: 'none' }}
                                    />
                                </div>

                                {/* Payment Info */}
                                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '15px', marginTop: '10px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{tText("Payment Instruction", "পেমেন্ট নির্দেশনা")}</label>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                        {tText(
                                            `Please send the total price of ৳${(checkoutProduct.price * orderQty).toLocaleString()} to the bKash/Nagad number below, then fill in your Transaction ID:`,
                                            `নীচের বিকাশ/নগদ নম্বরে মোট ৳${(checkoutProduct.price * orderQty).toLocaleString()} মূল্যটি সেন্ডমানি বা পেমেন্ট করুন, তারপর আপনার ট্রানজেকশন আইডিটি লিখুন:`
                                        )}
                                    </p>
                                    <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>bKash / Nagad Number:</div>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', margin: '4px 0' }}>01783840582</div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Type: Personal (Send Money)</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setPayMethod('bkash')}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                borderColor: payMethod === 'bkash' ? '#e2125a' : 'var(--border-color)',
                                                background: payMethod === 'bkash' ? 'rgba(226, 18, 90, 0.1)' : 'none',
                                                color: payMethod === 'bkash' ? '#e2125a' : 'white',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: '13px'
                                            }}
                                        >
                                            bKash
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPayMethod('nagad')}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                borderColor: payMethod === 'nagad' ? '#f6901e' : 'var(--border-color)',
                                                background: payMethod === 'nagad' ? 'rgba(246, 144, 30, 0.1)' : 'none',
                                                color: payMethod === 'nagad' ? '#f6901e' : 'white',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: '13px'
                                            }}
                                        >
                                            Nagad
                                        </button>
                                    </div>

                                    <div className="form-group">
                                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{tText("Transaction ID (TxID)", "ট্রানজেকশন আইডি")}</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={transactionId}
                                            onChange={e => setTransactionId(e.target.value)}
                                            placeholder="Example: 9K88FGH765"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setCheckoutOpen(false)} style={{ flex: 1 }}>
                                    {tText("Cancel", "বাতিল করুন")}
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submittingOrder} style={{ flex: 1 }}>
                                    {submittingOrder ? tText("Placing...", "অর্ডার হচ্ছে...") : tText("Place Order", "অর্ডার সাবমিট করুন")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-bottom" style={{ borderTop: 'none', paddingTop: 0 }}>
                        <p>&copy; 2026 SmartEarnBD. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
