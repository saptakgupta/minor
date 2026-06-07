import { createContext } from "react";
import type { AuthUser, LoginInput, RegisterUserInput } from "@/lib/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  login: (input: LoginInput) => AuthUser;
  register: (input: RegisterUserInput) => AuthUser;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
