// Configurazione Supabase
// IMPORTANTE: Sostituisci questi valori con le tue credenziali Supabase
// Le trovi nel tuo progetto Supabase -> Settings -> API

const SUPABASE_CONFIG = {
    url: 'https://wmtwvbcmxzsgkgpekrix.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtdHd2YmNteHpzZ2tncGVrcml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODE5ODYsImV4cCI6MjA4MTQ1Nzk4Nn0.xoruVxYevYbJFq_I7tT2lr_pG_PEWg3C7v-VkKS_b2Q'
};

// Configurazione applicazione
const APP_CONFIG = {
    appName: 'Sistema Timbrature',
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 ore in millisecondi
    defaultAdminUsername: 'admin',
    defaultAdminPassword: 'admin123' // CAMBIA QUESTA PASSWORD dopo il primo login!
};
