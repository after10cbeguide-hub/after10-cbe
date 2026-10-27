'use client';

import { supabase } from '@/lib/supabase';

import { useState } from 'react';
import { TurfVenue, TurfSport } from '@/types';
import {
  X,
  Trophy,
  Phone,
  MessageCircle,
  Plus,
  ArrowLeft,
  Send,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Check,
  Trash2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  turfs: TurfVenue[];
  onAddTurf: (newTurf: TurfVenue) => void;
  isAdmin?: boolean;
  onApproveTurf?: (id: string) => void;
  onRejectTurf?: (id: string) => void;
}

const CBE_TURF_AREAS = [
  'Saravanampatti / Keeranatham',
  'Peelamedu / Avinashi Road',
  'Kalapatti / SITRA',
  'Gandhipuram / Ganapathy',
  'Saibaba Colony / RS Puram',
  'Singanallur / Ondipudur',
  'Vadavalli / Thondamuthur',
  'Neelambur / Bypass',
];

const AVAILABLE_SPORTS: TurfSport[] = [
  'Box Cricket',
  'Football 5v5',
  'Badminton',
  'Pickleball',
];

export default function TurfModal({
  isOpen,
  onClose,
  turfs,
  onAddTurf,
  isAdmin = false,
  onApproveTurf,
  onRejectTurf,
}: Props) {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [adminTab, setAdminTab] = useState<'verified' | 'pending'>('verified');

  // Form State
  const [name, setName] = useState('');
  const [area, setArea] = useState(CBE_TURF_AREAS[0]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nightTimings, setNightTimings] = useState('Open 24 Hours');
  const [pricePerHour, setPricePerHour] = useState('');
  const [selectedSports, setSelectedSports] = useState<TurfSport[]>(['Box Cricket']);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleSport = (sport: TurfSport) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    let cleanWa = whatsapp.trim().replace(/\D/g, '');
    if (cleanWa.length === 10) cleanWa = `91${cleanWa}`;
    if (!cleanWa) cleanWa = phone.trim().replace(/\D/g, '');
    if (cleanWa.length === 10) cleanWa = `91${cleanWa}`;

    const newVenue: TurfVenue = {
      id: `turf_${Date.now()}`,
      name: name.trim(),
      area,
      address: address.trim() || undefined,
      lat: 11.0168,
      lng: 76.9558,
      sports: selectedSports.length > 0 ? selectedSports : ['Box Cricket'],
      nightTimings: nightTimings.trim(),
      pricePerHourNight: pricePerHour.trim() || undefined,
      phone: phone.trim(),
      whatsapp: cleanWa,
      status: isAdmin ? 'verified' : 'pending',
    };

    // 1. Insert directly into Supabase cloud table
    const { error } = await supabase.from('turfs').insert([
      {
        id: newVenue.id,
        name: newVenue.name,
        area: newVenue.area,
        address: newVenue.address,
        lat: newVenue.lat,
        lng: newVenue.lng,
        sports: newVenue.sports,
        night_timings: newVenue.nightTimings,
        price_per_hour_night: newVenue.pricePerHourNight,
        phone: newVenue.phone,
        whatsapp: newVenue.whatsapp,
        status: newVenue.status,
      },
    ]);

    if (error) {
      console.error('Error saving turf to Supabase:', error);
    }

    // 2. Update local state
    onAddTurf(newVenue);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      setName('');
      setAddress('');
      setPhone('');
      setWhatsapp('');
      setPricePerHour('');
      setView('list');
    }, 2000);
  };

  
  const pendingTurfs = turfs.filter((t) => t.status === 'pending');
  const verifiedTurfs = turfs.filter((t) => t.status === 'verified');

  const visibleTurfs = (isAdmin && adminTab === 'pending' ? pendingTurfs : verifiedTurfs).filter((t) => {
    if (selectedSport === 'All') return true;
    return t.sports.includes(selectedSport as TurfSport);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            {view === 'add' && (
              <button
                type="button"
                onClick={() => setView('list')}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm sm:text-base flex items-center gap-1.5">
                {view === 'list' ? 'Midnight Turfs' : 'Submit Turf'} <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </h3>
              <p className="text-zinc-500 text-[11px]">
                {view === 'list'
                  ? 'Verified late-night sports arenas across CBE'
                  : 'Submit a venue for moderation and verification'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {view === 'list' && (
              <button
                onClick={() => setView('add')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Turf
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-xl hover:bg-zinc-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Admin Tabs */}
        {isAdmin && view === 'list' && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
            <button
              onClick={() => setAdminTab('verified')}
              className={`py-1.5 rounded-xl text-xs font-semibold transition ${
                adminTab === 'verified'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'bg-zinc-900/60 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Verified ({verifiedTurfs.length})
            </button>
            <button
              onClick={() => setAdminTab('pending')}
              className={`py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                adminTab === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900/60 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Pending Review ({pendingTurfs.length})
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto pr-1 py-3 text-xs flex-1">
          {view === 'list' ? (
            <div className="space-y-3">
              {/* Sport Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['All', 'Box Cricket', 'Football 5v5', 'Badminton'].map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => setSelectedSport(sport)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap border transition ${
                      selectedSport === sport
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>

              {/* Turfs List */}
              {visibleTurfs.length > 0 ? (
                <div className="space-y-3">
                  {visibleTurfs.map((turf) => {
                    const waText = encodeURIComponent(
                      `Hi! Inquiring about a midnight slot at ${turf.name} tonight via After10 CBE.`
                    );
                    const waUrl = `https://wa.me/${turf.whatsapp}?text=${waText}`;

                    return (
                      <div
                        key={turf.id}
                        className={`bg-zinc-900/50 border rounded-2xl p-4 space-y-2.5 shadow-lg ${
                          turf.status === 'pending'
                            ? 'border-amber-500/40 bg-amber-950/10'
                            : 'border-zinc-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-zinc-100 text-sm">{turf.name}</h4>
                              {turf.status === 'pending' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                                  Pending
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                              <MapPin className="w-3 h-3 text-emerald-500" />
                              <span>{turf.area}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {turf.nightTimings}
                          </span>
                        </div>

                        {/* Sports Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {turf.sports.map((sp) => (
                            <span
                              key={sp}
                              className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 text-[10px] border border-zinc-700/60"
                            >
                              {sp}
                            </span>
                          ))}
                          {turf.pricePerHourNight && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] border border-amber-500/30">
                              {turf.pricePerHourNight}
                            </span>
                          )}
                        </div>

                        {/* Admin Action Controls (For Pending Submissions) */}
                        {isAdmin && turf.status === 'pending' ? (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                            <button
                              type="button"
                              onClick={() => onApproveTurf && onApproveTurf(turf.id)}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition"
                            >
                              <Check className="w-4 h-4" /> Approve & List
                            </button>
                            <button
                              type="button"
                              onClick={() => onRejectTurf && onRejectTurf(turf.id)}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold text-xs transition"
                            >
                              <Trash2 className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        ) : (
                          /* Public Contact Actions */
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition active:scale-95"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-current" /> WhatsApp Slot
                            </a>

                            <a
                              href={`tel:${turf.phone}`}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-xs transition active:scale-95"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400" /> Call Manager
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-56 border border-dashed border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-5 space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                    <Trophy className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h4 className="font-semibold text-zinc-200 text-xs">
                    {isAdmin && adminTab === 'pending'
                      ? 'No Pending Turfs to Review'
                      : 'No Midnight Turfs Listed Yet'}
                  </h4>
                  <p className="text-zinc-500 text-[11px] max-w-xs">
                    {isAdmin && adminTab === 'pending'
                      ? 'All submitted venues have been approved or processed.'
                      : 'Own a turf or play late night? Tap below to list it for review.'}
                  </p>
                  {!(isAdmin && adminTab === 'pending') && (
                    <button
                      onClick={() => setView('add')}
                      className="mt-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition"
                    >
                      + Add Turf
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ADD TURF FORM */
            <form onSubmit={handleFormSubmit} className="space-y-3">
              {isSuccess && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isAdmin
                      ? 'Turf published directly to live list!'
                      : 'Submitted! Your turf is pending admin review.'}
                  </span>
                </div>
              )}

              <div>
                <label className="text-zinc-300 mb-1 block font-medium">Turf / Arena Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Strike Arena, Hatrick Sports"
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 mb-1 block font-medium">Area</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    {CBE_TURF_AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 mb-1 block font-medium">Night Timings</label>
                  <select
                    value={nightTimings}
                    onChange={(e) => setNightTimings(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Open 24 Hours">Open 24 Hours</option>
                    <option value="Till 2:00 AM">Till 2:00 AM</option>
                    <option value="Till 3:30 AM">Till 3:30 AM</option>
                    <option value="Till 5:00 AM">Till 5:00 AM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 mb-1.5 block font-medium">Available Sports</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_SPORTS.map((sport) => {
                    const isSelected = selectedSports.includes(sport);
                    return (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => toggleSport(sport)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {sport}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 mb-1 block font-medium">Calling Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 98421XXXXX"
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 mb-1 block font-medium">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Same or 10-digit"
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 mb-1 block font-medium">Approx Night Rate / hr</label>
                <input
                  type="text"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  placeholder="e.g. ₹800 / hr"
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-emerald-950/30 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" /> Submit Turf for Review
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}