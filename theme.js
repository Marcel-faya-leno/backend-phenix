// theme.js - Gestion du thème (sombre/clair)

const ThemeManager = {
    // Thème actuel
    currentTheme: localStorage.getItem('app_theme') || 'light',
    
    // Initialiser le thème au chargement
    init() {
        const theme = localStorage.getItem('app_theme') || 'light';
        this.setTheme(theme);
    },
    
    // Définir le thème
    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('app_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        
        // Appliquer les variables CSS selon le thème
        if (theme === 'light') {
            this.applyLightTheme();
        } else {
            this.applyDarkTheme();
        }
        
        // Émettre un événement pour que les autres scripts le sachent
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },
    
    // Appliquer le thème clair
    applyLightTheme() {
        const root = document.documentElement;
        root.style.setProperty('--primary', '#2A5CAA');
        root.style.setProperty('--primary-dark', '#1E447F');
        root.style.setProperty('--secondary', '#FF6B35');
        root.style.setProperty('--accent', '#00A896');
        root.style.setProperty('--dark', '#FFFFFF');
        root.style.setProperty('--darker', '#F8F9FA');
        root.style.setProperty('--light', '#1A1A1A');
        root.style.setProperty('--gray', '#E8E8E8');
        root.style.setProperty('--gray-light', '#D0D0D0');
        root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--text', '#1A1A1A');
        root.style.setProperty('--text-muted', '#666666');
        root.style.setProperty('--success', '#10B981');
        root.style.setProperty('--warning', '#F59E0B');
        root.style.setProperty('--danger', '#EF4444');
        root.style.setProperty('--glass', 'rgba(42, 92, 170, 0.05)');
        root.style.setProperty('--border-color', '#E0E0E0');
        root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--header-bg', 'rgba(248, 249, 250, 0.98)');
        root.style.setProperty('--footer-bg', 'rgba(248, 249, 250, 0.95)');
        root.style.setProperty('--input-bg', 'rgba(0, 0, 0, 0.05)');
        root.style.setProperty('--input-border', '#E0E0E0');
        root.style.setProperty('--overlay-bg', 'rgba(0, 0, 0, 0.5)');
        root.style.setProperty('--hover-bg', 'rgba(42, 92, 170, 0.08)');
        root.style.setProperty('--focus-bg', 'rgba(42, 92, 170, 0.12)');
        root.style.setProperty('--product-image-bg', 'linear-gradient(135deg, #f3f4f6, #e5e7eb)');
    },
    
    // Appliquer le thème sombre (par défaut)
    applyDarkTheme() {
        const root = document.documentElement;
        root.style.setProperty('--primary', '#2A5CAA');
        root.style.setProperty('--primary-dark', '#1E447F');
        root.style.setProperty('--secondary', '#FF6B35');
        root.style.setProperty('--accent', '#00A896');
        root.style.setProperty('--dark', '#0A0F1A');
        root.style.setProperty('--darker', '#050811');
        root.style.setProperty('--light', '#F0F4F8');
        root.style.setProperty('--gray', '#1E293B');
        root.style.setProperty('--gray-light', '#334155');
        root.style.setProperty('--card-bg', 'rgba(17, 24, 39, 0.9)');
        root.style.setProperty('--text', '#F0F4F8');
        root.style.setProperty('--text-muted', '#94A3B8');
        root.style.setProperty('--success', '#10B981');
        root.style.setProperty('--warning', '#F59E0B');
        root.style.setProperty('--danger', '#EF4444');
        root.style.setProperty('--glass', 'rgba(255, 255, 255, 0.05)');
        root.style.setProperty('--border-color', '#1E293B');
        root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.3)');
        root.style.setProperty('--header-bg', 'rgba(5, 8, 17, 0.98)');
        root.style.setProperty('--footer-bg', 'rgba(5, 8, 17, 0.95)');
        root.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.09)');
        root.style.setProperty('--input-border', 'rgba(42, 92, 170, 0.3)');
        root.style.setProperty('--overlay-bg', 'rgba(0, 0, 0, 0.7)');
        root.style.setProperty('--hover-bg', 'rgba(42, 92, 170, 0.1)');
        root.style.setProperty('--focus-bg', 'rgba(42, 92, 170, 0.15)');
        root.style.setProperty('--product-image-bg', 'linear-gradient(135deg, #1a1f2e, #0f1320)');
    },
    
    // Basculer entre les thèmes
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },
    
    // Obtenir le thème actuel
    getTheme() {
        return this.currentTheme;
    },
    
    // Vérifier si le thème est clair
    isLight() {
        return this.currentTheme === 'light';
    },
    
    // Vérifier si le thème est sombre
    isDark() {
        return this.currentTheme === 'dark';
    }
};

// Initialiser le thème au chargement du script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}

// Rendre disponible globalement
window.ThemeManager = ThemeManager;
