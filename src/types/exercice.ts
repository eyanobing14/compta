export interface Exercice {
  id: number;
  nom_entreprise: string;
  nom_exercice: string;
  date_debut: string;
  date_fin: string;
  est_clos: boolean;
  est_actif: boolean;
  created_at: string;
  closed_at: string | null;
  closed_by: number | null;
}

export interface ExerciceFormData {
  nom_entreprise: string;
  nom_exercice: string;
  date_debut: string;
  date_fin: string;
}

export interface ExerciceStats {
  total_ecritures: number;
  total_debit: number;
  total_credit: number;
  resultat: number;
  type_resultat: "BENEFICE" | "PERTE";
  dernier_mouvement: string | null;
  equilibre: boolean;
  ecart: number;
}

export interface ExerciceValidation {
  peut_cloturer: boolean;
  peut_activer: boolean;
  peut_desactiver: boolean;
  peut_modifier: boolean;
  raison_blocage?: string;
  warning?: string;
}

export interface ExerciceDetail extends Exercice {
  stats: ExerciceStats;
  validation: ExerciceValidation;
  jours_restants: number;
  progression: number; // pourcentage de l'exercice écoulé
}

export interface ReportData {
  comptes: Array<{
    numero: string;
    libelle: string;
    solde: number;
    type: string;
  }>;
  total_actif: number;
  total_passif: number;
  resultat: number;
  ecritures_report: Array<{
    compte_debit: string;
    compte_credit: string;
    montant: number;
    libelle: string;
  }>;
}
