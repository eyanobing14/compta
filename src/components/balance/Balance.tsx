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

      // Vérifier l'équilibre
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
      new Intl.NumberFormat("fr-BI", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(montant) + " FBU"
    );
  };

  const getTypeCompteLabel = (type: string | null) => {
    if (!type) return "-";
    const labels: Record<string, string> = {
      ACTIF: "🏦 Actif",
      PASSIF: "📋 Passif",
      PRODUIT: "💰 Produit",
      CHARGE: "💸 Charge",
      TRESORERIE: "💵 Trésorerie",
    };
    return labels[type] || type;
  };

  const getTypeCompteColor = (type: string | null) => {
    if (!type) return "";
    const colors: Record<string, string> = {
      ACTIF: "bg-blue-100 text-blue-800",
      PASSIF: "bg-purple-100 text-purple-800",
      PRODUIT: "bg-green-100 text-green-800",
      CHARGE: "bg-orange-100 text-orange-800",
      TRESORERIE: "bg-cyan-100 text-cyan-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // Filtrer les lignes par type si nécessaire
  const lignesFiltrees =
    typeFilter === "TOUS"
      ? lignes
      : lignes.filter((l) => l.type_compte === typeFilter);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Balance comptable</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Récapitulatif des soldes de tous les comptes
        </p>
      </div>

      {/* Message d'équilibre */}
      {equilibre && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            equilibre.est_equilibree
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {equilibre.est_equilibree ? "✅" : "⚠️"}
            </span>
            <div>
              <p className="font-medium">
                {equilibre.est_equilibree
                  ? "Balance équilibrée"
                  : "Balance non équilibrée"}
              </p>
              <p className="text-sm">
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
        className="mb-6 p-4 border rounded-lg bg-card"
      >
        <h3 className="font-medium mb-3">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-xs mb-1">Type de compte</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
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
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Appliquer
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </form>

      {/* Tableau de la balance */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-accent/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">N°</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Libellé
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Total Débit
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Total Crédit
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Solde Débiteur
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Solde Créditeur
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lignesFiltrees.map((ligne) => (
              <tr key={ligne.compte_numero} className="hover:bg-accent/30">
                <td className="px-4 py-3 font-mono text-sm">
                  {ligne.compte_numero}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{ligne.compte_libelle}</div>
                </td>
                <td className="px-4 py-3">
                  {ligne.type_compte && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getTypeCompteColor(ligne.type_compte)}`}
                    >
                      {getTypeCompteLabel(ligne.type_compte)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-blue-600">
                  {ligne.total_debit > 0
                    ? formatMontant(ligne.total_debit)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-orange-600">
                  {ligne.total_credit > 0
                    ? formatMontant(ligne.total_credit)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-blue-600">
                  {ligne.solde_debiteur > 0
                    ? formatMontant(ligne.solde_debiteur)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-orange-600">
                  {ligne.solde_crediteur > 0
                    ? formatMontant(ligne.solde_crediteur)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-accent/30 font-medium">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right">
                TOTAUX
              </td>
              <td className="px-4 py-3 text-right font-mono text-blue-600">
                {formatMontant(totaux.total_debit)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-orange-600">
                {formatMontant(totaux.total_credit)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-blue-600">
                {formatMontant(totaux.total_solde_debiteur)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-orange-600">
                {formatMontant(totaux.total_solde_crediteur)}
              </td>
            </tr>
          </tfoot>
        </table>

        {lignesFiltrees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Aucune donnée pour la période sélectionnée
            </p>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="mt-4 text-xs text-muted-foreground">
        <p>✅ Balance équilibrée : Total débits = Total crédits</p>
        <p>⚠️ Balance non équilibrée : Il y a un écart à corriger</p>
      </div>
    </div>
  );
}
