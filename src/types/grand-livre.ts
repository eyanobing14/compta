export interface GrandLivreLine {
  id: number;
  date: string;
  libelle: string;
  numero_piece: string | null;
  debit: number | null;
  credit: number | null;
  solde: number;
  sens: "Débiteur" | "Créditeur";
}

export interface GrandLivreCompte {
  compte_numero: string;
  compte_libelle: string;
  type_compte: string;
  lignes: GrandLivreLine[];
  total_debit: number;
  total_credit: number;
  solde_final: number;
  sens_final: "Débiteur" | "Créditeur";
}

export interface GrandLivreFilters {
  compte?: string;
  date_debut?: string;
  date_fin?: string;
}

export type SortField = "date" | "montant" | "libelle";
export type SortDirection = "asc" | "desc";
