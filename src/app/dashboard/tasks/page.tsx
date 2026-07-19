'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';
import SafeRedirect from '@/lib/safeRedirect';

interface Task {
    id: string;
    title: string;
    description: string;
    category: 'youtube' | 'social' | 'survey' | 'app' | 'referral';
    baseReward: number;
    duration: number;
    url: string;
    active: boolean;
    taskType?: 'mandatory' | 'social' | 'bonus';
    socialAction?: 'view' | 'follow';
    type?: string;
    verification?: 'auto' | 'manual';
}

interface PlanDetails {
    id: string;
    name: string;
    price: number;
    taskLimit: number;
    dailyEarningLimit: number;
    earningsMultiplier: number;
    withdrawalMin: number;
    withdrawalMax: number;
    color: string;
    icon: string;
}

const plans: Record<string, PlanDetails> = {
    free: { id: 'free', name: 'Free Member', price: 0, taskLimit: 5, dailyEarningLimit: 50, earningsMultiplier: 1.0, withdrawalMin: 500, withdrawalMax: 1000, color: '#6b7280', icon: 'fa-user' },
    junior: { id: 'junior', name: 'Junior', price: 500, taskLimit: 15, dailyEarningLimit: 200, earningsMultiplier: 1.2, withdrawalMin: 300, withdrawalMax: 3000, color: '#10b981', icon: 'fa-seedling' },
    assistant: { id: 'assistant', name: 'Assistant', price: 1500, taskLimit: 30, dailyEarningLimit: 500, earningsMultiplier: 1.5, withdrawalMin: 200, withdrawalMax: 5000, color: '#3b82f6', icon: 'fa-user-tie' },
    senior: { id: 'senior', name: 'Senior', price: 3000, taskLimit: 50, dailyEarningLimit: 1000, earningsMultiplier: 2.0, withdrawalMin: 100, withdrawalMax: 10000, color: '#8b5cf6', icon: 'fa-crown' },
    vip: { id: 'vip', name: 'VIP Member', price: 5000, taskLimit: -1, dailyEarningLimit: -1, earningsMultiplier: 3.0, withdrawalMin: 50, withdrawalMax: 50000, color: '#f59e0b', icon: 'fa-gem' }
};

const defaultTasksList: Task[] = [
    // Social tasks
    { id: 't1', title: 'Watch Marketing Video', description: 'Watch this 30s marketing video and learn about products', category: 'youtube', baseReward: 5, duration: 30, url: 'https://youtube.com', active: true, taskType: 'social', socialAction: 'view' },
    { id: 't2', title: 'Subscribe Channel', description: 'Subscribe to our partner channel to receive updates', category: 'youtube', baseReward: 3, duration: 15, url: 'https://youtube.com', active: true, taskType: 'social', socialAction: 'follow' },
    { id: 't3', title: 'Follow Facebook Page', description: 'Follow our Facebook page to qualify for giveaways', category: 'social', baseReward: 3, duration: 15, url: 'https://facebook.com', active: true, taskType: 'social', socialAction: 'follow' },
    { id: 't4', title: 'View Facebook Post', description: 'View and engage with our latest promotional post', category: 'social', baseReward: 5, duration: 20, url: 'https://facebook.com', active: true, taskType: 'social', socialAction: 'view' },
    // Mandatory tasks
    { id: 't5', title: 'Sell Products to Contacts', description: 'Share product catalog with at least 3 contacts and submit proof of sharing', category: 'referral', baseReward: 0, duration: 30, url: '#', active: true, taskType: 'mandatory' },
    { id: 't6', title: 'Invest in Active Package', description: 'Make your monthly investment in an active product package', category: 'app', baseReward: 0, duration: 15, url: '#', active: true, taskType: 'mandatory' },
    // Bonus tasks
    { id: 't7', title: 'Complete Feedback Survey', description: 'Provide your opinion about our dashboard interface', category: 'survey', baseReward: 20, duration: 30, url: 'https://google.com', active: true, taskType: 'bonus' },
    { id: 't8', title: 'Download Utility App', description: 'Download and open our sponsored tools utility app', category: 'app', baseReward: 50, duration: 45, url: 'https://play.google.com', active: true, taskType: 'bonus' },
    { id: 't9', title: 'Join Telegram Community', description: 'Join our Telegram channel for direct tech support', category: 'social', baseReward: 15, duration: 15, url: 'https://telegram.org', active: true, taskType: 'bonus' }
];

