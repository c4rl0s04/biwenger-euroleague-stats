import { getUserSchedule, getScheduleRounds } from '@/lib/db/queries/schedule';
import { getAllUsers } from '@/lib/db/queries/users';
import { AlertCircle } from 'lucide-react';
import ScheduleControls from '@/components/schedule/ScheduleControls';
import MatchCard from '@/components/schedule/MatchCard';
import RoundSummary from '@/components/schedule/RoundSummary';
import { Section } from '@/components/layout';

import { cookies } from 'next/headers';

export default async function SchedulePage({ searchParams }) {
  // Await params for Next.js 15+
  const params = await searchParams;
  const cookieStore = await cookies();

  // Fetch data in parallel
  const [users, rounds] = await Promise.all([getAllUsers(), getScheduleRounds()]);

  // Priority: 1. URL Param, 2. Cookie Preference, 3. First User in DB
  const cookieUserId = cookieStore.get('NEXT_USER_ID')?.value;
  const userId =
    params?.userId ||
    (cookieUserId ? parseInt(cookieUserId) : users.length > 0 ? users[0].id : null);
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

  // Flatten all active players for the summary
  const allActivePlayers = schedule.found
    ? schedule.matches
        .flatMap((m) => m.user_players)
        // Sort by fantasy points descending globally for the summary
        .sort((a, b) => (b.puntos || 0) - (a.puntos || 0))
    : [];

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-12 pb-2 relative z-10">
        <div className="max-w-7xl mx-auto space-y-2">
          <h1 className="text-5xl md:text-6xl font-display mb-4 flex items-center gap-4">
            <span className="w-1.5 h-12 bg-gradient-to-b from-primary to-orange-400 rounded-full"></span>
            <span className="text-gradient">Alineaciones</span>
          </h1>
          <p className="text-muted-foreground text-lg w-full border-b border-border/50 pb-6">
            {schedule.found ? schedule.round.round_name : 'Selecciona una jornada'}
          </p>

          <div className="pt-4 flex flex-col lg:flex-row gap-6 items-stretch">
            <div className="w-full lg:max-w-md shrink-0">
              <ScheduleControls
                users={users}
                rounds={rounds}
                activeUserId={userId}
                activeRoundId={schedule.found ? schedule.round.round_id : null}
              />
            </div>

            {/* Summary Section */}
            {allActivePlayers.length > 0 && (
              <div className="w-full lg:flex-1 min-w-0">
                <RoundSummary players={allActivePlayers} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {schedule.found ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {Object.entries(groupedMatches).map(([dateKey, matches], index) => (
            <Section
              key={dateKey}
              title={dateKey}
              background={index % 2 === 0 ? 'section-base' : 'section-raised'}
              delay={index * 100}
            >
              <div className="grid gap-2">
                {matches.map((match) => (
                  <MatchCard key={match.match_id} match={match} />
                ))}
              </div>
            </Section>
          ))}

          {Object.keys(groupedMatches).length === 0 && (
            <div className="py-20 text-center text-zinc-500">
              No hay partidos programados para esta fecha.
            </div>
          )}
        </div>
      ) : (
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center justify-center py-32 text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
            <AlertCircle size={40} className="mb-4 text-zinc-600" />
            <p className="font-medium text-zinc-400">{schedule.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
