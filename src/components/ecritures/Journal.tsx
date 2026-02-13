import React, { useState, useEffect } from "react";
import { Ecriture, EcritureFilters } from "../../types/ecritures";
import {
  getEcritures,
  deleteEcriture,
  getJournalSummary,
} from "../../lib/ecritures.db";
import { EcritureForm } from "./EcritureForm";
import { createEcriture } from "../../lib/ecritures.db";

export function Journal() {
  const [ecritures, setEcritures] = useState<Ecriture[]>([]);
  const [summary, setSummary] = useState({
    total_ecritures: 0,
    total_debit: 0,
    ecritures_aujourdhui: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<EcritureFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  const loadEcritures = async () => {
    setIsLoading(true);
    try {
      const data = await getEcritures(filters);
      setEcritures(data);

      const summaryData = await getJournalSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error("Erreur chargement écritures:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEcritures();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, searchTerm }));
  };

  const handleDelete = async (id: number, libelle: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'écriture "${libelle}" ?`))
      return;

    try {
      await deleteEcriture(id);
      await loadEcritures();
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleCreateEcriture = async (data: any) => {
    await createEcriture(data);
    setShowForm(false);
    await loadEcritures();
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-BI", {
      style: "currency",
      currency: "FBU",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(montant)
      .replace("FBU", "FBU");
  };

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Journal des écritures</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {summary.total_ecritures} écritures au total ·{" "}
            {summary.ecritures_aujourdhui} aujourd'hui
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <span>➕</span>
          Nouvelle écriture
        </button>
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Nouvelle écriture</h3>
            <EcritureForm
              onSubmit={handleCreateEcriture}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher dans le journal..."
            className="flex-1 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-accent rounded-md hover:bg-accent/80"
          >
            🔍 Rechercher
          </button>
        </form>

        <div className="flex gap-2">
          <select
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                compte: e.target.value || undefined,
              }))
            }
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="">Tous les comptes</option>
            {/* Les options seront chargées dynamiquement plus tard */}
          </select>
          <input
            type="date"
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dateDebut: e.target.value || undefined,
              }))
            }
            className="px-3 py-2 border rounded-md bg-background"
            placeholder="Date début"
          />
          <input
            type="date"
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dateFin: e.target.value || undefined,
              }))
            }
            className="px-3 py-2 border rounded-md bg-background"
            placeholder="Date fin"
          />
        </div>
      </div>

      {/* Tableau des écritures */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-accent/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Libellé
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Débit
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Crédit
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Montant
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ecritures.map((ecriture) => (
                <tr key={ecriture.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3 text-sm">
                    {new Date(ecriture.date).toLocaleDateString("fr-BI")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{ecriture.libelle}</div>
                    {ecriture.observation && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {ecriture.observation}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">
                      {ecriture.compte_debit}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {ecriture.debit_libelle}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">
                      {ecriture.compte_credit}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {ecriture.credit_libelle}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatMontant(ecriture.montant)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        handleDelete(ecriture.id, ecriture.libelle)
                      }
                      className="p-1 hover:bg-accent rounded-md text-destructive"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {ecritures.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Aucune écriture trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
