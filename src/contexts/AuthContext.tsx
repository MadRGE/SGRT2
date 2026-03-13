import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, createIsolatedClient } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

const MCKEIN_URL = import.meta.env.VITE_MCKEIN_URL || "https://mckein.com";

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  cliente_id: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
  clienteId: string | null;
  isRecovery: boolean;
  session: { user: User } | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nombre: string, rol?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(su: SupabaseUser): User {
  const meta = su.user_metadata || {};
  return {
    id: su.id,
    email: su.email || '',
    nombre: (meta.nombre as string) || (meta.full_name as string) || (meta.name as string) || su.email || '',
    rol: (meta.rol as string) || 'gestor',
    cliente_id: (meta.cliente_id as string) || null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);

  const applyUser = (su: SupabaseUser | null) => {
    if (su) {
      const u = mapSupabaseUser(su);
      setUser(u);
      setUserRole(u.rol);
      setClienteId(u.cliente_id);
    } else {
      setUser(null);
      setUserRole(null);
      setClienteId(null);
    }
  };

  useEffect(() => {
    // Handle OAuth callback — clean hash tokens from URL to prevent loops
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // Let Supabase consume the tokens, then clean the URL
      supabase.auth.getSession().then(({ data: { session } }) => {
        applyUser(session?.user ?? null);
        setLoading(false);
        // Remove hash so we don't re-process on refresh
        window.history.replaceState(null, '', window.location.pathname);
      });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        applyUser(session?.user ?? null);
        setLoading(false);
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      applyUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
      // Clean hash after any OAuth event
      if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // 1. Try Supabase local auth first
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { error: null };

    // 2. Fallback: authenticate against Mckein
    try {
      const mckeinRes = await fetch(`${MCKEIN_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!mckeinRes.ok) return { error: new Error(error.message) };

      const mckeinData = await mckeinRes.json();
      const mckeinNode = mckeinData.node;

      if (!mckeinData.user || !mckeinNode) return { error: new Error(error.message) };

      // Only gestores can SSO into SGRT2
      const nodeTypes: string[] = mckeinNode.types || [mckeinNode.type];
      if (!nodeTypes.includes("gestor")) {
        return { error: new Error("Solo nodos de tipo gestor pueden acceder a SGT") };
      }

      // 3. Auto-provision: create Supabase user with isolated client (no session hijack)
      const isolated = createIsolatedClient();
      const nombre = mckeinData.user.name || email.split("@")[0];

      await isolated.auth.signUp({
        email,
        password,
        options: {
          data: { nombre, rol: "gestor" },
        },
      });

      // 4. Now sign in with the newly created user
      const retry = await supabase.auth.signInWithPassword({ email, password });
      return { error: retry.error ? new Error(retry.error.message) : null };
    } catch (err) {
      console.error("[auth] Mckein SSO failed:", err);
      return { error: new Error(error.message) };
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, nombre: string, rol: string = 'gestor') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, rol } },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setClienteId(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setIsRecovery(false);
    return { error: error ? new Error(error.message) : null };
  };

  const clearRecovery = () => setIsRecovery(false);

  const value: AuthContextType = {
    user, loading, userRole, clienteId, isRecovery,
    session: user ? { user } : null,
    signIn, signInWithGoogle, signUp, signOut, resetPassword, updatePassword, clearRecovery,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
