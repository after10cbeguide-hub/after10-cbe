'use client';

import { useState, useEffect, useRef } from 'react';
import { VibeMessage } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  X,
  Radar,
  MapPin,
  UserPlus,
  Check,
  ShieldAlert,
  Send,
  MessageCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBackToMenu: () => void;
  currentUser?: { id?: string; name?: string; email?: string } | null;
}

interface NearbyUser {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  angleDeg: number;
  updatedAt: number;
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

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

export default function NearbyRadarModal({ isOpen, onClose, onBackToMenu, currentUser }: Props) {
  const [step, setStep] = useState<'radar' | 'chat'>('radar');
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [outgoingRequestTo, setOutgoingRequestTo] = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<{ id: string; name: string } | null>(null);

  // Dedicated 1-on-1 Chat state
  const [chatPartner, setChatPartner] = useState<{ id: string; name: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<VibeMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');

  const deviceSessionId = useRef<string>(
    currentUser?.id || `owl_${Math.random().toString(36).substring(2, 9)}`
  );
  const myUserName = currentUser?.name || `Owl #${deviceSessionId.current.slice(-3).toUpperCase()}`;
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    setStep('radar');
    setGpsError(null);
    setSelectedUser(null);
    setOutgoingRequestTo(null);
    setIncomingRequest(null);
    setChatPartner(null);

    if (!('geolocation' in navigator)) {
      setGpsError('GPS is not supported on this browser.');
      return;
    }

    let watchId: number | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    const latestCoordsRef = { lat: 0, lng: 0, ready: false };
    const peerCoordsMap = new Map<string, { name: string; lat: number; lng: number; updatedAt: number }>();

    const rebuildNearbyList = () => {
      if (!latestCoordsRef.ready) return;
      const detected: NearbyUser[] = [];

      peerCoordsMap.forEach((peer, key) => {
        if (key === deviceSessionId.current) return;
        if (Date.now() - peer.updatedAt > 60000) return;

        const rawDist = getDistanceMeters(latestCoordsRef.lat, latestCoordsRef.lng, peer.lat, peer.lng);
        if (rawDist <= 150) {
          detected.push({
            id: key,
            name: peer.name,
            lat: peer.lat,
            lng: peer.lng,
            distanceMeters: Math.min(50, rawDist),
            angleDeg: getBearingDeg(latestCoordsRef.lat, latestCoordsRef.lng, peer.lat, peer.lng),
            updatedAt: peer.updatedAt,
          });
        }
      });

      setNearbyUsers(detected);
    };

    const channel = supabase.channel('cbe-nearby-50m-v2', {
      config: {
        presence: { key: deviceSessionId.current },
        broadcast: { self: false },
      },
    });

    const broadcastLocation = async () => {
      if (!latestCoordsRef.ready || !channelRef.current) return;
      await channelRef.current.send({
        type: 'broadcast',
        event: 'nearby_ping',
        payload: {
          id: deviceSessionId.current,
          name: myUserName,
          lat: latestCoordsRef.lat,
          lng: latestCoordsRef.lng,
        },
      });
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        Object.entries(state).forEach(([key, presences]) => {
          if (key === deviceSessionId.current) return;
          const latest: any = Array.isArray(presences) ? presences[presences.length - 1] : null;
          if (latest && typeof latest.lat === 'number') {
            peerCoordsMap.set(key, {
              name: latest.name || 'Night Owl',
              lat: latest.lat,
              lng: latest.lng,
              updatedAt: latest.updatedAt || Date.now(),
            });
          }
        });
        rebuildNearbyList();
      })
      .on('broadcast', { event: 'nearby_ping' }, ({ payload }) => {
        if (!payload || payload.id === deviceSessionId.current) return;
        peerCoordsMap.set(payload.id, {
          name: payload.name || 'Night Owl',
          lat: payload.lat,
          lng: payload.lng,
          updatedAt: Date.now(),
        });
        rebuildNearbyList();
      })
      .on('broadcast', { event: 'nearby_request' }, ({ payload }) => {
        if (payload.toId === deviceSessionId.current) {
          setIncomingRequest({ id: payload.fromId, name: payload.fromName });
        }
      })
      .on('broadcast', { event: 'nearby_accept' }, ({ payload }) => {
        if (payload.toId === deviceSessionId.current) {
          setOutgoingRequestTo(null);
          setChatPartner({ id: payload.fromId, name: payload.fromName });
          setChatMessages([
            {
              id: `sys_${Date.now()}`,
              senderId: 'system',
              senderName: 'System',
              text: `${payload.fromName} accepted your request! You're connected.`,
              timestamp: Date.now(),
            },
          ]);
          setStep('chat');
        }
      })
      .on('broadcast', { event: 'nearby_message' }, ({ payload }) => {
        if (payload.targetUserId === deviceSessionId.current) {
          setChatMessages((prev) => [...prev, payload.message]);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          const handlePos = async (pos: GeolocationPosition) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            latestCoordsRef.lat = lat;
            latestCoordsRef.lng = lng;
            latestCoordsRef.ready = true;
            setMyCoords({ lat, lng });
            setGpsError(null);

            await channel.track({
              name: myUserName,
              lat,
              lng,
              updatedAt: Date.now(),
            });
            await broadcastLocation();
            rebuildNearbyList();
          };

          navigator.geolocation.getCurrentPosition(handlePos, () => {}, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 30000,
          });

          watchId = navigator.geolocation.watchPosition(
            handlePos,
            (err) => {
              if (!latestCoordsRef.ready) {
                setGpsError(
                  err.code === 1
                    ? 'Location permission denied. Enable GPS in browser settings.'
                    : 'Waiting for GPS signal... Turn on device Location.'
                );
              }
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
          );

          heartbeatInterval = setInterval(() => {
            broadcastLocation();
            rebuildNearbyList();
          }, 3000);
        }
      });

