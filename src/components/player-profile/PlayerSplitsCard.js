'use client';

import { useMemo } from 'react';
import { ElegantCard } from '@/components/ui';
import { Split, Trophy, Home, Plane, Swords } from 'lucide-react';

// Consistent colors with PlayerPointsGraph
const HOME_COLOR = '#60a5fa'; // blue-400
const AWAY_COLOR = '#a78bfa'; // violet-400
const WIN_COLOR = '#0aab4a'; // emerald-500 base
const LOSS_COLOR = '#b4081c'; // dark rose/red base

const SplitSection = ({
  title,
  icon: Icon,
  leftLabel,
  rightLabel,
  leftVal,
  rightVal,
  leftColor,
  rightColor,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  titleColor,
}) => {
  const total = leftVal + rightVal;
  const leftWidth = total > 0 ? (leftVal / total) * 100 : 50;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color: titleColor }} />
        <h4
          className="text-[12px] font-black uppercase tracking-[0.2em]"
          style={{ color: titleColor }}
        >
          {title}
        </h4>
      </div>

      {/* Visual Bar */}
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden flex shadow-inner">
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{ width: `${leftWidth}%`, backgroundColor: leftColor }}
        />
        <div
          className="h-full transition-all duration-1000 ease-out flex-1"
          style={{ backgroundColor: rightColor }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Stat */}
        <div className="group relative overflow-hidden bg-white/[0.03] border border-white/5 p-4 rounded-xl hover:bg-white/[0.06] transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
              {leftLabel}
            </span>
            <LeftIcon
              className="w-4 h-4 transition-transform group-hover:scale-110"
              style={{ color: leftColor }}
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tabular-nums">{leftVal}</span>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">
              PTS/P
            </span>
          </div>
        </div>

        {/* Right Stat */}
        <div className="group relative overflow-hidden bg-white/[0.03] border border-white/5 p-4 rounded-xl hover:bg-white/[0.06] transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
              {rightLabel}
            </span>
            <RightIcon
              className="w-4 h-4 transition-transform group-hover:scale-110"
              style={{ color: rightColor }}
            />
          </div>
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-2xl font-black text-white tabular-nums">{rightVal}</span>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">
              PTS/P
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PlayerSplitsCard({ matches, playerTeam }) {
  const splits = useMemo(() => {
    if (!matches || matches.length === 0 || !playerTeam) return null;

    const stats = {
      home: { points: 0, games: 0 },
      away: { points: 0, games: 0 },
      win: { points: 0, games: 0 },
      loss: { points: 0, games: 0 },
    };

    matches.forEach((m) => {
      const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      const homeNorm = normalize(m.home_team);
      const playerNorm = normalize(playerTeam);

      const isHome =
        homeNorm &&
        playerNorm &&
        (homeNorm === playerNorm || homeNorm.includes(playerNorm) || playerNorm.includes(homeNorm));

      // SKIP DNP (Did Not Play)
      if (m.fantasy_points === null) return;

      const points = m.fantasy_points || 0;

      if (isHome) {
        stats.home.points += points;
        stats.home.games++;
      } else {
        stats.away.points += points;
        stats.away.games++;
      }

      if (m.home_score !== null && m.away_score !== null) {
        const homeScore = parseInt(m.home_score);
        const awayScore = parseInt(m.away_score);

        let won = false;
        if (isHome && homeScore > awayScore) won = true;
        if (!isHome && awayScore > homeScore) won = true;

        if (won) {
          stats.win.points += points;
          stats.win.games++;
        } else {
          stats.loss.points += points;
          stats.loss.games++;
        }
      }
    });

    const calcAvg = (set) => (set.games > 0 ? parseFloat((set.points / set.games).toFixed(1)) : 0);

    return {
      home: calcAvg(stats.home),
      away: calcAvg(stats.away),
      win: calcAvg(stats.win),
      loss: calcAvg(stats.loss),
      games: stats,
    };
  }, [matches, playerTeam]);

  if (!splits) return null;

  return (
    <ElegantCard title="RENDIMIENTO POR CONTEXTO" icon={Split}>
      <div className="space-y-10 pt-2">
        <SplitSection
          title="LOCALIZACIÓN"
          icon={Swords}
          leftLabel="CASA"
          rightLabel="FUERA"
          leftVal={splits.home}
          rightVal={splits.away}
          leftColor={HOME_COLOR}
          rightColor={AWAY_COLOR}
          leftIcon={Home}
          rightIcon={Plane}
          titleColor={HOME_COLOR}
        />

        <SplitSection
          title="RESULTADO EQUIPO"
          icon={Trophy}
          leftLabel="VICTORIA"
          rightLabel="DERROTA"
          leftVal={splits.win}
          rightVal={splits.loss}
          leftColor={WIN_COLOR}
          rightColor={LOSS_COLOR}
          leftIcon={Trophy}
          rightIcon={Swords}
          titleColor="#34d399"
        />
      </div>
    </ElegantCard>
  );
}
