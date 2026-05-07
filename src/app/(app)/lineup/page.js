import { PageHeader } from '@/components/ui';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LineupClient from '@/components/lineup/LineupClient';

export const metadata = {
  title: 'Configurar Alineación - BiwengerStats',
  description: 'Configura tu alineación predeterminada para las próximas jornadas.',
};

export default async function LineupPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Alineación"
        description="Gestiona tu quinteto inicial, reservas y capitán para la próxima jornada."
      />

      <div className="container mx-auto px-4 md:px-8">
        <LineupClient userId={userId} />
      </div>
    </div>
  );
}
