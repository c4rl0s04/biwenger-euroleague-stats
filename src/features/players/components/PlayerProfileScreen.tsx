import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { ThemeBackground } from '@/components/ui';

import type { PlayerProfileViewModel } from '../models/player-profile';
import PlayerProfileClient from './desktop/profile/PlayerProfileClient';
import MobilePlayerProfileScreen from './mobile/MobilePlayerProfileScreen';

export function PlayerProfileNotFoundScreen() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-white mb-4">Jugador no encontrado</h1>
      <Link
        href="/dashboard"
        className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al dashboard
      </Link>
    </div>
  );
}

export function PlayerProfileScreen({
  player,
  phone,
}: {
  player: PlayerProfileViewModel;
  phone: boolean;
}) {
  if (phone) return <MobilePlayerProfileScreen player={player} />;

  return (
    <>
      <div className="fixed inset-0 z-0">
        <ThemeBackground />
      </div>
      <div className="relative z-10 p-6">
        <PlayerProfileClient player={player} />
      </div>
    </>
  );
}
