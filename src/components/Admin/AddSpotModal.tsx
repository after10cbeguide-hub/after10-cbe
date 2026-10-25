'use client';

import { useState } from 'react';
import { Spot } from '@/types';
import { 
  PlusCircle, 
  LocateFixed, 
  Clock, 
  ShieldCheck, 
  X, 
  Store, 
  Check, 
  AlertTriangle,
  KeyRound
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingSpots: Spot[];
  onAddSpot: (newSpot: Spot) => void;
}

const CBE_AREAS = [
  'Saibaba Colony',
  'RS Puram',
  'Peelamedu',
  'Gandhipuram',
  'Race Course',
  'SITRA / Airport',
  'Saravanampatti',
  'Ukkadam',
  'Singanallur',
];

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AddSpotModal({ isOpen, onClose, existingSpots, onAddSpot }: Props) {
  const [name, setName] = useState('');
  const [area, setArea] = useState(CBE_AREAS[0]);
  const [category, setCategory] = useState<'food' | 'ride_stops' | 'essentials' | 'chill'>('food');
  const [closingTime, setClosingTime] = useState('02:00 AM');
  const [isAlwaysOpen, setIsAlwaysOpen] = useState(false);
  const [isGirlsSafe, setIsGirlsSafe] = useState(true);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [adminPasscode, setAdminPasscode] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<'verified' | 'pending' | null>(null);

  if (!isOpen) return null;

  const handleDetectGPS = () => {
    setErrorMsg(null);
    if (!('geolocation' in navigator)) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(5)));
        setLng(Number(pos.coords.longitude.toFixed(5)));
        setIsLocating(false);
      },
      () => {
        setLat(11.0168);
        setLng(76.9558);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a shop name.');
      return;
    }

    const finalLat = lat ?? 11.0168;
    const finalLng = lng ?? 76.9558;

    // Proximity duplicate check (30 meters)
    const tooCloseSpot = existingSpots.find(
      (s) => getDistanceMeters(finalLat, finalLng, s.lat, s.lng) < 30
    );

    if (tooCloseSpot) {
      setErrorMsg(`Spot duplicate detected: "${tooCloseSpot.name}" is already pinned within 30m of this location.`);
      return;
    }

    // Admin Ground-Check Key verification
    const isAdmin = adminPasscode.trim() === 'cbe10';
    const status: 'verified' | 'pending' = isAdmin ? 'verified' : 'pending';

    const newSpot: Spot = {
      id: `spot_${Date.now()}`,
      name: name.trim(),
      area,
      lat: finalLat,
      lng: finalLng,
      category,
      closingTime: isAlwaysOpen ? undefined : closingTime,
      isAlwaysOpen,
      isGirlsSafe,
      vibeStatus: 'serving',
      crowdLevel: 'Chill',
      lastUpdated: 'Just added',
      status,
      vouches: 0,
    };

    onAddSpot(newSpot);
    setSubmittedStatus(status);

    setTimeout(() => {
      setSubmittedStatus(null);
      setName('');
      setLat(null);
      setLng(null);
      setAdminPasscode('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base">Suggest a Night Spot</h3>
              <p className="text-zinc-500 text-xs">Reviewed by admin before going live</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-xl hover:bg-zinc-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedStatus ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-100">
              {submittedStatus === 'verified' ? 'Spot Verified & Published!' : 'Submitted for Admin Review!'}
            </h4>
            <p className="text-xs text-zinc-400 max-w-xs">
              {submittedStatus === 'verified'
                ? 'Your spot is now live on the night map.'
                : 'Thanks for the suggestion! Our team will verify and publish this spot shortly.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-3">
            
            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Shop Name */}
            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1 block">Shop Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Moonlight Dosa Corner, NSR Road"
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Area & Category */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-medium text-zinc-300 mb-1 block">Area</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  {CBE_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="food">Food / Chai</option>
                  <option value="ride_stops">Ride / Gas Bunk</option>
                  <option value="essentials">Pharmacy / ATM</option>
                  <option value="chill">Chill Spot</option>
                </select>
              </div>
            </div>

            {/* GPS Detection */}
            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1 block">Location Coordinates</label>
              <button
                type="button"
                onClick={handleDetectGPS}
                className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs transition active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  <LocateFixed className={`w-4 h-4 ${isLocating ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
                  {isLocating
                    ? 'Detecting GPS...'
                    : lat && lng
                    ? `Locked: ${lat}, ${lng}`
                    : 'Tap to Auto-Detect Live GPS'}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {lat && lng ? 'Ready' : 'Required'}
                </span>
              </button>
            </div>

            {/* Timings */}
            <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={isAlwaysOpen}
                  onChange={(e) => setIsAlwaysOpen(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0"
                />
                <span>Open 24/7</span>
              </label>

              {!isAlwaysOpen && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    placeholder="e.g. 02:30 AM"
                    className="w-24 bg-zinc-950 border border-zinc-800 text-zinc-200 text-[11px] rounded-lg px-2 py-1 text-center"
                  />
                </div>
              )}
            </div>

            {/* Girls Safe Toggle */}
            <label className="flex items-center justify-between p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs cursor-pointer">
              <span className="flex items-center gap-2 text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Girls Safe (Lit area / CCTV)
              </span>
              <input
                type="checkbox"
                checked={isGirlsSafe}
                onChange={(e) => setIsGirlsSafe(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0"
              />
            </label>

            {/* Admin Key (Ground Check Bypass) */}
            <div className="p-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-amber-400" /> Admin Ground-Check Key
                </span>
                <span className="text-[9px] font-mono text-zinc-500">Instant Publish</span>
              </div>
              <input
                type="password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Enter passcode if verified on ground (e.g. cbe10)"
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-1.5 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl text-xs transition active:scale-95 shadow-lg shadow-emerald-950/40"
            >
              <PlusCircle className="w-4 h-4" />
              Submit Spot
            </button>
          </form>
        )}
      </div>
    </div>
  );
}