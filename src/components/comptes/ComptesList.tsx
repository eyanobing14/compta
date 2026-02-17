import React, { useState, useEffect } from "react";
import { Compte, TypeCompte, TYPE_COMPTE_LABELS } from "../../types/comptes";
import {
  getComptes,
  deleteCompte,
  checkCompteUsed,
} from "../../lib/comptes.db";
import { CompteForm } from "./CompteForm";

// Dialogue de suppression pour compte
function DeleteCompteDialog({
  isOpen,
  onClose,
  onConfirm,
  compteDetails,
  isUsed,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  compteDetails: {
    numero: string;
    libelle: string;
  };
  isUsed: boolean;
}) {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 ${isUsed ? "bg-red-100" : "bg-amber-100"} rounded-full`}
              >
                <svg
                  className={`w-6 h-6 ${isUsed ? "text-red-600" : "text-amber-600"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isUsed ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  )}
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Supprimer le compte
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
          <div
            className={`mb-6 p-4 ${isUsed ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"} border rounded-md`}
          >
            {isUsed ? (
              <>
                <p className="text-sm font-medium text-red-800 mb-1">
                  ⚠️ Ce compte est utilisé dans des écritures
                </p>
                <p className="text-xs text-red-600">
                  Impossible de supprimer un compte qui a déjà été utilisé.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Êtes-vous sûr de vouloir supprimer ce compte ?
                </p>
                <p className="text-xs text-amber-600">
                  Cette action est irréversible.
                </p>
              </>
            )}
          </div>

          {/* Détails du compte */}
          <div className="mb-6 space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Compte</p>
              <div className="bg-gray-50 p-3 border border-gray-200 rounded-md">
                <p className="font-mono text-sm font-medium text-gray-900">
                  {compteDetails.numero}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  {compteDetails.libelle}
                </p>
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
              ❌ {error}
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            {!isUsed && (
              <button
                onClick={handleConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
            )}
            {isUsed && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ComptesList() {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [filterType, setFilterType] = useState<TypeCompte | "TOUS">("TOUS");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCompte, setEditingCompte] = useState<Compte | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    compte: Compte | null;
    isUsed: boolean;
  }>({
    isOpen: false,
    compte: null,
    isUsed: false,
  });

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

  const handleDeleteClick = async (compte: Compte) => {
    try {
      const isUsed = await checkCompteUsed(compte.numero);
      setDeleteDialog({
        isOpen: true,
        compte: compte,
        isUsed: isUsed,
      });
    } catch (error) {
      console.error("Erreur vérification utilisation compte:", error);
      alert("Erreur lors de la vérification du compte");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.compte) return;

    try {
      await deleteCompte(deleteDialog.compte.numero);
      await loadComptes();
    } catch (err) {
      throw err;
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
      ACTIF: "bg-blue-50 text-blue-700 border-blue-200",
      PASSIF: "bg-purple-50 text-purple-700 border-purple-200",
      PRODUIT: "bg-green-50 text-green-700 border-green-200",
      CHARGE: "bg-orange-50 text-orange-700 border-orange-200",
      TRESORERIE: "bg-cyan-50 text-cyan-700 border-cyan-200",
    };
    return type && colors[type]
      ? colors[type]
      : "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case "ACTIF":
        return (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        );
      case "PASSIF":
        return (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        );
      case "PRODUIT":
        return (
          <svg
            className="w-3 h-3 mr-1"
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
        );
      case "CHARGE":
        return (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        );
      case "TRESORERIE":
        return (
          <svg
            className="w-3 h-3 mr-1"
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
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
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
      {/* Dialogue de suppression */}
      {deleteDialog.isOpen && deleteDialog.compte && (
        <DeleteCompteDialog
          isOpen={deleteDialog.isOpen}
          onClose={() =>
            setDeleteDialog({ isOpen: false, compte: null, isUsed: false })
          }
          onConfirm={handleDeleteConfirm}
          compteDetails={{
            numero: deleteDialog.compte.numero,
            libelle: deleteDialog.compte.libelle,
          }}
          isUsed={deleteDialog.isUsed}
        />
      )}

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
          className="px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors flex items-center gap-2 cursor-pointer"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nouveau compte
        </button>
      </div>

      {/* Filtres avec SVG */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType("TOUS")}
          className={`px-4 py-2 text-sm font-medium border rounded-md flex items-center gap-2 transition-colors cursor-pointer ${
            filterType === "TOUS"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          Tous les comptes
        </button>
        {Object.entries(TYPE_COMPTE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setFilterType(type as TypeCompte)}
            className={`px-4 py-2 text-sm font-medium border rounded-md flex items-center gap-2 transition-colors cursor-pointer ${
              filterType === type
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {getTypeIcon(type)}
            <span>{label.replace(/^[^\s]+\s/, "")}</span>
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
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Numéro
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Libellé
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {comptes.map((compte, index) => (
              <tr
                key={compte.numero}
                className={`hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                  {compte.numero}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {compte.libelle}
                </td>
                <td className="px-6 py-4">
                  {compte.type_compte && (
                    <span
                      className={`inline-flex items-center px-3 py-1 text-xs font-medium border rounded-full ${getTypeBadgeColor(compte.type_compte)}`}
                    >
                      {getTypeIcon(compte.type_compte)}
                      {TYPE_COMPTE_LABELS[compte.type_compte].replace(
                        /^[^\s]+\s/,
                        "",
                      )}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEdit(compte)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors mr-1 cursor-pointer rounded-md hover:bg-blue-50"
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
                    onClick={() => handleDeleteClick(compte)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer rounded-md hover:bg-red-50"
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
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p>Aucun compte trouvé</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
