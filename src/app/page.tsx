'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import Storage from '@/lib/storage';
import { Product, defaultProducts as defaultProductsList } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export default function Home() {
    const { lang, t, tText, tNum } = useTranslation();
    const router = useRouter();
    const { user } = useAuth();
    const ecommerceCart = useCart();
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        setMounted(true);

        // If auth is still loading, don't do anything yet
        // If we have a user, redirect them to their respective dashboard
        if (user) {
            if (user.role === 'admin') {
                router.push('/dashboard'); 
            } else if (user.role === 'buyer') {
                router.push('/buyer/dashboard');
            } else {
                router.push('/dashboard');
            }
            return;
        }

        // Only load landing page products if there's no user
        const hasReset = Storage.get('products_reset_v8');
        let list = Storage.get('products');

        if (!hasReset || !list || !Array.isArray(list) || list.length === 0) {
            list = defaultProductsList;
            Storage.setLocalOnly('products', list);
            Storage.set('products_reset_v8', true);
        }
        setProducts(list.slice(0, 3));
    }, [user, router]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navigation */}
            <Navbar />

            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>{tText("Invest Smart, Grow Fast", "স্মার্ট বিনিয়োগ, দ্রুত বৃদ্ধি")}</h1>
                        <p>
                            {tText(
                                "Join thousands of investors earning daily profits through our secure investment platform. Start with as little as ৳500 and watch your money grow.",
                                "আমাদের নিরাপদ বিনিয়োগ প্ল্যাটফর্মের মাধ্যমে দৈনিক মুনাফা অর্জনকারী হাজার হাজার বিনিয়োগকারীদের সাথে যোগ দিন। মাত্র ৳৫০০ দিয়ে শুরু করুন এবং আপনার অর্থ বৃদ্ধি দেখুন।"
                            )}
                        </p>
                        <div className="hero-buttons">
                            <Link href="/signup" className="btn btn-primary btn-lg">
                                {tText("Get Started", "শুরু করুন")}
                            </Link>
                            <a href="#how-it-works" className="btn btn-outline btn-lg">
                                {tText("Learn More", "আরও জানুন")}
                            </a>
                        </div>
                        <div className="hero-stats">
                            <div className="stat">
                                <span className="stat-number">{tNum("10,000+")}</span>
                                <span className="stat-label">
                                    {tText("Active Investors", "সক্রিয় বিনিয়োগকারী")}
                                </span>
                            </div>
                            <div className="stat">
                                <span className="stat-number">{tNum("৳50M+")}</span>
                                <span className="stat-label">
                                    {tText("Total Invested", "মোট বিনিয়োগ")}
                                </span>
                            </div>
                            <div className="stat">
                                <span className="stat-number">{tNum("15%")}</span>
                                <span className="stat-label">
                                    {tText("Avg. Monthly Return", "গড় মাসিক রিটার্ন")}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-image">
                        <div className="floating-card card-1">
                            <i className="fas fa-chart-line"></i>
                            <span>{tNum("+15.5%")}</span>
                        </div>
                        <div className="floating-card card-2">
                            <i className="fas fa-wallet"></i>
                            <span>{tNum("৳25,000")}</span>
                        </div>
                        <div className="hero-illustration">
                            <i className="fas fa-coins"></i>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Showcase */}
            <section className="product-showcase" id="products">
                <div className="container">
                    <div className="section-header">
                        <h2>{tText("Featured Products", "বৈশিষ্ট্যযুক্ত পণ্য")}</h2>
                        <p>{tText("Choose from our carefully selected investment products", "আমাদের যত্ন সহকারে নির্বাচিত বিনিয়োগ পণ্য থেকে বেছে নিন")}</p>
                    </div>
                    <div className="products-grid">
                        {products.map((product, idx) => {
                            const hasDiscount = !!(product.previousPrice && product.previousPrice > product.price);
                            const discountPercentage = hasDiscount 
                                ? Math.round(((product.previousPrice! - product.price) / product.previousPrice!) * 100)
                                : 0;
                            
                            // Determine badge based on index or discounts
                            const badgeText = idx === 0 
                                ? tText("Hot", "হট") 
                                : hasDiscount 
                                    ? tText(`${discountPercentage}% OFF`, `${discountPercentage}% ছাড়`) 
                                    : tText("Featured", "ফিচার্ড");
                            
                            const isFeaturedCard = idx === 1;

                            return (
                                <div key={product.id} className={`product-card ${isFeaturedCard ? 'featured' : ''}`}>
                                    <div className="product-badge">
                                        {badgeText}
                                    </div>
                                    <div className="product-image" style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Link href={`/products?productId=${product.id}`} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {product.image && (product.image.startsWith('http') || product.image.startsWith('data:image/') || product.image.startsWith('/')) ? (
                                                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <i className={`fas ${product.image || 'fa-box'}`}></i>
                                            )}
                                        </Link>
                                    </div>
                                    <h3 style={{ cursor: 'pointer' }}>
                                        <Link href={`/products?productId=${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            {product.name}
                                        </Link>
                                    </h3>
                                    <div className="product-details">
                                        <div className="detail">
                                            <span className="label">{tText("Price", "মূল্য")}</span>
                                            <span className="value" style={{ color: '#10b981', fontWeight: 700 }}>
                                                ৳{product.price.toLocaleString()}
                                            </span>
                                        </div>
                                        {user && (user.role === 'partner' || user.role === 'admin') ? (
                                            <>
                                                <div className="detail">
                                                    <span className="label">{tText("Auto-Sell Profit", "অটো-সেল লাভ")}</span>
                                                    <span className="value profit">+{product.returnRate}%</span>
                                                </div>
                                                <div className="detail">
                                                    <span className="label">{tText("Duration", "সময়কাল")}</span>
                                                    <span className="value">{product.duration} {tText("days", "দিন")}</span>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {user && (user.role === 'partner' || user.role === 'admin') ? (
                                            <Link href={`/products?productId=${product.id}`} className="btn btn-primary btn-block" style={{ textDecoration: 'none', textAlign: 'center' }}>
                                                {tText("Invest Now", "এখনই বিনিয়োগ করুন")}
                                            </Link>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <Link href={`/products?productId=${product.id}`} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}>
                                                        <i className="fas fa-shopping-bag"></i>
                                                        {tText("Buy Now", "কিনুন")}
                                                    </Link>
                                                    <button 
                                                        className="btn btn-outline"
                                                        style={{ 
                                                            flex: 1, 
                                                            borderColor: 'var(--primary-color)', 
                                                            color: 'var(--primary-color)',
                                                            background: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '4px'
                                                        }}
                                                        onClick={() => {
                                                            const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0] : undefined;
                                                            ecommerceCart.addToCart(product, 1, defaultColor);
                                                            showToast(lang === 'bn' ? `${product.name} কার্টে যোগ করা হয়েছে` : `${product.name} added to cart`, 'success');
                                                        }}
                                                    >
                                                        <i className="fas fa-cart-plus"></i>
                                                        {tText("Add to Cart", "কার্ট")}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                        <Link href={`/products?productId=${product.id}`} style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                                            <i className="fas fa-eye"></i>
                                            {tText("View Details", "বিস্তারিত দেখুন")}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="view-all">
                        <Link href="/products" className="btn btn-outline">
                            {tText("View All Products", "সব পণ্য দেখুন")}
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works" id="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <h2>{tText("How It Works", "এটি কিভাবে কাজ করে")}</h2>
                        <p>{tText("Start earning in just 4 simple steps", "মাত্র ৪টি সহজ ধাপে উপার্জন শুরু করুন")}</p>
                    </div>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-icon">
                                <i className="fas fa-user-plus"></i>
                            </div>
                            <h3>{tText("Create Account", "অ্যাকাউন্ট তৈরি করুন")}</h3>
                            <p>{tText("Sign up for free and verify your account in minutes", "বিনামূল্যে সাইন আপ করুন এবং মিনিটের মধ্যে আপনার অ্যাকাউন্ট যাচাই করুন")}</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-icon">
                                <i className="fas fa-wallet"></i>
                            </div>
                            <h3>{tText("Add Funds", "তহবিল যোগ করুন")}</h3>
                            <p>{tText("Deposit money via bKash or Nagad securely", "bKash বা Nagad এর মাধ্যমে নিরাপদে টাকা জমা দিন")}</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-icon">
                                <i className="fas fa-shopping-cart"></i>
                            </div>
                            <h3>{tText("Choose Product", "পণ্য বাছাই করুন")}</h3>
                            <p>{tText("Select from various investment packages", "বিভিন্ন বিনিয়োগ প্যাকেজ থেকে বেছে নিন")}</p>
                        </div>
                        <div className="step">
                            <div className="step-number">4</div>
                            <div className="step-icon">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <h3>{tText("Earn Profits", "মুনাফা অর্জন করুন")}</h3>
                            <p>{tText("Watch your investment grow and withdraw anytime", "আপনার বিনিয়োগ বৃদ্ধি দেখুন এবং যেকোনো সময় উত্তোলন করুন")}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <div className="section-header">
                        <h2>{tText("Why Choose Us", "কেন আমাদের বেছে নেবেন")}</h2>
                        <p>{tText("We provide the best investment experience", "আমরা সেরা বিনিয়োগ অভিজ্ঞতা প্রদান করি")}</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <h3>{tText("Secure Platform", "নিরাপদ প্ল্যাটফর্ম")}</h3>
                            <p>{tText("Your investments are protected with bank-level security", "আপনার বিনিয়োগ ব্যাংক-স্তরের নিরাপত্তা দিয়ে সুরক্ষিত")}</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-bolt"></i>
                            </div>
                            <h3>{tText("Instant Withdrawals", "তাৎক্ষণিক উত্তোলন")}</h3>
                            <p>{tText("Get your profits directly to bKash/Nagad within hours", "ঘণ্টার মধ্যে সরাসরি bKash/Nagad এ আপনার মুনাফা পান")}</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <h3>{tText("Referral Rewards", "রেফারেল পুরস্কার")}</h3>
                            <p>{tText("Earn extra income by inviting friends and family", "বন্ধু এবং পরিবারকে আমন্ত্রণ জানিয়ে অতিরিক্ত আয় করুন")}</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-headset"></i>
                            </div>
                            <h3>{tText("24/7 Support", "২৪/৭ সাপোর্ট")}</h3>
                            <p>{tText("Our support team is always ready to help you", "আমাদের সাপোর্ট টিম সবসময় আপনাকে সাহায্য করতে প্রস্তুত")}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials">
                <div className="container">
                    <div className="section-header">
                        <h2>{tText("What Our Investors Say", "আমাদের বিনিয়োগকারীরা কি বলেন")}</h2>
                    </div>
                    <div className="testimonials-grid">
                        <div className="testimonial-card">
                            <div className="testimonial-content">
                                <p>"{tText("I've been investing for 6 months and already earned ৳50,000 in profits. Highly recommended!", "আমি ৬ মাস ধরে বিনিয়োগ করছি এবং ইতিমধ্যে ৫০,০০০ টাকা মুনাফা অর্জন করেছি। অত্যন্ত সুপারিশকৃত!")}"</p>
                            </div>
                            <div className="testimonial-author">
                                <div className="author-avatar">
                                    <i className="fas fa-user"></i>
                                </div>
                                <div className="author-info">
                                    <h4>Rahim Ahmed</h4>
                                    <span>Dhaka</span>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card">
                            <div className="testimonial-content">
                                <p>"{tText("The auto-sell feature is amazing. I don't have to worry about anything, profits come automatically.", "অটো-সেল বৈশিষ্ট্যটি দুর্দান্ত। আমাকে কোনো কিছু নিয়ে চিন্তা করতে হয় না, লভ্যাংশ স্বয়ংক্রিয়ভাবে চলে আসে।")}"</p>
                            </div>
                            <div className="testimonial-author">
                                <div className="author-avatar">
                                    <i className="fas fa-user"></i>
                                </div>
                                <div className="author-info">
                                    <h4>Fatima Begum</h4>
                                    <span>Chittagong</span>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card">
                            <div className="testimonial-content">
                                <p>"{tText("Withdrawals are super fast! I received my money within 2 hours. Great platform!", "উত্তোলন অত্যন্ত দ্রুত! আমি ২ ঘন্টার মধ্যে আমার টাকা পেয়েছি। দারুণ প্ল্যাটফর্ম!")}"</p>
                            </div>
                            <div className="testimonial-author">
                                <div className="author-avatar">
                                    <i className="fas fa-user"></i>
                                </div>
                                <div className="author-info">
                                    <h4>Karim Hossain</h4>
                                    <span>Sylhet</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>{tText("Ready to Start Earning?", "উপার্জন শুরু করতে প্রস্তুত?")}</h2>
                        <p>{tText("Join thousands of successful investors today and start your journey to financial freedom.", "আজই হাজার হাজার সফল বিনিয়োগকারীদের সাথে যোগ দিন এবং আর্থিক স্বাধীনতার দিকে আপনার যাত্রা শুরু করুন।")}</p>
                        <Link href="/signup" className="btn btn-light btn-lg">
                            {tText("Create Free Account", "বিনামূল্যে অ্যাকাউন্ট তৈরি করুন")}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img src="/name_white.png" alt="SmartEarnBD" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                            </Link>
                            <p>{tText("Your trusted investment platform for secure and profitable investments.", "নিরাপদ এবং লাভজনক বিনিয়োগের জন্য আপনার বিশ্বস্ত বিনিয়োগ প্ল্যাটফর্ম।")}</p>
                            <div className="social-links">
                                <a href="#"><i className="fab fa-facebook-f"></i></a>
                                <a href="#"><i className="fab fa-telegram"></i></a>
                                <a href="#"><i className="fab fa-whatsapp"></i></a>
                                <a href="#"><i className="fab fa-youtube"></i></a>
                            </div>
                        </div>
                        <div className="footer-links-col">
                            <h4>{tText("Quick Links", "দ্রুত লিংক")}</h4>
                            <ul>
                                <li><Link href="/">{tText("Home", "হোম")}</Link></li>
                                <li><Link href="/products">{tText("Products", "পণ্য")}</Link></li>
                                <li><Link href="/about">{tText("About Us", "আমাদের সম্পর্কে")}</Link></li>
                                <li><Link href="/login">{tText("Login", "লগইন")}</Link></li>
                            </ul>
                        </div>
                        <div className="footer-links-col">
                            <h4>{tText("Support", "সাপোর্ট")}</h4>
                            <ul>
                                <li><a href="#">{tText("FAQ", "এফএকিউ")}</a></li>
                                <li><a href="#">{tText("Contact", "যোগাযোগ")}</a></li>
                                <li><a href="#">{tText("Terms of Service", "সেবার শর্তাবলী")}</a></li>
                                <li><a href="#">{tText("Privacy Policy", "গোপনীয়তা নীতি")}</a></li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h4>{tText("Contact Us", "যোগাযোগ")}</h4>
                            <ul>
                                <li><a href="mailto:support@smartearnbd.com"><i className="fas fa-envelope"></i> support@smartearnbd.com</a></li>
                                <li><a href="tel:+8801XXXXXXXXX"><i className="fas fa-phone"></i> {tNum("+880 1XXX-XXXXXX")}</a></li>
                                <li><span><i className="fas fa-map-marker-alt"></i> {tText("Dhaka, Bangladesh", "ঢাকা, বাংলাদেশ")}</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; {tNum(2026)} SmartEarnBD. {tText("All rights reserved.", "সর্বস্বত্ব সংরক্ষিত।")}</p>
                        <div className="footer-bottom-links">
                            <a href="#">{tText("Privacy Policy", "গোপনীয়তা নীতি")}</a>
                            <a href="#">{tText("Terms of Service", "সেবার শর্তাবলী")}</a>
                            <a href="#">{tText("Cookie Policy", "কুকি নীতি")}</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
