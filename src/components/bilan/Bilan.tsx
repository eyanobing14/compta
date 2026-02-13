import React, { useState, useEffect } from "react";
import { BilanData, BilanFilters } from "../../types/bilan";
import { getBilanComparatif } from "../../lib/bilan.db";

export function Bilan() {
  const [data, setData] = useState<BilanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateInitiale, setDateInitiale] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1); // Mois dernier
    return date.toISOString().split("T")[0];
  });
  const [dateFinale, setDateFinale] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const loadBilan = async () => {
    setIsLoading(true);
    try {
      const filters: BilanFilters = {
        dateInitiale,
        dateFinale,
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
  }, [dateInitiale, dateFinale]);

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-BI", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(montant) + " FBU"
    );
  };

  const formatVariation = (variation: number, pourcentage: number) => {
    const signe = variation >= 0 ? "+" : "";
    const couleur = variation >= 0 ? "text-green-600" : "text-red-600";
    return (
      <span className={couleur}>
        {signe}
        {formatMontant(variation)}
        <span className="text-xs ml-1">
          ({signe}
          {pourcentage.toFixed(1)}%)
        </span>
      </span>
    );
  };

  const getVariationClass = (variation: number) => {
    if (variation > 0) return "text-green-600";
    if (variation < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Bilan comparatif</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Analyse de l'évolution de la situation patrimoniale
        </p>
      </div>

      {/* Sélecteur de dates */}
      <div className="mb-6 p-4 border rounded-lg bg-card">
        <h3 className="font-medium mb-3">Période de comparaison</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1">Bilan initial</label>
            <input
              type="date"
              value={dateInitiale}
              onChange={(e) => setDateInitiale(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Bilan final</label>
            <input
              type="date"
              value={dateFinale}
              onChange={(e) => setDateFinale(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            />
          </div>
        </div>
      </div>

      {/* Totaux principaux */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Total Actif</p>
          <p className="text-2xl font-bold">
            {formatMontant(data.total_actif.final)}
          </p>
          <p
            className={`text-sm ${getVariationClass(data.total_actif.variation)}`}
          >
            {formatVariation(
              data.total_actif.variation,
              (data.total_actif.variation / (data.total_actif.initial || 1)) *
                100,
            )}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Total Passif</p>
          <p className="text-2xl font-bold">
            {formatMontant(data.total_passif.final)}
          </p>
          <p
            className={`text-sm ${getVariationClass(data.total_passif.variation)}`}
          >
            {formatVariation(
              data.total_passif.variation,
              (data.total_passif.variation / (data.total_passif.initial || 1)) *
                100,
            )}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Équilibre</p>
          <p
            className={`text-2xl font-bold ${
              Math.abs(data.total_actif.final - data.total_passif.final) < 1
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {Math.abs(data.total_actif.final - data.total_passif.final) < 1
              ? "✓ Équilibré"
              : "⚠️ Déséquilibré"}
          </p>
          <p className="text-xs text-muted-foreground">
            Actif - Passif ={" "}
            {formatMontant(data.total_actif.final - data.total_passif.final)}
          </p>
        </div>
      </div>

      {/* Tableau comparatif */}
      <div className="space-y-6">
        {/* ACTIF */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-3 font-medium flex justify-between">
            <span>{data.actif.titre}</span>
            <span className="text-sm">
              Initial: {formatMontant(data.actif.total_initial)} | Final:{" "}
              {formatMontant(data.actif.total_final)}
            </span>
          </div>
          <table className="w-full">
            <thead className="bg-accent/50">
              <tr>
                <th className="px-4 py-2 text-left text-sm">Compte</th>
                <th className="px-4 py-2 text-left text-sm">Libellé</th>
                <th className="px-4 py-2 text-right text-sm">Initial</th>
                <th className="px-4 py-2 text-right text-sm">Final</th>
                <th className="px-4 py-2 text-right text-sm">Variation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.actif.lignes.map((ligne) => (
                <tr key={ligne.compte_numero} className="hover:bg-accent/30">
                  <td className="px-4 py-2 font-mono text-sm">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-4 py-2 text-sm">{ligne.compte_libelle}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm">
                    {ligne.montant_initial > 0
                      ? formatMontant(ligne.montant_initial)
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium">
                    {ligne.montant_final > 0
                      ? formatMontant(ligne.montant_final)
                      : "-"}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-mono text-sm ${getVariationClass(ligne.variation)}`}
                  >
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
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-purple-600 text-white p-3 font-medium flex justify-between">
            <span>{data.passif.titre}</span>
            <span className="text-sm">
              Initial: {formatMontant(data.passif.total_initial)} | Final:{" "}
              {formatMontant(data.passif.total_final)}
            </span>
          </div>
          <table className="w-full">
            <thead className="bg-accent/50">
              <tr>
                <th className="px-4 py-2 text-left text-sm">Compte</th>
                <th className="px-4 py-2 text-left text-sm">Libellé</th>
                <th className="px-4 py-2 text-right text-sm">Initial</th>
                <th className="px-4 py-2 text-right text-sm">Final</th>
                <th className="px-4 py-2 text-right text-sm">Variation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.passif.lignes.map((ligne) => (
                <tr key={ligne.compte_numero} className="hover:bg-accent/30">
                  <td className="px-4 py-2 font-mono text-sm">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-4 py-2 text-sm">{ligne.compte_libelle}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm">
                    {ligne.montant_initial > 0
                      ? formatMontant(ligne.montant_initial)
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium">
                    {ligne.montant_final > 0
                      ? formatMontant(ligne.montant_final)
                      : "-"}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-mono text-sm ${getVariationClass(ligne.variation)}`}
                  >
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
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-green-600 text-white p-3 font-medium flex justify-between">
            <span>{data.capitaux_propres.titre}</span>
            <span className="text-sm">
              Initial: {formatMontant(data.capitaux_propres.total_initial)} |
              Final: {formatMontant(data.capitaux_propres.total_final)}
            </span>
          </div>
          <table className="w-full">
            <thead className="bg-accent/50">
              <tr>
                <th className="px-4 py-2 text-left text-sm">Compte</th>
                <th className="px-4 py-2 text-left text-sm">Libellé</th>
                <th className="px-4 py-2 text-right text-sm">Initial</th>
                <th className="px-4 py-2 text-right text-sm">Final</th>
                <th className="px-4 py-2 text-right text-sm">Variation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.capitaux_propres.lignes.map((ligne, index) => (
                <tr key={index} className="hover:bg-accent/30">
                  <td className="px-4 py-2 font-mono text-sm">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-4 py-2 text-sm">{ligne.compte_libelle}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm">
                    {ligne.montant_initial > 0
                      ? formatMontant(ligne.montant_initial)
                      : ligne.montant_initial < 0
                        ? `(${formatMontant(-ligne.montant_initial)})`
                        : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium">
                    {ligne.montant_final > 0
                      ? formatMontant(ligne.montant_final)
                      : ligne.montant_final < 0
                        ? `(${formatMontant(-ligne.montant_final)})`
                        : "-"}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-mono text-sm ${getVariationClass(ligne.variation)}`}
                  >
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
      <div className="mt-6 p-4 border rounded-lg">
        <h3 className="font-medium mb-3">Évolution du bilan</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Actif</span>
              <span className="font-mono">
                {formatMontant(data.total_actif.final)}
              </span>
            </div>
            <div className="w-full bg-accent rounded-full h-4 relative">
              <div
                className="bg-blue-500 h-4 rounded-full absolute top-0 left-0"
                style={{
                  width: `${(data.total_actif.final / Math.max(data.total_actif.final, data.total_passif.final)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Passif + Capitaux</span>
              <span className="font-mono">
                {formatMontant(data.total_passif.final)}
              </span>
            </div>
            <div className="w-full bg-accent rounded-full h-4 relative">
              <div
                className="bg-purple-500 h-4 rounded-full absolute top-0 left-0"
                style={{
                  width: `${(data.total_passif.final / Math.max(data.total_actif.final, data.total_passif.final)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes explicatives */}
      <div className="mt-4 text-xs text-muted-foreground space-y-1">
        <p>
          📅 Bilan initial au{" "}
          {new Date(data.dates.initial).toLocaleDateString("fr-BI")}
        </p>
        <p>
          📅 Bilan final au{" "}
          {new Date(data.dates.final).toLocaleDateString("fr-BI")}
        </p>
        <p>✅ Un bilan est équilibré quand Actif = Passif + Capitaux propres</p>
        <p>📈 Les variations positives en vert, négatives en rouge</p>
      </div>
    </div>
  );
}
