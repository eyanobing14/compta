import { getDb } from "./db";
import {
  Ecriture,
  EcritureFilters,
  EcritureFormData,
} from "../types/ecritures";
import { getExerciceActif } from "./exercice.db";

/**
 * Récupère les écritures avec filtres optionnels
 */
export async function getEcritures(
  filters?: EcritureFilters,
): Promise<Ecriture[]> {
  const db = await getDb();

  let query = `
    SELECT 
      e.*,
      c1.libelle as debit_libelle,
      c2.libelle as credit_libelle
    FROM ecritures e
    LEFT JOIN comptes c1 ON e.compte_debit = c1.numero
    LEFT JOIN comptes c2 ON e.compte_credit = c2.numero
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.dateDebut) {
    query += ` AND e.date >= ?`;
    params.push(filters.dateDebut);
  }

  if (filters?.dateFin) {
    query += ` AND e.date <= ?`;
    params.push(filters.dateFin);
  }

  // Recherche par compte (débit ou crédit)
  if (filters?.compte) {
    query += ` AND (e.compte_debit = ? OR e.compte_credit = ?)`;
    params.push(filters.compte, filters.compte);
  }

  // Recherche par compte débit spécifique
  if (filters?.compteDebit) {
    query += ` AND e.compte_debit = ?`;
    params.push(filters.compteDebit);
  }

  // Recherche par compte crédit spécifique
  if (filters?.compteCredit) {
    query += ` AND e.compte_credit = ?`;
    params.push(filters.compteCredit);
  }

  // Recherche par numéro de pièce
  if (filters?.numeroPiece) {
    query += ` AND e.numero_piece LIKE ?`;
    params.push(`%${filters.numeroPiece}%`);
  }

  // Recherche par plage de montant
  if (filters?.montantMin !== undefined) {
    query += ` AND e.montant >= ?`;
    params.push(filters.montantMin);
  }

  if (filters?.montantMax !== undefined) {
    query += ` AND e.montant <= ?`;
    params.push(filters.montantMax);
  }

  // Recherche textuelle générale (libellé, observation)
  if (filters?.searchTerm && filters?.searchType === "libelle") {
    query += ` AND (e.libelle LIKE ? OR e.observation LIKE ?)`;
    params.push(`%${filters.searchTerm}%`, `%${filters.searchTerm}%`);
  }

  // Recherche dans les comptes (numéros et libellés)
  if (filters?.searchTerm && filters?.searchType === "comptes") {
    query += ` AND (
      e.compte_debit IN (SELECT numero FROM comptes WHERE numero LIKE ? OR libelle LIKE ?)
      OR e.compte_credit IN (SELECT numero FROM comptes WHERE numero LIKE ? OR libelle LIKE ?)
    )`;
    const searchPattern = `%${filters.searchTerm}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY e.date DESC, e.id DESC`;

  return await db.select<Ecriture[]>(query, params);
}

/**
 * Récupère une écriture par son ID
 */
export async function getEcritureById(id: number): Promise<Ecriture | null> {
  const db = await getDb();

  const result = await db.select<Ecriture[]>(
    `SELECT 
      e.*,
      c1.libelle as debit_libelle,
      c2.libelle as credit_libelle
    FROM ecritures e
    LEFT JOIN comptes c1 ON e.compte_debit = c1.numero
    LEFT JOIN comptes c2 ON e.compte_credit = c2.numero
    WHERE e.id = ?`,
    [id],
  );

  return result.length > 0 ? result[0] : null;
}

/**
 * Crée une nouvelle écriture
 */
export async function createEcriture(data: EcritureFormData): Promise<number> {
  const db = await getDb();

  // Vérifier s'il y a un exercice actif
  const exerciceActif = await getExerciceActif();
  if (!exerciceActif) {
    throw new Error("AUCUN_EXERCICE");
  }

  // Vérifier que l'exercice n'est pas clôturé
  if (exerciceActif.est_clos) {
    throw new Error("EXERCICE_CLOTURE");
  }

  // Vérifier que la date est dans l'exercice
  if (
    data.date < exerciceActif.date_debut ||
    data.date > exerciceActif.date_fin
  ) {
    throw new Error("DATE_HORS_EXERCICE");
  }

  // Vérifier le montant
  const montant = parseFloat(data.montant);
  if (isNaN(montant) || montant <= 0) {
    throw new Error("MONTANT_INVALIDE");
  }

  // Vérifier que les comptes existent
  const comptes = await db.select<{ numero: string }[]>(
    "SELECT numero FROM comptes WHERE numero IN (?, ?)",
    [data.compte_debit, data.compte_credit],
  );

  const comptesExistants = comptes.map((c) => c.numero);

  if (!comptesExistants.includes(data.compte_debit)) {
    throw new Error(`COMPTE_DEBIT_INEXISTANT:${data.compte_debit}`);
  }

  if (!comptesExistants.includes(data.compte_credit)) {
    throw new Error(`COMPTE_CREDIT_INEXISTANT:${data.compte_credit}`);
  }

  // Vérifier que les comptes sont différents
  if (data.compte_debit === data.compte_credit) {
    throw new Error("COMPTES_IDENTIQUES");
  }

  // Vérifier si le numéro de pièce existe déjà (s'il est fourni)
  if (data.numero_piece && data.numero_piece.trim() !== "") {
    const exists = await checkNumeroPieceExists(data.numero_piece);
    if (exists) {
      throw new Error("NUMERO_PIECE_EXISTANT");
    }
  }

  // Insérer l'écriture
  await db.execute(
    `INSERT INTO ecritures (
      date, libelle, compte_debit, compte_credit, montant, 
      numero_piece, observation, exercice_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      data.date,
      data.libelle,
      data.compte_debit,
      data.compte_credit,
      montant,
      data.numero_piece || null,
      data.observation || null,
      exerciceActif.id,
    ],
  );

  const result = await db.select<{ id: number }[]>(
    "SELECT last_insert_rowid() as id",
  );

  return result[0].id;
}

