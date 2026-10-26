'use client';

import { useState } from 'react';
import { Spot, SpotCategory, SpotSubtype, ClosingTimeRange, ShutterRisk, CrowdType, ParkingType } from '@/types';
import {
  X,
  Store,
  LocateFixed,
  Check,
  AlertTriangle,
  Send,
  ShieldCheck,
  Camera,
  SunMedium,
  CreditCard,
  Bath,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingSpots?: Spot[];
  onAddSpot: (newSpot: Spot) => void;
}

const CBE_AREAS = [
  'Saibaba Colony',
  'RS Puram',
  'Peelamedu / Hopes',
  'Gandhipuram',
  'Race Course',
  'SITRA / Airport',
  'Saravanampatti / Keeranatham',
  'Neelambur / Bypass',
  'Ukkadam / Town Hall',
  'Singanallur / Ondipudur',
  'Vadavalli / Marudhamalai Rd',
  'Kovaipudur / Kuniyamuthur',
  'Thudiyalur / MTP Rd',
];

const SPOT_TYPES: SpotSubtype[] = [
  'Night Tea Stall / Kadai',
  '24/7 Bakery & Bakes',
  'Thattukada / Street Fast Food',
  'Midnight Biryani / Mess',
  'Late Night Cafe / Shakes',
  'Drive-in / Roll Stall',
  'Bypass Dhaba / Family Hotel',
  'Restobar / Pub / Lounge',
  'Late Snooker / Turf / Gaming',
  'Highway Petrol Bunk & Air',
  '24/7 Pharmacy / ATM',
  'Scenic Lake / Calm Chill Spot',
];

const CROWD_OPTIONS: CrowdType[] = [
  'College Students',
  'Night Shift / IT',
  'Bikers / Riders',
  'Families / Mixed',
];

