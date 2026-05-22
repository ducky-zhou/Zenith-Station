import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { api, clearSession, getStoredUser, storeSession } from "./api/client";
import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin: user?.role === "admin",
      async login(email, password) {
        const data = await api.login(email, password);
        storeSession(data.access_token, data.user);
        setUser(data.user);
      },
      async register(username, email, password) {
        const data = await api.register(username, email, password);
        storeSession(data.access_token, data.user);
        setUser(data.user);
      },
      logout() {
        clearSession();
        setUser(null);
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
