import { getDb } from "./db";
import {
  Ecriture,
  EcritureFormData,
  EcritureFilters,
} from "../types/ecritures";

/**
 * Récupère la liste des écritures avec filtres optionnels
 */
export async function getEcritures(
  filters?: EcritureFilters,
  limit: number = 100,
  offset: number = 0,
): Promise<Ecriture[]> {
  try {
    const db = await getDb();
    let query = `
      SELECT 
        e.*,
        d.libelle as debit_libelle,
        c.libelle as credit_libelle
      FROM ecritures e
      LEFT JOIN comptes d ON e.compte_debit = d.numero
      LEFT JOIN comptes c ON e.compte_credit = c.numero
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.dateDebut) {
      query += " AND e.date >= ?";
      params.push(filters.dateDebut);
    }

    if (filters?.dateFin) {
      query += " AND e.date <= ?";
      params.push(filters.dateFin);
    }

    if (filters?.compte) {
      query += " AND (e.compte_debit = ? OR e.compte_credit = ?)";
      params.push(filters.compte, filters.compte);
    }

    if (filters?.searchTerm) {
      query +=
        " AND (e.libelle LIKE ? OR e.observation LIKE ? OR e.numero_piece LIKE ?)";
      params.push(
        `%${filters.searchTerm}%`,
        `%${filters.searchTerm}%`,
        `%${filters.searchTerm}%`,
      );
    }

    query += " ORDER BY e.date DESC, e.id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const result = await db.select<Ecriture[]>(query, params);
    return result;
  } catch (error) {
    console.error("Erreur getEcritures:", error);
    throw error;
  }
}

/**
 * Récupère une écriture par son ID
 */
export async function getEcritureById(id: number): Promise<Ecriture | null> {
  try {
    const db = await getDb();
    const result = await db.select<Ecriture[]>(
      `SELECT 
        e.*,
        d.libelle as debit_libelle,
        c.libelle as credit_libelle
      FROM ecritures e
      LEFT JOIN comptes d ON e.compte_debit = d.numero
      LEFT JOIN comptes c ON e.compte_credit = c.numero
      WHERE e.id = ?`,
      [id],
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Erreur getEcritureById:", error);
    throw error;
  }
}

/**
 * Crée une nouvelle écriture comptable
 */
export async function createEcriture(data: EcritureFormData): Promise<number> {
  try {
    const db = await getDb();

    // Validation du montant
    const montant = parseFloat(data.montant);
    if (isNaN(montant) || montant <= 0) {
      throw new Error("Le montant doit être un nombre positif");
    }

    // Vérifier que les comptes existent
    const debitCheck = await db.select(
      "SELECT numero FROM comptes WHERE numero = ?",
      [data.compte_debit],
    );
    if (debitCheck.length === 0) {
      throw new Error(`Le compte débit ${data.compte_debit} n'existe pas`);
    }

    const creditCheck = await db.select(
      "SELECT numero FROM comptes WHERE numero = ?",
      [data.compte_credit],
    );
    if (creditCheck.length === 0) {
      throw new Error(`Le compte crédit ${data.compte_credit} n'existe pas`);
    }

    // Vérifier que les comptes sont différents
    if (data.compte_debit === data.compte_credit) {
      throw new Error("Les comptes débit et crédit doivent être différents");
    }

    // Vérifier le format de la date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      throw new Error("Le format de date est invalide (YYYY-MM-DD requis)");
    }

    // Insertion avec numero_piece
    await db.execute(
      `INSERT INTO ecritures 
       (date, libelle, compte_debit, compte_credit, montant, numero_piece, observation) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date,
        data.libelle.trim(),
        data.compte_debit,
        data.compte_credit,
        montant,
        data.numero_piece?.trim() || null,
        data.observation?.trim() || null,
      ],
    );

    console.log("Écriture créée avec succès");

    // Récupérer l'ID de la dernière insertion
    const lastId = await db.select<{ id: number }[]>(
      "SELECT last_insert_rowid() as id",
    );
    return lastId[0].id;
  } catch (error) {
    console.error("Erreur createEcriture:", error);
    throw error;
  }
}

/**
 * Met à jour une écriture existante
 */
export async function updateEcriture(
  id: number,
  data: Partial<EcritureFormData>,
): Promise<void> {
  try {
    const db = await getDb();

    const updates: string[] = [];
    const params: any[] = [];

    if (data.date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        throw new Error("Le format de date est invalide");
      }
      updates.push("date = ?");
      params.push(data.date);
    }

    if (data.libelle !== undefined) {
      updates.push("libelle = ?");
      params.push(data.libelle.trim());
    }

    if (data.compte_debit !== undefined) {
      // Vérifier que le compte existe
      const check = await db.select(
        "SELECT numero FROM comptes WHERE numero = ?",
        [data.compte_debit],
      );
      if (check.length === 0) {
        throw new Error(`Le compte débit ${data.compte_debit} n'existe pas`);
      }
      updates.push("compte_debit = ?");
      params.push(data.compte_debit);
    }

    if (data.compte_credit !== undefined) {
      // Vérifier que le compte existe
      const check = await db.select(
        "SELECT numero FROM comptes WHERE numero = ?",
        [data.compte_credit],
      );
      if (check.length === 0) {
        throw new Error(`Le compte crédit ${data.compte_credit} n'existe pas`);
      }
      updates.push("compte_credit = ?");
      params.push(data.compte_credit);
    }

    if (data.montant !== undefined) {
      const montant = parseFloat(data.montant);
      if (isNaN(montant) || montant <= 0) {
        throw new Error("Le montant doit être un nombre positif");
      }
      updates.push("montant = ?");
      params.push(montant);
    }

    if (data.numero_piece !== undefined) {
      updates.push("numero_piece = ?");
      params.push(data.numero_piece.trim() || null);
    }

    if (data.observation !== undefined) {
      updates.push("observation = ?");
      params.push(data.observation.trim() || null);
    }

    if (updates.length === 0) return;

    params.push(id);
    await db.execute(
      `UPDATE ecritures SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    console.log("Écriture mise à jour:", id);
  } catch (error) {
    console.error("Erreur updateEcriture:", error);
    throw error;
  }
}

/**
 * Supprime une écriture
 */
export async function deleteEcriture(id: number): Promise<void> {
  try {
    const db = await getDb();
    await db.execute("DELETE FROM ecritures WHERE id = ?", [id]);
    console.log("Écriture supprimée:", id);
  } catch (error) {
    console.error("Erreur deleteEcriture:", error);
    throw error;
  }
}

/**
 * Recherche des comptes pour l'autocomplétion
 */
export async function searchComptesForEcriture(
  searchTerm: string,
): Promise<Array<{ numero: string; libelle: string }>> {
  try {
    const db = await getDb();
    const result = await db.select<Array<{ numero: string; libelle: string }>>(
      `SELECT numero, libelle 
       FROM comptes 
       WHERE numero LIKE ? OR libelle LIKE ? 
       ORDER BY numero 
       LIMIT 10`,
      [`%${searchTerm}%`, `%${searchTerm}%`],
    );
    return result;
  } catch (error) {
    console.error("Erreur searchComptesForEcriture:", error);
    throw error;
  }
}

/**
 * Récupère le résumé du journal (statistiques)
 */
export async function getJournalSummary() {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split("T")[0];

    const result = await db.select<
      {
        total_ecritures: number;
        total_debit: number;
        total_credit: number;
        ecritures_aujourdhui: number;
      }[]
    >(
      `SELECT 
        COUNT(*) as total_ecritures,
        COALESCE(SUM(montant), 0) as total_debit,
        COALESCE(SUM(montant), 0) as total_credit,
        COALESCE(SUM(CASE WHEN date = ? THEN 1 ELSE 0 END), 0) as ecritures_aujourdhui
       FROM ecritures`,
      [today],
    );

    return (
      result[0] || {
        total_ecritures: 0,
        total_debit: 0,
        total_credit: 0,
        ecritures_aujourdhui: 0,
      }
    );
  } catch (error) {
    console.error("Erreur getJournalSummary:", error);
    throw error;
  }
}

/**
 * Récupère les écritures pour un compte spécifique
 */
export async function getEcrituresByCompte(
  compteNumero: string,
  dateDebut?: string,
  dateFin?: string,
): Promise<Ecriture[]> {
  try {
    const db = await getDb();
    let query = `
      SELECT 
        e.*,
        d.libelle as debit_libelle,
        c.libelle as credit_libelle
      FROM ecritures e
      LEFT JOIN comptes d ON e.compte_debit = d.numero
      LEFT JOIN comptes c ON e.compte_credit = c.numero
      WHERE (e.compte_debit = ? OR e.compte_credit = ?)
    `;
    const params: any[] = [compteNumero, compteNumero];

    if (dateDebut) {
      query += " AND e.date >= ?";
      params.push(dateDebut);
    }

    if (dateFin) {
      query += " AND e.date <= ?";
      params.push(dateFin);
    }

    query += " ORDER BY e.date, e.id";

    const result = await db.select<Ecriture[]>(query, params);
    return result;
  } catch (error) {
    console.error("Erreur getEcrituresByCompte:", error);
    throw error;
  }
}

/**
 * Vérifie si un compte est utilisé dans des écritures
 */
export async function isCompteUsed(compteNumero: string): Promise<boolean> {
  try {
    const db = await getDb();
    const result = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM ecritures WHERE compte_debit = ? OR compte_credit = ?",
      [compteNumero, compteNumero],
    );
    return result[0].count > 0;
  } catch (error) {
    console.error("Erreur isCompteUsed:", error);
    throw error;
  }
}

/**
 * Exporte les écritures au format CSV
 */
export async function exportEcrituresToCSV(
  filters?: EcritureFilters,
): Promise<string> {
  try {
    const ecritures = await getEcritures(filters, 10000); // Limite élevée pour export

    const headers = [
      "Date",
      "Libellé",
      "N° Pièce",
      "Compte Débit",
      "Compte Crédit",
      "Montant",
      "Observation",
    ];
    const rows = ecritures.map((e) => [
      e.date,
      `"${e.libelle.replace(/"/g, '""')}"`,
      e.numero_piece || "",
      e.compte_debit,
      e.compte_credit,
      e.montant.toString(),
      e.observation ? `"${e.observation.replace(/"/g, '""')}"` : "",
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  } catch (error) {
    console.error("Erreur exportEcrituresToCSV:", error);
    throw error;
  }
}
