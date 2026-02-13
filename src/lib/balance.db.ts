import { getDb } from "./db";
import { BalanceLine, BalanceTotals, BalanceFilters } from "../types/balance";

/**
 * Calcule la balance des comptes pour une période donnée
 */
export async function getBalance(filters?: BalanceFilters): Promise<{
  lignes: BalanceLine[];
  totaux: BalanceTotals;
}> {
  try {
    const db = await getDb();

    // Construire la requête pour récupérer tous les comptes avec leurs mouvements
    let query = `
      SELECT 
        c.numero,
        c.libelle,
        c.type_compte,
        COALESCE(SUM(CASE WHEN e.compte_debit = c.numero THEN e.montant ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN e.compte_credit = c.numero THEN e.montant ELSE 0 END), 0) as total_credit
      FROM comptes c
      LEFT JOIN ecritures e ON (c.numero = e.compte_debit OR c.numero = e.compte_credit)
    `;

    const params: any[] = [];

    // Ajouter les filtres de date si nécessaires
    if (filters?.date_debut || filters?.date_fin) {
      query += " WHERE ";
      const conditions: string[] = [];

      if (filters.date_debut) {
        conditions.push("e.date >= ?");
        params.push(filters.date_debut);
      }

      if (filters.date_fin) {
        conditions.push("e.date <= ?");
        params.push(filters.date_fin);
      }

      query += conditions.join(" AND ");
    }

    query += " GROUP BY c.numero, c.libelle, c.type_compte ORDER BY c.numero";

    const result = await db.select<
      {
        numero: string;
        libelle: string;
        type_compte: string;
        total_debit: number;
        total_credit: number;
      }[]
    >(query, params);

    // Calculer les soldes et préparer les lignes
    const lignes: BalanceLine[] = [];
    let totaux: BalanceTotals = {
      total_debit: 0,
      total_credit: 0,
      total_solde_debiteur: 0,
      total_solde_crediteur: 0,
    };

    for (const row of result) {
      const solde = row.total_debit - row.total_credit;
      const solde_debiteur = solde > 0 ? solde : 0;
      const solde_crediteur = solde < 0 ? -solde : 0;

      lignes.push({
        compte_numero: row.numero,
        compte_libelle: row.libelle,
        type_compte: row.type_compte,
        total_debit: row.total_debit,
        total_credit: row.total_credit,
        solde_debiteur,
        solde_crediteur,
      });

      // Mettre à jour les totaux
      totaux.total_debit += row.total_debit;
      totaux.total_credit += row.total_credit;
      totaux.total_solde_debiteur += solde_debiteur;
      totaux.total_solde_crediteur += solde_crediteur;
    }

    return { lignes, totaux };
  } catch (error) {
    console.error("Erreur getBalance:", error);
    throw error;
  }
}

/**
 * Récupère la balance pour un compte spécifique
 */
export async function getBalanceForCompte(
  compteNumero: string,
  dateDebut?: string,
  dateFin?: string,
): Promise<BalanceLine | null> {
  try {
    const db = await getDb();

    const query = `
      SELECT 
        c.numero,
        c.libelle,
        c.type_compte,
        COALESCE(SUM(CASE WHEN e.compte_debit = c.numero THEN e.montant ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN e.compte_credit = c.numero THEN e.montant ELSE 0 END), 0) as total_credit
      FROM comptes c
      LEFT JOIN ecritures e ON (c.numero = e.compte_debit OR c.numero = e.compte_credit)
      WHERE c.numero = ?
    `;

    const params: any[] = [compteNumero];

    // Ajouter les filtres de date si nécessaires
    if (dateDebut || dateFin) {
      if (dateDebut) {
        params.push(dateDebut);
      }
      if (dateFin) {
        params.push(dateFin);
      }
    }

    const result = await db.select<
      {
        numero: string;
        libelle: string;
        type_compte: string;
        total_debit: number;
        total_credit: number;
      }[]
    >(query, params);

    if (result.length === 0) return null;

    const row = result[0];
    const solde = row.total_debit - row.total_credit;

    return {
      compte_numero: row.numero,
      compte_libelle: row.libelle,
      type_compte: row.type_compte,
      total_debit: row.total_debit,
      total_credit: row.total_credit,
      solde_debiteur: solde > 0 ? solde : 0,
      solde_crediteur: solde < 0 ? -solde : 0,
    };
  } catch (error) {
    console.error("Erreur getBalanceForCompte:", error);
    throw error;
  }
}

/**
 * Vérifie l'équilibre débit/crédit de la balance
 */
export async function checkBalanceEquilibre(
  dateDebut?: string,
  dateFin?: string,
): Promise<{
  est_equilibree: boolean;
  ecart: number;
  total_debit: number;
  total_credit: number;
}> {
  try {
    const { totaux } = await getBalance({
      date_debut: dateDebut,
      date_fin: dateFin,
    });

    return {
      est_equilibree: Math.abs(totaux.total_debit - totaux.total_credit) < 0.01,
      ecart: Math.abs(totaux.total_debit - totaux.total_credit),
      total_debit: totaux.total_debit,
      total_credit: totaux.total_credit,
    };
  } catch (error) {
    console.error("Erreur checkBalanceEquilibre:", error);
    throw error;
  }
}

/**
 * Exporte la balance au format CSV
 */
export async function exportBalanceToCSV(
  filters?: BalanceFilters,
): Promise<string> {
  try {
    const { lignes, totaux } = await getBalance(filters);

    const headers = [
      "N° Compte",
      "Libellé",
      "Type",
      "Total Débit",
      "Total Crédit",
      "Solde Débiteur",
      "Solde Créditeur",
    ];

    const rows = lignes.map((l) => [
      l.compte_numero,
      `"${l.compte_libelle.replace(/"/g, '""')}"`,
      l.type_compte || "",
      l.total_debit.toString(),
      l.total_credit.toString(),
      l.solde_debiteur.toString(),
      l.solde_crediteur.toString(),
    ]);

    // Ajouter la ligne des totaux
    rows.push([
      "",
      "TOTAUX",
      "",
      totaux.total_debit.toString(),
      totaux.total_credit.toString(),
      totaux.total_solde_debiteur.toString(),
      totaux.total_solde_crediteur.toString(),
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  } catch (error) {
    console.error("Erreur exportBalanceToCSV:", error);
    throw error;
  }
}
