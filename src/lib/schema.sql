-- Supprimer les tables si elles existent
DROP TABLE IF EXISTS backups;
DROP TABLE IF EXISTS ecritures;
DROP TABLE IF EXISTS utilisateurs;
DROP TABLE IF EXISTS comptes;
DROP TABLE IF EXISTS exercices;

-- Table des exercices comptables
CREATE TABLE exercices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_entreprise TEXT NOT NULL DEFAULT 'Mon Entreprise',
    nom_exercice TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    est_clos BOOLEAN DEFAULT FALSE,
    est_actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    closed_by INTEGER,
    CHECK (date_debut < date_fin),
    FOREIGN KEY (closed_by) REFERENCES utilisateurs(id)
);

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

-- Table des écritures (avec exercice_id)
CREATE TABLE ecritures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercice_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    libelle TEXT NOT NULL,
    compte_debit TEXT NOT NULL,
    compte_credit TEXT NOT NULL,
    montant REAL NOT NULL CHECK(montant > 0),
    numero_piece TEXT,
    observation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (exercice_id) REFERENCES exercices(id),
    FOREIGN KEY (compte_debit) REFERENCES comptes(numero),
    FOREIGN KEY (compte_credit) REFERENCES comptes(numero),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
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
CREATE INDEX idx_ecritures_exercice ON ecritures(exercice_id);
CREATE INDEX idx_ecritures_compte_debit ON ecritures(compte_debit);
CREATE INDEX idx_ecritures_compte_credit ON ecritures(compte_credit);
CREATE INDEX idx_ecritures_numero_piece ON ecritures(numero_piece);
CREATE INDEX idx_ecritures_created_by ON ecritures(created_by);

-- Insérer le plan comptable de base
INSERT INTO comptes (numero, libelle, type_compte) VALUES
-- COMPTES DE TRESORERIE
('511', 'Banque', 'TRESORERIE'),
('512', 'Caisse', 'TRESORERIE'),
-- COMPTES DE PASSIF
('401', 'Fournisseurs', 'PASSIF'),
('421', 'Personnel', 'PASSIF'),
('431', 'Sécurité sociale', 'PASSIF'),
('441', 'État - Impôts', 'PASSIF'),
-- COMPTES D'ACTIF
('211', 'Terrains', 'ACTIF'),
('213', 'Constructions', 'ACTIF'),
('215', 'Matériel', 'ACTIF'),
('31', 'Stocks', 'ACTIF'),
('411', 'Clients', 'ACTIF'),
-- COMPTES DE CHARGES
('601', 'Achats de marchandises', 'CHARGE'),
('606', 'Achats non stockés', 'CHARGE'),
('61', 'Services extérieurs', 'CHARGE'),
('64', 'Charges de personnel', 'CHARGE'),
-- COMPTES DE PRODUITS
('701', 'Ventes de marchandises', 'PRODUIT'),
('706', 'Prestations de services', 'PRODUIT');

