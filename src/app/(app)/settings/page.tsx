import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import DesktopSettingsScreen from '@/components/settings/DesktopSettingsScreen';
import MobileSettingsScreen from '@/components/mobile/screens/MobileSettingsScreen';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export default async function SettingsPage() {
  const [session, phone] = await Promise.all([auth(), isPhonePresentation()]);
  if (!session?.user) redirect('/login');

  return phone ? (
    <MobileSettingsScreen
      biwengerLinked={Boolean(
        (session.user as typeof session.user & { biwengerLinked?: boolean }).biwengerLinked
      )}
    />
  ) : (
    <DesktopSettingsScreen
      biwengerLinked={Boolean(
        (session.user as typeof session.user & { biwengerLinked?: boolean }).biwengerLinked
      )}
    />
  );
}
