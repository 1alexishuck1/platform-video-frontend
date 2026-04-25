// Core domain types — mirrors backend DB schema

export type UserRole = "USER" | "ADMIN";
export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "WAITING_IN_QUEUE" | "IN_PROGRESS";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  isVerified?: boolean;
  avatarUrl?: string; // Corrected from avatar_url to match backend camelCase
  createdAt: string;
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
  isLive: boolean; // Virtual queue live status
  isVerified?: boolean; // Real API
  category?: string;
  rating?: number;
  total_sessions?: number;
  queueCount?: number;
  userId?: string; // Real API
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
  startsAt?: string; // Real API
  ends_at: string;
  endsAt?: string; // Real API
  status: BookingStatus | string;
  payment_id?: string;
  price: number;
  priceUsd?: number; // Real API
  duration_sec: number;
  durationSec?: number; // Real API
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
