'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

interface AuthCtx {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fallback: se getSession travar, libera o loading em 6s
    const fallback = setTimeout(() => setLoading(false), 6000);

    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(fallback);
      setSession(data.session);
      setLoading(false);
    }).catch(() => {
      clearTimeout(fallback);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => { subscription.unsubscribe(); clearTimeout(fallback); };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
