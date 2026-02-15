import React, { useState } from "react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { Dashboard } from "./components/dashboard/Dashboard";
import { initDatabase } from "./lib/db";

type AppState = "welcome" | "dashboard";

function App() {
  const [currentState, setCurrentState] = useState<AppState>("welcome");
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const handleFileOpened = async (filePath: string) => {
    setCurrentFile(filePath);
    setCurrentState("dashboard");
  };

  // Si pas de fichier ouvert
  if (currentState === "welcome" || !currentFile) {
    return <WelcomeScreen onFileOpened={handleFileOpened} />;
  }

  // Dashboard avec gestion des exercices
  return <Dashboard currentFile={currentFile} />;
}

export default App;
