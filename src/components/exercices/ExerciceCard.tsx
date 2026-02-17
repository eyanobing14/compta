import React from "react";
import { Exercice } from "../../types/exercice";

interface ExerciceCardProps {
  exercice: Exercice;
  onCloturer: (id: number, nom: string) => void;
  clotureEnCours: number | null;
}

export function ExerciceCard({
  exercice,
  onCloturer,
  clotureEnCours,
}: ExerciceCardProps) {
  const estClos = exercice.est_clos;

  return (
    <div
      className={`border p-4 ${!estClos ? "border-green-300 bg-green-50/30" : "border-gray-200"}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">{exercice.nom_entreprise}</h3>
          <p className="text-sm text-gray-600">
            {exercice.nom_exercice} • {exercice.date_debut} →{" "}
            {exercice.date_fin}
          </p>
          <div className="flex gap-2 mt-2">
            {estClos ? (
              <span className="text-xs bg-gray-200 px-2 py-1">Clôturé</span>
            ) : (
              <span className="text-xs bg-green-200 px-2 py-1">Ouvert</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!estClos && (
            <button
              onClick={() => onCloturer(exercice.id, exercice.nom_exercice)}
              disabled={clotureEnCours === exercice.id}
              className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1 min-w-[80px] justify-center transition-colors cursor-pointer"
            >
              {clotureEnCours === exercice.id ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </>
              ) : (
                "Clôturer"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
