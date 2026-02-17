// Dashboard.tsx (mise à jour)
import React, { useState, useEffect } from "react";
import { ExercicesList } from "../exercices/ExercicesList";
import { ComptesList } from "../comptes/ComptesList";
import { Journal } from "../ecritures/Journal";
import { GrandLivre } from "../grand-livre/GrandLivre";
import { Balance } from "../balance/Balance";
import { Bilan } from "../bilan/Bilan";
import { CompteResultat } from "../resultat/CompteResultat";
import { ErrorBoundary } from "../ErrorBoundary";
import { getExercices } from "../../lib/exercice.db";
import { Exercice } from "../../types/exercice";

interface DashboardProps {
  currentFile: string;
  onCloseFile: () => void;
}

export function Dashboard({ currentFile, onCloseFile }: DashboardProps) {
  const [currentView, setCurrentView] = useState<
    | "exercices"
    | "comptes"
    | "journal"
    | "grand-livre"
    | "balance"
    | "bilan"
    | "resultat"
  >("comptes");
  const [exerciceOuvert, setExerciceOuvert] = useState<Exercice | null>(null);
  const [closedExerciceView, setClosedExerciceView] = useState<Exercice | null>(
    null,
  );
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

  const handleViewClosedExercice = (exercice: Exercice) => {
    setClosedExerciceView(exercice);
    setCurrentView("journal");
  };

  // Déterminer quel exercice afficher (ouvert ou clôturé consulté)
  const visibleExercice = closedExerciceView || exerciceOuvert;
  const isReadOnly = !!closedExerciceView;

  return (
    <div className="flex h-screen bg-white text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 flex flex-col h-full bg-white">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.svg" alt="MiniCompta" className="w-10 h-10" />
            <h1 className="text-2xl font-semibold tracking-tighter">
              MiniCompta
            </h1>
          </div>

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
                className="font-mono truncate text-[16px] text-gray-500"
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
                !isReadOnly
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-300"
              }`}
            >
              {visibleExercice ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${!isReadOnly ? "bg-green-500" : "bg-gray-500"}`}
                    ></span>
                    <span
                      className={`font-medium ${!isReadOnly ? "text-green-700" : "text-gray-700"}`}
                    >
                      {!isReadOnly ? "Exercice ouvert" : "Exercice clôturé"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="font-medium">
                      {visibleExercice.nom_exercice}
                    </span>
                    <br />
                    {new Date(visibleExercice.date_debut).toLocaleDateString(
                      "fr-BI",
                    )}{" "}
                    →{" "}
                    {new Date(visibleExercice.date_fin).toLocaleDateString(
                      "fr-BI",
                    )}
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
            {/* Journal */}
            <button
              onClick={() => setCurrentView("journal")}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors cursor-pointer ${
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

            {/* Grand Livre */}
            <button
              onClick={() => setCurrentView("grand-livre")}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors cursor-pointer ${
                currentView === "grand-livre"
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
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Grand Livre</span>
            </button>

            {/* Balance */}
            <button
              onClick={() => setCurrentView("balance")}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors cursor-pointer ${
                currentView === "balance"
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
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span>Balance</span>
            </button>

            {/* Bilan */}
            <button
              onClick={() => setCurrentView("bilan")}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors cursor-pointer ${
                currentView === "bilan"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Bilan</span>
            </button>

            {/* Compte de Résultat */}
            <button
              onClick={() => setCurrentView("resultat")}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors cursor-pointer ${
                currentView === "resultat"
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Compte de résultat</span>
            </button>

            {/* Exercices */}
            {!isReadOnly && (
              <button
                onClick={() => setCurrentView("exercices")}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors cursor-pointer ${
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
            )}

            {/* Plan comptable */}
            {!isReadOnly && (
              <button
                onClick={() => setCurrentView("comptes")}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors cursor-pointer ${
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
            )}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-200 space-y-2">
          {isReadOnly && (
            <button
              onClick={() => setClosedExerciceView(null)}
              className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer rounded flex items-center gap-3"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Retour</span>
            </button>
          )}
          <button
            onClick={onCloseFile}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer rounded flex items-center gap-3"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Fermer le fichier</span>
          </button>
          <div className="text-xs text-gray-400 text-center">
            <div className="flex items-center justify-center gap-1">
              <span>🇧🇮</span>
              <span>MiniCompta v1.0</span>
            </div>
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
            {currentView === "grand-livre" && "Grand Livre"}
            {currentView === "balance" && "Balance comptable"}
            {currentView === "bilan" && "Bilan"}
            {currentView === "resultat" && "Compte de résultat"}
          </h2>
        </div>
        <ErrorBoundary
          fallback={
            <div className="text-center p-8 border border-red-200 bg-red-50">
              <p className="text-red-700">Une erreur est survenue</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer"
              >
                Réessayer
              </button>
            </div>
          }
        >
          {currentView === "comptes" && <ComptesList />}
          {currentView === "journal" && <Journal />}
          {currentView === "grand-livre" && (
            <GrandLivre exerciceOuvert={visibleExercice} />
          )}
          {currentView === "balance" && (
            <Balance exerciceOuvert={visibleExercice} />
          )}
          {currentView === "bilan" && (
            <Bilan exerciceOuvert={visibleExercice} />
          )}
          {currentView === "resultat" && (
            <CompteResultat exerciceOuvert={visibleExercice} />
          )}
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
              onViewClosedExercice={handleViewClosedExercice}
            />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
