import { getDb } from "./db";
import { GrandLivreCompte, GrandLivreLine } from "../types/grand-livre";

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

export async function searchComptes(
  search: string,
): Promise<Array<{ numero: string; libelle: string }>> {
  try {
    const db = await getDb();

    return await db.select<Array<{ numero: string; libelle: string }>>(
      `SELECT numero, libelle FROM comptes 
       WHERE numero LIKE ? OR libelle LIKE ? 
       ORDER BY 
         CASE 
           WHEN numero = ? THEN 0
           WHEN numero LIKE ? THEN 1
           WHEN libelle LIKE ? THEN 2
           ELSE 3
         END,
         numero
       LIMIT 10`,
      [`%${search}%`, `%${search}%`, search, `${search}%`, `%${search}%`],
    );
  } catch (error) {
    console.error("Erreur searchComptes:", error);
    throw error;
  }
}
