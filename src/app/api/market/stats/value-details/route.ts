import { NextRequest, NextResponse } from 'next/server';
import { getBestValueDetails } from '@/lib/services/marketService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transferId = searchParams.get('transferId');

    if (!transferId) {
      return NextResponse.json({ error: 'Transfer ID required' }, { status: 400 });
    }

    const details = await getBestValueDetails(Number(transferId));
    return NextResponse.json(details);
  } catch (error) {
    console.error('Error fetching best value details:', error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}
