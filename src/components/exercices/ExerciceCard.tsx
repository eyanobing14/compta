import { Exercice } from "../../types/exercice";

interface ExerciceCardProps {
  exercice: Exercice;
  onCloturer: (id: number, nom: string) => void;
  onViewClosed?: (exercice: Exercice) => void;
  clotureEnCours: number | null;
}

export function ExerciceCard({
  exercice,
  onCloturer,
  onViewClosed,
  clotureEnCours,
}: ExerciceCardProps) {
  const estClos = exercice.est_clos;

  return (
    <div
      className={`border rounded-lg p-6 transition-all ${
        !estClos
          ? "border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-md"
          : "border-gray-300 bg-gray-50 hover:shadow-md cursor-pointer"
      }`}
      onClick={() => estClos && onViewClosed?.(exercice)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              {exercice.nom_entreprise}
            </h3>
            {estClos ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Archivé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-green-700 bg-green-200 rounded-full">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Actif
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{exercice.nom_exercice}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
            </svg>
            <span>
              <strong>{exercice.date_debut}</strong> →{" "}
              <strong>{exercice.date_fin}</strong>
            </span>
          </div>
        </div>

        {/* Actions */}
        {!estClos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCloturer(exercice.id, exercice.nom_exercice);
            }}
            disabled={clotureEnCours === exercice.id}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Clôture...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Clôture</span>
              </>
            )}
          </button>
        )}
        {estClos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewClosed?.(exercice);
            }}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors cursor-pointer flex items-center gap-2"
          >
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>Consulter</span>
          </button>
        )}
      </div>
    </div>
  );
}
