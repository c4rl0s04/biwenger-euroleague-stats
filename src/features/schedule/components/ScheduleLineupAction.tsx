'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';
import { Avatar, Button } from '@/components/ui/foundation';
import styles from './schedule-desktop.module.css';
import { buildAutoLineup } from '@/features/lineup/public';
import AutoAlignButton from '@/components/schedule/AutoAlignButton';
import type { ScheduleMatch } from '../models/schedule';

/** Presentation adapter; automatic selection rules belong to the Lineup public contract. */
export default function ScheduleLineupAction({
  matches,
  userName,
  discrete = false,
  mobile = false,
  desktop = false,
}: {
  matches: ScheduleMatch[];
  userName?: string | null;
  discrete?: boolean;
  mobile?: boolean;
  desktop?: boolean;
  userId?: string;
}) {
  const [excludedIds, setExcludedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const exclusionsId = useId();
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
  if (desktop) {
    return (
      <section
        className={`schedule-lineup-controls ${styles.lineupPanel}`}
        data-desktop-lineup
        aria-label="Preparar alineación"
      >
        <div className={styles.lineupHeader}>
          <div>
            <h2>Preparar alineación</h2>
            <p role="status">
              Disponibles: {players.length - excludedIds.length} de {players.length} · Por horario
              de partido
            </p>
          </div>
          <div className={styles.lineupActions}>
            {players.length > 0 && (
              <Button
                variant="secondary"
                aria-expanded={expanded}
                aria-controls={exclusionsId}
                onClick={() => setExpanded((current) => !current)}
              >
                Excluir jugadores ({excludedIds.length})
              </Button>
            )}
            <AutoAlignButton
              matches={matches}
              userName={userName}
              desktop
              excludedPlayerIds={excludedIds}
              onLoadingChange={setLoading}
              disabled={Boolean(selectionError)}
            />
          </div>
        </div>
        {players.length > 0 && (
          <div id={exclusionsId} hidden={!expanded} className={styles.exclusionPanel}>
            <p>
              Marca los jugadores que no quieres incluir en el quinteto, banquillo ni capitanía.
              Solo se aplica a esta jornada.
            </p>
            <fieldset disabled={loading}>
              <legend className="sr-only">Jugadores excluidos de la autoalineación</legend>
              <div className={styles.exclusionGrid}>
                {players.map((player) => (
                  <label
                    key={player.id}
                    className={styles.exclusionOption}
                    data-excluded={excludedIds.includes(player.id)}
                  >
                    <input
                      type="checkbox"
                      checked={excludedIds.includes(player.id)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setExcludedIds((current) =>
                          checked
                            ? [...current, player.id]
                            : current.filter((id) => id !== player.id)
                        );
                      }}
                    />
                    <Avatar
                      src={player.img}
                      alt=""
                      fallback={player.name?.charAt(0) || '?'}
                      size="sm"
                    />
                    <span className={styles.playerIdentity}>
                      <strong>{player.name || 'Jugador'}</strong>
                      <small>
                        {[player.position, player.team_code].filter(Boolean).join(' · ') ||
                          'Tu jugador'}
                      </small>
                    </span>
                    <span className={styles.excludedState}>
                      {excludedIds.includes(player.id) ? 'Excluido' : ''}
                    </span>
                  </label>
                ))}
              </div>
              <div className={styles.exclusionFooter}>
                <span>
                  {excludedIds.length} {excludedIds.length === 1 ? 'excluido' : 'excluidos'}
                </span>
                <Button
                  variant="ghost"
                  disabled={loading || excludedIds.length === 0}
                  onClick={() => setExcludedIds([])}
                >
                  Incluir todos
                </Button>
              </div>
            </fieldset>
          </div>
        )}
        {selectionError && (
          <p className={styles.selectionError} role="alert">
            <AlertCircle size={18} className={styles.errorIcon} aria-hidden="true" />
            <span>{selectionError} Incluye más jugadores para continuar.</span>
          </p>
        )}
      </section>
    );
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
