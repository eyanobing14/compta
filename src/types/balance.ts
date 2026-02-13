export interface BalanceLine {
  compte_numero: string;
  compte_libelle: string;
  type_compte: string;
  total_debit: number;
  total_credit: number;
  solde_debiteur: number;
  solde_crediteur: number;
}

export interface BalanceTotals {
  total_debit: number;
  total_credit: number;
  total_solde_debiteur: number;
  total_solde_crediteur: number;
}

export interface BalanceFilters {
  date_debut?: string;
  date_fin?: string;
  type_compte?: string;
}