/**
 * Supprime une écriture
 */
export async function deleteEcriture(id: number): Promise<void> {
  const db = await getDb();

  // Vérifier que l'écriture existe et récupérer son exercice
  const ecriture = await db.select<{ exercice_id: number }[]>(
    "SELECT exercice_id FROM ecritures WHERE id = ?",
    [id],
  );

  if (ecriture.length === 0) {
    throw new Error("ECRITURE_NOT_FOUND");
  }

  // Vérifier que l'exercice n'est pas clôturé
  const exercice = await db.select<{ est_clos: boolean }[]>(
    "SELECT est_clos FROM exercices WHERE id = ?",
    [ecriture[0].exercice_id],
  );

  if (exercice.length > 0 && exercice[0].est_clos) {
    throw new Error("EXERCICE_CLOTURE");
  }

  await db.execute("DELETE FROM ecritures WHERE id = ?", [id]);
}

/**
 * Récupère le résumé du journal filtrés par exercice
 */
export async function getJournalSummary(exerciceId?: number): Promise<{
  total_ecritures: number;
  total_debit: number;
  ecritures_aujourdhui: number;
}> {
  const db = await getDb();
  const aujourdhui = new Date().toISOString().split("T")[0];

  let query = `SELECT 
    COUNT(*) as total_ecritures,
    COALESCE(SUM(montant), 0) as total_debit,
    SUM(CASE WHEN date = ? THEN 1 ELSE 0 END) as ecritures_aujourdhui
  FROM ecritures`;
  const params: any[] = [aujourdhui];

  if (exerciceId) {
    query += ` WHERE exercice_id = ?`;
    params.push(exerciceId);
  }

  const result = await db.select<
    {
      total_ecritures: number;
      total_debit: number;
      ecritures_aujourdhui: number;
    }[]
  >(query, params);

  return {
    total_ecritures: result[0]?.total_ecritures || 0,
    total_debit: result[0]?.total_debit || 0,
    ecritures_aujourdhui: result[0]?.ecritures_aujourdhui || 0,
  };
}

/**
 * Recherche des comptes pour l'autocomplétion
 */
export async function searchComptesForEcriture(
  search: string,
): Promise<Array<{ numero: string; libelle: string }>> {
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
}

/**
 * Récupère le dernier numéro de pièce pour une année donnée
 */
export async function getLastNumeroPiece(annee?: number): Promise<string> {
  const db = await getDb();

  // Si l'année n'est pas fournie, utiliser l'exercice actif
  if (!annee) {
    const exerciceActif = await getExerciceActif();
    if (exerciceActif) {
      annee = new Date(exerciceActif.date_debut).getFullYear();
    } else {
      annee = new Date().getFullYear();
    }
  }

  const result = await db.select<{ max_numero: string }[]>(
    `SELECT MAX(numero_piece) as max_numero 
     FROM ecritures 
     WHERE numero_piece LIKE ?`,
    [`PIECE-${annee}-%`],
  );

  if (!result[0]?.max_numero) {
    return `PIECE-${annee}-0001`;
  }

  const lastNum = parseInt(result[0].max_numero.split("-").pop() || "0");
  const nextNum = (lastNum + 1).toString().padStart(4, "0");
  return `PIECE-${annee}-${nextNum}`;
}

