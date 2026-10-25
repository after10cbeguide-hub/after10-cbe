'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { INITIAL_SPOTS } from '@/data/seed-spots';
import { Category, Spot, SpotVibeStatus, CrowdLevel, RoadAlert, GhostUser } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { 
  Utensils, 
  Wrench, 
  Shield, 
  Compass, 
  Sparkles, 
  PhoneCall, 
  Ghost, 
  ShieldCheck, 
  Plus,
  CheckCheck,
  Check,
  Trash2,
  X,
  Radar,
  Coffee,
  LogIn,
  LogOut,
  GraduationCap
} from 'lucide-react';
import RideRouletteModal from '@/components/Roulette/RideRouletteModal';
import ConfessionWallModal from '@/components/Confessions/ConfessionWallModal';
import SafetyModal from '@/components/Safety/SafetyModal';
import AddSpotModal from '@/components/Admin/AddSpotModal';
import RoadAlertModal from '@/components/Radar/RoadAlertModal';
import ChaiBuddyModal from '@/components/Buddy/ChaiBuddyModal';
import AuthModal from '@/components/Auth/AuthModal';

const NightMap = dynamic(() => import('@/components/Map/NightMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-xs font-mono tracking-wider">BOOTING NIGHT OS...</p>
      </div>
    </div>
  ),
});

const INITIAL_ALERTS: RoadAlert[] = [
  {
    id: 'sample_alert_1',
    type: 'police',
    title: 'Vehicle check near Hope College flyover descent',
    area: 'Avinashi Road / Hope College',
    lat: 11.0250,
    lng: 77.0120,
    createdAt: Date.now() - 5 * 60 * 1000,
    upvotes: 4,
  }
];

// Seed active ghost night owls wandering Coimbatore hubs
const INITIAL_GHOSTS: GhostUser[] = [
  {
    id: 'ghost_1',
    name: 'Ghost #408',
    area: 'Peelamedu',
    lat: 11.0285,
    lng: 77.0012,
    college: 'PSG Tech',
    lastActive: Date.now(),
  },
  {
    id: 'ghost_2',
    name: 'Ghost #219',
    area: 'Race Course',
    lat: 11.0062,
    lng: 76.9740,
    college: 'CIT Coimbatore',
    lastActive: Date.now(),
  },
  {
    id: 'ghost_3',
    name: 'Ghost #773',
    area: 'RS Puram',
    lat: 11.0110,
    lng: 76.9490,
    lastActive: Date.now(),
  },
  {
    id: 'ghost_4',
    name: 'Ghost #902',
    area: 'Saibaba Colony',
    lat: 11.0298,
    lng: 76.9415,
    college: 'GCT Coimbatore',
    lastActive: Date.now(),
  }
];

