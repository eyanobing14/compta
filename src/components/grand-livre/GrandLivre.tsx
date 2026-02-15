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
      new Intl.NumberFormat("fr-BI", { minimumFractionDigits: 0 }).format(
        montant,
      ) + " FBU"
    );
  };

  const getTypeCompteLabel = (type: string) => {
    const labels: Record<string, string> = {
      ACTIF: "Actif",
      PASSIF: "Passif",
      PRODUIT: "Produit",
      CHARGE: "Charge",
      TRESORERIE: "Trésorerie",
    };
    return labels[type] || type;
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
        <h1 className="text-2xl font-bold text-gray-900">Grand Livre</h1>
        <p className="text-sm text-gray-500 mt-1">
          Historique des mouvements par compte avec solde progressif
        </p>
      </div>

      {/* Filtres */}
      <form
        onSubmit={handleApplyFilters}
        className="mb-6 p-6 bg-gray-50 border border-gray-200"
      >
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-4">
          Filtres
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Compte début
            </label>
            <input
              type="text"
              value={compteDebut}
              onChange={(e) => setCompteDebut(e.target.value)}
              placeholder="Ex: 401"
              className="w-full h-9 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Compte fin
            </label>
            <input
              type="text"
              value={compteFin}
              onChange={(e) => setCompteFin(e.target.value)}
              placeholder="Ex: 409"
              className="w-full h-9 px-3 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>
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
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
          >
            Appliquer
          </button>
        </div>
      </form>

      {/* Liste des comptes */}
      <div className="space-y-4">
        {data.map((compte) => (
          <div
            key={compte.compte_numero}
            className="border border-gray-200 overflow-hidden"
          >
            {/* En-tête du compte */}
            <div
              onClick={() => toggleCompte(compte.compte_numero)}
              className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedCompte === compte.compte_numero ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <div>
                  <span className="font-mono font-bold text-lg text-gray-900">
                    {compte.compte_numero}
                  </span>
                  <span className="ml-3 text-gray-700">
                    {compte.compte_libelle}
                  </span>
                  <span className="ml-3 text-xs px-2 py-1 bg-gray-200 text-gray-700">
                    {getTypeCompteLabel(compte.type_compte)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Total débit: </span>
                  <span className="font-mono text-blue-600">
                    {formatMontant(compte.total_debit)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Total crédit: </span>
                  <span className="font-mono text-red-600">
                    {formatMontant(compte.total_credit)}
                  </span>
                </div>
                <div
                  className={`font-bold ${compte.sens_final === "Débiteur" ? "text-blue-600" : "text-red-600"}`}
                >
                  Solde: {formatMontant(compte.solde_final)}
                </div>
              </div>
            </div>

            {/* Détail du compte */}
            {expandedCompte === compte.compte_numero && (
              <div className="p-4 border-t border-gray-200">
                {compte.lignes.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Aucun mouvement pour ce compte
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          N°
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Libellé
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Pièce
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Débit
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Crédit
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Solde
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {compte.lignes.map((ligne, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-gray-900">
                            {ligne.id}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {new Date(ligne.date).toLocaleDateString("fr-BI")}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {ligne.libelle}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-500">
                            {ligne.numero_piece || "-"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-blue-600">
                            {ligne.debit ? formatMontant(ligne.debit) : "-"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-red-600">
                            {ligne.credit ? formatMontant(ligne.credit) : "-"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-medium text-gray-900">
                            {formatMontant(ligne.solde)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-medium">
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-2 text-right text-gray-700"
                        >
                          Totaux
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-blue-600">
                          {formatMontant(compte.total_debit)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-red-600">
                          {formatMontant(compte.total_credit)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-gray-900">
                          {formatMontant(compte.solde_final)}
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
          <div className="text-center py-12 border border-gray-200 bg-gray-50">
            <p className="text-gray-500">Aucun compte trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
