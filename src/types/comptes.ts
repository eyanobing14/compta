export type TypeCompte =
  | "ACTIF"
  | "PASSIF"
  | "PRODUIT"
  | "CHARGE"
  | "TRESORERIE";

export interface Compte {
  numero: string;
  libelle: string;
  type_compte: TypeCompte | null;
  est_actif: boolean;
  created_at: string;
}

export interface CompteFormData {
  numero: string;
  libelle: string;
  type_compte: TypeCompte | "";
}

export const TYPE_COMPTE_LABELS: Record<TypeCompte, string> = {
  ACTIF: "🏦 Actif (biens, créances)",
  PASSIF: "📋 Passif (dettes, capitaux)",
  PRODUIT: "💰 Produit (ventes, revenus)",
  CHARGE: "💸 Charge (achats, dépenses)",
  TRESORERIE: "💵 Trésorerie (banque, caisse)",
};

export const TYPE_COMPTE_COLORS: Record<TypeCompte, string> = {
  ACTIF: "text-blue-600 bg-blue-100",
  PASSIF: "text-purple-600 bg-purple-100",
  PRODUIT: "text-green-600 bg-green-100",
  CHARGE: "text-orange-600 bg-orange-100",
  TRESORERIE: "text-cyan-600 bg-cyan-100",
};
