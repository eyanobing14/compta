import React, { useState, useEffect, useRef } from "react";
import { Ecriture, EcritureFilters } from "../../types/ecritures";
import {
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
import { Exercice } from "../../types/exercice";

export function Journal() {
  const [ecritures, setEcritures] = useState<Ecriture[]>([]);
  const [exerciceActif, setExerciceActif] = useState<Exercice | null>(null);
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
  const [searchType, setSearchType] = useState<
    "libelle" | "comptes" | "montant" | "piece"
  >("libelle");
  const [montantRange, setMontantRange] = useState<[number, number]>([
    0, 1000000,
  ]);
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const [tooltipValue, setTooltipValue] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [showLibellePopup, setShowLibellePopup] = useState<{
    id: number;
    libelle: string;
    observation: string | null;
  } | null>(null);

  const minRangeRef = useRef<HTMLInputElement>(null);
  const maxRangeRef = useRef<HTMLInputElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // État pour le tri
  const [sortField, setSortField] = useState<"date" | "montant" | "libelle">(
    "date",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Charger l'exercice actif au démarrage
  useEffect(() => {
    const loadExerciceActif = async () => {
      try {
        const exercice = await getExerciceActif();
        setExerciceActif(exercice);
      } catch (error) {
        console.error("Erreur chargement exercice actif:", error);
      }
    };
    loadExerciceActif();
  }, []);

  // Mettre à jour les filtres avec les dates de l'exercice quand il change
  useEffect(() => {
    if (exerciceActif) {
      setFilters((prev) => ({
        ...prev,
        dateDebut: exerciceActif.date_debut,
        dateFin: exerciceActif.date_fin,
      }));
    }
  }, [exerciceActif]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const loadEcritures = async () => {
    if (!exerciceActif) return;

    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      console.log("Chargement avec filtres:", filters);
      const data = await getEcrituresPaginated(filters, ITEMS_PER_PAGE, offset);

      // Trier les données
      const sorted = sortEcritures(data, sortField, sortDirection);
      setEcritures(sorted);

      const total = await getTotalEcrituresCount(filters);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));

      const summaryData = await getJournalSummary(exerciceActif.id);
      setSummary(summaryData);
    } catch (error) {
      console.error("Erreur chargement écritures:", error);
      showToast("Erreur lors du chargement des écritures", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const sortEcritures = (
    data: Ecriture[],
    field: string,
    direction: string,
  ) => {
    return [...data].sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "montant":
          comparison = a.montant - b.montant;
          break;
        case "libelle":
          comparison = a.libelle.localeCompare(b.libelle);
          break;
        default:
          return 0;
      }

      return direction === "asc" ? comparison : -comparison;
    });
  };

  useEffect(() => {
    if (exerciceActif) {
      loadEcritures();
    }
  }, [filters, currentPage, exerciceActif]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleSort = (field: "date" | "montant" | "libelle") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }

    setEcritures((prev) =>
      sortEcritures(
        prev,
        field,
        sortField === field
          ? sortDirection === "asc"
            ? "desc"
            : "asc"
          : "asc",
      ),
    );
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const newFilters: EcritureFilters = {
      dateDebut: filters.dateDebut,
      dateFin: filters.dateFin,
    };

    if (searchType === "libelle" && searchTerm.trim()) {
      newFilters.searchTerm = searchTerm.trim();
      newFilters.searchType = "libelle";
    } else if (searchType === "comptes" && searchTerm.trim()) {
      newFilters.searchTerm = searchTerm.trim();
      newFilters.searchType = "comptes";
    } else if (searchType === "montant") {
      newFilters.montantMin = Number(montantRange[0]);
      newFilters.montantMax = Number(montantRange[1]);
      newFilters.searchType = "montant";
      console.log(
        "Filtres montant appliqués:",
        newFilters.montantMin,
        newFilters.montantMax,
      );
    } else if (searchType === "piece" && searchTerm.trim()) {
      newFilters.numeroPiece = searchTerm.trim();
      newFilters.searchType = "piece";
    }

    console.log("Nouveaux filtres:", newFilters);
    setFilters(newFilters);
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

  const formatMontantForDisplay = (montant: number) => {
    return new Intl.NumberFormat("fr-BI", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term || !text) return text;

    try {
      const regex = new RegExp(`(${term})`, "gi");
      const parts = text.split(regex);

      return parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="bg-yellow-200 font-medium">
            {part}
          </span>
        ) : (
          part
        ),
      );
    } catch (e) {
      return text;
    }
  };

  // Gestionnaires pour le range slider avec tooltip
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), montantRange[1] - 1000);
    setMontantRange([value, montantRange[1]]);

    // Afficher le tooltip
    if (minRangeRef.current) {
      const rect = minRangeRef.current.getBoundingClientRect();
      const percent = value / 1000000;
      const x = rect.left + percent * rect.width;
      setTooltipValue(value);
      setTooltipPosition({ x, y: rect.top - 30 });
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), montantRange[0] + 1000);
    setMontantRange([montantRange[0], value]);

    // Afficher le tooltip
    if (maxRangeRef.current) {
      const rect = maxRangeRef.current.getBoundingClientRect();
      const percent = value / 1000000;
      const x = rect.left + percent * rect.width;
      setTooltipValue(value);
      setTooltipPosition({ x, y: rect.top - 30 });
    }
  };

  const handleRangeMouseDown = (handle: "min" | "max") => {
    setIsDragging(handle);
  };

  const handleRangeMouseUp = () => {
    setIsDragging(null);
    setTooltipValue(null);
    setTooltipPosition(null);
  };

  const handleRangeMouseMove = (e: React.MouseEvent, handle: "min" | "max") => {
    if (isDragging === handle) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const value = Math.min(
        1000000,
        Math.max(0, Math.round((percent * 1000000) / 1000) * 1000),
      );

      if (handle === "min") {
        const newValue = Math.min(value, montantRange[1] - 1000);
        setMontantRange([newValue, montantRange[1]]);
        setTooltipValue(newValue);
      } else {
        const newValue = Math.max(value, montantRange[0] + 1000);
        setMontantRange([montantRange[0], newValue]);
        setTooltipValue(newValue);
      }

      setTooltipPosition({ x: e.clientX, y: rect.top - 30 });
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mouseup", handleRangeMouseUp);
      return () => window.removeEventListener("mouseup", handleRangeMouseUp);
    }
  }, [isDragging]);

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const delta = 2;
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

  // Si pas d'exercice actif, afficher un message
  if (!exerciceActif) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-700">
            Veuillez d'abord créer et ouvrir un exercice pour accéder au Journal
          </p>
        </div>
      </div>
    );
  }

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
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
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
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip pour le range slider */}
      {tooltipValue !== null && tooltipPosition && (
        <div
          ref={tooltipRef}
          className="fixed bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none z-50 transform -translate-x-1/2"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          {formatMontantForDisplay(tooltipValue)} FBU
        </div>
      )}

      {/* En-tête avec stats et infos exercice */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Journal des écritures
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gérez toutes vos écritures comptables
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {exerciceActif.nom_exercice}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(exerciceActif.date_debut).toLocaleDateString("fr-BI")} →{" "}
              {new Date(exerciceActif.date_fin).toLocaleDateString("fr-BI")}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingEcriture(null);
            setShowForm(true);
          }}
          className="px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors flex items-center gap-2 cursor-pointer"
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

      {/* Statistiques - Taille réduite */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg
                className="w-5 h-5 text-gray-700"
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
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Total écritures
              </p>
              <p className="text-xl font-bold text-gray-900">
                {summary.total_ecritures}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-600"
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
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Total débits
              </p>
              <p className="text-xl font-bold text-blue-600">
                {formatMontant(summary.total_debit)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg
                className="w-5 h-5 text-red-600"
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
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Total crédits
              </p>
              <p className="text-xl font-bold text-red-600">
                {formatMontant(summary.total_debit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
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
              exerciceActif={exerciceActif}
            />
          </div>
        </div>
      )}

      {/* Filtres avec recherche avancée - Taille réduite */}
      <div className="mb-6 space-y-3">
        <form onSubmit={handleSearch} className="space-y-3">
          {/* Barre de recherche principale - Plus petite */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  searchType === "libelle"
                    ? "Rechercher dans les libellés..."
                    : searchType === "comptes"
                      ? "Rechercher un compte (n° ou libellé)..."
                      : searchType === "montant"
                        ? "Filtrer par montant avec le curseur"
                        : "Rechercher un numéro de pièce..."
                }
                className="w-full h-9 pl-9 pr-3 text-xs border border-gray-300 bg-white rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text"
                disabled={searchType === "montant"}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
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
              className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors cursor-pointer"
            >
              Rechercher
            </button>
          </div>

          {/* Options de recherche - Plus petites */}
          <div className="flex items-center gap-3">
            {/* Radio buttons stylisés en noir - Taille réduite */}
            <div className="flex items-center gap-2 text-xs flex-shrink-0">
              <span className="text-gray-600">Filtrer par :</span>

              <label className="flex items-center gap-1 cursor-pointer group">
                <input
                  type="radio"
                  name="searchType"
                  value="libelle"
                  checked={searchType === "libelle"}
                  onChange={(e) => {
                    setSearchType(e.target.value as any);
                  }}
                  className="sr-only"
                />
                <span
                  className={`px-2 py-1 rounded-lg transition-colors text-xs ${
                    searchType === "libelle"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                  }`}
                >
                  Libellé
                </span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer group">
                <input
                  type="radio"
                  name="searchType"
                  value="comptes"
                  checked={searchType === "comptes"}
                  onChange={(e) => {
                    setSearchType(e.target.value as any);
                  }}
                  className="sr-only"
                />
                <span
                  className={`px-2 py-1 rounded-lg transition-colors text-xs ${
                    searchType === "comptes"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                  }`}
                >
                  Comptes
                </span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer group">
                <input
                  type="radio"
                  name="searchType"
                  value="montant"
                  checked={searchType === "montant"}
                  onChange={(e) => {
                    setSearchType(e.target.value as any);
                    setSearchTerm("");
                  }}
                  className="sr-only"
                />
                <span
                  className={`px-2 py-1 rounded-lg transition-colors text-xs ${
                    searchType === "montant"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                  }`}
                >
                  Montant
                </span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer group">
                <input
                  type="radio"
                  name="searchType"
                  value="piece"
                  checked={searchType === "piece"}
                  onChange={(e) => {
                    setSearchType(e.target.value as any);
                  }}
                  className="sr-only"
                />
                <span
                  className={`px-2 py-1 rounded-lg transition-colors text-xs ${
                    searchType === "piece"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                  }`}
                >
                  N° Pièce
                </span>
              </label>
            </div>

            {/* Range slider pour les montants - Plus petit */}
            {searchType === "montant" && (
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Plage</span>
                  <span className="text-xs font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                    {formatMontantForDisplay(montantRange[0])} -{" "}
                    {formatMontantForDisplay(montantRange[1])} FBU
                  </span>
                </div>
                <div
                  className="relative h-1.5 bg-gray-200 rounded-full"
                  onMouseMove={(e) => {
                    if (isDragging === "min") handleRangeMouseMove(e, "min");
                    if (isDragging === "max") handleRangeMouseMove(e, "max");
                  }}
                >
                  {/* Barre de progression grise */}
                  <div
                    className="absolute h-full bg-gray-400 rounded-full"
                    style={{
                      left: `${(montantRange[0] / 1000000) * 100}%`,
                      right: `${100 - (montantRange[1] / 1000000) * 100}%`,
                    }}
                  />

                  {/* Curseur min */}
                  <input
                    ref={minRangeRef}
                    type="range"
                    min="0"
                    max="1000000"
                    step="1000"
                    value={montantRange[0]}
                    onChange={handleMinChange}
                    onMouseDown={() => handleRangeMouseDown("min")}
                    className="absolute w-full h-1.5 opacity-0 cursor-pointer z-20"
                    style={{
                      pointerEvents: isDragging === "max" ? "none" : "auto",
                    }}
                  />

                  {/* Curseur max */}
                  <input
                    ref={maxRangeRef}
                    type="range"
                    min="0"
                    max="1000000"
                    step="1000"
                    value={montantRange[1]}
                    onChange={handleMaxChange}
                    onMouseDown={() => handleRangeMouseDown("max")}
                    className="absolute w-full h-1.5 opacity-0 cursor-pointer z-20"
                    style={{
                      pointerEvents: isDragging === "min" ? "none" : "auto",
                    }}
                  />

                  {/* Poignées visuelles grises - Plus petites */}
                  <div
                    className="absolute w-3 h-3 bg-gray-300 border border-gray-500 rounded-full -mt-0.5 cursor-grab active:cursor-grabbing z-10 shadow-sm hover:bg-gray-400 transition-colors"
                    style={{
                      left: `calc(${(montantRange[0] / 1000000) * 100}% - 6px)`,
                    }}
                    onMouseDown={() => handleRangeMouseDown("min")}
                  />
                  <div
                    className="absolute w-3 h-3 bg-gray-300 border border-gray-500 rounded-full -mt-0.5 cursor-grab active:cursor-grabbing z-10 shadow-sm hover:bg-gray-400 transition-colors"
                    style={{
                      left: `calc(${(montantRange[1] / 1000000) * 100}% - 6px)`,
                    }}
                    onMouseDown={() => handleRangeMouseDown("max")}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Filtres de dates - Plus petits */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Début</label>
            <input
              type="date"
              value={filters.dateDebut || exerciceActif.date_debut}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateDebut: e.target.value || undefined,
                }))
              }
              min={exerciceActif.date_debut}
              max={exerciceActif.date_fin}
              className="w-full h-8 px-2 text-xs border border-gray-300 bg-white rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Fin</label>
            <input
              type="date"
              value={filters.dateFin || exerciceActif.date_fin}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateFin: e.target.value || undefined,
                }))
              }
              min={exerciceActif.date_debut}
              max={exerciceActif.date_fin}
              className="w-full h-8 px-2 text-xs border border-gray-300 bg-white rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text"
            />
          </div>
        </div>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Date {getSortIcon("date")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                    onClick={() => handleSort("libelle")}
                  >
                    <div className="flex items-center gap-1">
                      Libellé {getSortIcon("libelle")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Compte débit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Compte crédit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    N° Pièce
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                    onClick={() => handleSort("montant")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Montant {getSortIcon("montant")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {ecritures.map((ecriture) => {
                  const shouldHighlight =
                    (searchType === "libelle" && filters.searchTerm) ||
                    (searchType === "comptes" && filters.searchTerm) ||
                    (searchType === "piece" && filters.numeroPiece);

                  const isInMontantRange =
                    filters.montantMin !== undefined &&
                    filters.montantMax !== undefined &&
                    ecriture.montant >= filters.montantMin &&
                    ecriture.montant <= filters.montantMax;

                  // Appliquer le style de fond seulement si on est en mode montant et que le montant est dans la plage
                  const rowBgClass =
                    searchType === "montant" && isInMontantRange
                      ? "bg-blue-50"
                      : "";

                  return (
                    <tr
                      key={ecriture.id}
                      className={`hover:bg-gray-50 transition-colors ${rowBgClass}`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(ecriture.date).toLocaleDateString("fr-BI")}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 truncate">
                            {shouldHighlight &&
                            searchType === "libelle" &&
                            filters.searchTerm
                              ? highlightSearchTerm(
                                  ecriture.libelle,
                                  filters.searchTerm,
                                )
                              : ecriture.libelle}
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
                            {shouldHighlight &&
                            searchType === "comptes" &&
                            filters.searchTerm
                              ? highlightSearchTerm(
                                  ecriture.debit_libelle,
                                  filters.searchTerm,
                                )
                              : ecriture.debit_libelle}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-red-600">
                          {ecriture.compte_credit}
                        </span>
                        {ecriture.credit_libelle && (
                          <span className="ml-2 text-xs text-gray-500">
                            {shouldHighlight &&
                            searchType === "comptes" &&
                            filters.searchTerm
                              ? highlightSearchTerm(
                                  ecriture.credit_libelle,
                                  filters.searchTerm,
                                )
                              : ecriture.credit_libelle}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {ecriture.numero_piece
                          ? shouldHighlight &&
                            searchType === "piece" &&
                            filters.numeroPiece
                            ? highlightSearchTerm(
                                ecriture.numero_piece,
                                filters.numeroPiece,
                              )
                            : ecriture.numero_piece
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatMontant(ecriture.montant)}
                        {searchType === "montant" && isInMontantRange && (
                          <span className="ml-2 text-xs text-blue-600">✓</span>
                        )}
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
                  );
                })}
                {ecritures.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Aucune écriture trouvée pour cet exercice
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
                  className="px-3 py-1 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
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
                  className="px-3 py-1 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
