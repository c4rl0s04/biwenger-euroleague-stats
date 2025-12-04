import { NextResponse } from 'next/server';
import { 
  getRecentTransfers,
  getSignificantPriceChanges,
  getRecentRecords,
  getPersonalizedAlerts
} from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get recent transfers
    const recentTransfers = getRecentTransfers(5);
    
    // Get significant price changes (last 24h, min 500k change)
    const priceChanges = getSignificantPriceChanges(24, 500000);
    
    // Get recent records broken
    const recentRecords = getRecentRecords();
    
    // Get personalized alerts if userId is provided
    const personalizedAlerts = userId 
      ? getPersonalizedAlerts(userId, 5)
      : [];

    return NextResponse.json({
      success: true,
      data: {
        recentTransfers,
        priceChanges,
        recentRecords,
        personalizedAlerts
      }
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recent activity',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
