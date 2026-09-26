import { NextResponse } from 'next/server';
import { hoopgridReadService } from '@/features/hoopgrid/server';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || undefined;

    const session = await auth();
    const userId = session?.user?.id;

    const data = await hoopgridReadService.getTodayChallenge(dateParam, userId);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Hoopgrid Today Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
