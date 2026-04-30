import { createServerClient } from '@/lib/supabase/server';
import { isPlaceholderEnv } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const villageId = request.nextUrl.searchParams.get('village_id');

    if (!villageId) {
      return NextResponse.json(
        { success: false, error: 'village_id is required' },
        { status: 400 }
      );
    }

    if (isPlaceholderEnv()) {
      return NextResponse.json({ success: true, data: [] });
    }

    const client = await createServerClient();

    const { data: points, error } = await client
      .from('pickup_points')
      .select('id, name, gps_lat, gps_lng, is_active')
      .eq('village_id', villageId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pickup points' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: points || [],
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
