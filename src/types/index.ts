// Core domain types — mirrors backend DB schema

export type UserRole = "fan" | "talent" | "admin";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface TalentProfile {
  id: string;
  user_id: string;
  stage_name: string;
  stageName?: string; // Real API
  bio: string;
  avatar_url: string;
  avatarUrl?: string; // Real API
  price_usd: number;
  priceUsd?: number; // Real API
  session_duration_sec: number;
  sessionDurationMin?: number; // Real API
  timezone: string;
  is_active: boolean;
  category?: string;
  rating?: number;
  total_sessions?: number;
}

export interface AvailabilityRule {
  id: string;
  talent_id: string;
  weekday: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:mm
  end_time: string;
}

export interface Booking {
  id: string;
  user_id: string;
  talent_id: string;
  talent?: TalentProfile;
  fan?: User;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  payment_id?: string;
  price: number;
  duration_sec: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
