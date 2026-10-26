'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { INITIAL_SPOTS } from '@/data/seed-spots';
import { Category, Spot, SpotVibeStatus, CrowdLevel, RoadAlert, GhostUser } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Utensils, 
  Wrench, 
  Shield, 
  Compass, 
  Sparkles, 
  PhoneCall, 
  Ghost, 
  Plus,
  CheckCheck,
  Check,
  Trash2,
  X,
  Radar,
  Coffee,
  LogIn,
  LogOut
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

const INITIAL_GHOSTS: GhostUser[] = [];

export default function Home() {
  const { user, logout } = useAuth();
  const ADMIN_EMAILS = ['after10cbeguide@gmail.com']; 
  const isAdmin = Boolean(user?.email && ADMIN_EMAILS.includes(user.email));

  const [spots, setSpots] = useState<Spot[]>([]);
  const [alerts, setAlerts] = useState<RoadAlert[]>(INITIAL_ALERTS);
  const [ghosts, setGhosts] = useState<GhostUser[]>([]);
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

  // Auto-register user's presence as an active ghost
  useEffect(() => {
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

  // Fetch spots from Supabase & subscribe to live updates
  useEffect(() => {
    const fetchSpots = async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('*');

      if (data && !error) {
        const formatted: Spot[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          area: d.area,
          category: d.category as Category,
          lat: d.lat,
          lng: d.lng,
          closingTime: d.closing_time,
          vibes: d.vibes || [],
          isGirlsSafe: d.is_girls_safe,
          status: d.status,
          submittedBy: d.submitted_by,
          vibeStatus: d.vibe_status || 'open',
          crowdLevel: d.crowd_level || 'moderate',
        }));
        setSpots(formatted);
      } else {
        setSpots([]);
      }
    };

    fetchSpots();

    const channel = supabase
      .channel('spots_db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spots' }, () => {
        fetchSpots();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Road Alerts Local Storage Load
  useEffect(() => {
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

  const saveAlerts = (newAlerts: RoadAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem('after10_road_alerts', JSON.stringify(newAlerts));
  };

  // Suggest Spot -> Inserts into Supabase (status: 'pending')
  const handleAddSpot = async (newSpot: Spot) => {
    setSpots((prev) => [newSpot, ...prev]);

    await supabase.from('spots').insert({
      id: newSpot.id,
      name: newSpot.name,
      area: newSpot.area,
      category: newSpot.category,
      lat: newSpot.lat,
      lng: newSpot.lng,
      closing_time: newSpot.closingTime,
      vibes: newSpot.vibes,
      is_girls_safe: newSpot.isGirlsSafe,
      status: 'pending',
      submitted_by: user?.email || 'Anonymous Owl',
      vibe_status: 'open',
      crowd_level: 'moderate',
    });
  };

  // Admin Approves Spot -> Updates Supabase (status: 'verified')
  const handleApproveSpot = async (spotId: string) => {
    setSpots((prev) =>
      prev.map((s) => (s.id === spotId ? { ...s, status: 'verified' as const } : s))
    );

    await supabase
      .from('spots')
      .update({ status: 'verified' })
      .eq('id', spotId);
  };

  // Admin Rejects Spot -> Deletes from Supabase
  const handleRejectSpot = async (spotId: string) => {
    setSpots((prev) => prev.filter((s) => s.id !== spotId));

    await supabase
      .from('spots')
      .delete()
      .eq('id', spotId);
  };

  // Live Vibe / Crowd Level Updates
  const handleUpdateSpotVibe = async (spotId: string, status: SpotVibeStatus, crowd: CrowdLevel) => {
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId ? { ...s, vibeStatus: status, crowdLevel: crowd, lastUpdated: 'Just now' } : s
      )
    );

    await supabase
      .from('spots')
      .update({ vibe_status: status, crowd_level: crowd })
      .eq('id', spotId);
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
    <main className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans select-none">
      {/* Top Floating App Bar */}
      <header className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex flex-col gap-2 pointer-events-none">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between bg-zinc-950/90 sm:bg-zinc-900/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-zinc-800 shadow-2xl pointer-events-auto">
          {/* Brand */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm sm:text-base font-black tracking-tight text-zinc-100">
              AFTER 10 <span className="text-emerald-400">CBE</span>
            </h1>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Ghost Presence Indicator */}
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono bg-purple-950/70 text-purple-300 border border-purple-800/60 px-2 py-1 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>{ghosts.length} <span className="hidden xs:inline">Awake</span></span>
            </div>

            {isAdmin && pendingSpots.length > 0 && (
              <button
                onClick={() => setIsAdminQueueOpen(true)}
                className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono bg-amber-950/70 text-amber-300 border border-amber-700/60 px-2 py-1 rounded-xl animate-pulse"
                title="Review pending submissions"
              >
                <CheckCheck className="w-3 h-3" />
                <span>{pendingSpots.length}</span>
              </button>
            )}

            <button
              onClick={() => requireAuthForAction('Sign in with Google to suggest new spots', () => setIsAddSpotOpen(true))}
              className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 sm:px-2.5 py-1 rounded-xl transition active:scale-95 shrink-0"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Suggest Spot</span>
              <span className="sm:hidden">Spot</span>
            </button>

            {/* Profile or Sign In */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/70 pl-1 pr-1.5 py-0.5 sm:py-1 rounded-xl shrink-0">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover bg-zinc-800 ring-1 ring-emerald-500/40"
                />
                <span className="text-[10px] sm:text-xs font-semibold text-zinc-200 max-w-[65px] sm:max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  className="text-zinc-500 hover:text-rose-400 p-0.5 ml-0.5"
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
                className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-2 sm:px-2.5 py-1 rounded-xl border border-zinc-700 transition"
              >
                <LogIn className="w-3 h-3 text-emerald-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pointer-events-auto px-0.5 py-0.5">
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
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium whitespace-nowrap transition border ${
                  active
                    ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-md font-semibold'
                    : 'bg-zinc-950/90 sm:bg-zinc-900/90 text-zinc-400 border-zinc-800/90 hover:text-zinc-200 backdrop-blur-md'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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

      {/* Bottom Floating Navigation Action Dock */}
      <nav className="absolute bottom-3 sm:bottom-6 left-3 sm:left-4 right-3 sm:right-4 z-20 pointer-events-none">
        <div className="max-w-md mx-auto bg-zinc-950/95 sm:bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/80 p-1.5 rounded-2xl shadow-2xl flex items-center justify-between gap-1 pointer-events-auto">
          {/* Roulette */}
          <button
            onClick={() => setIsRouletteOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-semibold tracking-tight">Roulette</span>
          </button>

          {/* Chai Buddy */}
          <button
            onClick={() => requireAuthForAction('Verify your identity with Google to enter Chai Buddy', () => setIsBuddyOpen(true))}
            className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 active:scale-95 transition"
          >
            <Coffee className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-semibold tracking-tight">Buddy</span>
          </button>

          {/* Radar */}
          <button
            onClick={() => setIsRadarOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-zinc-800/60 text-zinc-300 active:scale-95 transition"
          >
            <Radar className="w-4 h-4 mb-0.5 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-medium tracking-tight">Radar</span>
          </button>

          {/* Ghost Wall */}
          <button
            onClick={() => setIsConfessionsOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-zinc-800/60 text-zinc-300 active:scale-95 transition"
          >
            <Ghost className="w-4 h-4 mb-0.5 text-purple-400" />
            <span className="text-[10px] font-medium tracking-tight">Wall</span>
          </button>

          {/* SOS Emergency Button */}
          <button
            onClick={() => setIsSafetyOpen(true)}
            className="w-10 h-10 flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-950/60 transition active:scale-95 shrink-0 ml-0.5"
            aria-label="Emergency SOS Suite"
          >
            <PhoneCall className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Admin Queue Modal */}
      {isAdmin && isAdminQueueOpen && (
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
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        reason={authReason}
      />
    </main>
  );
}