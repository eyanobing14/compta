// balance/Balance.tsx
import React, { useState, useEffect } from "react";
import {
  BalanceLine,
  BalanceTotals,
  BalanceFilters,
} from "../../types/balance";
import { getBalance, checkBalanceEquilibre } from "../../lib/balance.db";
import { Exercice } from "../../types/exercice";
import { Spinner } from "../exercices/Spinner";

interface BalanceProps {
  exerciceOuvert: Exercice | null;
}

export function Balance({ exerciceOuvert }: BalanceProps) {
  const [lignes, setLignes] = useState<BalanceLine[]>([]);
  const [totaux, setTotaux] = useState<BalanceTotals>({
    total_debit: 0,
    total_credit: 0,
    total_solde_debiteur: 0,
    total_solde_crediteur: 0,
  });
  const [equilibre, setEquilibre] = useState<{
    est_equilibree: boolean;
    ecart: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<BalanceFilters>({});
  const [dateDebut, setDateDebut] = useState(exerciceOuvert?.date_debut || "");
  const [dateFin, setDateFin] = useState(exerciceOuvert?.date_fin || "");
  const [typeFilter, setTypeFilter] = useState<string>("TOUS");

  // Mettre à jour les dates quand l'exercice change
  useEffect(() => {
    if (exerciceOuvert) {
      setDateDebut(exerciceOuvert.date_debut);
      setDateFin(exerciceOuvert.date_fin);
    }
  }, [exerciceOuvert]);

  const loadBalance = async () => {
    setIsLoading(true);
    try {
      console.log("Chargement balance avec filtres:", filters);
      const result = await getBalance(filters);
      setLignes(result.lignes);
      setTotaux(result.totaux);

      const equilibreResult = await checkBalanceEquilibre(
        filters.date_debut,
        filters.date_fin,
      );
      setEquilibre({
        est_equilibree: equilibreResult.est_equilibree,
        ecart: equilibreResult.ecart,
      });
    } catch (error) {
      console.error("Erreur chargement balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger la balance au montage et quand les filtres changent
  useEffect(() => {
    if (exerciceOuvert) {
      const defaultFilters: BalanceFilters = {
        date_debut: exerciceOuvert.date_debut,
        date_fin: exerciceOuvert.date_fin,
      };
      setFilters(defaultFilters);
    }
  }, [exerciceOuvert]);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      loadBalance();
    }
  }, [filters]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();

    // IMPORTANT: Convertir "TOUS" en undefined pour ne pas filtrer
    const newFilters: BalanceFilters = {
      date_debut: dateDebut || undefined,
      date_fin: dateFin || undefined,
    };

    // Seulement ajouter type_compte si ce n'est pas "TOUS"
    if (typeFilter !== "TOUS") {
      newFilters.type_compte = typeFilter;
    }

    console.log("Application des filtres:", newFilters);
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    if (exerciceOuvert) {
      setDateDebut(exerciceOuvert.date_debut);
      setDateFin(exerciceOuvert.date_fin);
    }
    setTypeFilter("TOUS");
    const defaultFilters: BalanceFilters = {
      date_debut: exerciceOuvert?.date_debut,
      date_fin: exerciceOuvert?.date_fin,
    };
    setFilters(defaultFilters);
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-BI", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  };

  const getTypeBadgeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      ACTIF: "bg-blue-50 text-blue-700 border border-blue-200",
      PASSIF: "bg-purple-50 text-purple-700 border border-purple-200",
      PRODUIT: "bg-green-50 text-green-700 border border-green-200",
      CHARGE: "bg-orange-50 text-orange-700 border border-orange-200",
      TRESORERIE: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    };
    return type && colors[type]
      ? colors[type]
      : "bg-gray-50 text-gray-700 border border-gray-200";
  };

  if (!exerciceOuvert) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-700">
            Veuillez d'abord créer et ouvrir un exercice pour accéder à la
            Balance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Balance comptable</h1>
        <p className="text-sm text-gray-500 mt-1">
          Récapitulatif des soldes de tous les comptes pour l'exercice{" "}
          <span className="font-medium text-gray-700">
            {exerciceOuvert.nom_exercice}
          </span>
        </p>
      </div>

      {/* Message d'équilibre */}
      {equilibre && (
        <div
          className={`mb-6 p-4 rounded-xl ${
            equilibre.est_equilibree
              ? "bg-green-50 border border-green-200"
              : "bg-yellow-50 border border-yellow-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {equilibre.est_equilibree ? (
              <svg
                className="w-5 h-5 text-green-600"
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
            ) : (
              <svg
                className="w-5 h-5 text-yellow-600"
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
            )}
            <div>
              <p
                className={`font-medium ${
                  equilibre.est_equilibree
                    ? "text-green-700"
                    : "text-yellow-700"
                }`}
              >
                {equilibre.est_equilibree
                  ? "Balance équilibrée"
                  : "Balance non équilibrée"}
              </p>
              <p className="text-sm text-gray-600">
                Total débit: {formatMontant(totaux.total_debit)} FBU | Total
                crédit: {formatMontant(totaux.total_credit)} FBU
                {!equilibre.est_equilibree && (
                  <> | Écart: {formatMontant(equilibre.ecart)} FBU</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tableau */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  N°
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Libellé
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Total Débit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Total Crédit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Solde Débiteur
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Solde Créditeur
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lignes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Aucune donnée pour la période sélectionnée
                  </td>
                </tr>
              ) : (
                lignes.map((ligne) => (
                  <tr
                    key={ligne.compte_numero}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">
                      {ligne.compte_numero}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {ligne.compte_libelle}
                    </td>
                    <td className="px-4 py-3">
                      {ligne.type_compte && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getTypeBadgeColor(ligne.type_compte)}`}
                        >
                          {ligne.type_compte}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-blue-600">
                      {ligne.total_debit > 0
                        ? formatMontant(ligne.total_debit) + " FBU"
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-red-600">
                      {ligne.total_credit > 0
                        ? formatMontant(ligne.total_credit) + " FBU"
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-blue-600">
                      {ligne.solde_debiteur > 0
                        ? formatMontant(ligne.solde_debiteur) + " FBU"
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-red-600">
                      {ligne.solde_crediteur > 0
                        ? formatMontant(ligne.solde_crediteur) + " FBU"
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {lignes.length > 0 && (
              <tfoot className="bg-gray-800 text-white font-medium">
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-right text-sm">
                    TOTAUX GÉNÉRAUX
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-sm">
                    {formatMontant(totaux.total_debit)} FBU
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-sm">
                    {formatMontant(totaux.total_credit)} FBU
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-sm">
                    {formatMontant(totaux.total_solde_debiteur)} FBU
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-sm">
                    {formatMontant(totaux.total_solde_crediteur)} FBU
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
