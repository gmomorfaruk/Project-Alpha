'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Storage from '@/lib/storage';
import Security from '@/lib/security';

interface AppSettings {
    platformName: string;
    defaultLanguage: string;
    maintenanceMode: boolean;
    telegramLink?: string;
    whatsappLink?: string;
    minDeposit: number;
    minWithdrawal: number;
    maxWithdrawal: number;
    withdrawalFee: number;
    referralRate: number;
    referralBonus: number;
    referralEnabled: boolean;
    bkashNumber: string;
    nagadNumber: string;
    bkashEnabled: boolean;
    nagadEnabled: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    adminEmail: string;
    phoneVerification: boolean;
    autoApproveLimit: number;
    twoFactorAuth: boolean;
    // Task & Earnings
    socialViewReward: number;
    socialFollowReward: number;
    socialLimitFree: number;
    socialLimitJunior: number;
    socialLimitAssistant: number;
    socialLimitSenior: number;
    socialLimitVip: number;
    // Security
    adminPin: string;
    requirePinEveryVisit: boolean;
}

const defaultSettings: AppSettings = {
    platformName: 'SmartEarnBD',
    defaultLanguage: 'en',
    maintenanceMode: false,
    telegramLink: 'https://t.me/placeholder',
    whatsappLink: 'https://chat.whatsapp.com/placeholder',
    minDeposit: 500,
    minWithdrawal: 1000,
    maxWithdrawal: 50000,
    withdrawalFee: 0,
    referralRate: 5,
    referralBonus: 50,
    referralEnabled: true,
    bkashNumber: '01700000000',
    nagadNumber: '01800000000',
    bkashEnabled: true,
    nagadEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    adminEmail: 'admin@demo.com',
    phoneVerification: false,
    autoApproveLimit: 0,
    twoFactorAuth: false,
    // Task & Earnings defaults
    socialViewReward: 5,
    socialFollowReward: 3,
    socialLimitFree: 3,
    socialLimitJunior: 5,
    socialLimitAssistant: 8,
    socialLimitSenior: 12,
    socialLimitVip: -1,
    // Security defaults
    adminPin: '1234',
    requirePinEveryVisit: true,
};

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'white' };
const cardStyle: React.CSSProperties = { background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' };
const headingStyle: React.CSSProperties = { borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', marginBottom: '15px' };

export default function AdminSettingsPage() {
    const { showToast } = useToast();

    // General
    const [platformName, setPlatformName] = useState('');
    const [defaultLanguage, setDefaultLanguage] = useState('en');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [telegramLink, setTelegramLink] = useState('');
    const [whatsappLink, setWhatsappLink] = useState('');

    // Financial
    const [minDeposit, setMinDeposit] = useState('500');
    const [minWithdrawal, setMinWithdrawal] = useState('1000');
    const [maxWithdrawal, setMaxWithdrawal] = useState('50000');
    const [withdrawalFee, setWithdrawalFee] = useState('0');

    // Referral
    const [referralRate, setReferralRate] = useState('5');
    const [referralBonus, setReferralBonus] = useState('50');
    const [referralEnabled, setReferralEnabled] = useState(true);

    // Payment Gateways
    const [bkashNumber, setBkashNumber] = useState('');
    const [nagadNumber, setNagadNumber] = useState('');
    const [bkashEnabled, setBkashEnabled] = useState(true);
    const [nagadEnabled, setNagadEnabled] = useState(true);

    // Notifications
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');

    // Security (old)
    const [phoneVerification, setPhoneVerification] = useState(false);
    const [autoApproveLimit, setAutoApproveLimit] = useState('0');
    const [twoFactorAuth, setTwoFactorAuth] = useState(false);

    // Task & Earnings
    const [socialViewReward, setSocialViewReward] = useState('5');
    const [socialFollowReward, setSocialFollowReward] = useState('3');
    const [socialLimitFree, setSocialLimitFree] = useState('3');
    const [socialLimitJunior, setSocialLimitJunior] = useState('5');
    const [socialLimitAssistant, setSocialLimitAssistant] = useState('8');
    const [socialLimitSenior, setSocialLimitSenior] = useState('12');
    const [socialLimitVip, setSocialLimitVip] = useState('-1');

    // Security (new)
    const [adminPin, setAdminPin] = useState('1234');
    const [requirePinEveryVisit, setRequirePinEveryVisit] = useState(true);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showPinChange, setShowPinChange] = useState(false);

    useEffect(() => {
        loadSettingsData();
    }, []);

    const loadSettingsData = (loadedSettings?: AppSettings) => {
        const settings: AppSettings = loadedSettings || Storage.get('settings') || defaultSettings;

        setPlatformName(settings.platformName || defaultSettings.platformName);
        setDefaultLanguage(settings.defaultLanguage || defaultSettings.defaultLanguage);
        setMaintenanceMode(settings.maintenanceMode || false);
        setTelegramLink(settings.telegramLink || defaultSettings.telegramLink || '');
        setWhatsappLink(settings.whatsappLink || defaultSettings.whatsappLink || '');

        setMinDeposit((settings.minDeposit ?? defaultSettings.minDeposit).toString());
        setMinWithdrawal((settings.minWithdrawal ?? defaultSettings.minWithdrawal).toString());
        setMaxWithdrawal((settings.maxWithdrawal ?? defaultSettings.maxWithdrawal).toString());
        setWithdrawalFee((settings.withdrawalFee ?? defaultSettings.withdrawalFee).toString());

        setReferralRate((settings.referralRate ?? defaultSettings.referralRate).toString());
        setReferralBonus((settings.referralBonus ?? defaultSettings.referralBonus).toString());
        setReferralEnabled(settings.referralEnabled !== false);

        setBkashNumber(settings.bkashNumber || defaultSettings.bkashNumber);
        setNagadNumber(settings.nagadNumber || defaultSettings.nagadNumber);
        setBkashEnabled(settings.bkashEnabled !== false);
        setNagadEnabled(settings.nagadEnabled !== false);

        setEmailNotifications(settings.emailNotifications !== false);
        setSmsNotifications(settings.smsNotifications || false);
        setAdminEmail(settings.adminEmail || defaultSettings.adminEmail);

        setPhoneVerification(settings.phoneVerification || false);
        setAutoApproveLimit((settings.autoApproveLimit ?? defaultSettings.autoApproveLimit).toString());
        setTwoFactorAuth(settings.twoFactorAuth || false);

        // Task & Earnings
        setSocialViewReward((settings.socialViewReward ?? defaultSettings.socialViewReward).toString());
        setSocialFollowReward((settings.socialFollowReward ?? defaultSettings.socialFollowReward).toString());
        setSocialLimitFree((settings.socialLimitFree ?? defaultSettings.socialLimitFree).toString());
        setSocialLimitJunior((settings.socialLimitJunior ?? defaultSettings.socialLimitJunior).toString());
        setSocialLimitAssistant((settings.socialLimitAssistant ?? defaultSettings.socialLimitAssistant).toString());
        setSocialLimitSenior((settings.socialLimitSenior ?? defaultSettings.socialLimitSenior).toString());
        setSocialLimitVip((settings.socialLimitVip ?? defaultSettings.socialLimitVip).toString());

        // Security
        setAdminPin(settings.adminPin || defaultSettings.adminPin);
        setRequirePinEveryVisit(settings.requirePinEveryVisit !== false);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const settings: AppSettings = {
                platformName: platformName.trim(),
                defaultLanguage,
                maintenanceMode,
                telegramLink: telegramLink.trim(),
                whatsappLink: whatsappLink.trim(),
                minDeposit: Number(minDeposit) || 500,
                minWithdrawal: Number(minWithdrawal) || 1000,
                maxWithdrawal: Number(maxWithdrawal) || 50000,
                withdrawalFee: Number(withdrawalFee) || 0,
                referralRate: Number(referralRate) || 5,
                referralBonus: Number(referralBonus) || 50,
                referralEnabled,
                bkashNumber: bkashNumber.trim(),
                nagadNumber: nagadNumber.trim(),
                bkashEnabled,
                nagadEnabled,
                emailNotifications,
                smsNotifications,
                adminEmail: adminEmail.trim(),
                phoneVerification,
                autoApproveLimit: Number(autoApproveLimit) || 0,
                twoFactorAuth,
                // Task & Earnings
                socialViewReward: Number(socialViewReward) || 5,
                socialFollowReward: Number(socialFollowReward) || 3,
                socialLimitFree: Number(socialLimitFree),
                socialLimitJunior: Number(socialLimitJunior),
                socialLimitAssistant: Number(socialLimitAssistant),
                socialLimitSenior: Number(socialLimitSenior),
                socialLimitVip: Number(socialLimitVip),
                // Security
                adminPin,
                requirePinEveryVisit,
            };

            Storage.set('settings', settings);
            showToast('Platform configurations updated successfully!', 'success');
        } catch (err) {
            showToast('Failed to save settings configurations', 'error');
        }
    };

    const handleResetDefaults = () => {
        if (!confirm('Reset all parameters back to initial default values?')) return;
        Storage.set('settings', defaultSettings);
        loadSettingsData(defaultSettings);
        showToast('Settings reset to default values', 'success');
    };

    const handlePinChange = () => {
        if (newPin.length < 4) {
            showToast('PIN must be at least 4 digits', 'error');
            return;
        }
        if (newPin !== confirmPin) {
            showToast('PINs do not match', 'error');
            return;
        }
        if (!/^\d+$/.test(newPin)) {
            showToast('PIN must contain only digits', 'error');
            return;
        }
        setAdminPin(newPin);
        setNewPin('');
        setConfirmPin('');
        setShowPinChange(false);
        showToast('Admin PIN updated! Remember to save settings.', 'success');
    };

    const securityLogs = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('projectAlpha_securityLogs') || '[]').slice(0, 10)
        : [];

    return (
        <div>
            <div className="page-header">
                <h1>Platform Configurations</h1>
                <p>Manage limits, payment gateways, task rewards, and security settings</p>
            </div>

            <form onSubmit={handleFormSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', color: 'white' }}>
                    
                    {/* General Settings */}
                    <div style={cardStyle}>
                        <h3 style={headingStyle}>
                            <i className="fas fa-globe" style={{ color: 'var(--primary-color)' }}></i> General Settings
                        </h3>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label htmlFor="platNameInput">Platform Branding Name</label>
                            <input type="text" id="platNameInput" value={platformName} onChange={e => setPlatformName(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label htmlFor="defaultLangSelect">Default System Language</label>
                            <select id="defaultLangSelect" value={defaultLanguage} onChange={e => setDefaultLanguage(e.target.value)} style={inputStyle}>
                                <option value="en">English (US)</option>
                                <option value="bn">বাংলা (Bengali)</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label htmlFor="telegramInput">Telegram Group Link</label>
                            <input type="text" id="telegramInput" value={telegramLink} onChange={e => setTelegramLink(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label htmlFor="whatsappInput">WhatsApp Group Link</label>
                            <input type="text" id="whatsappInput" value={whatsappLink} onChange={e => setWhatsappLink(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" id="maintModeCheckbox" checked={maintenanceMode} onChange={e => setMaintenanceMode(e.target.checked)} />
                            <label htmlFor="maintModeCheckbox">Enable Maintenance Mode</label>
                        </div>
                    </div>

                    {/* Financial settings */}
                    <div style={cardStyle}>
                        <h3 style={headingStyle}>
                            <i className="fas fa-coins" style={{ color: 'var(--primary-color)' }}></i> Financial Gateways
                        </h3>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label htmlFor="minDepInput">Minimum Deposit Amount (৳)</label>
                            <input type="number" id="minDepInput" value={minDeposit} onChange={e => setMinDeposit(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label htmlFor="minWithdrawInput">Minimum Withdrawal Amount (৳)</label>
                            <input type="number" id="minWithdrawInput" value={minWithdrawal} onChange={e => setMinWithdrawal(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label htmlFor="maxWithdrawInput">Daily Maximum Withdrawal (৳)</label>
                            <input type="number" id="maxWithdrawInput" value={maxWithdrawal} onChange={e => setMaxWithdrawal(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="withdrawFeeInput">Withdrawal Commission Surcharge (%)</label>
                            <input type="number" id="withdrawFeeInput" value={withdrawalFee} onChange={e => setWithdrawalFee(e.target.value)} style={inputStyle} />
                        </div>
                    </div>

                    {/* Payment Gateways */}
                    <div style={cardStyle}>
                        <h3 style={headingStyle}>
                            <i className="fas fa-credit-card" style={{ color: 'var(--primary-color)' }}></i> Mobile Merchant Coordinates
                        </h3>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label htmlFor="bkashNumInput">bKash Personal / Agent Mobile</label>
                            <input type="text" id="bkashNumInput" value={bkashNumber} onChange={e => setBkashNumber(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label htmlFor="nagadNumInput">Nagad Personal / Agent Mobile</label>
                            <input type="text" id="nagadNumInput" value={nagadNumber} onChange={e => setNagadNumber(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ display: 'flex', gap: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={bkashEnabled} onChange={e => setBkashEnabled(e.target.checked)} />
                                <span>Accept bKash</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={nagadEnabled} onChange={e => setNagadEnabled(e.target.checked)} />
                                <span>Accept Nagad</span>
                            </label>
                        </div>
                    </div>

                    {/* Referrals */}
                    <div style={cardStyle}>
                        <h3 style={headingStyle}>
                            <i className="fas fa-user-friends" style={{ color: 'var(--primary-color)' }}></i> Referral Commission
                        </h3>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label htmlFor="refRateInput">Referral Commission Rate (%)</label>
                            <input type="number" id="refRateInput" value={referralRate} onChange={e => setReferralRate(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label htmlFor="refBonusInput">Fixed Referral Bonus (৳)</label>
                            <input type="number" id="refBonusInput" value={referralBonus} onChange={e => setReferralBonus(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" id="refEnabledCheckbox" checked={referralEnabled} onChange={e => setReferralEnabled(e.target.checked)} />
                            <label htmlFor="refEnabledCheckbox">Enable Referral System</label>
                        </div>
                    </div>

                    {/* ============ TASK & EARNINGS CONFIG ============ */}
                    <div style={cardStyle}>
                        <h3 style={headingStyle}>
                            <i className="fas fa-tasks" style={{ color: '#f59e0b' }}></i> Task & Earnings Configuration
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                            Configure reward amounts for social media tasks and daily limits per membership tier.
                        </p>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label htmlFor="socialViewReward">Social View Reward (৳ per task)</label>
                            <input type="number" id="socialViewReward" value={socialViewReward} onChange={e => setSocialViewReward(e.target.value)} style={inputStyle} min="0" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label htmlFor="socialFollowReward">Social Follow Reward (৳ per task)</label>
                            <input type="number" id="socialFollowReward" value={socialFollowReward} onChange={e => setSocialFollowReward(e.target.value)} style={inputStyle} min="0" />
                        </div>
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '5px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>Daily Social Task Limits per Tier</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '12px' }}>Free Members</label>
                                    <input type="number" value={socialLimitFree} onChange={e => setSocialLimitFree(e.target.value)} style={inputStyle} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '12px' }}>Junior</label>
                                    <input type="number" value={socialLimitJunior} onChange={e => setSocialLimitJunior(e.target.value)} style={inputStyle} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '12px' }}>Assistant</label>
                                    <input type="number" value={socialLimitAssistant} onChange={e => setSocialLimitAssistant(e.target.value)} style={inputStyle} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '12px' }}>Senior</label>
                                    <input type="number" value={socialLimitSenior} onChange={e => setSocialLimitSenior(e.target.value)} style={inputStyle} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '8px' }}>
                                <label style={{ fontSize: '12px' }}>VIP (-1 = Unlimited)</label>
                                <input type="number" value={socialLimitVip} onChange={e => setSocialLimitVip(e.target.value)} style={inputStyle} />
                            </div>
                        </div>
                    </div>

                    {/* ============ SECURITY SETTINGS ============ */}
                    <div style={cardStyle}>
                        <h3 style={headingStyle}>
                            <i className="fas fa-shield-alt" style={{ color: '#ef4444' }}></i> Admin Security
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                            Protect the admin panel with a PIN code. Only you should know this PIN.
                        </p>

                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px', padding: '15px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <i className="fas fa-lock" style={{ color: '#ef4444' }}></i>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>Admin PIN: {adminPin.replace(/./g, '•')}</span>
                            </div>
                            {!showPinChange ? (
                                <button type="button" onClick={() => setShowPinChange(true)} style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                                    <i className="fas fa-key" style={{ marginRight: '6px' }}></i> Change PIN
                                </button>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input type="password" placeholder="New PIN (min 4 digits)" value={newPin} onChange={e => setNewPin(e.target.value)} style={inputStyle} maxLength={8} />
                                    <input type="password" placeholder="Confirm New PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} style={inputStyle} maxLength={8} />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="button" onClick={handlePinChange} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', flex: 1 }}>
                                            <i className="fas fa-check" style={{ marginRight: '4px' }}></i> Update PIN
                                        </button>
                                        <button type="button" onClick={() => { setShowPinChange(false); setNewPin(''); setConfirmPin(''); }} style={{ padding: '8px 16px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <input type="checkbox" id="requirePinCheckbox" checked={requirePinEveryVisit} onChange={e => setRequirePinEveryVisit(e.target.checked)} />
                            <label htmlFor="requirePinCheckbox">Require PIN on every visit</label>
                        </div>

                        {/* Recent Security Logs */}
                        {securityLogs.length > 0 && (
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Recent Security Events</p>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px' }}>
                                    {securityLogs.map((log: any, i: number) => (
                                        <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                            <span style={{ color: log.type.includes('fail') ? '#ef4444' : '#10b981', fontWeight: 500 }}>
                                                {log.type}
                                            </span>
                                            {' — '}
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Submit buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
                    <button type="button" className="btn btn-outline" onClick={handleResetDefaults}>
                        <i className="fas fa-undo"></i> Reset to Defaults
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg">
                        <i className="fas fa-save" style={{ marginRight: '6px' }}></i> Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
}
