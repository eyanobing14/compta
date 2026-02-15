import React, { useState, useEffect } from "react";
import { Ecriture, EcritureFilters } from "../../types/ecritures";
import {
  getEcritures,
  deleteEcriture,
  getJournalSummary,
  createEcriture,
} from "../../lib/ecritures.db";
import { EcritureForm } from "./EcritureForm";
import { getExerciceActif } from "../../lib/exercice.db";

// Composant Toast
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) => {
  useEffect(() => {
    if (type === "success") {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 p-4 max-w-md ${
        type === "success"
          ? "bg-green-50 border-l-4 border-green-500"
          : "bg-red-50 border-l-4 border-red-500"
      }`}
    >
      <div className="flex items-start gap-3">
        {type === "success" ? (
          <svg
            className="w-5 h-5 text-green-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-red-500 flex-shrink-0"
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
        )}
        <div className="flex-1">
          <p
            className={`text-sm ${type === "success" ? "text-green-700" : "text-red-700"}`}
          >
            {message}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export function Journal() {
  const [ecritures, setEcritures] = useState<Ecriture[]>([]);
  const [summary, setSummary] = useState({
    total_ecritures: 0,
    total_debit: 0,
    ecritures_aujourdhui: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<EcritureFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const loadEcritures = async () => {
    setIsLoading(true);
    try {
      const data = await getEcritures(filters);
      setEcritures(data);
      const summaryData = await getJournalSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error("Erreur chargement écritures:", error);
      showToast("Erreur lors du chargement des écritures", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEcritures();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, searchTerm }));
  };

  const handleDelete = async (id: number, libelle: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'écriture "${libelle}" ?`))
      return;
    try {
      await deleteEcriture(id);
      await loadEcritures();
      showToast("Écriture supprimée avec succès", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      // Messages d'erreur personnalisés
      if (errorMessage === "EXERCICE_CLOTURE") {
        showToast(
          "Impossible de supprimer une écriture dans un exercice clôturé",
          "error",
        );
      } else {
        showToast("Erreur lors de la suppression", "error");
      }
    }
  };

  const handleCreateEcriture = async (data: any) => {
    try {
      await createEcriture(data);
      setShowForm(false);
      await loadEcritures();
      showToast("Écriture créée avec succès", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      // Vérifier s'il y a un exercice actif
      const exerciceActif = await getExerciceActif();

      // Messages d'erreur personnalisés
      if (errorMessage === "AUCUN_EXERCICE") {
        if (
          confirm(
            "Aucun exercice actif. Voulez-vous créer un exercice maintenant ?",
          )
        ) {
          // Rediriger vers la page des exercices
          window.location.href = "#exercices";
          setShowForm(false);
        }
      } else if (errorMessage === "EXERCICE_CLOTURE") {
        showToast(
          "Impossible d'ajouter une écriture dans un exercice clôturé",
          "error",
        );
      } else if (errorMessage === "DATE_HORS_EXERCICE") {
        showToast(
          `La date doit être entre ${exerciceActif?.date_debut} et ${exerciceActif?.date_fin}`,
          "error",
        );
      } else if (errorMessage === "MONTANT_INVALIDE") {
        showToast("Le montant doit être un nombre positif", "error");
      } else if (errorMessage?.startsWith("COMPTE_DEBIT_INEXISTANT:")) {
        const compte = errorMessage.split(":")[1];
        showToast(`Le compte débit ${compte} n'existe pas`, "error");
      } else if (errorMessage?.startsWith("COMPTE_CREDIT_INEXISTANT:")) {
        const compte = errorMessage.split(":")[1];
        showToast(`Le compte crédit ${compte} n'existe pas`, "error");
      } else if (errorMessage === "COMPTES_IDENTIQUES") {
        showToast(
          "Les comptes débit et crédit doivent être différents",
          "error",
        );
      } else if (errorMessage === "DATE_FORMAT_INVALIDE") {
        showToast("Le format de date est invalide", "error");
      } else {
        showToast("Erreur lors de la création", "error");
      }
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-BI", {
      style: "currency",
      currency: "FBU",
      minimumFractionDigits: 0,
    })
      .format(montant)
      .replace("FBU", "FBU");
  };

  return (
    <div className="p-8">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* En-tête avec stats */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Journal des écritures
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez toutes vos écritures comptables
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors flex items-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nouvelle écriture
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">
                Total écritures
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.total_ecritures}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">
                Total débits
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatMontant(summary.total_debit)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50">
              <svg
                className="w-6 h-6 text-green-600"
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
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">
                Aujourd'hui
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.ecritures_aujourdhui}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Nouvelle écriture
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
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
            <EcritureForm
              onSubmit={handleCreateEcriture}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans le journal..."
              className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            Rechercher
          </button>
        </form>

        <div className="flex gap-2">
          <select
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                compte: e.target.value || undefined,
              }))
            }
            className="h-10 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          >
            <option value="">Tous les comptes</option>
          </select>
          <input
            type="date"
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dateDebut: e.target.value || undefined,
              }))
            }
            className="h-10 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            placeholder="Date début"
          />
          <input
            type="date"
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dateFin: e.target.value || undefined,
              }))
            }
            className="h-10 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            placeholder="Date fin"
          />
        </div>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <svg
            className="animate-spin h-8 w-8 text-gray-900"
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
        </div>
      ) : (
        <div className="border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Libellé
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Débit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crédit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ecritures.map((ecriture) => (
                <tr key={ecriture.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(ecriture.date).toLocaleDateString("fr-BI")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {ecriture.libelle}
                    </div>
                    {ecriture.observation && (
                      <div className="text-xs text-gray-500 mt-1">
                        {ecriture.observation}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-blue-600">
                      {ecriture.compte_debit}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {ecriture.debit_libelle}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-red-600">
                      {ecriture.compte_credit}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {ecriture.credit_libelle}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-medium text-gray-900">
                    {formatMontant(ecriture.montant)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        handleDelete(ecriture.id, ecriture.libelle)
                      }
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Supprimer"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {ecritures.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Aucune écriture trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
