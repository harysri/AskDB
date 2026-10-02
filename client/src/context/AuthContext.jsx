import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import * as authApi from "../api/auth";
import { TOKEN_STORAGE_KEY, subscribeAuthEvents } from "../api/client";

const STORAGE_KEYS = {
  user: "askdb_user",
  accessToken: TOKEN_STORAGE_KEY,
  refreshToken: "askdb_refresh_token",
};

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || "null");
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.accessToken) || null,
  );
  const [refreshToken, setRefreshToken] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.refreshToken) || null,
  );

  const persistAuth = useCallback(({ user, accessToken, refreshToken }) => {
    setUser(user);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    }
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login({ email, password });
      persistAuth(data);
      return data.user;
    },
    [persistAuth],
  );

  const register = useCallback(
    async ({ fullName, email, password }) => {
      const data = await authApi.register({ fullName, email, password });
      persistAuth(data);
      return data.user;
    },
    [persistAuth],
  );

  const logout = useCallback(async () => {
    try {
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch {
      // Best-effort server-side revocation; always clear local state.
    } finally {
      clearAuth();
    }
  }, [refreshToken, clearAuth]);

  // Keep React state in sync with token refreshes done by the API layer.
  useEffect(() => {
    const unsubscribe = subscribeAuthEvents(({ type }) => {
      if (type === "tokensRefreshed") {
        setAccessToken(localStorage.getItem(STORAGE_KEYS.accessToken) || null);
        setRefreshToken(localStorage.getItem(STORAGE_KEYS.refreshToken) || null);
      } else if (type === "sessionExpired") {
        clearAuth();
      }
    });
    return unsubscribe;
  }, [clearAuth]);

  const value = useMemo(
    () => ({ user, accessToken, login, register, logout, isAuthenticated: !!accessToken }),
    [user, accessToken, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
