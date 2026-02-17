import { Calendar, User } from 'lucide-react';

export default function TournamentFixtures({ fixtures }) {
  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">No hay partidos disponibles.</div>
    );
  }

  return (
    <div className="grid gap-3">
      {fixtures.map((fixture) => {
        const isFinished =
          fixture.status === 'finished' ||
          (fixture.home_score !== null && fixture.away_score !== null);

        return (
          <div
            key={fixture.id}
            className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
          >
            {/* Round Info */}
            <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 mb-3 sm:mb-0 min-w-[100px]">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {fixture.round_name}
              </span>
              {fixture.group_name && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  Grupo {fixture.group_name}
                </span>
              )}
            </div>

            {/* Matchup */}
            <div className="flex items-center flex-1 justify-center gap-4 sm:gap-8 w-full sm:w-auto">
              {/* Home Team */}
              <div className="flex-1 flex flex-col items-center sm:items-end gap-2 text-center sm:text-right">
                <div className="sm:hidden font-medium text-sm truncate w-full">
                  {fixture.home_user_name}
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block font-medium text-sm">
                    {fixture.home_user_name}
                  </span>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-secondary border border-white/10 shrink-0">
                    {fixture.home_user_icon ? (
                      <img
                        src={
                          fixture.home_user_icon.startsWith('http')
                            ? fixture.home_user_icon
                            : `https://cdn.biwenger.com/${fixture.home_user_icon}`
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Score */}
              <div
                className={`px-4 py-1.5 rounded-lg text-lg font-bold font-mono tracking-widest ${isFinished ? 'bg-secondary/50 text-foreground' : 'bg-secondary/20 text-muted-foreground'}`}
              >
                {fixture.home_score ?? '-'} : {fixture.away_score ?? '-'}
              </div>

              {/* Away Team */}
              <div className="flex-1 flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
                <div className="sm:hidden font-medium text-sm truncate w-full">
                  {fixture.away_user_name}
                </div>
                <div className="flex items-center gap-3 flex-row-reverse sm:flex-row">
                  <span className="hidden sm:block font-medium text-sm">
                    {fixture.away_user_name}
                  </span>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-secondary border border-white/10 shrink-0">
                    {fixture.away_user_icon ? (
                      <img
                        src={
                          fixture.away_user_icon.startsWith('http')
                            ? fixture.away_user_icon
                            : `https://cdn.biwenger.com/${fixture.away_user_icon}`
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Date/Status (Right side on desktop) */}
            <div className="hidden sm:flex flex-col items-end min-w-[100px] text-right">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${isFinished ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}
              >
                {isFinished ? 'Finalizado' : 'Pendiente'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
