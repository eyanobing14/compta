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
