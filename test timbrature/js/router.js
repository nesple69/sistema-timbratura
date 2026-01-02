// ========================================
// Client-Side Router
// ========================================

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.beforeRouteChange = null;
    }

    /**
     * Registra una nuova route
     */
    register(path, handler) {
        this.routes[path] = handler;
    }

    /**
     * Naviga a una route
     */
    async navigate(path, params = {}) {
        // Esegui callback prima del cambio route (per cleanup)
        if (this.beforeRouteChange) {
            await this.beforeRouteChange(this.currentRoute, path);
        }

        // Verifica se la route esiste
        if (!this.routes[path]) {
            console.error(`Route not found: ${path}`);
            return;
        }

        // Nascondi tutte le view
        const views = document.querySelectorAll('[data-view]');
        views.forEach(view => view.classList.add('hidden'));

        // Esegui handler della route
        try {
            await this.routes[path](params);
            this.currentRoute = path;
        } catch (error) {
            console.error(`Error navigating to ${path}:`, error);
            showAlert('Errore durante la navigazione', 'error');
        }
    }

    /**
     * Torna alla route precedente
     */
    back() {
        window.history.back();
    }

    /**
     * Registra callback prima del cambio route
     */
    onBeforeRouteChange(callback) {
        this.beforeRouteChange = callback;
    }
}

// Istanza globale del router
const router = new Router();

// ========================================
// Definizione Routes
// ========================================

/**
 * Route: Home / Selezione Modalità
 */
router.register('home', async () => {
    const view = document.getElementById('home-view');
    view.classList.remove('hidden');

    if (window.EmployeeLogin) {
        await window.EmployeeLogin.init('employee-login-container-home');
    }
});

/**
 * Route: Login Dipendente
 */
router.register('employee-login', async () => {
    router.navigate('home');
});

/**
 * Route: Timbrature Dipendente
 */
router.register('employee-tracking', async (params) => {
    // Verifica autenticazione
    const employee = Session.getEmployee();
    if (!employee || !Session.isSessionValid('employee')) {
        Session.clearEmployee();
        showAlert('Sessione scaduta. Effettua nuovamente il login.', 'warning');
        router.navigate('employee-login');
        return;
    }

    const view = document.getElementById('employee-tracking-view');
    view.classList.remove('hidden');

    // Inizializza la vista timbrature
    if (window.EmployeeTracking) {
        await window.EmployeeTracking.init(employee);
    }
});

/**
 * Route: Login Admin
 */
router.register('admin-login', async () => {
    const view = document.getElementById('admin-login-view');
    view.classList.remove('hidden');

    // Inizializza la vista login admin
    if (window.AdminLogin) {
        await window.AdminLogin.init();
    }
});

/**
 * Route: Dashboard Admin
 */
router.register('admin-dashboard', async () => {
    // Verifica autenticazione
    const admin = Session.getAdmin();
    if (!admin || !Session.isSessionValid('admin')) {
        Session.clearAdmin();
        showAlert('Sessione scaduta. Effettua nuovamente il login.', 'warning');
        router.navigate('admin-login');
        return;
    }

    const view = document.getElementById('admin-dashboard-view');
    view.classList.remove('hidden');

    // Inizializza la dashboard admin
    if (window.AdminDashboard) {
        await window.AdminDashboard.init(admin);
    }
});

// ========================================
// Inizializzazione App
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('App inizializzata');

    // Verifica connessione Supabase
    try {
        if (!window.supabase) {
            throw new Error('Supabase client non inizializzato');
        }
        console.log('Supabase connesso');
    } catch (error) {
        console.error('Errore connessione Supabase:', error);
        showAlert('Errore di connessione al database. Verifica la configurazione.', 'error', 5000);
    }

    // Naviga alla home
    router.navigate('home');
});
