import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getUserSchedule, getScheduleRounds } from '@/lib/db/queries/schedule';
import { getAllUsers } from '@/lib/db/queries/users';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import RoundSelector from '@/components/lineups/RoundSelector';

export default async function SchedulePage({ searchParams }) {
  // Await searchParams for Next.js 15+ compatibility
  const params = await searchParams;
  const users = await getAllUsers();
  const rounds = await getScheduleRounds();

  // Default to first user if none selected
  const userId = params?.userId || (users.length > 0 ? users[0].id : null);
  const roundId = params?.roundId ? parseInt(params.roundId) : null;

  const schedule = userId
    ? await getUserSchedule(userId, roundId)
    : { found: false, message: 'No user selected' };

  // Helper to group matches by date
  const groupedMatches = schedule.found
    ? schedule.matches.reduce((acc, match) => {
        const date = new Date(match.date);
        const dateKey = date.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          timeZone: 'Europe/Madrid',
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(match);
        return acc;
      }, {})
    : {};

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
      {/* Search Controls Container */}
      <div className="flex flex-col gap-6 border-b border-white/10 pb-6">
        {/* Header Title */}
        <div>
          <h1 className="text-5xl md:text-6xl font-display mb-4 flex items-center gap-4">
            <span className="w-1.5 h-12 bg-gradient-to-b from-primary to-orange-400 rounded-full"></span>
            <span className="text-gradient">Alineaciones</span>
          </h1>
          <p className="text-muted-foreground text-lg w-full border-b border-border/50 pb-6">
            {schedule.found ? schedule.round.round_name : 'Selecciona una jornada'}
          </p>
        </div>

        {/* Controls: User & Round Selectors */}
        <div className="flex flex-col gap-4">
          {/* User Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Manager
            </span>
            <div className="flex overflow-x-auto pb-2 gap-1 scrollbar-hide mask-fade-right">
              {users.map((u) => (
                <Link
                  key={u.id}
                  href={`/schedule?userId=${u.id}${roundId ? `&roundId=${roundId}` : ''}`}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border
                    ${
                      String(u.id) === String(userId)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                    }
                  `}
                >
                  {u.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Round Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Jornada
            </span>
            <RoundSelector
              rounds={rounds}
              currentRoundId={schedule.found ? schedule.round.round_id : null}
              userId={userId}
            />
          </div>
        </div>
      </div>

      {schedule.found ? (
        <div className="space-y-8">
          {/* Loop through Groups (Days) */}
          {Object.entries(groupedMatches).map(([dateKey, matches]) => (
            <div key={dateKey} className="space-y-3">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pl-1">
                {dateKey}
              </h3>

              <div className="flex flex-col gap-1.5">
                {matches.map((match) => {
                  const hasPlayers = match.user_players.length > 0;
                  const date = new Date(match.date);
                  const timeStr = date.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Madrid',
                  });

                  return (
                    <div
                      key={match.match_id}
                      className={`
                        relative flex flex-col md:flex-row md:items-center gap-4 p-3 md:px-4 md:py-3 rounded-lg border transition-all
                        ${
                          hasPlayers
                            ? 'bg-slate-800/80 border-primary/30 shadow-sm'
                            : 'bg-slate-900/30 border-white/5 opacity-60 hover:opacity-100'
                        }
                      `}
                    >
                      {/* Left: Time & Match Info */}
                      <div className="flex items-center gap-4 md:w-1/3 min-w-0">
                        <div
                          className={`
                            text-xs font-mono font-medium px-2 py-1 rounded
                            ${hasPlayers ? 'bg-black/30 text-white' : 'bg-transparent text-slate-500'}
                         `}
                        >
                          {timeStr}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span
                              className={`font-bold truncate ${match.user_players.some((p) => p.team_id === match.home_id) ? 'text-white' : 'text-slate-400'}`}
                            >
                              {match.home_team}
                            </span>
                            <span className="text-slate-600 text-xs">vs</span>
                            <span
                              className={`font-bold truncate ${match.user_players.some((p) => p.team_id === match.away_id) ? 'text-white' : 'text-slate-400'}`}
                            >
                              {match.away_team}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Player Chips (Wrapped List) */}
                      <div className="flex-1 flex flex-wrap items-center justify-start gap-2">
                        {hasPlayers ? (
                          match.user_players.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center gap-2 pr-3 pl-1 py-1 rounded-full bg-black/40 border border-white/5"
                            >
                              {/* Avatar */}
                              {player.img ? (
                                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-800">
                                  <Image
                                    src={player.img}
                                    alt={player.name}
                                    fill
                                    className="object-cover"
                                    sizes="24px"
                                  />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400">
                                  {player.name.charAt(0)}
                                </div>
                              )}

                              {/* Name & Pos */}
                              <div className="flex flex-col leading-none">
                                <span className="text-xs font-medium text-slate-200">
                                  {player.name}
                                </span>
                                <span className="text-[9px] text-slate-500 uppercase">
                                  {player.position}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          // Spacer for empty matches to keep alignment
                          <div className="hidden md:block h-8" />
                        )}
                      </div>

                      {/* Mobile Visual Cue */}
                      {hasPlayers && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
          <AlertCircle size={32} className="mb-3 opacity-50" />
          <p className="text-sm font-medium">{schedule.message}</p>
        </div>
      )}
    </div>
  );
}
