import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { privateJsonResponse } from '@/lib/utils/response';
import { biwengerCredentials } from '@/lib/credentials/service';

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
    return privateJsonResponse({ message: 'No autorizado. Por favor, inicia sesión.' }, 401);
  }

  try {
    const { password, email: providedEmail } = (await req.json()) as {
      password?: string;
      email?: string;
    };

    if (!password) {
      return privateJsonResponse({ message: 'La contraseña de Biwenger es obligatoria.' }, 400);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { id: true, email: true },
    });

    if (!user) {
      return privateJsonResponse({ message: 'Usuario no encontrado.' }, 404);
    }

    const email = providedEmail || user.email;

    if (!email) {
      return privateJsonResponse(
        { message: 'Por favor, proporciona un email para realizar la vinculación.' },
        400
      );
    }

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
      const status =
        biwengerRes.status >= 400 && biwengerRes.status < 500 ? biwengerRes.status : 502;
      console.warn(`Biwenger link authentication failed with status ${biwengerRes.status}`);
      return privateJsonResponse({ message: 'Credenciales de Biwenger incorrectas.' }, status);
    }

    const token = responseData.token || responseData.data?.token;

    if (!token) {
      console.error('Biwenger link authentication returned no usable credential');
      return privateJsonResponse({ message: 'Error al obtener el acceso desde Biwenger.' }, 502);
    }

    await biwengerCredentials.storeCredential({ userId: user.id, credential: token, email });

    return privateJsonResponse({
      message: '¡Cuenta vinculada con éxito! Tus datos se sincronizarán de forma segura.',
      status: 'linked',
      biwengerLinked: true,
    });
  } catch {
    console.error('Unexpected Biwenger link request failure');
    return privateJsonResponse(
      { message: 'Ocurrió un error inesperado al conectar con Biwenger.' },
      500
    );
  }
}
