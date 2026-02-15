import React, { useState, useEffect } from "react";
import { ExercicesList } from "../exercices/ExercicesList";
import { ComptesList } from "../comptes/ComptesList";
import { Journal } from "../ecritures/Journal";
import { ErrorBoundary } from "../ErrorBoundary";
import { getExercices } from "../../lib/exercice.db";
import { Exercice } from "../../types/exercice";

interface DashboardProps {
  currentFile: string;
}

export function Dashboard({ currentFile }: DashboardProps) {
  const [currentView, setCurrentView] = useState<
    "exercices" | "comptes" | "journal"
  >("comptes"); // Changé de "exercices" à "comptes" pour commencer par les comptes
  const [exerciceOuvert, setExerciceOuvert] = useState<Exercice | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les exercices pour trouver celui qui est ouvert
  useEffect(() => {
    const chargerExerciceOuvert = async () => {
      try {
        const exercices = await getExercices();
        // Trouver le premier exercice non clos (ouvert)
        const ouvert = exercices.find((ex) => !ex.est_clos) || null;
        setExerciceOuvert(ouvert);
      } catch (error) {
        console.error("Erreur chargement exercice ouvert:", error);
      } finally {
        setLoading(false);
      }
    };

    chargerExerciceOuvert();
  }, []);

  return (
    <div className="flex h-screen bg-white text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 flex flex-col h-full bg-white">
        <div className="p-6">
          <h1 className="text-2xl font-light tracking-tighter mb-8">
            MINICOMPTA
          </h1>

          {/* Infos fichier */}
          <div className="mb-4 p-3 border border-gray-400 text-xs">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <span
                className="font-mono truncate text-[16px] text-gay-500"
                title={currentFile}
              >
                {currentFile.split(/[\\/]/).pop()}
              </span>
            </div>
          </div>

          {/* Indicateur d'exercice ouvert */}
          {!loading && (
            <div
              className={`mb-6 p-3 text-sm border ${
                exerciceOuvert
                  ? "bg-green-50 border-green-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              {exerciceOuvert ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="font-medium text-green-700">
                      Exercice ouvert
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="font-medium">
                      {exerciceOuvert.nom_exercice}
                    </span>
                    <br />
                    {exerciceOuvert.date_debut} → {exerciceOuvert.date_fin}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span className="font-medium text-amber-700">
                      Aucun exercice ouvert
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Créez d'abord un exercice
                  </p>
                </>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-1">
            {/* Comptes - en premier */}
            <button
              onClick={() => setCurrentView("comptes")}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                currentView === "comptes"
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span>Plan comptable</span>
            </button>

            {/* Exercices */}
            <button
              onClick={() => setCurrentView("exercices")}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                currentView === "exercices"
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Exercices</span>
            </button>

            {/* Journal */}
            <button
              onClick={() => setCurrentView("journal")}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                currentView === "journal"
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Journal</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-200">
          <div className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
            <span>🇧🇮</span>
            <span>MiniCompta v1.0</span>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <h2 className="text-lg font-medium">
            {currentView === "comptes" && "Plan comptable"}
            {currentView === "exercices" && "Gestion des exercices"}
            {currentView === "journal" && "Journal des écritures"}
          </h2>
        </div>
        <ErrorBoundary
          fallback={
            <div className="text-center p-8 border border-red-200 bg-red-50">
              <p className="text-red-700">Une erreur est survenue</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
              >
                Réessayer
              </button>
            </div>
          }
        >
          {currentView === "comptes" && <ComptesList />}
          {currentView === "exercices" && (
            <ExercicesList
              exerciceOuvert={exerciceOuvert}
              onExerciceChange={() => {
                // Recharger l'exercice ouvert quand la liste change
                const reload = async () => {
                  const exercices = await getExercices();
                  const ouvert = exercices.find((ex) => !ex.est_clos) || null;
                  setExerciceOuvert(ouvert);
                };
                reload();
              }}
            />
          )}
          {currentView === "journal" && <Journal />}
        </ErrorBoundary>
      </main>
    </div>
  );
}
