import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface BiwengerLoginResponse {
  token?: string;
  data?: { token?: string };
  message?: string;
  error?: string;
}

/**
 * POST /api/user/link-biwenger
 * Authenticates with Biwenger using the user's email and provided password.
 * Stores the retrieved token in the database.
 */
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: 'No autorizado. Por favor, inicia sesión.' },
      { status: 401 }
    );
  }

  try {
    const { password, email: providedEmail } = (await req.json()) as {
      password?: string;
      email?: string;
    };

    if (!password) {
      return NextResponse.json(
        { message: 'La contraseña de Biwenger es obligatoria.' },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    const email = providedEmail || user.email;

    if (!email) {
      return NextResponse.json(
        { message: 'Por favor, proporciona un email para realizar la vinculación.' },
        { status: 400 }
      );
    }

    console.log(`🔗 Intentando vincular Biwenger para: ${email}`);

    const biwengerRes = await fetch('https://biwenger.as.com/api/v2/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        'X-Client': 'pwa',
        'X-Version': '2',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const responseData = (await biwengerRes.json()) as BiwengerLoginResponse;

    if (!biwengerRes.ok) {
      const errorMsg =
        responseData.message || responseData.error || 'Credenciales de Biwenger incorrectas.';
      console.warn(`❌ Fallo en autenticación Biwenger (${biwengerRes.status}):`, errorMsg);
      return NextResponse.json({ message: errorMsg }, { status: biwengerRes.status });
    }

    const token = responseData.token || responseData.data?.token;

    if (!token) {
      console.error('⚠️ Autenticación exitosa pero no se recibió un token válido:', responseData);
      return NextResponse.json(
        { message: 'Error al obtener el token de acceso desde Biwenger.' },
        { status: 500 }
      );
    }

    await db.update(users).set({ biwengerToken: token, email }).where(eq(users.id, user.id));

    console.log(`✅ Cuenta de Biwenger vinculada con éxito para: ${email}`);

    return NextResponse.json({
      message: '¡Cuenta vinculada con éxito! Tus datos se sincronizarán usando este token.',
      status: 'linked',
      token,
      email,
    });
  } catch (error) {
    console.error('💥 Error crítico en /api/user/link-biwenger:', error);
    return NextResponse.json(
      { message: 'Ocurrió un error inesperado al conectar con Biwenger.' },
      { status: 500 }
    );
  }
}
