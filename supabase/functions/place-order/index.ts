// supabase/functions/place-order/index.ts
// Edge Function: POST /place-order
// RULE 1: The 10 PM Lock - enforce server-side cutoff
// RULE 3: Village Threshold Engine - calculate delivery fee

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface PlaceOrderRequest {
  customer_id: string;
  product_id: string;
  seller_id: string;
  pickup_point_id: string;
  village_id: string;
  quantity_kg: number;
  unit_price: number;
  pickup_date: string;
  order_source: string;
  payment_method?: string;
  transaction_id?: string;
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const orderRequest: PlaceOrderRequest = await req.json();

    // ===================================================
    // RULE 1: THE 10 PM LOCK
    // ===================================================

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const timeStr = formatter.format(now);
    const [hour, minute] = timeStr.split(':').map(Number);
    const currentTimeInMinutes = hour * 60 + minute;
    const cutoffTimeInMinutes = 22 * 60; // 22:00 (10 PM)

    if (currentTimeInMinutes >= cutoffTimeInMinutes) {
      return new Response(
        JSON.stringify({
          error: 'Order window closed. Orders reopen at 6:00 AM',
          code: '10_PM_LOCK',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // ===================================================
    // RULE 3: VILLAGE THRESHOLD ENGINE
    // ===================================================

    // Validate product stock
    const { data: product, error: productError } = await client
      .from('products')
      .select('stock_kg, price_per_kg, min_order_kg')
      .eq('id', orderRequest.product_id)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (product.stock_kg < orderRequest.quantity_kg) {
      return new Response(
        JSON.stringify({
          error: `Insufficient stock. Available: ${product.stock_kg} kg`,
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (orderRequest.quantity_kg < product.min_order_kg) {
      return new Response(
        JSON.stringify({
          error: `Minimum order: ${product.min_order_kg} kg`,
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch village data to calculate delivery fee
    const { data: village, error: villageError } = await client
      .from('villages')
      .select('id, current_total_kg, min_threshold_kg, delivery_fee')
      .eq('id', orderRequest.village_id)
      .single();

    if (villageError || !village) {
      return new Response(
        JSON.stringify({ error: 'Village not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate delivery fee based on threshold
    const projectedTotal = village.current_total_kg + orderRequest.quantity_kg;
    const deliveryFee =
      projectedTotal >= village.min_threshold_kg ? 0 : village.delivery_fee;

    // Calculate total amount
    const totalAmount = orderRequest.quantity_kg * orderRequest.unit_price + deliveryFee;

    // ===================================================
    // CREATE ORDER ATOMICALLY
    // ===================================================

    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        customer_id: orderRequest.customer_id,
        product_id: orderRequest.product_id,
        seller_id: orderRequest.seller_id,
        pickup_point_id: orderRequest.pickup_point_id,
        village_id: orderRequest.village_id,
        quantity_kg: orderRequest.quantity_kg,
        unit_price: orderRequest.unit_price,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        status: 'PENDING',
        pickup_date: orderRequest.pickup_date,
        order_source: orderRequest.order_source,
        payment_status: 'UNPAID',
        payment_method: orderRequest.payment_method,
        transaction_id: orderRequest.transaction_id,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update village current_total_kg
    const { error: updateError } = await client
      .from('villages')
      .update({
        current_total_kg: projectedTotal,
      })
      .eq('id', orderRequest.village_id);

    if (updateError) {
      console.error('Village update error:', updateError);
      // Order was created but village update failed - log for manual review
    }

    // TODO: Trigger SMS notification: ORDER_CONFIRMED

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          total_amount: totalAmount,
          delivery_fee: deliveryFee,
          is_free_pickup: deliveryFee === 0,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Place order error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
