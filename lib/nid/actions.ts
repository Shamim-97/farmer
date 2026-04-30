'use server';

import { createServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';
import { ok, err, type Result } from '@/lib/types/result';
import {
  notifyNIDStatusChange,
} from '@/lib/notifications/actions';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validate and upload NID photo to Supabase Storage
 */
async function uploadNIDPhoto(
  fileData: Buffer,
  fileName: string,
  userId: string
): Promise<Result<string>> {
  try {
    if (fileData.length > MAX_FILE_SIZE) {
      return err('File size exceeds 10 MB limit');
    }

    const filePath = `${userId}/${Date.now()}-${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('nid-documents')
      .upload(filePath, fileData, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('Upload error:', error);
      return err('Failed to upload file');
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('nid-documents')
      .getPublicUrl(data.path);

    return ok(urlData.publicUrl);
  } catch (e) {
    console.error('NID photo upload error:', e);
    return err('Upload failed');
  }
}

/**
 * SELLER FLOW: Submit NID photos for verification
 */
export async function submitNIDVerification(
  frontPhotoData: Buffer,
  backPhotoData: Buffer,
  frontFileName: string,
  backFileName: string
): Promise<Result<{ message: string }>> {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return err('Not authenticated');

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, nid_status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return err('Profile not found');
  if (profile.role !== 'SELLER') return err('Only sellers can submit NID');
  if (profile.nid_status === 'APPROVED') {
    return err('Your NID is already verified');
  }

  const frontResult = await uploadNIDPhoto(frontPhotoData, frontFileName, user.id);
  if (!frontResult.success) {
    return err(`Front photo upload failed: ${frontResult.error}`);
  }

  const backResult = await uploadNIDPhoto(backPhotoData, backFileName, user.id);
  if (!backResult.success) {
    return err(`Back photo upload failed: ${backResult.error}`);
  }

  const { error: updateError } = await client
    .from('profiles')
    .update({
      nid_status: 'PENDING',
      nid_front_url: frontResult.data,
      nid_back_url: backResult.data,
      nid_rejection_reason: null,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Profile update error:', updateError);
    return err('Failed to update profile');
  }

  return ok({
    message: 'NID submitted for verification. You will receive updates within 24 hours.',
  });
}

/**
 * ADMIN FLOW: Approve seller NID
 */
export async function approveSellerNID(
  sellerId: string
): Promise<Result<{ message: string }>> {
  const client = await createServerClient();
  const adminUser = await getCurrentUser();

  if (!adminUser) return err('Not authenticated');

  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return err('Unauthorized: Admin access required');
  }

  const { data: seller, error: sellerError } = await client
    .from('profiles')
    .select('id, phone, nid_status')
    .eq('id', sellerId)
    .single();

  if (sellerError || !seller) return err('Seller not found');
  if (seller.nid_status === 'APPROVED') {
    return err('This seller is already approved');
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ nid_status: 'APPROVED', nid_rejection_reason: null })
    .eq('id', sellerId);

  if (updateError) {
    console.error('NID approval error:', updateError);
    return err('Failed to approve NID');
  }

  try {
    await notifyNIDStatusChange(sellerId, 'APPROVED');
  } catch (e) {
    console.error('Error sending notification:', e);
  }

  return ok({ message: `Seller NID approved. SMS sent to ${seller.phone}` });
}

/**
 * ADMIN FLOW: Reject seller NID with reason
 */
export async function rejectSellerNID(
  sellerId: string,
  rejectionReason: string
): Promise<Result<{ message: string }>> {
  const client = await createServerClient();
  const adminUser = await getCurrentUser();

  if (!adminUser) return err('Not authenticated');

  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return err('Unauthorized: Admin access required');
  }

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    return err('Rejection reason is required');
  }

  const { data: seller, error: sellerError } = await client
    .from('profiles')
    .select('phone')
    .eq('id', sellerId)
    .single();

  if (sellerError || !seller) return err('Seller not found');

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      nid_status: 'REJECTED',
      nid_rejection_reason: rejectionReason,
    })
    .eq('id', sellerId);

  if (updateError) {
    console.error('NID rejection error:', updateError);
    return err('Failed to reject NID');
  }

  try {
    await notifyNIDStatusChange(sellerId, 'REJECTED');
  } catch (e) {
    console.error('Error sending notification:', e);
  }

  return ok({ message: `NID rejected. SMS sent to ${seller.phone}` });
}

/**
 * Allow seller to resubmit NID after rejection
 */
export async function resubmitNID(
  frontPhotoData: Buffer,
  backPhotoData: Buffer,
  frontFileName: string,
  backFileName: string
): Promise<Result<{ message: string }>> {
  return submitNIDVerification(
    frontPhotoData,
    backPhotoData,
    frontFileName,
    backFileName
  );
}

/**
 * Get seller NID verification status
 */
export async function getNIDStatus(): Promise<
  Result<{
    status: string;
    reason: string | null;
    frontUrl: string | null;
    backUrl: string | null;
  }>
> {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return err('Not authenticated');

  const { data: profile, error } = await client
    .from('profiles')
    .select('nid_status, nid_rejection_reason, nid_front_url, nid_back_url')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching NID status:', error);
    return err('Failed to fetch status');
  }

  return ok({
    status: profile.nid_status,
    reason: profile.nid_rejection_reason,
    frontUrl: profile.nid_front_url,
    backUrl: profile.nid_back_url,
  });
}

/**
 * Get all pending NID approvals (Admin only)
 */
export async function getPendingNIDApprovals(): Promise<Result<unknown[]>> {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return err('Not authenticated');

  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return err('Admin access required');
  }

  const { data: pendingSellers, error } = await client
    .from('profiles')
    .select('id, full_name, phone, nid_status, nid_front_url, nid_back_url, created_at')
    .eq('role', 'SELLER')
    .eq('nid_status', 'PENDING')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending NIDs:', error);
    return err('Failed to fetch pending approvals');
  }

  return ok(pendingSellers ?? []);
}

/**
 * Get rejected sellers (Admin only)
 */
export async function getRejectedNIDs(): Promise<Result<unknown[]>> {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) return err('Not authenticated');

  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return err('Admin access required');
  }

  const { data: rejectedSellers, error } = await client
    .from('profiles')
    .select('id, full_name, phone, nid_rejection_reason, nid_front_url, nid_back_url, created_at')
    .eq('role', 'SELLER')
    .eq('nid_status', 'REJECTED')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rejected NIDs:', error);
    return err('Failed to fetch rejected approvals');
  }

  return ok(rejectedSellers ?? []);
}
