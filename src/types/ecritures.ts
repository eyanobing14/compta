export interface Ecriture {
  id: number;
  date: string;
  libelle: string;
  compte_debit: string;
  compte_credit: string;
  montant: number;
  numero_piece: string | null;
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
  numero_piece: string;
  observation: string;
}

export interface EcritureFilters {
  dateDebut?: string;
  dateFin?: string;
  compte?: string;
  searchTerm?: string;
  // Nouveaux filtres
  compteDebit?: string;
  compteCredit?: string;
  montantMin?: number;
  montantMax?: number;
  numeroPiece?: string;
  searchType?: "libelle" | "comptes" | "montant" | "piece"; // Changé "tout" en "libelle"
}
