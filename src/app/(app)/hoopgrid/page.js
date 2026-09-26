import { DesktopHoopgridScreen, MobileHoopgridScreen } from '@/features/hoopgrid/public';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

/**
 * Hoopgrid Page
 *
 * A 3x3 trivia game based on Euroleague and Biwenger statistics.
 */

export const metadata = {
  title: 'Hoopgrid | Euroleague Biwenger Stats',
  description: 'Pon a prueba tus conocimientos de la Euroliga con el desafío diario de Hoopgrid.',
};

export default async function HoopgridPage() {
  if (await isPhonePresentation()) return <MobileHoopgridScreen />;
  return <DesktopHoopgridScreen />;
}
