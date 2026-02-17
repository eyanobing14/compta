// src/components/exercices/ClotureDialog.tsx

import React, { useState } from "react";
import { Spinner } from "./Spinner";

interface ClotureDialogProps {
  exerciceId: number;
  exerciceNom: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ClotureDialog({
  exerciceId,
  exerciceNom,
  onConfirm,
  onCancel,
}: ClotureDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);

    try {
      await onConfirm();
      // Le dialogue sera fermé par le parent après succès
    } catch (error) {
      console.error("Erreur lors de la clôture:", error);
      setError("Erreur lors de la clôture. Veuillez réessayer.");
      setIsConfirming(false);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-4">
        Clôturer l'exercice {exerciceNom}
      </h3>

      <div className="mb-6 p-4 bg-amber-50 border border-amber-200">
        <h4 className="font-medium mb-2 text-amber-800">
          ⚠️ Conséquences de la clôture :
        </h4>
        <ul className="space-y-2 text-sm text-amber-700">
          <li className="flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>L'exercice sera verrouillé (lecture seule)</span>
          </li>
          <li className="flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <span>Plus aucune écriture ne pourra être ajoutée</span>
          </li>
          <li className="flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>
              L'application sera en attente de création d'un nouvel exercice
            </span>
          </li>
        </ul>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700">
          <p className="font-medium">❌ {error}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={isConfirming}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
        >
          Annuler
        </button>
        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center transition-colors cursor-pointer"
        >
          {isConfirming ? (
            <>
              <Spinner size="sm" color="text-white" />
              <span>Clôture...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Confirmer la clôture</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
