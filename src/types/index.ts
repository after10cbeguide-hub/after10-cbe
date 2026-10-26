export type Category = 'all' | 'food' | 'ride_stops' | 'essentials' | 'chill';
export type SpotCategory = Category;

export type SpotSubtype =
  | 'Night Tea Stall / Kadai'
  | '24/7 Bakery & Bakes'
  | 'Thattukada / Street Fast Food'
  | 'Midnight Biryani / Mess'
  | 'Late Night Cafe / Shakes'
  | 'Drive-in / Roll Stall'
  | 'Bypass Dhaba / Family Hotel'
  | 'Restobar / Pub / Lounge'
  | 'Late Snooker / Turf / Gaming'
  | 'Highway Petrol Bunk & Air'
  | '24/7 Pharmacy / ATM'
  | 'Scenic Lake / Calm Chill Spot';

export type ClosingTimeRange = '12:00 AM' | '02:00 AM' | '04:00 AM' | '24/7';
export type ShutterRisk = 'uninterrupted' | 'half_shutter_police';
export type CrowdType = 'College Students' | 'Night Shift / IT' | 'Bikers / Riders' | 'Families / Mixed';
export type ParkingType = 'bike_only' | 'street_car_parking' | 'car_drive_in';

export type SpotVibeStatus = 'serving' | 'wrapping_up' | 'closed';
export type CrowdLevel = 'Chill' | 'Moderate' | 'Bustling' | 'Packed' | 'Dead';

export interface Spot {
  id: string;
  name: string;
  landmark?: string;
  area: string;
  lat: number;
  lng: number;
  category: Category;
  spotType?: SpotSubtype;
  
  closingTime?: string;
  closingTimeRange?: ClosingTimeRange;
  isAlwaysOpen?: boolean;
  shutterRisk?: ShutterRisk;
  
  vibes?: number;
  vibeStatus?: SpotVibeStatus;
  crowdLevel?: CrowdLevel;
  crowdTypes?: CrowdType[];
  parking?: ParkingType;
  
  isGirlsSafe: boolean;
  wellLitStreet?: boolean;
  cctvCovered?: boolean;
  upiAccepted?: boolean;
  restroomAvailable?: boolean;
  
  mustTryItem?: string;
  lastUpdated?: string;
  status: 'pending' | 'verified' | 'rejected';
  vouches?: number;
  submittedBy?: string;
}

// Road Alerts
export type RoadAlertType = 
  | 'police' 
  | 'police_check' 
  | 'barricade' 
  | 'waterlogging' 
  | 'dark_stretch' 
  | 'hazard';

export interface RoadAlert {
  id: string;
  type: RoadAlertType;
  title: string;
  description?: string;
  area: string;
  lat: number;
  lng: number;
  createdAt: number;
  upvotes: number;
}

// Ghost Users
export interface GhostUser {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  college?: string;
  lastActive: number;
}

// Confession Wall
export interface Confession {
  id: string;
  message?: string;
  text?: string;
  content?: string;
  area?: string;
  timestamp?: number;
  createdAt?: number | string;
  created_at?: string;
  likes?: number;
  upvotes: number;
  color?: string;
  [key: string]: any;
}

// User Profile & Auth
export interface UserProfile {
  id: string;
  email?: string;
  name: string;
  college?: string;
  area?: string;
  avatar?: string;
  [key: string]: any;
}

export interface VibeProfile {
  id: string;
  name: string;
  avatar?: string;
  favoriteSong: string;
  favoriteArtist: string;
  mindDialogue: string;
  craving: string;
  vibeRule: string;
  isLive: boolean;
  connectedWith?: string[];
  updatedAt: number;
}

export interface VibeMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface VibeProfile {
  id: string;
  name: string;
  favoriteSong: string;
  favoriteArtist: string;
  mindDialogue: string;
  craving: string;
  vibeRule: string;
  isLive: boolean;
  updatedAt: number;
}