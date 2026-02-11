import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { User, AuthState } from "@/types";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo user for development
const DEMO_USER: User = {
  id: "demo-1",
  email: "demo@linkloot.dev",
  name: "Demo User",
  plan: "pro",
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = useCallback(async (email: string, _password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setState({
      user: { ...DEMO_USER, email },
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const signup = useCallback(async (name: string, email: string, _password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    await new Promise((r) => setTimeout(r, 800));
    setState({
      user: { ...DEMO_USER, name, email, plan: "free" },
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
