import { auth } from '@/auth';
import {
  accountCommandService,
  AccountNotFoundError,
  AccountProviderAuthError,
  AccountStorageError,
  AccountValidationError,
} from '@/features/accounts/server';
import { privateJsonResponse } from '@/lib/utils/response';

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return privateJsonResponse({ message: 'No autorizado. Por favor, inicia sesión.' }, 401);
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return privateJsonResponse({ message: 'La contraseña de Biwenger es obligatoria.' }, 400);
    }

    const result = await accountCommandService.linkBiwenger(session.user.id, body);
    return privateJsonResponse(result);
  } catch (error) {
    if (error instanceof AccountValidationError) {
      return privateJsonResponse({ message: error.message }, 400);
    }
    if (error instanceof AccountNotFoundError) {
      return privateJsonResponse({ message: error.message }, 404);
    }
    if (error instanceof AccountProviderAuthError) {
      return privateJsonResponse({ message: error.message }, error.statusCode);
    }
    if (error instanceof AccountStorageError) {
      return privateJsonResponse(
        { message: 'Ocurrió un error inesperado al conectar con Biwenger.' },
        500
      );
    }
    console.error('Unexpected Biwenger link request failure');
    return privateJsonResponse(
      { message: 'Ocurrió un error inesperado al conectar con Biwenger.' },
      500
    );
  }
}
