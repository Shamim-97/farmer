import { NextRequest, NextResponse } from 'next/server';
import { notificationCleanupHandler } from '@/lib/cron/handlers';

export async function POST(request: NextRequest) {
  return notificationCleanupHandler(request);
}

export const runtime = 'nodejs';
