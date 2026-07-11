'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';

export default function Home() {
    const { t, tText, tNum } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                        <div className="product-card">
                            <div className="product-badge">{tText("Hot", "হট")}</div>
                            <div className="product-image">
                                <i className="fas fa-mobile-alt"></i>
                            </div>
                            <h3>{tText("Smartphone Package", "স্মার্টফোন প্যাকেজ")}</h3>
                            <div className="product-details">
                                <div className="detail">
                                    <span className="label">{tText("Price", "মূল্য")}</span>
                                    <span className="value">{tNum("৳5,000")}</span>
                                </div>
                                <div className="detail">
                                    <span className="label">{tText("Profit", "লাভ")}</span>
                                    <span className="value profit">{tNum("+12%")}</span>
                                </div>
                                <div className="detail">
                                    <span className="label">{tText("Duration", "সময়কাল")}</span>
                                    <span className="value">{tNum(30) + " " + tText("days", "দিন")}</span>
                                </div>
                            </div>
                            <Link href="/products" className="btn btn-primary btn-block">
                                {tText("Invest Now", "এখনই বিনিয়োগ করুন")}
                            </Link>
                        </div>

                        <div className="product-card featured">
                            <div className="product-badge special">{tText("Special Offer", "বিশেষ অফার")}</div>
                            <div className="product-image">
                                <i className="fas fa-laptop"></i>
                            </div>
                            <h3>{tText("Laptop Package", "ল্যাপটপ প্যাকেজ")}</h3>
                            <div className="product-details">
                                <div className="detail">
                                    <span className="label">{tText("Price", "মূল্য")}</span>
                                    <span className="value">{tNum("৳15,000")}</span>
                                </div>
                                <div className="detail">
                                    <span className="label">{tText("Profit", "লাভ")}</span>
                                    <span className="value profit">{tNum("+18%")}</span>
                                </div>
                                <div className="detail">
                                    <span className="label">{tText("Duration", "সময়কাল")}</span>
                                    <span className="value">{tNum(45) + " " + tText("days", "দিন")}</span>
                                </div>
                            </div>
                            <Link href="/products" className="btn btn-primary btn-block">
                                {tText("Invest Now", "এখনই বিনিয়োগ করুন")}
                            </Link>
                        </div>

                        <div className="product-card">
                            <div className="product-image">
                                <i className="fas fa-tv"></i>
                            </div>
                            <h3>{tText("Electronics Package", "ইলেকট্রনিক্স প্যাকেজ")}</h3>
                            <div className="product-details">
                                <div className="detail">
                                    <span className="label">{tText("Price", "মূল্য")}</span>
                                    <span className="value">{tNum("৳10,000")}</span>
                                </div>
                                <div className="detail">
                                    <span className="label">{tText("Profit", "লাভ")}</span>
                                    <span className="value profit">{tNum("+15%")}</span>
                                </div>
                                <div className="detail">
                                    <span className="label">{tText("Duration", "সময়কাল")}</span>
                                    <span className="value">{tNum(30) + " " + tText("days", "দিন")}</span>
                                </div>
                            </div>
                            <Link href="/products" className="btn btn-primary btn-block">
                                {tText("Invest Now", "এখনই বিনিয়োগ করুন")}
                            </Link>
                        </div>
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
                                <img src="/new_logo.png" alt="SmartEarnBD Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
                                <img src="/name_white.png" alt="SmartEarnBD" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
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
