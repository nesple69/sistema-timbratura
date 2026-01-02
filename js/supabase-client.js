// ========================================
// Supabase Client Initialization
// ========================================

// Verifica che la configurazione sia presente
if (typeof SUPABASE_CONFIG === 'undefined') {
    console.error('SUPABASE_CONFIG non trovato! Assicurati di aver caricato config.js');
}

// Inizializza il client Supabase
// NOTA: Usiamo una variabile temporanea per evitare conflitti con la globale 'supabase' del CDN
try {
    if (window.supabase && window.supabase.createClient) {
        const _client = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );

        // Sovrascrivi la globale con l'istanza del client
        window.supabase = _client;
        console.log('Supabase connesso correttamente');
    } else {
        console.error('Libreria Supabase non caricata correttamente o createClient mancante');
    }
} catch (error) {
    console.error('Errore inizializzazione Supabase:', error);
}

