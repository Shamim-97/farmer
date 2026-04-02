import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await createServerClient();

    // Verify admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get refund statistics
    const { data: refundStats, error } = await client
      .from('refund_requests')
      .select('status, id')
      .order('requested_at', { ascending: false });

    if (error) throw error;

    const stats = {
      total: refundStats?.length || 0,
      pending: refundStats?.filter((r) => r.status === 'PENDING').length || 0,
      approved: refundStats?.filter((r) => r.status === 'APPROVED').length || 0,
      rejected: refundStats?.filter((r) => r.status === 'REJECTED').length || 0,
      processed: refundStats?.filter((r) => r.status === 'PROCESSED').length || 0,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Refund API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
