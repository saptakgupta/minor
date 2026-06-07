import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "@/context/auth-context";
import type { AuthContextValue } from "@/context/auth-context";
import {
  clearSession,
  getInitialSession,
  loginUser,
  registerUser,
  saveSession,
} from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getInitialSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (input) => {
        const authenticatedUser = loginUser(input);
        saveSession(authenticatedUser);
        setUser(authenticatedUser);
        return authenticatedUser;
      },
      register: (input) => {
        const registeredUser = registerUser(input);
        saveSession(registeredUser);
        setUser(registeredUser);
        return registeredUser;
      },
      logout: () => {
        clearSession();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
