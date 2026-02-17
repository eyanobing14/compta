import React, { useState, useEffect } from "react";
import { Exercice } from "../../types/exercice";
import {
  getExercices,
  cloturerExercice,
  createExercice,
} from "../../lib/exercice.db";
import { ExerciceForm } from "./ExerciceForm";
import { ExerciceCard } from "./ExerciceCard";
import { ClotureDialog } from "./ClotureDialog";
import { Toast, ToastType } from "./Toast";
import { Spinner } from "./Spinner";

interface ExercicesListProps {
  exerciceOuvert: Exercice | null;
  onExerciceChange: () => void;
}

export function ExercicesList({
  exerciceOuvert,
  onExerciceChange,
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <ClotureDialog
              exerciceId={clotureDialog.exerciceId}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Exercice déjà ouvert</h3>
            <p className="text-gray-600 mb-6">
              Un exercice est déjà ouvert :{" "}
              <strong>{exerciceOuvert?.nom_exercice}</strong>
              <br />
              Vous devez d'abord le clôturer avant d'en créer un nouveau.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Nouvel exercice</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <ExerciceForm
              onSuccess={() => {
                setShowForm(false);
                loadExercices();
                onExerciceChange();
                showToast("✅ Exercice créé", "success");
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Exercices comptables</h1>
          {exerciceOuvert && (
            <p className="text-sm text-green-600 mt-1">
              ✓ Exercice en cours : {exerciceOuvert.nom_exercice}
            </p>
          )}
        </div>
        <button
          onClick={handleNouvelExercice}
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
          Nouvel exercice
        </button>
      </div>

      {/* Liste des exercices */}
      <div className="space-y-4">
        {exercices.map((ex) => (
          <ExerciceCard
            key={ex.id}
            exercice={ex}
            onCloturer={handleCloturer}
            clotureEnCours={clotureEnCours}
          />
        ))}

        {exercices.length === 0 && (
          <div className="text-center py-12 border border-gray-200 bg-gray-50">
            <p className="text-gray-500">Aucun exercice créé</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Créer le premier exercice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
