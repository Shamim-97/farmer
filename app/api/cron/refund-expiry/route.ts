import { NextRequest, NextResponse } from 'next/server';
import { refundExpiryHandler } from '@/lib/cron/handlers';

export async function POST(request: NextRequest) {
  return refundExpiryHandler(request);
}

export const runtime = 'nodejs';
