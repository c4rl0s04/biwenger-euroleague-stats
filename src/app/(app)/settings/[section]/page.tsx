import MobileSettingsDetail from '@/components/mobile/screens/MobileSettingsDetail';
import { requireMobileRoute } from '@/lib/mobile/route-server';

type SettingsSection = 'account' | 'biwenger' | 'appearance' | 'install';
type PageProps = { params: Promise<{ section: string }> };

export default async function SettingsSectionPage({ params }: PageProps) {
  const { section } = await params;
  await requireMobileRoute(`/settings/${section}`);
  if (!['account', 'biwenger', 'appearance', 'install'].includes(section)) return null;
  return <MobileSettingsDetail section={section as SettingsSection} />;
}
