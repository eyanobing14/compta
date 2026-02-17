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
        {/* Logo et titre */}
        <div className="mb-12 flex flex-row items-center justify-center gap-6">
          <img src="/logo.svg" alt="MiniCompta" className="w-24 h-24" />
          <div className="flex flex-col">
            <h1 className="text-4xl font-semibold tracking-tighter">
              MiniCompta
            </h1>
            <p className="text-gray-500 text-xs uppercase tracking-wider mt-2">
              Comptabilité simple pour indépendants
            </p>
          </div>
        </div>

        {/* Cartes de choix */}
        <div className="space-y-4">
          <button
            onClick={handleNewFile}
            disabled={isLoading}
            className="w-full p-6 text-left border border-gray-300 bg-white hover:bg-gray-50 hover:border-black hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:bg-white disabled:hover:shadow-none group cursor-pointer rounded-lg"
          >
            <h2 className="text-xl font-medium mb-2 group-hover:translate-x-1 transition-transform duration-200">
              📁 Nouveau fichier
            </h2>
            <p className="text-sm text-gray-500">
              Créer un nouveau fichier de comptabilité vierge
            </p>
          </button>

          <button
            onClick={handleOpenFile}
            disabled={isLoading}
            className="w-full p-6 text-left border border-gray-300 bg-white hover:bg-gray-50 hover:border-black hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:bg-white disabled:hover:shadow-none group cursor-pointer rounded-lg"
          >
            <h2 className="text-xl font-medium mb-2 group-hover:translate-x-1 transition-transform duration-200">
              📂 Ouvrir un fichier
            </h2>
            <p className="text-sm text-gray-500">
              Ouvrir un fichier MiniCompta existant (.compta)
            </p>
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
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
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Version 1.0.0
          </p>
          <p className="text-xs text-gray-400 mt-1">Burundi 🇧🇮</p>
        </div>
      </div>
    </div>
  );
}
