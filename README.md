# 🕐 Sistema Timbrature Dipendenti

Sistema completo per la gestione delle timbrature dei dipendenti con interfaccia tablet e dashboard amministratore.

## ✨ Caratteristiche

### Per i Dipendenti
- 👤 Login con selezione visuale e password personale
- ⏱️ Timbratura entrata/uscita con un click
- 🌙 Calcolo automatico ore per turni notturni (oltre mezzanotte)
- 📊 Visualizzazione ore lavorate in tempo reale
- 📱 Interfaccia ottimizzata per tablet

### Per gli Amministratori
- 🔐 Dashboard protetta con autenticazione
- 👥 Gestione completa dipendenti (CRUD con password)
- ⏰ Gestione timbrature (visualizza, modifica, elimina, aggiungi manualmente)
- 📥 Esportazione report Excel con filtri:
  - Settimana corrente/precedente
  - Mese corrente/personalizzato
  - Periodo personalizzato
- 📈 Report dettagliati con totali ore per dipendente

## 🚀 Setup Iniziale

### 1. Configurazione Supabase

#### Crea un progetto Supabase
1. Vai su [supabase.com](https://supabase.com)
2. Crea un nuovo progetto
3. Annota l'URL e la chiave API (anon/public)

#### Crea le tabelle del database
1. Nel tuo progetto Supabase, vai su **SQL Editor**
2. Copia e incolla il contenuto del file `database-schema.sql`
3. Esegui lo script

#### Configura l'applicazione
1. Apri il file `config.js`
2. Sostituisci i valori con le tue credenziali:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://tuoprogetto.supabase.co',
    anonKey: 'tua-chiave-anon-key'
};
```

### 2. Avvio dell'Applicazione

#### Opzione A: Server locale con npx
```bash
npx -y serve .
```
Poi apri il browser su `http://localhost:3000`

#### Opzione B: Estensione Live Server (VS Code)
1. Installa l'estensione "Live Server"
2. Click destro su `index.html` → "Open with Live Server"

#### Opzione C: Qualsiasi web server
Puoi usare qualsiasi web server (Apache, Nginx, IIS, ecc.)

## 📱 Utilizzo

### Primo Accesso Amministratore

**Credenziali di default:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANTE**: Cambia questa password dopo il primo accesso!

### Flusso Dipendente

1. Dalla home, seleziona "Dipendente"
2. Seleziona il tuo nome dalla griglia
3. Inserisci la tua password
4. Timbra entrata/uscita

### Flusso Amministratore

1. Dalla home, seleziona "Amministratore"
2. Inserisci username e password
3. Accedi alla dashboard con 3 sezioni:
   - **Dipendenti**: Gestisci l'anagrafica
   - **Timbrature**: Visualizza e modifica le timbrature
   - **Report**: Esporta i dati in Excel

## 🎨 Personalizzazione

### Logo Aziendale
Sostituisci il file `assets/logo.png` con il tuo logo aziendale.
Formati supportati: PNG, JPG, SVG
Dimensioni consigliate: 200x50px

### Colori
Modifica le variabili CSS in `styles.css`:
```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --primary-color: #667eea;
    /* ... altri colori ... */
}
```

## 🔧 Struttura Progetto

```
test timbrature/
├── index.html              # Pagina principale
├── styles.css              # Stili globali
├── config.js               # Configurazione Supabase
├── database-schema.sql     # Schema database
├── assets/
│   └── logo.png           # Logo aziendale
└── js/
    ├── utils.js           # Funzioni utility
    ├── router.js          # Routing client-side
    ├── supabase-client.js # Client Supabase
    ├── database.js        # Servizio database
    ├── employee-login.js  # Login dipendenti
    ├── employee-tracking.js # Timbrature dipendenti
    ├── admin-login.js     # Login admin
    ├── admin-dashboard.js # Dashboard admin
    └── excel-export.js    # Esportazione Excel
```

## 📊 Database Schema

### Tabella `employees`
- `id` (UUID): Identificativo univoco
- `name` (VARCHAR): Nome completo
- `password_hash` (TEXT): Password hashata
- `active` (BOOLEAN): Stato attivo/disattivato
- `created_at` (TIMESTAMP): Data creazione

### Tabella `time_entries`
- `id` (UUID): Identificativo univoco
- `employee_id` (UUID): Riferimento dipendente
- `entry_time` (TIMESTAMP): Orario entrata
- `exit_time` (TIMESTAMP): Orario uscita (nullable)
- `hours_worked` (DECIMAL): Ore lavorate
- `notes` (TEXT): Note (nullable)
- `created_at` (TIMESTAMP): Data creazione

### Tabella `admin_users`
- `id` (UUID): Identificativo univoco
- `username` (VARCHAR): Username
- `password_hash` (TEXT): Password hashata
- `created_at` (TIMESTAMP): Data creazione

## 🔒 Sicurezza

- ✅ Password hashate con SHA-256
- ✅ Sessioni con timeout (8 ore)
- ✅ Validazione input lato client
- ✅ Protezione route con autenticazione
- ⚠️ Per produzione, considera:
  - Abilitare Row Level Security (RLS) su Supabase
  - Usare HTTPS
  - Implementare rate limiting
  - Usare algoritmi di hashing più robusti (bcrypt/argon2)

## 🌙 Gestione Turni Notturni

Il sistema calcola correttamente le ore anche per turni che attraversano la mezzanotte.

**Esempio:**
- Entrata: 22:00
- Uscita: 02:00 (giorno successivo)
- Ore calcolate: 4 ore ✅

## 📥 Esportazione Excel

I report Excel includono due fogli:
1. **Riepilogo**: Totale ore per dipendente
2. **Dettaglio**: Tutte le timbrature con date e orari

## 🐛 Troubleshooting

### Errore "Supabase client non inizializzato"
- Verifica di aver configurato correttamente `config.js`
- Controlla che le credenziali Supabase siano corrette
- Verifica la connessione internet

### Errore "Dipendente non trovato"
- Assicurati di aver eseguito lo script SQL
- Verifica che ci siano dipendenti attivi nel database

### Le timbrature non vengono salvate
- Controlla la console del browser per errori
- Verifica le credenziali Supabase
- Controlla i permessi del database

### L'esportazione Excel non funziona
- Verifica che la libreria SheetJS sia caricata
- Controlla la console per errori
- Assicurati che ci siano dati nel periodo selezionato

## 📞 Supporto

Per problemi o domande:
1. Controlla la console del browser (F12)
2. Verifica i log di Supabase
3. Controlla che tutte le dipendenze siano caricate

## 📝 Note Tecniche

- **Framework**: Vanilla JavaScript (no framework)
- **Database**: Supabase (PostgreSQL)
- **Librerie esterne**:
  - Supabase JS Client
  - SheetJS (xlsx) per Excel
- **Browser supportati**: Chrome, Firefox, Edge, Safari (ultimi 2 versioni)

## 🎯 Roadmap Future

Possibili miglioramenti futuri:
- [ ] Notifiche push per promemoria timbrature
- [ ] Grafici statistiche ore lavorate
- [ ] Gestione ferie e permessi
- [ ] App mobile nativa
- [ ] Riconoscimento facciale
- [ ] Geolocalizzazione timbrature
- [ ] Multi-tenant per più aziende

## 📄 Licenza

Questo progetto è fornito "as-is" senza garanzie.

---

**Sviluppato con ❤️ per semplificare la gestione delle timbrature**
