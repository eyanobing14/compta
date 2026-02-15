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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full p-8">
        {/* Logo ou titre */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-light tracking-tighter mb-2">
            MINICOMPTA
          </h1>
          <p className="text-gray-500 text-sm uppercase tracking-wider">
            Comptabilité simple pour indépendants
          </p>
        </div>

        {/* Cartes de choix */}
        <div className="space-y-4">
          <button
            onClick={handleNewFile}
            disabled={isLoading}
            className="w-full p-8 text-left border border-gray-300 bg-white hover:border-black transition-colors disabled:opacity-50 disabled:hover:border-gray-300 group"
          >
            <h2 className="text-2xl  mb-2 group-hover:translate-x-1 transition-transform">
              📁 Nouveau fichier
            </h2>
            <p className="text-sm text-gray-500">
              Créer un nouveau fichier de comptabilité vierge
            </p>
          </button>

          <button
            onClick={handleOpenFile}
            disabled={isLoading}
            className="w-full p-8 text-left border border-gray-300 bg-white hover:border-black transition-colors disabled:opacity-50 disabled:hover:border-gray-300 group"
          >
            <h2 className="text-2xl  mb-2 group-hover:translate-x-1 transition-transform">
              📂 Ouvrir un fichier
            </h2>
            <p className="text-sm text-gray-500">
              Ouvrir un fichier MiniCompta existant (.compta)
            </p>
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-6 p-3 bg-gray-100 border border-gray-300 text-gray-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="mt-6 text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Chargement...</p>
          </div>
        )}

        {/* Pied de page */}
        <div className="mt-12 text-center text-xs text-gray-400 uppercase tracking-wider">
          Version 1.0.0 — Burundi 🇧🇮
        </div>
      </div>
    </div>
  );
}
