import React, { useState, useEffect } from "react";
import { EcritureFormData } from "../../types/ecritures";
import {
  createEcriture,
  getLastNumeroPiece,
  searchComptesForEcriture,
  checkNumeroPieceExists,
} from "../../lib/ecritures.db";
import { CompteSearch } from "./CompteSearch";
import { Spinner } from "../exercices/Spinner";
import { Exercice } from "../../types/exercice";

interface EcritureFormProps {
  onSubmit: (data: EcritureFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<EcritureFormData>;
  exerciceActif?: Exercice | null;
}

export function EcritureForm({
  onSubmit,
  onCancel,
  initialData,
  exerciceActif,
}: EcritureFormProps) {
  const [formData, setFormData] = useState<EcritureFormData>({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    libelle: initialData?.libelle || "",
    compte_debit: initialData?.compte_debit || "",
    compte_credit: initialData?.compte_credit || "",
    montant: initialData?.montant || "",
    numero_piece: initialData?.numero_piece || "",
    observation: initialData?.observation || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPiece, setIsGeneratingPiece] = useState(false);
  const [dateError, setDateError] = useState<string>("");
  const [pieceError, setPieceError] = useState<string>("");

  // États pour le dropdown des comptes
  const [comptesDebit, setComptesDebit] = useState<
    Array<{ numero: string; libelle: string }>
  >([]);
  const [comptesCredit, setComptesCredit] = useState<
    Array<{ numero: string; libelle: string }>
  >([]);
  const [showDebitDropdown, setShowDebitDropdown] = useState(false);
  const [showCreditDropdown, setShowCreditDropdown] = useState(false);
  const [searchDebitTerm, setSearchDebitTerm] = useState(
    initialData?.compte_debit || "",
  );
  const [searchCreditTerm, setSearchCreditTerm] = useState(
    initialData?.compte_credit || "",
  );
  const [isSearchingDebit, setIsSearchingDebit] = useState(false);
  const [isSearchingCredit, setIsSearchingCredit] = useState(false);

  // Valider la date par rapport à l'exercice
  useEffect(() => {
    if (exerciceActif && formData.date) {
      if (formData.date < exerciceActif.date_debut) {
        setDateError(
          `La date doit être ≥ ${new Date(exerciceActif.date_debut).toLocaleDateString("fr-BI")}`,
        );
      } else if (formData.date > exerciceActif.date_fin) {
        setDateError(
          `La date doit être ≤ ${new Date(exerciceActif.date_fin).toLocaleDateString("fr-BI")}`,
        );
      } else {
        setDateError("");
      }
    }
  }, [formData.date, exerciceActif]);

  // Vérifier si le numéro de pièce existe déjà
  useEffect(() => {
    const checkPieceExists = async () => {
      if (formData.numero_piece && formData.numero_piece.trim() !== "") {
        try {
          const exists = await checkNumeroPieceExists(formData.numero_piece);
          if (exists) {
            setPieceError("Ce numéro de pièce existe déjà");
          } else {
            setPieceError("");
          }
        } catch (error) {
          console.error("Erreur vérification numéro pièce:", error);
        }
      } else {
        setPieceError("");
      }
    };

    const timeoutId = setTimeout(checkPieceExists, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.numero_piece]);

  // Debounce pour la recherche des comptes débit
  useEffect(() => {
    const searchDebit = async () => {
      if (searchDebitTerm.length < 2) {
        setComptesDebit([]);
        return;
      }

      setIsSearchingDebit(true);
      try {
        const results = await searchComptesForEcriture(searchDebitTerm);
        setComptesDebit(
          results.filter((c) => c.numero !== formData.compte_credit),
        );
      } catch (error) {
        console.error("Erreur recherche comptes débit:", error);
      } finally {
        setIsSearchingDebit(false);
      }
    };

    const timeoutId = setTimeout(searchDebit, 300);
    return () => clearTimeout(timeoutId);
  }, [searchDebitTerm, formData.compte_credit]);

  // Debounce pour la recherche des comptes crédit
  useEffect(() => {
    const searchCredit = async () => {
      if (searchCreditTerm.length < 2) {
        setComptesCredit([]);
        return;
      }

      setIsSearchingCredit(true);
      try {
        const results = await searchComptesForEcriture(searchCreditTerm);
        setComptesCredit(
          results.filter((c) => c.numero !== formData.compte_debit),
        );
      } catch (error) {
        console.error("Erreur recherche comptes crédit:", error);
      } finally {
        setIsSearchingCredit(false);
      }
    };

    const timeoutId = setTimeout(searchCredit, 300);
    return () => clearTimeout(timeoutId);
  }, [searchCreditTerm, formData.compte_debit]);

  // Fonction pour générer un numéro de pièce basé sur l'année de l'exercice
  const handleGeneratePiece = async () => {
    if (!exerciceActif) {
      setPieceError("Aucun exercice actif");
      return;
    }

    setIsGeneratingPiece(true);
    setPieceError("");

    try {
      // Extraire l'année de l'exercice
      const annee = new Date(exerciceActif.date_debut).getFullYear();
      const prefix = `PIECE-${annee}-`;

      // Récupérer le dernier numéro de pièce pour cette année
      const lastNumero = await getLastNumeroPiece(annee);

      // Incrémenter le numéro
      let nouveauNumero = lastNumero;
      let exists = true;
      let tentative = 0;
      const maxTentatives = 100; // Sécurité pour éviter une boucle infinie

      // Vérifier si le numéro généré existe déjà et en générer un nouveau si nécessaire
      while (exists && tentative < maxTentatives) {
        exists = await checkNumeroPieceExists(nouveauNumero);
        if (exists) {
          // Extraire le numéro actuel et l'incrémenter
          const currentNum = parseInt(nouveauNumero.split("-").pop() || "0");
          const nextNum = (currentNum + 1).toString().padStart(4, "0");
          nouveauNumero = `${prefix}${nextNum}`;
        }
        tentative++;
      }

      if (tentative >= maxTentatives) {
        throw new Error("Impossible de générer un numéro de pièce unique");
      }

      setFormData((prev) => ({ ...prev, numero_piece: nouveauNumero }));
    } catch (error) {
      console.error("Erreur génération numéro pièce:", error);
      setPieceError("Erreur lors de la génération du numéro");
    } finally {
      setIsGeneratingPiece(false);
    }
  };

  // Fonction pour définir la date à aujourd'hui
  const handleSetToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, date: today }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = "La date est requise";
    } else if (dateError) {
      newErrors.date = dateError;
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

    if (formData.numero_piece && pieceError) {
      newErrors.numero_piece = pieceError;
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
      console.error("Erreur soumission formulaire:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompteSelect =
    (type: "debit" | "credit") =>
    (compte: { numero: string; libelle: string }) => {
      setFormData((prev) => ({
        ...prev,
        [`compte_${type}`]: compte.numero,
      }));

      if (type === "debit") {
        setSearchDebitTerm(compte.numero);
        setShowDebitDropdown(false);
      } else {
        setSearchCreditTerm(compte.numero);
        setShowCreditDropdown(false);
      }

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`compte_${type}`];
        if (
          type === "credit" &&
          prev.compte_credit === "Les comptes doivent être différents"
        ) {
          delete newErrors.compte_credit;
        }
        return newErrors;
      });
    };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date et Numéro pièce */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="date"
            className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, date: e.target.value }));
                setErrors((prev) => ({ ...prev, date: "" }));
              }}
              min={exerciceActif?.date_debut}
              max={exerciceActif?.date_fin}
              className={`w-full h-10 pl-10 pr-20 text-sm border rounded-lg ${
                errors.date || dateError ? "border-red-500" : "border-gray-300"
              } bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text`}
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>

            {/* Bouton Aujourd'hui uniquement */}
            <button
              type="button"
              onClick={handleSetToday}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer"
              title="Aujourd'hui"
            >
              Auj
            </button>
          </div>

          {/* Affichage de la période de l'exercice */}
          {exerciceActif && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              <span>
                {new Date(exerciceActif.date_debut).toLocaleDateString("fr-BI")}{" "}
                → {new Date(exerciceActif.date_fin).toLocaleDateString("fr-BI")}
              </span>
            </div>
          )}

          {(errors.date || dateError) && (
            <p className="mt-1 text-xs text-red-500">
              {errors.date || dateError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="numero_piece"
            className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
          >
            N° Pièce <span className="text-gray-400">(optionnel)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="numero_piece"
              value={formData.numero_piece}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  numero_piece: e.target.value,
                }));
                setErrors((prev) => ({ ...prev, numero_piece: "" }));
              }}
              className={`w-full h-10 pl-10 pr-20 text-sm border rounded-lg ${
                errors.numero_piece || pieceError
                  ? "border-red-500"
                  : "border-gray-300"
              } bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text`}
              placeholder="Optionnel"
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
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <button
              type="button"
              onClick={handleGeneratePiece}
              disabled={isGeneratingPiece || !exerciceActif}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              title="Générer automatiquement"
            >
              {isGeneratingPiece ? (
                <>
                  <Spinner size="sm" />
                  <span>...</span>
                </>
              ) : (
                "Générer"
              )}
            </button>
          </div>
          {pieceError && (
            <p className="mt-1 text-xs text-red-500">{pieceError}</p>
          )}
          {errors.numero_piece && (
            <p className="mt-1 text-xs text-red-500">{errors.numero_piece}</p>
          )}
          {exerciceActif && (
            <p className="mt-1 text-xs text-gray-500">
              Format: PIECE-{new Date(exerciceActif.date_debut).getFullYear()}
              -XXXX
            </p>
          )}
        </div>
      </div>

      {/* Libellé */}
      <div>
        <label
          htmlFor="libelle"
          className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
        >
          Libellé <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="libelle"
          value={formData.libelle}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, libelle: e.target.value }));
            setErrors((prev) => ({ ...prev, libelle: "" }));
          }}
          className={`w-full h-10 px-4 text-sm border rounded-lg ${
            errors.libelle ? "border-red-500" : "border-gray-300"
          } bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text`}
          placeholder="Description de l'écriture"
        />
        {errors.libelle && (
          <p className="mt-1 text-xs text-red-500">{errors.libelle}</p>
        )}
      </div>

      {/* Comptes avec dropdown */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="compte_debit"
            className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
          >
            Compte débit <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                id="compte_debit"
                value={searchDebitTerm}
                onChange={(e) => {
                  setSearchDebitTerm(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    compte_debit: e.target.value,
                  }));
                  setErrors((prev) => ({ ...prev, compte_debit: "" }));
                  setShowDebitDropdown(true);
                }}
                onFocus={() => setShowDebitDropdown(true)}
                className={`w-full h-10 pl-10 pr-10 text-sm border rounded-lg ${
                  errors.compte_debit ? "border-red-500" : "border-gray-300"
                } bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text`}
                placeholder="Rechercher compte débit..."
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
              {isSearchingDebit && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            {/* Dropdown des résultats débit */}
            {showDebitDropdown && comptesDebit.length > 0 && (
              <div className="absolute z-50 w-full mt-1 border border-gray-200 bg-white rounded-lg shadow-lg max-h-64 overflow-auto">
                {comptesDebit.map((compte) => (
                  <button
                    key={compte.numero}
                    type="button"
                    onClick={() => handleCompteSelect("debit")(compte)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-0 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {compte.numero}
                      </span>
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">
                        {compte.libelle}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.compte_debit && (
            <p className="mt-1 text-xs text-red-500">{errors.compte_debit}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="compte_credit"
            className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
          >
            Compte crédit <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                id="compte_credit"
                value={searchCreditTerm}
                onChange={(e) => {
                  setSearchCreditTerm(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    compte_credit: e.target.value,
                  }));
                  setErrors((prev) => ({ ...prev, compte_credit: "" }));
                  setShowCreditDropdown(true);
                }}
                onFocus={() => setShowCreditDropdown(true)}
                className={`w-full h-10 pl-10 pr-10 text-sm border rounded-lg ${
                  errors.compte_credit ? "border-red-500" : "border-gray-300"
                } bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text`}
                placeholder="Rechercher compte crédit..."
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
              {isSearchingCredit && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            {/* Dropdown des résultats crédit */}
            {showCreditDropdown && comptesCredit.length > 0 && (
              <div className="absolute z-50 w-full mt-1 border border-gray-200 bg-white rounded-lg shadow-lg max-h-64 overflow-auto">
                {comptesCredit.map((compte) => (
                  <button
                    key={compte.numero}
                    type="button"
                    onClick={() => handleCompteSelect("credit")(compte)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-0 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {compte.numero}
                      </span>
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">
                        {compte.libelle}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.compte_credit && (
            <p className="mt-1 text-xs text-red-500">{errors.compte_credit}</p>
          )}
        </div>
      </div>

      {/* Montant */}
      <div>
        <label
          htmlFor="montant"
          className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
        >
          Montant (FBU) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            id="montant"
            value={formData.montant}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, montant: e.target.value }));
              setErrors((prev) => ({ ...prev, montant: "" }));
            }}
            step="1"
            min="1"
            className={`w-full h-10 pl-10 pr-4 text-sm border rounded-lg ${
              errors.montant ? "border-red-500" : "border-gray-300"
            } bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors cursor-text`}
            placeholder="0"
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        {errors.montant && (
          <p className="mt-1 text-xs text-red-500">{errors.montant}</p>
        )}
      </div>

      {/* Observation */}
      <div>
        <label
          htmlFor="observation"
          className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2"
        >
          Observation <span className="text-gray-400">(optionnel)</span>
        </label>
        <textarea
          id="observation"
          value={formData.observation}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, observation: e.target.value }))
          }
          rows={3}
          className="w-full px-4 py-2 text-sm border border-gray-300 bg-white rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors resize-none cursor-text"
          placeholder="Informations complémentaires..."
        />
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading || !!dateError || !!pieceError}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[140px] justify-center cursor-pointer"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" color="text-white" />
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
