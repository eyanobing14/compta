import React, { useState, useEffect } from "react";
import {
  Compte,
  CompteFormData,
  TypeCompte,
  TYPE_COMPTE_LABELS,
} from "../../types/comptes";
import {
  createCompte,
  updateCompte,
  getCompteByNumero,
  getComptes,
} from "../../lib/comptes.db";

interface CompteFormProps {
  compte?: Compte;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CompteForm({ compte, onSuccess, onCancel }: CompteFormProps) {
  const [formData, setFormData] = useState<CompteFormData>({
    numero: compte?.numero || "",
    libelle: compte?.libelle || "",
    type_compte: compte?.type_compte || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [existingComptes, setExistingComptes] = useState<Compte[]>([]);

  // Charger tous les comptes pour vérifier les doublons de libellé
  useEffect(() => {
    const loadComptes = async () => {
      try {
        const comptes = await getComptes(null, true);
        setExistingComptes(comptes);
      } catch (error) {
        console.error("Erreur chargement comptes:", error);
      }
    };
    loadComptes();
  }, []);

  const validate = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Validation du numéro
    if (!formData.numero.trim()) {
      newErrors.numero = "Le numéro de compte est requis";
    } else if (!/^\d+$/.test(formData.numero)) {
      newErrors.numero = "Le numéro doit contenir uniquement des chiffres";
    } else if (formData.numero.length > 10) {
      newErrors.numero = "Le numéro ne doit pas dépasser 10 caractères";
    }

    // Validation du libellé
    if (!formData.libelle.trim()) {
      newErrors.libelle = "Le libellé est requis";
    } else if (formData.libelle.length > 100) {
      newErrors.libelle = "Le libellé ne doit pas dépasser 100 caractères";
    }

    // Vérifier l'unicité du numéro (seulement pour les nouveaux comptes)
    if (!compte && !newErrors.numero) {
      try {
        const existing = await getCompteByNumero(formData.numero);
        if (existing) {
          newErrors.numero = "Ce numéro de compte existe déjà";
        }
      } catch (error) {
        console.error("Erreur vérification unicité:", error);
      }
    }

    // Vérifier l'unicité du libellé (pour éviter les doublons)
    if (!newErrors.libelle) {
      const libelleExists = existingComptes.some(
        (c) =>
          c.libelle.toLowerCase() === formData.libelle.toLowerCase() &&
          (!compte || c.numero !== compte.numero), // Exclure le compte en cours d'édition
      );

      if (libelleExists) {
        newErrors.libelle = "Ce libellé existe déjà pour un autre compte";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validate();
    if (!isValid) return;

    setIsLoading(true);
    try {
      if (compte) {
        await updateCompte(compte.numero, formData);
      } else {
        await createCompte(formData);
      }
      onSuccess();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Numéro de compte */}
      <div>
        <label
          htmlFor="numero"
          className="block text-sm font-medium mb-1 text-gray-700"
        >
          Numéro de compte <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            id="numero"
            name="numero"
            value={formData.numero}
            onChange={handleChange}
            disabled={!!compte}
            className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors ${
              errors.numero ? "border-red-500" : "border-gray-300"
            } ${!!compte ? "bg-gray-100 cursor-not-allowed" : "hover:border-gray-400"}`}
            placeholder="Ex: 601"
          />
          {!!compte && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          )}
        </div>
        {errors.numero && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {errors.numero}
          </p>
        )}
      </div>

      {/* Libellé */}
      <div>
        <label
          htmlFor="libelle"
          className="block text-sm font-medium mb-1 text-gray-700"
        >
          Libellé <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="libelle"
          name="libelle"
          value={formData.libelle}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors hover:border-gray-400 ${
            errors.libelle ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Ex: Achats de marchandises"
        />
        {errors.libelle && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {errors.libelle}
          </p>
        )}
      </div>

      {/* Type de compte */}
      <div>
        <label
          htmlFor="type_compte"
          className="block text-sm font-medium mb-1 text-gray-700"
        >
          Type de compte
        </label>
        <select
          id="type_compte"
          name="type_compte"
          value={formData.type_compte}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors hover:border-gray-400 cursor-pointer"
        >
          <option value="">-- Sélectionner un type (optionnel) --</option>
          {Object.entries(TYPE_COMPTE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Optionnel mais recommandé pour les rapports
        </p>
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
        >
          {isLoading ? (
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
              <span>Enregistrement...</span>
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
              <span>Enregistrer</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
