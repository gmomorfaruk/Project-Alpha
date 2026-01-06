/**
 * Admin Common Functions
 * Shared functionality across all admin pages
 */

// View Site Dropdown Toggle
function toggleViewSiteMenu() {
    const menu = document.getElementById('viewSiteMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.view-site-dropdown');
    const menu = document.getElementById('viewSiteMenu');
    if (dropdown && menu && !dropdown.contains(e.target)) {
        menu.classList.remove('active');
    }
});

// Inject View Site dropdown into topbar if not already present
document.addEventListener('DOMContentLoaded', function() {
    const topbarRight = document.querySelector('.topbar-right');
    const existingDropdown = document.querySelector('.view-site-dropdown');
    
    if (topbarRight && !existingDropdown) {
        const dropdownHTML = `
            <div class="view-site-dropdown">
                <button class="view-site-btn" onclick="toggleViewSiteMenu()">
                    <i class="fas fa-external-link-alt"></i> View Site
                </button>
                <div class="view-site-menu" id="viewSiteMenu">
                    <div class="menu-section">
                        <span class="menu-label">Public Pages</span>
                        <a href="../index.html" target="_blank"><i class="fas fa-home"></i> Home Page</a>
                        <a href="../about.html" target="_blank"><i class="fas fa-info-circle"></i> About Us</a>
                        <a href="../products.html" target="_blank"><i class="fas fa-box"></i> Products</a>
                        <a href="../login.html" target="_blank"><i class="fas fa-sign-in-alt"></i> Login Page</a>
                        <a href="../signup.html" target="_blank"><i class="fas fa-user-plus"></i> Signup Page</a>
                    </div>
                    <div class="menu-section">
                        <span class="menu-label">User Dashboard</span>
                        <a href="../dashboard/index.html" target="_blank"><i class="fas fa-th-large"></i> Dashboard</a>
                        <a href="../dashboard/wallet.html" target="_blank"><i class="fas fa-wallet"></i> Wallet</a>
                        <a href="../dashboard/membership.html" target="_blank"><i class="fas fa-crown"></i> Membership</a>
                        <a href="../dashboard/earn-tasks.html" target="_blank"><i class="fas fa-tasks"></i> Earn Tasks</a>
                        <a href="../dashboard/profile.html" target="_blank"><i class="fas fa-user"></i> Profile</a>
                        <a href="../dashboard/referrals.html" target="_blank"><i class="fas fa-users"></i> Referrals</a>
                        <a href="../dashboard/youtube-tasks.html" target="_blank"><i class="fab fa-youtube"></i> YouTube Tasks</a>
                        <a href="../dashboard/social-tasks.html" target="_blank"><i class="fas fa-share-alt"></i> Social Tasks</a>
                    </div>
                </div>
            </div>
        `;
        
        // Insert at the beginning of topbar-right
        topbarRight.insertAdjacentHTML('afterbegin', dropdownHTML);
    }
});

// Common admin logout function
function logout() {
    // Log the logout event
    if (typeof Security !== 'undefined') {
        Security.logSecurityEvent('admin_logout', { timestamp: new Date().toISOString() });
    }
    
    // Clear session data
    if (typeof Storage !== 'undefined' && Storage.remove) {
        Storage.remove('currentUser');
        Storage.remove('userSession');
    } else {
        localStorage.removeItem('projectAlpha_currentUser');
        localStorage.removeItem('projectAlpha_userSession');
    }
    window.location.href = '../login.html';
}

// Common toast notification
function showToast(message, type = 'info') {
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-circle', info: 'info-circle' };
    
    // Sanitize message
    const safeMessage = typeof Security !== 'undefined' ? Security.sanitizeHTML(message) : message;
    
    // Remove existing toast
    const existingToast = document.querySelector('.admin-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 12px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        background: ${colors[type]};
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${safeMessage}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
