import Link from 'next/link';
import type { ReactNode } from 'react';

export interface PlayerIdentityValue {
  id: string | number | null;
  name: string | null | undefined;
  subtitle?: ReactNode;
}

/** Metadata is outside the player link so owner/team links remain independent. */
export function PlayerIdentity({ player }: { player: PlayerIdentityValue }) {
  const name = player.name || 'Jugador';
  const nameClass =
    'block truncate rounded text-sm font-semibold text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary';
  return (
    <div className="min-w-0 flex-1">
      {player.id != null ? (
        <Link className={nameClass} href={`/player/${player.id}`} title={name}>
          {name}
        </Link>
      ) : (
        <span className={nameClass}>{name}</span>
      )}
      {player.subtitle != null && (
        <div className="mt-1 text-xs text-muted-foreground">{player.subtitle}</div>
      )}
    </div>
  );
}
