import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import PlayerChip from './PlayerChip';

export default function MatchCard({ match }) {
  const hasPlayers = match.user_players.length > 0;

  // Format time safely
  const date = new Date(match.date);
  const timeStr = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  });

  return (
    <div
      className={clsx(
        'group relative flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-all duration-200',
        // Conditional Styling based on whether the user has players in this match
        hasPlayers
          ? 'bg-zinc-900/40 border-indigo-500/30 shadow-lg shadow-indigo-500/5 hover:border-indigo-500/50'
          : 'bg-zinc-900/10 border-white/5 hover:border-white/10 hover:bg-zinc-900/20 opacity-70 hover:opacity-100'
      )}
    >
      {/* Active Indicator Strip */}
      {hasPlayers && (
        <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full" />
      )}

      {/* Time & Match Info */}
      <div className="flex items-center gap-5 md:w-1/3 min-w-0">
        <div
          className={clsx(
            'px-3 py-1.5 rounded text-lg font-mono font-bold tracking-wide',
            hasPlayers ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'
          )}
        >
          {timeStr}
        </div>

        <div className="flex flex-col min-w-0 gap-0.5">
          <TeamName
            id={match.home_id}
            name={match.home_team}
            color={match.home_team_color}
            isActive={match.user_players.some((p) => p.team_id === match.home_id)}
          />
          <TeamName
            id={match.away_id}
            name={match.away_team}
            color={match.away_team_color}
            isActive={match.user_players.some((p) => p.team_id === match.away_id)}
          />
        </div>
      </div>

      {/* Players List */}
      <div className="flex-1 flex flex-wrap items-center gap-2">
        {hasPlayers ? (
          match.user_players.map((player) => <PlayerChip key={player.id} player={player} />)
        ) : (
          <span className="hidden md:block text-xs text-zinc-600 italic px-2">
            No active players
          </span>
        )}
      </div>
    </div>
  );
}

// Sub-component for Team Names
const TeamName = ({ id, name, color, isActive }) => {
  return (
    <Link
      href={`/team/${id}`}
      style={{ '--team-hover-color': color || '#fff' }}
      className={clsx(
        'text-sm truncate transition-colors',
        // Base styles
        isActive
          ? 'font-semibold text-white hover:text-[var(--team-hover-color)]'
          : 'font-medium text-zinc-500 hover:text-[var(--team-hover-color)]'
      )}
    >
      {name}
    </Link>
  );
};
