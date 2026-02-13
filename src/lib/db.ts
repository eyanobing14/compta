import Database from "@tauri-apps/plugin-sql";
import schema from "./schema.sql?raw";

let dbInstance: Database | null = null;
let currentDbPath: string | null = null;

export async function initDatabase(dbPath: string, withSchema: boolean = true) {
  try {
    console.log("Initialisation de la base:", dbPath);

    const db = await Database.load(`sqlite:${dbPath}`);
    dbInstance = db;
    currentDbPath = dbPath;

    if (withSchema) {
      // Nouvelle base : exécuter le schéma complet
      const commands = schema.split(";").filter((cmd) => cmd.trim());
      for (const command of commands) {
        if (command.trim()) {
          try {
            await db.execute(command);
          } catch (cmdError) {
            console.error("Erreur sur commande:", command, cmdError);
          }
        }
      }
      console.log("Schéma initialisé avec succès");
    } else {
      // Base existante : vérifier et ajouter la colonne numero_piece si nécessaire
      const tableInfo = await db.select("PRAGMA table_info(ecritures)");
      const hasNumeroPiece = tableInfo.some(
        (col: any) => col.name === "numero_piece",
      );

      if (!hasNumeroPiece) {
        console.log("Ajout de la colonne numero_piece...");
        await db.execute("ALTER TABLE ecritures ADD COLUMN numero_piece TEXT");
        console.log("Colonne numero_piece ajoutée avec succès");
      }

      // Vérifier que c'est bien une base MiniCompta
      const result = await db.select(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='comptes'",
      );
      if (result.length === 0) {
        throw new Error("Le fichier n'est pas une base MiniCompta valide");
      }
      console.log("Base existante validée");
    }

    return db;
  } catch (error) {
    console.error("Erreur d'initialisation:", error);
    throw error;
  }
}

export function getDb() {
  if (!dbInstance) {
    throw new Error("Aucune base de données ouverte");
  }
  return dbInstance;
}

export function getCurrentDbPath() {
  return currentDbPath;
}

export async function closeDb() {
  if (dbInstance) {
    try {
      await dbInstance.close();
    } catch (error) {
      console.error("Erreur lors de la fermeture:", error);
    } finally {
      dbInstance = null;
      currentDbPath = null;
    }
  }
}
