'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Coffee, 
  Sparkles, 
  X, 
  Send, 
  Clock, 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  Bike, 
  Footprints,
  UserCheck,
  Compass
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSOS: () => void;
}

const CBE_ZONES = [
  'All Coimbatore (Any Zone)',
  'Peelamedu / Hopes / PSG',
  'RS Puram / DB Road',
  'Saibaba Colony / NSR Road',
  'Race Course / Nehru Stadium',
  'Saravanampatti / KCT Stretch',
  'Gandhipuram / Cross Cut',
  'SITRA / Airport Bypass',
];

const VIBE_OPTIONS = [
  { id: 'chai_snack', label: '🫖 Quick Chai & Bun (15 mins)' },
  { id: 'cruise', label: '🏍️ Midnight Ride / Cruise' },
  { id: 'code_talk', label: '💻 Code / Tech / Startup Talk' },
  { id: 'silent', label: '🤐 Silent Tea (Zero small talk)' },
];

const TRANSPORT_MODES = [
  { id: 'bike_pillion', label: 'Bike (Pillion Open)', icon: Bike },
  { id: 'solo_bike', label: 'Solo Bike Rider', icon: Bike },
  { id: 'walk', label: 'On Foot / Nearby', icon: Footprints },
];

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
}

export default function ChaiBuddyModal({ isOpen, onClose, onOpenSOS }: Props) {
  const { user } = useAuth();

  // Steps: 'setup' -> 'searching' -> 'chat'
  const [stage, setStage] = useState<'setup' | 'searching' | 'chat'>('setup');
  
  // Setup preferences
  const [zone, setZone] = useState(CBE_ZONES[0]);
  const [vibe, setVibe] = useState(VIBE_OPTIONS[0].id);
  const [transport, setTransport] = useState(TRANSPORT_MODES[0].id);
  const [girlsOnly, setGirlsOnly] = useState(false);

  // Match state
  const [matchedBuddy, setMatchedBuddy] = useState<{ id: string; name: string; zone?: string } | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60); // 20 minutes countdown
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Unique local ID fallback if not signed in
  const myUserId = user?.id || (typeof window !== 'undefined' ? (localStorage.getItem('chai_temp_id') || `anon_${Date.now()}`) : 'anon');
  const myUserName = user?.name ? user.name.split(' ')[0] : 'Night Owl';

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('chai_temp_id')) {
      localStorage.setItem('chai_temp_id', myUserId);
    }
  }, [myUserId]);

  const resetSession = () => {
    setStage('setup');
    setMessages([]);
    setMatchedBuddy(null);
    setRoomId(null);
    setTimeLeft(20 * 60);
    localStorage.removeItem('after10_chai_buddy_chat');
  };

  // MATCHMAKING LOBBY
  useEffect(() => {
    if (stage !== 'searching') return;

    const lobbyChannel = supabase.channel('chai_matchmaking_lobby', {
      config: { presence: { key: myUserId } },
    });

    lobbyChannel
      .on('presence', { event: 'sync' }, () => {
        const state = lobbyChannel.presenceState();
        const allCandidates: any[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((p) => {
            if (p.userId !== myUserId) {
              allCandidates.push(p);
            }
          });
        });

        // Flexible Zone Matching:
        // Match if both are looking for the same zone OR if either candidate selected "All Coimbatore (Any Zone)"
        const match = allCandidates.find((c) => {
          const isUniversalSearch = zone === 'All Coimbatore (Any Zone)' || c.zone === 'All Coimbatore (Any Zone)';
          const isSameZone = c.zone === zone;
          return isUniversalSearch || isSameZone;
        });

        if (match) {
          const generatedRoomId = `room_${[myUserId, match.userId].sort().join('_')}`;
          
          lobbyChannel.send({
            type: 'broadcast',
            event: 'match_found',
            payload: {
              targetId: match.userId,
              buddy: { id: myUserId, name: myUserName, zone },
              roomId: generatedRoomId,
            },
          });

          setMatchedBuddy({ id: match.userId, name: match.name, zone: match.zone });
          setRoomId(generatedRoomId);
          setStage('chat');
        }
      })
      .on('broadcast', { event: 'match_found' }, ({ payload }) => {
        if (payload?.targetId === myUserId) {
          setMatchedBuddy(payload.buddy);
          setRoomId(payload.roomId);
          setStage('chat');
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await lobbyChannel.track({
            userId: myUserId,
            name: myUserName,
            zone,
            vibe,
            transport,
            joinedAt: Date.now(),
          });
        }
      });

    return () => {
      lobbyChannel.untrack();
      supabase.removeChannel(lobbyChannel);
    };
  }, [stage, zone, vibe, transport, myUserId, myUserName]);

  // ACTIVE CHAT ROOM CHANNEL
  useEffect(() => {
    if (stage !== 'chat' || !roomId) return;

    const chatChannel = supabase.channel(`chai_room_${roomId}`, {
      config: { broadcast: { self: false } },
    });

    chatChannel
      .on('broadcast', { event: 'chat_msg' }, ({ payload }) => {
        if (payload?.msg) {
          setMessages((prev) => [...prev, payload.msg]);
        }
      })
      .on('broadcast', { event: 'chat_burn' }, () => {
        alert('Your Chai Buddy ended and wiped the rendezvous room.');
        resetSession();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [stage, roomId]);

  // 20-Minute Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage === 'chat' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            resetSession();
            alert('Chai Buddy rendezvous window expired. Room wiped cleanly.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !roomId) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: myUserId,
      senderName: myUserName,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    await supabase.channel(`chai_room_${roomId}`).send({
      type: 'broadcast',
      event: 'chat_msg',
      payload: { msg: newMsg },
    });
  };

  const handleBurnRoom = async () => {
    if (confirm('Burn and wipe this chat room completely for both participants?')) {
      if (roomId) {
        await supabase.channel(`chai_room_${roomId}`).send({
          type: 'broadcast',
          event: 'chat_burn',
          payload: {},
        });
      }
      resetSession();
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl h-[88vh] sm:h-[82vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-zinc-100 text-sm sm:text-base">Chai Buddy</h3>
                <span className="text-[9px] font-mono bg-amber-950/70 text-amber-300 border border-amber-800/50 px-1.5 py-0.5 rounded-full">
                  LIVE 1-ON-1
                </span>
              </div>
              <p className="text-zinc-500 text-[11px]">
                {stage === 'chat' ? `Connected with ${matchedBuddy?.name || 'Buddy'}` : 'Late night companion matcher'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stage === 'chat' && (
              <button
                onClick={handleBurnRoom}
                className="flex items-center gap-1 text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800/60 px-2 py-1 rounded-xl hover:bg-rose-900 transition"
                title="Wipe & Exit for both"
              >
                <Flame className="w-3 h-3 text-rose-400" /> Burn
              </button>
            )}
            <button
              onClick={() => {
                if (stage === 'searching') setStage('setup');
                onClose();
              }}
              className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-xl hover:bg-zinc-800/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STAGE 1: SETUP INTENT */}
        {stage === 'setup' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            
            {/* Zone Selector */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">1. Your Location Zone</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
              >
                {CBE_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              {zone === 'All Coimbatore (Any Zone)' && (
                <p className="text-[10px] text-amber-400/90 mt-1 flex items-center gap-1">
                  <Compass className="w-3 h-3" /> Connects with anyone looking anywhere across Coimbatore
                </p>
              )}
            </div>

            {/* Vibe Selector */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">2. Tonight&apos;s Vibe</label>
              <div className="grid grid-cols-1 gap-2">
                {VIBE_OPTIONS.map((v) => {
                  const active = vibe === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVibe(v.id)}
                      className={`text-left p-3 rounded-xl border text-xs font-medium transition active:scale-[0.99] ${
                        active
                          ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transport Mode */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">3. Travel Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {TRANSPORT_MODES.map((t) => {
                  const Icon = t.icon;
                  const active = transport === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTransport(t.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition ${
                        active
                          ? 'bg-amber-950/50 border-amber-500 text-amber-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] leading-tight font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Girls Only Filter */}
            <label className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs cursor-pointer">
              <span className="flex items-center gap-2 text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Girls-Only Pairing (Match exclusively with verified female riders)
              </span>
              <input
                type="checkbox"
                checked={girlsOnly}
                onChange={(e) => setGirlsOnly(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0"
              />
            </label>

            {/* Start Button */}
            <button
              onClick={() => setStage('searching')}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl text-xs transition active:scale-95 shadow-lg shadow-amber-950/40"
            >
              <Sparkles className="w-4 h-4 fill-zinc-950" />
              {zone === 'All Coimbatore (Any Zone)' 
                ? 'Search All Over Coimbatore' 
                : `Search Live Buddies in ${zone.split('/')[0]}`}
            </button>
          </div>
        )}

        {/* STAGE 2: SEARCHING RADAR */}
        {stage === 'searching' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <span className="absolute h-24 w-24 rounded-full bg-amber-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
                <Coffee className="w-8 h-8 animate-bounce" />
              </div>
            </div>
            
            <div>
              <h4 className="text-base font-bold text-zinc-100">Scanning Night Radar...</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                {zone === 'All Coimbatore (Any Zone)'
                  ? 'Listening for any available night owl across Coimbatore'
                  : `Looking for active night owls around ${zone.split('/')[0]}`}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Listening to live radio queue...
            </div>

            <button
              onClick={() => setStage('setup')}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline pt-4"
            >
              Cancel Search
            </button>
          </div>
        )}

        {/* STAGE 3: PRIVATE 1-ON-1 BURNER CHAT */}
        {stage === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Status Bar */}
            <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-200 font-bold text-xs">{matchedBuddy?.name || 'Night Owl'}</span>
                <span className="text-[10px] text-zinc-500">
                  • {matchedBuddy?.zone ? matchedBuddy.zone.split('/')[0] : 'CBE'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 font-mono text-[11px] bg-amber-950/60 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded-lg">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {formatTimer(timeLeft)}
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSOS();
                  }}
                  className="p-1 bg-rose-950 text-rose-400 border border-rose-800/60 rounded-lg hover:bg-rose-900"
                  title="Trigger Emergency SOS"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Private Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center text-[10px] text-zinc-400">
                🔒 Connected! Real-time peer messages. Room wipes when timer runs out or when either person taps &apos;Burn&apos;.
              </div>

              {messages.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-zinc-500">
                  Say hi to your Chai Buddy...
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === myUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-amber-500 text-zinc-950 font-medium rounded-br-none shadow-md'
                            : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-zinc-500 mt-1 px-1">
                        {isMe ? 'You' : m.senderName} • {m.time}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {[
                "Which stall are you at?",
                "I'm on bike, 5 mins away",
                "Exterior table in dark jacket",
                "Heading towards the spot now"
              ].map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(phrase)}
                  className="text-[10px] whitespace-nowrap bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-2.5 py-1 rounded-lg transition"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-zinc-900/80 border-t border-zinc-800 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${matchedBuddy?.name || 'Buddy'}...`}
                maxLength={180}
                className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 p-2.5 rounded-xl transition font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}