export default function AddSpotModal({ isOpen, onClose, onAddSpot }: Props) {
  // Form State
  const [name, setName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState(CBE_AREAS[0]);
  const [category, setCategory] = useState<SpotCategory>('food');
  const [spotType, setSpotType] = useState<SpotSubtype>('Night Tea Stall / Kadai');
  
  // GPS
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Timings & Police
  const [closingTimeRange, setClosingTimeRange] = useState<ClosingTimeRange>('02:00 AM');
  const [shutterRisk, setShutterRisk] = useState<ShutterRisk>('uninterrupted');

  // Vibes & Parking
  const [selectedCrowds, setSelectedCrowds] = useState<CrowdType[]>(['College Students']);
  const [parking, setParking] = useState<ParkingType>('bike_only');

  // Amenities & Safety
  const [wellLitStreet, setWellLitStreet] = useState(true);
  const [cctvCovered, setCctvCovered] = useState(false);
  const [isGirlsSafe, setIsGirlsSafe] = useState(true);
  const [upiAccepted, setUpiAccepted] = useState(true);
  const [restroomAvailable, setRestroomAvailable] = useState(false);

  // Tips
  const [mustTryItem, setMustTryItem] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
        // Fallback to Gandhipuram central coordinates
        setLat(11.0168);
        setLng(76.9558);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleCrowd = (c: CrowdType) => {
    setSelectedCrowds((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a spot or shop name.');
      return;
    }

    const finalLat = lat ?? 11.0168;
    const finalLng = lng ?? 76.9558;

    const newSpot: Spot = {
      id: `spot_${Date.now()}`,
      name: name.trim(),
      landmark: landmark.trim() || undefined,
      area,
      lat: finalLat,
      lng: finalLng,
      category,
      spotType,
      closingTimeRange,
      isAlwaysOpen: closingTimeRange === '24/7',
      shutterRisk,
      crowdTypes: selectedCrowds,
      parking,
      wellLitStreet,
      cctvCovered,
      isGirlsSafe,
      upiAccepted,
      restroomAvailable,
      mustTryItem: mustTryItem.trim() || undefined,
      vibeStatus: 'serving',
      crowdLevel: 'Chill',
      lastUpdated: 'Just suggested',
      status: 'pending', // Strictly pending for admin approval
      vouches: 0,
    };

    onAddSpot(newSpot);
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      setName('');
      setLandmark('');
      setMustTryItem('');
      setLat(null);
      setLng(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm sm:text-base flex items-center gap-1.5">
                Suggest a Night Spot <Sparkles className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-zinc-500 text-[11px]">Reviewed by admin before publishing live</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-xl hover:bg-zinc-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto pr-1 py-3 space-y-4 text-xs">
          {isSubmitted ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-zinc-100">Submitted for Admin Review!</h4>
              <p className="text-xs text-zinc-400 max-w-xs">
                Thanks for adding to Coimbatore&apos;s late night map! Our team will verify and publish this spot shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* SECTION 1: Basic Info */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2.5">
                <span className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider block">
                  1. Basic Info
                </span>

                <div>
                  <label className="text-zinc-300 mb-1 block font-medium">Spot / Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Moon Light Dosa Corner, KR Bakes, etc."
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 mb-1 block font-medium">Landmark / Street Clue</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opp to PSG tech back gate, Near Shell bunk"
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* SECTION 2: Categorization & CBE Spot Types */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2.5">
                <span className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider block">
                  2. Spot Categorization
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-300 mb-1 block">Area</label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-emerald-500"
                    >
                      {CBE_AREAS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-300 mb-1 block">Main Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SpotCategory)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="food">Food & Tiffin</option>
                      <option value="ride_stops">Ride / Gas Bunk</option>
                      <option value="essentials">Pharmacy / ATM</option>
                      <option value="chill">Chill & Hangout</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-300 mb-1.5 block">Coimbatore Spot Variety</label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {SPOT_TYPES.map((type) => {
                      const isSelected = spotType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSpotType(type)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Live GPS Detection */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
                <span className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider block">
                  3. Location Pin
                </span>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-200 px-3.5 py-2.5 rounded-xl transition"
                >
                  <span className="flex items-center gap-2">
                    <LocateFixed className={`w-4 h-4 ${isLocating ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
                    {isLocating
                      ? 'Detecting GPS...'
                      : lat && lng
                      ? `Locked: ${lat}, ${lng}`
                      : 'Lock Spot with Current GPS'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {lat && lng ? 'Ready' : 'Tap to Detect'}
                  </span>
                </button>
              </div>

              {/* SECTION 4: Timing & Police Risk */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-3.5 space-y-3">
                <span className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider block">
                  4. Timing & Police Reality Check
                </span>

                <div>
                  <label className="text-zinc-300 mb-1.5 block">Actual Closing Time</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['12:00 AM', '02:00 AM', '04:00 AM', '24/7'] as ClosingTimeRange[]).map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setClosingTimeRange(time)}
                        className={`py-1.5 rounded-lg text-[11px] font-medium border text-center transition ${
                          closingTimeRange === time
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <div>
                    <span className="font-medium text-zinc-200 block">Police Shutter Risk</span>
                    <span className="text-[10px] text-zinc-500">Half-shutter / closes early during police rounds</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setShutterRisk(shutterRisk === 'uninterrupted' ? 'half_shutter_police' : 'uninterrupted')
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                      shutterRisk === 'half_shutter_police'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    {shutterRisk === 'half_shutter_police' ? 'High Risk' : 'Usually Open'}
                  </button>
                </div>
              </div>

              {/* SECTION 5: Vibes & Parking */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-3.5 space-y-3">
                <span className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider block">
                  5. Vibes & Parking
                </span>

                <div>
                  <label className="text-zinc-300 mb-1.5 block">Crowd Types (Select all that apply)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CROWD_OPTIONS.map((c) => {
                      const isSelected = selectedCrowds.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCrowd(c)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-zinc-300 mb-1.5 block">Vehicle Parking</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'bike_only', label: 'Bike Only' },
                      { id: 'street_car_parking', label: 'Car Parking' },
                      { id: 'car_drive_in', label: 'Drive-In Car' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setParking(p.id as ParkingType)}
                        className={`py-1.5 rounded-lg text-[11px] font-medium border text-center transition ${
                          parking === p.id
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 6: Safety & Amenities */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
                <span className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider block">
                  6. Safety & Essentials
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-zinc-900/60 border border-zinc-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wellLitStreet}
                      onChange={(e) => setWellLitStreet(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <SunMedium className="w-3.5 h-3.5 text-amber-400" /> Well Lit
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-zinc-900/60 border border-zinc-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cctvCovered}
                      onChange={(e) => setCctvCovered(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Camera className="w-3.5 h-3.5 text-blue-400" /> CCTV Covered
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-zinc-900/60 border border-zinc-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGirlsSafe}
                      onChange={(e) => setIsGirlsSafe(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Girls Safe
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-zinc-900/60 border border-zinc-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={upiAccepted}
                      onChange={(e) => setUpiAccepted(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> UPI / GPay
                    </span>
                  </label>

                  <label className="col-span-2 flex items-center gap-2 p-2 bg-zinc-900/60 border border-zinc-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restroomAvailable}
                      onChange={(e) => setRestroomAvailable(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Bath className="w-3.5 h-3.5 text-purple-400" /> Restroom Available (Night Highway / Dine-in)
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION 7: Community Recommendation */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
                <span className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider block">
                  7. Must-Try Item / Night Recommendation
                </span>
                <input
                  type="text"
                  value={mustTryItem}
                  onChange={(e) => setMustTryItem(e.target.value)}
                  placeholder="e.g., Bun Butter Jam + Lemon Tea, Egg Kothu, Filter Coffee"
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition active:scale-95 shadow-lg shadow-emerald-950/40"
              >
                <Send className="w-4 h-4" />
                Submit Spot for Admin Review
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}