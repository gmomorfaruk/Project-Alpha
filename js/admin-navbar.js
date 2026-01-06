/**
 * Admin Navbar Component
 * Dynamically generates the admin navigation bar
 */

function generateAdminNavbar(activePage = '') {
    const navbar = `
    <!-- Admin Top Navbar -->
    <nav class="top-navbar admin-navbar">
        <a href="index.html" class="navbar-brand">
            <i class="fas fa-shield-alt"></i>
            <span>Admin Panel</span>
        </a>

        <!-- Main Navigation Menu -->
        <div class="navbar-menu">
            <!-- Dashboard -->
            <div class="navbar-item">
                <a href="index.html" class="navbar-link ${activePage === 'dashboard' ? 'active' : ''}">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
            </div>

            <!-- Users & Products Dropdown -->
            <div class="navbar-item">
                <button class="navbar-link ${['users', 'products', 'referrals'].includes(activePage) ? 'active' : ''}">
                    <i class="fas fa-database"></i>
                    <span>Manage</span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                </button>
                <div class="navbar-dropdown">
                    <a href="users.html" class="dropdown-item ${activePage === 'users' ? 'active' : ''}">
                        <i class="fas fa-users" style="color: #3b82f6;"></i>
                        <span>Users</span>
                    </a>
                    <a href="products.html" class="dropdown-item ${activePage === 'products' ? 'active' : ''}">
                        <i class="fas fa-box" style="color: #10b981;"></i>
                        <span>Products</span>
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="referrals.html" class="dropdown-item ${activePage === 'referrals' ? 'active' : ''}">
                        <i class="fas fa-user-friends" style="color: #ec4899;"></i>
                        <span>Referrals</span>
                    </a>
                </div>
            </div>

            <!-- Work Management Dropdown -->
            <div class="navbar-item">
                <button class="navbar-link ${['tasks', 'work-settings', 'task-settings'].includes(activePage) ? 'active' : ''}">
                    <i class="fas fa-tasks"></i>
                    <span>Tasks</span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                </button>
                <div class="navbar-dropdown">
                    <a href="tasks.html" class="dropdown-item ${activePage === 'tasks' ? 'active' : ''}">
                        <i class="fas fa-list-check" style="color: #8b5cf6;"></i>
                        <span>All Tasks</span>
                    </a>
                    <a href="task-settings.html" class="dropdown-item ${activePage === 'task-settings' ? 'active' : ''}">
                        <i class="fas fa-cogs" style="color: #6366f1;"></i>
                        <span>Task Settings</span>
                    </a>
                    <a href="work-settings.html" class="dropdown-item ${activePage === 'work-settings' ? 'active' : ''}">
                        <i class="fas fa-sliders-h" style="color: #f59e0b;"></i>
                        <span>Work Settings</span>
                    </a>
                </div>
            </div>

            <!-- Finance Dropdown -->
            <div class="navbar-item">
                <button class="navbar-link ${['transactions', 'investments', 'proofs', 'withdrawal-settings'].includes(activePage) ? 'active' : ''}">
                    <i class="fas fa-wallet"></i>
                    <span>Finance</span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                </button>
                <div class="navbar-dropdown">
                    <a href="transactions.html" class="dropdown-item ${activePage === 'transactions' ? 'active' : ''}">
                        <i class="fas fa-exchange-alt" style="color: #10b981;"></i>
                        <span>Transactions</span>
                    </a>
                    <a href="investments.html" class="dropdown-item ${activePage === 'investments' ? 'active' : ''}">
                        <i class="fas fa-chart-line" style="color: #3b82f6;"></i>
                        <span>Investments</span>
                    </a>
                    <a href="proofs.html" class="dropdown-item ${activePage === 'proofs' ? 'active' : ''}">
                        <i class="fas fa-receipt" style="color: #f59e0b;"></i>
                        <span>Sell Proofs</span>
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="withdrawal-settings.html" class="dropdown-item ${activePage === 'withdrawal-settings' ? 'active' : ''}">
                        <i class="fas fa-money-check-alt" style="color: #ef4444;"></i>
                        <span>Withdrawal Settings</span>
                    </a>
                </div>
            </div>

            <!-- Communication Dropdown -->
            <div class="navbar-item">
                <button class="navbar-link ${['announcements', 'notifications'].includes(activePage) ? 'active' : ''}">
                    <i class="fas fa-bullhorn"></i>
                    <span>Communicate</span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                </button>
                <div class="navbar-dropdown">
                    <a href="announcements.html" class="dropdown-item ${activePage === 'announcements' ? 'active' : ''}">
                        <i class="fas fa-bullhorn" style="color: #ef4444;"></i>
                        <span>Announcements</span>
                    </a>
                    <a href="notifications.html" class="dropdown-item ${activePage === 'notifications' ? 'active' : ''}">
                        <i class="fas fa-bell" style="color: #f59e0b;"></i>
                        <span>Notifications</span>
                    </a>
                </div>
            </div>

            <!-- System Dropdown -->
            <div class="navbar-item">
                <button class="navbar-link ${['settings', 'analytics', 'activity-logs', 'backup', 'page-settings', 'membership-settings', 'database-settings'].includes(activePage) ? 'active' : ''}">
                    <i class="fas fa-cog"></i>
                    <span>System</span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                </button>
                <div class="navbar-dropdown">
                    <a href="settings.html" class="dropdown-item ${activePage === 'settings' ? 'active' : ''}">
                        <i class="fas fa-cog" style="color: #6b7280;"></i>
                        <span>General Settings</span>
                    </a>
                    <a href="page-settings.html" class="dropdown-item ${activePage === 'page-settings' ? 'active' : ''}">
                        <i class="fas fa-file-alt" style="color: #3b82f6;"></i>
                        <span>Page Settings</span>
                    </a>
                    <a href="membership-settings.html" class="dropdown-item ${activePage === 'membership-settings' ? 'active' : ''}">
                        <i class="fas fa-crown" style="color: #f59e0b;"></i>
                        <span>Membership Settings</span>
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="analytics.html" class="dropdown-item ${activePage === 'analytics' ? 'active' : ''}">
                        <i class="fas fa-chart-pie" style="color: #8b5cf6;"></i>
                        <span>Analytics</span>
                    </a>
                    <a href="activity-logs.html" class="dropdown-item ${activePage === 'activity-logs' ? 'active' : ''}">
                        <i class="fas fa-history" style="color: #3b82f6;"></i>
                        <span>Activity Logs</span>
                    </a>
                    <a href="backup.html" class="dropdown-item ${activePage === 'backup' ? 'active' : ''}">
                        <i class="fas fa-database" style="color: #10b981;"></i>
                        <span>Backup</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Right Section -->
        <div class="navbar-right">
            <!-- View Site Dropdown -->
            <div class="view-site-dropdown">
                <button class="view-site-btn" onclick="toggleViewSiteMenu()">
                    <i class="fas fa-external-link-alt"></i> <span class="view-site-text">View Site</span>
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
            <button class="navbar-icon-btn" id="themeToggle" title="Toggle Theme">
                <i class="fas fa-moon"></i>
            </button>
            <div class="admin-user-badge">
                <i class="fas fa-shield-alt"></i>
                <span id="adminUserName">Admin</span>
            </div>
            <button class="navbar-icon-btn logout-btn" onclick="logout()" title="Logout">
                <i class="fas fa-sign-out-alt"></i>
            </button>
            <button class="navbar-hamburger" id="hamburgerBtn" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
        </div>
    </nav>

    <!-- Mobile Menu for Admin -->
    <div class="mobile-menu" id="mobileMenu">
        <div class="mobile-menu-section">
            <div class="mobile-menu-title">Main</div>
            <a href="index.html" class="mobile-menu-item ${activePage === 'dashboard' ? 'active' : ''}">
                <i class="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
            </a>
        </div>
        
        <div class="mobile-menu-section">
            <div class="mobile-menu-title">Manage</div>
            <a href="users.html" class="mobile-menu-item ${activePage === 'users' ? 'active' : ''}">
                <i class="fas fa-users"></i>
                <span>Users</span>
            </a>
            <a href="products.html" class="mobile-menu-item ${activePage === 'products' ? 'active' : ''}">
                <i class="fas fa-box"></i>
                <span>Products</span>
            </a>
            <a href="referrals.html" class="mobile-menu-item ${activePage === 'referrals' ? 'active' : ''}">
                <i class="fas fa-user-friends"></i>
                <span>Referrals</span>
            </a>
        </div>
        
        <div class="mobile-menu-section">
            <div class="mobile-menu-title">Tasks</div>
            <a href="tasks.html" class="mobile-menu-item ${activePage === 'tasks' ? 'active' : ''}">
                <i class="fas fa-tasks"></i>
                <span>All Tasks</span>
            </a>
            <a href="task-settings.html" class="mobile-menu-item ${activePage === 'task-settings' ? 'active' : ''}">
                <i class="fas fa-cogs"></i>
                <span>Task Settings</span>
            </a>
            <a href="work-settings.html" class="mobile-menu-item ${activePage === 'work-settings' ? 'active' : ''}">
                <i class="fas fa-sliders-h"></i>
                <span>Work Settings</span>
            </a>
        </div>
        
        <div class="mobile-menu-section">
            <div class="mobile-menu-title">Finance</div>
            <a href="transactions.html" class="mobile-menu-item ${activePage === 'transactions' ? 'active' : ''}">
                <i class="fas fa-exchange-alt"></i>
                <span>Transactions</span>
            </a>
            <a href="investments.html" class="mobile-menu-item ${activePage === 'investments' ? 'active' : ''}">
                <i class="fas fa-chart-line"></i>
                <span>Investments</span>
            </a>
            <a href="proofs.html" class="mobile-menu-item ${activePage === 'proofs' ? 'active' : ''}">
                <i class="fas fa-receipt"></i>
                <span>Sell Proofs</span>
            </a>
            <a href="withdrawal-settings.html" class="mobile-menu-item ${activePage === 'withdrawal-settings' ? 'active' : ''}">
                <i class="fas fa-money-check-alt"></i>
                <span>Withdrawal Settings</span>
            </a>
        </div>
        
        <div class="mobile-menu-section">
            <div class="mobile-menu-title">Communication</div>
            <a href="announcements.html" class="mobile-menu-item ${activePage === 'announcements' ? 'active' : ''}">
                <i class="fas fa-bullhorn"></i>
                <span>Announcements</span>
            </a>
            <a href="notifications.html" class="mobile-menu-item ${activePage === 'notifications' ? 'active' : ''}">
                <i class="fas fa-bell"></i>
                <span>Notifications</span>
            </a>
        </div>
        
        <div class="mobile-menu-section">
            <div class="mobile-menu-title">System</div>
            <a href="settings.html" class="mobile-menu-item ${activePage === 'settings' ? 'active' : ''}">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </a>
            <a href="page-settings.html" class="mobile-menu-item ${activePage === 'page-settings' ? 'active' : ''}">
                <i class="fas fa-file-alt"></i>
                <span>Page Settings</span>
            </a>
            <a href="membership-settings.html" class="mobile-menu-item ${activePage === 'membership-settings' ? 'active' : ''}">
                <i class="fas fa-crown"></i>
                <span>Membership Settings</span>
            </a>
            <a href="analytics.html" class="mobile-menu-item ${activePage === 'analytics' ? 'active' : ''}">
                <i class="fas fa-chart-pie"></i>
                <span>Analytics</span>
            </a>
            <a href="activity-logs.html" class="mobile-menu-item ${activePage === 'activity-logs' ? 'active' : ''}">
                <i class="fas fa-history"></i>
                <span>Activity Logs</span>
            </a>
            <a href="backup.html" class="mobile-menu-item ${activePage === 'backup' ? 'active' : ''}">
                <i class="fas fa-database"></i>
                <span>Backup</span>
            </a>
        </div>
        
        <div class="mobile-menu-footer">
            <a href="../index.html" class="mobile-menu-item" target="_blank">
                <i class="fas fa-external-link-alt"></i>
                <span>View Site</span>
            </a>
            <button class="mobile-menu-item" onclick="logout()" style="width: 100%; border: none; background: none; cursor: pointer; color: #ef4444;">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </button>
        </div>
    </div>
    `;
    
    return navbar;
}

// Toggle view site menu
function toggleViewSiteMenu() {
    const menu = document.getElementById('viewSiteMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
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

// Initialize admin navbar
function initAdminNavbar(activePage) {
    // Remove old sidebar if exists
    const oldSidebar = document.querySelector('.sidebar');
    if (oldSidebar) {
        oldSidebar.remove();
    }
    
    // Remove old topbar if exists
    const oldTopbar = document.querySelector('.topbar');
    if (oldTopbar) {
        oldTopbar.remove();
    }
    
    // Insert navbar at the beginning of body
    const navbarHTML = generateAdminNavbar(activePage);
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    
    // Update admin username
    const user = Storage.get('currentUser');
    const adminNameEl = document.getElementById('adminUserName');
    if (adminNameEl && user) {
        adminNameEl.textContent = user.name || 'Admin';
    }
}
