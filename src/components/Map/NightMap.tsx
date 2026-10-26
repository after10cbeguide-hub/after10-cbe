'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spot, SpotVibeStatus, CrowdLevel, RoadAlert, RoadAlertType, GhostUser } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Users, 
  Sparkles, 
  Navigation, 
  ThumbsUp,
  Check,
  Ghost
} from 'lucide-react';

// Coimbatore exact outer perimeter border
const CBE_BORDER_COORDINATES: [number, number][] = [
  [11.1035, 77.0012], // North (Keeranatham / CHIL SEZ)
  [11.0895, 76.9660], // North (Ashokapuram / Thudiyalur border)
  [11.0820, 76.9380], // North-West (Kurudampalayam / Pannimadai border)
  [11.0360, 76.8920], // North-West (Somayampalayam / Marudhamalai foothills)
  [10.9855, 76.9030], // West (Perur / Vedapatti lakeside)
  [10.8920, 76.9420], // South-West (Madukkarai / Seerappalayam)
  [10.8980, 76.9940], // South (Malumichampatti Junction)
  [10.9575, 77.0190], // South-East (Vellalur / Chettipalayam Road)
  [11.0185, 77.0620], // East (Irugur / Ondipudur border)
  [11.0425, 77.0685], // North-East (Chinniampalayam / Airport)
  [11.0664, 77.0868], // Far East (Neelambur Bypass Junction)
  [11.1035, 77.0012], // Loop back to start
];

