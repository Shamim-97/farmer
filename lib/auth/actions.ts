'use server';

import { createServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { UserProfile } from '@/lib/types/auth';
import { redirect } from 'next/navigation';

/**
 * Sign up new user with email and password
 */
export async function signUp(email: string, password: string, phone: string) {
  const client = await createServerClient();

  // Create auth user
  const { data: authData, error: authError } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        phone,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Failed to create user' };
  }

  // Create profile record
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
    return { error: 'Failed to create profile' };
  }

  return {
    success: true,
    message: 'Sign up successful. Please check your email to confirm.',
    user: authData.user,
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const client = await createServerClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    user: data.user,
  };
}

/**
 * Sign out current user
 */
export async function signOut() {
  const client = await createServerClient();

  const { error } = await client.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

/**
 * Get current user (server-side)
 */
export async function getCurrentUser() {
  const client = await createServerClient();

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
) {
  const client = await createServerClient();

  // Verify user is updating their own profile
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.id !== userId) {
    return { error: 'Unauthorized' };
  }

  const { error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * SELLER FLOW: Upload NID photos for verification
 */
export async function uploadNIDPhotos(
  userId: string,
  frontPhotoUrl: string,
  backPhotoUrl: string
) {
  const client = await createServerClient();

  // Verify user is seller
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError || profile?.role !== 'SELLER') {
    return { error: 'Only sellers can upload NID' };
  }

  // Update NID status to PENDING and store photo URLs
  const { error } = await client
    .from('profiles')
    .update({
      nid_status: 'PENDING',
      nid_front_url: frontPhotoUrl,
      nid_back_url: backPhotoUrl,
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  // TODO: Trigger SMS notification to seller with "Under Review" message

  return { success: true, message: 'NID submitted. Review within 24 hours.' };
}

/**
 * ADMIN FLOW: Approve seller NID
 */
export async function approveSellerNID(
  sellerId: string,
  adminId: string
) {
  const client = await createServerClient();

  // Verify caller is admin
  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return { error: 'Unauthorized: Only admins can approve NIDs' };
  }

  // Update NID status using service role for admin operations
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      nid_status: 'APPROVED',
      nid_rejection_reason: null,
    })
    .eq('id', sellerId);

  if (error) {
    return { error: error.message };
  }

  // TODO: Trigger SMS notification to seller: "NID approved! You can now create listings."
  // TODO: Send SMS to customer: "আপনার NID যাচাই সম্পন্ন। এখন পণ্য যোগ করুন!"

  return { success: true };
}

/**
 * ADMIN FLOW: Reject seller NID with reason
 */
export async function rejectSellerNID(
  sellerId: string,
  adminId: string,
  rejectionReason: string
) {
  // Verify caller is admin
  const client = await createServerClient();

  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return { error: 'Unauthorized: Only admins can reject NIDs' };
  }

  // Use service role to update
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      nid_status: 'REJECTED',
      nid_rejection_reason: rejectionReason,
    })
    .eq('id', sellerId);

  if (error) {
    return { error: error.message };
  }

  // TODO: Trigger SMS notification: "NID যাচাই ব্যর্থ: {reason}. পুনরায় আপলোড করুন।"

  return { success: true };
}

/**
 * Verify phone number via OTP (placeholder for Twilio integration)
 */
export async function sendPhoneOTP(phone: string) {
  // TODO: Call Twilio SMS API to send OTP
  // TODO: Store OTP hash in Redis with 10-minute expiry

  return { success: true, message: 'OTP sent to phone' };
}

/**
 * Verify OTP
 */
export async function verifyPhoneOTP(phone: string, otp: string) {
  // TODO: Check OTP against Redis hash

  const client = await createServerClient();

  // Update phone verified status
  const { error } = await client
    .from('profiles')
    .update({ phone: phone })
    .eq('phone', phone);

  if (error) {
    return { error: 'Could not verify phone' };
  }

  return { success: true };
}

/**
 * Password reset via email
 */
export async function resetPassword(email: string) {
  const client = await createServerClient();

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL}/auth/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Check your email for reset link' };
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const client = await createServerClient();

  const { error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
