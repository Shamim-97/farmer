import { NextRequest, NextResponse } from 'next/server';
import { thresholdResetHandler } from '@/lib/cron/handlers';

export async function POST(request: NextRequest) {
  return thresholdResetHandler(request);
}

export const runtime = 'nodejs';
