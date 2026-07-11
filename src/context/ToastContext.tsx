'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    removing?: boolean;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { id, message, type };
        
        setToasts(prev => [...prev, newToast]);
        
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, [removeToast]);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return 'fa-check';
            case 'error': return 'fa-times';
            case 'warning': return 'fa-exclamation';
            case 'info':
            default:
                return 'fa-info';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type} ${t.removing ? 'removing' : ''}`}>
                        <div className="toast-icon">
                            <i className={`fas ${getIcon(t.type)}`}></i>
                        </div>
                        <span className="toast-message">{t.message}</span>
                        <button className="toast-close" onClick={() => removeToast(t.id)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
