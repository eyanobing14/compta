import React, { useState } from "react";
import { getResultatComparatif } from "../../lib/resultat.db";
import { ResultatFilters } from "../../types/resultat";

export function ComparaisonResultat() {
  const [periode1, setPeriode1] = useState("");
  const [periode2, setPeriode2] = useState("");
  const [resultat, setResultat] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = async () => {
    if (!periode1 || !periode2) return;

    setIsLoading(true);
    try {
      // Exemple simple : comparaison de deux années
      const filters1: ResultatFilters = {
        periodeType: "annee",
        annee: parseInt(periode1),
      };
      const filters2: ResultatFilters = {
        periodeType: "annee",
        annee: parseInt(periode2),
      };

      const result = await getResultatComparatif(filters1, filters2);
      setResultat(result);
    } catch (error) {
      console.error("Erreur comparaison:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-BI", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(montant) + " FBU"
    );
  };

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="font-medium mb-4">Comparaison de résultats</h3>

      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-xs mb-1">Période 1</label>
          <input
            type="number"
            value={periode1}
            onChange={(e) => setPeriode1(e.target.value)}
            placeholder="Année"
            className="px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Période 2</label>
          <input
            type="number"
            value={periode2}
            onChange={(e) => setPeriode2(e.target.value)}
            placeholder="Année"
            className="px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <button
          onClick={handleCompare}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 self-end"
        >
          Comparer
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}

      {resultat && (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                {resultat.periode1.periode.libelle}
              </p>
              <p className="text-lg font-bold">
                {formatMontant(resultat.periode1.resultat.montant)}
              </p>
              <p className="text-xs">{resultat.periode1.resultat.type}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                {resultat.periode2.periode.libelle}
              </p>
              <p className="text-lg font-bold">
                {formatMontant(resultat.periode2.resultat.montant)}
              </p>
              <p className="text-xs">{resultat.periode2.resultat.type}</p>
            </div>
            <div
              className={`p-3 border rounded-lg ${
                resultat.evolution.montant >= 0 ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <p className="text-sm text-muted-foreground">Évolution</p>
              <p
                className={`text-lg font-bold ${
                  resultat.evolution.montant >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {resultat.evolution.montant >= 0 ? "+" : ""}
                {formatMontant(resultat.evolution.montant)}
              </p>
              <p
                className={`text-xs ${
                  resultat.evolution.pourcentage >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {resultat.evolution.pourcentage >= 0 ? "+" : ""}
                {resultat.evolution.pourcentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
