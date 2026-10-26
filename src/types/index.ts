export type Category = 'all' | 'food' | 'ride_stops' | 'essentials' | 'chill';

export type SpotVibeStatus = 'serving' | 'wrapping_up' | 'closed';
export type CrowdLevel = 'Chill' | 'Packed' | 'Dead';

export interface Spot {
  id: string;
  name: string;
  area: string;
  category: Category;
  lat: number;
  lng: number;
  closingTime?: string;
  isGirlsSafe?: boolean;
  status?: 'verified' | 'pending';
  vibes?: string[];
  submittedBy?: string;
  vibeStatus?: SpotVibeStatus;
  crowdLevel?: CrowdLevel;
  lastUpdated?: string;
}

export type RoadAlertType = 'police' | 'dark_stretch' | 'barricade' | 'hazard';

export interface RoadAlert {
  id: string;
  type: RoadAlertType;
  title: string;
  area: string;
  lat: number;
  lng: number;
  createdAt: number; // Unix timestamp for the 30-min timer
  upvotes: number;
}

export interface Confession {
  id: string;
  text: string;
  area: string;
  upvotes: number;
  createdAt: string;
  imageUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  college?: string;
  isStudentVerified: boolean;
  role: 'user' | 'admin';
}

export interface GhostUser {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  college?: string;
  lastActive: number;
}