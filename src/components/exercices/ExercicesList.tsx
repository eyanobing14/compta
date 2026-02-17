import { useState, useEffect } from "react";
import { Exercice } from "../../types/exercice";
import { getExercices, cloturerExercice } from "../../lib/exercice.db";
import { ExerciceForm } from "./ExerciceForm";
import { ExerciceCard } from "./ExerciceCard";
import { ClotureDialog } from "./ClotureDialog";
import { Toast, ToastType } from "./Toast";
import { Spinner } from "./Spinner";

interface ExercicesListProps {
  exerciceOuvert: Exercice | null;
  onExerciceChange: () => void;
  onViewClosedExercice?: (exercice: Exercice) => void;
}

export function ExercicesList({
  exerciceOuvert,
  onExerciceChange,
  onViewClosedExercice,
}: ExercicesListProps) {
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [clotureEnCours, setClotureEnCours] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  // Nouvel état pour le dialogue de clôture
  const [clotureDialog, setClotureDialog] = useState<{
    ouvert: boolean;
    exerciceId: number | null;
    exerciceNom: string;
  }>({
    ouvert: false,
    exerciceId: null,
    exerciceNom: "",
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const loadExercices = async () => {
    setIsLoading(true);
    try {
      const data = await getExercices();
      setExercices(data);
    } catch (error) {
      console.error("Erreur chargement exercices:", error);
      showToast("Erreur lors du chargement", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExercices();
  }, []);

  const handleNouvelExercice = () => {
    if (exerciceOuvert) {
      setShowConfirmDialog(true);
    } else {
      setShowForm(true);
    }
  };

  const handleCloturer = (id: number, nom: string) => {
    // Ouvrir le dialogue de clôture
    setClotureDialog({
      ouvert: true,
      exerciceId: id,
      exerciceNom: nom,
    });
  };

  const handleConfirmCloture = async () => {
    if (!clotureDialog.exerciceId) return;

    setClotureEnCours(clotureDialog.exerciceId);
    try {
      await cloturerExercice(clotureDialog.exerciceId);
      await loadExercices();
      onExerciceChange();
      showToast(`✅ Exercice ${clotureDialog.exerciceNom} clôturé`, "success");
      setClotureDialog({ ouvert: false, exerciceId: null, exerciceNom: "" });
    } catch (error) {
      console.error("Erreur clôture:", error);
      showToast(`❌ Erreur lors de la clôture`, "error");
      throw error; // Re-throw pour que ClotureDialog puisse gérer l'erreur
    } finally {
      setClotureEnCours(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Dialogue de clôture */}
      {clotureDialog.ouvert && clotureDialog.exerciceId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ClotureDialog
              exerciceNom={clotureDialog.exerciceNom}
              onConfirm={handleConfirmCloture}
              onCancel={() =>
                setClotureDialog({
                  ouvert: false,
                  exerciceId: null,
                  exerciceNom: "",
                })
              }
            />
          </div>
        </div>
      )}

      {/* Dialogue de confirmation pour nouvel exercice */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
            <div className="flex gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Exercice déjà ouvert
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Un exercice est actif :{" "}
                  <strong>{exerciceOuvert?.nom_exercice}</strong>
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Vous devez d'abord le clôturer avant d'en créer un nouveau.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Créer un nouvel exercice
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configurez une nouvelle période comptable
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
              >
                <svg
                  className="w-6 h-6"
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
            <ExerciceForm
              onSuccess={() => {
                setShowForm(false);
                loadExercices();
                onExerciceChange();
                showToast("✅ Exercice créé avec succès", "success");
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="mb-10">
        <div className="flex items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Exercices comptables
            </h1>
          </div>
          <button
            onClick={handleNouvelExercice}
            className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Nouvel exercice
          </button>
        </div>

        {/* Infos rapides */}
        <div className="flex items-center gap-6">
          {exerciceOuvert && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">En cours :</span>
              <span className="text-sm font-semibold text-gray-900">
                {exerciceOuvert.nom_exercice}
              </span>
            </div>
          )}
          {exercices.length > 0 && (
            <div className="flex items-center gap-2 pl-6 border-l border-gray-300">
              <span className="text-sm text-gray-600">Total :</span>
              <span className="text-sm font-semibold text-gray-900">
                {exercices.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Liste des exercices */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : exercices.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-600 text-lg font-medium mb-3">
            Aucun exercice créé
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Commencez par créer votre première période comptable
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Créer le premier exercice
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {exercices.map((ex) => (
            <ExerciceCard
              key={ex.id}
              exercice={ex}
              onCloturer={handleCloturer}
              onViewClosed={onViewClosedExercice}
              clotureEnCours={clotureEnCours}
            />
          ))}
        </div>
      )}
    </div>
  );
}
