'use client';

import { useState } from 'react';
import { VibeProfile, VibeMessage } from '@/types';
import {
  X,
  Music,
  Disc3,
  MessageSquareQuote,
  Flame,
  Radio,
  Heart,
  ArrowRight,
  Sparkles,
  Send,
  Edit3,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSOS?: () => void;
  currentUser?: { id?: string; name?: string; email?: string } | null;
}

export default function ChaiBuddyModal({ isOpen, onClose, currentUser }: Props) {
  // Step navigation: 'create' -> 'discover' -> 'chat'
  const [step, setStep] = useState<'create' | 'discover' | 'chat'>('create');

  // User's own vibe profile inputs
  const [favoriteSong, setFavoriteSong] = useState('');
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [mindDialogue, setMindDialogue] = useState('');
  const [craving, setCraving] = useState('');
  const [vibeRule, setVibeRule] = useState('Chill listener, zero awkwardness');

  // Live profiles deck (initialized empty: no dummy data)
  const [profiles, setProfiles] = useState<VibeProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedProfile, setMatchedProfile] = useState<VibeProfile | null>(null);

  // 1-on-1 Private Chat state
  const [chatMessages, setChatMessages] = useState<VibeMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');

  if (!isOpen) return null;

  const myUserId = currentUser?.id || 'me';
  const myUserName = currentUser?.name || 'You';

  const handleSaveVibe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!favoriteSong.trim() || !favoriteArtist.trim()) return;
    setStep('discover');
  };

  const currentCard = profiles.length > 0 ? profiles[currentIndex] : null;

  const handleNext = () => {
    if (profiles.length === 0) return;
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleConnect = () => {
    if (!currentCard) return;
    setMatchedProfile(currentCard);

    // Initialize 1-on-1 private room greeting
    setChatMessages([
      {
        id: `sys_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        text: `Connected! You both tuned in tonight. Say hi to ${currentCard.name}!`,
        timestamp: Date.now(),
      },
    ]);
    setStep('chat');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg: VibeMessage = {
      id: `msg_${Date.now()}`,
      senderId: myUserId,
      senderName: myUserName,
      text: messageInput.trim(),
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setMessageInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            {step === 'chat' && (
              <button
                type="button"
                onClick={() => setStep('discover')}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition"
                aria-label="Back to discover"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              {step === 'chat' ? <MessageCircle className="w-4 h-4" /> : <Radio className="w-4 h-4 animate-pulse" />}
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm sm:text-base flex items-center gap-1.5">
                {step === 'create'
                  ? 'Set Your Midnight Vibe'
                  : step === 'discover'
                  ? 'Live Vibe Radar'
                  : `Chat with ${matchedProfile?.name || 'Buddy'}`}
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-zinc-500 text-[11px]">
                {step === 'create'
                  ? 'Fill your frequency to unlock matching night owls'
                  : step === 'discover'
                  ? 'Browsing active vibes in Coimbatore'
                  : '1-on-1 private late night connection'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-xl hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Body */}
        <div className="overflow-y-auto pr-1 py-3 text-xs flex-1 flex flex-col justify-between">
          
          {/* STEP 1: FILL VIBE */}
          {step === 'create' && (
            <form onSubmit={handleSaveVibe} className="space-y-3">
              <div>
                <label className="text-zinc-300 mb-1 flex items-center gap-1.5 font-medium">
                  <Music className="w-3.5 h-3.5 text-amber-400" /> Song on loop right now *
                </label>
                <input
                  type="text"
                  required
                  value={favoriteSong}
                  onChange={(e) => setFavoriteSong(e.target.value)}
                  placeholder="e.g. Kanave Kanave, Interstellar Theme, Neon..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 mb-1 flex items-center gap-1.5 font-medium">
                  <Disc3 className="w-3.5 h-3.5 text-emerald-400" /> Favorite Artist / Band *
                </label>
                <input
                  type="text"
                  required
                  value={favoriteArtist}
                  onChange={(e) => setFavoriteArtist(e.target.value)}
                  placeholder="e.g. Anirudh, AR Rahman, Arctic Monkeys..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 mb-1 flex items-center gap-1.5 font-medium">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-sky-400" /> Movie / meme line in your head
                </label>
                <input
                  type="text"
                  value={mindDialogue}
                  onChange={(e) => setMindDialogue(e.target.value)}
                  placeholder="e.g. Naan oru thadava mudivu pannita..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 mb-1 flex items-center gap-1.5 font-medium">
                  <Flame className="w-3.5 h-3.5 text-purple-400" /> Craving right now
                </label>
                <input
                  type="text"
                  value={craving}
                  onChange={(e) => setCraving(e.target.value)}
                  placeholder="e.g. Hot lemon tea, long bypass ride, quiet spot..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 mb-1 block font-medium">My Night Rule</label>
                <select
                  value={vibeRule}
                  onChange={(e) => setVibeRule(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-500"
                >
                  <option value="Chill listener, zero awkwardness">Chill listener, zero awkward small talk</option>
                  <option value="Late night deep philosophy">Deep talks & life philosophy</option>
                  <option value="High energy roast & banter">Roast, funny banter & laughs</option>
                  <option value="Silent companion">Silent companion (comfortable quiet)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-amber-950/30 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" /> Save My Vibe & Go Live
              </button>
            </form>
          )}

          {/* STEP 2: DISCOVER MATCHES */}
          {step === 'discover' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1"></span>
                  Active vibes in Coimbatore
                </span>
                <button
                  type="button"
                  onClick={() => setStep('create')}
                  className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
                >
                  <Edit3 className="w-3 h-3" /> Edit My Vibe
                </button>
              </div>

              {currentCard ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                    <div>
                      <h4 className="font-bold text-zinc-100 text-sm">{currentCard.name}</h4>
                      <p className="text-[10px] text-zinc-500">Live Night Owl</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {currentIndex + 1} of {profiles.length}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/60">
                      <Music className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Current Loop</span>
                        <span className="text-zinc-200 font-medium">{currentCard.favoriteSong}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/60">
                      <Disc3 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Artist</span>
                        <span className="text-zinc-200 font-medium">{currentCard.favoriteArtist}</span>
                      </div>
                    </div>

                    {currentCard.mindDialogue && (
                      <div className="flex items-start gap-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/60">
                        <MessageSquareQuote className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-zinc-500 text-[10px] block">Headspace Dialogue</span>
                          <span className="text-zinc-300 italic">{currentCard.mindDialogue}</span>
                        </div>
                      </div>
                    )}

                    {currentCard.craving && (
                      <div className="flex items-start gap-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/60">
                        <Flame className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-zinc-500 text-[10px] block">Craving Right Now</span>
                          <span className="text-zinc-200">{currentCard.craving}</span>
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-zinc-400 pt-1">
                      <span className="text-zinc-500">Night Rule:</span> {currentCard.vibeRule}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs transition"
                    >
                      See Next <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleConnect}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-950/20 active:scale-95"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" /> Vibe Match!
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-56 border border-dashed border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-5 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                    <Radio className="w-5 h-5 text-amber-500/70 animate-pulse" />
                  </div>
                  <h4 className="font-semibold text-zinc-200 text-xs">Scanning Midnight Waves...</h4>
                  <p className="text-zinc-500 text-[11px] max-w-xs">
                    Your profile is broadcasted live! As other night owls set their vibes across CBE tonight, their cards will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: 1-ON-1 PRIVATE CHAT */}
          {step === 'chat' && matchedProfile && (
            <div className="flex flex-col h-[380px] justify-between">
              {/* Message log */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 pb-2">
                {chatMessages.map((msg) => {
                  const isMe = msg.senderId === myUserId;
                  const isSystem = msg.senderId === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center py-2">
                        <span className="bg-zinc-900 border border-zinc-800 text-amber-400 text-[10px] px-3 py-1 rounded-full">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-zinc-500 px-1 mb-0.5">
                        {isMe ? 'You' : matchedProfile.name}
                      </span>
                      <div
                        className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs ${
                          isMe
                            ? 'bg-amber-500 text-zinc-950 font-medium rounded-tr-sm'
                            : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="pt-2 border-t border-zinc-800/80 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${matchedProfile.name}...`}
                  className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500 text-xs"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 p-2.5 rounded-xl transition active:scale-95 shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}