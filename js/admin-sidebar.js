/**
 * Admin Sidebar + Topbar Component
 * Sidebar for main navigation, Topbar for utilities
 */

// Immediately hide body to prevent flash
document.body.classList.add('admin-loading');

function generateAdminLayout(activePage = '') {
    const layout = `
    <!-- Admin Top Navbar (Simplified) -->
    <nav class="admin-topbar">
        <div class="admin-topbar-left">
            <button class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()">
                <i class="fas fa-bars"></i>
            </button>
            <a href="index.html" class="admin-topbar-brand">
                <i class="fas fa-shield-alt"></i>
                <span>Admin Panel</span>
            </a>
        </div>
        
        <div class="admin-topbar-right">
            <!-- View Site Dropdown -->
            <div class="view-site-dropdown">
                <button class="view-site-btn" onclick="toggleViewSiteMenu()">
                    <i class="fas fa-external-link-alt"></i>
                    <span>View Site</span>
                </button>
                <div class="view-site-menu" id="viewSiteMenu">
                    <div class="menu-section">
                        <span class="menu-label">Public Pages</span>
                        <a href="../index.html" target="_blank"><i class="fas fa-home"></i> Home Page</a>
                        <a href="../about.html" target="_blank"><i class="fas fa-info-circle"></i> About Us</a>
                        <a href="../products.html" target="_blank"><i class="fas fa-box"></i> Products</a>
                        <a href="../login.html" target="_blank"><i class="fas fa-sign-in-alt"></i> Login Page</a>
                    </div>
                    <div class="menu-section">
                        <span class="menu-label">User Dashboard</span>
                        <a href="../dashboard/index.html" target="_blank"><i class="fas fa-th-large"></i> Dashboard</a>
                        <a href="../dashboard/wallet.html" target="_blank"><i class="fas fa-wallet"></i> Wallet</a>
                        <a href="../dashboard/tasks.html" target="_blank"><i class="fas fa-tasks"></i> Tasks</a>
                        <a href="../dashboard/profile.html" target="_blank"><i class="fas fa-user"></i> Profile</a>
                    </div>
                </div>
            </div>
            
            <button class="admin-topbar-btn" id="themeToggle" title="Toggle Theme">
                <i class="fas fa-moon"></i>
            </button>
            
            <div class="admin-user-info">
                <div class="admin-avatar">
                    <i class="fas fa-user-shield"></i>
                </div>
                <div class="admin-details">
                    <span class="admin-name" id="userName">Admin</span>
                    <span class="admin-role">Administrator</span>
                </div>
            </div>
            
            <button class="admin-topbar-btn logout-btn" onclick="logout()" title="Logout">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        </div>
    </nav>

    <!-- Admin Sidebar -->
    <aside class="admin-sidebar" id="adminSidebar">
        <!-- Sidebar Logo -->
        <div class="sidebar-logo">
            <div class="sidebar-logo-icon">
                <i class="fas fa-shield-alt"></i>
            </div>
            <div class="sidebar-logo-text">
                Project Alpha
                <small>Admin Panel</small>
            </div>
        </div>
        
        <div class="sidebar-content">
            <!-- Dashboard -->
            <div class="sidebar-section">
                <div class="sidebar-section-title">Main</div>
                <a href="index.html" class="sidebar-item ${activePage === 'dashboard' ? 'active' : ''}">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
            </div>
            
            <!-- Manage Section -->
            <div class="sidebar-section">
                <div class="sidebar-section-title">Manage</div>
                <a href="users.html" class="sidebar-item ${activePage === 'users' ? 'active' : ''}">
                    <i class="fas fa-users"></i>
                    <span>Users</span>
                </a>
                <a href="products.html" class="sidebar-item ${activePage === 'products' ? 'active' : ''}">
                    <i class="fas fa-box"></i>
                    <span>Products</span>
                </a>
                <a href="referrals.html" class="sidebar-item ${activePage === 'referrals' ? 'active' : ''}">
                    <i class="fas fa-user-friends"></i>
                    <span>Referrals</span>
                </a>
            </div>
            
            <!-- Tasks Section -->
            <div class="sidebar-section">
                <div class="sidebar-section-title">Tasks</div>
                <a href="tasks.html" class="sidebar-item ${activePage === 'tasks' ? 'active' : ''}">
                    <i class="fas fa-list-check"></i>
                    <span>All Tasks</span>
                </a>
                <a href="task-settings.html" class="sidebar-item ${activePage === 'task-settings' ? 'active' : ''}">
                    <i class="fas fa-cogs"></i>
                    <span>Task Settings</span>
                </a>
                <a href="work-settings.html" class="sidebar-item ${activePage === 'work-settings' ? 'active' : ''}">
                    <i class="fas fa-sliders-h"></i>
                    <span>Work Settings</span>
                </a>
            </div>
            
            <!-- Finance Section -->
            <div class="sidebar-section">
                <div class="sidebar-section-title">Finance</div>
                <a href="transactions.html" class="sidebar-item ${activePage === 'transactions' ? 'active' : ''}">
                    <i class="fas fa-exchange-alt"></i>
                    <span>Transactions</span>
                </a>
                <a href="investments.html" class="sidebar-item ${activePage === 'investments' ? 'active' : ''}">
                    <i class="fas fa-chart-line"></i>
                    <span>Investments</span>
                </a>
                <a href="proofs.html" class="sidebar-item ${activePage === 'proofs' ? 'active' : ''}">
                    <i class="fas fa-receipt"></i>
                    <span>Sell Proofs</span>
                </a>
                <a href="withdrawal-settings.html" class="sidebar-item ${activePage === 'withdrawal-settings' ? 'active' : ''}">
                    <i class="fas fa-money-check-alt"></i>
                    <span>Withdrawal Settings</span>
                </a>
            </div>
            
            <!-- Communication Section -->
            <div class="sidebar-section">
                <div class="sidebar-section-title">Communication</div>
                <a href="chat.html" class="sidebar-item ${activePage === 'chat' ? 'active' : ''}">
                    <i class="fas fa-comments"></i>
                    <span>Chat Support</span>
                    <span class="sidebar-badge" id="chatBadge"></span>
                </a>
                <a href="announcements.html" class="sidebar-item ${activePage === 'announcements' ? 'active' : ''}">
                    <i class="fas fa-bullhorn"></i>
                    <span>Announcements</span>
                </a>
                <a href="notifications.html" class="sidebar-item ${activePage === 'notifications' ? 'active' : ''}">
                    <i class="fas fa-bell"></i>
                    <span>Notifications</span>
                </a>
            </div>
            
            <!-- System Section -->
            <div class="sidebar-section">
                <div class="sidebar-section-title">System</div>
                <a href="settings.html" class="sidebar-item ${activePage === 'settings' ? 'active' : ''}">
                    <i class="fas fa-cog"></i>
                    <span>General Settings</span>
                </a>
                <a href="page-settings.html" class="sidebar-item ${activePage === 'page-settings' ? 'active' : ''}">
                    <i class="fas fa-file-alt"></i>
                    <span>Page Settings</span>
                </a>
                <a href="membership-settings.html" class="sidebar-item ${activePage === 'membership-settings' ? 'active' : ''}">
                    <i class="fas fa-crown"></i>
                    <span>Membership Settings</span>
                </a>
                <a href="database-settings.html" class="sidebar-item ${activePage === 'database-settings' ? 'active' : ''}">
                    <i class="fas fa-server"></i>
                    <span>Database Settings</span>
                </a>
            </div>
            
            <!-- Analytics Section -->
            <div class="sidebar-section">
                <div class="sidebar-section-title">Analytics & Logs</div>
                <a href="analytics.html" class="sidebar-item ${activePage === 'analytics' ? 'active' : ''}">
                    <i class="fas fa-chart-pie"></i>
                    <span>Analytics</span>
                </a>
                <a href="activity-logs.html" class="sidebar-item ${activePage === 'activity-logs' ? 'active' : ''}">
                    <i class="fas fa-history"></i>
                    <span>Activity Logs</span>
                </a>
                <a href="security-logs.html" class="sidebar-item ${activePage === 'security' ? 'active' : ''}">
                    <i class="fas fa-shield-alt"></i>
                    <span>Security Logs</span>
                </a>
                <a href="backup.html" class="sidebar-item ${activePage === 'backup' ? 'active' : ''}">
                    <i class="fas fa-database"></i>
                    <span>Backup & Restore</span>
                </a>
            </div>
        </div>
        
        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
            <div class="sidebar-footer-info">
                <i class="fas fa-code"></i>
                <span>Project Alpha v2.0</span>
            </div>
        </div>
    </aside>
    
    <!-- Sidebar Overlay for Mobile -->
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
    `;
    
    return layout;
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const mainContent = document.querySelector('.admin-main-content');
    
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        sidebar.classList.toggle('mobile-open');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
    if (mainContent) {
        mainContent.classList.toggle('sidebar-collapsed');
    }
    
    // Save preference
    const isCollapsed = sidebar?.classList.contains('collapsed');
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
}

