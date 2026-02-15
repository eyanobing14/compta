import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface CreateFirstUserScreenProps {
  onSuccess: () => void;
}

export function CreateFirstUserScreen({
  onSuccess,
}: CreateFirstUserScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { createFirstUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validations
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      const success = await createFirstUser(username, password);
      if (success) {
        onSuccess();
      } else {
        setError("Erreur lors de la création du compte");
      }
    } catch (err) {
      setError("Erreur de création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-light tracking-tighter mb-2">
            MINICOMPTA
          </h1>
          <p className="text-gray-500 text-sm uppercase tracking-wider">
            Créez votre compte administrateur
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-xs uppercase tracking-wider text-gray-600 mb-2"
            >
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 bg-white focus:border-black focus:ring-0 transition-colors"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wider text-gray-600 mb-2"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 bg-white focus:border-black focus:ring-0 transition-colors"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-2">Minimum 6 caractères</p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs uppercase tracking-wider text-gray-600 mb-2"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 bg-white focus:border-black focus:ring-0 transition-colors"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-gray-100 border border-gray-300 text-gray-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase text-sm tracking-wider"
          >
            {isLoading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400 uppercase tracking-wider">
          Ce compte aura les droits d'administration
        </div>
      </div>
    </div>
  );
}
