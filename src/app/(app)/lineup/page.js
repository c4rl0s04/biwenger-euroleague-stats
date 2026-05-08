import { PageHeader } from '@/components/ui';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LineupClient from '@/components/lineup/LineupClient';

export const metadata = {
  title: 'Configurar Alineación - BiwengerStats',
  description: 'Configura tu alineación predeterminada para las próximas jornadas.',
};

export default async function LineupPage({ searchParams }) {
  const params = await searchParams;
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const sessionUserId = session.user.id;
  const targetUserId = params?.userId;

  // Security check: Only allow users to see/edit their own lineup
  if (targetUserId && String(targetUserId) !== String(sessionUserId)) {
    // Optional: Redirect to their own lineup if they try to snoope
    redirect('/lineup');
  }

  return <LineupClient userId={sessionUserId} />;
}
