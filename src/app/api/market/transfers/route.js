import { NextResponse } from 'next/server';
import { fetchLiveMarketTransfers } from '@/lib/services/marketService';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page')) || 1;
  const buyer = searchParams.get('buyer');
  const seller = searchParams.get('seller');

  try {
    const data = await fetchLiveMarketTransfers({ page, limit: 10, buyer, seller });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching market transfers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}
