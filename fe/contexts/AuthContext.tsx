// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

interface AuthContextType {
  user: any | null;
  login: (token: string, userData: any, remember?: boolean) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check both localStorage and cookies
    const token = localStorage.getItem("token") || Cookies.get("token");
    const userData = localStorage.getItem("user") || Cookies.get("user");

    if (token && userData) {
      try {
        setUser(typeof userData === "string" ? JSON.parse(userData) : userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: any, remember: boolean = false) => {
    if (remember) {
      // Set cookies with 30 days expiry
      Cookies.set("token", token, { expires: 30 });
      Cookies.set("user", JSON.stringify(userData), { expires: 30 });
    } else {
      // Use localStorage for session
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
    }
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    Cookies.remove("token");
    Cookies.remove("user");
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
