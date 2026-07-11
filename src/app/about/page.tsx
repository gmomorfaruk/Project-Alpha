'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export default function About() {
    const { lang, t, tText, toggleLang } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Style override block for About page */}
            <style jsx global>{`
                .about-hero {
                    padding: 140px 0 80px;
                    background: var(--bg-gradient);
                    text-align: center;
                }
                .about-hero h1 {
                    font-size: 42px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    background: var(--primary-gradient);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .about-hero p {
                    font-size: 18px;
                    color: var(--text-secondary);
                    max-width: 600px;
                    margin: 0 auto;
                }
                .about-section {
                    padding: 80px 0;
                }
                .about-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 60px;
                    align-items: center;
                }
                .about-content h2 {
                    font-size: 32px;
                    margin-bottom: 20px;
                    color: var(--text-primary);
                }
                .about-content p {
                    color: var(--text-secondary);
                    margin-bottom: 15px;
                    line-height: 1.8;
                }
                .about-image {
                    background: var(--primary-light);
                    border-radius: 20px;
                    padding: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .about-image i {
                    font-size: 150px;
                    color: var(--primary-color);
                }
                .mission-vision {
                    background: var(--bg-secondary);
                }
                .mv-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 40px;
                }
                .mv-card {
                    background: var(--bg-primary);
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    border: 1px solid var(--border-color);
                }
                .mv-card .icon {
                    width: 80px;
                    height: 80px;
                    background: var(--primary-light);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                }
                .mv-card .icon i {
                    font-size: 36px;
                    color: var(--primary-color);
                }
                .mv-card h3 {
                    font-size: 24px;
                    margin-bottom: 15px;
                }
                .mv-card p {
                    color: var(--text-secondary);
                    line-height: 1.7;
                }
                .team-section {
                    padding: 80px 0;
                }
                .team-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 30px;
                }
                .team-card {
                    text-align: center;
                    padding: 30px;
                    background: var(--bg-primary);
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    transition: all 0.3s;
                }
                .team-card:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-lg);
                }
                .team-avatar {
                    width: 100px;
                    height: 100px;
                    background: var(--primary-light);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                }
                .team-avatar i {
                    font-size: 40px;
                    color: var(--primary-color);
                }
                .team-card h4 {
                    font-size: 18px;
                    margin-bottom: 5px;
                }
                .team-card span {
                    color: var(--text-secondary);
                    font-size: 14px;
                }
                .stats-section {
                    padding: 80px 0;
                    background: var(--primary-gradient);
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 30px;
                    text-align: center;
                    color: white;
                }
                .stat-item h3 {
                    font-size: 48px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }
                .stat-item p {
                    font-size: 16px;
                    opacity: 0.9;
                }
                .contact-section {
                    padding: 80px 0;
                    background: var(--bg-secondary);
                }
                .contact-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 30px;
                }
                .contact-card {
                    background: var(--bg-primary);
                    padding: 40px 30px;
                    border-radius: 16px;
                    text-align: center;
                    border: 1px solid var(--border-color);
                }
                .contact-card .icon {
                    width: 60px;
                    height: 60px;
                    background: var(--primary-light);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                }
                .contact-card .icon i {
                    font-size: 24px;
                    color: var(--primary-color);
                }
                .contact-card h4 {
                    font-size: 18px;
                    margin-bottom: 10px;
                }
                .contact-card p {
                    color: var(--text-secondary);
                }
                .contact-card a {
                    color: var(--primary-color);
                }
                @media (max-width: 1024px) {
                    .about-grid {
                        grid-template-columns: 1fr;
                    }
                    .about-image {
                        order: -1;
                    }
                    .mv-grid {
                        grid-template-columns: 1fr;
                    }
                    .team-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .contact-grid {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 768px) {
                    .team-grid {
                        grid-template-columns: 1fr;
                    }
                    .stat-item h3 {
                        font-size: 36px;
                    }
                }
            `}</style>

            {/* Navigation */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} style={{ boxShadow: scrolled ? 'var(--shadow-md)' : 'none' }}>
                <div className="container">
                    <Link href="/" className="logo">
                        <i className="fas fa-rocket"></i>
                        <span>SmartEarnBD</span>
                    </Link>
                    
                    <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`} id="navLinks">
                        <Link href="/">
                            {t('nav.home')}
                        </Link>
                        <Link href="/products">
                            {t('nav.products')}
                        </Link>
                        <Link href="/about" className="active">
                            {t('nav.about')}
                        </Link>
                        <Link href="/login">
                            {t('nav.login')}
                        </Link>
                        <Link href="/signup" className="btn btn-primary">
                            {t('nav.signup')}
                        </Link>
                    </div>

                    <div className="nav-controls">
                        <button className="theme-toggle" id="themeToggle" onClick={toggleTheme} title="Toggle Theme">
                            <i className={`fas ${theme === 'dark' ? 'fa-sun' : theme === 'system' ? 'fa-desktop' : 'fa-moon'}`}></i>
                        </button>
                        
                        <button className="lang-toggle" id="langToggle" onClick={toggleLang} title="Toggle Language">
                            <span>{lang.toUpperCase()}</span>
                        </button>
                        
                        <button className="mobile-menu" id="mobileMenu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="about-hero">
                <div className="container">
                    <h1>{tText("About SmartEarnBD", "স্মার্টআর্নবিডি সম্পর্কে")}</h1>
                    <p>{tText("We're on a mission to make investing accessible and profitable for everyone in Bangladesh.", "আমরা বাংলাদেশের সবার জন্য বিনিয়োগকে সহজলভ্য এবং লাভজনক করার মিশনে আছি।")}</p>
                </div>
            </section>

            {/* About Section */}
            <section className="about-section">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-content">
                            <h2>{tText("Who We Are", "আমরা কারা")}</h2>
                            <p>{tText("SmartEarnBD is a leading investment platform in Bangladesh that connects investors with profitable opportunities. Founded in 2024, we've grown to serve thousands of satisfied investors across the country.", "স্মার্টআর্নবিডি বাংলাদেশের একটি শীর্ষস্থানীয় বিনিয়োগ প্ল্যাটফর্ম যা বিনিয়োগকারীদের লাভজনক সুযোগের সাথে সংযুক্ত করে। ২০২৪ সালে প্রতিষ্ঠিত, আমরা সারা দেশে হাজার হাজার সন্তুষ্ট বিনিয়োগকারীদের সেবা দিতে বড় হয়েছি।")}</p>
                            <p>{tText("Our platform offers a unique combination of auto-sell and self-sell options, giving our investors flexibility in how they manage their investments and maximize their returns.", "আমাদের প্ল্যাটফর্ম অটো-সেল এবং সেলফ-সেলের একটি অনন্য সমন্বয় প্রদান করে, যা আমাদের বিনিয়োগকারীদের তাদের বিনিয়োগ পরিচালনা এবং রিটার্ন সর্বাধিক করার ক্ষেত্রে নমনীয়তা দেয়।")}</p>
                            <p>{tText("We believe in transparency, security, and putting our investors first. That's why we've built a platform that's easy to use, secure, and designed to help you grow your wealth.", "আমরা স্বচ্ছতা, নিরাপত্তা এবং আমাদের বিনিয়োগকারীদের প্রথমে রাখায় বিশ্বাস করি। এই কারণেই আমরা একটি প্ল্যাটফর্ম তৈরি করেছি যা ব্যবহার করা সহজ, নিরাপদ এবং আপনার সম্পদ বৃদ্ধিতে সহায়তা করার জন্য ডিজাইন করা হয়েছে।")}</p>
                        </div>
                        <div className="about-image">
                            <i className="fas fa-building"></i>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="about-section mission-vision">
                <div className="container">
                    <div className="section-header">
                        <h2>{tText("Our Mission & Vision", "আমাদের মিশন ও ভিশন")}</h2>
                    </div>
                    <div className="mv-grid">
                        <div className="mv-card">
                            <div className="icon">
                                <i className="fas fa-bullseye"></i>
                            </div>
                            <h3>{tText("Our Mission", "আমাদের মিশন")}</h3>
                            <p>{tText("To democratize investing by providing a secure, transparent, and user-friendly platform that enables everyone to build wealth through smart investments.", "একটি নিরাপদ, স্বচ্ছ এবং ব্যবহারকারী-বান্ধব প্ল্যাটফর্ম প্রদান করে বিনিয়োগকে গণতন্ত্রায়িত করা যা সবাইকে স্মার্ট বিনিয়োগের মাধ্যমে সম্পদ গড়ে তুলতে সক্ষম করে।")}</p>
                        </div>
                        <div className="mv-card">
                            <div className="icon">
                                <i className="fas fa-eye"></i>
                            </div>
                            <h3>{tText("Our Vision", "আমাদের ভিশন")}</h3>
                            <p>{tText("To become Bangladesh's most trusted investment platform, empowering millions of people to achieve financial freedom and security through innovative investment solutions.", "বাংলাদেশের সবচেয়ে বিশ্বস্ত বিনিয়োগ প্ল্যাটফর্ম হয়ে ওঠা, উদ্ভাবনী বিনিয়োগ সমাধানের মাধ্যমে লক্ষ লক্ষ মানুষকে আর্থিক স্বাধীনতা এবং নিরাপত্তা অর্জন করতে ক্ষমতায়ন করা।")}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <h3>10,000+</h3>
                            <p>{tText("Active Investors", "সক্রিয় বিনিয়োগকারী")}</p>
                        </div>
                        <div className="stat-item">
                            <h3>৳50M+</h3>
                            <p>{tText("Total Invested", "মোট বিনিয়োগ")}</p>
                        </div>
                        <div className="stat-item">
                            <h3>৳8M+</h3>
                            <p>{tText("Profits Distributed", "বিতরিত মুনাফা")}</p>
                        </div>
                        <div className="stat-item">
                            <h3>99%</h3>
                            <p>{tText("Customer Satisfaction", "গ্রাহক সন্তুষ্টি")}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="team-section">
                <div className="container">
                    <div className="section-header">
                        <h2>{tText("Our Leadership Team", "আমাদের নেতৃত্ব দল")}</h2>
                        <p>{tText("Meet the experts behind SmartEarnBD", "স্মার্টআর্নবিডির পেছনের বিশেষজ্ঞদের সাথে পরিচিত হন")}</p>
                    </div>
                    <div className="team-grid">
                        <div className="team-card">
                            <div className="team-avatar">
                                <i className="fas fa-user"></i>
                            </div>
                            <h4>Mohammad Rahman</h4>
                            <span>CEO & Founder</span>
                        </div>
                        <div className="team-card">
                            <div className="team-avatar">
                                <i className="fas fa-user"></i>
                            </div>
                            <h4>Fatima Akter</h4>
                            <span>Chief Operations Officer</span>
                        </div>
                        <div className="team-card">
                            <div className="team-avatar">
                                <i className="fas fa-user"></i>
                            </div>
                            <h4>Karim Hossain</h4>
                            <span>Chief Technology Officer</span>
                        </div>
                        <div className="team-card">
                            <div className="team-avatar">
                                <i className="fas fa-user"></i>
                            </div>
                            <h4>Nusrat Jahan</h4>
                            <span>Head of Customer Success</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="contact-section">
                <div className="container">
                    <div className="section-header">
                        <h2>{tText("Get In Touch", "যোগাযোগ করুন")}</h2>
                        <p>{tText("Have questions? We'd love to hear from you.", "প্রশ্ন আছে? আমরা আপনার কাছ থেকে শুনতে চাই।")}</p>
                    </div>
                    <div className="contact-grid">
                        <div className="contact-card">
                            <div className="icon">
                                <i className="fas fa-envelope"></i>
                            </div>
                            <h4>{tText("Email Us", "ইমেইল করুন")}</h4>
                            <p><a href="mailto:support@smartearnbd.com">support@smartearnbd.com</a></p>
                        </div>
                        <div className="contact-card">
                            <div className="icon">
                                <i className="fas fa-phone"></i>
                            </div>
                            <h4>{tText("Call Us", "কল করুন")}</h4>
                            <p><a href="tel:+8801XXXXXXXXX">+880 1XXX-XXXXXX</a></p>
                        </div>
                        <div className="contact-card">
                            <div className="icon">
                                <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <h4>{tText("Visit Us", "আমাদের দেখুন")}</h4>
                            <p>Dhaka, Bangladesh</p>
                        </div>
                    </div>
                </div>
            </section>

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
