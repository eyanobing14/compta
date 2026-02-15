import React, { useState, useEffect } from "react";
import { Compte, TypeCompte, TYPE_COMPTE_LABELS } from "../../types/comptes";
import { getComptes, deleteCompte } from "../../lib/comptes.db";
import { CompteForm } from "./CompteForm";

export function ComptesList() {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [filterType, setFilterType] = useState<TypeCompte | "TOUS">("TOUS");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCompte, setEditingCompte] = useState<Compte | null>(null);

  const loadComptes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getComptes(
        filterType === "TOUS" ? null : filterType,
        true,
      );
      setComptes(data);
    } catch (err) {
      setError("Erreur lors du chargement des comptes");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComptes();
  }, [filterType]);

  const handleDelete = async (numero: string, libelle: string) => {
    if (
      !confirm(
        `Voulez-vous vraiment supprimer le compte ${numero} - ${libelle} ?`,
      )
    )
      return;
    try {
      await deleteCompte(numero);
      await loadComptes();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Erreur lors de la suppression",
      );
    }
  };

  const handleEdit = (compte: Compte) => {
    setEditingCompte(compte);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCompte(null);
    loadComptes();
  };

  const getTypeBadgeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      ACTIF: "bg-blue-50 text-blue-700",
      PASSIF: "bg-purple-50 text-purple-700",
      PRODUIT: "bg-green-50 text-green-700",
      CHARGE: "bg-orange-50 text-orange-700",
      TRESORERIE: "bg-cyan-50 text-cyan-700",
    };
    return type && colors[type] ? colors[type] : "bg-gray-50 text-gray-700";
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan comptable</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez votre liste de comptes comptables
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCompte(null);
            setShowForm(true);
          }}
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
          Nouveau compte
        </button>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType("TOUS")}
          className={`px-3 py-1 text-xs font-medium uppercase tracking-wider border ${
            filterType === "TOUS"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Tous
        </button>
        {Object.entries(TYPE_COMPTE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setFilterType(type as TypeCompte)}
            className={`px-3 py-1 text-xs font-medium uppercase tracking-wider border ${
              filterType === type
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCompte ? "Modifier le compte" : "Nouveau compte"}
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
            <CompteForm
              compte={editingCompte || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingCompte(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Tableau */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Numéro
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Libellé
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {comptes.map((compte) => (
              <tr key={compte.numero} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm text-gray-900">
                  {compte.numero}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {compte.libelle}
                </td>
                <td className="px-4 py-3">
                  {compte.type_compte && (
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium ${getTypeBadgeColor(compte.type_compte)}`}
                    >
                      {TYPE_COMPTE_LABELS[compte.type_compte]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(compte)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors mr-2"
                    title="Modifier"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(compte.numero, compte.libelle)}
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
            {comptes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Aucun compte trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
