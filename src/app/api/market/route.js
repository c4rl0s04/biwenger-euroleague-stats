/**
 * Market API Route
 * 
 * Endpoint: GET /api/market
 * Returns: Market statistics and recent transfers
 */

import { NextResponse } from 'next/server';
import { getMarketKPIs, getAllTransfers, getMarketTrends } from '@/lib/db';
import { validateNumber } from '@/lib/utils/validation';

/**
 * GET /api/market
 * 
 * Query params:
 * - limit: number of transfers to return (default: 50, max: 500)
 * 
 * Returns JSON with:
 * - kpis: Market statistics (total, avg, max, min)
 * - transfers: Recent transfers
 * - trends: Market trends over time
 */
export async function GET(request) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const limitValidation = validateNumber(searchParams.get('limit'), { 
      defaultValue: 50, 
      min: 1, 
      max: 500 
    });
    
    if (!limitValidation.valid) {
      return NextResponse.json(
        { success: false, error: limitValidation.error },
        { status: 400 }
      );
    }
    
    // Get data from database
    const kpis = getMarketKPIs();
    const transfers = getAllTransfers(limitValidation.value);
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
