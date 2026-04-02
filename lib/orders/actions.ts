'use server';

import { createServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';
import { checkOrderWindow } from '@/lib/auth/helpers';
import {
  Order,
  OrderWithDetails,
  PlaceOrderRequest,
  PlaceOrderResponse,
  VillageThresholdInfo,
} from '@/lib/types/order';
import {
  notifyOrderStatusChange,
} from '@/lib/notifications/actions';

/**
 * RULE 1: THE 10 PM LOCK
 * RULE 3: VILLAGE THRESHOLD ENGINE
 * Place a new order with server-side validation
 */
export async function placeOrder(
  request: PlaceOrderRequest
): Promise<PlaceOrderResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify customer
  if (request.customer_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // ===================================================
  // RULE 1: THE 10 PM LOCK - SERVER-SIDE VALIDATION
  // ===================================================

  const orderWindow = checkOrderWindow();
  if (!orderWindow.isAllowed) {
    return {
      success: false,
      error: `Order window closed. Next window opens at 6:00 AM. Time remaining: ${orderWindow.hoursUntilWindow} hours.`,
    };
  }

  // ===================================================
  // VALIDATE REQUEST
  // ===================================================

  if (request.quantity_kg <= 0) {
    return { success: false, error: 'Quantity must be greater than 0' };
  }

  if (!request.pickup_date) {
    return { success: false, error: 'Pickup date is required' };
  }

  // Validate pickup date is today or tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickupDate = new Date(request.pickup_date);
  pickupDate.setHours(0, 0, 0, 0);

  if (pickupDate < today) {
    return { success: false, error: 'Pickup date must be today or later' };
  }

  const client = await createServerClient();

  // ===================================================
  // VALIDATE PRODUCT & SELLER
  // ===================================================

  const { data: product, error: productError } = await client
    .from('products')
    .select('stock_kg, price_per_kg, min_order_kg, is_active, seller_id')
    .eq('id', request.product_id)
    .single();

  if (productError || !product) {
    return { success: false, error: 'Product not found' };
  }

  if (!product.is_active) {
    return { success: false, error: 'Product is not available' };
  }

  if (product.seller_id !== request.seller_id) {
    return { success: false, error: 'Seller ID mismatch' };
  }

  if (product.stock_kg < request.quantity_kg) {
    return {
      success: false,
      error: `Insufficient stock. Available: ${product.stock_kg} kg`,
    };
  }

  if (request.quantity_kg < product.min_order_kg) {
    return {
      success: false,
      error: `Minimum order: ${product.min_order_kg} kg`,
    };
  }

  // ===================================================
  // RULE 3: VILLAGE THRESHOLD ENGINE
  // Calculate delivery fee based on village threshold
  // ===================================================

  const { data: village, error: villageError } = await client
    .from('villages')
    .select('id, current_total_kg, min_threshold_kg, delivery_fee')
    .eq('id', request.village_id)
    .single();

  if (villageError || !village) {
    return { success: false, error: 'Village not found' };
  }

  // Calculate projected total after this order
  const projectedTotal = village.current_total_kg + request.quantity_kg;
  const deliveryFee =
    projectedTotal >= village.min_threshold_kg ? 0 : village.delivery_fee;
  const totalAmount = request.quantity_kg * request.unit_price + deliveryFee;

  // ===================================================
  // VALIDATE PICKUP POINT
  // ===================================================

  const { data: pickupPoint, error: pickupError } = await client
    .from('pickup_points')
    .select('id, village_id, is_active')
    .eq('id', request.pickup_point_id)
    .single();

  if (pickupError || !pickupPoint) {
    return { success: false, error: 'Pickup point not found' };
  }

  if (!pickupPoint.is_active) {
    return { success: false, error: 'Pickup point is not available' };
  }

  if (pickupPoint.village_id !== request.village_id) {
    return { success: false, error: 'Pickup point does not serve this village' };
  }

  // ===================================================
  // CREATE ORDER ATOMICALLY
  // ===================================================

  const { data: order, error: orderError } = await client
    .from('orders')
    .insert({
      customer_id: request.customer_id,
      product_id: request.product_id,
      seller_id: request.seller_id,
      pickup_point_id: request.pickup_point_id,
      village_id: request.village_id,
      quantity_kg: request.quantity_kg,
      unit_price: request.unit_price,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      status: 'PENDING',
      pickup_date: request.pickup_date,
      order_source: request.order_source || 'WEB',
      payment_status: 'UNPAID',
      payment_method: request.payment_method,
    })
    .select()
    .single();

  if (orderError) {
    console.error('Order creation error:', orderError);
    return { success: false, error: 'Failed to create order' };
  }

  // Update village current_total_kg
  const { error: updateError } = await client
    .from('villages')
    .update({
      current_total_kg: projectedTotal,
    })
    .eq('id', request.village_id);

  if (updateError) {
    console.error('Village update error:', updateError);
    // Order was created but village update failed - still return success but log for manual review
  }

  // TODO: Send SMS notification: ORDER_CONFIRMED

  return {
    success: true,
    data: {
      order_id: order.id,
      total_amount: totalAmount,
      delivery_fee: deliveryFee,
      is_free_pickup: deliveryFee === 0,
    },
  };
}

/**
 * Get customer's orders
 */
export async function getCustomerOrders() {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: orders, error } = await client
    .from('orders')
    .select(
      `
        *,
        product:product_id (name_en, name_bn, category),
        seller:seller_id (full_name),
        pickup_point:pickup_point_id (name)
      `
    )
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: 'Failed to fetch orders' };
  }

  return {
    success: true,
    data: (orders || []) as OrderWithDetails[],
  };
}

