import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { isHomeActivityFilter } from '@/lib/home/contracts';
import { getHomeFeedPage } from '@/lib/services/app/homeService';

export const dynamic = 'force-dynamic';

const privateHeaders = {
  'Cache-Control': 'private, no-store',
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Sesión expirada' },
      { status: 401, headers: privateHeaders }
    );
  }

  const { searchParams } = request.nextUrl;
  if (searchParams.has('userId')) {
    return NextResponse.json(
      { error: 'Parámetro no permitido' },
      { status: 400, headers: privateHeaders }
    );
  }

  const requestedType = searchParams.get('type') ?? 'all';
  if (!isHomeActivityFilter(requestedType)) {
    return NextResponse.json(
      { error: 'Filtro de actividad no válido' },
      { status: 400, headers: privateHeaders }
    );
  }

  try {
    const page = await getHomeFeedPage({
      filter: requestedType,
      cursor: searchParams.get('cursor'),
    });
    return NextResponse.json(page, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof Error && error.message === 'Cursor de actividad no válido') {
      return NextResponse.json({ error: error.message }, { status: 400, headers: privateHeaders });
    }

    console.error('Home activity API error:', error);
    return NextResponse.json(
      { error: 'No se pudo cargar la actividad' },
      { status: 500, headers: privateHeaders }
    );
  }
}
