import React, { useState, useEffect, useRef } from "react";
import { searchComptesForEcriture } from "../../lib/ecritures.db";

interface CompteSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (compte: { numero: string; libelle: string }) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeCompte?: string; // Pour éviter de sélectionner le même compte
}

export function CompteSearch({
  value,
  onChange,
  onSelect,
  placeholder = "Rechercher un compte...",
  disabled = false,
  excludeCompte,
}: CompteSearchProps) {
  const [suggestions, setSuggestions] = useState<
    Array<{ numero: string; libelle: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchComptes = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchComptesForEcriture(value);
        // Filtrer le compte exclu si nécessaire
        const filtered = excludeCompte
          ? results.filter((c) => c.numero !== excludeCompte)
          : results;
        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Erreur recherche:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchComptes, 300);
    return () => clearTimeout(timeoutId);
  }, [value, excludeCompte]);

  const handleSelect = (compte: { numero: string; libelle: string }) => {
    onSelect(compte);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() =>
          value.length >= 2 &&
          setSuggestions.length > 0 &&
          setShowSuggestions(true)
        }
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {isLoading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 border rounded-md bg-background shadow-lg max-h-60 overflow-auto">
          {suggestions.map((compte) => (
            <button
              key={compte.numero}
              onClick={() => handleSelect(compte)}
              className="w-full text-left px-3 py-2 hover:bg-accent focus:bg-accent"
            >
              <span className="font-mono text-sm">{compte.numero}</span>
              <span className="ml-2 text-sm">{compte.libelle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
