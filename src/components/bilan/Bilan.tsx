import React, { useState, useEffect } from "react";
import { BilanData, BilanFilters } from "../../types/bilan";
import { getBilanComparatif } from "../../lib/bilan.db";

export function Bilan() {
  const [data, setData] = useState<BilanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateInitiale, setDateInitiale] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [dateFinale, setDateFinale] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const loadBilan = async () => {
    setIsLoading(true);
    try {
      const filters: BilanFilters = { dateInitiale, dateFinale };
      const result = await getBilanComparatif(filters);
      setData(result);
    } catch (error) {
      console.error("Erreur chargement bilan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBilan();
  }, [dateInitiale, dateFinale]);

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-BI", { minimumFractionDigits: 0 }).format(
        montant,
      ) + " FBU"
    );
  };

  const formatVariation = (variation: number, pourcentage: number) => {
    const signe = variation >= 0 ? "+" : "";
    return (
      <span className={variation >= 0 ? "text-green-600" : "text-red-600"}>
        {signe}
        {formatMontant(Math.abs(variation))}
        <span className="text-xs ml-1">
          ({signe}
          {pourcentage.toFixed(1)}%)
        </span>
      </span>
    );
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

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bilan comparatif</h1>
        <p className="text-sm text-gray-500 mt-1">
          Analyse de l'évolution de la situation patrimoniale
        </p>
      </div>

      {/* Sélecteur de dates */}
      <div className="mb-6 p-6 bg-gray-50 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-4">
          Période de comparaison
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Bilan initial
            </label>
            <input
              type="date"
              value={dateInitiale}
              onChange={(e) => setDateInitiale(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Bilan final
            </label>
            <input
              type="date"
              value={dateFinale}
              onChange={(e) => setDateFinale(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Totaux principaux */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
            Total Actif
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatMontant(data.total_actif.final)}
          </p>
          <p className="text-sm mt-2">
            {formatVariation(
              data.total_actif.variation,
              (data.total_actif.variation / (data.total_actif.initial || 1)) *
                100,
            )}
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
            Total Passif
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatMontant(data.total_passif.final)}
          </p>
          <p className="text-sm mt-2">
            {formatVariation(
              data.total_passif.variation,
              (data.total_passif.variation / (data.total_passif.initial || 1)) *
                100,
            )}
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
            Équilibre
          </p>
          <p
            className={`text-2xl font-bold ${Math.abs(data.total_actif.final - data.total_passif.final) < 1 ? "text-green-600" : "text-red-600"}`}
          >
            {Math.abs(data.total_actif.final - data.total_passif.final) < 1
              ? "✓ Équilibré"
              : "⚠️ Déséquilibré"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Actif - Passif ={" "}
            {formatMontant(data.total_actif.final - data.total_passif.final)}
          </p>
        </div>
      </div>

      {/* Tableaux comparatifs */}
      <div className="space-y-6">
        {/* ACTIF */}
        <div className="border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 px-4 py-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-white uppercase tracking-wider">
                {data.actif.titre}
              </h3>
              <span className="text-xs text-white opacity-90">
                Initial: {formatMontant(data.actif.total_initial)} | Final:{" "}
                {formatMontant(data.actif.total_final)}
              </span>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Compte
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Libellé
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Initial
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Final
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Variation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.actif.lignes.map((ligne) => (
                <tr key={ligne.compte_numero} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-sm text-gray-900">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {ligne.compte_libelle}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-gray-600">
                    {ligne.montant_initial > 0
                      ? formatMontant(ligne.montant_initial)
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium text-gray-900">
                    {ligne.montant_final > 0
                      ? formatMontant(ligne.montant_final)
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm">
                    {ligne.variation !== 0
                      ? formatVariation(
                          ligne.variation,
                          ligne.variation_pourcentage,
                        )
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PASSIF */}
        <div className="border border-gray-200 overflow-hidden">
          <div className="bg-purple-600 px-4 py-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-white uppercase tracking-wider">
                {data.passif.titre}
              </h3>
              <span className="text-xs text-white opacity-90">
                Initial: {formatMontant(data.passif.total_initial)} | Final:{" "}
                {formatMontant(data.passif.total_final)}
              </span>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Compte
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Libellé
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Initial
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Final
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Variation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.passif.lignes.map((ligne) => (
                <tr key={ligne.compte_numero} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-sm text-gray-900">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {ligne.compte_libelle}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-gray-600">
                    {ligne.montant_initial > 0
                      ? formatMontant(ligne.montant_initial)
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium text-gray-900">
                    {ligne.montant_final > 0
                      ? formatMontant(ligne.montant_final)
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm">
                    {ligne.variation !== 0
                      ? formatVariation(
                          ligne.variation,
                          ligne.variation_pourcentage,
                        )
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CAPITAUX PROPRES */}
        <div className="border border-gray-200 overflow-hidden">
          <div className="bg-green-600 px-4 py-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-white uppercase tracking-wider">
                {data.capitaux_propres.titre}
              </h3>
              <span className="text-xs text-white opacity-90">
                Initial: {formatMontant(data.capitaux_propres.total_initial)} |
                Final: {formatMontant(data.capitaux_propres.total_final)}
              </span>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Compte
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Libellé
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Initial
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Final
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Variation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.capitaux_propres.lignes.map((ligne, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-sm text-gray-900">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {ligne.compte_libelle}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-gray-600">
                    {ligne.montant_initial !== 0
                      ? ligne.montant_initial > 0
                        ? formatMontant(ligne.montant_initial)
                        : `(${formatMontant(-ligne.montant_initial)})`
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium text-gray-900">
                    {ligne.montant_final !== 0
                      ? ligne.montant_final > 0
                        ? formatMontant(ligne.montant_final)
                        : `(${formatMontant(-ligne.montant_final)})`
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm">
                    {ligne.variation !== 0
                      ? formatVariation(
                          ligne.variation,
                          ligne.variation_pourcentage,
                        )
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Graphique d'évolution */}
      <div className="mt-6 p-6 bg-white border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-4">
          Évolution du bilan
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Actif</span>
              <span className="font-mono text-gray-900">
                {formatMontant(data.total_actif.final)}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200">
              <div
                className="h-2 bg-blue-600"
                style={{
                  width: `${(data.total_actif.final / Math.max(data.total_actif.final, data.total_passif.final)) * 100}%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Passif + Capitaux</span>
              <span className="font-mono text-gray-900">
                {formatMontant(data.total_passif.final)}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200">
              <div
                className="h-2 bg-purple-600"
                style={{
                  width: `${(data.total_passif.final / Math.max(data.total_actif.final, data.total_passif.final)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>
          📅 Bilan initial au{" "}
          {new Date(data.dates.initial).toLocaleDateString("fr-BI")}
        </p>
        <p>
          📅 Bilan final au{" "}
          {new Date(data.dates.final).toLocaleDateString("fr-BI")}
        </p>
        <p>✅ Un bilan est équilibré quand Actif = Passif + Capitaux propres</p>
        <p className="flex items-center gap-3">
          <span className="text-green-600">↑ Variation positive</span>
          <span className="text-red-600">↓ Variation négative</span>
        </p>
      </div>
    </div>
  );
}
