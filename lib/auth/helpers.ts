import { createServerClient } from '@/lib/supabase/server';
import { UserRole, UserProfile, NIDStatus } from '@/lib/types/auth';

/**
 * Get current authenticated user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const client = await createServerClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile;
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === role;
}

/**
 * Check if current user is ADMIN
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('ADMIN');
}

/**
 * Check if current user is SELLER with APPROVED NID
 */
export async function isApprovedSeller(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'SELLER' && profile?.nid_status === 'APPROVED';
}

/**
 * Check if current user is PICKUP_AGENT
 */
export async function isPickupAgent(): Promise<boolean> {
  return hasRole('PICKUP_AGENT');
}

/**
 * Check if current user is CUSTOMER
 */
export async function isCustomer(): Promise<boolean> {
  return hasRole('CUSTOMER');
}

/**
 * RULE 1: THE 10 PM LOCK
 * Check if current time is within order window (before 22:00 Bangladesh time)
 * Returns { isAllowed: boolean, nextWindowAt: string }
 */
export function checkOrderWindow(): {
  isAllowed: boolean;
  nextWindowAt: string;
  hoursUntilWindow: number;
} {
  const dhakaTz = 'Asia/Dhaka';
  const now = new Date();

  // Convert to Bangladesh time (UTC+6)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: dhakaTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const timeObj = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  const currentHour = parseInt(timeObj.hour, 10);
  const currentMinute = parseInt(timeObj.minute, 10);
  const currentSeconds = parseInt(timeObj.second, 10);

  // 10 PM cutoff = 22:00
  const CUTOFF_HOUR = 22;
  const isBeforeCutoff = currentHour < CUTOFF_HOUR;

  // Calculate next window (6 AM = 06:00)
  const nextWindow = new Date(now);
  if (isBeforeCutoff) {
    // Next window is tomorrow at 6 AM
    nextWindow.setDate(nextWindow.getDate() + 1);
  }
  nextWindow.setHours(6, 0, 0, 0);

  const hoursUntil = Math.ceil((nextWindow.getTime() - now.getTime()) / (1000 * 60 * 60));

  return {
    isAllowed: isBeforeCutoff,
    nextWindowAt: nextWindow.toISOString(),
    hoursUntilWindow: hoursUntil,
  };
}

/**
 * RULE 2: THE NID GATE
 * Check if seller can access listing creation
 */
export async function canCreateListing(): Promise<{
  allowed: boolean;
  nidStatus?: NIDStatus;
  reason?: string;
}> {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  if (profile.role !== 'SELLER') {
    return { allowed: false, reason: 'Only sellers can create listings' };
  }

  if (profile.nid_status === 'APPROVED') {
    return { allowed: true, nidStatus: 'APPROVED' };
  }

  if (profile.nid_status === 'PENDING') {
    return {
      allowed: false,
      nidStatus: 'PENDING',
      reason: 'NID is under review. Please wait 24 hours.',
    };
  }

  if (profile.nid_status === 'REJECTED') {
    return {
      allowed: false,
      nidStatus: 'REJECTED',
      reason: profile.nid_rejection_reason || 'NID was rejected. Please resubmit.',
    };
  }

  return { allowed: false, reason: 'Unknown NID status' };
}

/**
 * Get user's village info
 */
export async function getUserVillage() {
  const profile = await getCurrentUserProfile();

  if (!profile || !profile.village_id) {
    return null;
  }

  const client = await createServerClient();
  const { data, error } = await client
    .from('villages')
    .select('*')
    .eq('id', profile.village_id)
    .single();

  if (error) {
    console.error('Error fetching village:', error);
    return null;
  }

  return data;
}
