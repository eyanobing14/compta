import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Met à jour l'état pour afficher l'interface de secours
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erreur attrapée par ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Afficher l'interface de secours personnalisée ou un message par défaut
      return (
        this.props.fallback || (
          <div className="p-8 max-w-2xl mx-auto">
            <div className="border border-red-300 bg-red-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-red-800 mb-4">
                ⚠️ Une erreur est survenue
              </h2>
              <p className="text-red-700 mb-4">
                {this.state.error?.message || "Erreur inconnue"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Recharger la page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