/**
 * Vérifie si une écriture peut être modifiée/supprimée
 */
export async function canModifyEcriture(id: number): Promise<{
  canModify: boolean;
  reason?: string;
}> {
  const db = await getDb();

  const result = await db.select<{ est_clos: boolean }[]>(
    `SELECT e.est_clos 
     FROM ecritures ec
     JOIN exercices e ON ec.exercice_id = e.id
     WHERE ec.id = ?`,
    [id],
  );

  if (result.length === 0) {
    return { canModify: false, reason: "Écriture non trouvée" };
  }

  if (result[0].est_clos) {
    return { canModify: false, reason: "L'exercice est clôturé" };
  }

  return { canModify: true };
}

/**
 * Met à jour une écriture existante
 */
export async function updateEcriture(
  id: number,
  data: EcritureFormData,
): Promise<void> {
  const db = await getDb();

  // Vérifier s'il y a un exercice actif
  const exerciceActif = await getExerciceActif();
  if (!exerciceActif) {
    throw new Error("AUCUN_EXERCICE");
  }

  // Vérifier que l'exercice n'est pas clôturé
  if (exerciceActif.est_clos) {
    throw new Error("EXERCICE_CLOTURE");
  }

  // Vérifier que la date est dans l'exercice
  if (
    data.date < exerciceActif.date_debut ||
    data.date > exerciceActif.date_fin
  ) {
    throw new Error("DATE_HORS_EXERCICE");
  }

  // Vérifier le montant
  const montant = parseFloat(data.montant);
  if (isNaN(montant) || montant <= 0) {
    throw new Error("MONTANT_INVALIDE");
  }

  // Vérifier que les comptes existent
  const comptes = await db.select<{ numero: string }[]>(
    "SELECT numero FROM comptes WHERE numero IN (?, ?)",
    [data.compte_debit, data.compte_credit],
  );

  const comptesExistants = comptes.map((c) => c.numero);

  if (!comptesExistants.includes(data.compte_debit)) {
    throw new Error(`COMPTE_DEBIT_INEXISTANT:${data.compte_debit}`);
  }

  if (!comptesExistants.includes(data.compte_credit)) {
    throw new Error(`COMPTE_CREDIT_INEXISTANT:${data.compte_credit}`);
  }

  // Vérifier que les comptes sont différents
  if (data.compte_debit === data.compte_credit) {
    throw new Error("COMPTES_IDENTIQUES");
  }

  // Récupérer l'écriture existante pour vérifier si le numéro de pièce change
  const ecritureExistante = await getEcritureById(id);

  // Vérifier si le numéro de pièce a changé et s'il existe déjà
  if (
    data.numero_piece &&
    data.numero_piece.trim() !== "" &&
    ecritureExistante?.numero_piece !== data.numero_piece
  ) {
    const exists = await checkNumeroPieceExists(data.numero_piece);
    if (exists) {
      throw new Error("NUMERO_PIECE_EXISTANT");
    }
  }

  // Mettre à jour l'écriture
  await db.execute(
    `UPDATE ecritures 
     SET date = ?, libelle = ?, compte_debit = ?, compte_credit = ?, 
         montant = ?, numero_piece = ?, observation = ?
     WHERE id = ?`,
    [
      data.date,
      data.libelle,
      data.compte_debit,
      data.compte_credit,
      montant,
      data.numero_piece || null,
      data.observation || null,
      id,
    ],
  );
}

/**
 * Récupère les écritures avec pagination
 */
