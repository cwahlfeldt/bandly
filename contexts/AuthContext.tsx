import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError, AuthResponse } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{
    data: AuthResponse['data'] | null;
    error: AuthError | null;
  }>;
  signIn: (email: string, password: string) => Promise<{
    data: AuthResponse['data'] | null;
    error: AuthError | null;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('[AuthContext] Attempting sign up for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        console.error('[AuthContext] Sign up error:', error.message);
        return { data: null, error };
      }

      console.log('[AuthContext] Sign up successful');
      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Sign up exception:', error);
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred during sign up',
          name: 'SignUpException',
          status: 500,
        } as AuthError,
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error.message);
        return { data: null, error };
      }

      console.log('[AuthContext] Sign in successful');
      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Sign in exception:', error);
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred during sign in',
          name: 'SignInException',
          status: 500,
        } as AuthError,
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
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