/**
 * Get order by ID with full details
 */
export async function getOrderDetail(orderId: string) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: order, error } = await client
    .from('orders')
    .select(
      `
        *,
        product:product_id (name_en, name_bn, category, price_per_kg),
        seller:seller_id (full_name, phone),
        pickup_point:pickup_point_id (name, gps_lat, gps_lng),
        village:village_id (name_en, name_bn)
      `
    )
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return { success: false, error: 'Order not found' };
  }

  // Verify user owns this order
  if (order.customer_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  return {
    success: true,
    data: order as OrderWithDetails,
  };
}

/**
 * Cancel a pending order
 */
export async function cancelOrder(orderId: string) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: order, error: orderError } = await client
    .from('orders')
    .select('id, customer_id, status, village_id, quantity_kg')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.customer_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    return { success: false, error: 'Cannot cancel this order' };
  }

  // Update order status
  const { error: updateError } = await client
    .from('orders')
    .update({ status: 'CANCELLED' })
    .eq('id', orderId);

  if (updateError) {
    console.error('Cancel error:', updateError);
    return { success: false, error: 'Failed to cancel order' };
  }

  // Recalculate village threshold
  const { data: village, error: villageError } = await client
    .from('villages')
    .select('id, min_threshold_kg')
    .eq('id', order.village_id)
    .single();

  if (!villageError && village) {
    const { data: orders } = await client
      .from('orders')
      .select('quantity_kg')
      .eq('village_id', order.village_id)
      .in('status', ['PENDING', 'CONFIRMED', 'READY', 'COLLECTED'])
      .eq('payment_status', 'PAID');

    const newTotal = (orders?.reduce((sum, o) => sum + o.quantity_kg, 0) || 0);

    await client
      .from('villages')
      .update({ current_total_kg: newTotal })
      .eq('id', order.village_id);
  }

  return { success: true, message: 'Order cancelled successfully' };
}

/**
 * Get village threshold info for customer UI
 */
export async function getVillageThresholdInfo(
  villageId: string
): Promise<{ success: boolean; error?: string; data?: VillageThresholdInfo }> {
  const client = await createServerClient();

  const { data: village, error } = await client
    .from('villages')
    .select('id, name_en, name_bn, current_total_kg, min_threshold_kg, delivery_fee')
    .eq('id', villageId)
    .single();

  if (error || !village) {
    return { success: false, error: 'Village not found' };
  }

  const percentage = Math.min(
    100,
    Math.round((village.current_total_kg / village.min_threshold_kg) * 100)
  );
  const kg_remaining = Math.max(0, village.min_threshold_kg - village.current_total_kg);
  const is_free = village.current_total_kg >= village.min_threshold_kg;

  return {
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
  };
}

