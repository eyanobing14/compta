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
        <h2 className="text-2xl font-semibold">Compte de résultat</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {data.periode.libelle}
        </p>
      </div>

      {/* Sélecteur de période */}
      <div className="mb-6 p-4 border rounded-lg bg-card">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => handlePeriodeChange("mois")}
            className={`px-4 py-2 rounded-md ${
              periodeType === "mois"
                ? "bg-primary text-primary-foreground"
                : "bg-accent hover:bg-accent/80"
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => handlePeriodeChange("trimestre")}
            className={`px-4 py-2 rounded-md ${
              periodeType === "trimestre"
                ? "bg-primary text-primary-foreground"
                : "bg-accent hover:bg-accent/80"
            }`}
          >
            Trimestre
          </button>
          <button
            onClick={() => handlePeriodeChange("annee")}
            className={`px-4 py-2 rounded-md ${
              periodeType === "annee"
                ? "bg-primary text-primary-foreground"
                : "bg-accent hover:bg-accent/80"
            }`}
          >
            Année
          </button>
          <button
            onClick={() => handlePeriodeChange("personnalisee")}
            className={`px-4 py-2 rounded-md ${
              periodeType === "personnalisee"
                ? "bg-primary text-primary-foreground"
                : "bg-accent hover:bg-accent/80"
            }`}
          >
            Personnalisé
          </button>
        </div>

        {/* Contrôles spécifiques */}
        <div className="grid grid-cols-4 gap-4">
          {periodeType === "mois" && (
            <>
              <div>
                <label className="block text-xs mb-1">Année</label>
                <input
                  type="number"
                  value={annee}
                  onChange={(e) => setAnnee(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Mois</label>
                <select
                  value={mois}
                  onChange={(e) => setMois(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1, 1).toLocaleDateString("fr-BI", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {periodeType === "trimestre" && (
            <>
              <div>
                <label className="block text-xs mb-1">Année</label>
                <input
                  type="number"
                  value={annee}
                  onChange={(e) => setAnnee(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Trimestre</label>
                <select
                  value={trimestre}
                  onChange={(e) => setTrimestre(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value={1}>1er trimestre</option>
                  <option value={2}>2e trimestre</option>
                  <option value={3}>3e trimestre</option>
                  <option value={4}>4e trimestre</option>
                </select>
              </div>
            </>
          )}

          {periodeType === "annee" && (
            <div>
              <label className="block text-xs mb-1">Année</label>
              <input
                type="number"
                value={annee}
                onChange={(e) => setAnnee(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              />
            </div>
          )}

          {periodeType === "personnalisee" && (
            <>
              <div>
                <label className="block text-xs mb-1">Date début</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Date fin</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Résultat principal */}
      <div
        className={`mb-6 p-4 rounded-lg ${
          data.resultat.type === "BENEFICE"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {data.resultat.type === "BENEFICE" ? "BÉNÉFICE" : "PERTE"}
            </p>
            <p className="text-2xl font-bold">
              {formatMontant(data.resultat.montant)}
            </p>
          </div>
          {data.resultat.taux_marge !== undefined &&
            data.resultat.type === "BENEFICE" && (
              <div className="text-right">
                <p className="text-sm">Taux de marge</p>
                <p className="text-xl font-semibold">
                  {data.resultat.taux_marge.toFixed(1)}%
                </p>
              </div>
            )}
        </div>
      </div>

      {/* Tableau comparatif */}
      <div className="grid grid-cols-2 gap-6">
        {/* Produits */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-green-600 text-white p-3 font-medium">
            {data.produits.titre}
          </div>
          <table className="w-full">
            <tbody className="divide-y">
              {data.produits.lignes.map((ligne) => (
                <tr key={ligne.compte_numero} className="hover:bg-accent/30">
                  <td className="px-4 py-2 font-mono text-sm w-20">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-4 py-2 text-sm">{ligne.compte_libelle}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium text-green-600">
                    {ligne.montant > 0 ? formatMontant(ligne.montant) : "-"}
                  </td>
                </tr>
              ))}
              <tr className="bg-green-50 font-medium">
                <td colSpan={2} className="px-4 py-3 text-right">
                  TOTAL PRODUITS
                </td>
                <td className="px-4 py-3 text-right font-mono text-green-700">
                  {formatMontant(data.produits.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Charges */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-orange-600 text-white p-3 font-medium">
            {data.charges.titre}
          </div>
          <table className="w-full">
            <tbody className="divide-y">
              {data.charges.lignes.map((ligne) => (
                <tr key={ligne.compte_numero} className="hover:bg-accent/30">
                  <td className="px-4 py-2 font-mono text-sm w-20">
                    {ligne.compte_numero}
                  </td>
                  <td className="px-4 py-2 text-sm">{ligne.compte_libelle}</td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium text-orange-600">
                    {ligne.montant > 0 ? formatMontant(ligne.montant) : "-"}
                  </td>
                </tr>
              ))}
              <tr className="bg-orange-50 font-medium">
                <td colSpan={2} className="px-4 py-3 text-right">
                  TOTAL CHARGES
                </td>
                <td className="px-4 py-3 text-right font-mono text-orange-700">
                  {formatMontant(data.charges.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Graphique simplifié (pour visualisation) */}
      {data.produits.total > 0 && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Répartition des charges</h3>
          <div className="space-y-2">
            {data.charges.lignes
              .filter((l) => l.montant > 0)
              .map((ligne) => {
                const pourcentage = (ligne.montant / data.charges.total) * 100;
                return (
                  <div key={ligne.compte_numero}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{ligne.compte_libelle}</span>
                      <span className="font-mono">
                        {pourcentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-accent rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${pourcentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="mt-4 text-xs text-muted-foreground">
        <p>✅ Bénéfice : Produits &gt; Charges</p>
        <p>⚠️ Perte : Charges &gt; Produits</p>
      </div>
    </div>
  );
}