// Close sidebar (for mobile)
function closeSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) {
        sidebar.classList.remove('mobile-open');
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Toggle view site menu
function toggleViewSiteMenu() {
    const menu = document.getElementById('viewSiteMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.view-site-dropdown');
    const menu = document.getElementById('viewSiteMenu');
    if (dropdown && menu && !dropdown.contains(e.target)) {
        menu.classList.remove('active');
    }
});

// Initialize admin layout
function initAdminLayout() {
    // Check saved preference
    const isCollapsed = localStorage.getItem('adminSidebarCollapsed') === 'true';
    const sidebar = document.getElementById('adminSidebar');
    const mainContent = document.querySelector('.admin-main-content');
    
    if (isCollapsed && window.innerWidth > 992) {
        if (sidebar) sidebar.classList.add('collapsed');
        if (mainContent) mainContent.classList.add('sidebar-collapsed');
    }
    
    // Update admin username
    const user = Storage?.get?.('currentUser');
    const adminNameEl = document.getElementById('adminUserName');
    if (adminNameEl && user) {
        adminNameEl.textContent = user.name || 'Admin';
    }
    
    // Load chat badge count
    updateChatBadge();
    
    // Show body - page is ready
    document.body.classList.remove('admin-loading');
    document.body.classList.add('admin-ready');
}

// Update chat badge in sidebar
function updateChatBadge() {
    const allChats = JSON.parse(localStorage.getItem('allChatUsers') || '{}');
    let totalUnread = 0;
    Object.values(allChats).forEach(chat => {
        totalUnread += chat.unreadCount || 0;
    });
    
    const badge = document.getElementById('chatBadge');
    if (badge) {
        badge.textContent = totalUnread > 0 ? totalUnread : '';
    }
}

// Auto-refresh chat badge every 3 seconds
setInterval(updateChatBadge, 3000);

// Handle window resize
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (window.innerWidth > 992) {
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
    }
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initAdminLayout);
