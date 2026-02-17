// resultat/CompteResultat.tsx
import React, { useState, useEffect } from "react";
import {
  CompteResultatData,
  ResultatFilters,
  PeriodeType,
} from "../../types/resultat";
import { getCompteResultat } from "../../lib/resultat.db";
import { Exercice } from "../../types/exercice";
import { Spinner } from "../exercices/Spinner";

interface CompteResultatProps {
  exerciceOuvert: Exercice | null;
}

export function CompteResultat({ exerciceOuvert }: CompteResultatProps) {
  const [data, setData] = useState<CompteResultatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodeType, setPeriodeType] = useState<PeriodeType>("exercice");
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [trimestre, setTrimestre] = useState(
    Math.floor((new Date().getMonth() + 3) / 3),
  );
  const [dateDebut, setDateDebut] = useState(exerciceOuvert?.date_debut || "");
  const [dateFin, setDateFin] = useState(exerciceOuvert?.date_fin || "");

  useEffect(() => {
    if (exerciceOuvert) {
      setDateDebut(exerciceOuvert.date_debut);
      setDateFin(exerciceOuvert.date_fin);
    }
  }, [exerciceOuvert]);

  const loadResultat = async () => {
    if (!exerciceOuvert && periodeType !== "personnalisee") return;

    setIsLoading(true);
    try {
      let filters: ResultatFilters;

      if (periodeType === "exercice") {
        filters = {
          periodeType: "personnalisee",
          dateDebut: exerciceOuvert?.date_debut,
          dateFin: exerciceOuvert?.date_fin,
        };
      } else {
        filters = {
          periodeType,
          annee,
          mois: periodeType === "mois" ? mois : undefined,
          trimestre: periodeType === "trimestre" ? trimestre : undefined,
          dateDebut: periodeType === "personnalisee" ? dateDebut : undefined,
          dateFin: periodeType === "personnalisee" ? dateFin : undefined,
        };
      }

      const result = await getCompteResultat(filters);
      setData(result);
    } catch (error) {
      console.error("Erreur chargement compte résultat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (exerciceOuvert || periodeType === "personnalisee") {
      loadResultat();
    }
  }, [periodeType, annee, mois, trimestre, dateDebut, dateFin, exerciceOuvert]);

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-BI", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  };

  if (!exerciceOuvert && periodeType === "exercice") {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-700">
            Veuillez d'abord créer et ouvrir un exercice
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        Aucune donnée pour la période sélectionnée
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Compte de résultat</h1>
        <p className="text-sm text-gray-500 mt-1">{data.periode.libelle}</p>
      </div>

      {/* Résultat net - Style comme Balance */}
      <div
        className={`mb-6 p-4 rounded-xl border ${
          data.resultat.type === "BENEFICE"
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center gap-3">
          {data.resultat.type === "BENEFICE" ? (
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
              className="w-5 h-5 text-red-600"
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
              className={`font-medium ${data.resultat.type === "BENEFICE" ? "text-green-700" : "text-red-700"}`}
            >
              RÉSULTAT NET
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatMontant(data.resultat.montant)} FBU
            </p>
            <p className="text-xs text-gray-500">
              {data.resultat.type === "BENEFICE" ? "Bénéfice" : "Perte"}
            </p>
          </div>
        </div>
      </div>

      {/* Tableaux Produits et Charges - Style comme Journal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produits */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">
              PRODUITS ({formatMontant(data.produits.total)} FBU)
            </h3>
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
              {data.produits.lignes
                .filter((l) => l.montant > 0)
                .map((ligne) => (
                  <tr key={ligne.compte_numero} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-sm text-gray-900">
                      {ligne.compte_numero}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {ligne.compte_libelle}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm text-green-600">
                      {formatMontant(ligne.montant)} FBU
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Charges */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">
              CHARGES ({formatMontant(data.charges.total)} FBU)
            </h3>
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
              {data.charges.lignes
                .filter((l) => l.montant > 0)
                .map((ligne) => (
                  <tr key={ligne.compte_numero} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-sm text-gray-900">
                      {ligne.compte_numero}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {ligne.compte_libelle}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm text-red-600">
                      {formatMontant(ligne.montant)} FBU
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indicateurs simples */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Rentabilité</p>
          <p
            className={`text-lg font-bold ${data.resultat.type === "BENEFICE" ? "text-green-600" : "text-red-600"}`}
          >
            {data.produits.total > 0
              ? ((data.resultat.montant / data.produits.total) * 100).toFixed(1)
              : "0"}
            %
          </p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Ratio charges/produits</p>
          <p className="text-lg font-bold text-gray-900">
            {data.produits.total > 0
              ? ((data.charges.total / data.produits.total) * 100).toFixed(1)
              : "0"}
            %
          </p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Nombre d'écritures</p>
          <p className="text-lg font-bold text-gray-900">
            {data.produits.lignes.filter((l) => l.montant > 0).length +
              data.charges.lignes.filter((l) => l.montant > 0).length}
          </p>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Bénéfice</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <span>Perte</span>
        </div>
      </div>
    </div>
  );
}
