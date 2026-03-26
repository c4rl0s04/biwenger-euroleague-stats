'use client';

import { useMemo } from 'react';
import { User, Award, Shield, Users, TrendingUp } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function SquadInsightsSection({ initialPlayers = [] }) {
  // --- DATA AGGREGATION ---
  const { squads, globalTeams } = useMemo(() => {
    const ownedPlayers = initialPlayers.filter((p) => p.owner_id && p.owner_id !== 0);
    const squadMap = {};
    const teamCounts = {};

    ownedPlayers.forEach((p) => {
      // Global Team counting
      if (p.team_id) {
        if (!teamCounts[p.team_id]) {
          teamCounts[p.team_id] = {
            id: p.team_id,
            name: p.team_name,
            img: p.team_img,
            count: 0,
          };
        }
        teamCounts[p.team_id].count++;
      }

      // Squad grouping
      if (!squadMap[p.owner_id]) {
        squadMap[p.owner_id] = {
          id: p.owner_id,
          name: p.owner_name,
          players: [],
          positions: { Base: 0, Alero: 0, Pivot: 0 },
          mvp: null,
          loyalty: {},
        };
      }

      const s = squadMap[p.owner_id];
      s.players.push(p);

      // Position count
      if (s.positions[p.position] !== undefined) {
        s.positions[p.position]++;
      }

      // MVP check
      if (!s.mvp || p.total_points > s.mvp.total_points) {
        s.mvp = p;
      }

      // Loyalty check (Euroleague team)
      if (p.team_id) {
        if (!s.loyalty[p.team_id]) {
          s.loyalty[p.team_id] = {
            name: p.team_name,
            img: p.team_img,
            count: 0,
          };
        }
        s.loyalty[p.team_id].count++;
      }
    });

    // Finalize Loyalty (Pick top team per manager)
    Object.values(squadMap).forEach((s) => {
      let topTeam = null;
      Object.values(s.loyalty).forEach((lt) => {
        if (!topTeam || lt.count > topTeam.count) {
          topTeam = lt;
        }
      });
      s.favTeam = topTeam;
    });

    return {
      squads: Object.values(squadMap).sort((a, b) => b.players.length - a.players.length),
      globalTeams: Object.values(teamCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }, [initialPlayers]);

  if (!squads.length) return null;

  return (
    <div className="space-y-8 mt-4">
      {/* 1. Global Influence Header */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <ElegantCard className="lg:col-span-1 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Global</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Top Canteras EL
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {globalTeams.map((t, idx) => (
              <div key={t.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-3">{idx + 1}</span>
                  <img src={t.img} alt={t.name} className="w-5 h-5 object-contain" />
                  <span className="font-medium truncate max-w-[100px]">{t.name}</span>
                </div>
                <span className="font-black text-primary">{t.count}</span>
              </div>
            ))}
          </div>
        </ElegantCard>

        {/* Dynamic Context Description */}
        <div className="lg:col-span-3 flex flex-col justify-center px-4 border-l border-border/50">
          <h2 className="text-xl font-black uppercase tracking-tighter text-foreground mb-2">
            Análisis de Composición <span className="text-primary">Tactical Squads</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Explora la estructura interna de cada plantilla. Desde el equilibrio de posiciones
            (bases vs pívots) hasta las lealtades hacia clubes específicos de la Euroleague.
            Descubre quién tiene el MVP más determinante y qué equipo real es el gran proveedor de
            talento para nuestra liga.
          </p>
        </div>
      </div>

      {/* 2. Manager Insight Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {squads.map((squad) => (
          <ElegantCard key={squad.id} hideHeader padding="p-0" className="overflow-hidden group">
            {/* Header / Manager Name */}
            <div className="bg-secondary/50 p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <User size={20} />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-wider text-sm">{squad.name}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    {squad.players.length} Jugadores
                  </p>
                </div>
              </div>
              <Shield
                className="text-muted-foreground/30 group-hover:text-primary/50 transition-colors"
                size={24}
              />
            </div>

            <div className="p-5 space-y-6">
              {/* ADN - Position Distribution */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    ADN Plantilla
                  </span>
                  <div className="flex gap-2">
                    {['Base', 'Alero', 'Pivot'].map((pos) => (
                      <span
                        key={pos}
                        className="text-[9px] font-black uppercase text-muted-foreground/60"
                      >
                        {pos.slice(0, 1)}: {squad.positions[pos]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary w-full">
                  <div
                    title={`${squad.positions.Base} Bases`}
                    style={{ width: `${(squad.positions.Base / squad.players.length) * 100}%` }}
                    className="bg-blue-500/80 h-full border-r border-background"
                  />
                  <div
                    title={`${squad.positions.Alero} Aleros`}
                    style={{ width: `${(squad.positions.Alero / squad.players.length) * 100}%` }}
                    className="bg-orange-500/80 h-full border-r border-background"
                  />
                  <div
                    title={`${squad.positions.Pivot} Pívots`}
                    style={{ width: `${(squad.positions.Pivot / squad.players.length) * 100}%` }}
                    className="bg-green-500/80 h-full"
                  />
                </div>
              </div>

              {/* MVP Section */}
              {squad.mvp && (
                <div className="bg-background/40 rounded-xl p-3 border border-border/50 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={squad.mvp.img}
                      alt={squad.mvp.name}
                      className="w-12 h-12 rounded-lg object-cover bg-secondary"
                    />
                    <div className="absolute -top-1 -right-1 bg-primary text-[8px] font-black text-white px-1 rounded shadow-sm">
                      MVP
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-black text-xs uppercase truncate">{squad.mvp.name}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <img src={squad.mvp.team_img} className="w-3 h-3 object-contain opacity-70" />
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        {squad.mvp.team_name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Puntos</p>
                    <p className="text-sm font-black text-primary">{squad.mvp.total_points}</p>
                  </div>
                </div>
              )}

              {/* Loyalty / Team Bias */}
              {squad.favTeam && (
                <div className="flex items-center justify-between pt-2 border-t border-border/10">
                  <div className="flex items-center gap-2">
                    <Users className="text-muted-foreground" size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Nacionalidad EL
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/30 px-2 py-1 rounded-md border border-border/30">
                    <img src={squad.favTeam.img} className="w-4 h-4 object-contain" />
                    <span className="text-[10px] font-bold uppercase truncate max-w-[80px]">
                      {squad.favTeam.name}
                    </span>
                    <span className="text-[10px] font-black bg-background/50 px-1 rounded text-primary">
                      {squad.favTeam.count}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ElegantCard>
        ))}
      </div>
    </div>
  );
}
