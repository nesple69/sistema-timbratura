-- Script definitivo per creare admin con password corretta
-- Questo usa l'hash SHA-256 esatto di "admin123"

-- Elimina tutti gli admin esistenti
TRUNCATE TABLE admin_users;

-- Inserisci admin con hash SHA-256 corretto
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');

-- Verifica
SELECT * FROM admin_users;
