// supabase/functions/village-progress/index.ts
// Edge Function: GET /village-progress?village_id=X
// Returns village threshold progress for real-time UI updates

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface VillageProgressResponse {
  village_name: string;
  current_kg: number;
  threshold_kg: number;
  percentage: number;
  kg_remaining: number;
  delivery_fee: number;
  is_free: boolean;
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Get village_id from query parameters
    const url = new URL(req.url);
    const villageId = url.searchParams.get('village_id');

    if (!villageId) {
      return new Response(
        JSON.stringify({ error: 'Missing village_id parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch village data
    const { data: village, error: villageError } = await client
      .from('villages')
      .select('id, name_en, name_bn, min_threshold_kg, current_total_kg, delivery_fee')
      .eq('id', villageId)
      .single();

    if (villageError || !village) {
      return new Response(
        JSON.stringify({ error: 'Village not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate progress
    const current_kg = village.current_total_kg || 0;
    const threshold_kg = village.min_threshold_kg;
    const percentage = Math.min(100, Math.round((current_kg / threshold_kg) * 100));
    const kg_remaining = Math.max(0, threshold_kg - current_kg);
    const is_free = current_kg >= threshold_kg;
    const delivery_fee = is_free ? 0 : village.delivery_fee;

    const response: VillageProgressResponse = {
      village_name: village.name_en || village.name_bn,
      current_kg,
      threshold_kg,
      percentage,
      kg_remaining,
      delivery_fee,
      is_free,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Village progress error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
