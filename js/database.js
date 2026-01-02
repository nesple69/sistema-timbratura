// ========================================
// Database Service Layer
// Gestisce tutte le operazioni con Supabase
// ========================================

const Database = {

    // ========================================
    // EMPLOYEES
    // ========================================

    /**
     * Ottieni tutti i dipendenti attivi
     */
    async getActiveEmployees() {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Errore nel recupero dipendenti:', error);
            throw error;
        }
    },

    /**
     * Ottieni tutti i dipendenti (inclusi inattivi)
     */
    async getAllEmployees() {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Errore nel recupero dipendenti:', error);
            throw error;
        }
    },

    /**
     * Ottieni un dipendente per ID
     */
    async getEmployeeById(id) {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            if (!data) throw new Error('Dipendente non trovato nel database.');
            return data;
        } catch (error) {
            console.error('Errore nel recupero dipendente:', error);
            throw error;
        }
    },

    /**
     * Autentica un dipendente
     */
    async authenticateEmployee(employeeId, password) {
        try {
            const employee = await this.getEmployeeById(employeeId);

            if (!employee) {
                throw new Error('Dipendente non trovato');
            }

            if (!employee.active) {
                throw new Error('Account disattivato');
            }

            const passwordHash = await hashPassword(password);

            if (passwordHash !== employee.password_hash) {
                throw new Error(`Password errata. (Debug: ${passwordHash.substring(0, 6)} vs ${employee.password_hash.substring(0, 6)})`);
            }

            // Rimuovi la password dall'oggetto restituito
            delete employee.password_hash;

            return employee;
        } catch (error) {
            console.error('Errore autenticazione dipendente:', error);
            throw error;
        }
    },

    /**
     * Crea un nuovo dipendente
     */
    async createEmployee(name, password) {
        try {
            const passwordHash = await hashPassword(password);

            const { data, error } = await supabase
                .from('employees')
                .insert([{
                    name: name,
                    password_hash: passwordHash,
                    active: true
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore creazione dipendente:', error);
            throw error;
        }
    },

    /**
     * Aggiorna un dipendente
     */
    async updateEmployee(id, updates) {
        try {
            // Se c'è una nuova password, hashala
            if (updates.password) {
                updates.password_hash = await hashPassword(updates.password);
                delete updates.password;
            }

            const { data, error } = await supabase
                .from('employees')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore aggiornamento dipendente:', error);
            throw error;
        }
    },

    /**
     * Elimina un dipendente
     */
    async deleteEmployee(id) {
        try {
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Errore eliminazione dipendente:', error);
            throw error;
        }
    },

    // ========================================
    // TIME ENTRIES
    // ========================================

    /**
     * Ottieni l'ultima timbratura di un dipendente
     */
    async getLastTimeEntry(employeeId) {
        try {
            const { data, error } = await supabase
                .from('time_entries')
                .select('*')
                .eq('employee_id', employeeId)
                .order('entry_time', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                throw error;
            }

            return data || null;
        } catch (error) {
            console.error('Errore recupero ultima timbratura:', error);
            throw error;
        }
    },

    /**
     * Verifica se un dipendente è attualmente in servizio
     */
    async isEmployeeWorking(employeeId) {
        try {
            const lastEntry = await this.getLastTimeEntry(employeeId);

            // Se non ci sono timbrature o l'ultima ha exit_time, non è in servizio
            if (!lastEntry || lastEntry.exit_time) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Errore verifica stato dipendente:', error);
            return false;
        }
    },

    /**
     * Crea una timbratura di entrata
     */
    async clockIn(employeeId) {
        try {
            // Verifica che non sia già in servizio
            const isWorking = await this.isEmployeeWorking(employeeId);
            if (isWorking) {
                throw new Error('Sei già in servizio');
            }

            const { data, error } = await supabase
                .from('time_entries')
                .insert([{
                    employee_id: employeeId,
                    entry_time: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore timbratura entrata:', error);
            throw error;
        }
    },

    /**
     * Crea una timbratura di uscita
     */
    async clockOut(employeeId) {
        try {
            // Trova la timbratura di entrata aperta
            const lastEntry = await this.getLastTimeEntry(employeeId);

            if (!lastEntry || lastEntry.exit_time) {
                throw new Error('Non sei in servizio');
            }

            const exitTime = new Date();
            const hoursWorked = calculateHoursWorked(lastEntry.entry_time, exitTime);

            const { data, error } = await supabase
                .from('time_entries')
                .update({
                    exit_time: exitTime.toISOString(),
                    hours_worked: hoursWorked
                })
                .eq('id', lastEntry.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore timbratura uscita:', error);
            throw error;
        }
    },

    /**
     * Ottieni le timbrature di un dipendente per un periodo
     */
    async getTimeEntries(employeeId, startDate, endDate) {
        try {
            let query = supabase
                .from('time_entries')
                .select('*')
                .eq('employee_id', employeeId)
                .order('entry_time', { ascending: false });

            if (startDate) {
                query = query.gte('entry_time', startDate.toISOString());
            }

            if (endDate) {
                // Aggiungi 1 giorno per includere tutto il giorno finale
                const endDatePlusOne = new Date(endDate);
                endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
                query = query.lt('entry_time', endDatePlusOne.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Errore recupero timbrature:', error);
            throw error;
        }
    },

    /**
     * Ottieni le timbrature di oggi per un dipendente
     */
    async getTodayTimeEntries(employeeId) {
        const today = normalizeDate(new Date());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.getTimeEntries(employeeId, today, today);
    },

    /**
     * Ottieni tutte le timbrature per un periodo (tutti i dipendenti)
     */
    async getAllTimeEntries(startDate, endDate, employeeId = null) {
        try {
            let query = supabase
                .from('time_entries')
                .select(`
                    *,
                    employees (
                        id,
                        name
                    )
                `)
                .order('entry_time', { ascending: false });

            if (employeeId) {
                query = query.eq('employee_id', employeeId);
            }

            if (startDate) {
                query = query.gte('entry_time', startDate.toISOString());
            }

            if (endDate) {
                const endDatePlusOne = new Date(endDate);
                endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
                query = query.lt('entry_time', endDatePlusOne.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Errore recupero tutte le timbrature:', error);
            throw error;
        }
    },

    /**
     * Crea una timbratura manualmente (admin)
     */
    async createTimeEntry(employeeId, entryTime, exitTime, notes = '') {
        try {
            const hoursWorked = exitTime ? calculateHoursWorked(entryTime, exitTime) : null;

            const { data, error } = await supabase
                .from('time_entries')
                .insert([{
                    employee_id: employeeId,
                    entry_time: new Date(entryTime).toISOString(),
                    exit_time: exitTime ? new Date(exitTime).toISOString() : null,
                    hours_worked: hoursWorked,
                    notes: notes
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore creazione timbratura:', error);
            throw error;
        }
    },

    /**
     * Aggiorna una timbratura
     */
    async updateTimeEntry(id, updates) {
        try {
            // Ricalcola le ore se necessario
            if (updates.entry_time || updates.exit_time) {
                const entry = await this.getTimeEntryById(id);
                const entryTime = updates.entry_time || entry.entry_time;
                const exitTime = updates.exit_time || entry.exit_time;

                if (entryTime && exitTime) {
                    updates.hours_worked = calculateHoursWorked(entryTime, exitTime);
                }
            }

            const { data, error } = await supabase
                .from('time_entries')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore aggiornamento timbratura:', error);
            throw error;
        }
    },

    /**
     * Elimina una timbratura
     */
    async deleteTimeEntry(id) {
        try {
            const { error } = await supabase
                .from('time_entries')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Errore eliminazione timbratura:', error);
            throw error;
        }
    },

    /**
     * Ottieni una timbratura per ID
     */
    async getTimeEntryById(id) {
        try {
            const { data, error } = await supabase
                .from('time_entries')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Errore recupero timbratura:', error);
            throw error;
        }
    },

    // ========================================
    // ADMIN
    // ========================================

    /**
     * Autentica un amministratore
     */
    async authenticateAdmin(username, password) {
        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .eq('username', username)
                .maybeSingle(); // Usiamo maybeSingle per evitare l'errore se non trovato

            if (error) throw error;

            if (!data) {
                throw new Error('Utente amministratore non trovato nel database.');
            }

            const passwordHash = await hashPassword(password);

            if (passwordHash !== data.password_hash) {
                // Log di debug visivo (temporaneo per risolvere il problema del tablet)
                console.log('Hash calcolato:', passwordHash);
                console.log('Hash nel DB:', data.password_hash);
                throw new Error(`Password errata. (Debug: ${passwordHash.substring(0, 6)} vs ${data.password_hash.substring(0, 6)})`);
            }

            // Rimuovi la password dall'oggetto restituito
            delete data.password_hash;

            return data;
        } catch (error) {
            console.error('Errore autenticazione admin:', error);
            throw error;
        }
    },

    /**
     * Cambia password admin
     */
    async changeAdminPassword(adminId, newPassword) {
        try {
            const passwordHash = await hashPassword(newPassword);

            const { error } = await supabase
                .from('admin_users')
                .update({ password_hash: passwordHash })
                .eq('id', adminId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Errore cambio password admin:', error);
            throw error;
        }
    },

    // ========================================
    // REPORTS
    // ========================================

    /**
     * Ottieni report ore lavorate per dipendente
     */
    async getHoursReport(startDate, endDate, employeeId = null) {
        try {
            const entries = await this.getAllTimeEntries(startDate, endDate, employeeId);

            // Raggruppa per dipendente
            const report = {};

            entries.forEach(entry => {
                const employeeId = entry.employee_id;
                const employeeName = entry.employees?.name || 'Sconosciuto';

                if (!report[employeeId]) {
                    report[employeeId] = {
                        employeeId: employeeId,
                        employeeName: employeeName,
                        totalHours: 0,
                        entries: []
                    };
                }

                if (entry.hours_worked) {
                    report[employeeId].totalHours += parseFloat(entry.hours_worked);
                }

                report[employeeId].entries.push(entry);
            });

            // Converti in array e ordina per nome
            return Object.values(report).sort((a, b) =>
                a.employeeName.localeCompare(b.employeeName)
            );
        } catch (error) {
            console.error('Errore generazione report:', error);
            throw error;
        }
    }
};

// Export globale
window.Database = Database;
