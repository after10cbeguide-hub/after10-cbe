'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  loginWithGoogle: (mockEmail?: string, mockName?: string) => void;
  logout: () => void;
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

  useEffect(() => {
    const saved = localStorage.getItem('after10_user_session');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('after10_user_session');
      }
    }
  }, []);

  const loginWithGoogle = (customEmail?: string, customName?: string) => {
    const email = customEmail || 'student@psgtech.ac.in';
    const name = customName || 'Karthik R';
    const college = detectCollege(email);

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name,
      email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      college,
      isStudentVerified: !!college,
      role: email.includes('admin') ? 'admin' : 'user',
    };

    setUser(newUser);
    localStorage.setItem('after10_user_session', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('after10_user_session');
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
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