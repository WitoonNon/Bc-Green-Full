"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session-cookie";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // fallback: check for session cookie existence
      const has = document.cookie.includes("bc_session=");
      setUser(has ? ({} as User) : null);
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser && !nextUser.isAnonymous) {
        setSessionCookie("1");
      } else {
        clearSessionCookie();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    clearSessionCookie();
    if (!auth) {
      // In demo mode, manually redirect to login to clear state
      window.location.href = "/";
      return;
    }
    await signOut(auth);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signOut: handleSignOut }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
