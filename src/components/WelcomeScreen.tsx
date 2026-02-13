import React, { useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { initDatabase } from "../lib/db";

interface WelcomeScreenProps {
  onFileOpened: (path: string) => void;
}

export function WelcomeScreen({ onFileOpened }: WelcomeScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewFile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Demander où sauvegarder le nouveau fichier
      const filePath = await save({
        title: "Créer un nouveau fichier MiniCompta",
        defaultPath: "ma_compta.compta",
        filters: [
          {
            name: "Fichier MiniCompta",
            extensions: ["compta"],
          },
        ],
      });

      if (filePath) {
        console.log("Création du fichier:", filePath);
        // Créer la base avec le schéma
        await initDatabase(filePath, true);
        onFileOpened(filePath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Demander quel fichier ouvrir
      const filePath = await open({
        title: "Ouvrir un fichier MiniCompta",
        filters: [
          {
            name: "Fichier MiniCompta",
            extensions: ["compta"],
          },
        ],
        multiple: false,
      });

      if (filePath && !Array.isArray(filePath)) {
        console.log("Ouverture du fichier:", filePath);
        // Ouvrir la base existante (sans recréer le schéma)
        await initDatabase(filePath, false);
        onFileOpened(filePath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8">
        {/* Logo ou titre */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            MiniCompta BI
          </h1>
          <p className="text-muted-foreground">
            Comptabilité simple pour indépendants et petites entreprises
          </p>
        </div>

        {/* Cartes de choix */}
        <div className="space-y-4">
          <button
            onClick={handleNewFile}
            disabled={isLoading}
            className="w-full p-6 text-left border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <h2 className="text-xl font-semibold mb-2">📁 Nouveau fichier</h2>
            <p className="text-sm text-muted-foreground">
              Créer un nouveau fichier de comptabilité vierge
            </p>
          </button>

          <button
            onClick={handleOpenFile}
            disabled={isLoading}
            className="w-full p-6 text-left border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <h2 className="text-xl font-semibold mb-2">📂 Ouvrir un fichier</h2>
            <p className="text-sm text-muted-foreground">
              Ouvrir un fichier MiniCompta existant (.compta)
            </p>
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            ❌ {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="mt-4 text-center text-muted-foreground">
            Chargement...
          </div>
        )}

        {/* Pied de page */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          Version 1.0.0 - Pour le Burundi 🇧🇮
        </div>
      </div>
    </div>
  );
}
