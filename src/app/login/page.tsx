'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Security from '@/lib/security';
import Storage from '@/lib/storage';

export default function LoginPage() {
    const { lang, t, tText, toggleLang } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { login, user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Forgot Password Modal
    const [forgotModalOpen, setForgotModalOpen] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetEmail, setResetEmail] = useState('');
    const [resetPhone, setResetPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [resetUserIndex, setResetUserIndex] = useState<number>(-1);
    const [passStrengthText, setPassStrengthText] = useState('');
    const [passStrengthColor, setPassStrengthColor] = useState('');
    const [passStrengthWidth, setPassStrengthWidth] = useState('0%');

    useEffect(() => {
        setMounted(true);
        if (user) {
            router.push(user.role === 'admin' ? '/admin' : '/dashboard');
        }
    }, [user, router]);

    if (!mounted) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            showToast('Please enter email and password', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const res = await login(email.trim().toLowerCase(), password);
            if (res.success) {
                showToast('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    router.push(res.role === 'admin' ? '/admin' : '/dashboard');
                }, 1000);
            } else {
                showToast(res.message, 'error');
            }
        } catch (err) {
            showToast('Login failed. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const checkPasswordStrength = (val: string) => {
        setNewPassword(val);
        const result = Security.validatePassword(val);
        const percentage = (result.strength / 5) * 100;
        setPassStrengthWidth(`${percentage}%`);
        if (result.strength <= 2) {
            setPassStrengthColor('#ef4444'); setPassStrengthText('Weak password');
        } else if (result.strength <= 3) {
            setPassStrengthColor('#f59e0b'); setPassStrengthText('Medium password');
        } else {
            setPassStrengthColor('#10b981'); setPassStrengthText('Strong password');
        }
    };

    const verifyEmail = () => {
        if (!resetEmail.trim()) { showToast('Please enter your email', 'error'); return; }
        const users = Storage.get('users') || [];
        const index = users.findIndex((u: any) => u.email === resetEmail.trim().toLowerCase());
        if (index === -1) { showToast('No account found with this email', 'error'); return; }
        setResetUserIndex(index);
        setResetStep(2);
    };

    const verifyPhone = () => {
        if (!resetPhone.trim()) { showToast('Please enter your registered phone number', 'error'); return; }
        const users = Storage.get('users') || [];
        const targetUser = users[resetUserIndex];
        if (targetUser && targetUser.phone === resetPhone.trim()) {
            setResetStep(3);
        } else {
            showToast('Phone number does not match our records', 'error');
        }
    };

    const resetPassword = () => {
        if (newPassword.length < 6) { showToast('Password must be at least 6 characters long', 'error'); return; }
        if (newPassword !== confirmNewPassword) { showToast('Passwords do not match', 'error'); return; }
        const users = Storage.get('users') || [];
        if (resetUserIndex !== -1 && users[resetUserIndex]) {
            users[resetUserIndex].password = newPassword;
            Storage.set('users', users);
            showToast('Password reset successfully! Please login with your new password.', 'success');
            closeForgotModal();
        } else {
            showToast('Error resetting password. Please try again.', 'error');
        }
    };

    const closeForgotModal = () => {
        setForgotModalOpen(false);
        setResetStep(1);
        setResetEmail('');
        setResetPhone('');
        setNewPassword('');
        setConfirmNewPassword('');
        setResetUserIndex(-1);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <style jsx global>{`
                .auth-page-wrapper {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                .auth-section-pro {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 100px 20px 40px;
                    background: var(--bg-secondary);
                }
                .auth-wrapper-pro {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    max-width: 1000px;
                    width: 100%;
                    background: var(--bg-primary);
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 25px 80px rgba(0,0,0,0.25);
                    border: 1px solid var(--border-color);
                }
                .auth-form-side {
                    padding: 48px 40px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .auth-brand-side {
                    background: linear-gradient(135deg, #0b1524 0%, #0f2744 30%, #178582 60%, #0d5a58 100%);
                    background-size: 300% 300%;
                    animation: authGradientShift 8s ease infinite;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 40px;
                    position: relative;
                    overflow: hidden;
                }
                @keyframes authGradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .auth-brand-side::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.03) 0%, transparent 50%),
                                radial-gradient(circle at 70% 30%, rgba(255,255,255,0.02) 0%, transparent 40%);
                    animation: floatParticles 15s ease-in-out infinite;
                }
                @keyframes floatParticles {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(2%, -2%) rotate(1deg); }
                    66% { transform: translate(-1%, 1%) rotate(-0.5deg); }
                }
                .auth-brand-content {
                    position: relative;
                    z-index: 2;
                    color: white;
                    text-align: left;
                }
                .auth-brand-content h2 {
                    font-size: 28px;
                    font-weight: 800;
                    margin-bottom: 12px;
                    letter-spacing: -0.03em;
                    line-height: 1.2;
                }
                .auth-brand-content p {
                    font-size: 14px;
                    opacity: 0.7;
                    margin-bottom: 28px;
                    line-height: 1.6;
                }
                .auth-features-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .auth-features-list li {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 14px;
                    opacity: 0.85;
                }
                .auth-features-list li i {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    flex-shrink: 0;
                }
                .auth-form-header {
                    text-align: center;
                    margin-bottom: 32px;
                }
                .auth-form-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, rgba(23, 133, 130, 0.1), rgba(23, 133, 130, 0.05));
                    border: 1px solid rgba(23, 133, 130, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    color: var(--primary-color);
                    font-size: 22px;
                }
                .auth-form-header h1 {
                    font-size: 24px;
                    font-weight: 800;
                    margin-bottom: 6px;
                    color: var(--text-primary);
                    letter-spacing: -0.03em;
                }
                .auth-form-header p {
                    color: var(--text-muted);
                    font-size: 13px;
                }
                .auth-input-group {
                    margin-bottom: 18px;
                }
                .auth-input-group label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: var(--text-primary);
                }
                .auth-input-wrap {
                    position: relative;
                }
                .auth-input-wrap i.field-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                    font-size: 14px;
                    pointer-events: none;
                    z-index: 1;
                }
                .auth-input-wrap input {
                    width: 100%;
                    padding: 13px 14px 13px 42px;
                    border: 1.5px solid var(--border-color);
                    border-radius: 12px;
                    font-size: 14px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    transition: all 0.25s ease;
                    outline: none;
                }
                .auth-input-wrap input:focus {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(23, 133, 130, 0.1);
                }
                .auth-input-wrap input::placeholder {
                    color: var(--text-muted);
                    opacity: 0.6;
                }
                .auth-toggle-pw {
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 4px;
                    background: none;
                    border: none;
                    font-size: 14px;
                    z-index: 1;
                }
                .auth-toggle-pw:hover {
                    color: var(--primary-color);
                }
                .auth-options-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    font-size: 13px;
                }
                .auth-remember {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    color: var(--text-secondary);
                }
                .auth-remember input {
                    width: 16px;
                    height: 16px;
                    accent-color: var(--primary-color);
                }
                .auth-forgot-link {
                    color: var(--primary-color);
                    text-decoration: none;
                    font-weight: 500;
                    transition: opacity 0.2s;
                }
                .auth-forgot-link:hover {
                    text-decoration: underline;
                }
                .auth-submit-btn {
                    width: 100%;
                    height: 48px;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark, #0d5a58));
                    color: white;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .auth-submit-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(23, 133, 130, 0.3);
                }
                .auth-submit-btn:disabled {
                    opacity: 0.7;
                    cursor: wait;
                }
                .auth-footer-text {
                    text-align: center;
                    margin-top: 24px;
                    font-size: 13px;
                    color: var(--text-secondary);
                }
                .auth-footer-text a {
                    color: var(--primary-color);
                    font-weight: 600;
                    text-decoration: none;
                    margin-left: 4px;
                }
                .auth-footer-text a:hover {
                    text-decoration: underline;
                }
                /* Step indicators */
                .reset-steps {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 20px;
                }
                .reset-step-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--border-color);
                    transition: all 0.3s ease;
                }
                .reset-step-dot.active {
                    background: var(--primary-color);
                    width: 24px;
                    border-radius: 4px;
                }
                .reset-step-dot.done {
                    background: #10b981;
                }
                /* Modal styles */
                .form-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .form-modal.active {
                    display: flex;
                }
                .form-modal-content {
                    background: var(--bg-primary);
                    border-radius: 20px;
                    max-width: 440px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 25px 60px rgba(0,0,0,0.3);
                }
                .form-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 25px;
                    border-bottom: 1px solid var(--border-color);
                }
                .form-modal-header h3 {
                    font-size: 17px;
                    font-weight: 700;
                    margin: 0;
                    color: var(--text-primary);
                }
                .form-modal-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    border: none;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                .form-modal-close:hover {
                    background: #ef4444;
                    color: white;
                }
                .form-modal-body {
                    padding: 25px;
                }
                @media (max-width: 768px) {
                    .auth-wrapper-pro {
                        grid-template-columns: 1fr;
                    }
                    .auth-brand-side {
                        display: none;
                    }
                    .auth-form-side {
                        padding: 32px 24px;
                    }
                }
            `}</style>

            {/* Navigation */}
            <nav className="navbar">
                <div className="container">
                    <Link href="/" className="logo">
                        <i className="fas fa-rocket"></i>
                        <span>SmartEarn</span>
                    </Link>
                    <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`} id="navLinks">
                        <Link href="/">{t('nav.home')}</Link>
                        <Link href="/products">{t('nav.products')}</Link>
                        <Link href="/about">{t('nav.about')}</Link>
                        <Link href="/login" className="active">{t('nav.login')}</Link>
                        <Link href="/signup" className="btn btn-primary">{t('nav.signup')}</Link>
                    </div>
                    <div className="nav-controls">
                        <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                            <i className={`fas ${theme === 'dark' ? 'fa-sun' : theme === 'system' ? 'fa-desktop' : 'fa-moon'}`}></i>
                        </button>
                        <button className="lang-toggle" onClick={toggleLang} title="Toggle Language">
                            <span>{lang.toUpperCase()}</span>
                        </button>
                        <button className="mobile-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Login Section */}
            <section className="auth-section-pro">
                <div className="auth-wrapper-pro">
                    {/* Form Side */}
                    <div className="auth-form-side">
                        <div className="auth-form-header">
                            <div className="auth-form-icon">
                                <i className="fas fa-fingerprint"></i>
                            </div>
                            <h1>{tText("Welcome Back", "স্বাগতম")}</h1>
                            <p>{tText("Sign in to your account to continue", "চালিয়ে যেতে আপনার অ্যাকাউন্টে সাইন ইন করুন")}</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="auth-input-group">
                                <label htmlFor="loginEmail">{tText("Email Address", "ইমেইল ঠিকানা")}</label>
                                <div className="auth-input-wrap">
                                    <i className="fas fa-envelope field-icon"></i>
                                    <input
                                        type="email"
                                        id="loginEmail"
                                        required
                                        placeholder={tText("you@example.com", "আপনার ইমেইল")}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label htmlFor="loginPassword">{t('auth.password')}</label>
                                <div className="auth-input-wrap">
                                    <i className="fas fa-lock field-icon"></i>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        id="loginPassword"
                                        required
                                        placeholder={tText("Enter your password", "আপনার পাসওয়ার্ড")}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button type="button" className="auth-toggle-pw" onClick={() => setShowPass(!showPass)}>
                                        <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="auth-options-row">
                                <label className="auth-remember">
                                    <input type="checkbox" name="remember" />
                                    <span>{tText("Remember me", "মনে রাখুন")}</span>
                                </label>
                                <a href="#" className="auth-forgot-link" onClick={(e) => { e.preventDefault(); setForgotModalOpen(true); }}>
                                    {t('auth.forgotPassword')}
                                </a>
                            </div>

                            <button type="submit" className="auth-submit-btn" disabled={submitting}>
                                {submitting ? (
                                    <><i className="fas fa-spinner fa-spin"></i><span>{tText("Signing in...", "সাইন ইন হচ্ছে...")}</span></>
                                ) : (
                                    <><span>{tText("Sign In", "সাইন ইন")}</span><i className="fas fa-arrow-right"></i></>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer-text">
                            <span>{t('auth.noAccount')}</span>
                            <Link href="/signup">{t('nav.signup')}</Link>
                        </div>
                    </div>

                    {/* Brand Side — Animated Gradient */}
                    <div className="auth-brand-side">
                        <div className="auth-brand-content">
                            <h2>{tText("Start Earning\nToday", "আজই উপার্জন\nশুরু করুন")}</h2>
                            <p>{tText("Join thousands of members earning through our trusted platform.", "আমাদের বিশ্বস্ত প্ল্যাটফর্মের মাধ্যমে হাজারো সদস্যদের সাথে যোগ দিন।")}</p>
                            <ul className="auth-features-list">
                                <li><i className="fas fa-shield-alt"></i><span>{tText("Secure & Trusted Platform", "নিরাপদ এবং বিশ্বস্ত প্ল্যাটফর্ম")}</span></li>
                                <li><i className="fas fa-chart-line"></i><span>{tText("Earn from Tasks & Referrals", "কাজ ও রেফারেল থেকে আয় করুন")}</span></li>
                                <li><i className="fas fa-bolt"></i><span>{tText("Instant Withdrawals", "তাৎক্ষণিক উত্তোলন")}</span></li>
                                <li><i className="fas fa-headset"></i><span>{tText("24/7 Customer Support", "২৪/৭ গ্রাহক সেবা")}</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Forgot Password Modal */}
            <div className={`form-modal ${forgotModalOpen ? 'active' : ''}`} id="forgotPasswordModal">
                <div className="form-modal-content">
                    <div className="form-modal-header">
                        <h3><i className="fas fa-key" style={{ marginRight: '10px' }}></i>Reset Password</h3>
                        <button className="form-modal-close" onClick={closeForgotModal}><i className="fas fa-times"></i></button>
                    </div>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="form-modal-body">
                            {/* Step indicators */}
                            <div className="reset-steps">
                                <div className={`reset-step-dot ${resetStep === 1 ? 'active' : resetStep > 1 ? 'done' : ''}`}></div>
                                <div className={`reset-step-dot ${resetStep === 2 ? 'active' : resetStep > 2 ? 'done' : ''}`}></div>
                                <div className={`reset-step-dot ${resetStep === 3 ? 'active' : ''}`}></div>
                            </div>

                            {resetStep === 1 && (
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>Enter your registered email address to begin password reset.</p>
                                    <div className="auth-input-group">
                                        <label htmlFor="resetEmail">Email Address</label>
                                        <div className="auth-input-wrap">
                                            <i className="fas fa-envelope field-icon"></i>
                                            <input type="email" id="resetEmail" placeholder="Enter your email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                                        </div>
                                    </div>
                                    <button type="button" className="auth-submit-btn" onClick={verifyEmail}>
                                        <span>Continue</span><i className="fas fa-arrow-right"></i>
                                    </button>
                                </div>
                            )}

                            {resetStep === 2 && (
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>Verify your identity with your registered phone number.</p>
                                    <div className="auth-input-group">
                                        <label htmlFor="resetPhone">Phone Number</label>
                                        <div className="auth-input-wrap">
                                            <i className="fas fa-phone field-icon"></i>
                                            <input type="tel" id="resetPhone" placeholder="01XXXXXXXXX" required value={resetPhone} onChange={e => setResetPhone(e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="button" className="btn btn-outline" onClick={() => setResetStep(1)} style={{ flex: 1, height: '48px', borderRadius: '12px' }}>
                                            <i className="fas fa-arrow-left"></i> Back
                                        </button>
                                        <button type="button" className="auth-submit-btn" onClick={verifyPhone} style={{ flex: 1 }}>
                                            Verify <i className="fas fa-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {resetStep === 3 && (
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>Create a new strong password for your account.</p>
                                    <div className="auth-input-group">
                                        <label htmlFor="newPassword">New Password</label>
                                        <div className="auth-input-wrap">
                                            <i className="fas fa-lock field-icon"></i>
                                            <input type={showPass ? 'text' : 'password'} id="newPassword" placeholder="Min 6 characters" required value={newPassword} onChange={e => checkPasswordStrength(e.target.value)} />
                                            <button type="button" className="auth-toggle-pw" onClick={() => setShowPass(!showPass)}>
                                                <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                        <div style={{ marginTop: '8px' }}>
                                            <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: passStrengthWidth, background: passStrengthColor, transition: 'all 0.3s' }}></div>
                                            </div>
                                            <span style={{ fontSize: '11px', marginTop: '4px', display: 'block', color: passStrengthColor }}>{passStrengthText}</span>
                                        </div>
                                    </div>
                                    <div className="auth-input-group">
                                        <label htmlFor="confirmNewPassword">Confirm Password</label>
                                        <div className="auth-input-wrap">
                                            <i className="fas fa-lock field-icon"></i>
                                            <input type={showPass ? 'text' : 'password'} id="confirmNewPassword" placeholder="Confirm password" required value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="button" className="btn btn-outline" onClick={() => setResetStep(2)} style={{ flex: 1, height: '48px', borderRadius: '12px' }}>
                                            <i className="fas fa-arrow-left"></i> Back
                                        </button>
                                        <button type="button" className="auth-submit-btn" onClick={resetPassword} style={{ flex: 1 }}>
                                            <i className="fas fa-check"></i> Reset
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
