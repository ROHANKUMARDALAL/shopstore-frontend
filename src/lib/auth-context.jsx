"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getMe } from "@/lib/api";
import {
  clearSession,
  persistSession,
  readStoredUser,
  readToken,
} from "@/lib/auth-storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const token = readToken();
      const stored = readStoredUser();
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setReady(true);
        }
        return;
      }
      if (stored && !cancelled) setUser(stored);
      try {
        const { user: me } = await getMe();
        if (!cancelled) {
          persistSession(token, me);
          setUser(me);
        }
      } catch {
        clearSession();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  function acceptSession(session) {
    persistSession(session.token, session.user);
    setUser(session.user);
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, acceptSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
