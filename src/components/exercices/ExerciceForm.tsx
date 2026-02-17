import React, { useState, useEffect } from "react";
import { ExerciceFormData } from "../../types/exercice";
import { createExercice, checkExerciceOverlap } from "../../lib/exercice.db";
import { Spinner } from "./Spinner";

interface ExerciceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<ExerciceFormData>;
}

export function ExerciceForm({
  onSuccess,
  onCancel,
  initialData,
}: ExerciceFormProps) {
  const [formData, setFormData] = useState<ExerciceFormData>({
    nom_entreprise: initialData?.nom_entreprise || "Mon Entreprise",
    nom_exercice:
      initialData?.nom_exercice || `Exercice ${new Date().getFullYear()}`,
    date_debut: initialData?.date_debut || `${new Date().getFullYear()}-01-01`,
    date_fin: initialData?.date_fin || `${new Date().getFullYear()}-12-31`,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [overlapError, setOverlapError] = useState<string | null>(null);

  // Vérification des chevauchements
  useEffect(() => {
    const checkOverlap = async () => {
      if (formData.date_debut && formData.date_fin) {
        try {
          const hasOverlap = await checkExerciceOverlap(
            formData.date_debut,
            formData.date_fin,
          );
          if (hasOverlap) {
            setOverlapError("Cette période chevauche un exercice existant");
          } else {
            setOverlapError(null);
          }
        } catch (error) {
          console.error("Erreur vérification chevauchement:", error);
        }
      }
    };

    const timeoutId = setTimeout(checkOverlap, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.date_debut, formData.date_fin]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom_entreprise.trim()) {
      newErrors.nom_entreprise = "Le nom de l'entreprise est requis";
    }

    if (!formData.nom_exercice.trim()) {
      newErrors.nom_exercice = "Le nom de l'exercice est requis";
    }

    if (!formData.date_debut) {
      newErrors.date_debut = "La date de début est requise";
    }

    if (!formData.date_fin) {
      newErrors.date_fin = "La date de fin est requise";
    }

    if (formData.date_debut && formData.date_fin) {
      if (formData.date_debut >= formData.date_fin) {
        newErrors.date_fin = "La date de fin doit être après la date de début";
      }
    }

    if (overlapError) {
      newErrors.general = overlapError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      await createExercice(formData);
      onSuccess();
    } catch (error) {
      alert("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nom entreprise */}
      <div>
        <label
          htmlFor="nom_entreprise"
          className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
        >
          Nom de l'entreprise <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            id="nom_entreprise"
            value={formData.nom_entreprise}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                nom_entreprise: e.target.value,
              }));
              setErrors((prev) => ({ ...prev, nom_entreprise: "" }));
            }}
            className={`w-full h-10 pl-10 pr-4 text-sm border ${errors.nom_entreprise ? "border-red-500" : "border-gray-300"} bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors`}
            placeholder="Nom de votre entreprise"
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        {errors.nom_entreprise && (
          <p className="mt-1 text-xs text-red-500">{errors.nom_entreprise}</p>
        )}
      </div>

      {/* Nom exercice */}
      <div>
        <label
          htmlFor="nom_exercice"
          className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
        >
          Nom de l'exercice <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            id="nom_exercice"
            value={formData.nom_exercice}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                nom_exercice: e.target.value,
              }));
              setErrors((prev) => ({ ...prev, nom_exercice: "" }));
            }}
            className={`w-full h-10 pl-10 pr-4 text-sm border ${errors.nom_exercice ? "border-red-500" : "border-gray-300"} bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors`}
            placeholder="Ex: Exercice 2025"
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        {errors.nom_exercice && (
          <p className="mt-1 text-xs text-red-500">{errors.nom_exercice}</p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="date_debut"
            className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
          >
            Date de début <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id="date_debut"
              value={formData.date_debut}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  date_debut: e.target.value,
                }));
                setErrors((prev) => ({ ...prev, date_debut: "" }));
              }}
              className={`w-full h-10 pl-10 pr-4 text-sm border ${errors.date_debut ? "border-red-500" : "border-gray-300"} bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors`}
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          {errors.date_debut && (
            <p className="mt-1 text-xs text-red-500">{errors.date_debut}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="date_fin"
            className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
          >
            Date de fin <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id="date_fin"
              value={formData.date_fin}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, date_fin: e.target.value }));
                setErrors((prev) => ({ ...prev, date_fin: "" }));
              }}
              className={`w-full h-10 pl-10 pr-4 text-sm border ${errors.date_fin ? "border-red-500" : "border-gray-300"} bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors`}
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          {errors.date_fin && (
            <p className="mt-1 text-xs text-red-500">{errors.date_fin}</p>
          )}
        </div>
      </div>

      {/* Avertissement chevauchement */}
      {overlapError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          ⚠️ {overlapError}
        </div>
      )}

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" color="white" />
              <span>Création...</span>
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Créer l'exercice</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
