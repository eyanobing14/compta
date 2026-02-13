import React, { useState } from "react";
import { EcritureFormData } from "../../types/ecritures";
import { CompteSearch } from "./CompteSearch";

interface EcritureFormProps {
  onSubmit: (data: EcritureFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<EcritureFormData>;
}

export function EcritureForm({
  onSubmit,
  onCancel,
  initialData,
}: EcritureFormProps) {
  const [formData, setFormData] = useState<EcritureFormData>({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    libelle: initialData?.libelle || "",
    compte_debit: initialData?.compte_debit || "",
    compte_credit: initialData?.compte_credit || "",
    montant: initialData?.montant || "",
    observation: initialData?.observation || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = "La date est requise";
    }

    if (!formData.libelle.trim()) {
      newErrors.libelle = "Le libellé est requis";
    }

    if (!formData.compte_debit) {
      newErrors.compte_debit = "Le compte débit est requis";
    }

    if (!formData.compte_credit) {
      newErrors.compte_credit = "Le compte crédit est requis";
    }

    if (
      formData.compte_debit &&
      formData.compte_credit &&
      formData.compte_debit === formData.compte_credit
    ) {
      newErrors.compte_credit = "Les comptes doivent être différents";
    }

    if (!formData.montant) {
      newErrors.montant = "Le montant est requis";
    } else {
      const montant = parseFloat(formData.montant);
      if (isNaN(montant) || montant <= 0) {
        newErrors.montant = "Le montant doit être un nombre positif";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCompteSelect =
    (field: "compte_debit" | "compte_credit") =>
    (compte: { numero: string; libelle: string }) => {
      setFormData((prev) => ({ ...prev, [field]: compte.numero }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-1">
          Date <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.date ? "border-destructive" : ""
          }`}
        />
        {errors.date && (
          <p className="mt-1 text-xs text-destructive">{errors.date}</p>
        )}
      </div>

      {/* Libellé */}
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
          placeholder="Ex: Achat de marchandises"
        />
        {errors.libelle && (
          <p className="mt-1 text-xs text-destructive">{errors.libelle}</p>
        )}
      </div>

      {/* Compte Débit */}
      <div>
        <label
          htmlFor="compte_debit"
          className="block text-sm font-medium mb-1"
        >
          Compte Débit <span className="text-destructive">*</span>
        </label>
        <CompteSearch
          value={formData.compte_debit}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, compte_debit: value }))
          }
          onSelect={handleCompteSelect("compte_debit")}
          placeholder="Rechercher un compte à débiter..."
          excludeCompte={formData.compte_credit}
        />
        {errors.compte_debit && (
          <p className="mt-1 text-xs text-destructive">{errors.compte_debit}</p>
        )}
      </div>

      {/* Compte Crédit */}
      <div>
        <label
          htmlFor="compte_credit"
          className="block text-sm font-medium mb-1"
        >
          Compte Crédit <span className="text-destructive">*</span>
        </label>
        <CompteSearch
          value={formData.compte_credit}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, compte_credit: value }))
          }
          onSelect={handleCompteSelect("compte_credit")}
          placeholder="Rechercher un compte à créditer..."
          excludeCompte={formData.compte_debit}
        />
        {errors.compte_credit && (
          <p className="mt-1 text-xs text-destructive">
            {errors.compte_credit}
          </p>
        )}
      </div>

      {/* Montant */}
      <div>
        <label htmlFor="montant" className="block text-sm font-medium mb-1">
          Montant (FBU) <span className="text-destructive">*</span>
        </label>
        <input
          type="number"
          id="montant"
          name="montant"
          value={formData.montant}
          onChange={handleChange}
          step="1"
          min="1"
          className={`w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.montant ? "border-destructive" : ""
          }`}
          placeholder="0"
        />
        {errors.montant && (
          <p className="mt-1 text-xs text-destructive">{errors.montant}</p>
        )}
      </div>
      {/* NumPiece */}
      <div>
        <label
          htmlFor="numero_piece"
          className="block text-sm font-medium mb-1"
        >
          N° Pièce (optionnel)
        </label>
        <input
          type="text"
          id="numero_piece"
          name="numero_piece"
          value={formData.numero_piece}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Ex: FACT-2025-001"
        />
      </div>

      {/* Observation */}
      <div>
        <label htmlFor="observation" className="block text-sm font-medium mb-1">
          Observation (optionnel)
        </label>
        <textarea
          id="observation"
          name="observation"
          value={formData.observation}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Informations complémentaires..."
        />
      </div>

      {/* Boutons */}
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
            "Enregistrer l'écriture"
          )}
        </button>
      </div>
    </form>
  );
}
