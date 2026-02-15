import React, { useState, useEffect } from "react";
import {
  BalanceLine,
  BalanceTotals,
  BalanceFilters,
} from "../../types/balance";
import { getBalance, checkBalanceEquilibre } from "../../lib/balance.db";

export function Balance() {
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
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("TOUS");

  const loadBalance = async () => {
    setIsLoading(true);
    try {
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

  useEffect(() => {
    loadBalance();
  }, [filters]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters: BalanceFilters = {};
    if (dateDebut) newFilters.date_debut = dateDebut;
    if (dateFin) newFilters.date_fin = dateFin;
    if (typeFilter !== "TOUS") newFilters.type_compte = typeFilter;
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setDateDebut("");
    setDateFin("");
    setTypeFilter("TOUS");
    setFilters({});
  };

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-BI", { minimumFractionDigits: 0 }).format(
        montant,
      ) + " FBU"
    );
  };

  const getTypeBadgeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      ACTIF: "bg-blue-50 text-blue-700",
      PASSIF: "bg-purple-50 text-purple-700",
      PRODUIT: "bg-green-50 text-green-700",
      CHARGE: "bg-orange-50 text-orange-700",
      TRESORERIE: "bg-cyan-50 text-cyan-700",
    };
    return type && colors[type] ? colors[type] : "bg-gray-50 text-gray-700";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg
          className="animate-spin h-8 w-8 text-gray-900"
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
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Balance comptable</h1>
        <p className="text-sm text-gray-500 mt-1">
          Récapitulatif des soldes de tous les comptes
        </p>
      </div>

      {/* Message d'équilibre */}
      {equilibre && (
        <div
          className={`mb-6 p-4 ${equilibre.est_equilibree ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}
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
                className={`font-medium ${equilibre.est_equilibree ? "text-green-700" : "text-yellow-700"}`}
              >
                {equilibre.est_equilibree
                  ? "Balance équilibrée"
                  : "Balance non équilibrée"}
              </p>
              <p className="text-sm text-gray-600">
                Total débit: {formatMontant(totaux.total_debit)} | Total crédit:{" "}
                {formatMontant(totaux.total_credit)}
                {!equilibre.est_equilibree && (
                  <> | Écart: {formatMontant(equilibre.ecart)}</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <form
        onSubmit={handleApplyFilters}
        className="mb-6 p-6 bg-gray-50 border border-gray-200"
      >
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-4">
          Filtres
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Date début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Type de compte
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            >
              <option value="TOUS">Tous les types</option>
              <option value="ACTIF">Actif</option>
              <option value="PASSIF">Passif</option>
              <option value="CHARGE">Charge</option>
              <option value="PRODUIT">Produit</option>
              <option value="TRESORERIE">Trésorerie</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
            >
              Appliquer
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </form>

      {/* Tableau */}
      <div className="border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                N°
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Libellé
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Total Débit
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Total Crédit
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Solde Débiteur
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Solde Créditeur
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {lignes.map((ligne) => (
              <tr key={ligne.compte_numero} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm text-gray-900">
                  {ligne.compte_numero}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {ligne.compte_libelle}
                </td>
                <td className="px-4 py-3">
                  {ligne.type_compte && (
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium ${getTypeBadgeColor(ligne.type_compte)}`}
                    >
                      {ligne.type_compte}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-blue-600">
                  {ligne.total_debit > 0
                    ? formatMontant(ligne.total_debit)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-red-600">
                  {ligne.total_credit > 0
                    ? formatMontant(ligne.total_credit)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-blue-600">
                  {ligne.solde_debiteur > 0
                    ? formatMontant(ligne.solde_debiteur)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-red-600">
                  {ligne.solde_crediteur > 0
                    ? formatMontant(ligne.solde_crediteur)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-medium">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right text-gray-700">
                TOTAUX
              </td>
              <td className="px-4 py-3 text-right font-mono text-blue-600">
                {formatMontant(totaux.total_debit)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-red-600">
                {formatMontant(totaux.total_credit)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-blue-600">
                {formatMontant(totaux.total_solde_debiteur)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-red-600">
                {formatMontant(totaux.total_solde_crediteur)}
              </td>
            </tr>
          </tfoot>
        </table>

        {lignes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Aucune donnée pour la période sélectionnée
            </p>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Balance équilibrée : Total débits = Total crédits
        </p>
        <p className="flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          Balance non équilibrée : Écart à corriger
        </p>
      </div>
    </div>
  );
}
