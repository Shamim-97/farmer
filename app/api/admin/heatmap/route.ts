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
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { data: villages } = await client
      .from('villages')
      .select('id, name_en, gps_lat, gps_lng');

    if (!villages) {
      return NextResponse.json({ success: true, data: [] });
    }

    const heatmapData = await Promise.all(
      villages.map(async (village) => {
        const { data: orders, count } = await client
          .from('orders')
          .select('total_amount', { count: 'exact' })
          .eq('village_id', village.id)
          .eq('status', 'COLLECTED');

        const revenue = (orders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const intensity = Math.min(1, (count || 0) / 100);

        return {
          village: village.name_en,
          lat: village.gps_lat,
          lng: village.gps_lng,
          orders_count: count || 0,
          intensity,
          revenue,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    console.error('Heatmap API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
