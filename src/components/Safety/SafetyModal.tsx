'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  PhoneOff, 
  MapPin, 
  Share2, 
  X, 
  Volume2, 
  ShieldCheck, 
  Hospital 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFilterSafeHavens: () => void;
}

export default function SafetyModal({ isOpen, onClose, onFilterSafeHavens }: Props) {
  const [fakeCallActive, setFakeCallActive] = useState(false);
  const [callRinging, setCallRinging] = useState(false);
  const [callAnswered, setCallAnswered] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch accurate GPS coordinates when modal opens
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Default fallback to central Coimbatore if GPS denied
          setUserLocation({ lat: 11.0168, lng: 76.9558 });
        },
        { enableHighAccuracy: true }
      );
    }
  }, [isOpen]);

  // Audio tone synthesizer for fake call ring
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let intervalId: any = null;

    if (callRinging && !callAnswered) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();

        const playTone = () => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard phone ring frequency
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 1.2);

          // Vibrate mobile device if supported
          if ('vibrate' in navigator) {
            navigator.vibrate([400, 200, 400]);
          }
        };

        playTone();
        intervalId = setInterval(playTone, 3000);
      } catch (err) {
        console.warn('Audio ringtone autoplay restricted:', err);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioCtx) audioCtx.close();
    };
  }, [callRinging, callAnswered]);

  const triggerFakeCall = (delaySeconds: number = 3) => {
    setCountdown(delaySeconds);
    let remaining = delaySeconds;

    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        setCountdown(null);
        setFakeCallActive(true);
        setCallRinging(true);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  };

  const endFakeCall = () => {
    setFakeCallActive(false);
    setCallRinging(false);
    setCallAnswered(false);
  };

  const handleWhatsAppDispatch = () => {
    const lat = userLocation ? userLocation.lat : 11.0168;
    const lng = userLocation ? userLocation.lng : 76.9558;
    const message = encodeURIComponent(
      `🚨 EMERGENCY SOS - AFTER 10 CBE 🚨\nI need immediate assistance in Coimbatore.\nMy current live location is:\nhttps://maps.google.com/?q=${lat},${lng}`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
      
      {/* SIMULATED FAKE INCOMING CALL SCREEN */}
      {fakeCallActive ? (
        <div className="w-full sm:max-w-sm h-full sm:h-[80vh] bg-zinc-950 text-white flex flex-col justify-between p-8 rounded-none sm:rounded-3xl shadow-2xl animate-in fade-in duration-200">
          <div className="flex flex-col items-center mt-12 space-y-3">
            <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-300">
              <PhoneCall className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Appa / Home</h3>
            <p className="text-zinc-400 text-sm">
              {callAnswered ? '00:14 • Connected' : 'Incoming Call...'}
            </p>
          </div>

          {callAnswered ? (
            <div className="flex flex-col items-center gap-6 mb-8">
              <p className="text-zinc-400 text-xs text-center max-w-xs">
                &ldquo;Yeah, I am almost there. Wait for me at the entrance.&rdquo;
              </p>
              <button
                onClick={endFakeCall}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center shadow-lg active:scale-95 transition"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around w-full mb-8">
              {/* Decline Call */}
              <button
                onClick={endFakeCall}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-lg active:scale-95 transition">
                  <PhoneOff className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs text-zinc-400">Decline</span>
              </button>

              {/* Accept Call */}
              <button
                onClick={() => {
                  setCallRinging(false);
                  setCallAnswered(true);
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg animate-bounce active:scale-95 transition">
                  <PhoneCall className="w-7 h-7 text-zinc-950" />
                </div>
                <span className="text-xs text-zinc-400">Accept</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* MAIN SOS SAFETY HUB */
        <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base">Night Safety Suite</h3>
                <p className="text-zinc-500 text-xs">Girls Safe tags, escape tools, and live pings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 p-2 rounded-xl hover:bg-zinc-800/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Grid */}
          <div className="py-4 space-y-3">
            
            {/* Tool 1: Fake Call Simulator */}
            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">Girls Call (Fake Call)</h4>
                  <p className="text-[11px] text-zinc-500">Rings your phone to give a clean exit</p>
                </div>
              </div>
              <button
                onClick={() => triggerFakeCall(3)}
                disabled={countdown !== null}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition active:scale-95 shrink-0"
              >
                {countdown !== null ? `Ringing in ${countdown}s...` : 'Ring in 3s'}
              </button>
            </div>

            {/* Tool 2: WhatsApp Live Location Dispatch */}
            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">WhatsApp SOS Ping</h4>
                  <p className="text-[11px] text-zinc-500">Sends Google Maps GPS link to contacts</p>
                </div>
              </div>
              <button
                onClick={handleWhatsAppDispatch}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold px-3 py-2 rounded-xl transition active:scale-95 shrink-0"
              >
                Dispatch
              </button>
            </div>

            {/* Tool 3: Safe Havens Filter */}
            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">Locate Safe Havens</h4>
                  <p className="text-[11px] text-zinc-500">Show only 24/7 pharmacies, hospitals & verified spots</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onFilterSafeHavens();
                  onClose();
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-2 rounded-xl transition active:scale-95 shrink-0"
              >
                View on Map
              </button>
            </div>
          </div>

          {/* Emergency Direct Hotlines */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-2">
            <a
              href="tel:112"
              className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-xs transition active:scale-95 shadow-md shadow-rose-950/40"
            >
              <PhoneCall className="w-4 h-4" />
              Call Police (112)
            </a>
            <a
              href="tel:1091"
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3 rounded-xl text-xs transition active:scale-95 border border-zinc-700"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Women Helpline (1091)
            </a>
          </div>

        </div>
      )}
    </div>
  );
}