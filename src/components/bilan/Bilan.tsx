import React, { useState, useEffect } from "react";
import { BilanData, BilanFilters } from "../../types/bilan";
import { getBilanComparatif } from "../../lib/bilan.db";
import { Exercice } from "../../types/exercice";
import { Spinner } from "../exercices/Spinner";

interface BilanProps {
  exerciceOuvert: Exercice | null;
}

export function Bilan({ exerciceOuvert }: BilanProps) {
  const [data, setData] = useState<BilanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBilan = async () => {
    if (!exerciceOuvert) return;

    setIsLoading(true);
    try {
      const filters: BilanFilters = {
        dateInitiale: exerciceOuvert.date_debut,
        dateFinale: exerciceOuvert.date_fin,
      };
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
  }, [exerciceOuvert]);

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-BI", { minimumFractionDigits: 0 }).format(
        montant,
      ) + " FBU"
    );
  };

  const isEquilibre =
    data && Math.abs(data.total_actif.final - data.total_passif.final) < 1;

  if (!exerciceOuvert) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-700">
            Veuillez d'abord créer et ouvrir un exercice pour accéder au Bilan
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <Spinner />
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
        <h1 className="text-2xl font-bold text-gray-900">Bilan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Situation patrimoniale de l'exercice{" "}
          <span className="font-medium text-gray-700">
            {exerciceOuvert.nom_exercice}
          </span>
        </p>
      </div>

      {/* Indicateur d'équilibre */}
      <div
        className={`mb-6 p-4 border rounded-lg ${
          isEquilibre
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEquilibre ? (
              <>
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
                <span className="text-sm font-medium text-green-700">
                  Bilan équilibré (Actif = Passif)
                </span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 text-red-600"
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
                <span className="text-sm font-medium text-red-700">
                  Bilan déséquilibré (Actif ≠ Passif)
                </span>
              </>
            )}
          </div>
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-400 rounded-lg hover:bg-gray-200 transition-colors cursor-not-allowed"
          >
            Visiter le précédent exercice
          </button>
        </div>
      </div>

      {/* Tableaux comparatifs */}
      <div className="space-y-6">
        {/* ACTIF */}
        <div className="border-2 border-green-200 rounded-lg overflow-hidden">
          <div className="bg-white px-4 py-3 border-b border-green-200">
            <h3 className="text-sm font-medium text-green-700 uppercase tracking-wider">
              Actif
            </h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                  Compte
                </th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase flex-1">
                  Libellé
                </th>
                <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  Initial
                </th>
                <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  Final
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.actif.lignes.map((ligne) => (
                <tr key={ligne.compte_numero} className="hover:bg-gray-50">
                  <td className="px-6 py-2 font-mono text-sm text-gray-900">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-700">
                    {ligne.compte_libelle}
                  </td>
                  <td className="px-6 py-2 text-right font-mono text-sm text-gray-600">
                    {ligne.montant_initial > 0
                      ? formatMontant(ligne.montant_initial)
                      : "-"}
                  </td>
                  <td className="px-6 py-2 text-right font-mono text-sm text-gray-900">
                    {ligne.montant_final > 0
                      ? formatMontant(ligne.montant_final)
                      : "-"}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium border-t-2 border-gray-300">
                <td colSpan={2} className="px-6 py-2 text-sm text-gray-900">
                  Total Actif
                </td>
                <td className="px-6 py-2 text-right font-mono text-sm text-gray-900">
                  {formatMontant(data.total_actif.initial)}
                </td>
                <td className="px-6 py-2 text-right font-mono text-sm text-gray-900">
                  {formatMontant(data.total_actif.final)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PASSIF */}
        <div className="border-2 border-red-200 rounded-lg overflow-hidden">
          <div className="bg-white px-4 py-3 border-b border-red-200">
            <h3 className="text-sm font-medium text-red-700 uppercase tracking-wider">
              Passif
            </h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                  Compte
                </th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase flex-1">
                  Libellé
                </th>
                <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  Initial
                </th>
                <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                  Final
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.passif.lignes.map((ligne) => (
                <tr key={ligne.compte_numero} className="hover:bg-gray-50">
                  <td className="px-6 py-2 font-mono text-sm text-gray-900">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-700">
                    {ligne.compte_libelle}
                  </td>
                  <td className="px-6 py-2 text-right font-mono text-sm text-gray-600">
                    {ligne.montant_initial > 0
                      ? formatMontant(ligne.montant_initial)
                      : "-"}
                  </td>
                  <td className="px-6 py-2 text-right font-mono text-sm text-gray-900">
                    {ligne.montant_final > 0
                      ? formatMontant(ligne.montant_final)
                      : "-"}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium border-t-2 border-gray-300">
                <td colSpan={2} className="px-6 py-2 text-sm text-gray-900">
                  Total Passif
                </td>
                <td className="px-6 py-2 text-right font-mono text-sm text-gray-900">
                  {formatMontant(data.total_passif.initial)}
                </td>
                <td className="px-6 py-2 text-right font-mono text-sm text-gray-900">
                  {formatMontant(data.total_passif.final)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
