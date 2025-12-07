import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { verifyPin } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  userId: string | null;
  loading: boolean;
  isLocked: boolean;
  login: (email: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  unlock: (pin: string) => Promise<{ success: boolean; error?: string }>;
  lock: () => void;
  updateLastActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  const updateLastActivity = async () => {
    if (!user?.id) return;

    await supabase
      .from('users')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', user.id);

    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    const timer = setTimeout(() => {
      setIsLocked(true);
    }, 30 * 60 * 1000);

    setInactivityTimer(timer);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);
      setLoading(false);
      if (session?.user) {
        updateLastActivity();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);
      setLoading(false);
      if (session?.user) {
        updateLastActivity();
      }
    });

    return () => {
      subscription.unsubscribe();
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, []);

  const login = async (email: string, pin: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (userError || !userData) {
        return { success: false, error: 'User not found' };
      }

      const isValid = await verifyPin(pin, userData.pin_hash);
      if (!isValid) {
        return { success: false, error: 'Invalid PIN' };
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: pin + email,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      await supabase.from('audit_logs').insert({
        user_id: userData.id,
        action: 'login',
        metadata: { timestamp: new Date().toISOString() }
      });

      setIsLocked(false);
      updateLastActivity();

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const unlock = async (pin: string) => {
    if (!user?.email) {
      return { success: false, error: 'No user session' };
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (userError || !userData) {
        return { success: false, error: 'User not found' };
      }

      const isValid = await verifyPin(pin, userData.pin_hash);
      if (!isValid) {
        return { success: false, error: 'Invalid PIN' };
      }

      setIsLocked(false);
      updateLastActivity();

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Unlock failed' };
    }
  };

  const lock = () => {
    setIsLocked(true);
  };

  const logout = async () => {
    if (user?.id) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'logout',
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    await supabase.auth.signOut();
    setIsLocked(false);
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        loading,
        isLocked,
        login,
        logout,
        unlock,
        lock,
        updateLastActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
