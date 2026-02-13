import React, { useState, useEffect } from "react";
import { GrandLivreCompte, GrandLivreFilters } from "../../types/grand-livre";
import { getGrandLivre } from "../../lib/grand-livre.db";

export function GrandLivre() {
  const [data, setData] = useState<GrandLivreCompte[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCompte, setExpandedCompte] = useState<string | null>(null);
  const [filters, setFilters] = useState<GrandLivreFilters>({});
  const [compteDebut, setCompteDebut] = useState("");
  const [compteFin, setCompteFin] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const loadGrandLivre = async () => {
    setIsLoading(true);
    try {
      const result = await getGrandLivre(filters);
      setData(result);
    } catch (error) {
      console.error("Erreur chargement Grand Livre:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGrandLivre();
  }, [filters]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({
      compte_debut: compteDebut || undefined,
      compte_fin: compteFin || undefined,
      date_debut: dateDebut || undefined,
      date_fin: dateFin || undefined,
    });
  };

  const handleResetFilters = () => {
    setCompteDebut("");
    setCompteFin("");
    setDateDebut("");
    setDateFin("");
    setFilters({});
  };

  const toggleCompte = (compteNumero: string) => {
    setExpandedCompte(expandedCompte === compteNumero ? null : compteNumero);
  };

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-BI", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(montant) + " FBU"
    );
  };

  const getSensColor = (sens: string) => {
    return sens === "Débiteur" ? "text-blue-600" : "text-orange-600";
  };

  const getTypeCompteLabel = (type: string) => {
    const labels: Record<string, string> = {
      ACTIF: "🏦 Actif",
      PASSIF: "📋 Passif",
      PRODUIT: "💰 Produit",
      CHARGE: "💸 Charge",
      TRESORERIE: "💵 Trésorerie",
    };
    return labels[type] || type;
  };

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
        <h2 className="text-2xl font-semibold">Grand Livre</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Historique des mouvements par compte avec solde progressif
        </p>
      </div>

      {/* Filtres */}
      <form
        onSubmit={handleApplyFilters}
        className="mb-6 p-4 border rounded-lg bg-card"
      >
        <h3 className="font-medium mb-3">Filtres</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs mb-1">Compte début</label>
            <input
              type="text"
              value={compteDebut}
              onChange={(e) => setCompteDebut(e.target.value)}
              placeholder="Ex: 401"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Compte fin</label>
            <input
              type="text"
              value={compteFin}
              onChange={(e) => setCompteFin(e.target.value)}
              placeholder="Ex: 409"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            />
          </div>
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
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Appliquer les filtres
          </button>
        </div>
      </form>

      {/* Liste des comptes */}
      <div className="space-y-4">
        {data.map((compte) => (
          <div
            key={compte.compte_numero}
            className="border rounded-lg overflow-hidden"
          >
            {/* En-tête du compte */}
            <div
              onClick={() => toggleCompte(compte.compte_numero)}
              className="p-4 bg-accent/30 hover:bg-accent/50 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="text-lg">
                  {expandedCompte === compte.compte_numero ? "▼" : "▶"}
                </span>
                <div>
                  <span className="font-mono font-bold text-lg">
                    {compte.compte_numero}
                  </span>
                  <span className="ml-3 font-medium">
                    {compte.compte_libelle}
                  </span>
                  <span className="ml-3 text-xs px-2 py-1 bg-primary/10 rounded-full">
                    {getTypeCompteLabel(compte.type_compte)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Total débit: </span>
                  <span className="font-mono text-blue-600">
                    {formatMontant(compte.total_debit)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total crédit: </span>
                  <span className="font-mono text-orange-600">
                    {formatMontant(compte.total_credit)}
                  </span>
                </div>
                <div className={`font-bold ${getSensColor(compte.sens_final)}`}>
                  Solde: {formatMontant(compte.solde_final)} (
                  {compte.sens_final})
                </div>
              </div>
            </div>

            {/* Détail du compte (expandable) */}
            {expandedCompte === compte.compte_numero && (
              <div className="p-4">
                {compte.lignes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Aucun mouvement pour ce compte
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left">N°</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Libellé</th>
                        <th className="px-3 py-2 text-left">Pièce</th>
                        <th className="px-3 py-2 text-right">Débit</th>
                        <th className="px-3 py-2 text-right">Crédit</th>
                        <th className="px-3 py-2 text-right">Solde</th>
                        <th className="px-3 py-2 text-center">Sens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compte.lignes.map((ligne, index) => (
                        <tr key={index} className="border-b hover:bg-accent/30">
                          <td className="px-3 py-2 font-mono">{ligne.id}</td>
                          <td className="px-3 py-2">
                            {new Date(ligne.date).toLocaleDateString("fr-BI")}
                          </td>
                          <td className="px-3 py-2">{ligne.libelle}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {ligne.numero_piece || "-"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-blue-600">
                            {ligne.debit ? formatMontant(ligne.debit) : "-"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-orange-600">
                            {ligne.credit ? formatMontant(ligne.credit) : "-"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-medium">
                            {formatMontant(ligne.solde)}
                          </td>
                          <td
                            className={`px-3 py-2 text-center font-medium ${getSensColor(ligne.sens)}`}
                          >
                            {ligne.sens}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-accent/20 font-medium">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right">
                          Totaux
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-blue-600">
                          {formatMontant(compte.total_debit)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-orange-600">
                          {formatMontant(compte.total_credit)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatMontant(compte.solde_final)}
                        </td>
                        <td
                          className={`px-3 py-2 text-center ${getSensColor(compte.sens_final)}`}
                        >
                          {compte.sens_final}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-12 border rounded-lg bg-card">
            <p className="text-muted-foreground">Aucun compte trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
