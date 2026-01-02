// ========================================
// Employee Login Interface
// ========================================

const EmployeeLogin = {
    employees: [],
    selectedEmployee: null,

    /**
     * Inizializza la vista login dipendente
     */
    async init(containerId = 'employee-login-container') {
        this.containerId = containerId;
        try {
            showLoading();

            // Carica i dipendenti attivi
            this.employees = await Database.getActiveEmployees();

            // Renderizza la UI
            this.render();

            hideLoading();
        } catch (error) {
            hideLoading();
            console.error('Errore inizializzazione login dipendente:', error);
            this.renderError(error.message || 'Errore nel caricamento dei dipendenti');
        }
    },

    /**
     * Renderizza la UI
     */
    render() {
        const container = document.getElementById(this.containerId || 'employee-login-container');
        if (!container) return;

        if (this.employees.length === 0) {
            container.innerHTML = `
                <div class="card container-sm">
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <div class="empty-state-text">
                            Nessun dipendente disponibile.<br>
                            Contatta l'amministratore.
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="card container">
                <div class="card-header text-center">
                    <h2 class="card-title">Seleziona il tuo nome</h2>
                    <p class="text-muted">Tocca il tuo profilo per timbrare</p>
                </div>
                
                <div class="employee-grid" id="employee-grid">
                    ${this.employees.map(emp => `
                        <div class="employee-card" data-employee-id="${emp.id}" style="padding: 0.75rem;">
                            <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">👤</div>
                            <h4 style="margin: 0; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${escapeHtml(emp.name)}
                            </h4>
                        </div>
                    `).join('')}
                </div>
                
                <div id="password-section" class="hidden" style="margin-top: 1.5rem;">
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input 
                            type="text" 
                            id="employee-password" 
                            class="form-control" 
                            placeholder="Password"
                            autocomplete="one-time-code"
                            autocapitalize="none"
                            autocorrect="off"
                            spellcheck="false"
                            style="-webkit-text-security: disc;"
                        />
                    </div>
                    
                    <div class="flex gap-2">
                        <button class="btn btn-secondary flex-1" onclick="EmployeeLogin.cancelSelection()">
                            Annulla
                        </button>
                        <button class="btn btn-primary flex-1" onclick="EmployeeLogin.login()">
                            Accedi
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Aggiungi event listeners alle card dipendenti
        const employeeCards = container.querySelectorAll('.employee-card');
        employeeCards.forEach(card => {
            card.addEventListener('click', () => {
                const employeeId = card.dataset.employeeId;
                this.selectEmployee(employeeId);
            });
        });

        // Enter key per login
        const passwordInput = document.getElementById('employee-password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.login();
                }
            });
        }
    },

    /**
     * Seleziona un dipendente
     */
    selectEmployee(employeeId) {
        this.selectedEmployee = this.employees.find(emp => emp.id === employeeId);

        // Rimuovi selezione precedente
        document.querySelectorAll('.employee-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Seleziona la card corrente
        const selectedCard = document.querySelector(`[data-employee-id="${employeeId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        // Mostra sezione password
        const passwordSection = document.getElementById('password-section');
        if (passwordSection) {
            passwordSection.classList.remove('hidden');
        }

        // Focus immediato sul campo password per forzare l'apertura della tastiera su tablet
        const passwordInput = document.getElementById('employee-password');
        if (passwordInput) {
            passwordInput.focus();

            // Lo scroll può rimanere nel timeout per non interferire con l'apertura della tastiera
            setTimeout(() => {
                passwordInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    },

    /**
     * Annulla selezione
     */
    cancelSelection() {
        this.selectedEmployee = null;

        // Rimuovi selezione
        document.querySelectorAll('.employee-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Nascondi sezione password
        document.getElementById('password-section').classList.add('hidden');

        // Pulisci campo password
        document.getElementById('employee-password').value = '';
    },

    /**
     * Effettua il login
     */
    async login() {
        if (!this.selectedEmployee) {
            showAlert('Seleziona un dipendente', 'warning');
            return;
        }

        const password = document.getElementById('employee-password').value.trim();

        if (!password) {
            showAlert('Inserisci la password', 'warning');
            return;
        }

        try {
            showLoading();

            // Autentica il dipendente
            const employee = await Database.authenticateEmployee(
                this.selectedEmployee.id,
                password
            );

            // Salva la sessione
            Session.setEmployee(employee);

            hideLoading();

            // Naviga alla vista timbrature
            router.navigate('employee-tracking');

        } catch (error) {
            hideLoading();
            console.error('Errore login:', error);
            showAlert(error.message || 'Errore durante il login', 'error');

            // Pulisci password
            document.getElementById('employee-password').value = '';
        }
    },

    /**
     * Renderizza uno stato di errore con pulsante riprova
     */
    renderError(message) {
        const container = document.getElementById(this.containerId || 'employee-login-container');
        if (!container) return;

        const isOffline = !navigator.onLine;
        const displayMessage = isOffline ? 'Sembra che tu sia offline. Verifica la connessione.' : message;

        container.innerHTML = `
            <div class="card container-sm text-center">
                <div class="offline-notice">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">${isOffline ? '📡' : '⚠️'}</div>
                    <h3>${isOffline ? 'Connessione assente' : 'Si è verificato un errore'}</h3>
                    <p class="text-muted">${displayMessage}</p>
                    <button class="btn btn-primary mt-3" onclick="EmployeeLogin.init('${this.containerId}')">
                        🔄 Riprova il caricamento
                    </button>
                </div>
            </div>
        `;
    }
};

// Export globale
window.EmployeeLogin = EmployeeLogin;
