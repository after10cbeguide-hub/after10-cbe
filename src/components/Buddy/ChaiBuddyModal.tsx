'use client';

import { useState, useEffect, useRef } from 'react';
import { VibeProfile, VibeMessage } from '@/types';
import { supabase } from '@/lib/supabase';
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
  ArrowLeft,
  Loader2,
  Radar,
  MapPin,
  UserPlus,
  Check,
  ShieldAlert
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSOS?: () => void;
  currentUser?: { id?: string; name?: string; email?: string } | null;
}

interface NearbyUser {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  angleDeg: number; // for plotting on the radar HUD
  updatedAt: number;
}

// Haversine formula to compute exact distance in meters between two GPS points
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Compute bearing angle (0-360) for plotting blips on the radar
function getBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export default function ChaiBuddyModal({ isOpen, onClose, currentUser }: Props) {
  // Top-level mode: 'select' (2 options) -> 'music' | 'nearby'
  const [mode, setMode] = useState<'select' | 'music' | 'nearby'>('select');

  // Navigation inside Music Match & Shared Chat: 'create' -> 'discover' -> 'chat'
  const [step, setStep] = useState<'create' | 'discover' | 'chat'>('create');

  // Mandatory 3-second radar scanner state
  const [isScanning, setIsScanning] = useState(false);

  // User's own vibe profile inputs (Music Match)
  const [favoriteSong, setFavoriteSong] = useState('');
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [mindDialogue, setMindDialogue] = useState('');
  const [craving, setCraving] = useState('');
  const [vibeRule, setVibeRule] = useState('Chill listener, zero awkwardness');
  const [myProfile, setMyProfile] = useState<VibeProfile | null>(null);

  // Music Match Deck
  const [profiles, setProfiles] = useState<VibeProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Shared 1-on-1 Chat Partner (works for both Music Match & 50m Nearby)
  const [chatPartner, setChatPartner] = useState<{ id: string; name: string; source: 'music' | 'nearby' } | null>(null);
  const [chatMessages, setChatMessages] = useState<VibeMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');

  // Nearby 50m Radar States
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [selectedNearbyUser, setSelectedNearbyUser] = useState<NearbyUser | null>(null);
  const [outgoingRequestTo, setOutgoingRequestTo] = useState<string | null>(null);
  const [incomingNearbyRequest, setIncomingNearbyRequest] = useState<{ id: string; name: string } | null>(null);

  // Stable session identifier
  const deviceSessionId = useRef<string>(
    currentUser?.id || `user_${Math.random().toString(36).substring(2, 9)}`
  );
  const myUserName = currentUser?.name || `Owl #${deviceSessionId.current.slice(-3).toUpperCase()}`;

  // Realtime Supabase Channel references
  const channelRef = useRef<any>(null);
  const nearbyChannelRef = useRef<any>(null);

  // Reset to Mode Selection whenever modal opens fresh
  useEffect(() => {
    if (isOpen) {
      setMode('select');
      setStep('create');
      setSelectedNearbyUser(null);
      setOutgoingRequestTo(null);
      setIncomingNearbyRequest(null);
    }
  }, [isOpen]);

  // 1. Music Match + Private Chat Channel
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase.channel('cbe-night-vibes', {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'vibe_card' }, ({ payload }) => {
      const incoming: VibeProfile = payload;
      if (incoming && incoming.id !== deviceSessionId.current) {
        setProfiles((prev) => {
          const exists = prev.some((p) => p.id === incoming.id);
          return exists ? prev.map((p) => (p.id === incoming.id ? incoming : p)) : [...prev, incoming];
        });
      }
    });

    channel.on('broadcast', { event: 'vibe_match' }, ({ payload }) => {
      const { from, to } = payload;
      if (to.id === deviceSessionId.current) {
        setChatPartner({ id: from.id, name: from.name, source: 'music' });
        setChatMessages([
          {
            id: `sys_${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            text: `${from.name} matched your music vibe! You're both connected.`,
            timestamp: Date.now(),
          },
        ]);
        setMode('music');
        setStep('chat');
      }
    });

    channel.on('broadcast', { event: 'vibe_message' }, ({ payload }) => {
      const { message, targetUserId } = payload;
      if (targetUserId === deviceSessionId.current) {
        setChatMessages((prev) => [...prev, message]);
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isOpen]);

  // 2. Nearby 50-Meter GPS Radar Presence & Chat Handshake
  useEffect(() => {
    if (!isOpen || mode !== 'nearby') return;

    setGpsError(null);
    let watchId: number | null = null;

    if (!('geolocation' in navigator)) {
      setGpsError('GPS is not supported on this browser.');
      return;
    }

    const nearbyChannel = supabase.channel('cbe-nearby-50m', {
      config: {
        presence: { key: deviceSessionId.current },
        broadcast: { self: false },
      },
    });

    // Sync users within 50m radius from Presence state
    const syncNearbyPresence = (currentLat: number, currentLng: number) => {
      const state = nearbyChannel.presenceState();
      const detected: NearbyUser[] = [];

      Object.entries(state).forEach(([key, presences]) => {
        if (key === deviceSessionId.current) return;
        const latest: any = Array.isArray(presences) ? presences[presences.length - 1] : null;
        if (!latest || typeof latest.lat !== 'number' || typeof latest.lng !== 'number') return;

        const dist = getDistanceMeters(currentLat, currentLng, latest.lat, latest.lng);
        if (dist <= 50) {
          detected.push({
            id: key,
            name: latest.name || 'Night Owl',
            lat: latest.lat,
            lng: latest.lng,
            distanceMeters: dist,
            angleDeg: getBearingDeg(currentLat, currentLng, latest.lat, latest.lng),
            updatedAt: latest.updatedAt || Date.now(),
          });
        }
      });

      setNearbyUsers(detected);
    };

    nearbyChannel
      .on('presence', { event: 'sync' }, () => {
        setMyCoords((prev) => {
          if (prev) syncNearbyPresence(prev.lat, prev.lng);
          return prev;
        });
      })
      .on('broadcast', { event: 'nearby_chat_request' }, ({ payload }) => {
        const { fromId, fromName, toId } = payload;
        if (toId === deviceSessionId.current) {
          setIncomingNearbyRequest({ id: fromId, name: fromName });
        }
      })
      .on('broadcast', { event: 'nearby_chat_accept' }, ({ payload }) => {
        const { fromId, fromName, toId } = payload;
        if (toId === deviceSessionId.current) {
          setOutgoingRequestTo(null);
          setChatPartner({ id: fromId, name: fromName, source: 'nearby' });
          setChatMessages([
            {
              id: `sys_${Date.now()}`,
              senderId: 'system',
              senderName: 'System',
              text: `${fromName} accepted your 50m radar request! Say hi.`,
              timestamp: Date.now(),
            },
          ]);
          setStep('chat');
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          watchId = navigator.geolocation.watchPosition(
            async (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setMyCoords({ lat, lng });

              await nearbyChannel.track({
                name: myUserName,
                lat,
                lng,
                updatedAt: Date.now(),
              });
              syncNearbyPresence(lat, lng);
            },
            (err) => {
              setGpsError(
                err.code === 1
                  ? 'Location permission denied. Allow GPS access to scan 50m radius.'
                  : 'Unable to lock GPS signal. Move outdoors or check device location.'
              );
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
          );
        }
      });

    nearbyChannelRef.current = nearbyChannel;

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (nearbyChannelRef.current) {
        supabase.removeChannel(nearbyChannelRef.current);
      }
    };
  }, [isOpen, mode, myUserName]);

  if (!isOpen) return null;

  // Music Match: Save & Go Live -> Mandatory 3-second search
  const handleSaveVibe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!favoriteSong.trim() || !favoriteArtist.trim()) return;

    const profileData: VibeProfile = {
      id: deviceSessionId.current,
      name: myUserName,
      favoriteSong: favoriteSong.trim(),
      favoriteArtist: favoriteArtist.trim(),
      mindDialogue: mindDialogue.trim(),
      craving: craving.trim(),
      vibeRule,
      isLive: true,
      updatedAt: Date.now(),
    };

    setMyProfile(profileData);

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'vibe_card',
        payload: profileData,
      });
    }

    setStep('discover');
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 3000);
  };

  const currentCard = profiles.length > 0 ? profiles[currentIndex] : null;

  const handleNext = () => {
    if (profiles.length === 0) return;
    setIsScanning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < profiles.length - 1 ? prev + 1 : 0));
      setIsScanning(false);
    }, 3000);
  };

  const handleConnectMusic = async () => {
    if (!currentCard || !myProfile) return;
    setChatPartner({ id: currentCard.id, name: currentCard.name, source: 'music' });

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'vibe_match',
        payload: {
          from: myProfile,
          to: currentCard,
        },
      });
    }

    setChatMessages([
      {
        id: `sys_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        text: `Connected with ${currentCard.name}! Say hi.`,
        timestamp: Date.now(),
      },
    ]);
    setStep('chat');
  };

  // Nearby 50m: Send Chat Request
  const handleSendNearbyRequest = async (target: NearbyUser) => {
    setOutgoingRequestTo(target.id);
    if (nearbyChannelRef.current) {
      await nearbyChannelRef.current.send({
        type: 'broadcast',
        event: 'nearby_chat_request',
        payload: {
          fromId: deviceSessionId.current,
          fromName: myUserName,
          toId: target.id,
        },
      });
    }
  };

  // Nearby 50m: Accept Incoming Request
  const handleAcceptNearbyRequest = async () => {
    if (!incomingNearbyRequest) return;
    const partner = incomingNearbyRequest;
    setIncomingNearbyRequest(null);

    if (nearbyChannelRef.current) {
      await nearbyChannelRef.current.send({
        type: 'broadcast',
        event: 'nearby_chat_accept',
        payload: {
          fromId: deviceSessionId.current,
          fromName: myUserName,
          toId: partner.id,
        },
      });
    }

    setChatPartner({ id: partner.id, name: partner.name, source: 'nearby' });
    setChatMessages([
      {
        id: `sys_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        text: `Connected with ${partner.name} (within 50m)! Say hi.`,
        timestamp: Date.now(),
      },
    ]);
    setStep('chat');
  };

  // Send 1-on-1 Chat Message (shared for both modes)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !chatPartner) return;

    const newMsg: VibeMessage = {
      id: `msg_${Date.now()}`,
      senderId: deviceSessionId.current,
      senderName: myUserName,
      text: messageInput.trim(),
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setMessageInput('');

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'vibe_message',
        payload: {
          message: newMsg,
          targetUserId: chatPartner.id,
        },
      });
    }
  };

  const handleBackNavigation = () => {
    if (step === 'chat') {
      setStep(mode === 'music' ? 'discover' : 'create');
      setChatPartner(null);
    } else if (mode !== 'select') {
      setMode('select');
      setStep('create');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            {(mode !== 'select' || step === 'chat') && (
              <button
                type="button"
                onClick={handleBackNavigation}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              {step === 'chat' ? (
                <MessageCircle className="w-4 h-4" />
              ) : mode === 'nearby' ? (
                <Radar className="w-4 h-4 text-emerald-400 animate-spin" />
              ) : (
                <Radio className="w-4 h-4 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm sm:text-base flex items-center gap-1.5">
                {step === 'chat'
                  ? `Chat with ${chatPartner?.name || 'Buddy'}`
                  : mode === 'select'
                  ? 'Midnight Buddy Finder'
                  : mode === 'nearby'
                  ? '50m Proximity Radar'
                  : step === 'create'
                  ? 'Music & Vibe Match'
                  : 'Live Frequency Radar'}
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-zinc-500 text-[11px]">
                {step === 'chat'
                  ? 'Encrypted private 1-on-1 connection'
                  : mode === 'select'
                  ? 'Choose how you want to connect tonight'
                  : mode === 'nearby'
                  ? 'Scanning active night owls within 50 meters'
                  : step === 'create'
                  ? 'Match by song loop, artist & midnight mood'
                  : 'Realtime frequency match across Coimbatore'}
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

          {/* MODE 0: TWO-OPTION LANDING SELECTOR */}
          {mode === 'select' && step !== 'chat' && (
            <div className="space-y-3 py-2">
              {/* Option 1: Music Match */}
              <button
                type="button"
                onClick={() => {
                  setMode('music');
                  setStep('create');
                }}
                className="w-full text-left p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition group relative overflow-hidden active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 group-hover:scale-105 transition-transform">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        City-Wide Frequency
                      </span>
                      <h4 className="font-bold text-zinc-100 text-sm mt-0.5">Music &amp; Vibe Match</h4>
                      <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                        Broadcast the song on your loop, your favorite artist, and midnight cravings to pair with someone on the same wavelength.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                </div>
              </button>

              {/* Option 2: Find Nearby (50m Radar) */}
              <button
                type="button"
                onClick={() => {
                  setMode('nearby');
                  setStep('create');
                }}
                className="w-full text-left p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition group relative overflow-hidden active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 group-hover:scale-105 transition-transform">
                      <Radar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          50m Live GPS Radar
                        </span>
                      </div>
                      <h4 className="font-bold text-zinc-100 text-sm mt-0.5">Find Nearby (50m Radius)</h4>
                      <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                        Scan your immediate 50-meter surroundings at a chai kadai or turf. Tap a radar blip to send a private chat request.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                </div>
              </button>
            </div>
          )}

          {/* MODE 1: MUSIC MATCH (STEP 1 - CREATE VIBE FORM) */}
          {mode === 'music' && step === 'create' && (
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
                  placeholder="e.g. Kanave Kanave, Interstellar Theme..."
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
                  placeholder="e.g. Evanukkum bayapada koodathu..."
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
                  placeholder="e.g. Hot tea, bypass ride, quiet chill spot..."
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
                  <option value="Late night deep philosophy">Deep talks &amp; life philosophy</option>
                  <option value="High energy roast & banter">Roast, funny banter &amp; laughs</option>
                  <option value="Silent companion">Silent companion (comfortable quiet)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-amber-950/30 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" /> Save My Vibe &amp; Go Live
              </button>
            </form>
          )}

          {/* MODE 1: MUSIC MATCH (STEP 2 - DISCOVER DECK) */}
          {mode === 'music' && step === 'discover' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1"></span>
                  Active on Radar ({profiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => setStep('create')}
                  className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
                >
                  <Edit3 className="w-3 h-3" /> Edit My Vibe
                </button>
              </div>

              {isScanning ? (
                <div className="h-64 border border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3 bg-zinc-900/30">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-14 h-14 rounded-full bg-amber-500/10 animate-ping"></span>
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-amber-500/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-zinc-200 text-sm">Matching Midnight Frequencies...</h4>
                  <p className="text-zinc-500 text-[11px] max-w-xs">
                    Scanning songs, dialogues, and late-night vibes across Coimbatore...
                  </p>
                </div>
              ) : currentCard ? (
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
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs transition active:scale-95"
                    >
                      See Next <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleConnectMusic}
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
                    Your profile is broadcasted live! As soon as another user clicks &apos;Save My Vibe&apos;, their card will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: FIND NEARBY (50-METER RADIUS RADAR) */}
          {mode === 'nearby' && step !== 'chat' && (
            <div className="space-y-3">
              {/* Incoming Chat Request Banner */}
              {incomingNearbyRequest && (
                <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                      Incoming Nearby Ping
                    </span>
                    <p className="text-xs text-zinc-100 font-semibold">
                      {incomingNearbyRequest.name} wants to chat!
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIncomingNearbyRequest(null)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-[11px] font-medium"
                    >
                      Ignore
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptNearbyRequest}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                  </div>
                </div>
              )}

              {/* GPS Error or Lock Status */}
              {gpsError ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-2">
                  <ShieldAlert className="w-6 h-6 text-rose-400 mx-auto" />
                  <p className="text-rose-200 text-xs font-medium">{gpsError}</p>
                </div>
              ) : (
                <>
                  {/* Circular 50-Meter Radar HUD */}
                  <div className="relative w-60 h-60 mx-auto my-1 rounded-full bg-zinc-900/90 border border-emerald-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.12)]">
                    {/* Concentric Distance Rings (25m & 50m) */}
                    <div className="absolute w-28 h-28 rounded-full border border-emerald-500/25" />
                    <div className="absolute w-52 h-52 rounded-full border border-dashed border-emerald-500/20" />
                    <span className="absolute top-2 text-[9px] font-mono text-emerald-500/70">50m</span>
                    <span className="absolute top-14 text-[9px] font-mono text-emerald-500/60">25m</span>

                    {/* Crosshairs */}
                    <div className="absolute w-full h-[1px] bg-emerald-500/15" />
                    <div className="absolute h-full w-[1px] bg-emerald-500/15" />

                    {/* Rotating Radar Sweep */}
                    <div
                      className="absolute inset-0 rounded-full animate-spin"
                      style={{
                        animationDuration: '4s',
                        background:
                          'conic-gradient(from 0deg, rgba(16, 185, 129, 0.28) 0deg, rgba(16, 185, 129, 0) 75deg)',
                      }}
                    />

                    {/* Center Pin (You) */}
                    <div className="relative z-10 flex flex-col items-center">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/30 shadow-lg" />
                      <span className="text-[9px] font-bold text-emerald-300 mt-1 bg-zinc-950/80 px-1.5 rounded">
                        YOU
                      </span>
                    </div>

                    {/* Plotted Nearby Users within 50m */}
                    {nearbyUsers.map((u) => {
                      // Map distance (0..50m) to radius (18px..100px)
                      const radiusPx = Math.max(22, Math.min(98, (u.distanceMeters / 50) * 98));
                      const rad = (u.angleDeg * Math.PI) / 180;
                      const x = Math.sin(rad) * radiusPx;
                      const y = -Math.cos(rad) * radiusPx;
                      const isSelected = selectedNearbyUser?.id === u.id;

                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedNearbyUser(u)}
                          style={{ transform: `translate(${x}px, ${y}px)` }}
                          className="absolute z-20 flex flex-col items-center group focus:outline-none"
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-amber-400 ring-4 ring-amber-400/40 scale-125'
                                : 'bg-emerald-400 ring-4 ring-emerald-400/30 animate-pulse group-hover:scale-125'
                            }`}
                          />
                          <span className="mt-1 px-1.5 py-0.5 rounded bg-zinc-950/90 border border-zinc-800 text-[9px] font-semibold text-zinc-100 whitespace-nowrap shadow">
                            {u.name} • {u.distanceMeters}m
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Radar Status Bar */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {myCoords ? 'GPS Locked • 50m Radius' : 'Locking GPS signal...'}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      {nearbyUsers.length} {nearbyUsers.length === 1 ? 'Owl' : 'Owls'} Nearby
                    </span>
                  </div>

                  {/* Nearby Users List & Request Action */}
                  {nearbyUsers.length === 0 ? (
                    <div className="p-3.5 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-500 text-[11px]">
                      No active night owls detected within 50m right now. Keep radar open—blips appear live when someone enters your radius.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-0.5">
                      {nearbyUsers.map((u) => {
                        const isPending = outgoingRequestTo === u.id;
                        return (
                          <div
                            key={u.id}
                            onClick={() => setSelectedNearbyUser(u)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                              selectedNearbyUser?.id === u.id
                                ? 'bg-zinc-900 border-emerald-500/60'
                                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div>
                              <h5 className="font-bold text-zinc-100 text-xs">{u.name}</h5>
                              <p className="text-[10px] text-emerald-400 font-mono">
                                ~{u.distanceMeters} meters away
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendNearbyRequest(u);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition active:scale-95 ${
                                isPending
                                  ? 'bg-zinc-800 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                              }`}
                            >
                              {isPending ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" /> Requested
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5" /> Request Chat
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 3: SHARED 1-ON-1 PRIVATE CHAT */}
          {step === 'chat' && chatPartner && (
            <div className="flex flex-col h-[380px] justify-between">
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 pb-2">
                {chatMessages.map((msg) => {
                  const isMe = msg.senderId === deviceSessionId.current;
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
                        {isMe ? 'You' : chatPartner.name}
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
                  placeholder={`Message ${chatPartner.name}...`}
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