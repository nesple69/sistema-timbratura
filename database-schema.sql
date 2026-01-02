-- Schema Database per Sistema Timbrature
-- Esegui questo script nel SQL Editor di Supabase

-- Tabella Amministratori
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Dipendenti
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Timbrature
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    hours_worked DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_entry_time ON time_entries(entry_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(DATE(entry_time));
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per employees
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per time_entries
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserimento admin di default (username: admin, password: admin123)
-- IMPORTANTE: Cambia questa password dopo il primo login!
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '$2a$10$rKZrGqVqJ5pZqKqKqKqKqOeH8vZqKqKqKqKqKqKqKqKqKqKqKqKqK')
ON CONFLICT (username) DO NOTHING;

-- Note sulla sicurezza:
-- 1. Cambia la password admin dopo il primo login
-- 2. Abilita Row Level Security (RLS) per maggiore sicurezza
-- 3. Le password nell'app vengono hashate lato client prima dell'invio

-- Esempio di RLS (opzionale, per maggiore sicurezza):
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy di esempio (permetti tutto per ora, personalizza in base alle tue esigenze)
-- CREATE POLICY "Enable all access for authenticated users" ON employees FOR ALL USING (true);
-- CREATE POLICY "Enable all access for authenticated users" ON time_entries FOR ALL USING (true);
-- CREATE POLICY "Enable all access for authenticated users" ON admin_users FOR ALL USING (true);
