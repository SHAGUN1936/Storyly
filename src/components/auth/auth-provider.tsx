"use client";

// Makes the logged-in user available to browser components: const { user, isAdmin } = useAuth();
// The user comes from the server (root layout), so there is no loading flicker.
// After login/logout the server re-renders the layout and this updates by itself.

import { createContext, useContext } from "react";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: "user" | "admin" | "builder";
};

const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({ user, children }: { user: AuthUser | null; children: React.ReactNode }) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const user = useContext(AuthContext);
  return { user, isAdmin: user?.role === "admin" };
}
