/**
 * Cron API Routes
 * 
 * Deploy as Vercel Edge Functions or call via external cron service
 * Each route requires CRON_SECRET to prevent unauthorized execution
 * 
 * Usage:
 * - POST /api/cron/abandoned-orders (every 1 hour)
 * - POST /api/cron/threshold-reset (daily at 00:00 UTC)
 * - POST /api/cron/agent-earnings (daily at 02:00 UTC)
 * - POST /api/cron/refund-expiry (daily at 03:00 UTC)
 * - POST /api/cron/notification-cleanup (every 6 hours)
 * - POST /api/cron/seller-inactivity (daily at 04:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  abandonedOrderCleanup,
  dailyThresholdReset,
  dailyAgentEarningsReport,
  refundExpiryCleanup,
  notificationCleanup,
  sellerInactivityCheck,
} from '@/lib/cron/jobs';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  return token === CRON_SECRET;
}

/**
 * POST /api/cron/abandoned-orders
 * Mark orders as abandoned if PENDING/CONFIRMED for > 24 hours
 */
export async function abandonedOrdersHandler(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await abandonedOrderCleanup();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/threshold-reset
 * Reset village thresholds to 0 kg daily
 */
export async function thresholdResetHandler(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await dailyThresholdReset();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/agent-earnings
 * Send daily earnings reports to agents
 */
export async function agentEarningsHandler(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await dailyAgentEarningsReport();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/refund-expiry
 * Mark old refunds as expired
 */
export async function refundExpiryHandler(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await refundExpiryCleanup();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/notification-cleanup
 * Delete notifications older than 90 days
 */
export async function notificationCleanupHandler(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await notificationCleanup();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/seller-inactivity
 * Deactivate sellers with no orders in 30 days
 */
export async function sellerInactivityHandler(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sellerInactivityCheck();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