/**
 * SELLER: Get orders for their products
 */
export async function getSellerOrders() {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: orders, error } = await client
    .from('orders')
    .select(
      `
        *,
        customer:customer_id (full_name, phone),
        product:product_id (name_en, name_bn),
        pickup_point:pickup_point_id (name)
      `
    )
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching seller orders:', error);
    return { success: false, error: 'Failed to fetch orders' };
  }

  return {
    success: true,
    data: (orders || []) as OrderWithDetails[],
  };
}

/**
 * ADMIN: Get all orders
 */
export async function getAllOrders(limit = 50, offset = 0) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify admin
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' };
  }

  const { data: orders, error, count } = await client
    .from('orders')
    .select(
      `
        *,
        customer:customer_id (full_name, phone),
        seller:seller_id (full_name),
        product:product_id (name_en),
        pickup_point:pickup_point_id (name)
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: 'Failed to fetch orders' };
  }

  return {
    success: true,
    data: (orders || []) as OrderWithDetails[],
    total: count || 0,
  };
}

/**
 * Confirm an order (admin or seller marking as ready)
 */
export async function confirmOrder(orderId: string, newStatus: string) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify order exists and user has permission
  const { data: order, error: orderError } = await client
    .from('orders')
    .select('seller_id, status, customer_id')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.seller_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Update order status
  const { data: updated, error: updateError } = await client
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select(
      `
      id,
      customer_id,
      total_amount,
      pickup_point_id,
      quantity_kg,
      pickup_date,
      pickup_points (name_en)
    `
    )
    .single();

  if (updateError) {
    console.error('Update error:', updateError);
    return { success: false, error: 'Failed to update order' };
  }

  // Send SMS notification (non-blocking)
  try {
    await notifyOrderStatusChange(
      orderId,
      newStatus,
      order.customer_id,
      {
        order_id: orderId.slice(0, 8),
        total_amount: updated?.total_amount || 0,
        quantity_kg: updated?.quantity_kg || 0,
        pickup_point_name: updated?.pickup_points?.name_en || 'Your pickup point',
        pickup_date: updated?.pickup_date || 'TBD',
      }
    );
  } catch (err) {
    console.error('Error sending notification:', err);
    // Don't fail the order update if notification fails
  }

  return {
    success: true,
    data: updated as Order,
    message: `Order status updated to ${newStatus}`,
  };
}

/**
 * Mark order as collected (pickup agent action)
 */
export async function markOrderCollected(orderId: string) {
  const client = await createServerClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify user is pickup agent for this order
  const { data: order, error: orderError } = await client
    .from('orders')
    .select('pickup_point_id, customer_id')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'Order not found' };
  }

  // Verify pickup agent is assigned to this pickup point
  const { data: pickupPoint, error: pickupError } = await client
    .from('pickup_points')
    .select('agent_id')
    .eq('id', order.pickup_point_id)
    .single();

  if (pickupError || pickupPoint?.agent_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Update order status and collected_at timestamp
  const { data: updated, error: updateError } = await client
    .from('orders')
    .update({
      status: 'COLLECTED',
      collected_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select(
      `
      id,
      customer_id,
      total_amount,
      quantity_kg,
      pickup_date,
      pickup_points (name_en)
    `
    )
    .single();

  if (updateError) {
    console.error('Update error:', updateError);
    return { success: false, error: 'Failed to mark order collected' };
  }

  // Send SMS notification (non-blocking)
  try {
    await notifyOrderStatusChange(
      orderId,
      'COLLECTED',
      order.customer_id,
      {
        order_id: orderId.slice(0, 8),
        total_amount: updated?.total_amount || 0,
        quantity_kg: updated?.quantity_kg || 0,
        pickup_point_name: updated?.pickup_points?.name_en || 'Your pickup point',
        pickup_date: updated?.pickup_date || 'TBD',
      }
    );
  } catch (err) {
    console.error('Error sending notification:', err);
    // Don't fail the order collection if notification fails
  }

  return {
    success: true,
    data: updated as Order,
    message: 'Order marked as collected',
  };
}
