'use client';

import { useState } from 'react';
import { Spot } from '@/types';
import { Shuffle, ExternalLink, X, MapPin } from 'lucide-react';

interface Props {
  spots: Spot[];
  isOpen: boolean;
  onClose: () => void;
}

export default function RideRouletteModal({ spots, isOpen, onClose }: Props) {
  const [route, setRoute] = useState<Spot[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  if (!isOpen) return null;

  const spinRoulette = () => {
    setIsSpinning(true);

    setTimeout(() => {
      const foodSpots = spots.filter((s) => s.category === 'food');
      const chillSpots = spots.filter((s) => s.category === 'chill');
      const essentialsOrRide = spots.filter(
        (s) => s.category === 'ride_stops' || s.category === 'essentials'
      );

      const stop1 = foodSpots[Math.floor(Math.random() * foodSpots.length)] || spots[0];
      const stop2 = chillSpots[Math.floor(Math.random() * chillSpots.length)] || spots[1];
      const stop3 = essentialsOrRide[Math.floor(Math.random() * essentialsOrRide.length)] || spots[2];

      setRoute([stop1, stop2, stop3]);
      setIsSpinning(false);
    }, 400);
  };

  const generateGoogleMapsUrl = () => {
    if (route.length < 3) return '#';
    const origin = `${route[0].lat},${route[0].lng}`;
    const waypoint = `${route[1].lat},${route[1].lng}`;
    const destination = `${route[2].lat},${route[2].lng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoint}`;
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
            <p className="text-zinc-500 text-xs">Generate an instant 3-stop midnight ride</p>
          </div>
        </div>

        {route.length === 3 ? (
          <div className="space-y-3 mb-5">
            {route.map((spot, idx) => (
              <div
                key={spot.id}
                className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-start gap-3"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <h5 className="text-zinc-200 text-sm font-semibold">{spot.name}</h5>
                  <div className="flex items-center text-zinc-500 text-xs gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{spot.area}</span>
                  </div>
                </div>
              </div>
            ))}

            <a
              href={generateGoogleMapsUrl()}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-2.5 rounded-xl transition text-sm"
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
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
        >
          <Shuffle className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
          {route.length === 0 ? 'Roll Route' : 'Reroll Spots'}
        </button>
      </div>
    </div>
  );
}