'use client';

import { useState, useEffect, useRef } from 'react';
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
  User, 
  Footprints,
  MessageCircle,
  AlertTriangle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSOS: () => void;
}

const CBE_ZONES = [
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
  sender: 'me' | 'buddy';
  text: string;
  time: string;
}

export default function ChaiBuddyModal({ isOpen, onClose, onOpenSOS }: Props) {
  // Steps: 'setup' -> 'searching' -> 'chat'
  const [stage, setStage] = useState<'setup' | 'searching' | 'chat'>('setup');
  
  // Setup preferences
  const [zone, setZone] = useState(CBE_ZONES[0]);
  const [vibe, setVibe] = useState(VIBE_OPTIONS[0].id);
  const [transport, setTransport] = useState(TRANSPORT_MODES[0].id);
  const [girlsOnly, setGirlsOnly] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60); // 20 minutes countdown in seconds
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Clean room on close or burn
  const resetSession = () => {
    setStage('setup');
    setMessages([]);
    setTimeLeft(20 * 60);
    localStorage.removeItem('after10_chai_buddy_chat');
  };

  // Handle active session persistence
  useEffect(() => {
    const saved = localStorage.getItem('after10_chai_buddy_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.messages && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          setStage('chat');
        }
      } catch (err) {
        console.warn('Could not restore chat', err);
      }
    }
  }, []);

  // 20-Minute Countdown Loop during chat
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage === 'chat' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            resetSession();
            alert('Chai Buddy 20-minute rendezvous window expired. Chat wiped cleanly.');
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

  // Start Searching & Matchmaker Simulator
  const handleStartSearch = () => {
    setStage('searching');

    // Simulate match connection after 3.5 seconds
    setTimeout(() => {
      const initialMessages: ChatMessage[] = [
        {
          id: 'msg_1',
          sender: 'buddy',
          text: `Hey! Also down for ${VIBE_OPTIONS.find(v => v.id === vibe)?.label.split(' ')[1] || 'chai'}. Where are you heading around ${zone.split('/')[0]}?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ];

      setMessages(initialMessages);
      setStage('chat');
      localStorage.setItem('after10_chai_buddy_chat', JSON.stringify({ messages: initialMessages, zone }));
    }, 3500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText('');
    localStorage.setItem('after10_chai_buddy_chat', JSON.stringify({ messages: updated, zone }));

    // Simulated responsive peer answer
    setTimeout(() => {
      const buddyReplies = [
        "Sounds good! Which spot are you thinking?",
        "I'm 5 mins away on bike, tell me where to park.",
        "Wearing a dark hoodie, see you there at the counter.",
        "Done. Let's grab it quick."
      ];
      const randomReply = buddyReplies[Math.floor(Math.random() * buddyReplies.length)];

      const buddyMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'buddy',
        text: randomReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => {
        const next = [...prev, buddyMsg];
        localStorage.setItem('after10_chai_buddy_chat', JSON.stringify({ messages: next, zone }));
        return next;
      });
    }, 1800);
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
                  1-ON-1
                </span>
              </div>
              <p className="text-zinc-500 text-[11px]">
                {stage === 'chat' ? 'Private Burner Rendezvous' : 'Late night companion matcher'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stage === 'chat' && (
              <button
                onClick={() => {
                  if (confirm('Burn and wipe this chat room completely?')) resetSession();
                }}
                className="flex items-center gap-1 text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800/60 px-2 py-1 rounded-xl hover:bg-rose-900 transition"
                title="Wipe & Exit"
              >
                <Flame className="w-3 h-3 text-rose-400" /> Burn
              </button>
            )}
            <button
              onClick={onClose}
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
              onClick={handleStartSearch}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl text-xs transition active:scale-95 shadow-lg shadow-amber-950/40"
            >
              <Sparkles className="w-4 h-4 fill-zinc-950" />
              Find Chai Buddy in My Zone
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
                Looking for active night owls around <span className="text-amber-400 font-medium">{zone}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {girlsOnly ? 'Filtering: Girls Only' : 'Searching all riders'}
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
            
            {/* Rendezvous Status & Countdown Bar */}
            <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-200 font-semibold text-xs">Buddy Matched</span>
                <span className="text-[10px] text-zinc-500">• {zone.split('/')[0]}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 font-mono text-[11px] bg-amber-950/60 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded-lg">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {formatTimer(timeLeft)}
                </div>

                {/* Emergency Panic SOS bail inside match */}
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
              <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center text-[11px] text-zinc-400 mb-2">
                🔒 Private 1-on-1 burner room. Decide where to meet. Chat self-destructs when timer hits zero or you tap &apos;Burn&apos;.
              </div>

              {messages.map((m) => {
                const isMe = m.sender === 'me';
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
                    <span className="text-[9px] text-zinc-500 mt-1 px-1">{m.time}</span>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Icebreaker Suggestions */}
            <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                "Which stall are you at?",
                "I'm on bike, 5 mins away",
                "Exterior table in black jacket",
                "Finished & headed home"
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
            <form onSubmit={handleSendMessage} className="p-3 bg-zinc-900/80 border-t border-zinc-800 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Coordinate meetup or tea spot..."
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