'use client';

import { useState } from 'react';
import { Spot } from '@/types';
import { Shuffle, ExternalLink, X, MapPin, AlertCircle } from 'lucide-react';

interface Props {
  spots: Spot[];
  isOpen: boolean;
  onClose: () => void;
}

export default function RideRouletteModal({ spots, isOpen, onClose }: Props) {
  const [route, setRoute] = useState<Spot[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const spinRoulette = () => {
    setStatusMessage(null);

    // Guard: Check if spots list has items
    const validSpots = (spots || []).filter((s) => s && s.name && s.lat && s.lng);
    if (validSpots.length === 0) {
      setStatusMessage('No night spots available yet. Submit and approve spots first!');
      return;
    }

    setIsSpinning(true);

    setTimeout(() => {
      const foodSpots = validSpots.filter((s) => s.category === 'food');
      const chillSpots = validSpots.filter((s) => s.category === 'chill');
      const essentialsOrRide = validSpots.filter(
        (s) => s.category === 'ride_stops' || s.category === 'essentials'
      );

      // Randomly pick spots from distinct categories, falling back to any valid spot without undefined
      const selected: Spot[] = [];

      const pickRandom = (arr: Spot[]) =>
        arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

      const stop1 = pickRandom(foodSpots) || pickRandom(validSpots);
      if (stop1) selected.push(stop1);

      const remainingAfterStop1 = validSpots.filter((s) => !selected.some((sel) => sel.id === s.id));
      const stop2 =
        pickRandom(chillSpots.filter((s) => !selected.some((sel) => sel.id === s.id))) ||
        pickRandom(remainingAfterStop1) ||
        stop1;
      if (stop2 && selected.length < 2) selected.push(stop2);

      const remainingAfterStop2 = validSpots.filter((s) => !selected.some((sel) => sel.id === s.id));
      const stop3 =
        pickRandom(essentialsOrRide.filter((s) => !selected.some((sel) => sel.id === s.id))) ||
        pickRandom(remainingAfterStop2) ||
        stop2;
      if (stop3 && selected.length < 3) selected.push(stop3);

      setRoute(selected.filter(Boolean));
      setIsSpinning(false);
    }, 400);
  };

  const generateGoogleMapsUrl = () => {
    if (!route || route.length < 2) return '#';
    const origin = `${route[0].lat},${route[0].lng}`;
    const destination = `${route[route.length - 1].lat},${route[route.length - 1].lng}`;

    if (route.length === 3) {
      const waypoint = `${route[1].lat},${route[1].lng}`;
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoint}`;
    }

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Shuffle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-lg">Ride Roulette</h3>
            <p className="text-zinc-500 text-xs">Generate an instant midnight ride</p>
          </div>
        </div>

        {statusMessage && (
          <div className="mb-4 flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {route.length > 0 ? (
          <div className="space-y-3 mb-5">
            {route.map((spot, idx) => (
              <div
                key={spot?.id || idx}
                className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-start gap-3"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <h5 className="text-zinc-200 text-sm font-semibold">{spot?.name || 'Night Stop'}</h5>
                  <div className="flex items-center text-zinc-500 text-xs gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span>{spot?.area || 'Coimbatore'}</span>
                  </div>
                </div>
              </div>
            ))}

            <a
              href={generateGoogleMapsUrl()}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-2.5 rounded-xl transition text-sm shadow-md shadow-emerald-950/30"
            >
              Open Route in Google Maps <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="h-44 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 text-sm text-center px-4 mb-5">
            Bored in your room? Tap spin to generate a midnight cruise plan across CBE.
          </div>
        )}

        <button
          onClick={spinRoulette}
          disabled={isSpinning}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
        >
          <Shuffle className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
          {route.length === 0 ? 'Roll Route' : 'Reroll Spots'}
        </button>
      </div>
    </div>
  );
}