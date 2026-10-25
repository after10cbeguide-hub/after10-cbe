'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function AuthModal({ isOpen, onClose, reason }: Props) {
  const { loginWithGoogle } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const handleQuickLogin = (email: string, name: string) => {
    loginWithGoogle(email, name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-zinc-100 text-sm">Sign In to Continue</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-xl hover:bg-zinc-800/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason banner if triggered by a protected action */}
        {reason && (
          <div className="mt-3 p-2.5 bg-amber-950/40 border border-amber-800/40 rounded-xl text-amber-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{reason}</span>
          </div>
        )}

        <div className="py-4 space-y-3">
          <p className="text-zinc-400 text-xs text-center leading-relaxed">
            Verify your profile with 1-Tap Google authentication to interact, suggest spots, and match with buddies.
          </p>

          {/* Standard 1-Tap Google Button */}
          <button
            onClick={() => handleQuickLogin('karthik.rider@gmail.com', 'Karthik R')}
            className="w-full flex items-center justify-center gap-3 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold py-3 rounded-xl text-xs transition active:scale-95 shadow-lg"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Quick Campus Demo Presets */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block text-center">
              Or test campus domain verification:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleQuickLogin('ananya@psgtech.ac.in', 'Ananya S')}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                PSG Tech
              </button>
              <button
                onClick={() => handleQuickLogin('rahul@cit.edu.in', 'Rahul M')}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                CIT CBE
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero passwords • No SMS charges • 100% Free</span>
        </div>
      </div>
    </div>
  );
}