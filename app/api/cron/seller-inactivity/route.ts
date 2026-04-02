import { NextRequest, NextResponse } from 'next/server';
import { sellerInactivityHandler } from '@/lib/cron/handlers';

export async function POST(request: NextRequest) {
  return sellerInactivityHandler(request);
}

export const runtime = 'nodejs';
