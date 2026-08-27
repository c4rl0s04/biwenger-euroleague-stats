import Link from 'next/link';

type Match = Record<string, any>;

export default function MobileMatchRow({ match }: { match: Match }) {
  const home = match.home ?? { id: match.home_id, name: match.home_team };
  const away = match.away ?? { id: match.away_id, name: match.away_team };
  const finished = match.status === 'finished';
  const date = match.date ? new Date(match.date) : null;
  const score = finished
    ? `${home?.score ?? match.home_score ?? 0} – ${away?.score ?? match.away_score ?? 0}`
    : date?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) ?? 'VS';

  return (
    <div className="mobile-match-row">
      <Link href={`/team/${home?.id}`} className="mobile-match-team mobile-match-home">
        {home?.name ?? 'Local'}
      </Link>
      <div className="mobile-match-score">
        <strong>{score}</strong>
        <span>{finished ? 'Final' : date?.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
      </div>
      <Link href={`/team/${away?.id}`} className="mobile-match-team">
        {away?.name ?? 'Visitante'}
      </Link>
    </div>
  );
}
