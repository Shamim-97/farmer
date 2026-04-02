import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const orderId = formData.get('order_id') as string;
    const gpsLat = parseFloat(formData.get('gps_lat') as string);
    const gpsLng = parseFloat(formData.get('gps_lng') as string);
    const photo = formData.get('photo') as File;

    if (!orderId || !photo || isNaN(gpsLat) || isNaN(gpsLng)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await createServerClient();

    // Verify agent is assigned to order's pickup point
    const { data: order } = await client
      .from('orders')
      .select('pickup_point_id, status')
      .eq('id', orderId)
      .single();

    if (!order || order.status !== 'READY') {
      return NextResponse.json(
        { success: false, error: 'Order not found or not ready' },
        { status: 404 }
      );
    }

    const { data: point } = await client
      .from('pickup_points')
      .select('agent_id')
      .eq('id', order.pickup_point_id)
      .single();

    if (point?.agent_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Upload photo to storage
    const timestamp = Date.now();
    const fileName = `${orderId}-${timestamp}.jpg`;
    const filePath = `collection-proofs/${user.id}/${fileName}`;

    const arrayBuffer = await photo.arrayBuffer();
    const { error: uploadError } = await client.storage
      .from('collection_proofs')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload photo' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrl } = client.storage
      .from('collection_proofs')
      .getPublicUrl(filePath);

    // Update order + create proof record
    const { error: updateError } = await client
      .from('orders')
      .update({
        status: 'COLLECTED',
        collected_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // Store collection proof metadata
    const { error: proofError } = await client
      .from('collection_proofs')
      .insert({
        order_id: orderId,
        agent_id: user.id,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        photo_url: publicUrl.publicUrl,
        timestamp: new Date().toISOString(),
      });

    if (proofError) {
      console.error('Proof record error:', proofError);
      // Still return success as order was collected
    }

    return NextResponse.json({
      success: true,
      message: 'Order collected successfully',
      photo_url: publicUrl.publicUrl,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
