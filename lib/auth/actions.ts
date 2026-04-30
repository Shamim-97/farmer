'use server';

import type { User } from '@supabase/supabase-js';
import { createServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { UserProfile } from '@/lib/types/auth';
import { isPlaceholderEnv } from '@/lib/env';
import { ok, err, type Result } from '@/lib/types/result';
import { redirect } from 'next/navigation';

const ENV_NOT_CONFIGURED = err(
  'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
);

/**
 * Sign up new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  phone: string
): Promise<Result<{ user: User; message: string }>> {
  if (isPlaceholderEnv()) return ENV_NOT_CONFIGURED;
  const client = await createServerClient();

  const { data: authData, error: authError } = await client.auth.signUp({
    email,
    password,
    options: { data: { phone } },
  });

  if (authError) return err(authError.message);
  if (!authData.user) return err('Failed to create user');

  const { error: profileError } = await client.from('profiles').insert({
    id: authData.user.id,
    phone,
    full_name: '',
    role: 'CUSTOMER',
    nid_status: 'PENDING',
    is_active: true,
  });

  if (profileError) {
    console.error('Profile creation error:', profileError);
    return err('Failed to create profile');
  }

  return ok({
    user: authData.user,
    message: 'Sign up successful. Please check your email to confirm.',
  });
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<Result<{ user: User }>> {
  if (isPlaceholderEnv()) return ENV_NOT_CONFIGURED;
  const client = await createServerClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return err(error.message);
  return ok({ user: data.user });
}

/**
 * Sign out current user
 */
export async function signOut() {
  if (isPlaceholderEnv()) redirect('/signin');
  const client = await createServerClient();

  const { error } = await client.auth.signOut();
  if (error) return err(error.message);
  redirect('/');
}

/**
 * Get current user (server-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  if (isPlaceholderEnv()) return null;
  const client = await createServerClient();

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<Result<void>> {
  const client = await createServerClient();

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.id !== userId) return err('Unauthorized');

  const { error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) return err(error.message);
  return ok(undefined);
}

/**
 * SELLER FLOW: Upload NID photos for verification
 */
export async function uploadNIDPhotos(
  userId: string,
  frontPhotoUrl: string,
  backPhotoUrl: string
): Promise<Result<{ message: string }>> {
  const client = await createServerClient();

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError || profile?.role !== 'SELLER') {
    return err('Only sellers can upload NID');
  }

  const { error } = await client
    .from('profiles')
    .update({
      nid_status: 'PENDING',
      nid_front_url: frontPhotoUrl,
      nid_back_url: backPhotoUrl,
    })
    .eq('id', userId);

  if (error) return err(error.message);
  return ok({ message: 'NID submitted. Review within 24 hours.' });
}

/**
 * ADMIN FLOW: Approve seller NID
 */
export async function approveSellerNID(
  sellerId: string,
  adminId: string
): Promise<Result<void>> {
  const client = await createServerClient();

  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return err('Unauthorized: Only admins can approve NIDs');
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ nid_status: 'APPROVED', nid_rejection_reason: null })
    .eq('id', sellerId);

  if (error) return err(error.message);
  return ok(undefined);
}

/**
 * ADMIN FLOW: Reject seller NID with reason
 */
export async function rejectSellerNID(
  sellerId: string,
  adminId: string,
  rejectionReason: string
): Promise<Result<void>> {
  const client = await createServerClient();

  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return err('Unauthorized: Only admins can reject NIDs');
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      nid_status: 'REJECTED',
      nid_rejection_reason: rejectionReason,
    })
    .eq('id', sellerId);

  if (error) return err(error.message);
  return ok(undefined);
}

/**
 * Verify phone number via OTP (placeholder for Twilio integration)
 */
export async function sendPhoneOTP(_phone: string): Promise<Result<{ message: string }>> {
  return ok({ message: 'OTP sent to phone' });
}

/**
 * Verify OTP
 */
export async function verifyPhoneOTP(
  phone: string,
  _otp: string
): Promise<Result<void>> {
  const client = await createServerClient();

  const { error } = await client
    .from('profiles')
    .update({ phone })
    .eq('phone', phone);

  if (error) return err('Could not verify phone');
  return ok(undefined);
}

/**
 * Password reset via email
 */
export async function resetPassword(
  email: string
): Promise<Result<{ message: string }>> {
  const client = await createServerClient();

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL}/auth/update-password`,
  });

  if (error) return err(error.message);
  return ok({ message: 'Check your email for reset link' });
}

/**
 * Update password
 */
export async function updatePassword(
  newPassword: string
): Promise<Result<void>> {
  const client = await createServerClient();

  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) return err(error.message);
  return ok(undefined);
}
