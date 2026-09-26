import { auth } from '@/auth';
import {
  accountCommandService,
  AccountNotFoundError,
  AccountValidationError,
} from '@/features/accounts/server';
import { privateJsonResponse } from '@/lib/utils/response';

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return privateJsonResponse({ message: 'No autorizado' }, 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return privateJsonResponse({ message: 'Faltan campos obligatorios' }, 400);
    }

    const result = await accountCommandService.changePassword(session.user.id, body);
    return privateJsonResponse(result);
  } catch (error) {
    if (error instanceof AccountValidationError) {
      return privateJsonResponse({ message: error.message }, 400);
    }
    if (error instanceof AccountNotFoundError) {
      return privateJsonResponse({ message: error.message }, 404);
    }
    console.error('Password change request failed');
    return privateJsonResponse({ message: 'Error interno del servidor' }, 500);
  }
}
