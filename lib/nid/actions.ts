'use server';

import { createServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';
import {
  notifyNIDStatusChange,
} from '@/lib/notifications/actions';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadNIDPhotoResult {
  success: boolean;
  error?: string;
  url?: string;
}

/**
 * Validate and upload NID photo to Supabase Storage
 */
async function uploadNIDPhoto(
  fileData: Buffer,
  fileName: string,
  userId: string
): Promise<UploadNIDPhotoResult> {
  try {
    // Validate file size
    if (fileData.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'File size exceeds 10 MB limit',
      };
    }

    // Use service role to upload to storage
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
      return {
        success: false,
        error: 'Failed to upload file',
      };
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('nid-documents')
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (err) {
    console.error('NID photo upload error:', err);
    return {
      success: false,
      error: 'Upload failed',
    };
  }
}

/**
 * SELLER FLOW: Submit NID photos for verification
 * Validates seller role, uploads both front and back photos, sets status to PENDING
 */
export async function submitNIDVerification(
  frontPhotoData: Buffer,
  backPhotoData: Buffer,
  frontFileName: string,
  backFileName: string
) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify seller role
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, nid_status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Profile not found' };
  }

  if (profile.role !== 'SELLER') {
    return { success: false, error: 'Only sellers can submit NID' };
  }

  // Don't allow resubmission if already approved
  if (profile.nid_status === 'APPROVED') {
    return {
      success: false,
      error: 'Your NID is already verified',
    };
  }

  // Upload front photo
  const frontResult = await uploadNIDPhoto(
    frontPhotoData,
    frontFileName,
    user.id
  );

  if (!frontResult.success) {
    return {
      success: false,
      error: `Front photo upload failed: ${frontResult.error}`,
    };
  }

  // Upload back photo
  const backResult = await uploadNIDPhoto(
    backPhotoData,
    backFileName,
    user.id
  );

  if (!backResult.success) {
    return {
      success: false,
      error: `Back photo upload failed: ${backResult.error}`,
    };
  }

  // Update profile with new URLs and set status to PENDING
  const { error: updateError } = await client
    .from('profiles')
    .update({
      nid_status: 'PENDING',
      nid_front_url: frontResult.url,
      nid_back_url: backResult.url,
      nid_rejection_reason: null,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Profile update error:', updateError);
    return {
      success: false,
      error: 'Failed to update profile',
    };
  }

  // TODO: Send SMS notification to seller
  // MESSAGE: "আপনার NID যাচাইয়ের জন্য জমা দেওয়া হয়েছে। ২৪ ঘণ্টার মধ্যে ফলাফল জানানো হবে।"

  return {
    success: true,
    message: 'NID submitted for verification. You will receive updates within 24 hours.',
  };
}

/**
 * ADMIN FLOW: Approve seller NID
 */
export async function approveSellerNID(sellerId: string) {
  const client = await createServerClient();
  const adminUser = await getCurrentUser();

  if (!adminUser) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify admin role
  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  // Get seller profile with phone
  const { data: seller, error: sellerError } = await client
    .from('profiles')
    .select('id, phone, nid_status')
    .eq('id', sellerId)
    .single();

  if (sellerError || !seller) {
    return { success: false, error: 'Seller not found' };
  }

  if (seller.nid_status === 'APPROVED') {
    return { success: false, error: 'This seller is already approved' };
  }

  // Update NID status to APPROVED
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      nid_status: 'APPROVED',
      nid_rejection_reason: null,
    })
    .eq('id', sellerId);

  if (updateError) {
    console.error('NID approval error:', updateError);
    return { success: false, error: 'Failed to approve NID' };
  }

  // Send SMS notification (non-blocking)
  try {
    await notifyNIDStatusChange(sellerId, 'APPROVED');
  } catch (err) {
    console.error('Error sending notification:', err);
    // Don't fail the approval if notification fails
  }

  return {
    success: true,
    message: `Seller NID approved. SMS sent to ${seller.phone}`,
  };
}

/**
 * ADMIN FLOW: Reject seller NID with reason
 */
export async function rejectSellerNID(
  sellerId: string,
  rejectionReason: string
) {
  const client = await createServerClient();
  const adminUser = await getCurrentUser();

  if (!adminUser) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify admin role
  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    return { success: false, error: 'Rejection reason is required' };
  }

  // Get seller phone
  const { data: seller, error: sellerError } = await client
    .from('profiles')
    .select('phone')
    .eq('id', sellerId)
    .single();

  if (sellerError || !seller) {
    return { success: false, error: 'Seller not found' };
  }

  // Update NID status to REJECTED
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      nid_status: 'REJECTED',
      nid_rejection_reason: rejectionReason,
    })
    .eq('id', sellerId);

  if (updateError) {
    console.error('NID rejection error:', updateError);
    return { success: false, error: 'Failed to reject NID' };
  }

  // Send SMS notification (non-blocking)
  try {
    await notifyNIDStatusChange(sellerId, 'REJECTED');
  } catch (err) {
    console.error('Error sending notification:', err);
    // Don't fail the rejection if notification fails
  }

  return {
    success: true,
    message: `NID rejected. SMS sent to ${seller.phone}`,
  };
}

/**
 * Allow seller to resubmit NID after rejection
 */
export async function resubmitNID(
  frontPhotoData: Buffer,
  backPhotoData: Buffer,
  frontFileName: string,
  backFileName: string
) {
  // Same as submitNIDVerification, but for rejected sellers
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
export async function getNIDStatus() {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: profile, error } = await client
    .from('profiles')
    .select('nid_status, nid_rejection_reason, nid_front_url, nid_back_url')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching NID status:', error);
    return { success: false, error: 'Failed to fetch status' };
  }

  return {
    success: true,
    data: {
      status: profile.nid_status,
      reason: profile.nid_rejection_reason,
      frontUrl: profile.nid_front_url,
      backUrl: profile.nid_back_url,
    },
  };
}

/**
 * Get all pending NID approvals (Admin only)
 */
export async function getPendingNIDApprovals() {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify admin role
  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' };
  }

  // Fetch pending sellers (ordered by oldest first)
  const { data: pendingSellers, error } = await client
    .from('profiles')
    .select('id, full_name, phone, nid_status, nid_front_url, nid_back_url, created_at')
    .eq('role', 'SELLER')
    .eq('nid_status', 'PENDING')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending NIDs:', error);
    return { success: false, error: 'Failed to fetch pending approvals' };
  }

  return {
    success: true,
    data: pendingSellers,
  };
}

/**
 * Get rejected sellers (Admin only)
 */
export async function getRejectedNIDs() {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify admin role
  const { data: adminProfile, error: adminError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminError || adminProfile?.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' };
  }

  // Fetch rejected sellers
  const { data: rejectedSellers, error } = await client
    .from('profiles')
    .select('id, full_name, phone, nid_rejection_reason, nid_front_url, nid_back_url, created_at')
    .eq('role', 'SELLER')
    .eq('nid_status', 'REJECTED')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rejected NIDs:', error);
    return { success: false, error: 'Failed to fetch rejected approvals' };
  }

  return {
    success: true,
    data: rejectedSellers,
  };
}
