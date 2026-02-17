import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface LoginScreenProps {
  onSuccess: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await login(username, password);
      if (success) {
        onSuccess();
      } else {
        setError("Nom d'utilisateur ou mot de passe incorrect");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-light tracking-tighter mb-2">
            MiniCompta
          </h1>
          <p className="text-gray-500 text-sm uppercase tracking-wider">
            Connectez-vous à votre comptabilité
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
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400 uppercase tracking-wider">
          Version 1.0.0 — Burundi 🇧🇮
        </div>
      </div>
    </div>
  );
}