export default function ClientTasksPage() {
    const { user, updateUserBalance } = useAuth();
    const { tText, tNum } = useTranslation();
    const { showToast } = useToast();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [completions, setCompletions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'social' | 'mandatory' | 'bonus' | 'history'>('social');

    const [todayEarnings, setTodayEarnings] = useState(0);
    const [todayCompleted, setTodayCompleted] = useState(0);
    const [todaySocialCompleted, setTodaySocialCompleted] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Proof state
    const [proofText, setProofText] = useState('');
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [isSubmittingProof, setIsSubmittingProof] = useState(false);

    // Load settings for configurable rewards
    const settings = typeof window !== 'undefined' ? Storage.get('settings') : null;
    const socialViewReward = settings?.socialViewReward ?? 5;
    const socialFollowReward = settings?.socialFollowReward ?? 3;

    const membershipKey = user?.membership || 'free';
    const socialLimitMap: Record<string, number> = {
        free: settings?.socialLimitFree ?? 3,
        junior: settings?.socialLimitJunior ?? 5,
        assistant: settings?.socialLimitAssistant ?? 8,
        senior: settings?.socialLimitSenior ?? 12,
        vip: settings?.socialLimitVip ?? -1,
    };
    const socialDailyLimit = socialLimitMap[membershipKey] ?? 3;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 800;
                let w = img.width, h = img.height;
                if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, w, h);
                setProofImage(canvas.toDataURL('image/jpeg', 0.5));
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        let allTasks = Storage.get('workTasks');
        if (!allTasks || !Array.isArray(allTasks) || allTasks.length === 0) {
            allTasks = defaultTasksList;
            Storage.set('workTasks', allTasks);
        }
        setTasks(allTasks);
        loadTodayCompletions();
    }, [user]);

    useEffect(() => {
        if (modalOpen && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [modalOpen, timeLeft]);

    const activePlan = plans[membershipKey] || plans.free;

    const loadTodayCompletions = () => {
        if (!user) return;
        const allCompletions = Storage.get('taskCompletions') || [];
        const todayStr = new Date().toDateString();
        const userCompletions = allCompletions.filter((c: any) =>
            c.userId === user.email && new Date(c.timestamp).toDateString() === todayStr
        );
        setCompletions(allCompletions);
        setTodayCompleted(userCompletions.length);
        const earnings = userCompletions.reduce((sum: number, c: any) => sum + (c.pointsAwarded || 0), 0);
        setTodayEarnings(earnings);

        // Count social completions today
        const socialCount = userCompletions.filter((c: any) => c.taskType === 'social').length;
        setTodaySocialCompleted(socialCount);
    };

    const getTaskReward = (task: Task): number => {
        if (task.taskType === 'social') {
            const base = task.socialAction === 'follow' ? socialFollowReward : socialViewReward;
            return Math.round(base * activePlan.earningsMultiplier);
        }
        if (task.taskType === 'mandatory') return 0;
        return Math.round(task.baseReward * activePlan.earningsMultiplier);
    };

    const handleStartTask = (task: Task) => {
        if (!user) return;

        // Check general plan limits
        if (activePlan.taskLimit !== -1 && todayCompleted >= activePlan.taskLimit) {
            showToast(tText('Daily task limit reached! Upgrade your membership.', 'দৈনিক কাজের সীমা শেষ! আপনার মেম্বারশিপ আপগ্রেড করুন।'), 'error');
            return;
        }

        // Check social-specific limit
        if (task.taskType === 'social' && socialDailyLimit !== -1 && todaySocialCompleted >= socialDailyLimit) {
            showToast(tText(`Social task limit reached! (${socialDailyLimit} tasks/day for ${activePlan.name}). Upgrade for more!`, `সোশ্যাল টাস্কের সীমা শেষ! (${socialDailyLimit} টাস্ক/দিন ${activePlan.name}-এর জন্য)। আরও পেতে আপগ্রেড করুন!`), 'error');
            return;
        }

        // Check mandatory — must be a membership holder
        if (task.taskType === 'mandatory' && membershipKey === 'free') {
            showToast(tText('This task requires a membership. Please purchase a package first.', 'এই কাজটির জন্য মেম্বারশিপ প্রয়োজন। প্রথমে একটি প্যাকেজ কিনুন।'), 'error');
            return;
        }

        if (activePlan.dailyEarningLimit !== -1 && todayEarnings >= activePlan.dailyEarningLimit) {
            showToast(tText('Daily earning limit reached! Upgrade for higher caps.', 'দৈনিক উপার্জনের সীমা শেষ! আপগ্রেড করুন।'), 'error');
            return;
        }

        setActiveTask(task);
        setTimeLeft(task.duration);
        setModalOpen(true);
    };

    const handleOpenTaskLink = () => {
        if (!activeTask) return;
        if (activeTask.url && activeTask.url !== '#') {
            // Use safe redirect for social tasks to prevent referrer detection
            if (activeTask.taskType === 'social') {
                SafeRedirect.open(activeTask.url);
            } else {
                window.open(activeTask.url, '_blank', 'noopener,noreferrer');
            }
        }
    };

    const handleCloseModal = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setModalOpen(false);
        setActiveTask(null);
        setProofText('');
        setProofImage(null);
        setIsSubmittingProof(false);
    };

    const handleCompleteTask = async () => {
        if (!user || !activeTask) return;

        const isAuto = activeTask.verification === 'auto' || !activeTask.verification;

        if (!isAuto && !proofImage && !proofText) {
            showToast(tText("Please provide a screenshot or text proof", "অনুগ্রহ করে একটি স্ক্রিনশট বা টেক্সট প্রমাণ দিন"), "error");
            return;
        }

        setIsSubmittingProof(true);
        const reward = getTaskReward(activeTask);

        try {
            if (isAuto && reward > 0) {
                const balanceUpdated = await updateUserBalance(reward, 'add');
                if (!balanceUpdated) {
                    showToast('Failed to update wallet rewards', 'error');
                    setIsSubmittingProof(false);
                    return;
                }

                const users = Storage.get('users') || [];
                const idx = users.findIndex((u: any) => u.id === user.id);
                if (idx !== -1) {
                    users[idx].balance = user.balance + reward;
                    Storage.set('users', users);
                    Storage.set('currentUser', users[idx]);
                }
            }

            const allCompletions = Storage.get('taskCompletions') || [];
            allCompletions.push({
                id: Date.now().toString(),
                taskId: activeTask.id,
                taskTitle: activeTask.title,
                userId: user.email,
                pointsAwarded: reward,
                taskType: activeTask.taskType || 'bonus',
                socialAction: activeTask.socialAction,
                status: isAuto ? 'approved' : 'pending',
                proofText: proofText,
                proofImage: proofImage,
                timestamp: new Date().toISOString()
            });
            Storage.set('taskCompletions', allCompletions);

            if (isAuto && reward > 0) {
                const allTx = Storage.get('transactions') || [];
                allTx.unshift({
                    id: db.generateId(),
                    userId: user.id,
                    type: 'task_earning',
                    amount: reward,
                    status: 'completed',
                    description: `Earned from ${activeTask.taskType} task: ${activeTask.title}`,
                    createdAt: new Date().toISOString()
                });
                Storage.set('transactions', allTx);
            }

            if (isAuto) {
                if (reward > 0) {
                    showToast(tText(`Task completed! Earned ৳${reward}`, `কাজ সম্পন্ন হয়েছে! ৳${reward} অর্জিত হয়েছে`), 'success');
                } else {
                    showToast(tText('Mandatory task marked as completed!', 'বাধ্যতামূলক কাজ সম্পন্ন হয়েছে!'), 'success');
                }
            } else {
                showToast(tText('Proof submitted! Waiting for admin approval.', 'প্রমাণ জমা দেওয়া হয়েছে! অ্যাডমিন অনুমোদনের অপেক্ষায়।'), 'success');
            }
            
            handleCloseModal();
            loadTodayCompletions();
        } catch (err) {
            showToast('Failed to process task', 'error');
        } finally {
            setIsSubmittingProof(false);
        }
    };

    const checkTaskCompleted = (taskId: string) => {
        const todayStr = new Date().toDateString();
        return completions.some(
            (c: any) => c.taskId === taskId && c.userId === user?.email && new Date(c.timestamp).toDateString() === todayStr
        );
    };

    // Filter tasks by tab
    const getFilteredTasks = () => {
        return tasks.filter(t => {
            if (!t.active) return false;
            const type = t.taskType || 'bonus';
            return type === activeTab;
        });
    };

    const filteredTasks = getFilteredTasks();
    const mandatoryCount = tasks.filter(t => t.active && (t.taskType === 'mandatory')).length;
    const socialCount = tasks.filter(t => t.active && (t.taskType === 'social')).length;
    const bonusCount = tasks.filter(t => t.active && (t.taskType === 'bonus' || !t.taskType)).length;

    const socialRemaining = socialDailyLimit === -1 ? '∞' : Math.max(0, socialDailyLimit - todaySocialCompleted).toString();
    const taskLimitStr = activePlan.taskLimit === -1 ? '∞' : activePlan.taskLimit.toString();
    const progressPercent = activePlan.taskLimit === -1 ? 0 : Math.min(100, (todayCompleted / activePlan.taskLimit) * 100);

    const getCategoryDetails = (cat: string) => {
        const categories: Record<string, { name: string; icon: string; color: string }> = {
            youtube: { name: 'YouTube', icon: 'fab fa-youtube', color: '#EF4444' },
            social: { name: 'Social Media', icon: 'fas fa-share-alt', color: '#2563EB' },
            survey: { name: 'Survey', icon: 'fas fa-poll', color: '#10B981' },
            app: { name: 'App Downloads', icon: 'fas fa-mobile-alt', color: '#4F46E5' },
            referral: { name: 'Referral', icon: 'fas fa-users', color: '#8B5CF6' }
        };
        return categories[cat] || { name: 'General', icon: 'fas fa-tasks', color: '#64748B' };
    };

    const getTaskTypeBadge = (task: Task) => {
        if (task.taskType === 'mandatory') return { label: 'Required', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
        if (task.taskType === 'social') {
            if (task.socialAction === 'view') return { label: `View — ৳${socialViewReward}`, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' };
            return { label: `Follow — ৳${socialFollowReward}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' };
        }
        return { label: 'Bonus', color: '#10b981', bg: 'rgba(16,185,129,0.08)' };
    };

    return (
        <div className="fintech-tasks-view">
            <style jsx global>{`
                .fintech-tasks-view {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .task-type-tabs {
                    display: flex;
                    gap: 8px;
                    background: var(--bg-card);
                    padding: 6px;
                    border-radius: 14px;
                    border: 1px solid var(--border-color);
                }
                .task-type-tab {
                    flex: 1;
                    padding: 12px 16px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    font-size: 13px;
                    font-weight: 600;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .task-type-tab:hover {
                    color: var(--text-primary);
                    background: rgba(255,255,255,0.03);
                }
                .task-type-tab.active {
                    background: var(--primary-color);
                    color: white;
                    box-shadow: 0 4px 12px rgba(23, 133, 130, 0.25);
                }
                .task-type-tab .tab-count {
                    background: rgba(255,255,255,0.15);
                    padding: 2px 8px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                }
                .task-type-tab:not(.active) .tab-count {
                    background: rgba(255,255,255,0.05);
                }
                .duo-tasks-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .duo-task-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 20px 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .duo-task-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                }
                .duo-task-card.completed-state {
                    border-color: rgba(16, 185, 129, 0.2);
                    background: rgba(16, 185, 129, 0.01);
                }
                .duo-task-card.completed-state .duo-icon-box {
                    filter: grayscale(0.5);
                    opacity: 0.7;
                }
                .duo-icon-box {
                    width: 50px;
                    height: 50px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 18px;
                    flex-shrink: 0;
                }
                .duo-info-box {
                    flex: 1;
                    min-width: 0;
                }
                .duo-info-box h4 {
                    margin: 0 0 4px;
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .duo-info-box p {
                    margin: 0;
                    font-size: 12px;
                    color: var(--text-secondary);
                    line-height: 1.4;
                }
                .duo-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 6px;
                    flex-wrap: wrap;
                }
                .task-type-badge {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 3px 10px;
                    border-radius: 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
                .duo-time-meta {
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .duo-reward-box {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 6px;
                    flex-shrink: 0;
                }
                .duo-reward-badge {
                    background: rgba(16, 185, 129, 0.08);
                    color: #10B981;
                    font-size: 16px;
                    font-weight: 800;
                    padding: 6px 14px;
                    border-radius: 20px;
                }
                .duo-reward-badge.mandatory {
                    background: rgba(239, 68, 68, 0.08);
                    color: #ef4444;
                    font-size: 11px;
                    font-weight: 600;
                }
                .duo-action-button {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    height: 38px;
                    padding: 0 16px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    white-space: nowrap;
                }
                .duo-action-button.start {
                    background: var(--primary-color);
                    color: white;
                }
                .duo-action-button.start:hover {
                    background: var(--primary-dark);
                    transform: scale(1.03);
                }
                .duo-action-button.completed {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10B981;
                    cursor: default;
                }
                .social-limit-banner {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 20px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 500;
                }
                @media (max-width: 768px) {
                    .duo-task-card {
                        flex-wrap: wrap;
                        padding: 16px;
                    }
                    .duo-reward-box {
                        width: 100%;
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 8px;
                        padding-top: 12px;
                        border-top: 1px solid var(--border-color);
                    }
                    .task-type-tabs {
                        flex-direction: column;
                    }
                }
            `}</style>

            <div className="page-header">
                <h1>{tText("Earning Tasks", "উপার্জন মূলক কাজ")}</h1>
                <p>{tText("Complete tasks to earn rewards — social, mandatory, and bonus", "রিওয়ার্ড অর্জনের জন্য কাজ সম্পন্ন করুন — সোশ্যাল, বাধ্যতামূলক এবং বোনাস")}</p>
            </div>

            {/* Stats cards */}
            <div className="fintech-stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper income"><i className="fas fa-coins"></i></div>
                        <span className="stat-card-title">{tText("Today's Earnings", "আজকের আয়")}</span>
                    </div>
                    <h3 className="stat-card-value">৳{tNum(todayEarnings.toLocaleString())}</h3>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper pending"><i className="fas fa-check-circle"></i></div>
                        <span className="stat-card-title">{tText("Tasks Done", "সম্পন্ন কাজ")}</span>
                    </div>
                    <h3 className="stat-card-value">{tNum(todayCompleted)} / {taskLimitStr}</h3>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper investments"><i className="fas fa-share-alt"></i></div>
                        <span className="stat-card-title">{tText("Social Tasks", "সোশ্যাল কাজ")}</span>
                    </div>
                    <h3 className="stat-card-value">{tNum(todaySocialCompleted)} / {socialDailyLimit === -1 ? '∞' : socialDailyLimit}</h3>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon-wrapper referrals"><i className="fas fa-star"></i></div>
                        <span className="stat-card-title">{tText("Multiplier", "গুণক")}</span>
                    </div>
                    <h3 className="stat-card-value">{tNum(activePlan.earningsMultiplier)}x</h3>
                </div>
            </div>

            {/* Progress bar */}
            <div className="tab-content-card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', fontWeight: 600 }}>
                    <span>{tText("Daily Task Progress", "দৈনিক কাজের অগ্রগতি")}</span>
                    <span>{todayCompleted} / {taskLimitStr}</span>
                </div>
                <div className="progress-bar-container" style={{ height: '8px' }}>
                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>

            {/* 3-Tab Navigation */}
            <div className="task-type-tabs">
                <button className={`task-type-tab ${activeTab === 'social' ? 'active' : ''}`} onClick={() => setActiveTab('social')}>
                    <i className="fas fa-share-alt"></i>
                    <span>{tText("Social Tasks", "সোশ্যাল কাজ")}</span>
                    <span className="tab-count">{socialCount}</span>
                </button>
                <button className={`task-type-tab ${activeTab === 'mandatory' ? 'active' : ''}`} onClick={() => setActiveTab('mandatory')}>
                    <i className="fas fa-lock"></i>
                    <span>{tText("Mandatory", "বাধ্যতামূলক")}</span>
                    <span className="tab-count">{mandatoryCount}</span>
                </button>
                <button className={`task-type-tab ${activeTab === 'bonus' ? 'active' : ''}`} onClick={() => setActiveTab('bonus')}>
                    <i className="fas fa-gift"></i>
                    <span>{tText("Bonus", "বোনাস")}</span>
                    <span className="tab-count">{bonusCount}</span>
                </button>
                <button className={`task-type-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                    <i className="fas fa-history"></i>
                    <span>{tText("History", "হিস্টোরি")}</span>
                    <span className="tab-count">{completions.length}</span>
                </button>
            </div>

            {/* Tab-specific info banners */}
            {activeTab === 'social' && (
                <div className="social-limit-banner" style={{ background: 'rgba(37, 99, 235, 0.06)', border: '1px solid rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
                    <i className="fas fa-info-circle"></i>
                    <span>
                        {tText(
                            `Social task limit: ${socialRemaining} remaining today (${activePlan.name}). View = ৳${socialViewReward}, Follow = ৳${socialFollowReward}`,
                            `সোশ্যাল কাজের সীমা: আজ ${socialRemaining} বাকি (${activePlan.name})। ভিউ = ৳${socialViewReward}, ফলো = ৳${socialFollowReward}`
                        )}
                    </span>
                </div>
            )}
            {activeTab === 'mandatory' && (
                <div className="social-limit-banner" style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>
                        {membershipKey === 'free'
                            ? tText('Mandatory tasks require a paid membership. Upgrade to access.', 'বাধ্যতামূলক কাজের জন্য পেইড মেম্বারশিপ প্রয়োজন।')
                            : tText('These tasks are required for your membership. Complete them to maintain your benefits.', 'এই কাজগুলো আপনার মেম্বারশিপের জন্য আবশ্যক।')
                        }
                    </span>
                </div>
            )}
            {activeTab === 'bonus' && (
                <div className="social-limit-banner" style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                    <i className="fas fa-gift"></i>
                    <span>{tText('Bonus tasks have custom rewards. Complete them for extra earnings!', 'বোনাস কাজে কাস্টম রিওয়ার্ড আছে। অতিরিক্ত আয়ের জন্য সম্পন্ন করুন!')}</span>
                </div>
            )}

            {/* Upgrade banner */}
            {user?.membership !== 'vip' && activeTab === 'social' && (
                <div className="premium-banner" style={{ background: '#0F172A' }}>
                    <div className="banner-visual-circles">
                        <div className="circle-1"></div>
                        <div className="circle-2"></div>
                    </div>
                    <div className="banner-icon-box"><i className="fas fa-crown"></i></div>
                    <div className="banner-info-box">
                        <h4>{tText("Upgrade for More Social Tasks!", "আরও সোশ্যাল কাজের জন্য আপগ্রেড করুন!")}</h4>
                        <p>{tText(`Your ${activePlan.name} plan allows ${socialDailyLimit === -1 ? 'unlimited' : socialDailyLimit} social tasks/day. Upgrade for more!`, `আপনার ${activePlan.name} প্ল্যানে ${socialDailyLimit === -1 ? 'আনলিমিটেড' : socialDailyLimit} সোশ্যাল কাজ/দিন আছে।`)}</p>
                    </div>
                    <Link href="/dashboard/membership" className="banner-cta-button">{tText("Upgrade", "আপগ্রেড")}</Link>
                </div>
            )}

            {/* Tasks list */}
            <div className="duo-tasks-container">
                {activeTab === 'history' ? (
                    completions.length === 0 ? (
                        <div className="tab-content-card" style={{ textAlign: 'center', padding: '48px' }}>
                            <i className="fas fa-history" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}></i>
                            <h3>{tText("No history yet", "এখনও কোন ইতিহাস নেই")}</h3>
                            <p>{tText("Complete some tasks to see them here", "এখানে দেখতে কিছু কাজ সম্পন্ন করুন")}</p>
                        </div>
                    ) : (
                        completions.map((comp: any) => (
                            <div key={comp.id} className="duo-task-card">
                                <div className="duo-icon-box" style={{ background: comp.status === 'approved' ? '#10B981' : comp.status === 'rejected' ? '#EF4444' : '#F59E0B' }}>
                                    <i className={comp.status === 'approved' ? "fas fa-check" : comp.status === 'rejected' ? "fas fa-times" : "fas fa-clock"}></i>
                                </div>
                                <div className="duo-info-box">
                                    <h4>{comp.taskTitle || 'Task'}</h4>
                                    <p>{new Date(comp.timestamp).toLocaleString()}</p>
                                    <div className="duo-meta-row">
                                        <span className="task-type-badge" style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                            {comp.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="duo-reward-box">
                                    <span className="duo-reward-badge" style={{ opacity: comp.status === 'rejected' ? 0.5 : 1 }}>
                                        ৳{tNum(comp.pointsAwarded || 0)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )
                ) : filteredTasks.length === 0 ? (
                    <div className="tab-content-card" style={{ textAlign: 'center', padding: '48px' }}>
                        <i className="fas fa-clipboard-check" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}></i>
                        <h3>{tText("No tasks available", "কোন কাজ উপলব্ধ নেই")}</h3>
                        <p>{tText("Check back later for new tasks", "নতুন কাজের জন্য পরে আবার দেখুন")}</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => {
                        const isCompleted = checkTaskCompleted(task.id);
                        const category = getCategoryDetails(task.category);
                        const reward = getTaskReward(task);
                        const badge = getTaskTypeBadge(task);

                        return (
                            <div key={task.id} className={`duo-task-card ${isCompleted ? 'completed-state' : ''}`}>
                                <div className="duo-icon-box" style={{ background: category.color }}>
                                    <i className={category.icon}></i>
                                </div>
                                <div className="duo-info-box">
                                    <h4>{task.title}</h4>
                                    <p>{task.description}</p>
                                    <div className="duo-meta-row">
                                        <span className="task-type-badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                                        <span className="duo-time-meta">
                                            <i className="fas fa-clock" style={{ marginRight: '3px' }}></i>{tNum(task.duration)}s
                                        </span>
                                    </div>
                                </div>
                                <div className="duo-reward-box">
                                    {task.taskType === 'mandatory' ? (
                                        <span className="duo-reward-badge mandatory">Required</span>
                                    ) : (
                                        <span className="duo-reward-badge">৳{tNum(reward)}</span>
                                    )}
                                    {isCompleted ? (
                                        <button className="duo-action-button completed">
                                            <i className="fas fa-check-circle"></i><span>Done</span>
                                        </button>
                                    ) : (
                                        <button className="duo-action-button start" onClick={() => handleStartTask(task)}>
                                            <i className="fas fa-play"></i><span>Start</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Timer modal */}
            {modalOpen && activeTask && (
                <div className="form-modal active" id="timerModal">
                    <div className="form-modal-content">
                        <div className="form-modal-header">
                            <h3>{activeTask.title}</h3>
                            <button className="form-modal-close" onClick={handleCloseModal}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="form-modal-body">
                            <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', textAlign: 'center', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: getCategoryDetails(activeTask.category).color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '22px' }}>
                                    <i className={getCategoryDetails(activeTask.category).icon}></i>
                                </div>
                                <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700 }}>{activeTask.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px' }}>{activeTask.description}</p>
                                
                                {activeTask.taskType === 'social' && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(37,99,235,0.08)', color: '#2563eb', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                                        <i className="fas fa-shield-alt"></i>
                                        <span>Safe redirect — referrer protection active</span>
                                    </div>
                                )}

                                {activeTask.url && activeTask.url !== '#' && (
                                    <button
                                        type="button"
                                        onClick={handleOpenTaskLink}
                                        className="btn btn-primary"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '44px', borderRadius: '12px', padding: '0 20px', fontWeight: 600 }}
                                    >
                                        <i className="fas fa-external-link-alt"></i>
                                        <span>{tText("Open Task Link", "কাজের লিংক খুলুন")}</span>
                                    </button>
                                )}
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700 }}>
                                    <i className="fas fa-list-ol" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i> Instructions
                                </h4>
                                <ol style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                                    <li>Click &quot;Open Task Link&quot; to load the target page.</li>
                                    <li>Complete the required action ({activeTask.socialAction === 'follow' ? 'follow/subscribe' : activeTask.socialAction === 'view' ? 'watch/view' : 'complete task'}).</li>
                                    <li>Wait for the countdown timer to finish.</li>
                                    <li>Click &quot;Complete Task&quot; to claim your reward.</li>
                                </ol>
                            </div>

                            <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Time remaining</p>
                                <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary-color)', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                                    {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </div>
                            </div>

                            {timeLeft <= 0 && activeTask.verification !== 'auto' && (
                                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700 }}>Submit Proof</h4>
                                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Please provide proof that you completed the task.</p>
                                    
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Screenshot (Required)</label>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '10px', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }} />
                                        {proofImage && <div style={{ marginTop: '10px', textAlign: 'center' }}><img src={proofImage} style={{ maxHeight: '100px', borderRadius: '8px', border: '1px solid var(--border-color)' }} alt="Proof preview" /></div>}
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Username / Details (Optional)</label>
                                        <input type="text" value={proofText} onChange={(e) => setProofText(e.target.value)} placeholder="e.g. Your YouTube username" style={{ width: '100%', padding: '12px', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '14px' }} />
                                    </div>
                                </div>
                            )}

                            <button
                                className="complete-task-btn"
                                disabled={timeLeft > 0 || isSubmittingProof}
                                onClick={handleCompleteTask}
                                style={{ height: '48px', borderRadius: '14px' }}
                            >
                                {isSubmittingProof ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        <span>Submitting...</span>
                                    </span>
                                ) : timeLeft > 0 ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <i className="fas fa-hourglass-half"></i>
                                        <span>Wait for timer...</span>
                                    </span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <i className={activeTask.verification === 'auto' ? "fas fa-check-circle" : "fas fa-paper-plane"}></i>
                                        <span>{activeTask.verification === 'auto' ? (getTaskReward(activeTask) > 0 ? `Complete Task — Earn ৳${getTaskReward(activeTask)}` : 'Mark as Complete') : 'Submit Proof'}</span>
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
