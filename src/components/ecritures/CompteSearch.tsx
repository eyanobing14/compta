import React, { useState, useEffect, useRef } from "react";
import { searchComptesForEcriture } from "../../lib/ecritures.db";

interface CompteSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (compte: { numero: string; libelle: string }) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeCompte?: string;
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
      <div className="relative">
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
          className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin h-4 w-4 text-gray-500"
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
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 border border-gray-200 bg-white shadow-lg max-h-64 overflow-auto">
          {suggestions.map((compte, index) => (
            <button
              key={compte.numero}
              onClick={() => handleSelect(compte)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-0 group"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-gray-900">
                  {compte.numero}
                </span>
                <span className="text-sm text-gray-600 group-hover:text-gray-900">
                  {compte.libelle}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