const createDynamicMarkerIcon = (vibeStatus: SpotVibeStatus = 'serving') => {
  let color = '#22c55e';
  let pulse = 'animate-ping';

  if (vibeStatus === 'wrapping_up') {
    color = '#f59e0b';
  } else if (vibeStatus === 'closed') {
    color = '#71717a';
    pulse = '';
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center">
        ${pulse ? `<span class="absolute h-6 w-6 rounded-full ${pulse} opacity-40" style="background-color: ${color};"></span>` : ''}
        <span class="relative h-4 w-4 rounded-full border-2 border-zinc-900 shadow-md" style="background-color: ${color};"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createRadarMarkerIcon = (type: RoadAlertType) => {
  let color = '#ef4444';
  let symbol = '🚨';

  if (type === 'dark_stretch') {
    color = '#a855f7';
    symbol = '💡';
  } else if (type === 'barricade') {
    color = '#f59e0b';
    symbol = '🚧';
  } else if (type === 'hazard') {
    color = '#06b6d4';
    symbol = '⚠️';
  }

  return L.divIcon({
    className: 'custom-radar-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute h-8 w-8 rounded-full animate-ping opacity-60" style="background-color: ${color};"></span>
        <div class="relative h-6 w-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-[10px]" style="background-color: ${color};">
          ${symbol}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Pulsing custom winking bow ghost icon
const createGhostMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-ghost-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <!-- Ambient pulsating purple radar aura -->
        <span class="absolute h-10 w-10 rounded-full animate-ping opacity-35 bg-purple-500"></span>
        
        <!-- Custom Winking Ghost Avatar -->
        <div class="relative w-8 h-8 rounded-full flex items-center justify-center filter drop-shadow-[0_4px_10px_rgba(168,85,247,0.7)] transition transform hover:scale-110">
          <img 
            src="/ghost-online.png" 
            alt="Ghost Online" 
            class="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

interface NightMapProps {
  spots: Spot[];
  alerts: RoadAlert[];
  ghosts?: GhostUser[];
  selectedCategory: string;
  onUpdateSpotVibe: (spotId: string, status: SpotVibeStatus, crowd: CrowdLevel) => void;
  onVouchAlert: (alertId: string) => void;
  onClearAlert: (alertId: string) => void;
}

export default function NightMap({ 
  spots = [], 
  alerts = [],
  ghosts = [],
  selectedCategory = 'all', 
  onUpdateSpotVibe,
  onVouchAlert,
  onClearAlert
}: NightMapProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [vibeSubmitted, setVibeSubmitted] = useState<string | null>(null);
  const [realtimeGhosts, setRealtimeGhosts] = useState<GhostUser[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Supabase Realtime Ghost Presence Synchronization
  useEffect(() => {
    if (!mounted) return;

    // Stable session key per browser session
    let localUserId = user?.id;
    if (!localUserId) {
      localUserId = typeof window !== 'undefined' 
        ? localStorage.getItem('after10_ghost_key') || ''
        : '';
      if (!localUserId) {
        localUserId = `ghost_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('after10_ghost_key', localUserId);
      }
    }

    const channel = supabase.channel('after10-presence-network', {
      config: {
        presence: { key: localUserId },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const liveList: GhostUser[] = [];

        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p && p.id && p.lat && p.lng) {
              liveList.push({
                id: p.id,
                name: p.name || 'Anonymous Ghost',
                area: p.area || 'Coimbatore',
                lat: p.lat,
                lng: p.lng,
                college: p.college,
                status: 'online',
                lastActive: p.lastActive || 'Just now',
              } as GhostUser);
            }
          });
        });

        setRealtimeGhosts(liveList);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const defaultCbeLat = 11.0168 + (Math.random() - 0.5) * 0.02;
          const defaultCbeLng = 76.9558 + (Math.random() - 0.5) * 0.02;

          const broadcastPresence = (lat: number, lng: number, areaName: string) => {
            channel.track({
              id: localUserId,
              name: user?.name || 'Night Owl',
              area: areaName,
              lat,
              lng,
              college: user?.college || 'PSG / CIT / KCT',
              lastActive: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          };

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                broadcastPresence(pos.coords.latitude, pos.coords.longitude, 'Coimbatore City');
              },
              () => {
                broadcastPresence(defaultCbeLat, defaultCbeLng, 'Race Course / RS Puram');
              },
              { timeout: 7000 }
            );
          } else {
            broadcastPresence(defaultCbeLat, defaultCbeLng, 'Race Course');
          }
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [mounted, user]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-xs font-mono tracking-wider">BOOTING NIGHT OS...</p>
        </div>
      </div>
    );
  }

  const filteredSpots = spots.filter(
    (spot) => selectedCategory === 'all' || spot.category === selectedCategory
  );

  // Combine seed ghosts with real Supabase peers (avoiding duplication)
  const combinedGhosts = [
    ...realtimeGhosts,
    ...ghosts.filter((g) => !realtimeGhosts.some((rg) => rg.id === g.id)),
  ];

  const handleVote = (spotId: string, status: SpotVibeStatus, crowd: CrowdLevel) => {
    onUpdateSpotVibe(spotId, status, crowd);
    setVibeSubmitted(spotId);
    setTimeout(() => setVibeSubmitted(null), 3000);
  };

  return (
    <MapContainer
      center={[11.0168, 76.9558]}
      zoom={13}
      scrollWheelZoom={true}
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark-night-tiles"
      />

      {/* Coimbatore Perimeter with Warm Golden Interior Glow */}
        <Polygon
          positions={CBE_BORDER_COORDINATES}
          pathOptions={{
            color: '#09090b',       // Deep solid dark border line
            weight: 3.5,            // Outer boundary thickness
            fillColor: '#f59e0b',   // Amber / golden glow
            fillOpacity: 0.12,      // Gentle subtle transparency (adjust between 0.10 - 0.16 to taste)
          }}
        />

      {/* 1. ACTIVE NIGHT GHOSTS (REAL-TIME SUPABASE PRESENCE RADAR) */}
        {Array.from(new Map(combinedGhosts.map((g) => [g.id, g])).values()).map((ghost, idx) => (
          <Marker
            key={`${ghost.id}-${idx}`}
            position={[ghost.lat, ghost.lng]}
            icon={createGhostMarkerIcon()}
          >
          <Popup className="custom-popup">
            <div className="bg-zinc-950 text-zinc-100 p-3 rounded-2xl border border-purple-800/80 text-xs max-w-[210px] shadow-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-bold text-purple-300">
                  <Ghost className="w-3.5 h-3.5 text-purple-400" />
                  {ghost.name}
                </span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              </div>
              <p className="text-zinc-400 text-[11px] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-zinc-500" />
                Near {ghost.area}
              </p>
              {ghost.college && (
                <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded-md inline-block">
                  🎓 {ghost.college}
                </div>
              )}
              <p className="text-[9px] text-zinc-500 font-mono pt-1 border-t border-zinc-800/80">
                Roaming the night streets
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* 2. ROAD RADAR HAZARD ALERTS */}
      {alerts.map((alert) => {
        const minutesLeft = Math.max(1, 30 - Math.floor((Date.now() - alert.createdAt) / 60000));

        return (
          <Marker
            key={alert.id}
            position={[alert.lat, alert.lng]}
            icon={createRadarMarkerIcon(alert.type)}
          >
            <Popup className="custom-popup">
              <div className="bg-zinc-950 text-zinc-100 p-4 rounded-2xl border border-amber-800/80 text-sm max-w-[270px] shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Expires in {minutesLeft}m
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {alert.upvotes} Confirmations
                  </span>
                </div>

                <h4 className="font-bold text-sm text-zinc-100 leading-tight mb-1">
                  {alert.title}
                </h4>
                
                <p className="text-zinc-400 text-xs mb-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  {alert.area}
                </p>

                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => onVouchAlert(alert.id)}
                    className="flex items-center justify-center gap-1 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/50 py-1.5 rounded-xl text-[11px] font-semibold transition active:scale-95"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    Still There (+1)
                  </button>
                  <button
                    onClick={() => onClearAlert(alert.id)}
                    className="flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 py-1.5 rounded-xl text-[11px] font-semibold transition active:scale-95"
                  >
                    <Check className="w-3 h-3" />
                    Cleared
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* 3. VERIFIED NIGHT SPOTS */}
      {filteredSpots.map((spot) => {
        const currentVibe = spot.vibeStatus || 'serving';
        const currentCrowd = spot.crowdLevel || 'Chill';

        return (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={createDynamicMarkerIcon(currentVibe)}
          >
            <Popup className="custom-popup">
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-2xl border border-zinc-800 text-sm max-w-[290px] shadow-2xl">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-bold text-base text-zinc-100 leading-tight">{spot.name}</h4>
                  {spot.isGirlsSafe && (
                    <span className="flex items-center text-[10px] text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-800/40 shrink-0">
                      <ShieldCheck className="w-3 h-3 mr-0.5" /> Safe
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-zinc-400 text-xs mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-500" />
                    {spot.area}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {spot.isAlwaysOpen ? 'Open 24/7' : `Closes ${spot.closingTime}`}
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" /> Ground Vibe:
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        currentVibe === 'serving'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : currentVibe === 'wrapping_up'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {currentVibe === 'serving'
                        ? '🟢 Still Serving'
                        : currentVibe === 'wrapping_up'
                        ? '🟡 Shutters Half Down'
                        : '🔴 Closed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Crowd:
                    </span>
                    <span className="text-zinc-300 font-medium">
                      {currentCrowd} {spot.lastUpdated ? `• ${spot.lastUpdated}` : ''}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  <p className="text-[10px] text-zinc-400 font-mono text-center">
                    {vibeSubmitted === spot.id ? (
                      <span className="text-emerald-400">✓ Vibe status updated!</span>
                    ) : (
                      'Tap to update vibe:'
                    )}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleVote(spot.id, 'serving', 'Packed')}
                      className="bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 text-[10px] py-1.5 rounded-lg font-medium transition active:scale-95"
                    >
                      🫖 Serving
                    </button>
                    <button
                      onClick={() => handleVote(spot.id, 'wrapping_up', 'Chill')}
                      className="bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 text-[10px] py-1.5 rounded-lg font-medium transition active:scale-95"
                    >
                      ⏳ Closing
                    </button>
                    <button
                      onClick={() => handleVote(spot.id, 'closed', 'Dead')}
                      className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[10px] py-1.5 rounded-lg font-medium transition active:scale-95"
                    >
                      ❌ Closed
                    </button>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-2 rounded-xl text-xs transition active:scale-95"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}