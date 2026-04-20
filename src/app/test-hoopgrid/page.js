'use client';

import {
  HOOPGRID_TEAMS,
  HOOPGRID_POSITIONS,
  HOOPGRID_STATS,
  HOOPGRID_COUNTRIES,
  HOOPGRID_MARKET,
  HOOPGRID_OWNERSHIP,
  HOOPGRID_USER_OWNERSHIP,
  HOOPGRID_HEIGHT,
  HOOPGRID_AGE,
} from '@/lib/constants/hoopgridCriteria';

export default function TestHoopgridPage() {
  return (
    <div className="min-h-screen bg-background p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-display text-primary mb-2 uppercase tracking-tighter">
            Hoopgrid Criteria Library
          </h1>
          <p className="text-muted-foreground">
            This is a list of all possible criteria that can be randomly selected for the daily
            Euroleague Hoopgrid.
          </p>
        </div>

        {/* 1. Teams */}
        <section>
          <h2 className="text-xl font-display text-foreground border-b border-border pb-2 mb-4 uppercase tracking-widest">
            Teams ({HOOPGRID_TEAMS.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {HOOPGRID_TEAMS.map((team) => (
              <div key={team.id} className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <span className="text-primary font-bold mr-2 text-[10px] opacity-50">
                  {team.id}
                </span>
                <span className="font-medium">{team.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Positions */}
        <section>
          <h2 className="text-xl font-display text-foreground border-b border-border pb-2 mb-4 uppercase tracking-widest">
            Positions ({HOOPGRID_POSITIONS.length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {HOOPGRID_POSITIONS.map((pos) => (
              <div
                key={pos.value}
                className="bg-card p-4 rounded-xl border border-border shadow-sm text-center"
              >
                <span className="font-medium">{pos.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Countries */}
        <section>
          <h2 className="text-xl font-display text-foreground border-b border-border pb-2 mb-4 uppercase tracking-widest">
            Countries ({HOOPGRID_COUNTRIES.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {HOOPGRID_COUNTRIES.map((c) => (
              <div
                key={c.value}
                className="bg-card p-4 rounded-xl border border-border shadow-sm text-center"
              >
                <span className="font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Stats */}
        <section>
          <h2 className="text-xl font-display text-foreground border-b border-border pb-2 mb-4 uppercase tracking-widest">
            Statistical Achievements ({HOOPGRID_STATS.length})
          </h2>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
              {/* Averages */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-primary uppercase">Average (Media)</h4>
                {HOOPGRID_STATS.filter((s) => s.type === 'stat_avg' || s.type === 'percentage').map(
                  (s, i) => (
                    <div
                      key={i}
                      className="bg-primary/5 border border-primary/20 p-3 rounded-lg flex flex-col"
                    >
                      <span className="font-bold text-sm">{s.label}</span>
                      <span className="text-[9px] opacity-40 font-mono mt-1">{s.type}</span>
                    </div>
                  )
                )}
              </div>

              {/* Single Game */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-secondary uppercase">
                  Peak (1 Partido)
                </h4>
                {HOOPGRID_STATS.filter(
                  (s) => s.type === 'stat_single' || s.type === 'double_double'
                ).map((s, i) => (
                  <div
                    key={i}
                    className="bg-secondary/5 border border-secondary/20 p-3 rounded-lg flex flex-col"
                  >
                    <span className="font-bold text-sm">{s.label}</span>
                    <span className="text-[9px] opacity-40 font-mono mt-1">{s.type}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-foreground uppercase">
                  Accumulated (Total)
                </h4>
                {HOOPGRID_STATS.filter((s) => s.type === 'stat_total').map((s, i) => (
                  <div
                    key={i}
                    className="bg-muted border border-border p-3 rounded-lg flex flex-col"
                  >
                    <span className="font-bold text-sm">{s.label}</span>
                    <span className="text-[9px] opacity-40 font-mono mt-1">{s.type}</span>
                  </div>
                ))}
              </div>

              {/* Market */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-orange-500 uppercase">Market & Price</h4>
                {HOOPGRID_MARKET.map((s, i) => (
                  <div
                    key={i}
                    className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-lg flex flex-col"
                  >
                    <span className="font-bold text-sm">{s.label}</span>
                    <span className="text-[9px] opacity-40 font-mono mt-1">{s.type}</span>
                  </div>
                ))}
              </div>

              {/* Ownership */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-emerald-500 uppercase">Ownership</h4>
                {HOOPGRID_OWNERSHIP.map((s, i) => (
                  <div
                    key={i}
                    className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg flex flex-col"
                  >
                    <span className="font-bold text-sm">{s.label}</span>
                    <span className="text-[9px] opacity-40 font-mono mt-1">{s.type}</span>
                  </div>
                ))}
              </div>

              {/* User Ownership */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-blue-500 uppercase">Manager History</h4>
                {HOOPGRID_USER_OWNERSHIP.map((s, i) => (
                  <div
                    key={i}
                    className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg flex flex-col"
                  >
                    <span className="font-bold text-sm">{s.label}</span>
                    <span className="text-[9px] opacity-40 font-mono mt-1">{s.type}</span>
                  </div>
                ))}
              </div>

              {/* Height */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-indigo-500 uppercase">
                  Height (Altura)
                </h4>
                {HOOPGRID_HEIGHT.map((s, i) => (
                  <div
                    key={i}
                    className="bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-lg flex flex-col"
                  >
                    <span className="font-bold text-sm">{s.label}</span>
                    <span className="text-[9px] opacity-40 font-mono mt-1">{s.type}</span>
                  </div>
                ))}
              </div>

              {/* Age */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-rose-500 uppercase">Age (Edad)</h4>
                {HOOPGRID_AGE.map((s, i) => (
                  <div
                    key={i}
                    className="bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg flex flex-col"
                  >
                    <span className="font-bold text-sm">{s.label}</span>
                    <span className="text-[9px] opacity-40 font-mono mt-1">{s.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-10 border-t border-border text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            These parameters are combined to form a 3x3 matrix in <code>hoopgridService.ts</code>
          </p>
        </footer>
      </div>
    </div>
  );
}
