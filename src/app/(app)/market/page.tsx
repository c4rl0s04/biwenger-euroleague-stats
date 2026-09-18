import { DesktopMarketScreen, MobileMarketScreen } from '@/features/market/public';
import { getMobileMarketOverview } from '@/features/market/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export default async function MarketPage() {
  if (await isPhonePresentation()) {
    return <MobileMarketScreen {...await getMobileMarketOverview()} />;
  }
  return <DesktopMarketScreen />;
}
