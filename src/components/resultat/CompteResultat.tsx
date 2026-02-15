import React, { useState, useEffect } from "react";
import {
  CompteResultatData,
  ResultatFilters,
  PeriodeType,
} from "../../types/resultat";
import { getCompteResultat } from "../../lib/resultat.db";

export function CompteResultat() {
  const [data, setData] = useState<CompteResultatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodeType, setPeriodeType] = useState<PeriodeType>("mois");
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [trimestre, setTrimestre] = useState(
    Math.floor((new Date().getMonth() + 3) / 3),
  );
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const loadResultat = async () => {
    setIsLoading(true);
    try {
      const filters: ResultatFilters = {
        periodeType,
        annee,
        mois: periodeType === "mois" ? mois : undefined,
        trimestre: periodeType === "trimestre" ? trimestre : undefined,
        dateDebut: periodeType === "personnalisee" ? dateDebut : undefined,
        dateFin: periodeType === "personnalisee" ? dateFin : undefined,
      };

      const result = await getCompteResultat(filters);
      setData(result);
    } catch (error) {
      console.error("Erreur chargement compte résultat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResultat();
  }, [periodeType, annee, mois, trimestre, dateDebut, dateFin]);

  const handlePeriodeChange = (type: PeriodeType) => {
    setPeriodeType(type);
  };

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-BI", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(montant) + " FBU"
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
        <h1 className="text-2xl font-bold text-gray-900">Compte de résultat</h1>
        <div className="flex items-center gap-2 mt-1">
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">{data.periode.libelle}</p>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="mb-6 p-6 bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
            Période
          </h3>
        </div>

        {/* Boutons de sélection */}
        <div className="flex gap-2 mb-4">
          {[
            { type: "mois", label: "Mois", icon: "📅" },
            { type: "trimestre", label: "Trimestre", icon: "📊" },
            { type: "annee", label: "Année", icon: "📆" },
            { type: "personnalisee", label: "Personnalisé", icon: "✏️" },
          ].map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => handlePeriodeChange(type as PeriodeType)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                periodeType === type
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Contrôles spécifiques */}
        <div className="grid grid-cols-4 gap-4">
          {periodeType === "mois" && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Année
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={annee}
                    onChange={(e) => setAnnee(parseInt(e.target.value))}
                    className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
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
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mois</label>
                <div className="relative">
                  <select
                    value={mois}
                    onChange={(e) => setMois(parseInt(e.target.value))}
                    className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 appearance-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1, 1).toLocaleDateString("fr-BI", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </>
          )}

          {periodeType === "trimestre" && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Année
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={annee}
                    onChange={(e) => setAnnee(parseInt(e.target.value))}
                    className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
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
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Trimestre
                </label>
                <div className="relative">
                  <select
                    value={trimestre}
                    onChange={(e) => setTrimestre(parseInt(e.target.value))}
                    className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 appearance-none"
                  >
                    <option value={1}>1er trimestre</option>
                    <option value={2}>2e trimestre</option>
                    <option value={3}>3e trimestre</option>
                    <option value={4}>4e trimestre</option>
                  </select>
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
            </>
          )}

          {periodeType === "annee" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Année</label>
              <div className="relative">
                <input
                  type="number"
                  value={annee}
                  onChange={(e) => setAnnee(parseInt(e.target.value))}
                  className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
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
            </div>
          )}

          {periodeType === "personnalisee" && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Date début
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
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
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Date fin
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
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
              </div>
            </>
          )}
        </div>
      </div>

      {/* Résultat principal */}
      <div
        className={`mb-6 p-6 border-l-4 ${
          data.resultat.type === "BENEFICE"
            ? "border-green-500 bg-green-50"
            : "border-red-500 bg-red-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full ${
                data.resultat.type === "BENEFICE"
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {data.resultat.type === "BENEFICE" ? (
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
              )}
            </div>
            <div>
              <p
                className={`text-sm font-medium uppercase tracking-wider ${
                  data.resultat.type === "BENEFICE"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {data.resultat.type === "BENEFICE" ? "BÉNÉFICE" : "PERTE"}
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatMontant(data.resultat.montant)}
              </p>
            </div>
          </div>

          {data.resultat.taux_marge !== undefined &&
            data.resultat.type === "BENEFICE" && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Taux de marge</p>
                <p className="text-2xl font-semibold text-green-600">
                  {data.resultat.taux_marge.toFixed(1)}%
                </p>
              </div>
            )}
        </div>
      </div>

      {/* Tableaux comparatifs */}
      <div className="grid grid-cols-2 gap-6">
        {/* Produits */}
        <div className="border border-gray-200 overflow-hidden">
          <div className="bg-green-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <h3 className="text-sm font-medium text-white uppercase tracking-wider">
                {data.produits.titre}
              </h3>
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
                  Montant
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.produits.lignes.map((ligne) => (
                <tr key={ligne.compte_numero} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-sm text-gray-900 w-24">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {ligne.compte_libelle}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium text-green-600">
                    {ligne.montant > 0 ? formatMontant(ligne.montant) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-green-50">
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-3 text-right text-sm font-medium text-gray-700"
                >
                  TOTAL PRODUITS
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm font-bold text-green-700">
                  {formatMontant(data.produits.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Charges */}
        <div className="border border-gray-200 overflow-hidden">
          <div className="bg-red-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
              <h3 className="text-sm font-medium text-white uppercase tracking-wider">
                {data.charges.titre}
              </h3>
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
                  Montant
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.charges.lignes.map((ligne) => (
                <tr key={ligne.compte_numero} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-sm text-gray-900 w-24">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {ligne.compte_libelle}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium text-red-600">
                    {ligne.montant > 0 ? formatMontant(ligne.montant) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-red-50">
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-3 text-right text-sm font-medium text-gray-700"
                >
                  TOTAL CHARGES
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm font-bold text-red-700">
                  {formatMontant(data.charges.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Graphique de répartition */}
      {data.charges.lignes.some((l) => l.montant > 0) && (
        <div className="mt-6 p-6 bg-white border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
              Répartition des charges
            </h3>
          </div>
          <div className="space-y-3">
            {data.charges.lignes
              .filter((l) => l.montant > 0)
              .map((ligne) => {
                const pourcentage = (ligne.montant / data.charges.total) * 100;
                return (
                  <div key={ligne.compte_numero}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {ligne.compte_libelle}
                      </span>
                      <span className="font-mono text-gray-900">
                        {pourcentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200">
                      <div
                        className="h-2 bg-red-500"
                        style={{ width: `${pourcentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Indicateurs supplémentaires */}
      {data.produits.total > 0 && data.charges.total > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Ratio charges/produits
            </p>
            <p className="text-lg font-bold text-gray-900">
              {((data.charges.total / data.produits.total) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Rentabilité
            </p>
            <p
              className={`text-lg font-bold ${
                data.resultat.type === "BENEFICE"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {((data.resultat.montant / data.produits.total) * 100).toFixed(1)}
              %
            </p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Moyenne par écriture
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatMontant(
                data.produits.total / (data.charges.lignes.length || 1),
              )}
            </p>
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          <span>Bénéfice : Produits &gt; Charges</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
          <span>Perte : Charges &gt; Produits</span>
        </div>
      </div>
    </div>
  );
}
