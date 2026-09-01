"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    // Seed initial state from the persisted session so `user` is populated on
    // first paint instead of waiting for the first onAuthStateChange tick.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Always render children. Blocking the entire app tree on `loading` causes a
  // blank first paint and breaks server-rendered public pages. Consumers that
  // need to gate on auth read `loading` from the context instead.
  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
