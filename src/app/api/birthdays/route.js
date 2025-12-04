import { NextResponse } from 'next/server';
import { getPlayersBirthday } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const birthdays = getPlayersBirthday();

    return NextResponse.json({
      success: true,
      data: birthdays
    });
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch birthdays',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
