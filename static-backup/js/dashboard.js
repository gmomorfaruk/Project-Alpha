/**
 * Dashboard JavaScript Helper
 * Common functionality for all dashboard pages
 */

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    initializeTopbar();
});

// Sidebar functionality
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
        });
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.remove('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Topbar functionality
function initializeTopbar() {
    const themeToggle = document.getElementById('themeToggle');
    const langToggle = document.getElementById('langToggle');

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            ThemeManager.toggleTheme();
            updateThemeIcon();
        });
        updateThemeIcon();
    }

    if (langToggle) {
        langToggle.addEventListener('click', function() {
            const currentLang = LanguageManager.currentLang;
            const newLang = currentLang === 'en' ? 'bn' : 'en';
            LanguageManager.setLanguage(newLang);
            langToggle.querySelector('span').textContent = newLang.toUpperCase();
        });
    }
}

// Update theme icon based on current theme
function updateThemeIcon() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const theme = ThemeManager.currentTheme;
    const icon = themeToggle.querySelector('i');
    
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else if (theme === 'light') {
        icon.className = 'fas fa-moon';
    } else {
        icon.className = 'fas fa-circle-half-stroke';
    }
}

// Format relative time
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Calculate investment progress
function calculateProgress(investment) {
    const startDate = new Date(investment.startDate);
    const endDate = new Date(investment.endDate);
    const now = new Date();

    if (now >= endDate) return 100;
    if (now <= startDate) return 0;

    const totalDuration = endDate - startDate;
    const elapsed = now - startDate;

    return Math.min(100, Math.round((elapsed / totalDuration) * 100));
}

// Get status color
function getStatusColor(status) {
    const colors = {
        'pending': '#f59e0b',
        'approved': '#10b981',
        'rejected': '#ef4444',
        'active': '#3b82f6',
        'completed': '#10b981',
        'cancelled': '#6b7280'
    };
    return colors[status] || '#6b7280';
}

// Get status badge class
function getStatusBadge(status) {
    const badges = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger',
        'active': 'primary',
        'completed': 'success',
        'cancelled': 'secondary'
    };
    return badges[status] || 'secondary';
}

// Confirm action modal
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Export data to CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            let value = row[header] || '';
            if (typeof value === 'string' && value.includes(',')) {
                value = `"${value}"`;
            }
            return value;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Export data to JSON
function exportToJSON(data, filename) {
    if (!data) {
        showToast('No data to export', 'error');
        return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Parse query parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Number animation
function animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Notification helper
function notify(title, message, type = 'info') {
    // Check if browser notifications are supported
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }
    
    // Also show toast
    showToast(message, type);
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Check if user is admin
function isAdmin() {
    const user = Storage.get('currentUser');
    return user && user.role === 'admin';
}

// Check if user is logged in
function isLoggedIn() {
    const user = Storage.get('currentUser');
    return user && user.isLoggedIn;
}

// Toggle notification panel
function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    
    if (mobileMenu) {
        const isOpen = mobileMenu.classList.toggle('active');
        
        if (hamburgerBtn) {
            if (isOpen) {
                hamburgerBtn.innerHTML = '<i class="fas fa-times"></i>';
                document.body.style.overflow = 'hidden';
            } else {
                hamburgerBtn.innerHTML = '<i class="fas fa-bars"></i>';
                document.body.style.overflow = '';
            }
        }
    }
}

// Close notification panel when clicking outside
document.addEventListener('click', function(e) {
    const panel = document.getElementById('notificationPanel');
    const btn = document.querySelector('[onclick="toggleNotificationPanel()"]');
    
    if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.remove('active');
    }
});

// Redirect based on role
function redirectByRole() {
    const user = Storage.get('currentUser');
    if (!user || !user.isLoggedIn) {
        window.location.href = '/login.html';
        return;
    }
    
    if (user.role === 'admin') {
        window.location.href = '/admin/index.html';
    } else {
        window.location.href = '/dashboard/index.html';
    }
}

console.log('Dashboard.js loaded successfully');
