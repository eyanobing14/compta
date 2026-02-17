import { useState } from "react";
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
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
        <div className="p-6 space-y-6">
          {/* En-tête */}
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Supprimer l'écriture ?
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {ecritureDetails.libelle}
            </p>
          </div>

          {/* Message d'avertissement */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-700 uppercase">
              ⚠️ Cette action est irréversible
            </p>
          </div>

          {/* Détails minimaux */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Montant :</span>
            <span className="font-semibold text-gray-900">
              {formatMontant(ecritureDetails.montant)}
            </span>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" color="text-white" />
                  <span>Suppression...</span>
                </>
              ) : (
                <span>Supprimer</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
