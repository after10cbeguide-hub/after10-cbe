'use client';

import { useState } from 'react';
import { RoadAlert, RoadAlertType } from '@/types';
import { 
  Radar, 
  ShieldAlert, 
  Moon, 
  Cone, 
  AlertTriangle, 
  LocateFixed, 
  X, 
  Send, 
  Clock 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPostAlert: (alert: RoadAlert) => void;
}

const CBE_AREAS = [
  'Avinashi Road / Hope College',
  'Gandhipuram / Cross Cut',
  'Peelamedu / PSG Stretch',
  'RS Puram / DB Road',
  'Saibaba Colony / NSR Road',
  'Marudhamalai Road',
  'SITRA / Airport Bypass',
  'Ukkadam Bypass',
  'Saravanampatti Stretch',
];

const ALERT_TYPES: { type: RoadAlertType; label: string; icon: any; color: string }[] = [
  { type: 'police', label: 'Police / Vehicle Check', icon: ShieldAlert, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  { type: 'dark_stretch', label: 'Lights Out / Pitch Dark', icon: Moon, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { type: 'barricade', label: 'Road Work / Barricade', icon: Cone, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { type: 'hazard', label: 'Blind Hazard / Dogs', icon: AlertTriangle, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
];

export default function RoadAlertModal({ isOpen, onClose, onPostAlert }: Props) {
  const [selectedType, setSelectedType] = useState<RoadAlertType>('police');
  const [area, setArea] = useState(CBE_AREAS[0]);
  const [title, setTitle] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(5)));
        setLng(Number(pos.coords.longitude.toFixed(5)));
        setIsLocating(false);
      },
      () => {
        // Fallback near Avinashi Road
        setLat(11.0264);
        setLng(77.0041);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLat = lat ?? 11.0264;
    const finalLng = lng ?? 77.0041;

    const defaultTitle = 
      selectedType === 'police' ? 'Vehicle check in progress' :
      selectedType === 'dark_stretch' ? 'Street lights completely out' :
      selectedType === 'barricade' ? 'Road diversion / barricade set up' :
      'Caution advised on this stretch';

    const newAlert: RoadAlert = {
      id: `alert_${Date.now()}`,
      type: selectedType,
      title: title.trim() || defaultTitle,
      area,
      lat: finalLat,
      lng: finalLng,
      createdAt: Date.now(),
      upvotes: 1,
    };

    onPostAlert(newAlert);
    setTitle('');
    setLat(null);
    setLng(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Radar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-100 text-base">Broadcast Road Radar</h3>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 30m Auto-Expiry
                </span>
              </div>
              <p className="text-zinc-500 text-xs">Alert night riders of checks, dark spots & barricades</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-xl hover:bg-zinc-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5">
          {/* Alert Type Selector */}
          <div>
            <label className="text-xs font-medium text-zinc-300 mb-1.5 block">Select Alert Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ALERT_TYPES.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => setSelectedType(item.type)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition active:scale-95 ${
                      isSelected
                        ? item.color + ' ring-1 ring-white/20'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-medium leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area Dropdown */}
          <div>
            <label className="text-xs font-medium text-zinc-300 mb-1 block">Stretch / Area</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
            >
              {CBE_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Details / Custom Note */}
          <div>
            <label className="text-xs font-medium text-zinc-300 mb-1 block">Short Description (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Near flyover descent, checking helmets & papers"
              maxLength={120}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* GPS Auto-Detect */}
          <button
            type="button"
            onClick={handleDetectGPS}
            className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs transition active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <LocateFixed className={`w-4 h-4 ${isLocating ? 'text-amber-400 animate-spin' : 'text-amber-400'}`} />
              {isLocating
                ? 'Detecting current coordinates...'
                : lat && lng
                ? `GPS Locked: ${lat}, ${lng}`
                : 'Pin at My Current GPS Spot'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {lat && lng ? 'Ready' : 'Auto'}
            </span>
          </button>

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl text-xs transition active:scale-95 shadow-lg shadow-amber-950/40"
          >
            <Send className="w-4 h-4" />
            Broadcast Alert (Live for 30m)
          </button>
        </form>
      </div>
    </div>
  );
}