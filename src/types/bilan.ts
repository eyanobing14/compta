export interface BilanLine {
  compte_numero: string;
  compte_libelle: string;
  montant_initial: number;
  montant_final: number;
  variation: number;
  variation_pourcentage: number;
}

export interface BilanSection {
  titre: string;
  total_initial: number;
  total_final: number;
  variation: number;
  lignes: BilanLine[];
}

export interface BilanData {
  actif: BilanSection;
  passif: BilanSection;
  capitaux_propres: BilanSection;
  total_actif: {
    initial: number;
    final: number;
    variation: number;
  };
  total_passif: {
    initial: number;
    final: number;
    variation: number;
  };
  dates: {
    initial: string;
    final: string;
  };
}

export interface BilanFilters {
  dateInitiale: string; // Date du bilan initial
  dateFinale: string; // Date du bilan final
}