    channelRef.current = channel;

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isOpen, myUserName]);

  if (!isOpen) return null;

  const handleSendRequest = async (target: NearbyUser) => {
    setOutgoingRequestTo(target.id);
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'nearby_request',
        payload: {
          fromId: deviceSessionId.current,
          fromName: myUserName,
          toId: target.id,
        },
      });
    }
  };

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;
    const partner = incomingRequest;
    setIncomingRequest(null);

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'nearby_accept',
        payload: {
          fromId: deviceSessionId.current,
          fromName: myUserName,
          toId: partner.id,
        },
      });
    }

    setChatPartner({ id: partner.id, name: partner.name });
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
        event: 'nearby_message',
        payload: {
          message: newMsg,
          targetUserId: chatPartner.id,
        },
      });
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => (step === 'chat' ? setStep('radar') : onBackToMenu())}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              {step === 'chat' ? (
                <MessageCircle className="w-4 h-4" />
              ) : (
                <Radar className="w-4 h-4 animate-spin" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm sm:text-base">
                {step === 'chat' ? `Chat with ${chatPartner?.name}` : '50m Proximity Radar'}
              </h3>
              <p className="text-zinc-500 text-[11px]">
                {step === 'chat'
                  ? 'Private 1-on-1 nearby connection'
                  : 'Scanning active night owls within 50 meters'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-xl hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto pr-1 py-3 text-xs flex-1 flex flex-col justify-between">
          {step === 'radar' ? (
            <div className="space-y-3">
              {/* Incoming Request Banner */}
              {incomingRequest && (
                <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                      Incoming Nearby Ping
                    </span>
                    <p className="text-xs text-zinc-100 font-semibold">
                      {incomingRequest.name} wants to chat!
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIncomingRequest(null)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-[11px]"
                    >
                      Ignore
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptRequest}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                  </div>
                </div>
              )}

              {gpsError ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-2">
                  <ShieldAlert className="w-6 h-6 text-rose-400 mx-auto" />
                  <p className="text-rose-200 text-xs font-medium">{gpsError}</p>
                </div>
              ) : (
                <>
                  {/* Circular 50-Meter Radar HUD */}
                  <div className="relative w-60 h-60 mx-auto my-1 rounded-full bg-zinc-900/90 border border-emerald-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.12)]">
                    <div className="absolute w-28 h-28 rounded-full border border-emerald-500/25" />
                    <div className="absolute w-52 h-52 rounded-full border border-dashed border-emerald-500/20" />
                    <span className="absolute top-2 text-[9px] font-mono text-emerald-500/70">50m</span>
                    <span className="absolute top-14 text-[9px] font-mono text-emerald-500/60">25m</span>

                    <div className="absolute w-full h-[1px] bg-emerald-500/15" />
                    <div className="absolute h-full w-[1px] bg-emerald-500/15" />

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

                    {/* Plotted Nearby Users */}
                    {nearbyUsers.map((u) => {
                      const radiusPx = Math.max(22, Math.min(98, (u.distanceMeters / 50) * 98));
                      const rad = (u.angleDeg * Math.PI) / 180;
                      const x = Math.sin(rad) * radiusPx;
                      const y = -Math.cos(rad) * radiusPx;
                      const isSelected = selectedUser?.id === u.id;

                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          style={{ transform: `translate(${x}px, ${y}px)` }}
                          className="absolute z-20 flex flex-col items-center group focus:outline-none"
                        >
                          <span
                            className={`w-4 h-4 rounded-full transition ${
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

                  {/* GPS Status */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {myCoords ? 'GPS Locked • 50m Radius' : 'Locking GPS signal...'}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      {nearbyUsers.length} {nearbyUsers.length === 1 ? 'Owl' : 'Owls'} Nearby
                    </span>
                  </div>

                  {/* Nearby Users List */}
                  {nearbyUsers.length === 0 ? (
                    <div className="p-3.5 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-500 text-[11px]">
                      No active night owls detected within 50m yet. Keep radar open—blips appear automatically when someone enters your radius.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-0.5">
                      {nearbyUsers.map((u) => {
                        const isPending = outgoingRequestTo === u.id;
                        return (
                          <div
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                              selectedUser?.id === u.id
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
                                handleSendRequest(u);
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
          ) : (
            /* 1-on-1 Private Chat */
            chatPartner && (
              <div className="flex flex-col h-[380px] justify-between">
                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 pb-2">
                  {chatMessages.map((msg) => {
                    const isMe = msg.senderId === deviceSessionId.current;
                    const isSystem = msg.senderId === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center py-2">
                          <span className="bg-zinc-900 border border-zinc-800 text-emerald-400 text-[10px] px-3 py-1 rounded-full">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-zinc-500 px-1 mb-0.5">
                          {isMe ? 'You' : chatPartner.name}
                        </span>
                        <div
                          className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs ${
                            isMe
                              ? 'bg-emerald-500 text-zinc-950 font-medium rounded-tr-sm'
                              : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendMessage} className="pt-2 border-t border-zinc-800/80 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Message ${chatPartner.name}...`}
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3.5 py-2 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 p-2.5 rounded-xl transition active:scale-95 shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}