export async function getEcrituresPaginated(
  filters?: EcritureFilters,
  limit: number = 20,
  offset: number = 0,
): Promise<Ecriture[]> {
  const db = await getDb();

  let query = `
    SELECT 
      e.*,
      c1.libelle as debit_libelle,
      c2.libelle as credit_libelle
    FROM ecritures e
    LEFT JOIN comptes c1 ON e.compte_debit = c1.numero
    LEFT JOIN comptes c2 ON e.compte_credit = c2.numero
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.dateDebut) {
    query += ` AND e.date >= ?`;
    params.push(filters.dateDebut);
  }

  if (filters?.dateFin) {
    query += ` AND e.date <= ?`;
    params.push(filters.dateFin);
  }

  // Recherche par compte (débit ou crédit)
  if (filters?.compte) {
    query += ` AND (e.compte_debit = ? OR e.compte_credit = ?)`;
    params.push(filters.compte, filters.compte);
  }

  // Recherche par compte débit spécifique
  if (filters?.compteDebit) {
    query += ` AND e.compte_debit = ?`;
    params.push(filters.compteDebit);
  }

  // Recherche par compte crédit spécifique
  if (filters?.compteCredit) {
    query += ` AND e.compte_credit = ?`;
    params.push(filters.compteCredit);
  }

  // Recherche par numéro de pièce
  if (filters?.numeroPiece) {
    query += ` AND e.numero_piece LIKE ?`;
    params.push(`%${filters.numeroPiece}%`);
  }

  // Recherche par plage de montant
  if (filters?.montantMin !== undefined) {
    query += ` AND e.montant >= ?`;
    params.push(filters.montantMin);
  }

  if (filters?.montantMax !== undefined) {
    query += ` AND e.montant <= ?`;
    params.push(filters.montantMax);
  }

  // Recherche textuelle générale (libellé, observation)
  if (filters?.searchTerm && filters?.searchType === "libelle") {
    query += ` AND (e.libelle LIKE ? OR e.observation LIKE ?)`;
    params.push(`%${filters.searchTerm}%`, `%${filters.searchTerm}%`);
  }

  // Recherche dans les comptes (numéros et libellés)
  if (filters?.searchTerm && filters?.searchType === "comptes") {
    query += ` AND (
      e.compte_debit IN (SELECT numero FROM comptes WHERE numero LIKE ? OR libelle LIKE ?)
      OR e.compte_credit IN (SELECT numero FROM comptes WHERE numero LIKE ? OR libelle LIKE ?)
    )`;
    const searchPattern = `%${filters.searchTerm}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY e.date DESC, e.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return await db.select<Ecriture[]>(query, params);
}

/**
 * Récupère le nombre total d'écritures (pour la pagination)
 */
export async function getTotalEcrituresCount(
  filters?: EcritureFilters,
): Promise<number> {
  const db = await getDb();

  let query = `SELECT COUNT(*) as count FROM ecritures e WHERE 1=1`;
  const params: any[] = [];

  if (filters?.dateDebut) {
    query += ` AND e.date >= ?`;
    params.push(filters.dateDebut);
  }

  if (filters?.dateFin) {
    query += ` AND e.date <= ?`;
    params.push(filters.dateFin);
  }

  // Recherche par compte (débit ou crédit)
  if (filters?.compte) {
    query += ` AND (e.compte_debit = ? OR e.compte_credit = ?)`;
    params.push(filters.compte, filters.compte);
  }

  // Recherche par compte débit spécifique
  if (filters?.compteDebit) {
    query += ` AND e.compte_debit = ?`;
    params.push(filters.compteDebit);
  }

  // Recherche par compte crédit spécifique
  if (filters?.compteCredit) {
    query += ` AND e.compte_credit = ?`;
    params.push(filters.compteCredit);
  }

  // Recherche par numéro de pièce
  if (filters?.numeroPiece) {
    query += ` AND e.numero_piece LIKE ?`;
    params.push(`%${filters.numeroPiece}%`);
  }

  // Recherche par plage de montant
  if (filters?.montantMin !== undefined) {
    query += ` AND e.montant >= ?`;
    params.push(filters.montantMin);
  }

  if (filters?.montantMax !== undefined) {
    query += ` AND e.montant <= ?`;
    params.push(filters.montantMax);
  }

  // Recherche textuelle générale (libellé, observation)
  if (filters?.searchTerm && filters?.searchType === "libelle") {
    query += ` AND (e.libelle LIKE ? OR e.observation LIKE ?)`;
    params.push(`%${filters.searchTerm}%`, `%${filters.searchTerm}%`);
  }

  // Recherche dans les comptes (numéros et libellés)
  if (filters?.searchTerm && filters?.searchType === "comptes") {
    query += ` AND (
      e.compte_debit IN (SELECT numero FROM comptes WHERE numero LIKE ? OR libelle LIKE ?)
      OR e.compte_credit IN (SELECT numero FROM comptes WHERE numero LIKE ? OR libelle LIKE ?)
    )`;
    const searchPattern = `%${filters.searchTerm}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  const result = await db.select<{ count: number }[]>(query, params);
  return result[0]?.count || 0;
}

/**
 * Vérifie si un numéro de pièce existe déjà
 */
export async function checkNumeroPieceExists(
  numeroPiece: string,
): Promise<boolean> {
  const db = await getDb();

  const result = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM ecritures WHERE numero_piece = ?",
    [numeroPiece],
  );

  return result[0].count > 0;
}
