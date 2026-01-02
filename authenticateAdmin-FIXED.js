// SOLUZIONE RAPIDA: Copia questo codice e sostituisci la funzione authenticateAdmin

    /**
     * Autentica un amministratore
     */
    async authenticateAdmin(username, password) {
    try {
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', username)
            .single();

        if (error) throw error;

        if (!data) {
            throw new Error('Utente non trovato');
        }

        const passwordHash = await hashPassword(password);

        console.log('DEBUG - Password inserita:', password);
        console.log('DEBUG - Hash calcolato:', passwordHash);
        console.log('DEBUG - Hash nel database:', data.password_hash);

        if (passwordHash !== data.password_hash) {
            throw new Error('Password errata');
        }

        // Rimuovi la password dall'oggetto restituito
        delete data.password_hash;

        return data;
    } catch (error) {
        console.error('Errore autenticazione admin:', error);
        throw error;
    }
},
