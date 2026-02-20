import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveMarketTransfers } from '@/lib/services/marketService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const buyer = searchParams.get('buyer');
  const seller = searchParams.get('seller');
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const data = await fetchLiveMarketTransfers({ limit, offset } as Parameters<typeof fetchLiveMarketTransfers>[0]);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching market transfers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}
