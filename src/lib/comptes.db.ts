import { getDb } from "./db";
import { Compte, CompteFormData, TypeCompte } from "../types/comptes";

export async function getComptes(
  type?: TypeCompte | null,
  actifOnly: boolean = true,
): Promise<Compte[]> {
  try {
    const db = await getDb();
    let query =
      "SELECT numero, libelle, type_compte, 1 as est_actif, created_at FROM comptes WHERE 1=1";
    const params: any[] = [];

    if (type) {
      query += " AND type_compte = ?";
      params.push(type);
    }

    if (actifOnly) {
      query += " AND est_actif = 1";
    }

    query += " ORDER BY numero";

    const result = await db.select<Compte[]>(query, params);
    return result;
  } catch (error) {
    console.error("Erreur getComptes:", error);
    throw error;
  }
}

export async function getCompteByNumero(
  numero: string,
): Promise<Compte | null> {
  try {
    const db = await getDb();
    const result = await db.select<Compte[]>(
      "SELECT numero, libelle, type_compte, 1 as est_actif, created_at FROM comptes WHERE numero = ?",
      [numero],
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Erreur getCompteByNumero:", error);
    throw error;
  }
}

export async function createCompte(data: CompteFormData): Promise<void> {
  try {
    const db = await getDb();

    // Vérifier si le compte existe déjà
    const existing = await getCompteByNumero(data.numero);
    if (existing) {
      throw new Error(`Un compte avec le numéro ${data.numero} existe déjà`);
    }

    // Validation du format du numéro
    if (!/^\d+$/.test(data.numero)) {
      throw new Error(
        "Le numéro de compte doit contenir uniquement des chiffres",
      );
    }

    // Insertion
    await db.execute(
      `INSERT INTO comptes (numero, libelle, type_compte) 
       VALUES (?, ?, ?)`,
      [data.numero, data.libelle, data.type_compte || null],
    );

    console.log("Compte créé:", data.numero);
  } catch (error) {
    console.error("Erreur createCompte:", error);
    throw error;
  }
}

export async function updateCompte(
  numero: string,
  data: Partial<CompteFormData>,
): Promise<void> {
  try {
    const db = await getDb();

    const updates: string[] = [];
    const params: any[] = [];

    if (data.libelle !== undefined) {
      updates.push("libelle = ?");
      params.push(data.libelle);
    }

    if (data.type_compte !== undefined) {
      updates.push("type_compte = ?");
      params.push(data.type_compte || null);
    }

    if (updates.length === 0) return;

    params.push(numero);
    await db.execute(
      `UPDATE comptes SET ${updates.join(", ")} WHERE numero = ?`,
      params,
    );

    console.log("Compte mis à jour:", numero);
  } catch (error) {
    console.error("Erreur updateCompte:", error);
    throw error;
  }
}

export async function deleteCompte(numero: string): Promise<void> {
  try {
    const db = await getDb();

    // Vérifier si le compte est utilisé dans des écritures
    const ecritures = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM ecritures WHERE compte_debit = ? OR compte_credit = ?",
      [numero, numero],
    );

    if (ecritures[0].count > 0) {
      throw new Error(
        `Ce compte est utilisé dans ${ecritures[0].count} écriture(s). ` +
          `Il ne peut pas être supprimé.`,
      );
    }

    await db.execute("DELETE FROM comptes WHERE numero = ?", [numero]);
    console.log("Compte supprimé:", numero);
  } catch (error) {
    console.error("Erreur deleteCompte:", error);
    throw error;
  }
}

export async function searchComptes(
  searchTerm: string,
  limit: number = 10,
): Promise<Compte[]> {
  try {
    const db = await getDb();
    const result = await db.select<Compte[]>(
      `SELECT numero, libelle, type_compte, 1 as est_actif, created_at 
       FROM comptes 
       WHERE numero LIKE ? OR libelle LIKE ? 
       ORDER BY numero 
       LIMIT ?`,
      [`%${searchTerm}%`, `%${searchTerm}%`, limit],
    );
    return result;
  } catch (error) {
    console.error("Erreur searchComptes:", error);
    throw error;
  }
}
/**
 * Vérifie si un compte est utilisé dans des écritures
 */
export async function checkCompteUsed(numero: string): Promise<boolean> {
  try {
    const db = await getDb();
    const result = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM ecritures WHERE compte_debit = ? OR compte_credit = ?",
      [numero, numero],
    );
    return result[0].count > 0;
  } catch (error) {
    console.error("Erreur checkCompteUsed:", error);
    throw error;
  }
}
