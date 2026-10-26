import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { isDemoMode, supabase } from '@/lib/supabase';

export type Player = {
  id: string;
  username: string;
  coins: number;
};

type AuthState = {
  loading: boolean;
  player: Player | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, username: string, birthdate: string) => Promise<string | null>;
  startDemo: (username: string) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const STARTING_COINS = 100;

async function loadPlayer(session: Session): Promise<Player | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, username, coins')
    .eq('id', session.user.id)
    .single();
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(!isDemoMode);
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    client.auth.getSession().then(async ({ data }) => {
      setPlayer(data.session ? await loadPlayer(data.session) : null);
      setLoading(false);
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      // Supabase warns against awaiting other calls inside this callback.
      setTimeout(async () => setPlayer(session ? await loadPlayer(session) : null), 0);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    loading,
    player,
    async signIn(email, password) {
      if (!supabase) return 'No server is set up yet. Use demo mode for now.';
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    async signUp(email, password, username, birthdate) {
      if (!supabase) return 'No server is set up yet. Use demo mode for now.';
      // The database re-checks the age and username when it creates the profile.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, birthdate } },
      });
      return error?.message ?? null;
    },
    startDemo(username) {
      setPlayer({ id: 'demo', username, coins: STARTING_COINS });
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut();
      setPlayer(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
