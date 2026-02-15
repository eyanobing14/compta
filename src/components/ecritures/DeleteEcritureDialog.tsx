import React, { useState, useEffect } from "react";
import { Spinner } from "../exercices/Spinner";

interface DeleteEcritureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  ecritureDetails: {
    id: number;
    libelle: string;
    montant: number;
    compte_debit: string;
    compte_credit: string;
    date: string;
  };
}

export function DeleteEcritureDialog({
  isOpen,
  onClose,
  onConfirm,
  ecritureDetails,
}: DeleteEcritureDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (error) {
      setError("Erreur lors de la suppression");
      setIsDeleting(false);
    }
  };

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-BI", {
        minimumFractionDigits: 0,
      }).format(montant) + " FBU"
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Supprimer l'écriture
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
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
            </button>
          </div>

          {/* Message d'avertissement */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              Êtes-vous sûr de vouloir supprimer cette écriture ?
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Cette action est irréversible.
            </p>
          </div>

          {/* Détails de l'écriture */}
          <div className="mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase">Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(ecritureDetails.date).toLocaleDateString("fr-BI")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Montant</p>
                <p className="font-medium text-gray-900">
                  {formatMontant(ecritureDetails.montant)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Libellé</p>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 border border-gray-100">
                {ecritureDetails.libelle}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Compte débit
                </p>
                <p className="text-sm font-mono text-blue-600 bg-blue-50 p-2 border border-blue-100">
                  {ecritureDetails.compte_debit}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Compte crédit
                </p>
                <p className="text-sm font-mono text-red-600 bg-red-50 p-2 border border-red-100">
                  {ecritureDetails.compte_credit}
                </p>
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              ❌ {error}
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" color="text-white" />
                  <span>Suppression...</span>
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Confirmer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