export default function Home() {
  const { user, logout } = useAuth();

  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [alerts, setAlerts] = useState<RoadAlert[]>(INITIAL_ALERTS);
  const [ghosts, setGhosts] = useState<GhostUser[]>(INITIAL_GHOSTS);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [safeHavensOnly, setSafeHavensOnly] = useState<boolean>(false);
  
  // Modals
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isConfessionsOpen, setIsConfessionsOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isAddSpotOpen, setIsAddSpotOpen] = useState(false);
  const [isAdminQueueOpen, setIsAdminQueueOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>(undefined);

  // Auto-register user's presence as an active ghost when entering the app
  useEffect(() => {
    // Generate slight random offset for privacy
    const latOffset = (Math.random() - 0.5) * 0.012;
    const lngOffset = (Math.random() - 0.5) * 0.012;

    const myGhost: GhostUser = {
      id: 'my_ghost_presence',
      name: user ? user.name.split(' ')[0] : `Ghost #${Math.floor(100 + Math.random() * 900)}`,
      area: 'Coimbatore Central',
      lat: 11.0168 + latOffset,
      lng: 76.9558 + lngOffset,
      college: user?.college,
      lastActive: Date.now(),
    };

    setGhosts((prev) => [myGhost, ...prev.filter((g) => g.id !== 'my_ghost_presence')]);
  }, [user]);

  useEffect(() => {
    const savedSpots = localStorage.getItem('after10_spots_vibe');
    if (savedSpots) {
      try {
        setSpots(JSON.parse(savedSpots));
      } catch {
        setSpots(INITIAL_SPOTS);
      }
    }

    const savedAlerts = localStorage.getItem('after10_road_alerts');
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch {
        setAlerts(INITIAL_ALERTS);
      }
    }
  }, []);

  // Road Alert 30-min auto purge
  useEffect(() => {
    const purgeExpiredAlerts = () => {
      const now = Date.now();
      const thirtyMinutesMs = 30 * 60 * 1000;
      setAlerts((prev) => {
        const filtered = prev.filter((a) => now - a.createdAt < thirtyMinutesMs);
        if (filtered.length !== prev.length) {
          localStorage.setItem('after10_road_alerts', JSON.stringify(filtered));
        }
        return filtered;
      });
    };

    purgeExpiredAlerts();
    const interval = setInterval(purgeExpiredAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const saveSpots = (newSpots: Spot[]) => {
    setSpots(newSpots);
    localStorage.setItem('after10_spots_vibe', JSON.stringify(newSpots));
  };

  const saveAlerts = (newAlerts: RoadAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem('after10_road_alerts', JSON.stringify(newAlerts));
  };

  const handleUpdateSpotVibe = (spotId: string, status: SpotVibeStatus, crowd: CrowdLevel) => {
    const updated = spots.map((s) =>
      s.id === spotId ? { ...s, vibeStatus: status, crowdLevel: crowd, lastUpdated: 'Just now' } : s
    );
    saveSpots(updated);
  };

  const handleAddSpot = (newSpot: Spot) => {
    const updated = [newSpot, ...spots];
    saveSpots(updated);
  };

  const handleApproveSpot = (spotId: string) => {
    const updated = spots.map((s) =>
      s.id === spotId ? { ...s, status: 'verified' as const } : s
    );
    saveSpots(updated);
  };

  const handleRejectSpot = (spotId: string) => {
    const updated = spots.filter((s) => s.id !== spotId);
    saveSpots(updated);
  };

  const handlePostAlert = (newAlert: RoadAlert) => {
    const updated = [newAlert, ...alerts];
    saveAlerts(updated);
  };

  const handleVouchAlert = (alertId: string) => {
    const updated = alerts.map((a) =>
      a.id === alertId ? { ...a, upvotes: a.upvotes + 1 } : a
    );
    saveAlerts(updated);
  };

  const handleClearAlert = (alertId: string) => {
    const updated = alerts.filter((a) => a.id !== alertId);
    saveAlerts(updated);
  };

  const requireAuthForAction = (reason: string, action: () => void) => {
    if (!user) {
      setAuthReason(reason);
      setIsAuthOpen(true);
      return;
    }
    action();
  };

  const categories: { label: string; value: Category; icon: any }[] = [
    { label: 'All', value: 'all', icon: Compass },
    { label: 'Food', value: 'food', icon: Utensils },
    { label: 'Ride / Gas', value: 'ride_stops', icon: Wrench },
    { label: 'Medical / ATM', value: 'essentials', icon: Shield },
  ];

  const verifiedSpots = spots.filter((s) => s.status === 'verified');
  const pendingSpots = spots.filter((s) => s.status === 'pending');

  const visibleSpots: Spot[] = verifiedSpots.filter((spot) => {
    const matchesCategory = selectedCategory === 'all' || spot.category === selectedCategory;
    const matchesSafe = !safeHavensOnly || spot.isGirlsSafe;
    return matchesCategory && matchesSafe;
  });

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans">
      {/* Top Floating App Bar */}
      <header className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between bg-zinc-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-zinc-800 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base font-black tracking-tight text-zinc-100">
              AFTER 10 <span className="text-emerald-400">CBE</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Live Ghost Presence Indicator */}
            <div className="flex items-center gap-1 text-[11px] font-mono bg-purple-950/70 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>{ghosts.length} Ghosts Awake</span>
            </div>

            {pendingSpots.length > 0 && (
              <button
                onClick={() => setIsAdminQueueOpen(true)}
                className="flex items-center gap-1 text-[11px] font-mono bg-amber-950/70 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-xl animate-pulse"
                title="Review pending submissions"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{pendingSpots.length} Pending</span>
              </button>
            )}

            <button
              onClick={() => requireAuthForAction('Sign in with Google to suggest new spots', () => setIsAddSpotOpen(true))}
              className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-xl transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Suggest Spot
            </button>

            {/* Profile or Sign In */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700/60 pl-1.5 pr-2 py-1 rounded-xl">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-5 h-5 rounded-full bg-zinc-700"
                />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-zinc-200 leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  {user.college && (
                    <span className="text-[8px] font-mono text-emerald-400 flex items-center gap-0.5 leading-none">
                      <GraduationCap className="w-2.5 h-2.5" /> {user.college}
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="text-zinc-500 hover:text-rose-400 ml-1 p-0.5"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthReason(undefined);
                  setIsAuthOpen(true);
                }}
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-xl border border-zinc-700 transition"
              >
                <LogIn className="w-3 h-3 text-emerald-400" /> Sign In
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto py-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.value && !safeHavensOnly;
            return (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setSafeHavensOnly(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                  active
                    ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-md'
                    : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Interactive Map Surface */}
      <div className="w-full h-full">
        <NightMap
          spots={visibleSpots}
          alerts={alerts}
          ghosts={ghosts}
          selectedCategory={selectedCategory}
          onUpdateSpotVibe={handleUpdateSpotVibe}
          onVouchAlert={handleVouchAlert}
          onClearAlert={handleClearAlert}
        />
      </div>

      {/* Bottom Floating Navigation Action Bar */}
      <nav className="absolute bottom-6 left-4 right-4 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <button
          onClick={() => setIsRouletteOpen(true)}
          className="pointer-events-auto flex-[1.6] flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3.5 px-2 rounded-2xl shadow-lg shadow-emerald-950/40 transition active:scale-95 text-xs"
        >
          <Sparkles className="w-3.5 h-3.5 fill-zinc-950 shrink-0" />
          Roulette
        </button>

        <button
          onClick={() => requireAuthForAction('Verify your identity with Google to enter Chai Buddy', () => setIsBuddyOpen(true))}
          className="pointer-events-auto flex-[1.4] flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 px-2 rounded-2xl shadow-lg shadow-amber-950/40 transition active:scale-95 text-xs"
        >
          <Coffee className="w-3.5 h-3.5 shrink-0" />
          Chai Buddy
        </button>

        <button
          onClick={() => setIsRadarOpen(true)}
          className="pointer-events-auto flex-1 flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 font-semibold py-3.5 px-2 rounded-2xl shadow-lg transition active:scale-95 text-xs"
        >
          <Radar className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          Radar
        </button>

        <button
          onClick={() => setIsConfessionsOpen(true)}
          className="pointer-events-auto flex-1 flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-purple-300 border border-purple-800/40 font-semibold py-3.5 px-2 rounded-2xl shadow-lg transition active:scale-95 text-xs"
        >
          <Ghost className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          Wall
        </button>

        <button
          onClick={() => setIsSafetyOpen(true)}
          className="pointer-events-auto flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-zinc-100 p-3.5 rounded-2xl border border-rose-500 shadow-lg shadow-rose-950/50 transition active:scale-95 shrink-0"
          aria-label="Emergency SOS Suite"
        >
          <PhoneCall className="w-4 h-4" />
        </button>
      </nav>

      {/* Admin Queue Modal */}
      {isAdminQueueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-bold text-zinc-100 text-sm">Admin Ground-Check Queue</h3>
                <p className="text-zinc-500 text-xs">Verify suggestions before publishing</p>
              </div>
              <button
                onClick={() => setIsAdminQueueOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {pendingSpots.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-8">No pending spots right now.</p>
              ) : (
                pendingSpots.map((spot) => (
                  <div
                    key={spot.id}
                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-semibold text-zinc-100 text-xs">{spot.name}</h4>
                      <p className="text-zinc-400 text-[10px]">{spot.area} • {spot.closingTime || '24/7'}</p>
                      <p className="text-zinc-500 font-mono text-[9px]">{spot.lat}, {spot.lng}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleApproveSpot(spot.id)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
                        title="Approve & Publish to Map"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRejectSpot(spot.id)}
                        className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition"
                        title="Reject & Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feature Modals */}
      <RideRouletteModal
        spots={visibleSpots}
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
      />

      <ConfessionWallModal
        isOpen={isConfessionsOpen}
        onClose={() => setIsConfessionsOpen(false)}
      />

      <SafetyModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
        onFilterSafeHavens={() => setSafeHavensOnly(true)}
      />

      <AddSpotModal
        isOpen={isAddSpotOpen}
        onClose={() => setIsAddSpotOpen(false)}
        existingSpots={spots}
        onAddSpot={handleAddSpot}
      />

      <RoadAlertModal
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
        onPostAlert={handlePostAlert}
      />

      <ChaiBuddyModal
        isOpen={isBuddyOpen}
        onClose={() => setIsBuddyOpen(false)}
        onOpenSOS={() => setIsSafetyOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        reason={authReason}
      />
    </main>
  );
}