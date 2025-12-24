import { NextResponse } from 'next/server';
import { 
  getInitialSquadActualPerformance, 
  getInitialSquadTheoreticalPotential 
} from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics
 * Returns initial squad performance analysis
 */
export async function GET() {
  try {
    const actualPerformance = getInitialSquadActualPerformance();
    const theoreticalPotential = getInitialSquadTheoreticalPotential();
    
    // Combine data for ROI calculation
    const combined = actualPerformance.map(actual => {
      const potential = theoreticalPotential.find(p => p.user_name === actual.user_name);
      const potentialPoints = potential?.potential_points || 0;
      const roi = potentialPoints > 0 
        ? ((actual.total_points / potentialPoints) * 100).toFixed(1)
        : 0;
      
      return {
        user_name: actual.user_name,
        actual_points: Math.round(actual.total_points),
        potential_points: potentialPoints,
        roi_percentage: parseFloat(roi)
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      data: combined.sort((a, b) => b.roi_percentage - a.roi_percentage)
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
