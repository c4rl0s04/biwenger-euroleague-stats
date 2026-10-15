'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/foundation';
import { buildAutoLineup } from '@/features/lineup/public';
import AutoAlignButton from '@/components/schedule/AutoAlignButton';
import type { ScheduleMatch } from '../models/schedule';

/** Presentation adapter; automatic selection rules belong to the Lineup public contract. */
export default function ScheduleLineupAction({
  matches,
  userName,
  discrete = false,
  mobile = false,
}: {
  matches: ScheduleMatch[];
  userName?: string | null;
  discrete?: boolean;
  mobile?: boolean;
  userId?: string;
}) {
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const players = Array.from(
    new Map(
      matches.flatMap((match) => match.user_players).map((player) => [player.id, player])
    ).values()
  );
  let selectionError = '';
  if (excludedIds.length > 0) {
    try {
      buildAutoLineup(matches, excludedIds);
    } catch (error) {
      selectionError = error instanceof Error ? error.message : 'Revisa los jugadores disponibles.';
    }
  }
  return (
    <div className="schedule-lineup-controls">
      <AutoAlignButton
        matches={matches}
        userName={userName}
        discrete={discrete}
        mobile={mobile}
        excludedPlayerIds={excludedIds}
        onLoadingChange={setLoading}
        disabled={Boolean(selectionError)}
      />
      {players.length > 0 && (
        <details className="schedule-lineup-exclusions">
          <summary>Excluir jugadores ({excludedIds.length})</summary>
          <p>Solo para esta jornada. Se excluyen del quinteto, banquillo y capitanía.</p>
          <fieldset disabled={loading}>
            <legend className="sr-only">Jugadores excluidos de la autoalineación</legend>
            <div className="schedule-lineup-options">
              {players.map((player) => (
                <label key={player.id}>
                  <input
                    type="checkbox"
                    checked={excludedIds.includes(player.id)}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setExcludedIds((current) =>
                        checked ? [...current, player.id] : current.filter((id) => id !== player.id)
                      );
                    }}
                  />
                  {player.img && (
                    <Image
                      src={player.img}
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                    />
                  )}
                  <span>
                    <strong>{player.name || 'Jugador'}</strong>
                    <small>{[player.position, player.team_code].filter(Boolean).join(' · ')}</small>
                  </span>
                </label>
              ))}
            </div>
            <Button
              variant="ghost"
              disabled={loading || excludedIds.length === 0}
              onClick={() => setExcludedIds([])}
            >
              Incluir todos
            </Button>
          </fieldset>
        </details>
      )}
      {selectionError && (
        <p className="schedule-lineup-eligible" role="alert">
          {selectionError} Incluye más jugadores para continuar.
        </p>
      )}
      <p className="schedule-lineup-eligible" role="status">
        Disponibles: {players.length - excludedIds.length} de {players.length}
      </p>
    </div>
  );
}
