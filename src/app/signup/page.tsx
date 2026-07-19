'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Security from '@/lib/security';

function SignupContent() {
    const { t, tText } = useTranslation();
    const { signup, user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Form inputs state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [role, setRole] = useState('user');
    const [agreeTerms, setAgreeTerms] = useState(false);
    
    // UI controls state
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Password Strength indicator state
    const [passStrengthText, setPassStrengthText] = useState('');
    const [passStrengthColor, setPassStrengthColor] = useState('');
    const [passStrengthWidth, setPassStrengthWidth] = useState('0%');

    // Fill referral code from URL if present
    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            setReferralCode(ref);
        }
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                const redirectPath = sessionStorage.getItem('adminRedirectPath');
                if (redirectPath) {
                    sessionStorage.removeItem('adminRedirectPath');
                    router.push(redirectPath);
                } else {
                    router.push('/dashboard');
                }
            } else if (user.role === 'buyer') {
                router.push('/buyer/dashboard');
            } else {
                router.push('/dashboard');
            }
        }
    }, [user, router]);

    // Check strength dynamically
    const handlePasswordChange = (val: string) => {
        setPassword(val);
        const result = Security.validatePassword(val);
        const percentage = (result.strength / 5) * 100;
        setPassStrengthWidth(`${percentage}%`);

        if (result.strength <= 2) {
            setPassStrengthColor('#ef4444');
            setPassStrengthText('Weak password');
        } else if (result.strength <= 3) {
            setPassStrengthColor('#f59e0b');
            setPassStrengthText('Medium password');
        } else {
            setPassStrengthColor('#10b981');
            setPassStrengthText('Strong password');
        }
    };

    // Signup form submission
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (!Security.isValidPhone(phone.trim())) {
            showToast('Please enter a valid phone number (e.g., 01XXXXXXXXX)', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (!agreeTerms) {
            showToast('You must agree to the Terms of Service & Privacy Policy', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const formData = {
                fullName: fullName.trim(),
                phone: phone.trim(),
                email: email.trim().toLowerCase(),
                password,
                referralCode: referralCode.trim(),
                role
            };

            const res = await signup(formData);
            if (res.success) {
                showToast('Account created successfully! Redirecting...', 'success');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            } else {
                showToast(res.message, 'error');
            }
        } catch (err) {
            showToast('Registration failed. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
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
                    padding: 40px;
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
                    padding: 40px;
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
                    margin-bottom: 24px;
                }
                .auth-form-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, rgba(23, 133, 130, 0.1), rgba(23, 133, 130, 0.05));
                    border: 1px solid rgba(23, 133, 130, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 12px;
                    color: var(--primary-color);
                    font-size: 20px;
                }
                .auth-form-header h1 {
                    font-size: 22px;
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
                    margin-bottom: 14px;
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
                    padding: 12px 14px 12px 42px;
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
                .auth-submit-btn {
                    width: 100%;
                    height: 46px;
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
                    margin-top: 10px;
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
                    margin-top: 20px;
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
                .auth-remember {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    font-size: 13px;
                    margin-top: 10px;
                }
                .auth-remember input {
                    width: 16px;
                    height: 16px;
                    accent-color: var(--primary-color);
                }
                .form-row-pro {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                @media (max-width: 640px) {
                    .auth-section-pro {
                        padding: 80px 14px 30px;
                        align-items: flex-start;
                    }
                    .auth-wrapper-pro {
                        grid-template-columns: 1fr;
                        border-radius: 16px;
                    }
                    .auth-brand-side {
                        display: none;
                    }
                    .auth-form-side {
                        padding: 28px 20px;
                    }
                    .form-row-pro {
                        grid-template-columns: 1fr;
                        gap: 0;
                    }
                    .auth-form-header h1 {
                        font-size: 20px;
                    }
                }
                @media (max-width: 400px) {
                    .auth-section-pro {
                        padding: 70px 10px 24px;
                    }
                    .auth-form-side {
                        padding: 22px 16px;
                    }
                }
            `}</style>

            {/* Navigation */}
            <Navbar />

            {/* Signup Section */}
            <section className="auth-section-pro">
                <div className="auth-wrapper-pro">
                    {/* Form Side */}
                    <div className="auth-form-side">
                        <div className="auth-form-header">
                            <div className="auth-form-icon">
                                <i className="fas fa-user-plus"></i>
                            </div>
                            <h1>{tText("Create Account", "অ্যাকাউন্ট তৈরি করুন")}</h1>
                            <p>{tText("Join our platform and start earning today", "আমাদের প্ল্যাটফর্মে যোগ দিন এবং আজই উপার্জন শুরু করুন")}</p>
                        </div>

                        <form onSubmit={handleSignup}>
                            <div className="form-row-pro">
                                <div className="auth-input-group">
                                    <label htmlFor="fullName">{tText("Full Name", "পুরো নাম")}</label>
                                    <div className="auth-input-wrap">
                                        <i className="fas fa-user field-icon"></i>
                                        <input
                                            type="text"
                                            id="fullName"
                                            required
                                            placeholder={tText("Enter full name", "আপনার পুরো নাম")}
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="auth-input-group">
                                    <label htmlFor="phone">{tText("Phone Number", "ফোন নম্বর")}</label>
                                    <div className="auth-input-wrap">
                                        <i className="fas fa-phone field-icon"></i>
                                        <input
                                            type="tel"
                                            id="phone"
                                            required
                                            placeholder="01XXXXXXXXX"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label htmlFor="signupEmail">{tText("Email Address", "ইমেইল ঠিকানা")}</label>
                                <div className="auth-input-wrap">
                                    <i className="fas fa-envelope field-icon"></i>
                                    <input
                                        type="email"
                                        id="signupEmail"
                                        required
                                        placeholder={tText("you@example.com", "আপনার ইমেইল")}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row-pro">
                                <div className="auth-input-group">
                                    <label htmlFor="signupPassword">{tText("Password", "পাসওয়ার্ড")}</label>
                                    <div className="auth-input-wrap">
                                        <i className="fas fa-lock field-icon"></i>
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            id="signupPassword"
                                            required
                                            placeholder={tText("Min 6 chars", "সর্বনিম্ন ৬ অক্ষর")}
                                            value={password}
                                            onChange={e => handlePasswordChange(e.target.value)}
                                        />
                                        <button type="button" className="auth-toggle-pw" onClick={() => setShowPass(!showPass)}>
                                            <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '5px' }}>
                                        <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: passStrengthWidth, background: passStrengthColor, transition: 'all 0.3s' }}></div>
                                        </div>
                                        <span style={{ fontSize: '11px', marginTop: '3px', display: 'block', color: passStrengthColor }}>{passStrengthText}</span>
                                    </div>
                                </div>
                                <div className="auth-input-group">
                                    <label htmlFor="confirmPassword">{tText("Confirm Password", "নিশ্চিত করুন")}</label>
                                    <div className="auth-input-wrap">
                                        <i className="fas fa-lock field-icon"></i>
                                        <input
                                            type={showConfirmPass ? 'text' : 'password'}
                                            id="confirmPassword"
                                            required
                                            placeholder={tText("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                        />
                                        <button type="button" className="auth-toggle-pw" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                                            <i className={`fas ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label htmlFor="roleSelect">{tText("Account Type", "অ্যাকাউন্টের ধরন")}</label>
                                <div className="auth-input-wrap">
                                    <i className="fas fa-users field-icon"></i>
                                    <select
                                        id="roleSelect"
                                        value={role}
                                        onChange={e => setRole(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px 12px 12px 40px', 
                                            border: '1px solid var(--border-color)', 
                                            borderRadius: '8px', 
                                            background: 'var(--bg-secondary)', 
                                            color: 'var(--text-primary)', 
                                            outline: 'none',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="user" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{tText("Investor / Package Holder", "বিনিয়োগকারী / প্যাকেজ হোল্ডার")}</option>
                                        <option value="buyer" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{tText("Buyer (Shop & Order)", "ক্রেতা (পণ্য ও অর্ডার)")}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label htmlFor="referralCode">{tText("Referral Code (Optional)", "রেফারেল কোড (ঐচ্ছিক)")}</label>
                                <div className="auth-input-wrap">
                                    <i className="fas fa-gift field-icon"></i>
                                    <input
                                        type="text"
                                        id="referralCode"
                                        placeholder={tText("Referral code if you have one", "যদি রেফারেল কোড থাকে")}
                                        value={referralCode}
                                        onChange={e => setReferralCode(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label className="auth-remember">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={e => setAgreeTerms(e.target.checked)}
                                        required
                                    />
                                    <span>
                                        {tText("I agree to the ", "আমি সম্মত ")}
                                        <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>{tText("Terms of Service", "সেবার শর্তাবলী")}</a>
                                        {tText(" & ", " ও ")}
                                        <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>{tText("Privacy Policy", "গোপনীয়তা নীতি")}</a>
                                    </span>
                                </label>
                            </div>

                            <button type="submit" className="auth-submit-btn" disabled={submitting}>
                                {submitting ? (
                                    <><i className="fas fa-spinner fa-spin"></i><span>{tText("Creating account...", "অ্যাকাউন্ট তৈরি হচ্ছে...")}</span></>
                                ) : (
                                    <><span>{tText("Create Account", "অ্যাকাউন্ট তৈরি করুন")}</span><i className="fas fa-arrow-right"></i></>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer-text">
                            <span>{tText("Already have an account? ", "ইতিমধ্যে অ্যাকাউন্ট আছে? ")}</span>
                            <Link href="/login">{tText("Login", "লগইন")}</Link>
                        </div>
                    </div>

                    {/* Brand Side */}
                    <div className="auth-brand-side">
                        <div className="auth-brand-content">
                            <h2>{tText("Join Us & Start\nEarning Today", "যোগ দিন এবং আজই\nউপার্জন শুরু করুন")}</h2>
                            <p>{tText("Create your account and begin your secure investment journey with us.", "আপনার অ্যাকাউন্ট তৈরি করুন এবং আমাদের সাথে আপনার নিরাপদ বিনিয়োগ যাত্রা শুরু করুন।")}</p>
                            <ul className="auth-features-list">
                                <li><i className="fas fa-check"></i><span>{tText("Free & Instant Registration", "ফ্রি এবং তাৎক্ষণিক নিবন্ধন")}</span></li>
                                <li><i className="fas fa-gift"></i><span>{tText("Get Referral Commissions", "রেফারেল কমিশন পান")}</span></li>
                                <li><i className="fas fa-wallet"></i><span>{tText("Low minimum limits (৳500)", "কম সর্বনিম্ন সীমা (৳৫০০)")}</span></li>
                                <li><i className="fas fa-shield-alt"></i><span>{tText("Secure bKash/Nagad options", "নিরাপদ বিকাশ/নগদ পেমেন্ট")}</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="page-loader" style={{ display: 'flex' }}>
                <div className="loader-content">
                    <div className="loader-spinner"></div>
                    <span>Loading...</span>
                </div>
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
