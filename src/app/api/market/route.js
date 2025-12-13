/**
 * Market API Route
 * 
 * Endpoint: GET /api/market
 * Returns: Market statistics and recent transfers
 */

import { NextResponse } from 'next/server';
import { getMarketKPIs, getAllTransfers, getMarketTrends } from '@/lib/db';

/**
 * GET /api/market
 * 
 * Query params:
 * - limit: number of transfers to return (default: 50)
 * 
 * Returns JSON with:
 * - kpis: Market statistics (total, avg, max, min)
 * - transfers: Recent transfers
 * - trends: Market trends over time
 */
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Get data from database
    const kpis = getMarketKPIs();
    const transfers = getAllTransfers(limit);
    const trends = getMarketTrends();
    
    // Return JSON response
    return NextResponse.json({
      success: true,
      data: {
        kpis,
        transfers,
        trends
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market data'
      },
      { status: 500 }
    );
  }
}
