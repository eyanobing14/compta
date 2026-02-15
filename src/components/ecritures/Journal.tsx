import React, { useState, useEffect } from "react";
import { Ecriture, EcritureFilters } from "../../types/ecritures";
import {
  getEcritures,
  deleteEcriture,
  getJournalSummary,
  createEcriture,
  updateEcriture,
  getEcritureById,
  getEcrituresPaginated,
  getTotalEcrituresCount,
} from "../../lib/ecritures.db";
import { EcritureForm } from "./EcritureForm";
import { DeleteEcritureDialog } from "./DeleteEcritureDialog";
import { getExerciceActif } from "../../lib/exercice.db";
import { Toast, ToastType } from "../exercices/Toast";
import { Spinner } from "../exercices/Spinner";

export function Journal() {
  const [ecritures, setEcritures] = useState<Ecriture[]>([]);
  const [summary, setSummary] = useState({
    total_ecritures: 0,
    total_debit: 0,
    ecritures_aujourdhui: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEcriture, setEditingEcriture] = useState<Ecriture | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    ecriture: Ecriture | null;
  }>({
    isOpen: false,
    ecriture: null,
  });
  const [filters, setFilters] = useState<EcritureFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [showLibellePopup, setShowLibellePopup] = useState<{
    id: number;
    libelle: string;
    observation: string | null;
  } | null>(null);

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const loadEcritures = async () => {
    setIsLoading(true);
    try {
      // Récupérer les écritures paginées
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const data = await getEcrituresPaginated(filters, ITEMS_PER_PAGE, offset);
      setEcritures(data);

      // Récupérer le nombre total d'écritures pour la pagination
      const total = await getTotalEcrituresCount(filters);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));

      // Récupérer le résumé (indépendant de la pagination)
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
  }, [filters, currentPage]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, searchTerm }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (ecriture: Ecriture) => {
    setDeleteDialog({
      isOpen: true,
      ecriture: ecriture,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.ecriture) return;

    try {
      await deleteEcriture(deleteDialog.ecriture.id);
      await loadEcritures();
      showToast("✅ Écriture supprimée avec succès", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      if (errorMessage === "EXERCICE_CLOTURE") {
        showToast(
          "❌ Impossible de supprimer une écriture dans un exercice clôturé",
          "error",
        );
        throw error;
      } else {
        showToast("❌ Erreur lors de la suppression", "error");
        throw error;
      }
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const ecriture = await getEcritureById(id);
      if (ecriture) {
        setEditingEcriture(ecriture);
        setShowForm(true);
      }
    } catch (error) {
      console.error("Erreur chargement écriture:", error);
      showToast("❌ Erreur lors du chargement de l'écriture", "error");
    }
  };

  const handleCreateEcriture = async (data: any) => {
    try {
      await createEcriture(data);
      setShowForm(false);
      setEditingEcriture(null);
      await loadEcritures();
      showToast("✅ Écriture créée avec succès", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      const exerciceActif = await getExerciceActif();

      if (errorMessage === "AUCUN_EXERCICE") {
        if (
          confirm(
            "Aucun exercice actif. Voulez-vous créer un exercice maintenant ?",
          )
        ) {
          window.location.href = "#exercices";
          setShowForm(false);
        }
      } else if (errorMessage === "EXERCICE_CLOTURE") {
        showToast(
          "❌ Impossible d'ajouter une écriture dans un exercice clôturé",
          "error",
        );
      } else if (errorMessage === "DATE_HORS_EXERCICE") {
        showToast(
          `❌ La date doit être entre ${exerciceActif?.date_debut} et ${exerciceActif?.date_fin}`,
          "error",
        );
      } else if (errorMessage === "MONTANT_INVALIDE") {
        showToast("❌ Le montant doit être un nombre positif", "error");
      } else if (errorMessage?.startsWith("COMPTE_DEBIT_INEXISTANT:")) {
        const compte = errorMessage.split(":")[1];
        showToast(`❌ Le compte débit ${compte} n'existe pas`, "error");
      } else if (errorMessage?.startsWith("COMPTE_CREDIT_INEXISTANT:")) {
        const compte = errorMessage.split(":")[1];
        showToast(`❌ Le compte crédit ${compte} n'existe pas`, "error");
      } else if (errorMessage === "COMPTES_IDENTIQUES") {
        showToast(
          "❌ Les comptes débit et crédit doivent être différents",
          "error",
        );
      } else if (errorMessage === "DATE_FORMAT_INVALIDE") {
        showToast("❌ Le format de date est invalide", "error");
      } else {
        showToast("❌ Erreur lors de la création", "error");
      }
    }
  };

  const handleUpdateEcriture = async (data: any) => {
    if (!editingEcriture) return;

    try {
      await updateEcriture(editingEcriture.id, data);
      setShowForm(false);
      setEditingEcriture(null);
      await loadEcritures();
      showToast("✅ Écriture modifiée avec succès", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      const exerciceActif = await getExerciceActif();

      if (errorMessage === "EXERCICE_CLOTURE") {
        showToast(
          "❌ Impossible de modifier une écriture dans un exercice clôturé",
          "error",
        );
      } else if (errorMessage === "DATE_HORS_EXERCICE") {
        showToast(
          `❌ La date doit être entre ${exerciceActif?.date_debut} et ${exerciceActif?.date_fin}`,
          "error",
        );
      } else if (errorMessage === "MONTANT_INVALIDE") {
        showToast("❌ Le montant doit être un nombre positif", "error");
      } else if (errorMessage?.startsWith("COMPTE_DEBIT_INEXISTANT:")) {
        const compte = errorMessage.split(":")[1];
        showToast(`❌ Le compte débit ${compte} n'existe pas`, "error");
      } else if (errorMessage?.startsWith("COMPTE_CREDIT_INEXISTANT:")) {
        const compte = errorMessage.split(":")[1];
        showToast(`❌ Le compte crédit ${compte} n'existe pas`, "error");
      } else if (errorMessage === "COMPTES_IDENTIQUES") {
        showToast(
          "❌ Les comptes débit et crédit doivent être différents",
          "error",
        );
      } else {
        showToast("❌ Erreur lors de la modification", "error");
      }
    }
  };

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-BI", {
        minimumFractionDigits: 0,
      }).format(montant) + " FBU"
    );
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const delta = 2; // Nombre de pages à afficher de chaque côté de la page courante
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <div className="p-8 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60]">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Dialogue de suppression */}
      {deleteDialog.isOpen && deleteDialog.ecriture && (
        <DeleteEcritureDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, ecriture: null })}
          onConfirm={handleDeleteConfirm}
          ecritureDetails={{
            id: deleteDialog.ecriture.id,
            libelle: deleteDialog.ecriture.libelle,
            montant: deleteDialog.ecriture.montant,
            compte_debit: deleteDialog.ecriture.compte_debit,
            compte_credit: deleteDialog.ecriture.compte_credit,
            date: deleteDialog.ecriture.date,
          }}
        />
      )}

      {/* Popup pour afficher le libellé complet */}
      {showLibellePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Détail de l'écriture
              </h3>
              <button
                onClick={() => setShowLibellePopup(null)}
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
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Libellé
                </p>
                <p className="text-gray-900">{showLibellePopup.libelle}</p>
              </div>
              {showLibellePopup.observation && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Observation
                  </p>
                  <p className="text-gray-900">
                    {showLibellePopup.observation}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowLibellePopup(null)}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
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
          onClick={() => {
            setEditingEcriture(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors flex items-center gap-2 cursor-pointer"
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

      {/* Statistiques - sans animation */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

        {/* Total débit - bleu fixe */}
        <div className="bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100">
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

        {/* Total crédit - rouge fixe */}
        <div className="bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">
                Total crédits
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatMontant(summary.total_debit)}{" "}
                {/* Même montant car total débit = total crédit normalement */}
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
                {editingEcriture ? "Modifier l'écriture" : "Nouvelle écriture"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingEcriture(null);
                }}
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
            <EcritureForm
              onSubmit={
                editingEcriture ? handleUpdateEcriture : handleCreateEcriture
              }
              onCancel={() => {
                setShowForm(false);
                setEditingEcriture(null);
              }}
              initialData={
                editingEcriture
                  ? {
                      date: editingEcriture.date,
                      libelle: editingEcriture.libelle,
                      compte_debit: editingEcriture.compte_debit,
                      compte_credit: editingEcriture.compte_credit,
                      montant: editingEcriture.montant.toString(),
                      numero_piece: editingEcriture.numero_piece || "",
                      observation: editingEcriture.observation || "",
                    }
                  : undefined
              }
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
              className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors cursor-pointer"
          >
            Rechercher
          </button>
        </form>

        <div className="flex gap-2">
          <input
            type="date"
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dateDebut: e.target.value || undefined,
              }))
            }
            className="h-10 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text"
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
            className="h-10 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text"
            placeholder="Date fin"
          />
        </div>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Libellé
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Compte débit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Compte crédit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {ecritures.map((ecriture) => (
                  <tr
                    key={ecriture.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(ecriture.date).toLocaleDateString("fr-BI")}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 truncate">
                          {ecriture.libelle}
                        </span>
                        {(ecriture.libelle.length > 30 ||
                          ecriture.observation) && (
                          <button
                            onClick={() =>
                              setShowLibellePopup({
                                id: ecriture.id,
                                libelle: ecriture.libelle,
                                observation: ecriture.observation,
                              })
                            }
                            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Voir le détail"
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
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-blue-600">
                        {ecriture.compte_debit}
                      </span>
                      {ecriture.debit_libelle && (
                        <span className="ml-2 text-xs text-gray-500">
                          {ecriture.debit_libelle}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-red-600">
                        {ecriture.compte_credit}
                      </span>
                      {ecriture.credit_libelle && (
                        <span className="ml-2 text-xs text-gray-500">
                          {ecriture.credit_libelle}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium text-gray-900">
                      {formatMontant(ecriture.montant)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(ecriture.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
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
                          onClick={() => handleDeleteClick(ecriture)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
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
                      </div>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} sur{" "}
                {totalItems} écritures
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Précédent
                </button>

                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`dots-${index}`}
                      className="px-3 py-1 text-gray-500"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`px-3 py-1 text-sm font-medium transition-colors cursor-pointer ${
                        currentPage === page
                          ? "bg-gray-900 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
