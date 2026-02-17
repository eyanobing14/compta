// types/resultat.ts (simplifié)
export interface ResultatLine {
  compte_numero: string;
  compte_libelle: string;
  montant: number;
  type: "PRODUIT" | "CHARGE";
  ordre: number;
}

export interface ResultatSection {
  titre: string;
  total: number;
  lignes: ResultatLine[];
}

export interface CompteResultatData {
  produits: ResultatSection;
  charges: ResultatSection;
  resultat: {
    montant: number;
    type: "BENEFICE" | "PERTE";
    taux_marge?: number;
  };
  periode: {
    debut: string;
    fin: string;
    libelle: string;
  };
}

export type PeriodeType =
  | "mois"
  | "trimestre"
  | "annee"
  | "personnalisee"
  | "exercice";

export interface ResultatFilters {
  periodeType: PeriodeType;
  dateDebut?: string;
  dateFin?: string;
  annee?: number;
  mois?: number;
  trimestre?: number;
}
