import { NextRequest, NextResponse } from 'next/server';
import { abandonedOrdersHandler } from '@/lib/cron/handlers';

export async function POST(request: NextRequest) {
  return abandonedOrdersHandler(request);
}

export const runtime = 'nodejs';
