'use client';

import { useState, useEffect } from 'react';
import { Confession } from '@/types';
import { INITIAL_CONFESSIONS } from '@/data/seed-confessions';
import { Ghost, X, Flame, Send, Moon, Clock, Lock, MessageSquare, Grid } from 'lucide-react';
import GhostPixelCanvas from './GhostPixelCanvas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CBE_AREAS = [
  'General CBE',
  'PSG Tech / Peelamedu',
  'CIT / Civil Aerodrome',
  'KCT / Saravanampatti',
  'RS Puram',
  'Saibaba Colony',
  'Race Course',
];

export default function ConfessionWallModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'whispers' | 'canvas'>('whispers');
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [newText, setNewText] = useState('');
  const [selectedArea, setSelectedArea] = useState(CBE_AREAS[0]);
  const [isNightTime, setIsNightTime] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  useEffect(() => {
    const checkNightWindow = () => {
      const now = new Date();
      const hour = now.getHours();
      const active = hour >= 22 || hour < 6;
      setIsNightTime(active);
    };

    checkNightWindow();
    const interval = setInterval(checkNightWindow, 60000);

    const saved = localStorage.getItem('after10_confessions');
    if (saved) {
      try {
        setConfessions(JSON.parse(saved));
      } catch {
        setConfessions(INITIAL_CONFESSIONS);
      }
    } else {
      setConfessions(INITIAL_CONFESSIONS);
    }

    return () => clearInterval(interval);
  }, []);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newConfession: Confession = {
      id: Date.now().toString(),
      text: newText.trim(),
      area: selectedArea,
      upvotes: 1,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newConfession, ...confessions];
    setConfessions(updated);
    localStorage.setItem('after10_confessions', JSON.stringify(updated));
    setNewText('');
  };

  const handleUpvote = (id: string) => {
    const updated = confessions.map((c) =>
      c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c
    );
    setConfessions(updated);
    localStorage.setItem('after10_confessions', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const isUnlocked = isNightTime || devBypass;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md transition-all">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl h-[90vh] sm:h-[84vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header with Switcher Tabs */}
        <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Ghost className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-zinc-100 text-sm sm:text-base">Ghost Wall</h3>
                <span className="text-[9px] font-mono bg-purple-950/70 text-purple-300 border border-purple-800/50 px-1.5 py-0.5 rounded-full">
                  10PM–6AM
                </span>
              </div>
              <p className="text-zinc-500 text-[11px]">Wipes at 6:00 AM</p>
            </div>
          </div>

          {/* Tab Switcher: Whispers vs. Pixel Canvas */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('whispers')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeTab === 'whispers'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Whispers</span>
            </button>
            <button
              onClick={() => setActiveTab('canvas')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeTab === 'canvas'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Pixel Board</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-xl hover:bg-zinc-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOCKED SCREEN (Shown if not night time) */}
        {!isUnlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-purple-400">
              <Lock className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-zinc-200 mb-1">Ghosts Are Asleep</h4>
            <p className="text-zinc-500 text-xs max-w-xs mb-6">
              The Wall unlocks only from 10:00 PM to 6:00 AM.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 mb-6">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Unlocks tonight at 10:00 PM</span>
            </div>
            <button
              onClick={() => setDevBypass(true)}
              className="text-xs text-purple-400/80 hover:text-purple-300 underline font-mono"
            >
              [Dev Mode: Preview Wall Now]
            </button>
          </div>
        ) : (
          /* UNLOCKED CONTENT (Tab Switch) */
          <>
            {activeTab === 'canvas' ? (
              /* PIXEL BOARD TAB */
              <div className="flex-1 overflow-hidden">
                <GhostPixelCanvas />
              </div>
            ) : (
              /* TEXT CONFESSIONS TAB */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                  {devBypass && !isNightTime && (
                    <div className="text-[11px] font-mono text-amber-400/80 bg-amber-950/40 border border-amber-800/40 p-2 rounded-xl text-center">
                      🛠️ Dev preview active (Outside 10PM - 6AM)
                    </div>
                  )}

                  {confessions.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-zinc-500 text-xs">
                      <Moon className="w-6 h-6 mb-2 text-zinc-600" />
                      No confessions yet. Drop the first night tea...
                    </div>
                  ) : (
                    confessions.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl space-y-2 hover:border-zinc-700/80 transition"
                      >
                        <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                          {c.text}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/40">
                          <span className="text-purple-400/90 font-medium text-[11px] bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-900/30">
                            📍 {c.area}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-500 text-[11px]">{c.createdAt}</span>
                            <button
                              onClick={() => handleUpvote(c.id)}
                              className="flex items-center gap-1 text-zinc-400 hover:text-rose-400 active:scale-95 transition"
                            >
                              <Flame className="w-3.5 h-3.5 text-rose-500" />
                              <span className="font-mono text-xs">{c.upvotes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Text Form */}
                <form onSubmit={handlePost} className="p-3 bg-zinc-900/80 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {CBE_AREAS.map((area) => (
                      <button
                        type="button"
                        key={area}
                        onClick={() => setSelectedArea(area)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap transition border ${
                          selectedArea === area
                            ? 'bg-purple-900/80 text-purple-200 border-purple-700'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Drop anonymous late night tea..."
                      maxLength={200}
                      className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500 transition"
                    />
                    <button
                      type="submit"
                      disabled={!newText.trim()}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}