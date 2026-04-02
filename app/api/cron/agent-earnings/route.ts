import { NextRequest, NextResponse } from 'next/server';
import { agentEarningsHandler } from '@/lib/cron/handlers';

export async function POST(request: NextRequest) {
  return agentEarningsHandler(request);
}

export const runtime = 'nodejs';
