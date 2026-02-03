import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import type { AuthUser, TokenPayload } from "@/auth/types";
import { fetchWithAuth, identityUrl } from "@/api/client";
import { endpoints } from "@/api/endpoints";

const STORAGE_KEY = "microserviceslab_token";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Decode JWT payload without verification (frontend only; backend validates). */
function decodePayload(token: string): TokenPayload | null {
  try {
    return jwtDecode(token) as TokenPayload;
  } catch {
    return null;
  }
}

function payloadToUser(payload: TokenPayload): AuthUser {
  return {
    id: payload.sub,
    email: payload.email,
    roles: payload.roles ?? {},
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = getStoredToken();
    if (!t) return null;
    const payload = decodePayload(t);
    return payload ? payloadToUser(payload) : null;
  });

  const setToken = useCallback((newToken: string | null) => {
    setStoredToken(newToken);
    setTokenState(newToken);
    if (!newToken) {
      setUser(null);
      return;
    }
    
    const payload = decodePayload(newToken);
    const baseUser = payload ? payloadToUser(payload) : null;
    setUser(baseUser);

    if (baseUser) {
      fetchWithAuth(
        identityUrl(endpoints.profile.me),
        { method: "GET" },
        newToken,
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((profile) => {
          if (profile) {
            setUser((prev) => (prev ? { ...prev, ...profile } : prev));
          }
        })
        .catch(() => {
          /* ignored, baseUser from JWT is enough*/
        });
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  useEffect(() => {
    const t = getStoredToken();
    if (t && !user) {
      const payload = decodePayload(t);
      if (payload) setUser(payloadToUser(payload));
    }
  }, [user]);

  const isAdmin = useMemo(() => {
    return user?.roles?.["identity-service"]?.includes("admin") ?? false;
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, setToken, logout, isAdmin }),
    [token, user, setToken, logout, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
