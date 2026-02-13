import React, { useState } from "react";
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

  const validate = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    if (!formData.numero.trim()) {
      newErrors.numero = "Le numéro de compte est requis";
    } else if (!/^\d+$/.test(formData.numero)) {
      newErrors.numero = "Le numéro doit contenir uniquement des chiffres";
    } else if (formData.numero.length > 10) {
      newErrors.numero = "Le numéro ne doit pas dépasser 10 caractères";
    }

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
      <div>
        <label htmlFor="numero" className="block text-sm font-medium mb-1">
          Numéro de compte <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          id="numero"
          name="numero"
          value={formData.numero}
          onChange={handleChange}
          disabled={!!compte} // Désactivé en mode édition
          className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.numero ? "border-destructive" : ""
          } ${!!compte ? "bg-accent/30" : ""}`}
          placeholder="Ex: 601"
        />
        {errors.numero && (
          <p className="mt-1 text-xs text-destructive">{errors.numero}</p>
        )}
      </div>

      <div>
        <label htmlFor="libelle" className="block text-sm font-medium mb-1">
          Libellé <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          id="libelle"
          name="libelle"
          value={formData.libelle}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.libelle ? "border-destructive" : ""
          }`}
          placeholder="Ex: Achats de marchandises"
        />
        {errors.libelle && (
          <p className="mt-1 text-xs text-destructive">{errors.libelle}</p>
        )}
      </div>

      <div>
        <label htmlFor="type_compte" className="block text-sm font-medium mb-1">
          Type de compte
        </label>
        <select
          id="type_compte"
          name="type_compte"
          value={formData.type_compte}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">-- Sélectionner un type (optionnel) --</option>
          {Object.entries(TYPE_COMPTE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Optionnel mais recommandé pour les rapports
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-accent"
          disabled={isLoading}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Enregistrement...
            </>
          ) : (
            "Enregistrer"
          )}
        </button>
      </div>
    </form>
  );
}
