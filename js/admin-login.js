// ========================================
// Admin Login Interface
// ========================================

const AdminLogin = {

    /**
     * Inizializza la vista login admin
     */
    async init() {
        this.render();
    },

    /**
     * Renderizza la UI
     */
    render() {
        const container = document.getElementById('admin-login-container');

        container.innerHTML = `
            <div class="card container-sm">
                <div class="card-header text-center">
                    <h2 class="card-title">🔐 Accesso Amministratore</h2>
                    <p class="text-muted">Inserisci le tue credenziali</p>
                </div>
                
                <form id="admin-login-form" onsubmit="AdminLogin.login(event)">
                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <input 
                            type="text" 
                            id="admin-username" 
                            class="form-control" 
                            placeholder="Username"
                            autocomplete="username"
                            autocapitalize="none"
                            autocorrect="off"
                            spellcheck="false"
                            required
                        />
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input 
                            type="password" 
                            id="admin-password" 
                            class="form-control" 
                            placeholder="Password"
                            autocomplete="current-password"
                            autocapitalize="none"
                            autocorrect="off"
                            spellcheck="false"
                            required
                        />
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        Accedi
                    </button>
                </form>
                
                <button class="btn btn-secondary btn-block mt-3" onclick="router.navigate('home')">
                    Torna alla Home
                </button>
                
                <div class="mt-3 text-center text-muted" style="font-size: 0.875rem;">
                    <p>Credenziali di default:</p>
                    <p><strong>Username:</strong> admin<br><strong>Password:</strong> admin123</p>
                    <p style="color: var(--warning-color);">⚠️ Cambia la password dopo il primo accesso!</p>
                </div>
            </div>
        `;

        // Focus sul campo username
        setTimeout(() => {
            document.getElementById('admin-username').focus();
        }, 100);
    },

    /**
     * Effettua il login
     */
    async login(event) {
        event.preventDefault();

        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value;

        if (!username || !password) {
            showAlert('Compila tutti i campi', 'warning');
            return;
        }

        try {
            showLoading();

            // Autentica l'admin
            const admin = await Database.authenticateAdmin(username, password);

            // Salva la sessione
            Session.setAdmin(admin);

            hideLoading();

            showAlert('Accesso effettuato con successo! ✅', 'success');

            // Naviga alla dashboard
            router.navigate('admin-dashboard');

        } catch (error) {
            hideLoading();
            console.error('Errore login admin:', error);
            showAlert(error.message || 'Credenziali non valide', 'error');

            // Pulisci password
            document.getElementById('admin-password').value = '';
        }
    }
};

// Export globale
window.AdminLogin = AdminLogin;
