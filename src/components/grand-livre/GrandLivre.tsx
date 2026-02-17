import React, { useState, useEffect, useRef } from "react";
import {
  GrandLivreCompte,
  SortField,
  SortDirection,
} from "../../types/grand-livre";
import { getGrandLivreForCompte } from "../../lib/grand-livre.db";
import { searchComptes } from "../../lib/comptes.db";
import { Exercice } from "../../types/exercice";
import { Spinner } from "../exercices/Spinner";

interface GrandLivreProps {
  exerciceOuvert: Exercice | null;
}

export function GrandLivre({ exerciceOuvert }: GrandLivreProps) {
  const [data, setData] = useState<GrandLivreCompte | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [compteSearch, setCompteSearch] = useState("");
  const [compteSuggestions, setCompteSuggestions] = useState<
    Array<{ numero: string; libelle: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCompte, setSelectedCompte] = useState<{
    numero: string;
    libelle: string;
  } | null>(null);
  const [dateDebut, setDateDebut] = useState(exerciceOuvert?.date_debut || "");
  const [dateFin, setDateFin] = useState(exerciceOuvert?.date_fin || "");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [savedSearches, setSavedSearches] = useState<
    Array<{ compte: string; dateDebut: string; dateFin: string }>
  >([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedLignes, setPaginatedLignes] = useState<any[]>([]);
  const ITEMS_PER_PAGE = 20;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Charger les recherches sauvegardées depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("grandLivreSavedSearches");
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  // Mettre à jour les dates quand l'exercice change
  useEffect(() => {
    if (exerciceOuvert) {
      setDateDebut(exerciceOuvert.date_debut);
      setDateFin(exerciceOuvert.date_fin);
    }
  }, [exerciceOuvert]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche de comptes
  useEffect(() => {
    const searchComptesAsync = async () => {
      if (compteSearch.length < 2) {
        setCompteSuggestions([]);
        return;
      }

      try {
        const results = await searchComptes(compteSearch);
        setCompteSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Erreur recherche comptes:", error);
      }
    };

    const timeoutId = setTimeout(searchComptesAsync, 300);
    return () => clearTimeout(timeoutId);
  }, [compteSearch]);

  // Mettre à jour la pagination quand les données ou le tri changent
  useEffect(() => {
    if (data) {
      const sorted = getSortedLignes();
      setTotalPages(Math.ceil(sorted.length / ITEMS_PER_PAGE));
      setCurrentPage(1); // Reset à la première page quand les données changent
    }
  }, [data, sortField, sortDirection]);

  // Mettre à jour les lignes paginées
  useEffect(() => {
    if (data) {
      const sorted = getSortedLignes();
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      setPaginatedLignes(sorted.slice(start, end));
    }
  }, [data, currentPage, sortField, sortDirection]);

  const loadGrandLivre = async () => {
    if (!selectedCompte) return;

    setIsLoading(true);
    try {
      const result = await getGrandLivreForCompte(
        selectedCompte.numero,
        dateDebut || undefined,
        dateFin || undefined,
      );
      setData(result);
    } catch (error) {
      console.error("Erreur chargement Grand Livre:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompte = (compte: { numero: string; libelle: string }) => {
    setSelectedCompte(compte);
    setCompteSearch(`${compte.numero} - ${compte.libelle}`);
    setShowSuggestions(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadGrandLivre();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const saveCurrentSearch = () => {
    if (!selectedCompte) return;

    const newSearch = {
      compte: selectedCompte.numero,
      dateDebut,
      dateFin,
    };

    const updatedSearches = [
      newSearch,
      ...savedSearches.filter(
        (s) =>
          s.compte !== newSearch.compte ||
          s.dateDebut !== newSearch.dateDebut ||
          s.dateFin !== newSearch.dateFin,
      ),
    ].slice(0, 10);

    setSavedSearches(updatedSearches);
    localStorage.setItem(
      "grandLivreSavedSearches",
      JSON.stringify(updatedSearches),
    );
  };

  const loadSavedSearch = (search: {
    compte: string;
    dateDebut: string;
    dateFin: string;
  }) => {
    const compte = { numero: search.compte, libelle: "" };
    setSelectedCompte(compte);
    setCompteSearch(search.compte);
    setDateDebut(search.dateDebut);
    setDateFin(search.dateFin);
    setShowSavedSearches(false);

    setTimeout(() => loadGrandLivre(), 100);
  };

  const deleteSavedSearch = (index: number) => {
    const updatedSearches = savedSearches.filter((_, i) => i !== index);
    setSavedSearches(updatedSearches);
    localStorage.setItem(
      "grandLivreSavedSearches",
      JSON.stringify(updatedSearches),
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatMontant = (montant: number) => {
    return (
      new Intl.NumberFormat("fr-BI", { minimumFractionDigits: 0 }).format(
        montant,
      ) + " FBU"
    );
  };

  const getSortedLignes = () => {
    if (!data) return [];

    const sorted = [...data.lignes];

    switch (sortField) {
      case "date":
        sorted.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        });
        break;
      case "montant":
        sorted.sort((a, b) => {
          const montantA = a.debit || a.credit || 0;
          const montantB = b.debit || b.credit || 0;
          return sortDirection === "asc"
            ? montantA - montantB
            : montantB - montantA;
        });
        break;
      case "libelle":
        sorted.sort((a, b) => {
          const compare = a.libelle.localeCompare(b.libelle);
          return sortDirection === "asc" ? compare : -compare;
        });
        break;
    }

    return sorted;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const getTypeCompteColor = (type: string) => {
    const colors: Record<string, string> = {
      ACTIF: "bg-blue-100 text-blue-800",
      PASSIF: "bg-green-100 text-green-800",
      PRODUIT: "bg-purple-100 text-purple-800",
      CHARGE: "bg-orange-100 text-orange-800",
      TRESORERIE: "bg-cyan-100 text-cyan-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  if (!exerciceOuvert) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-700">
            Veuillez d'abord créer et ouvrir un exercice pour accéder au Grand
            Livre
          </p>
        </div>
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
        onSubmit={handleSearch}
        className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
            Filtres
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Recherches sauvegardées
            </button>
            {selectedCompte && (
              <button
                type="button"
                onClick={saveCurrentSearch}
                className="px-3 py-1.5 text-xs font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Sauvegarder cette recherche
              </button>
            )}
          </div>
        </div>

        {/* Recherches sauvegardées */}
        {showSavedSearches && savedSearches.length > 0 && (
          <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Recherches récentes
            </h4>
            <div className="space-y-2">
              {savedSearches.map((search, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between group"
                >
                  <button
                    type="button"
                    onClick={() => loadSavedSearch(search)}
                    className="flex-1 text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="font-mono font-medium text-gray-900">
                      {search.compte}
                    </span>
                    <span className="text-gray-500 text-xs ml-2">
                      {new Date(search.dateDebut).toLocaleDateString("fr-BI")} →{" "}
                      {new Date(search.dateFin).toLocaleDateString("fr-BI")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSavedSearch(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
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
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sélection du compte */}
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">
              Compte <span className="text-red-500">*</span>
            </label>
            <input
              ref={searchInputRef}
              type="text"
              value={compteSearch}
              onChange={(e) => {
                setCompteSearch(e.target.value);
                if (selectedCompte) setSelectedCompte(null);
              }}
              onFocus={() =>
                compteSearch.length >= 2 && setShowSuggestions(true)
              }
              placeholder="Rechercher un compte (n° ou libellé)"
              className="w-full h-9 px-3 text-sm border border-gray-300 bg-white rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
              required
            />

            {/* Suggestions */}
            {showSuggestions && compteSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                {compteSuggestions.map((compte) => (
                  <button
                    key={compte.numero}
                    type="button"
                    onClick={() => handleSelectCompte(compte)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                  >
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {compte.numero}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {compte.libelle}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Date début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              min={exerciceOuvert?.date_debut}
              max={exerciceOuvert?.date_fin}
              className="w-full h-9 px-3 text-sm border border-gray-300 bg-white rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              min={exerciceOuvert?.date_debut}
              max={exerciceOuvert?.date_fin}
              className="w-full h-9 px-3 text-sm border border-gray-300 bg-white rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={!selectedCompte}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Appliquer
            </button>
          </div>
        </div>
      </form>

      {/* Résultats */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : data ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* En-tête du compte */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-lg text-gray-900">
                    {data.compte_numero}
                  </span>
                  <span className="text-gray-700">{data.compte_libelle}</span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTypeCompteColor(data.type_compte)}`}
                  >
                    {data.type_compte}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="px-3 py-1.5 bg-blue-50 rounded-lg">
                  <span className="text-blue-600 font-medium">
                    Total débit:{" "}
                  </span>
                  <span className="font-mono text-blue-700">
                    {formatMontant(data.total_debit)}
                  </span>
                </div>
                <div className="px-3 py-1.5 bg-red-50 rounded-lg">
                  <span className="text-red-600 font-medium">
                    Total crédit:{" "}
                  </span>
                  <span className="font-mono text-red-700">
                    {formatMontant(data.total_credit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des mouvements */}
          {data.lignes.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              Aucun mouvement pour ce compte sur la période sélectionnée
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tl-lg">
                        N°
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center gap-1">
                          Date {getSortIcon("date")}
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleSort("libelle")}
                      >
                        <div className="flex items-center gap-1">
                          Libellé {getSortIcon("libelle")}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        N° Pièce
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleSort("montant")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Débit{" "}
                          {sortField === "montant" && getSortIcon("montant")}
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => handleSort("montant")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Crédit{" "}
                          {sortField === "montant" && getSortIcon("montant")}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedLignes.map((ligne, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
                          #{ligne.id}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {new Date(ligne.date).toLocaleDateString("fr-BI")}
                        </td>
                        <td className="px-4 py-3 text-gray-900 max-w-md">
                          <div
                            className="truncate group-hover:text-gray-600"
                            title={ligne.libelle}
                          >
                            {ligne.libelle}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {ligne.numero_piece || "-"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-blue-600 whitespace-nowrap">
                          {ligne.debit ? formatMontant(ligne.debit) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-red-600 whitespace-nowrap">
                          {ligne.credit ? formatMontant(ligne.credit) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-medium">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-lg text-right text-gray-700"
                      >
                        Totaux
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-blue-600 whitespace-nowrap border-t border-gray-200 text-[16px]">
                        {formatMontant(data.total_debit)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-600 whitespace-nowrap border-t border-gray-200 text-[16px]">
                        {formatMontant(data.total_credit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="text-sm text-gray-500">
                    Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, data.lignes.length)}{" "}
                    sur {data.lignes.length} mouvements
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Précédent
                    </button>

                    {getPageNumbers().map((page, index) =>
                      page === "..." ? (
                        <span
                          key={`dots-${index}`}
                          className="px-3 py-1 text-gray-500"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                            currentPage === page
                              ? "bg-gray-900 text-white"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 bg-white text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : selectedCompte ? (
        <div className="text-center py-12 border border-gray-200 bg-gray-50 rounded-xl">
          <p className="text-gray-500">
            Cliquez sur "Appliquer" pour charger les données
          </p>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 bg-gray-50 rounded-xl">
          <p className="text-gray-500">
            Sélectionnez un compte pour afficher son Grand Livre
          </p>
        </div>
      )}
    </div>
  );
}
