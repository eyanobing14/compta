import React, { createContext, useContext, useState } from "react";
import { getDb } from "../lib/db";
import * as bcrypt from "bcryptjs";

interface User {
  id: number;
  nom_utilisateur: string;
  est_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void; // Déjà là mais vérifions
  createFirstUser: (username: string, password: string) => Promise<boolean>;
  checkIfHasUsers: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkIfHasUsers = async (): Promise<boolean> => {
    try {
      const db = getDb();
      const result = await db.select<{ count: number }[]>(
        "SELECT COUNT(*) as count FROM utilisateurs",
      );
      return result[0].count > 0;
    } catch (error) {
      console.error("Erreur vérification utilisateurs:", error);
      return false;
    }
  };

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const db = getDb();

      const users = await db.select<
        {
          id: number;
          nom_utilisateur: string;
          mot_de_passe_hash: string;
          est_admin: boolean;
        }[]
      >(
        "SELECT id, nom_utilisateur, mot_de_passe_hash, est_admin FROM utilisateurs WHERE nom_utilisateur = ?",
        [username],
      );

      if (users.length === 0) {
        return false;
      }

      const userData = users[0];
      const isValid = await bcrypt.compare(
        password,
        userData.mot_de_passe_hash,
      );

      if (isValid) {
        setUser({
          id: userData.id,
          nom_utilisateur: userData.nom_utilisateur,
          est_admin: userData.est_admin === 1,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Erreur login:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createFirstUser = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const db = getDb();

      const result = await db.select<{ count: number }[]>(
        "SELECT COUNT(*) as count FROM utilisateurs",
      );

      if (result[0].count > 0) {
        throw new Error("Des utilisateurs existent déjà");
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      await db.execute(
        "INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe_hash, sel, est_admin) VALUES (?, ?, ?, ?)",
        [username, hash, salt, true],
      );

      const newUsers = await db.select<{ id: number }[]>(
        "SELECT id FROM utilisateurs WHERE nom_utilisateur = ?",
        [username],
      );

      setUser({
        id: newUsers[0].id,
        nom_utilisateur: username,
        est_admin: true,
      });

      return true;
    } catch (error) {
      console.error("Erreur création utilisateur:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // La fonction logout qui manquait peut-être
  const logout = () => {
    setUser(null); // Efface l'utilisateur du contexte
    console.log("Utilisateur déconnecté");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        createFirstUser,
        checkIfHasUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
