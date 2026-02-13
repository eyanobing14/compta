export interface Ecriture {
  id: number;
  date: string;
  libelle: string;
  compte_debit: string;
  compte_credit: string;
  montant: number;
  observation: string | null;
  created_at: string;
  // Jointures optionnelles
  debit_libelle?: string;
  credit_libelle?: string;
}

export interface EcritureFormData {
  date: string;
  libelle: string;
  compte_debit: string;
  compte_credit: string;
  montant: string;
  numero_piece: string; // <-- Ajouter // string pour la gestion du formulaire
  observation: string;
}

export interface EcritureFilters {
  dateDebut?: string;
  dateFin?: string;
  compte?: string;
  searchTerm?: string;
}
