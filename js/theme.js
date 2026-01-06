// ===== THEME MANAGEMENT =====
const ThemeManager = {
    themes: ['light', 'dark', 'system'],
    currentTheme: 'light',

    init() {
        // Load saved theme or default to system
        const savedTheme = localStorage.getItem('theme') || 'system';
        this.setTheme(savedTheme);
        this.bindEvents();
    },

    bindEvents() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.currentTheme === 'system') {
                this.updateIcon();
            }
        });
    },

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateIcon();
    },

    toggleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.setTheme(this.themes[nextIndex]);
    },

    updateIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        let icon = 'fa-moon';
        let title = 'Switch to Dark Mode';

        if (this.currentTheme === 'dark') {
            icon = 'fa-sun';
            title = 'Switch to Light Mode';
        } else if (this.currentTheme === 'system') {
            icon = 'fa-desktop';
            title = 'Using System Theme';
        }

        themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
        themeToggle.title = title;
    },

    isDark() {
        if (this.currentTheme === 'dark') return true;
        if (this.currentTheme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    }
};

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

// Export for use in other scripts
window.ThemeManager = ThemeManager;
