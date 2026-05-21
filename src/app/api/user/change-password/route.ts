import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserWithPassword } from '@/lib/db/queries/core/users';
import { prepareUserMutations } from '@/lib/db/mutations/users';
import { pgClient } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const userId = session.user.id;

    const { currentPassword, newPassword } = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const user = await getUserWithPassword(userId);

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password as string);

    if (!isMatch) {
      return NextResponse.json({ message: 'La contraseña actual es incorrecta' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const mutations = prepareUserMutations(pgClient);
    await mutations.updateUserPassword(hashedPassword, userId);

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
