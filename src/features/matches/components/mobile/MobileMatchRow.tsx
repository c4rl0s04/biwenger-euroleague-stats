import Link from 'next/link';
import EventTime from '@/components/ui/EventTime';

import type { MatchListItemViewModel } from '../../models/match';

export default function MobileMatchRow({ match }: { match: MatchListItemViewModel }) {
  const { home, away } = match;
  const finished = match.status === 'finished';
  const score = finished ? (
    `${home.score ?? 0} – ${away.score ?? 0}`
  ) : (
    <EventTime value={match.date} fallback="VS" />
  );

  return (
    <div className="mobile-match-row">
      <Link href={`/team/${home.id}`} className="mobile-match-team mobile-match-home">
        {home.name}
      </Link>
      <div className="mobile-match-score">
        <strong>{score}</strong>
        <span>{finished ? 'Final' : <EventTime value={match.date} format="date" />}</span>
      </div>
      <Link href={`/team/${away.id}`} className="mobile-match-team">
        {away.name}
      </Link>
    </div>
  );
}
