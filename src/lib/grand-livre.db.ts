import { getDb } from "./db";
import {
  GrandLivreCompte,
  GrandLivreLine,
  GrandLivreFilters,
} from "../types/grand-livre";

export async function getGrandLivre(
  filters?: GrandLivreFilters,
): Promise<GrandLivreCompte[]> {
  try {
    const db = await getDb();

    // Récupérer tous les comptes concernés
    let compteQuery =
      "SELECT numero, libelle, type_compte FROM comptes WHERE 1=1";
    const compteParams: any[] = [];

    if (filters?.compte_debut) {
      compteQuery += " AND numero >= ?";
      compteParams.push(filters.compte_debut);
    }

    if (filters?.compte_fin) {
      compteQuery += " AND numero <= ?";
      compteParams.push(filters.compte_fin);
    }

    compteQuery += " ORDER BY numero";

    const comptes = await db.select<
      { numero: string; libelle: string; type_compte: string }[]
    >(compteQuery, compteParams);

    const result: GrandLivreCompte[] = [];

    for (const compte of comptes) {
      // Récupérer les écritures pour ce compte
      let ecrituresQuery = `
        SELECT 
          e.id,
          e.date,
          e.libelle,
          e.numero_piece,
          CASE WHEN e.compte_debit = ? THEN e.montant ELSE NULL END as debit,
          CASE WHEN e.compte_credit = ? THEN e.montant ELSE NULL END as credit
        FROM ecritures e
        WHERE (e.compte_debit = ? OR e.compte_credit = ?)
      `;
      const params: any[] = [
        compte.numero,
        compte.numero,
        compte.numero,
        compte.numero,
      ];

      if (filters?.date_debut) {
        ecrituresQuery += " AND e.date >= ?";
        params.push(filters.date_debut);
      }

      if (filters?.date_fin) {
        ecrituresQuery += " AND e.date <= ?";
        params.push(filters.date_fin);
      }

      ecrituresQuery += " ORDER BY e.date, e.id";

      const ecritures = await db.select<
        {
          id: number;
          date: string;
          libelle: string;
          numero_piece: string | null;
          debit: number | null;
          credit: number | null;
        }[]
      >(ecrituresQuery, params);

      // Calculer les soldes progressifs
      const lignes: GrandLivreLine[] = [];
      let solde = 0;

      for (const ecriture of ecritures) {
        if (ecriture.debit) {
          solde += ecriture.debit;
        } else if (ecriture.credit) {
          solde -= ecriture.credit;
        }

        lignes.push({
          id: ecriture.id,
          date: ecriture.date,
          libelle: ecriture.libelle,
          numero_piece: ecriture.numero_piece,
          debit: ecriture.debit,
          credit: ecriture.credit,
          solde: Math.abs(solde),
          sens: solde >= 0 ? "Débiteur" : "Créditeur",
        });
      }

      // Calculer les totaux
      const total_debit = lignes.reduce((sum, l) => sum + (l.debit || 0), 0);
      const total_credit = lignes.reduce((sum, l) => sum + (l.credit || 0), 0);

      result.push({
        compte_numero: compte.numero,
        compte_libelle: compte.libelle,
        type_compte: compte.type_compte,
        lignes,
        total_debit,
        total_credit,
        solde_final: Math.abs(solde),
        sens_final: solde >= 0 ? "Débiteur" : "Créditeur",
      });
    }

    return result;
  } catch (error) {
    console.error("Erreur getGrandLivre:", error);
    throw error;
  }
}

export async function getGrandLivreForCompte(
  compteNumero: string,
  dateDebut?: string,
  dateFin?: string,
): Promise<GrandLivreCompte | null> {
  try {
    const db = await getDb();

    // Récupérer les infos du compte
    const compteInfo = await db.select<
      { libelle: string; type_compte: string }[]
    >("SELECT libelle, type_compte FROM comptes WHERE numero = ?", [
      compteNumero,
    ]);

    if (compteInfo.length === 0) return null;

    // Récupérer les écritures
    let query = `
      SELECT 
        e.id,
        e.date,
        e.libelle,
        e.numero_piece,
        CASE WHEN e.compte_debit = ? THEN e.montant ELSE NULL END as debit,
        CASE WHEN e.compte_credit = ? THEN e.montant ELSE NULL END as credit
      FROM ecritures e
      WHERE (e.compte_debit = ? OR e.compte_credit = ?)
    `;
    const params: any[] = [
      compteNumero,
      compteNumero,
      compteNumero,
      compteNumero,
    ];

    if (dateDebut) {
      query += " AND e.date >= ?";
      params.push(dateDebut);
    }

    if (dateFin) {
      query += " AND e.date <= ?";
      params.push(dateFin);
    }

    query += " ORDER BY e.date, e.id";

    const ecritures = await db.select<
      {
        id: number;
        date: string;
        libelle: string;
        numero_piece: string | null;
        debit: number | null;
        credit: number | null;
      }[]
    >(query, params);

    // Calculer les soldes progressifs
    const lignes: GrandLivreLine[] = [];
    let solde = 0;

    for (const ecriture of ecritures) {
      if (ecriture.debit) {
        solde += ecriture.debit;
      } else if (ecriture.credit) {
        solde -= ecriture.credit;
      }

      lignes.push({
        id: ecriture.id,
        date: ecriture.date,
        libelle: ecriture.libelle,
        numero_piece: ecriture.numero_piece,
        debit: ecriture.debit,
        credit: ecriture.credit,
        solde: Math.abs(solde),
        sens: solde >= 0 ? "Débiteur" : "Créditeur",
      });
    }

    const total_debit = lignes.reduce((sum, l) => sum + (l.debit || 0), 0);
    const total_credit = lignes.reduce((sum, l) => sum + (l.credit || 0), 0);

    return {
      compte_numero: compteNumero,
      compte_libelle: compteInfo[0].libelle,
      type_compte: compteInfo[0].type_compte,
      lignes,
      total_debit,
      total_credit,
      solde_final: Math.abs(solde),
      sens_final: solde >= 0 ? "Débiteur" : "Créditeur",
    };
  } catch (error) {
    console.error("Erreur getGrandLivreForCompte:", error);
    throw error;
  }
}

export async function getSoldesComptes(
  date?: string,
): Promise<Record<string, number>> {
  try {
    const db = await getDb();

    const query = date
      ? "SELECT * FROM ecritures WHERE date <= ?"
      : "SELECT * FROM ecritures";

    const params = date ? [date] : [];

    const ecritures = await db.select<
      {
        compte_debit: string;
        compte_credit: string;
        montant: number;
      }[]
    >(query, params);

    const soldes: Record<string, number> = {};

    for (const e of ecritures) {
      // Débit
      soldes[e.compte_debit] = (soldes[e.compte_debit] || 0) + e.montant;
      // Crédit
      soldes[e.compte_credit] = (soldes[e.compte_credit] || 0) - e.montant;
    }

    return soldes;
  } catch (error) {
    console.error("Erreur getSoldesComptes:", error);
    throw error;
  }
}
