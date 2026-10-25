'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  loginWithGoogle: () => Promise<void>;
  loginWithMock: (mockEmail: string, mockName: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Detect recognized Coimbatore engineering & arts college domains
function detectCollege(email: string): string | undefined {
  const lower = email.toLowerCase();
  if (lower.includes('psgtech.ac.in') || lower.includes('psg')) return 'PSG Tech';
  if (lower.includes('cit.edu.in') || lower.includes('cit')) return 'CIT Coimbatore';
  if (lower.includes('kct.ac.in') || lower.includes('kct')) return 'Kumaraguru (KCT)';
  if (lower.includes('gct.ac.in')) return 'GCT Coimbatore';
  if (lower.includes('karunya.edu')) return 'Karunya Institute';
  if (lower.includes('skcet.ac.in')) return 'SKCET';
  return undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  // Sync Supabase Auth state across the app
  useEffect(() => {
    // 1. Check current active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserAuthentication(session.user);
      }
    });

    // 2. Subscribe to Authentication changes (login, logout, token refreshes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserAuthentication(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUserAuthentication = (supabaseUser: any) => {
    const email = supabaseUser.email || '';
    const college = detectCollege(email);
    
    // Retrieve OAuth Metadata from the Google Account
    const userMeta = supabaseUser.user_metadata || {};
    const name = userMeta.full_name || userMeta.name || email.split('@')[0] || 'Night Owl';
    const avatarUrl = userMeta.avatar_url || userMeta.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;

    const loggedInUser: UserProfile = {
      id: supabaseUser.id,
      name,
      email,
      avatarUrl,
      college,
      isStudentVerified: !!college,
      role: email.includes('admin') ? 'admin' : 'user',
    };

    setUser(loggedInUser);
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Auth Failed:', err.message);
    }
  };

  // Keep Mock login active for testing predefined simulation accounts
  const loginWithMock = (mockEmail: string, mockName: string) => {
    const college = detectCollege(mockEmail);
    const mockUser: UserProfile = {
      id: `usr_mock_${Date.now()}`,
      name: mockName,
      email: mockEmail,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${mockName}`,
      college,
      isStudentVerified: !!college,
      role: mockEmail.includes('admin') ? 'admin' : 'user',
    };
    setUser(mockUser);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, loginWithMock, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}