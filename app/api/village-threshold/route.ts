import { createServerClient } from '@/lib/supabase/server';
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

    const client = await createServerClient();

    const { data: village, error } = await client
      .from('villages')
      .select(
        'id, name_en, name_bn, current_total_kg, min_threshold_kg, delivery_fee'
      )
      .eq('id', villageId)
      .single();

    if (error || !village) {
      return NextResponse.json(
        { success: false, error: 'Village not found' },
        { status: 404 }
      );
    }

    const percentage = Math.min(
      100,
      Math.round((village.current_total_kg / village.min_threshold_kg) * 100)
    );
    const kg_remaining = Math.max(
      0,
      village.min_threshold_kg - village.current_total_kg
    );
    const is_free = village.current_total_kg >= village.min_threshold_kg;

    return NextResponse.json({
      success: true,
      data: {
        village_name: village.name_en,
        current_kg: village.current_total_kg,
        threshold_kg: village.min_threshold_kg,
        percentage,
        kg_remaining,
        delivery_fee: is_free ? 0 : village.delivery_fee,
        is_free,
      },
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
