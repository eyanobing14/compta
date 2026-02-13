-- Supprimer les tables si elles existent (pour le développement)
DROP TABLE IF EXISTS backups;
DROP TABLE IF EXISTS ecritures;
DROP TABLE IF EXISTS utilisateurs;
DROP TABLE IF EXISTS comptes;

-- Table des comptes
CREATE TABLE comptes (
    numero TEXT PRIMARY KEY,
    libelle TEXT NOT NULL,
    type_compte TEXT CHECK(type_compte IN ('ACTIF', 'PASSIF', 'PRODUIT', 'CHARGE', 'TRESORERIE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_utilisateur TEXT NOT NULL UNIQUE,
    mot_de_passe_hash TEXT NOT NULL,
    sel TEXT NOT NULL,
    est_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des écritures
CREATE TABLE ecritures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    libelle TEXT NOT NULL,
    compte_debit TEXT NOT NULL,
    compte_credit TEXT NOT NULL,
    montant REAL NOT NULL CHECK(montant > 0),
    numero_piece TEXT,  -- Nouvelle colonne
    observation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compte_debit) REFERENCES comptes(numero),
    FOREIGN KEY (compte_credit) REFERENCES comptes(numero),
    CHECK (compte_debit != compte_credit)
);

-- Table des sauvegardes
CREATE TABLE backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_fichier TEXT NOT NULL,
    chemin TEXT NOT NULL,
    taille INTEGER,
    date_backup TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    commentaire TEXT
);

-- Index pour améliorer les performances
CREATE INDEX idx_ecritures_date ON ecritures(date);
CREATE INDEX idx_ecritures_compte_debit ON ecritures(compte_debit);
CREATE INDEX idx_ecritures_compte_credit ON ecritures(compte_credit);
CREATE INDEX idx_ecritures_numero_piece ON ecritures(numero_piece);

