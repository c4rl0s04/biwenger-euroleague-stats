import { auth } from '@/auth';
import { getUserWithPassword } from '@/lib/db/queries/core/users';
import { prepareUserMutations } from '@/lib/db/mutations/users';
import { pgClient } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { privateJsonResponse } from '@/lib/utils/response';

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return privateJsonResponse({ message: 'No autorizado' }, 401);
    }
    const userId = session.user.id;

    const { currentPassword, newPassword } = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return privateJsonResponse({ message: 'Faltan campos obligatorios' }, 400);
    }

    const user = await getUserWithPassword(userId);

    if (!user) {
      return privateJsonResponse({ message: 'Usuario no encontrado' }, 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password as string);

    if (!isMatch) {
      return privateJsonResponse({ message: 'La contraseña actual es incorrecta' }, 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const mutations = prepareUserMutations(pgClient);
    await mutations.updateUserPassword(hashedPassword, userId);

    return privateJsonResponse({ message: 'Contraseña actualizada correctamente' });
  } catch {
    console.error('Password change request failed');
    return privateJsonResponse({ message: 'Error interno del servidor' }, 500);
  }
}
