import {
  getPlayerProfileData,
  PlayerProfileNotFoundScreen,
  PlayerProfileScreen,
} from '@/features/players/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }) {
  const { id } = await params;
  const [player, phone] = await Promise.all([getPlayerProfileData(id), isPhonePresentation()]);

  if (!player) return <PlayerProfileNotFoundScreen />;

  return <PlayerProfileScreen player={player} phone={phone} />;
}
