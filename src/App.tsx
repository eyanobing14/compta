import React, { useState, useEffect, useRef } from "react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { LoginScreen } from "./components/LoginScreen";
import { CreateFirstUserScreen } from "./components/CreateFirstUserScreen";
import { ComptesList } from "./components/comptes/ComptesList";
import { Journal } from "./components/ecritures/Journal";
import { GrandLivre } from "./components/grand-livre/GrandLivre";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

type AuthState = "checking" | "no-users" | "login" | "authenticated";
type PageType =
  | "journal"
  | "grand-livre"
  | "balance"
  | "comptes"
  | "tableau-bord";

function MainApp() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [currentPage, setCurrentPage] = useState<PageType>("tableau-bord");
  const { user, checkIfHasUsers, logout } = useAuth();

  // Référence pour savoir si la vérification a déjà été faite
  const hasCheckedRef = useRef(false);

  // Surveiller les changements de user
  useEffect(() => {
    console.log("État actuel:", { authState, user: user?.nom_utilisateur });
  }, [authState, user]);

  // Vérification des utilisateurs - UNE SEULE FOIS à l'ouverture du fichier
  useEffect(() => {
    const checkUsers = async () => {
      if (!currentFile || hasCheckedRef.current) return;

      console.log("Première vérification des utilisateurs");
      setAuthState("checking");
      try {
        const hasUsers = await checkIfHasUsers();
        console.log("Résultat vérification:", hasUsers);

        if (hasUsers) {
          setAuthState("login");
        } else {
          setAuthState("no-users");
        }
        hasCheckedRef.current = true;
      } catch (error) {
        console.error("Erreur:", error);
        setAuthState("no-users");
        hasCheckedRef.current = true;
      }
    };

    checkUsers();
  }, [currentFile, checkIfHasUsers]);

  const handleLoginSuccess = () => {
    console.log("Connexion réussie");
    setAuthState("authenticated");
    hasCheckedRef.current = true;
  };

  const handleUserCreated = () => {
    console.log("Compte créé avec succès");
    setAuthState("authenticated");
    hasCheckedRef.current = true;
  };

  const handleLogout = () => {
    console.log("Déconnexion demandée");
    logout();
    setAuthState("login");
    setCurrentPage("tableau-bord");
  };

  // Rendu de la page courante
  const renderPage = () => {
    switch (currentPage) {
      case "comptes":
        return <ComptesList />;
      case "journal":
        return <Journal />;
      case "grand-livre":
        return <GrandLivre />;
      case "balance":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Balance comptable</h2>
            <p className="text-muted-foreground">Fonctionnalité à venir...</p>
          </div>
        );
      case "tableau-bord":
      default:
        return (
          <div className="p-6">
            <h2 className="text-3xl font-semibold mb-4">Tableau de bord</h2>
            <p className="text-muted-foreground mb-6">
              Bienvenue sur votre espace de comptabilité.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Écritures
                </h3>
                <p className="text-2xl font-bold mt-1">0</p>
                <p className="text-xs text-muted-foreground mt-2">Ce mois</p>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Comptes
                </h3>
                <p className="text-2xl font-bold mt-1">-</p>
                <p className="text-xs text-muted-foreground mt-2">Actifs</p>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Fichier
                </h3>
                <p className="text-sm font-mono mt-1 truncate">
                  {currentFile.split("\\").pop()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Ouvert</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Actions rapides</h3>
                <button
                  onClick={() => setCurrentPage("journal")}
                  className="w-full text-left p-2 hover:bg-accent rounded-md mb-1"
                >
                  📝 Nouvelle écriture
                </button>
                <button
                  onClick={() => setCurrentPage("comptes")}
                  className="w-full text-left p-2 hover:bg-accent rounded-md"
                >
                  📋 Gérer les comptes
                </button>
                <button
                  onClick={() => setCurrentPage("grand-livre")}
                  className="w-full text-left p-2 hover:bg-accent rounded-md"
                >
                  📚 Voir Grand Livre
                </button>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Informations</h3>
                <p className="text-sm text-muted-foreground">
                  Version 1.0.0
                  <br />
                  Fichier: {currentFile}
                  <br />
                  Utilisateur: {user?.nom_utilisateur}
                  <br />
                  {user?.est_admin && (
                    <span className="text-primary">Administrateur</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  // Afficher les logs pour déboguer
  console.log("Rendu App avec:", {
    currentFile: !!currentFile,
    authState,
    user: user?.nom_utilisateur,
    hasChecked: hasCheckedRef.current,
    currentPage,
  });

  // Si pas de fichier ouvert
  if (!currentFile) {
    return <WelcomeScreen onFileOpened={setCurrentFile} />;
  }

  // Écran de chargement
  if (authState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Chargement de votre comptabilité...
          </p>
        </div>
      </div>
    );
  }

  // Pas d'utilisateurs dans la base
  if (authState === "no-users") {
    return <CreateFirstUserScreen onSuccess={handleUserCreated} />;
  }

  // Écran de login - SEULEMENT si pas d'utilisateur connecté
  if (authState === "login" && !user) {
    return <LoginScreen onSuccess={handleLoginSuccess} />;
  }

  // Si on est en mode login mais qu'un user existe (après connexion),
  // on passe automatiquement en authenticated
  if (authState === "login" && user) {
    console.log("Transition auto login -> authenticated");
    setAuthState("authenticated");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirection...</p>
        </div>
      </div>
    );
  }

  // État authenticated - afficher l'appli
  if (authState === "authenticated") {
    // Si user n'est pas encore disponible, afficher un loading
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Finalisation de la connexion...
            </p>
          </div>
        </div>
      );
    }

    // User est disponible, afficher l'application
    return (
      <div className="flex h-screen bg-background text-foreground">
        {/* Sidebar */}
        <aside className="w-64 border-r p-4 flex flex-col h-full bg-card">
          <div className="flex-1">
            {/* En-tête avec fichier et utilisateur */}
            <div className="mb-6 p-3 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-xs truncate">
                <span>📁</span>
                <span className="font-mono" title={currentFile}>
                  {currentFile.split("\\").pop()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>👤</span>
                <span className="font-medium text-primary">
                  {user.nom_utilisateur}
                </span>
                {user.est_admin && (
                  <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Logo et titre */}
            <h1 className="text-xl font-bold mb-6 px-2">MiniCompta BI</h1>

            {/* Navigation */}
            <nav className="space-y-1">
              <button
                onClick={() => setCurrentPage("tableau-bord")}
                className={`w-full p-2 rounded-md text-left flex items-center gap-2 ${
                  currentPage === "tableau-bord"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <span>🏠</span>
                <span>Tableau de bord</span>
              </button>
              <button
                onClick={() => setCurrentPage("journal")}
                className={`w-full p-2 rounded-md text-left flex items-center gap-2 ${
                  currentPage === "journal"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <span>📔</span>
                <span>Journal</span>
              </button>
              <button
                onClick={() => setCurrentPage("grand-livre")}
                className={`w-full p-2 rounded-md text-left flex items-center gap-2 ${
                  currentPage === "grand-livre"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <span>📚</span>
                <span>Grand Livre</span>
              </button>
              <button
                onClick={() => setCurrentPage("balance")}
                className={`w-full p-2 rounded-md text-left flex items-center gap-2 ${
                  currentPage === "balance"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <span>⚖️</span>
                <span>Balance</span>
              </button>
              <button
                onClick={() => setCurrentPage("comptes")}
                className={`w-full p-2 rounded-md text-left flex items-center gap-2 ${
                  currentPage === "comptes"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <span>📋</span>
                <span>Plan comptable</span>
              </button>
            </nav>
          </div>

          {/* Pied de sidebar avec déconnexion */}
          <div className="border-t pt-4 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-left text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors flex items-center gap-2"
            >
              <span>🚪</span>
              <span>Déconnexion</span>
            </button>
            <div className="text-xs text-muted-foreground text-center">
              🇧🇮 MiniCompta v1.0
            </div>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 overflow-auto bg-background">
          {renderPage()}
        </main>
      </div>
    );
  }

  // Si on arrive ici, il y a un problème d'état
  console.error("État inattendu:", { authState, user: !!user });
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 border border-destructive rounded-lg max-w-md">
        <h2 className="text-xl font-semibold text-destructive mb-2">
          État inattendu
        </h2>
        <p className="text-muted-foreground mb-4">
          Une erreur de navigation est survenue.
        </p>
        <div className="mb-4 p-3 bg-accent/50 rounded text-left text-sm">
          <p>
            <strong>État:</strong> {authState}
          </p>
          <p>
            <strong>Utilisateur:</strong>{" "}
            {user ? user.nom_utilisateur : "non connecté"}
          </p>
          <p>
            <strong>Fichier:</strong> {currentFile || "aucun"}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Recharger l'application
        </button>
      </div>
    </div>
  );
}

// Wrapper avec le AuthProvider
function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
