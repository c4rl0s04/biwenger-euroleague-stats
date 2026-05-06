import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserWithPassword } from '@/lib/db/queries/core/users';
import { prepareUserMutations } from '@/lib/db/mutations/users';
import { pgClient } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Fetch user to get current hashed password
    const user = await getUserWithPassword(session.user.id);

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return NextResponse.json({ message: 'La contraseña actual es incorrecta' }, { status: 400 });
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password in database
    const mutations = prepareUserMutations(pgClient);
    await mutations.updateUserPassword(hashedPassword, session.user.id);

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
