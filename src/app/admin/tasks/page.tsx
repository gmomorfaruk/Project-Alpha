'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import db from '@/lib/database';

interface Task {
    id: string;
    title: string;
    description: string;
    category: 'youtube' | 'social' | 'survey' | 'app' | 'referral';
    baseReward: number;
    duration: number; // in seconds
    url: string;
    active: boolean;
    type?: string;
    taskType?: 'mandatory' | 'social' | 'bonus';
    socialAction?: 'view' | 'follow';
    dailyLimit?: number;
    totalLimit?: number;
    visibility?: 'everyone' | 'users' | 'premium' | 'new';
    verification?: 'auto' | 'manual' | 'screenshot';
    proofInstructions?: string;
    featured?: boolean;
    verified?: boolean;
}

export default function AdminTasksPage() {
    const { showToast } = useToast();

    // Data states
    const [tasks, setTasks] = useState<Task[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<string>('youtube');
    const [filterStatus, setFilterStatus] = useState('all');

    // Stats
    const [youtubeCount, setYoutubeCount] = useState(0);
    const [socialCount, setSocialCount] = useState(0);
    const [surveyCount, setSurveyCount] = useState(0);
    const [totalRewardGranted, setTotalRewardGranted] = useState(0);

    // Modal state
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Form inputs state
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskCategory, setTaskCategory] = useState<'youtube' | 'social' | 'survey' | 'app' | 'referral'>('youtube');
    const [taskType, setTaskType] = useState('watch');
    const [taskUrl, setTaskUrl] = useState('');
    const [taskReward, setTaskReward] = useState('');
    const [taskDuration, setTaskDuration] = useState('30');
    const [taskDailyLimit, setTaskDailyLimit] = useState('1');
    const [taskTotalLimit, setTaskTotalLimit] = useState('0');
    const [taskVisibility, setTaskVisibility] = useState<'everyone' | 'users' | 'premium' | 'new'>('everyone');
    const [taskVerification, setTaskVerification] = useState<'auto' | 'manual' | 'screenshot'>('auto');
    const [taskProofInstructions, setTaskProofInstructions] = useState('');
    const [taskActive, setTaskActive] = useState(true);
    const [taskFeatured, setTaskFeatured] = useState(false);
    const [taskVerified, setTaskVerified] = useState(false);
    const [taskTaskType, setTaskTaskType] = useState<'mandatory' | 'social' | 'bonus'>('social');
    const [taskSocialAction, setTaskSocialAction] = useState<'view' | 'follow'>('view');

    useEffect(() => {
        loadTasksData();
    }, []);

    const loadTasksData = () => {
        const allTasks: Task[] = Storage.get('workTasks') || [];
        setTasks(allTasks);

        setYoutubeCount(allTasks.filter(t => t.category === 'youtube').length);
        setSocialCount(allTasks.filter(t => t.category === 'social').length);
        setSurveyCount(allTasks.filter(t => t.category === 'survey').length);

        // Sum points awarded
        const completions = Storage.get('taskCompletions') || [];
        const rewardSum = completions.reduce((sum: number, c: any) => sum + (c.pointsAwarded || 0), 0);
        setTotalRewardGranted(rewardSum);
    };

    const handleOpenAddModal = () => {
        setSelectedTask(null);
        setTaskTitle('');
        setTaskDescription('');
        setTaskCategory('youtube');
        setTaskType('watch');
        setTaskUrl('');
        setTaskReward('');
        setTaskDuration('30');
        setTaskDailyLimit('1');
        setTaskTotalLimit('0');
        setTaskVisibility('everyone');
        setTaskVerification('auto');
        setTaskProofInstructions('');
        setTaskActive(true);
        setTaskFeatured(false);
        setTaskVerified(false);
        setTaskTaskType('social');
        setTaskSocialAction('view');
        setModalOpen(true);
    };

    const handleOpenEditModal = (t: Task) => {
        setSelectedTask(t);
        setTaskTitle(t.title);
        setTaskDescription(t.description || '');
        setTaskCategory(t.category);
        setTaskType(t.type || 'watch');
        setTaskUrl(t.url);
        setTaskReward(t.baseReward.toString());
        setTaskDuration(t.duration.toString());
        setTaskDailyLimit((t.dailyLimit ?? 1).toString());
        setTaskTotalLimit((t.totalLimit ?? 0).toString());
        setTaskVisibility(t.visibility || 'everyone');
        setTaskVerification(t.verification || 'auto');
        setTaskProofInstructions(t.proofInstructions || '');
        setTaskActive(t.active !== false);
        setTaskFeatured(t.featured ?? false);
        setTaskVerified(t.verified ?? false);
        setTaskTaskType(t.taskType || 'social');
        setTaskSocialAction(t.socialAction || 'view');
        setModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!taskTitle.trim() || !taskUrl.trim() || !taskReward.trim() || !taskDuration.trim()) {
            showToast('Please fill all required inputs', 'error');
            return;
        }

        try {
            const allTasks: Task[] = Storage.get('workTasks') || [];

            if (selectedTask) {
                const idx = allTasks.findIndex(t => t.id === selectedTask.id);
                if (idx !== -1) {
                    allTasks[idx] = {
                        ...allTasks[idx],
                        title: taskTitle.trim(),
                        description: taskDescription.trim(),
                        category: taskCategory,
                        type: taskType,
                        url: taskUrl.trim(),
                        baseReward: Number(taskReward),
                        duration: Number(taskDuration),
                        dailyLimit: Number(taskDailyLimit),
                        totalLimit: Number(taskTotalLimit),
                        visibility: taskVisibility,
                        verification: taskVerification,
                        proofInstructions: taskProofInstructions.trim(),
                        active: taskActive,
                        featured: taskFeatured,
                        verified: taskVerified,
                        taskType: taskTaskType,
                        socialAction: taskTaskType === 'social' ? taskSocialAction : undefined
                    };
                    showToast('Task updated successfully!', 'success');
                }
            } else {
                const newTask: Task = {
                    id: db.generateId(),
                    title: taskTitle.trim(),
                    description: taskDescription.trim(),
                    category: taskCategory,
                    type: taskType,
                    url: taskUrl.trim(),
                    baseReward: Number(taskReward),
                    duration: Number(taskDuration),
                    dailyLimit: Number(taskDailyLimit),
                    totalLimit: Number(taskTotalLimit),
                    visibility: taskVisibility,
                    verification: taskVerification,
                    proofInstructions: taskProofInstructions.trim(),
                    active: taskActive,
                    featured: taskFeatured,
                    verified: taskVerified,
                    taskType: taskTaskType,
                    socialAction: taskTaskType === 'social' ? taskSocialAction : undefined
                };
                allTasks.push(newTask);
                showToast('New task created successfully!', 'success');
            }

            Storage.set('workTasks', allTasks);
            setModalOpen(false);
            loadTasksData();
        } catch (err) {
            showToast('Failed to save task details', 'error');
        }
    };

    const handleDelete = () => {
        if (!selectedTask) return;

        try {
            const allTasks: Task[] = Storage.get('workTasks') || [];
            const updated = allTasks.filter(t => t.id !== selectedTask.id);
            Storage.set('workTasks', updated);

            showToast('Task deleted permanently!', 'success');
            setDeleteOpen(false);
            loadTasksData();
        } catch (err) {
            showToast('Failed to delete task', 'error');
        }
    };

    const handleToggleActive = (t: Task) => {
        try {
            const allTasks: Task[] = Storage.get('workTasks') || [];
            const idx = allTasks.findIndex(item => item.id === t.id);
            if (idx !== -1) {
                allTasks[idx].active = !t.active;
                Storage.set('workTasks', allTasks);
                showToast(`Task visibility status updated!`, 'success');
                loadTasksData();
            }
        } catch (err) {
            showToast('Failed to update task status', 'error');
        }
    };

    // Filters
    const filteredTasks = tasks.filter((t) => {
        const matchesQuery = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || t.category === activeTab;
        
        let matchesStatus = true;
        if (filterStatus === 'active') matchesStatus = t.active !== false;
        if (filterStatus === 'inactive') matchesStatus = t.active === false;

        return matchesQuery && matchesTab && matchesStatus;
    });

    const completions = Storage.get('taskCompletions') || [];
    const getCompletionCount = (taskId: string) => {
        return completions.filter((c: any) => c.taskId === taskId).length;
    };

    return (
        <div>
            <div className="page-header">
                <h1>Task Management</h1>
                <p>Configure client-side tasks rewards, verification timers and visible segments</p>
            </div>

            {/* Stats Deck */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fab fa-youtube"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{youtubeCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>YouTube Tasks</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-share-alt"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{socialCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Social Tasks</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-poll"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{surveyCount}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Survey Tasks</p>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                    <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}><i className="fas fa-wallet"></i></div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>৳{totalRewardGranted.toLocaleString()}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>Total Rewards Disbursed</p>
                </div>
            </div>

            {/* Tabs selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {['youtube', 'social', 'survey', 'app', 'all'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {tab} Tasks
                    </button>
                ))}
            </div>

            {/* List Table */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', padding: '25px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <div className="search-box" style={{ maxWidth: '300px', width: '100%', position: 'relative', flexShrink: 0 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search tasks..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ padding: '10px 12px 10px 45px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                        <button className="btn btn-primary" onClick={handleOpenAddModal}>
                            <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Add Task
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '12px 8px' }}>Task Title</th>
                                <th>Category</th>
                                <th>Reward Points</th>
                                <th>Verification Timer</th>
                                <th>Completions</th>
                                <th>Visibility Segment</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                                        <i className="fas fa-tasks" style={{ fontSize: '40px', color: 'var(--text-secondary)', marginBottom: '10px' }}></i>
                                        <p style={{ color: 'var(--text-secondary)' }}>No work tasks defined</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((t) => {
                                    const isYoutube = t.category === 'youtube';
                                    const isSocial = t.category === 'social';
                                    const color = isYoutube ? '#ef4444' : isSocial ? '#3b82f6' : '#10b981';

                                    return (
                                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px 8px', color: 'white', fontWeight: 600 }}>{t.title}</td>
                                            <td><span className="badge" style={{ background: `${color}20`, color: color, textTransform: 'uppercase', fontSize: '9px' }}>{t.category}</span></td>
                                            <td><strong style={{ color: '#fbbf24' }}>৳{(t.baseReward || 0).toLocaleString()}</strong></td>
                                            <td>{t.duration}s</td>
                                            <td><strong>{getCompletionCount(t.id)}</strong> completed</td>
                                            <td><span className="badge badge-secondary">{t.visibility || 'everyone'}</span></td>
                                            <td>
                                                <span 
                                                    onClick={() => handleToggleActive(t)}
                                                    className={`badge ${t.active !== false ? 'badge-success' : 'badge-danger'}`}
                                                    style={{ cursor: 'pointer' }}
                                                    title="Click to toggle status"
                                                >
                                                    {t.active !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button 
                                                        className="btn btn-sm btn-outline" 
                                                        onClick={() => handleOpenEditModal(t)}
                                                        style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline" 
                                                        onClick={() => { setSelectedTask(t); setDeleteOpen(true); }}
                                                        style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Add/Edit Task */}
            {modalOpen && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '600px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{selectedTask ? 'Edit Task Details' : 'Add New Task'}</h3>
                            <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="modal-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="taskTitleInput">Task Title *</label>
                                    <input type="text" id="taskTitleInput" required value={taskTitle} onChange={e => setTaskTitle(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="taskDescriptionTextarea">Description Details</label>
                                    <textarea id="taskDescriptionTextarea" rows={2} value={taskDescription} onChange={e => setTaskDescription(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                {/* Task Type Selector */}
                                <div style={{ display: 'grid', gridTemplateColumns: taskTaskType === 'social' ? '1fr 1fr' : '1fr', gap: '15px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label htmlFor="taskTaskTypeSelect" style={{ fontWeight: 600 }}>Task Type *</label>
                                        <select id="taskTaskTypeSelect" value={taskTaskType} onChange={e => setTaskTaskType(e.target.value as any)} style={{ width: '100%', padding: '10px', border: '2px solid var(--primary-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white', fontWeight: 600 }}>
                                            <option value="mandatory">🔒 Mandatory (Membership Required)</option>
                                            <option value="social">📱 Social Media Task</option>
                                            <option value="bonus">🎁 Bonus Task</option>
                                        </select>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                            {taskTaskType === 'mandatory' ? 'Required tasks for membership holders (selling, investing)' : taskTaskType === 'social' ? 'FB/YT views & follows — reward set by settings' : 'Optional extra tasks — custom reward per task'}
                                        </span>
                                    </div>
                                    {taskTaskType === 'social' && (
                                        <div className="form-group">
                                            <label htmlFor="taskSocialActionSelect" style={{ fontWeight: 600 }}>Social Action *</label>
                                            <select id="taskSocialActionSelect" value={taskSocialAction} onChange={e => setTaskSocialAction(e.target.value as any)} style={{ width: '100%', padding: '10px', border: '2px solid #f59e0b', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white', fontWeight: 600 }}>
                                                <option value="view">👁️ View / Watch (৳ per view)</option>
                                                <option value="follow">➕ Follow / Subscribe (৳ per follow)</option>
                                            </select>
                                            <span style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', display: 'block' }}>Reward amount is set in Admin Settings → Task Configuration</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label htmlFor="taskCategorySelect">Category *</label>
                                        <select id="taskCategorySelect" value={taskCategory} onChange={e => setTaskCategory(e.target.value as any)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}>
                                            <option value="youtube">YouTube Video</option>
                                            <option value="social">Social Media</option>
                                            <option value="survey">Quick Survey</option>
                                            <option value="app">App Downloads</option>
                                            <option value="referral">Referrals Invite</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="taskTypeSelect">Type Action</label>
                                        <select id="taskTypeSelect" value={taskType} onChange={e => setTaskType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}>
                                            <option value="watch">Watch video</option>
                                            <option value="subscribe">Subscribe channel</option>
                                            <option value="follow">Follow Page</option>
                                            <option value="survey">Complete Survey</option>
                                            <option value="download">Install App</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="taskUrlInput">Task Link URL *</label>
                                    <input type="url" id="taskUrlInput" required value={taskUrl} onChange={e => setTaskUrl(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label htmlFor="taskRewardInput">Reward (৳) *</label>
                                        <input type="number" id="taskRewardInput" required min="1" value={taskReward} onChange={e => setTaskReward(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="taskDurationInput">Duration (secs) *</label>
                                        <input type="number" id="taskDurationInput" required min="5" value={taskDuration} onChange={e => setTaskDuration(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="taskDailyLimitInput">Daily limit</label>
                                        <input type="number" id="taskDailyLimitInput" min="0" value={taskDailyLimit} onChange={e => setTaskDailyLimit(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label htmlFor="taskVisibilitySelect">Visibility Segment *</label>
                                        <select id="taskVisibilitySelect" value={taskVisibility} onChange={e => setTaskVisibility(e.target.value as any)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}>
                                            <option value="everyone">Everyone</option>
                                            <option value="users">Regular Users Only</option>
                                            <option value="premium">Premium Users Only</option>
                                            <option value="new">New signups only</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="taskVerificationSelect">Verification Mode *</label>
                                        <select id="taskVerificationSelect" value={taskVerification} onChange={e => setTaskVerification(e.target.value as any)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' }}>
                                            <option value="auto">Auto verify after timer</option>
                                            <option value="manual">Manual review</option>
                                            <option value="screenshot">Screenshot required</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label htmlFor="taskProofInstructionsTextarea">Proof Instructions</label>
                                    <textarea id="taskProofInstructionsTextarea" rows={2} value={taskProofInstructions} onChange={e => setTaskProofInstructions(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'white' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={taskActive} onChange={e => setTaskActive(e.target.checked)} />
                                        <span>Active</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={taskFeatured} onChange={e => setTaskFeatured(e.target.checked)} />
                                        <span>Featured</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={taskVerified} onChange={e => setTaskVerified(e.target.checked)} />
                                        <span>Verified Source</span>
                                    </label>
                                </div>
                            </div>
                            <div className="form-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {deleteOpen && selectedTask && (
                <div className="modal-overlay active" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-primary)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: '#ef4444', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'white' }}><i className="fas fa-trash-alt"></i> Delete Task</h3>
                            <button className="modal-close" onClick={() => setDeleteOpen(false)} style={{ color: 'white' }}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '30px', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>Are you sure you want to delete this task?</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                You are about to permanently delete task <strong>{selectedTask.title}</strong>.
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
