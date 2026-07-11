'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
    lang: Language;
    t: (key: string) => string;
    tText: (en: string, bn: string) => string;
    tNum: (val: string | number) => string;
    toggleLang: () => void;
}

const translations: Record<string, { en: string; bn: string }> = {
    // Navigation
    'nav.home': { en: 'Home', bn: 'হোম' },
    'nav.products': { en: 'Products', bn: 'পণ্য' },
    'nav.about': { en: 'About', bn: 'আমাদের সম্পর্কে' },
    'nav.login': { en: 'Login', bn: 'লগইন' },
    'nav.signup': { en: 'Sign Up', bn: 'সাইন আপ' },
    'nav.dashboard': { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
    'nav.logout': { en: 'Logout', bn: 'লগআউট' },
    
    // Common
    'common.submit': { en: 'Submit', bn: 'জমা দিন' },
    'common.cancel': { en: 'Cancel', bn: 'বাতিল' },
    'common.save': { en: 'Save', bn: 'সংরক্ষণ করুন' },
    'common.delete': { en: 'Delete', bn: 'মুছুন' },
    'common.edit': { en: 'Edit', bn: 'সম্পাদনা' },
    'common.view': { en: 'View', bn: 'দেখুন' },
    'common.search': { en: 'Search', bn: 'অনুসন্ধান' },
    'common.filter': { en: 'Filter', bn: 'ফিল্টার' },
    'common.loading': { en: 'Loading...', bn: 'লোড হচ্ছে...' },
    'common.success': { en: 'Success!', bn: 'সফল!' },
    'common.error': { en: 'Error!', bn: 'ত্রুটি!' },
    'common.confirm': { en: 'Confirm', bn: 'নিশ্চিত করুন' },
    'common.back': { en: 'Back', bn: 'পিছনে' },
    'common.next': { en: 'Next', bn: 'পরবর্তী' },
    'common.previous': { en: 'Previous', bn: 'পূর্ববর্তী' },
    
    // Auth
    'auth.email': { en: 'Email', bn: 'ইমেইল' },
    'auth.password': { en: 'Password', bn: 'পাসওয়ার্ড' },
    'auth.confirmPassword': { en: 'Confirm Password', bn: 'পাসওয়ার্ড নিশ্চিত করুন' },
    'auth.fullName': { en: 'Full Name', bn: 'পুরো নাম' },
    'auth.phone': { en: 'Phone Number', bn: 'ফোন নম্বর' },
    'auth.referralCode': { en: 'Referral Code (Optional)', bn: 'রেফারেল কোড (ঐচ্ছিক)' },
    'auth.forgotPassword': { en: 'Forgot Password?', bn: 'পাসওয়ার্ড ভুলে গেছেন?' },
    'auth.noAccount': { en: "Don't have an account?", bn: 'অ্যাকাউন্ট নেই?' },
    'auth.hasAccount': { en: 'Already have an account?', bn: 'ইতিমধ্যে অ্যাকাউন্ট আছে?' },
    
    // Dashboard
    'dashboard.welcome': { en: 'Welcome back', bn: 'স্বাগতম' },
    'dashboard.balance': { en: 'Wallet Balance', bn: 'ওয়ালেট ব্যালেন্স' },
    'dashboard.totalInvested': { en: 'Total Invested', bn: 'মোট বিনিয়োগ' },
    'dashboard.totalProfit': { en: 'Total Profit', bn: 'মোট লাভ' },
    'dashboard.referralEarnings': { en: 'Referral Earnings', bn: 'রেফারেল আয়' },
    
    // Wallet
    'wallet.deposit': { en: 'Deposit', bn: 'জমা' },
    'wallet.withdraw': { en: 'Withdraw', bn: 'উত্তোলন' },
    'wallet.history': { en: 'Transaction History', bn: 'লেনদেনের ইতিহাস' },
    'wallet.amount': { en: 'Amount', bn: 'পরিমাণ' },
    'wallet.transactionId': { en: 'Transaction ID', bn: 'লেনদেন আইডি' },
    'wallet.method': { en: 'Payment Method', bn: 'পেমেন্ট পদ্ধতি' },
    'wallet.pending': { en: 'Pending', bn: 'মুলতুবি' },
    'wallet.approved': { en: 'Approved', bn: 'অনুমোদিত' },
    'wallet.rejected': { en: 'Rejected', bn: 'প্রত্যাখ্যাত' },
    
    // Products
    'products.all': { en: 'All Products', bn: 'সব পণ্য' },
    'products.price': { en: 'Price', bn: 'মূল্য' },
    'products.profit': { en: 'Profit', bn: 'লাভ' },
    'products.duration': { en: 'Duration', bn: 'সময়কাল' },
    'products.stock': { en: 'Stock', bn: 'স্টক' },
    'products.invest': { en: 'Invest Now', bn: 'এখনই বিনিয়োগ করুন' },
    'products.category': { en: 'Category', bn: 'বিভাগ' },
    
    // Investment
    'investment.units': { en: 'Units', bn: 'ইউনিট' },
    'investment.sellMode': { en: 'Sell Mode', bn: 'বিক্রয় মোড' },
    'investment.selfSell': { en: 'Self Sell', bn: 'নিজে বিক্রি' },
    'investment.autoSell': { en: 'Auto Sell', bn: 'স্বয়ংক্রিয় বিক্রি' },
    'investment.myInvestments': { en: 'My Investments', bn: 'আমার বিনিয়োগ' },
    
    // Referral
    'referral.myCode': { en: 'My Referral Code', bn: 'আমার রেফারেল কোড' },
    'referral.share': { en: 'Share Link', bn: 'লিংক শেয়ার করুন' },
    'referral.copied': { en: 'Copied!', bn: 'কপি হয়েছে!' },
    'referral.myReferrals': { en: 'My Referrals', bn: 'আমার রেফারেলস' },
    'referral.earnings': { en: 'Referral Earnings', bn: 'রেফারেল আয়' },
    
    // Profile
    'profile.edit': { en: 'Edit Profile', bn: 'প্রোফাইল সম্পাদনা' },
    'profile.bkash': { en: 'bKash Number', bn: 'বিকাশ নম্বর' },
    'profile.nagad': { en: 'Nagad Number', bn: 'নগদ নম্বর' },
    'profile.avatar': { en: 'Profile Picture', bn: 'প্রোফাইল ছবি' },
    
    // Status messages
    'status.success': { en: 'Operation successful', bn: 'অপারেশন সফল' },
    'status.error': { en: 'Something went wrong', bn: 'কিছু ভুল হয়েছে' },
    'status.loginRequired': { en: 'Please login to continue', bn: 'চালিয়ে যেতে লগইন করুন' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Language>('bn');

    useEffect(() => {
        const saved = localStorage.getItem('language') as Language;
        if (saved && (saved === 'en' || saved === 'bn')) {
            setLang(saved);
        } else {
            localStorage.setItem('language', 'bn');
        }
    }, []);

    const toggleLang = () => {
        const nextLang = lang === 'en' ? 'bn' : 'en';
        setLang(nextLang);
        localStorage.setItem('language', nextLang);
    };

    const t = (key: string): string => {
        const entry = translations[key];
        if (!entry) return key;
        return entry[lang] || entry['en'] || key;
    };

    const tText = (en: string, bn: string): string => {
        return lang === 'en' ? en : bn;
    };

    const tNum = (val: string | number): string => {
        const str = String(val);
        if (lang !== 'bn') return str;
        const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return str.replace(/[0-9]/g, (w) => banglaDigits[+w]);
    };

    return (
        <LanguageContext.Provider value={{ lang, t, tText, tNum, toggleLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
}
