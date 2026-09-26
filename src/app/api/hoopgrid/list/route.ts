import { NextResponse } from 'next/server';
import { hoopgridReadService } from '@/features/hoopgrid/server';

export async function GET() {
  try {
    const data = await hoopgridReadService.listChallenges();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Hoopgrid List Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
