import { useState } from "react";
import { Spinner } from "./Spinner";

interface ClotureDialogProps {
  exerciceNom: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ClotureDialog({
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
    } catch (error) {
      console.error("Erreur lors de la clôture:", error);
      setError("Erreur lors de la clôture. Veuillez réessayer.");
      setIsConfirming(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">
          Clôturer {exerciceNom} ?
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Cette action ferme l'exercice et le rend inaccessible en modification
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={isConfirming}
          className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Annuler
        </button>
        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="px-6 py-3 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center transition-colors cursor-pointer"
        >
          {isConfirming ? (
            <>
              <Spinner size="sm" color="text-white" />
              <span>Clôture...</span>
            </>
          ) : (
            <span>Confirmer</span>
          )}
        </button>
      </div>
    </div>
  );
}
