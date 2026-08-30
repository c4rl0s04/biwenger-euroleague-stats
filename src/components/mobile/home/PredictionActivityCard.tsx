import Link from 'next/link';
import { Target } from 'lucide-react';

import type { PredictionRoundActivity } from '@/lib/home/contracts';
import ActivityTime from './ActivityTime';
import HomeManagerAvatar from './HomeManagerAvatar';

function participantSummary(
  participation: PredictionRoundActivity['participants'][number]['participation'],
  hits: number,
  userMatches: number,
  totalMatches: number
) {
  if (participation === 'absent') return 'No participó';
  if (participation === 'partial') return `Parcial ${userMatches}/${totalMatches}`;
  return `${hits}/${totalMatches} aciertos`;
}

export default function PredictionActivityCard({ event }: { event: PredictionRoundActivity }) {
  const leaders = event.participants.filter(
    (participant) => participant.participation === 'complete' && participant.position === 1
  );

  return (
    <article className="mobile-home-event mobile-home-event-prediction">
      <span className="mobile-home-event-icon">
        <Target size={17} aria-hidden="true" />
      </span>
      <div className="mobile-home-event-card mobile-home-prediction-card">
        <div className="mobile-home-event-meta">
          <span>Porra · {event.roundName}</span>
          <ActivityTime value={event.occurredAt} />
        </div>

        <div className="mobile-home-prediction-heading">
          <div>
            <strong>{leaders.length > 1 ? 'Victoria compartida' : 'Ganador de la porra'}</strong>
            <small>
              {leaders.length > 0
                ? leaders.map((leader) => leader.name).join(' · ')
                : 'Sin participantes completos'}
            </small>
          </div>
          <span>{event.totalMatches} partidos</span>
        </div>

        <ol className="mobile-home-prediction-ranking" aria-label={`Porra de ${event.roundName}`}>
          {event.participants.map((participant) => (
            <li key={participant.userId}>
              <span
                className={participant.position ? `is-rank-${participant.position}` : 'is-unranked'}
                aria-label={
                  participant.position ? `Posición ${participant.position}` : 'Sin posición'
                }
              >
                {participant.position ?? '—'}
              </span>
              <HomeManagerAvatar
                name={participant.name}
                icon={participant.icon}
                colorIndex={participant.colorIndex}
              />
              <strong>{participant.name}</strong>
              <div>
                {participant.participation === 'complete' && <b>{participant.hits}</b>}
                <small>
                  {participantSummary(
                    participant.participation,
                    participant.hits,
                    participant.userMatches,
                    event.totalMatches
                  )}
                </small>
              </div>
            </li>
          ))}
        </ol>

        <details className="mobile-home-prediction-details">
          <summary>Ver pronósticos</summary>
          <div>
            {event.participants.map((participant) => (
              <section key={participant.userId} aria-label={`Pronósticos de ${participant.name}`}>
                <header>
                  <strong>{participant.name}</strong>
                  <span>
                    {participantSummary(
                      participant.participation,
                      participant.hits,
                      participant.userMatches,
                      event.totalMatches
                    )}
                  </span>
                </header>
                <div className="mobile-home-prediction-picks">
                  {event.actualResults.map((actual, index) => {
                    const prediction = participant.predictions[index] ?? null;
                    const state =
                      prediction === null ? 'absence' : prediction === actual ? 'hit' : 'miss';
                    const label =
                      state === 'hit' ? 'Acierto' : state === 'miss' ? 'Fallo' : 'Sin pronóstico';
                    return (
                      <span key={`${participant.userId}-${index}`} className={`is-${state}`}>
                        <small>P{index + 1}</small>
                        <b>{prediction ?? '—'}</b>
                        <em>{label}</em>
                        <span>Real {actual}</span>
                      </span>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </details>

        <Link href="/predictions/history" prefetch className="mobile-home-event-link">
          Ver historial de porras <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
