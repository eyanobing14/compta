import React, { useState, useEffect } from "react";
import {
  Compte,
  TypeCompte,
  TYPE_COMPTE_LABELS,
  TYPE_COMPTE_COLORS,
} from "../../types/comptes";
import { getComptes, deleteCompte } from "../../lib/comptes.db";
import { CompteForm } from "./CompteForm";

export function ComptesList() {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [filterType, setFilterType] = useState<TypeCompte | "TOUS">("TOUS");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCompte, setEditingCompte] = useState<Compte | null>(null);

  const loadComptes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getComptes(
        filterType === "TOUS" ? null : filterType,
        true,
      );
      setComptes(data);
    } catch (err) {
      setError("Erreur lors du chargement des comptes");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComptes();
  }, [filterType]);

  const handleDelete = async (numero: string, libelle: string) => {
    if (
      !confirm(
        `Voulez-vous vraiment supprimer le compte ${numero} - ${libelle} ?`,
      )
    ) {
      return;
    }

    try {
      await deleteCompte(numero);
      await loadComptes();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Erreur lors de la suppression",
      );
    }
  };

  const handleEdit = (compte: Compte) => {
    setEditingCompte(compte);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCompte(null);
    loadComptes();
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
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Plan comptable</h2>
        <button
          onClick={() => {
            setEditingCompte(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <span>➕</span>
          Nouveau compte
        </button>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType("TOUS")}
          className={`px-3 py-1 rounded-full text-sm ${
            filterType === "TOUS"
              ? "bg-primary text-primary-foreground"
              : "bg-accent hover:bg-accent/80"
          }`}
        >
          Tous
        </button>
        {Object.entries(TYPE_COMPTE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setFilterType(type as TypeCompte)}
            className={`px-3 py-1 rounded-full text-sm ${
              filterType === type
                ? "bg-primary text-primary-foreground"
                : "bg-accent hover:bg-accent/80"
            }`}
          >
            {label.split(" ")[0]} {label.split(" ")[1]}
          </button>
        ))}
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingCompte ? "Modifier le compte" : "Nouveau compte"}
            </h3>
            <CompteForm
              compte={editingCompte || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingCompte(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Tableau des comptes */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg">
          ❌ {error}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-accent/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Numéro
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Libellé
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {comptes.map((compte) => (
              <tr key={compte.numero} className="hover:bg-accent/30">
                <td className="px-4 py-3 font-mono text-sm">{compte.numero}</td>
                <td className="px-4 py-3">{compte.libelle}</td>
                <td className="px-4 py-3">
                  {compte.type_compte && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${TYPE_COMPTE_COLORS[compte.type_compte]}`}
                    >
                      {TYPE_COMPTE_LABELS[compte.type_compte]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(compte)}
                    className="p-1 hover:bg-accent rounded-md mr-2"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(compte.numero, compte.libelle)}
                    className="p-1 hover:bg-accent rounded-md text-destructive"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {comptes.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aucun compte trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
