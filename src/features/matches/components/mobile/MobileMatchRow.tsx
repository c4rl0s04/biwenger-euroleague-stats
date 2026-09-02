import Link from 'next/link';

import type { MatchListItemViewModel } from '../../models/match';

export default function MobileMatchRow({ match }: { match: MatchListItemViewModel }) {
  const { home, away } = match;
  const finished = match.status === 'finished';
  const date = match.date ? new Date(match.date) : null;
  const score = finished
    ? `${home.score ?? 0} – ${away.score ?? 0}`
    : date?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) ?? 'VS';

  return (
    <div className="mobile-match-row">
      <Link href={`/team/${home.id}`} className="mobile-match-team mobile-match-home">
        {home.name}
      </Link>
      <div className="mobile-match-score">
        <strong>{score}</strong>
        <span>{finished ? 'Final' : date?.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
      </div>
      <Link href={`/team/${away.id}`} className="mobile-match-team">
        {away.name}
      </Link>
    </div>
  );
}
