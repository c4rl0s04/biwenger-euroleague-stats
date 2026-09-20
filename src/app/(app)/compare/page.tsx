import { DesktopCompareScreen, MobileCompareScreen } from '@/features/compare/public';
import { auth } from '@/auth';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { getCompareDataLite } from '@/features/compare/server';

export const metadata = {
  title: 'Comparativa | Biwenger Stats',
  description:
    'Compara estadísticas cara a cara entre usuarios: victorias, eficiencia y predicciones.',
};

export default async function ComparePage() {
  if (await isPhonePresentation()) {
    const [data, session] = await Promise.all([getCompareDataLite(), auth()]);
    return <MobileCompareScreen users={data.users} currentUserId={session?.user?.id} />;
  }
  return <DesktopCompareScreen />;
}
