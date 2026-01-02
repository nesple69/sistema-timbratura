// ========================================
// Admin Dashboard
// ========================================

const AdminDashboard = {
    admin: null,
    currentTab: 'employees',
    employees: [],
    timeEntries: [],
    filterStartDate: null,
    filterEndDate: null,
    reportEmployeeId: null,

    /**
     * Inizializza la dashboard
     */
    async init(admin) {
        this.admin = admin;

        try {
            showLoading();

            // Carica dati iniziali
            await this.loadEmployees();
            await this.loadTimeEntries();

            // Renderizza la UI
            this.render();

            hideLoading();
        } catch (error) {
            hideLoading();
            console.error('Errore inizializzazione dashboard:', error);
            showAlert('Errore nel caricamento della dashboard', 'error');
        }
    },

    /**
     * Carica tutti i dipendenti
     */
    async loadEmployees() {
        this.employees = await Database.getAllEmployees();
    },

    /**
     * Carica le timbrature
     */
    async loadTimeEntries(startDate = null, endDate = null) {
        this.timeEntries = await Database.getAllTimeEntries(startDate, endDate);
    },

    /**
     * Renderizza la UI principale
     */
    render() {
        const container = document.getElementById('admin-dashboard-container');

        container.innerHTML = `
            <div class="container">
                <!-- Header -->
                <div class="card mb-3">
                    <div class="flex flex-between" style="align-items: center;">
                        <div>
                            <h2 style="margin: 0;">Dashboard Amministratore</h2>
                            <p class="text-muted" style="margin: 0.5rem 0 0 0;">
                                Benvenuto, ${escapeHtml(this.admin.username)}
                            </p>
                        </div>
                        <button class="btn btn-secondary" onclick="AdminDashboard.logout()">
                            🚪 Esci
                        </button>
                    </div>
                </div>
                
                <!-- Tabs -->
                <div class="tabs">
                    <button class="tab ${this.currentTab === 'employees' ? 'active' : ''}" 
                            onclick="AdminDashboard.switchTab('employees')">
                        👥 Dipendenti
                    </button>
                    <button class="tab ${this.currentTab === 'timeentries' ? 'active' : ''}" 
                            onclick="AdminDashboard.switchTab('timeentries')">
                        ⏱️ Timbrature
                    </button>
                    <button class="tab ${this.currentTab === 'reports' ? 'active' : ''}" 
                            onclick="AdminDashboard.switchTab('reports')">
                        📊 Report
                    </button>
                    <button class="tab ${this.currentTab === 'settings' ? 'active' : ''}" 
                            onclick="AdminDashboard.switchTab('settings')">
                        ⚙️ Impostazioni
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div id="tab-content">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;
    },

    /**
     * Renderizza il contenuto del tab corrente
     */
    renderTabContent() {
        switch (this.currentTab) {
            case 'employees':
                return this.renderEmployeesTab();
            case 'timeentries':
                return this.renderTimeEntriesTab();
            case 'reports':
                return this.renderReportsTab();
            case 'settings':
                return this.renderSettingsTab();
            default:
                return '';
        }
    },

    /**
     * Tab Dipendenti
     */
    renderEmployeesTab() {
        return `
            <div class="card">
                <div class="card-header flex flex-between" style="align-items: center;">
                    <h3 class="card-title" style="margin: 0;">Gestione Dipendenti</h3>
                    <button class="btn btn-primary" onclick="AdminDashboard.showAddEmployeeModal()">
                        ➕ Nuovo Dipendente
                    </button>
                </div>
                
                ${this.employees.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <div class="empty-state-text">Nessun dipendente presente</div>
                        <button class="btn btn-primary mt-3" onclick="AdminDashboard.showAddEmployeeModal()">
                            Aggiungi il primo dipendente
                        </button>
                    </div>
                ` : `
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Stato</th>
                                    <th>Data Creazione</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.employees.map(emp => `
                                    <tr>
                                        <td><strong>${escapeHtml(emp.name)}</strong></td>
                                        <td>
                                            <span class="badge ${emp.active ? 'badge-success' : 'badge-danger'}">
                                                ${emp.active ? 'Attivo' : 'Disattivato'}
                                            </span>
                                        </td>
                                        <td>${formatDate(emp.created_at)}</td>
                                        <td>
                                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem; min-height: auto;" 
                                                    onclick="AdminDashboard.showEditEmployeeModal('${emp.id}')">
                                                ✏️ Modifica
                                            </button>
                                            <button class="btn btn-danger" style="padding: 0.5rem 1rem; min-height: auto;" 
                                                    onclick="AdminDashboard.confirmDeleteEmployee('${emp.id}', '${escapeHtml(emp.name)}')">
                                                🗑️ Elimina
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    /**
     * Tab Timbrature
     */
    renderTimeEntriesTab() {
        return `
            <div class="card">
                <div class="card-header flex flex-between" style="align-items: center;">
                    <h3 class="card-title" style="margin: 0;">Gestione Timbrature</h3>
                    <button class="btn btn-primary" onclick="AdminDashboard.showAddTimeEntryModal()">
                        ➕ Nuova Timbratura
                    </button>
                </div>
                
                <!-- Filtri -->
                <div class="card-body">
                    <div class="grid grid-3 gap-2">
                        <div class="form-group" style="margin: 0;">
                            <label class="form-label">Data Inizio</label>
                            <input type="date" id="filter-start-date" class="form-control" 
                                   onchange="AdminDashboard.applyTimeEntriesFilter()" />
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label class="form-label">Data Fine</label>
                            <input type="date" id="filter-end-date" class="form-control" 
                                   onchange="AdminDashboard.applyTimeEntriesFilter()" />
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label class="form-label">&nbsp;</label>
                            <button class="btn btn-secondary btn-block" onclick="AdminDashboard.clearTimeEntriesFilter()">
                                🔄 Resetta Filtri
                            </button>
                        </div>
                    </div>
                </div>
                
                ${this.timeEntries.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">⏱️</div>
                        <div class="empty-state-text">Nessuna timbratura trovata</div>
                    </div>
                ` : `
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Dipendente</th>
                                    <th>Data</th>
                                    <th>Entrata</th>
                                    <th>Uscita</th>
                                    <th>Ore</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.timeEntries.map(entry => `
                                    <tr>
                                        <td><strong>${escapeHtml(entry.employees?.name || 'Sconosciuto')}</strong></td>
                                        <td>${formatDate(entry.entry_time)}</td>
                                        <td>${formatTime(entry.entry_time)}</td>
                                        <td>
                                            ${entry.exit_time
                ? formatTime(entry.exit_time)
                : '<span class="badge badge-success">In corso</span>'}
                                        </td>
                                        <td>${entry.hours_worked ? formatHours(entry.hours_worked) : '-'}</td>
                                        <td>
                                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem; min-height: auto;" 
                                                    onclick="AdminDashboard.showEditTimeEntryModal('${entry.id}')">
                                                ✏️ Modifica
                                            </button>
                                            <button class="btn btn-danger" style="padding: 0.5rem 1rem; min-height: auto;" 
                                                    onclick="AdminDashboard.confirmDeleteTimeEntry('${entry.id}')">
                                                🗑️ Elimina
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    },

    /**
     * Tab Report
     */
    renderReportsTab() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Esportazione Report</h3>
                </div>
                
                <div class="card-body">
                    <p class="text-muted">Seleziona il periodo da esportare in Excel</p>
                    
                    <div class="grid grid-2 gap-3 mt-3">
                        <!-- Settimana Corrente -->
                        <div class="card" style="background: var(--bg-tertiary);">
                            <h4>📅 Settimana Corrente</h4>
                            <p class="text-muted" style="font-size: 0.875rem;">
                                ${formatDate(getWeekStart())} - ${formatDate(getWeekEnd())}
                            </p>
                            <button class="btn btn-primary btn-block mt-2" 
                                    onclick="AdminDashboard.exportCurrentWeek()">
                                📥 Esporta Settimana
                            </button>
                        </div>
                        
                        <!-- Settimana Precedente -->
                        <div class="card" style="background: var(--bg-tertiary);">
                            <h4>📅 Settimana Precedente</h4>
                            <p class="text-muted" style="font-size: 0.875rem;">
                                ${formatDate(new Date(getWeekStart().getTime() - 7 * 24 * 60 * 60 * 1000))} - 
                                ${formatDate(new Date(getWeekEnd().getTime() - 7 * 24 * 60 * 60 * 1000))}
                            </p>
                            <button class="btn btn-primary btn-block mt-2" 
                                    onclick="AdminDashboard.exportLastWeek()">
                                📥 Esporta Settimana
                            </button>
                        </div>
                        
                        <!-- Filtro Dipendente -->
                        <div class="card" style="background: var(--bg-tertiary);">
                            <h4>👤 Filtra per Dipendente</h4>
                            <div class="form-group" style="margin: 0.5rem 0;">
                                <select id="report-employee-select" class="form-control" onchange="AdminDashboard.handleReportEmployeeChange(event)">
                                    <option value="">Tutti i dipendenti</option>
                                    ${this.employees.map(emp => `
                                        <option value="${emp.id}" ${this.reportEmployeeId === emp.id ? 'selected' : ''}>
                                            ${escapeHtml(emp.name)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <p class="text-muted" style="font-size: 0.825rem;">
                                Il filtro verrà applicato a tutte le esportazioni sottostanti.
                            </p>
                        </div>
                        
                        <!-- Mese Personalizzato -->
                        <div class="card" style="background: var(--bg-tertiary);">
                            <h4>📅 Mese Personalizzato</h4>
                            <div class="form-group" style="margin: 0.5rem 0;">
                                <input type="month" id="custom-month" class="form-control" />
                            </div>
                            <button class="btn btn-primary btn-block mt-2" 
                                    onclick="AdminDashboard.exportCustomMonth()">
                                📥 Esporta Mese
                            </button>
                        </div>
                    </div>
                    
                    <!-- Periodo Personalizzato -->
                    <div class="card mt-3" style="background: var(--bg-tertiary);">
                        <h4>📅 Periodo Personalizzato</h4>
                        <div class="grid grid-2 gap-2 mt-2">
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">Data Inizio</label>
                                <input type="date" id="custom-start-date" class="form-control" />
                            </div>
                            <div class="form-group" style="margin: 0;">
                                <label class="form-label">Data Fine</label>
                                <input type="date" id="custom-end-date" class="form-control" />
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block mt-2" 
                                onclick="AdminDashboard.exportCustomPeriod()">
                            📥 Esporta Periodo
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Cambia tab
     */
    async switchTab(tab) {
        this.currentTab = tab;

        // Ricarica dati se necessario
        if (tab === 'timeentries') {
            await this.loadTimeEntries(this.filterStartDate, this.filterEndDate);
        }

        // Re-render solo il contenuto del tab
        const tabContent = document.getElementById('tab-content');
        tabContent.innerHTML = this.renderTabContent();
    },

    /**
     * Applica filtro timbrature
     */
    async applyTimeEntriesFilter() {
        const startDateInput = document.getElementById('filter-start-date').value;
        const endDateInput = document.getElementById('filter-end-date').value;

        this.filterStartDate = startDateInput ? new Date(startDateInput) : null;
        this.filterEndDate = endDateInput ? new Date(endDateInput) : null;

        showLoading();
        await this.loadTimeEntries(this.filterStartDate, this.filterEndDate);
        hideLoading();

        this.switchTab('timeentries');
    },

    /**
     * Gestisce il cambio del dipendente nel tab report
     */
    handleReportEmployeeChange(event) {
        this.reportEmployeeId = event.target.value || null;
    },

    /**
     * Resetta filtro timbrature
     */
    async clearTimeEntriesFilter() {
        this.filterStartDate = null;
        this.filterEndDate = null;

        showLoading();
        await this.loadTimeEntries();
        hideLoading();

        this.switchTab('timeentries');
    },

    // ========================================
    // EMPLOYEE MANAGEMENT
    // ========================================

    /**
     * Mostra modal aggiungi dipendente
     */
    showAddEmployeeModal() {
        this.showModal('Nuovo Dipendente', `
            <form id="employee-form" onsubmit="AdminDashboard.saveEmployee(event)">
                <div class="form-group">
                    <label class="form-label">Nome Completo *</label>
                    <input type="text" id="employee-name" class="form-control" required />
                </div>
                
                <div class="form-group">
                    <label class="form-label">Password *</label>
                    <input type="password" id="employee-password" class="form-control" required />
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="employee-active" checked /> Attivo
                    </label>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="AdminDashboard.closeModal()">
                        Annulla
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Salva
                    </button>
                </div>
            </form>
        `);
    },

    /**
     * Mostra modal modifica dipendente
     */
    showEditEmployeeModal(employeeId) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) return;

        this.showModal('Modifica Dipendente', `
            <form id="employee-form" onsubmit="AdminDashboard.updateEmployee(event, '${employeeId}')">
                <div class="form-group">
                    <label class="form-label">Nome Completo *</label>
                    <input type="text" id="employee-name" class="form-control" 
                           value="${escapeHtml(employee.name)}" required />
                </div>
                
                <div class="form-group">
                    <label class="form-label">Nuova Password (lascia vuoto per non modificare)</label>
                    <input type="password" id="employee-password" class="form-control" />
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="employee-active" ${employee.active ? 'checked' : ''} /> Attivo
                    </label>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="AdminDashboard.closeModal()">
                        Annulla
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Salva Modifiche
                    </button>
                </div>
            </form>
        `);
    },

    /**
     * Salva nuovo dipendente
     */
    async saveEmployee(event) {
        event.preventDefault();

        const name = document.getElementById('employee-name').value.trim();
        const password = document.getElementById('employee-password').value;
        const active = document.getElementById('employee-active').checked;

        try {
            showLoading();

            await Database.createEmployee(name, password);
            await this.loadEmployees();

            this.closeModal();
            hideLoading();

            showAlert('Dipendente creato con successo! ✅', 'success');
            this.switchTab('employees');

        } catch (error) {
            hideLoading();
            console.error('Errore creazione dipendente:', error);
            showAlert('Errore durante la creazione', 'error');
        }
    },

    /**
     * Aggiorna dipendente
     */
    async updateEmployee(event, employeeId) {
        event.preventDefault();

        const name = document.getElementById('employee-name').value.trim();
        const password = document.getElementById('employee-password').value;
        const active = document.getElementById('employee-active').checked;

        const updates = { name, active };
        if (password) {
            updates.password = password;
        }

        try {
            showLoading();

            await Database.updateEmployee(employeeId, updates);
            await this.loadEmployees();

            this.closeModal();
            hideLoading();

            showAlert('Dipendente aggiornato con successo! ✅', 'success');
            this.switchTab('employees');

        } catch (error) {
            hideLoading();
            console.error('Errore aggiornamento dipendente:', error);
            showAlert('Errore durante l\'aggiornamento', 'error');
        }
    },

    /**
     * Conferma eliminazione dipendente
     */
    confirmDeleteEmployee(employeeId, employeeName) {
        this.showModal('Conferma Eliminazione', `
            <p>Sei sicuro di voler eliminare il dipendente <strong>${escapeHtml(employeeName)}</strong>?</p>
            <p class="text-danger">⚠️ Questa azione eliminerà anche tutte le timbrature associate!</p>
            
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="AdminDashboard.closeModal()">
                    Annulla
                </button>
                <button class="btn btn-danger" onclick="AdminDashboard.deleteEmployee('${employeeId}')">
                    Elimina
                </button>
            </div>
        `);
    },

    /**
     * Elimina dipendente
     */
    async deleteEmployee(employeeId) {
        try {
            showLoading();

            await Database.deleteEmployee(employeeId);
            await this.loadEmployees();

            this.closeModal();
            hideLoading();

            showAlert('Dipendente eliminato con successo', 'success');
            this.switchTab('employees');

        } catch (error) {
            hideLoading();
            console.error('Errore eliminazione dipendente:', error);
            showAlert('Errore durante l\'eliminazione', 'error');
        }
    },

    // ========================================
    // TIME ENTRY MANAGEMENT
    // ========================================

    /**
     * Mostra modal aggiungi timbratura
     */
    showAddTimeEntryModal() {
        const employeeOptions = this.employees
            .filter(e => e.active)
            .map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`)
            .join('');

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().slice(0, 5);

        this.showModal('Nuova Timbratura', `
            <form id="timeentry-form" onsubmit="AdminDashboard.saveTimeEntry(event)">
                <div class="form-group">
                    <label class="form-label">Dipendente *</label>
                    <select id="timeentry-employee" class="form-control" required>
                        <option value="">Seleziona dipendente</option>
                        ${employeeOptions}
                    </select>
                </div>
                
                <div class="grid grid-2 gap-2">
                    <div class="form-group">
                        <label class="form-label">Data Entrata *</label>
                        <input type="date" id="timeentry-entry-date" class="form-control" 
                               value="${dateStr}" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ora Entrata *</label>
                        <input type="time" id="timeentry-entry-time" class="form-control" 
                               value="${timeStr}" required />
                    </div>
                </div>
                
                <div class="grid grid-2 gap-2">
                    <div class="form-group">
                        <label class="form-label">Data Uscita</label>
                        <input type="date" id="timeentry-exit-date" class="form-control" 
                               value="${dateStr}" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ora Uscita</label>
                        <input type="time" id="timeentry-exit-time" class="form-control" />
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Note</label>
                    <textarea id="timeentry-notes" class="form-control" rows="2"></textarea>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="AdminDashboard.closeModal()">
                        Annulla
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Salva
                    </button>
                </div>
            </form>
        `);
    },

    /**
     * Mostra modal modifica timbratura
     */
    async showEditTimeEntryModal(entryId) {
        const entry = this.timeEntries.find(e => e.id === entryId);
        if (!entry) return;

        const employeeOptions = this.employees
            .map(e => `<option value="${e.id}" ${e.id === entry.employee_id ? 'selected' : ''}>${escapeHtml(e.name)}</option>`)
            .join('');

        const entryDate = new Date(entry.entry_time);
        const entryDateStr = entryDate.toISOString().split('T')[0];
        const entryTimeStr = entryDate.toTimeString().slice(0, 5);

        let exitDateStr = '';
        let exitTimeStr = '';
        if (entry.exit_time) {
            const exitDate = new Date(entry.exit_time);
            exitDateStr = exitDate.toISOString().split('T')[0];
            exitTimeStr = exitDate.toTimeString().slice(0, 5);
        }

        this.showModal('Modifica Timbratura', `
            <form id="timeentry-form" onsubmit="AdminDashboard.updateTimeEntry(event, '${entryId}')">
                <div class="form-group">
                    <label class="form-label">Dipendente *</label>
                    <select id="timeentry-employee" class="form-control" required>
                        ${employeeOptions}
                    </select>
                </div>
                
                <div class="grid grid-2 gap-2">
                    <div class="form-group">
                        <label class="form-label">Data Entrata *</label>
                        <input type="date" id="timeentry-entry-date" class="form-control" 
                               value="${entryDateStr}" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ora Entrata *</label>
                        <input type="time" id="timeentry-entry-time" class="form-control" 
                               value="${entryTimeStr}" required />
                    </div>
                </div>
                
                <div class="grid grid-2 gap-2">
                    <div class="form-group">
                        <label class="form-label">Data Uscita</label>
                        <input type="date" id="timeentry-exit-date" class="form-control" 
                               value="${exitDateStr}" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ora Uscita</label>
                        <input type="time" id="timeentry-exit-time" class="form-control" 
                               value="${exitTimeStr}" />
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Note</label>
                    <textarea id="timeentry-notes" class="form-control" rows="2">${escapeHtml(entry.notes || '')}</textarea>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="AdminDashboard.closeModal()">
                        Annulla
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Salva Modifiche
                    </button>
                </div>
            </form>
        `);
    },

    /**
     * Salva nuova timbratura
     */
    async saveTimeEntry(event) {
        event.preventDefault();

        const employeeId = document.getElementById('timeentry-employee').value;
        const entryDate = document.getElementById('timeentry-entry-date').value;
        const entryTime = document.getElementById('timeentry-entry-time').value;
        const exitDate = document.getElementById('timeentry-exit-date').value;
        const exitTime = document.getElementById('timeentry-exit-time').value;
        const notes = document.getElementById('timeentry-notes').value.trim();

        const entryDateTime = new Date(`${entryDate}T${entryTime}`);
        const exitDateTime = (exitDate && exitTime) ? new Date(`${exitDate}T${exitTime}`) : null;

        try {
            showLoading();

            await Database.createTimeEntry(employeeId, entryDateTime, exitDateTime, notes);
            await this.loadTimeEntries(this.filterStartDate, this.filterEndDate);

            this.closeModal();
            hideLoading();

            showAlert('Timbratura creata con successo! ✅', 'success');
            this.switchTab('timeentries');

        } catch (error) {
            hideLoading();
            console.error('Errore creazione timbratura:', error);
            showAlert('Errore durante la creazione', 'error');
        }
    },

    /**
     * Aggiorna timbratura
     */
    async updateTimeEntry(event, entryId) {
        event.preventDefault();

        const employeeId = document.getElementById('timeentry-employee').value;
        const entryDate = document.getElementById('timeentry-entry-date').value;
        const entryTime = document.getElementById('timeentry-entry-time').value;
        const exitDate = document.getElementById('timeentry-exit-date').value;
        const exitTime = document.getElementById('timeentry-exit-time').value;
        const notes = document.getElementById('timeentry-notes').value.trim();

        const entryDateTime = new Date(`${entryDate}T${entryTime}`).toISOString();
        const exitDateTime = (exitDate && exitTime) ? new Date(`${exitDate}T${exitTime}`).toISOString() : null;

        const updates = {
            employee_id: employeeId,
            entry_time: entryDateTime,
            exit_time: exitDateTime,
            notes: notes
        };

        try {
            showLoading();

            await Database.updateTimeEntry(entryId, updates);
            await this.loadTimeEntries(this.filterStartDate, this.filterEndDate);

            this.closeModal();
            hideLoading();

            showAlert('Timbratura aggiornata con successo! ✅', 'success');
            this.switchTab('timeentries');

        } catch (error) {
            hideLoading();
            console.error('Errore aggiornamento timbratura:', error);
            showAlert('Errore durante l\'aggiornamento', 'error');
        }
    },

    /**
     * Conferma eliminazione timbratura
     */
    confirmDeleteTimeEntry(entryId) {
        this.showModal('Conferma Eliminazione', `
            <p>Sei sicuro di voler eliminare questa timbratura?</p>
            
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="AdminDashboard.closeModal()">
                    Annulla
                </button>
                <button class="btn btn-danger" onclick="AdminDashboard.deleteTimeEntry('${entryId}')">
                    Elimina
                </button>
            </div>
        `);
    },

    /**
     * Elimina timbratura
     */
    async deleteTimeEntry(entryId) {
        try {
            showLoading();

            await Database.deleteTimeEntry(entryId);
            await this.loadTimeEntries(this.filterStartDate, this.filterEndDate);

            this.closeModal();
            hideLoading();

            showAlert('Timbratura eliminata con successo', 'success');
            this.switchTab('timeentries');

        } catch (error) {
            hideLoading();
            console.error('Errore eliminazione timbratura:', error);
            showAlert('Errore durante l\'eliminazione', 'error');
        }
    },

    // ========================================
    // EXPORT FUNCTIONS
    // ========================================

    /**
     * Esporta settimana corrente
     */
    async exportCurrentWeek() {
        const start = getWeekStart();
        const end = getWeekEnd();
        await this.exportPeriod(start, end, `Settimana_${formatDate(start).replace(/\//g, '-')}`);
    },

    /**
     * Esporta settimana precedente
     */
    async exportLastWeek() {
        const start = new Date(getWeekStart().getTime() - 7 * 24 * 60 * 60 * 1000);
        const end = new Date(getWeekEnd().getTime() - 7 * 24 * 60 * 60 * 1000);
        await this.exportPeriod(start, end, `Settimana_${formatDate(start).replace(/\//g, '-')}`);
    },

    /**
     * Esporta mese corrente
     */
    async exportCurrentMonth() {
        const start = getMonthStart();
        const end = getMonthEnd();
        const monthName = getMonthName(start.getMonth());
        await this.exportPeriod(start, end, `${monthName}_${start.getFullYear()}`);
    },

    /**
     * Esporta mese personalizzato
     */
    async exportCustomMonth() {
        const monthInput = document.getElementById('custom-month').value;
        if (!monthInput) {
            showAlert('Seleziona un mese', 'warning');
            return;
        }

        const [year, month] = monthInput.split('-');
        const start = new Date(parseInt(year), parseInt(month) - 1, 1);
        const end = new Date(parseInt(year), parseInt(month), 0);
        const monthName = getMonthName(start.getMonth());

        await this.exportPeriod(start, end, `${monthName}_${year}`);
    },

    /**
     * Esporta periodo personalizzato
     */
    async exportCustomPeriod() {
        const startInput = document.getElementById('custom-start-date').value;
        const endInput = document.getElementById('custom-end-date').value;

        if (!startInput || !endInput) {
            showAlert('Seleziona entrambe le date', 'warning');
            return;
        }

        const start = new Date(startInput);
        const end = new Date(endInput);

        await this.exportPeriod(start, end, `Report_${formatDate(start).replace(/\//g, '-')}_${formatDate(end).replace(/\//g, '-')}`);
    },

    /**
     * Esporta un periodo specifico
     */
    async exportPeriod(startDate, endDate, filename) {
        try {
            showLoading();

            const report = await Database.getHoursReport(startDate, endDate, this.reportEmployeeId);

            if (report.length === 0) {
                hideLoading();
                showAlert('Nessun dato da esportare per il periodo selezionato', 'warning');
                return;
            }

            // Usa la funzione di export Excel
            await ExcelExport.exportReport(report, startDate, endDate, filename);

            hideLoading();
            showAlert('Report esportato con successo! 📥', 'success');

        } catch (error) {
            hideLoading();
            console.error('Errore esportazione:', error);
            showAlert('Errore durante l\'esportazione', 'error');
        }
    },

    /**
     * Tab Impostazioni
     */
    renderSettingsTab() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Impostazioni Account</h3>
                </div>
                <div class="card-body">
                    <div class="container-sm" style="max-width: 500px; margin: 0 auto;">
                        <h4 class="mb-3">🔐 Cambia Password Amministratore</h4>
                        <p class="text-muted mb-3">Inserisci la nuova password per il tuo account.</p>
                        
                        <form id="change-password-form" onsubmit="AdminDashboard.updateAdminPassword(event)">
                            <div class="form-group">
                                <label class="form-label">Nuova Password</label>
                                <input type="password" id="new-admin-password" class="form-control" placeholder="Nuova password" required />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Conferma Nuova Password</label>
                                <input type="password" id="confirm-admin-password" class="form-control" placeholder="Conferma nuova password" required />
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">
                                Aggiorna Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Aggiorna password admin
     */
    async updateAdminPassword(event) {
        event.preventDefault();

        const password = document.getElementById('new-admin-password').value;
        const confirm = document.getElementById('confirm-admin-password').value;

        if (password !== confirm) {
            showAlert('Le password non coincidono', 'warning');
            return;
        }

        if (password.length < 4) {
            showAlert('La password deve essere di almeno 4 caratteri', 'warning');
            return;
        }

        try {
            showLoading();

            await Database.changeAdminPassword(this.admin.id, password);

            hideLoading();
            showAlert('Password aggiornata con successo! ✅', 'success');

            // Pulisci i campi
            document.getElementById('new-admin-password').value = '';
            document.getElementById('confirm-admin-password').value = '';

        } catch (error) {
            hideLoading();
            console.error('Errore durante il cambio password admin:', error);
            showAlert('Errore durante l\'aggiornamento della password', 'error');
        }
    },

    /**
     * Utility: Mostra modal
     */
    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'admin-modal';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="AdminDashboard.closeModal()">✕</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Click fuori per chiudere
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    },

    /**
     * Chiudi modal
     */
    closeModal() {
        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Logout
     */
    logout() {
        Session.clearAdmin();
        router.navigate('admin-login');
    }
};

// Export globale
window.AdminDashboard = AdminDashboard;
