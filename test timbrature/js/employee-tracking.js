// ========================================
// Employee Time Tracking Interface
// ========================================

const EmployeeTracking = {
    employee: null,
    isWorking: false,
    currentEntry: null,
    todayEntries: [],
    clockInterval: null,

    /**
     * Inizializza la vista timbrature
     */
    async init(employee) {
        this.employee = employee;

        try {
            showLoading();

            // Verifica stato corrente
            await this.checkWorkingStatus();

            // Carica timbrature di oggi
            await this.loadTodayEntries();

            // Renderizza la UI
            this.render();

            // Avvia orologio
            this.startClock();

            hideLoading();
        } catch (error) {
            hideLoading();
            console.error('Errore inizializzazione timbrature:', error);
            showAlert('Errore nel caricamento', 'error');
        }
    },

    /**
     * Verifica se il dipendente è in servizio
     */
    async checkWorkingStatus() {
        this.isWorking = await Database.isEmployeeWorking(this.employee.id);

        if (this.isWorking) {
            this.currentEntry = await Database.getLastTimeEntry(this.employee.id);
        }
    },

    /**
     * Carica le timbrature di oggi
     */
    async loadTodayEntries() {
        this.todayEntries = await Database.getTodayTimeEntries(this.employee.id);
    },

    /**
     * Renderizza la UI
     */
    render() {
        const container = document.getElementById('employee-tracking-container');

        const totalHoursToday = this.todayEntries
            .filter(entry => entry.hours_worked)
            .reduce((sum, entry) => sum + parseFloat(entry.hours_worked), 0);

        container.innerHTML = `
            <div class="container-md">
                <!-- Header con benvenuto -->
                <div class="card text-center mb-3">
                    <h2 style="margin: 0;">Benvenuto, ${escapeHtml(this.employee.name)}! 👋</h2>
                    <p class="text-muted" style="margin: 0.5rem 0 0 0;">
                        ${getCurrentDate()}
                    </p>
                </div>
                
                <!-- Orologio -->
                <div class="card text-center mb-3">
                    <div class="time-display" id="current-time">--:--:--</div>
                </div>
                
                <!-- Stato corrente -->
                <div class="card text-center mb-3">
                    <div class="status-indicator ${this.isWorking ? 'working' : 'not-working'}" id="status-indicator">
                        ${this.isWorking ? '🟢 In Servizio' : '🔴 Fuori Servizio'}
                    </div>
                    
                    ${this.isWorking && this.currentEntry ? `
                        <div class="mt-3">
                            <p class="text-muted" style="margin: 0;">Entrata alle</p>
                            <h3 style="margin: 0.5rem 0;">${formatTime(this.currentEntry.entry_time)}</h3>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Pulsanti azione -->
                <div class="action-buttons">
                    <button 
                        class="btn btn-success btn-lg btn-block" 
                        onclick="EmployeeTracking.clockIn()"
                        ${this.isWorking ? 'disabled' : ''}
                    >
                        ⏱️ Timbra Entrata
                    </button>
                    
                    <button 
                        class="btn btn-danger btn-lg btn-block" 
                        onclick="EmployeeTracking.clockOut()"
                        ${!this.isWorking ? 'disabled' : ''}
                    >
                        🏁 Timbra Uscita
                    </button>
                </div>
                
                <!-- Statistiche giornata -->
                <div class="grid grid-2 mt-4">
                    <div class="stats-card">
                        <div class="stats-value">${this.todayEntries.length}</div>
                        <div class="stats-label">Timbrature Oggi</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${formatHours(totalHoursToday)}</div>
                        <div class="stats-label">Ore Lavorate Oggi</div>
                    </div>
                </div>
                
                <!-- Storico oggi -->
                ${this.todayEntries.length > 0 ? `
                    <div class="card mt-4">
                        <div class="card-header">
                            <h3 class="card-title">Timbrature di Oggi</h3>
                        </div>
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Entrata</th>
                                        <th>Uscita</th>
                                        <th>Ore</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.todayEntries.map(entry => `
                                        <tr>
                                            <td>${formatTime(entry.entry_time)}</td>
                                            <td>${entry.exit_time ? formatTime(entry.exit_time) : '<span class="badge badge-success">In corso</span>'}</td>
                                            <td>${entry.hours_worked ? formatHours(entry.hours_worked) : '-'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Logout -->
                <button class="btn btn-secondary btn-block mt-4" onclick="EmployeeTracking.logout()">
                    🚪 Esci
                </button>
            </div>
        `;
    },

    /**
     * Avvia l'orologio
     */
    startClock() {
        // Pulisci intervallo precedente se esiste
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }

        // Aggiorna subito
        this.updateClock();

        // Aggiorna ogni secondo
        this.clockInterval = setInterval(() => {
            this.updateClock();
        }, 1000);
    },

    /**
     * Aggiorna l'orologio
     */
    updateClock() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = getCurrentTime();
        }
    },

    /**
     * Timbra entrata
     */
    async clockIn() {
        try {
            showLoading();

            await Database.clockIn(this.employee.id);

            showAlert('Entrata registrata con successo! ✅', 'success');

            // Ricarica stato
            await this.checkWorkingStatus();
            await this.loadTodayEntries();
            this.render();
            this.startClock();

            hideLoading();

            // Auto-logout dopo 3 secondi
            setTimeout(() => {
                this.logout();
            }, 3000);
        } catch (error) {
            hideLoading();
            console.error('Errore timbratura entrata:', error);
            showAlert(error.message || 'Errore durante la timbratura', 'error');
        }
    },

    /**
     * Timbra uscita
     */
    async clockOut() {
        try {
            showLoading();

            const entry = await Database.clockOut(this.employee.id);

            showAlert(
                `Uscita registrata! Hai lavorato ${formatHours(entry.hours_worked)} ✅`,
                'success',
                4000
            );

            // Ricarica stato
            await this.checkWorkingStatus();
            await this.loadTodayEntries();
            this.render();
            this.startClock();

            hideLoading();

            // Auto-logout dopo 3 secondi
            setTimeout(() => {
                this.logout();
            }, 3000);
        } catch (error) {
            hideLoading();
            console.error('Errore timbratura uscita:', error);
            showAlert(error.message || 'Errore durante la timbratura', 'error');
        }
    },

    /**
     * Logout
     */
    logout() {
        // Ferma l'orologio
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }

        // Pulisci sessione
        Session.clearEmployee();

        // Torna alla Home (lista dipendenti)
        router.navigate('home');
    },

    /**
     * Cleanup quando si esce dalla vista
     */
    cleanup() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
    }
};

// Export globale
window.EmployeeTracking = EmployeeTracking;
