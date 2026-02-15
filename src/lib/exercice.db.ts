import { getDb } from "./db";
import { Exercice, ExerciceFormData } from "../types/exercice";

/**
 * Récupère tous les exercices
 */
export async function getExercices(): Promise<Exercice[]> {
  const db = await getDb();
  return await db.select<Exercice[]>(
    "SELECT * FROM exercices ORDER BY date_debut DESC",
  );
}

/**
 * Crée un nouvel exercice
 */
export async function createExercice(data: ExerciceFormData): Promise<number> {
  const db = await getDb();

  // Créer le nouvel exercice (non actif par défaut)
  await db.execute(
    `INSERT INTO exercices (nom_entreprise, nom_exercice, date_debut, date_fin, est_clos, est_actif) 
     VALUES (?, ?, ?, ?, FALSE, FALSE)`,
    [data.nom_entreprise, data.nom_exercice, data.date_debut, data.date_fin],
  );

  const result = await db.select<{ id: number }[]>(
    "SELECT last_insert_rowid() as id",
  );

  return result[0].id;
}

/**
 * Clôture un exercice
 */
export async function cloturerExercice(id: number): Promise<void> {
  const db = await getDb();

  // Marquer l'exercice comme clos
  await db.execute(
    `UPDATE exercices 
     SET est_clos = TRUE, closed_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [id],
  );
}

/**
 * Vérifie les chevauchements de dates
 */
export async function checkExerciceOverlap(
  date_debut: string,
  date_fin: string,
): Promise<boolean> {
  const db = await getDb();

  const result = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM exercices 
     WHERE date_debut <= ? AND date_fin >= ?`,
    [date_fin, date_debut],
  );

  return result[0].count > 0;
}
